// @ts-nocheck
// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
import { NextRequest, NextResponse } from 'next/server';
import { parseJiraFile } from '@/services/jira/parser';
import { validateIssueData } from '@/services/jira/validation';
import { calculateDashboardMetrics } from '@/services/metrics/metrics.service';
import { appendImportLog, buildImportLog } from '@/services/imports/importLogs.service';

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

  // --- Metrics + log ---
  try {
    const metrics = calculateDashboardMetrics(issues);
    const importLog = appendImportLog(
      buildImportLog({
        file: fileArg,
        parseResult,
        validation,
        metrics,
        status: 'success',
      }),
    );

    return NextResponse.json({ metrics, warnings, importLog });
  } catch (error) {
    console.error('[upload] processing error:', error);

    appendImportLog(
      buildImportLog({
        file: fileArg,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      }),
    );

    return NextResponse.json({ error: 'Unable to process Jira export file.' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
