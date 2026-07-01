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
import { getServerEnv } from '@/lib/env/server';

// ---------------------------------------------------------------------------
// DB-backed rate limiter — 20 uploads per 15 minutes per user (P0A-02)
// Replaces the in-memory Map which reset on every Render cold start.
// Reuses LoginAttempt table with "ul:" prefix to distinguish upload attempts.
// ---------------------------------------------------------------------------
async function checkUploadRateLimit(userId: string): Promise<{ limited: boolean; retryAfterSeconds: number }> {
  const key         = `ul:${userId}`;
  const WINDOW_MS   = 15 * 60_000;
  const windowStart = new Date(Date.now() - WINDOW_MS);
  const prunePoint  = new Date(Date.now() - 60 * 60_000);

  const [attempts] = await Promise.all([
    prisma.loginAttempt.findMany({
      where:   { ip: key, attemptedAt: { gte: windowStart } },
      orderBy: { attemptedAt: 'asc' },
      select:  { attemptedAt: true },
    }),
    prisma.loginAttempt.deleteMany({ where: { ip: key, attemptedAt: { lt: prunePoint } } }),
  ]);

  if (attempts.length >= 20) {
    const earliest          = attempts[0].attemptedAt.getTime();
    const retryAfterSeconds = Math.ceil(Math.max((earliest + WINDOW_MS) - Date.now(), 1) / 1000);
    return { limited: true, retryAfterSeconds };
  }
  await prisma.loginAttempt.create({ data: { ip: key } });
  return { limited: false, retryAfterSeconds: 0 };
}

// ---------------------------------------------------------------------------
// File validation helpers
// ---------------------------------------------------------------------------
const ALLOWED_EXTENSIONS = ['.csv', '.xlsx', '.xls'];

function getExtension(filename: string): string {
  return filename.slice(filename.lastIndexOf('.')).toLowerCase();
}

// ---------------------------------------------------------------------------
// POST /api/upload
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest): Promise<NextResponse> {
  const { MAX_UPLOAD_MB } = getServerEnv();
  const maxFileSizeBytes = MAX_UPLOAD_MB * 1024 * 1024;

  // --- Auth first (P0A-02/P0A-04): reject unauthenticated before touching the body ---
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }
  const userId = session.userId;

  // --- DB-backed rate limit by userId (20 uploads / 15 min, survives cold starts) ---
  const { limited, retryAfterSeconds } = await checkUploadRateLimit(userId);
  if (limited) {
    const mins = Math.floor(retryAfterSeconds / 60);
    const secs = retryAfterSeconds % 60;
    const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    return NextResponse.json(
      { error: `Too many uploads. Try again in ${timeStr}.`, retryAfterSeconds },
      { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } },
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
  if (file.size > maxFileSizeBytes) {
    return NextResponse.json(
      {
        error:
          `File exceeds the ${MAX_UPLOAD_MB} MB size limit. Export a smaller date range or reduce the number of columns.`,
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
