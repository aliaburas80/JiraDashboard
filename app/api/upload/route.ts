// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
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
import { markPendingPush } from '@/services/storage/cloudSync';
import { getUserStorageProviderStatus, getVerifiedUserStorageProviderInstance } from '@/services/storage/userStorageProvider.service';
import { getServerEnv } from '@/lib/env/server';
import { getWorkspaceForUser } from '@/lib/workspace';
import { validateFileSignature } from '@/lib/fileSignature';
import {
  checkUploadEntitlement,
  beginUploadEntitlement,
  consumeEntitlement,
  revertEntitlement,
} from '@/lib/entitlement';
import { logServerEvent } from '@/lib/logger';

// TEMPORARY (QA-GATE-09 bug 5 diagnosis): the first upload in a fresh CI run
// never completes and appears to wedge the whole server for every request
// after it. Bracketing every awaited step to find which one never returns —
// remove once found, or fold into permanent P0A-09 perf instrumentation if
// it proves generally useful.
function markStep(reqId: string, step: string, t0: number): void {
  logServerEvent('info', 'upload.step', { reqId, step, elapsedMs: Date.now() - t0 });
}

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
  const reqId = Math.random().toString(36).slice(2, 8);
  const t0 = Date.now();
  markStep(reqId, 'start', t0);
  const { MAX_UPLOAD_MB } = getServerEnv();
  const maxFileSizeBytes = MAX_UPLOAD_MB * 1024 * 1024;

  // --- Auth first (P0A-02/P0A-04): reject unauthenticated before touching the body ---
  const session = await getIronSession<SessionData>(await cookies(), SESSION_OPTIONS);
  markStep(reqId, 'session-resolved', t0);
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }
  const userId = session.userId;

  // EP-011: email must be verified before uploads are allowed.
  if (session.emailVerified === false) {
    return NextResponse.json(
      { error: 'Please verify your email address before uploading. Check your inbox for the verification link.' },
      { status: 403 },
    );
  }

  // EP-024: cloud-mode users may optionally point uploads at their own cloud
  // bucket instead of App storage — a saved-but-unverified provider blocks
  // uploads rather than silently falling back to App storage, per explicit
  // product decision (never guess where "cloud" data should land).
  const storageProviderStatus = await getUserStorageProviderStatus(userId);
  markStep(reqId, 'storage-provider-status-resolved', t0);
  if (storageProviderStatus === 'unverified') {
    return NextResponse.json(
      {
        error: 'Your cloud storage provider is configured but not yet verified. Go to Settings → Storage and click "Test connection," or remove it to use App storage instead.',
      },
      { status: 409 },
    );
  }

  // EP-015: check trial entitlement before touching the file.
  // Admins bypass — they can always upload.
  const isAdmin = session.role === 'admin';
  const entCheck = await checkUploadEntitlement(userId, isAdmin);
  markStep(reqId, 'entitlement-checked', t0);
  if (!entCheck.allowed) {
    return NextResponse.json({ error: entCheck.message, reason: entCheck.reason }, { status: 403 });
  }

  // Mark entitlement as 'processing' (optimistic lock — prevents duplicate submissions).
  // Admins skip this step.
  if (!isAdmin) {
    const locked = await beginUploadEntitlement(userId);
    if (!locked) {
      return NextResponse.json(
        { error: 'An upload is already in progress. Please wait a moment and try again.' },
        { status: 409 },
      );
    }
  }

  // --- DB-backed rate limit by userId (20 uploads / 15 min, survives cold starts) ---
  const { limited, retryAfterSeconds } = await checkUploadRateLimit(userId);
  markStep(reqId, 'upload-rate-limit-checked', t0);
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
    markStep(reqId, 'form-data-parsed', t0);
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

  // --- Content-signature sanity check (SEC, 2026-07-18) ---
  // Defense-in-depth ahead of parseJiraFile()'s own XLSX.read() content
  // sniffing (docs/product-audit/10-technical-cleanup.md Part 1 finding 3):
  // catches an obviously-spoofed extension (e.g. a binary/garbage file
  // renamed to .xlsx) with a clear message here, before it reaches the
  // parser. Deliberately lenient for .xls/.csv — see src/lib/fileSignature.ts
  // for why a strict OLE-only .xls check would reject real Jira exports.
  const signatureError = validateFileSignature(buffer, ext);
  markStep(reqId, 'file-signature-validated', t0);
  if (signatureError) {
    if (!isAdmin) await revertEntitlement(userId);
    return NextResponse.json({ error: signatureError }, { status: 400 });
  }

  // --- Parse ---
  let parseResult: ReturnType<typeof parseJiraFile>;
  try {
    parseResult = parseJiraFile(fileArg);
    markStep(reqId, 'file-parsed', t0);
  } catch (err) {
    // Parse failed — revert entitlement so user can try again
    if (!isAdmin) await revertEntitlement(userId);
    const message = err instanceof Error ? err.message : 'Unable to process Jira export file.';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { issues, warnings } = parseResult;

  // --- Validate ---
  const validation = validateIssueData(issues);
  markStep(reqId, 'issues-validated', t0);

  if (!validation.isValid) {
    // EP-015: validation failure does NOT consume entitlement — revert to eligible
    if (!isAdmin) await revertEntitlement(userId);
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
    markStep(reqId, 'metrics-calculated', t0);
    // EP-020: resolve the caller's workspace/user scope before writing the
    // live dashboard file — this is what keeps one cloud-mode user's upload
    // from ever overwriting another's dashboard. Reused below for the
    // ImportLog's workspaceId, so resolved once rather than via the shared
    // getMetricsScopeKeyForUser helper (which would re-query it).
    const workspace = await getWorkspaceForUser(userId).catch(() => null);
    markStep(reqId, 'workspace-resolved', t0);
    const scopeKey   = workspace ? `ws:${workspace.id}` : `user:${userId}`;
    writeLatestMetrics(scopeKey, metrics, { source: 'file' });
    markStep(reqId, 'latest-metrics-written', t0);
    // Mark pending synchronously, before the response even goes out — closes
    // the race where a near-immediate GET /api/metrics/latest (the dashboard
    // reloading right after this upload) could trigger a cloud restore that
    // overwrites this fresh write with an older bucket backup before the
    // non-blocking pushToCloud() below has finished pushing it.
    markPendingPush();
    markStep(reqId, 'pending-push-marked', t0);

    // EP-024: verified users additionally get a durable copy pushed to their
    // own bucket — non-blocking, same pattern as the existing pushToCloud()
    // calls below. Never blocks or fails the upload response.
    if (storageProviderStatus === 'verified') {
      getVerifiedUserStorageProviderInstance(userId)
        .then(provider => provider?.upload('delivery-clarity-metrics.json', JSON.stringify(metrics)))
        .catch(() => {});
    }

    const importLog = appendImportLog(
      buildImportLog({ file: fileArg, parseResult, validation, metrics, status: 'success' }),
    );
    markStep(reqId, 'import-log-appended', t0);

    // Save to DB if user is logged in — EP-015: consume entitlement atomically with ImportLog
    if (userId) {
      const flow = (metrics.flow ?? {}) as any;
      const releaseConfidenceScore = computeReleaseConfidence({
        completionRate: metrics.completionRate  ?? 0,
        blockedIssues:  metrics.blockedIssues   ?? 0,
        criticalCount:  flow.critical           ?? 0,
        openDefects:    metrics.openDefects     ?? 0,
        totalIssues:    metrics.totalIssues     ?? 0,
      });

      // EP-015: ImportLog creation and entitlement consumption are one atomic transaction.
      // Entitlement is consumed ONLY after the ImportLog is committed — never on failure.
      await prisma.$transaction(async (tx) => {
        const log = await tx.importLog.create({ data: {
          userId,
          workspaceId:     workspace?.id ?? null,
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
        }});

        // Consume entitlement atomically — links entitlement to this ImportLog
        if (!isAdmin) await consumeEntitlement(tx, userId, log.id);
      }).catch(() => {});
      markStep(reqId, 'import-log-transaction-settled', t0);

      // Push-on-change: sync new data to cloud immediately (non-blocking)
      import('@/services/storage/cloudSync')
        .then(({ pushToCloud }) => pushToCloud())
        .catch(() => {}); // never block the upload response
    }

    // Warn when items are capped due to large export
    if ((metrics.flow as any).itemsCapped) {
      warnings.push(`Large export: ${(metrics.flow as any).totalItemCount?.toLocaleString()} items detected. Dashboard shows top 5,000 highest-risk items. All aggregate metrics are accurate.`);
    }
    markStep(reqId, 'responding', t0);
    return NextResponse.json({ metrics, warnings, importLog, columnMapping: parseResult.columnMapping });
  } catch (error) {
    // EP-015: server error — revert entitlement so user can retry
    if (!isAdmin) await revertEntitlement(userId).catch(() => {});
    appendImportLog(
      buildImportLog({ file: fileArg, status: 'failed', error: error instanceof Error ? error.message : String(error) }),
    );
    return NextResponse.json({ error: 'Unable to process Jira export file.' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
