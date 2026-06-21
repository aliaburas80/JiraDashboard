// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
import { NextRequest, NextResponse } from 'next/server';
import { parseJiraFile } from '@/services/jira/parser';
import { validateIssueData } from '@/services/jira/validation';
import { calculateDashboardMetrics } from '@/services/metrics/metrics.service';
import { appendImportLog, buildImportLog } from '@/services/imports/importLogs.service';
import { computeReleaseConfidence } from '@/lib/releaseConfidence';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { writeLatestMetrics } from '@/services/metrics/latestMetricsStorage';

// ---------------------------------------------------------------------------
// Simple in-process rate limiter — 20 uploads per 15 minutes per IP
// ---------------------------------------------------------------------------
const RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_MAX = 20;
const ipTimestamps = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const cutoff = now - RATE_WINDOW_MS;
  const timestamps = (ipTimestamps.get(ip) ?? []).filter((t) => t > cutoff);
  if (timestamps.length >= RATE_MAX) return true;
  timestamps.push(now);
  ipTimestamps.set(ip, timestamps);
  return false;
}

// ---------------------------------------------------------------------------
// File validation helpers
// ---------------------------------------------------------------------------
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const ALLOWED_EXTENSIONS = ['.csv', '.xlsx', '.xls'];

function getExtension(filename: string): string {
  return filename.slice(filename.lastIndexOf('.')).toLowerCase();
}

// ---------------------------------------------------------------------------
// POST /api/upload
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest): Promise<NextResponse> {
  // --- Rate limiting ---
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many uploads from this IP. Please wait 15 minutes before trying again.' },
      { status: 429 },
    );
  }

  // --- Parse multipart form data ---
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid multipart form data.' }, { status: 400 });
  }

  const file = formData.get('file');

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json(
      { error: 'No file uploaded. Please upload a Jira Excel or CSV export.' },
      { status: 400 },
    );
  }

  // --- File type check ---
  const originalname = (file as File).name ?? 'upload';
  const ext = getExtension(originalname);

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json(
      {
        error: `Unsupported file type "${ext}". Upload a .csv, .xlsx, or .xls Jira export.`,
      },
      { status: 400 },
    );
  }

  // --- File size check ---
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      {
        error:
          'File exceeds the 20 MB size limit. Export a smaller date range or reduce the number of columns.',
      },
      { status: 413 },
    );
  }

  // --- Convert Blob to Buffer ---
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const fileArg = { buffer, originalname };

  // --- Parse ---
  let parseResult: ReturnType<typeof parseJiraFile>;
  try {
    parseResult = parseJiraFile(fileArg);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to process Jira export file.';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { issues, warnings } = parseResult;

  // --- Validate ---
  const validation = validateIssueData(issues);

  if (!validation.isValid) {
    const importLog = appendImportLog(
      buildImportLog({
        file: fileArg,
        parseResult,
        validation,
        status: 'validation_failed',
      }),
    );
    return NextResponse.json(
      { error: 'Validation failed', details: validation.errors, importLog },
      { status: 422 },
    );
  }

  // --- Get session user (optional — works without auth too) ---
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  const userId  = session.isLoggedIn ? session.userId : null;

  // --- Metrics + log ---
  try {
    const startTime = Date.now();
    const metrics   = calculateDashboardMetrics(issues);
    writeLatestMetrics(metrics, { source: 'file' });
    const importLog = appendImportLog(
      buildImportLog({ file: fileArg, parseResult, validation, metrics, status: 'success' }),
    );

    // Save to DB if user is logged in — include trend metrics in metadataJson
    if (userId) {
      const flow = (metrics.flow ?? {}) as any;
      const releaseConfidenceScore = computeReleaseConfidence({
        completionRate: metrics.completionRate  ?? 0,
        blockedIssues:  metrics.blockedIssues   ?? 0,
        criticalCount:  flow.critical           ?? 0,
        openDefects:    metrics.openDefects     ?? 0,
        totalIssues:    metrics.totalIssues     ?? 0,
      });
      await prisma.importLog.create({ data: {
        userId,
        fileName:        originalname,
        fileSize:        file.size,
        fileType:        ext.replace('.', ''),
        rowCount:        issues.length,
        status:          'success',
        warningsCount:   warnings.length,
        totalIssues:     metrics.totalIssues ?? 0,
        doneIssues:      metrics.doneIssues  ?? 0,
        healthScore:     metrics.healthScore ?? 0,
        processingTimeMs: Date.now() - startTime,
        metadataJson: JSON.stringify({
          completionRate:          metrics.completionRate       ?? 0,
          blockedIssues:           metrics.blockedIssues        ?? 0,
          activeIssues:            metrics.activeIssues         ?? 0,
          openDefects:             metrics.openDefects          ?? 0,
          avgLeadTimeDays:         flow.averageLeadTimeDays     ?? 0,
          avgCycleTimeDays:        flow.averageCycleTimeDays    ?? 0,
          criticalCount:           flow.critical               ?? 0,
          warningCount:            flow.warning                ?? 0,
          dataQualityScore:        metrics.dataQuality?.score  ?? null,
          avgSprintThroughput:     metrics.throughput?.sprint?.averageThroughputCount ?? null,
          trendDirection:          metrics.throughput?.sprint?.trendDirection ?? null,
          releaseConfidenceScore,
        }),
      }}).catch(() => {});

      // Push-on-change: sync new data to cloud immediately (non-blocking)
      import('@/services/storage/cloudSync')
        .then(({ pushToCloud }) => pushToCloud())
        .catch(() => {}); // never block the upload response
    }

    // Warn when items are capped due to large export
    if ((metrics.flow as any).itemsCapped) {
      warnings.push(`Large export: ${(metrics.flow as any).totalItemCount?.toLocaleString()} items detected. Dashboard shows top 5,000 highest-risk items. All aggregate metrics are accurate.`);
    }
    return NextResponse.json({ metrics, warnings, importLog, columnMapping: parseResult.columnMapping });
  } catch (error) {
    appendImportLog(
      buildImportLog({ file: fileArg, status: 'failed', error: error instanceof Error ? error.message : String(error) }),
    );
    return NextResponse.json({ error: 'Unable to process Jira export file.' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
