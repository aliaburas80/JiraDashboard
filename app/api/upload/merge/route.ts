// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// POST /api/upload/merge — accepts multiple Jira export files, merges
// raw issues by Issue Key, and returns unified DashboardMetrics.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { parseJiraFile } from '@/services/jira/parser';
import { validateIssueData } from '@/services/jira/validation';
import { calculateDashboardMetrics } from '@/services/metrics/metrics.service';
import { writeLatestMetrics } from '@/services/metrics/latestMetricsStorage';
import { markPendingPush } from '@/services/storage/cloudSync';
import { getWorkspaceForUser } from '@/lib/workspace';
import { mergeIssueArrays } from '@/lib/mergeIssues';
import { getUserStorageProviderStatus, getVerifiedUserStorageProviderInstance } from '@/services/storage/userStorageProvider.service';
import { validateFileSignature } from '@/lib/fileSignature';
import { prisma } from '@/lib/prisma';
import {
  checkUploadEntitlement,
  beginUploadEntitlement,
  consumeEntitlement,
  revertEntitlement,
  beginReplacementUpload,
  consumeReplacementUpload,
  revertReplacementUpload,
} from '@/lib/entitlement';

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_FILES     = 10;
const ALLOWED_EXT   = new Set(['.csv', '.xlsx', '.xls']);

function ext(name: string): string {
  return name.slice(name.lastIndexOf('.')).toLowerCase();
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // P0A-04: file upload and metrics writes are not public — require an active session.
  const session = await getIronSession<SessionData>(await cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }
  // EP-011: same block-if-unverified rule as the single-file upload route —
  // this route was left out of that pass.
  if (session.emailVerified === false) {
    return NextResponse.json(
      { error: 'Please verify your email address before uploading. Check your inbox for the verification link.' },
      { status: 403 },
    );
  }
  // EP-024: same block-if-unverified rule as the single-file upload route.
  const storageProviderStatus = await getUserStorageProviderStatus(session.userId);
  if (storageProviderStatus === 'unverified') {
    return NextResponse.json(
      {
        error: 'Your cloud storage provider is configured but not yet verified. Go to Settings → Storage and click "Test connection," or remove it to use App storage instead.',
      },
      { status: 409 },
    );
  }

  // EP-015: same trial-entitlement gate as the single-file upload route —
  // this route was left out of that pass, allowing a consumed/expired/
  // suspended non-admin user to bypass the trial gate entirely. A successful
  // merge counts as one successful free analysis, same as a single-file
  // upload — the master plan doesn't distinguish by upload mechanism.
  const isAdmin = session.role === 'admin';
  const entCheck = await checkUploadEntitlement(session.userId, isAdmin);
  if (!entCheck.allowed) {
    return NextResponse.json({ error: entCheck.message, reason: entCheck.reason }, { status: 403 });
  }
  const isReplacement = !isAdmin && entCheck.isReplacement === true;

  if (!isAdmin) {
    const locked = isReplacement ? await beginReplacementUpload(session.userId) : await beginUploadEntitlement(session.userId);
    if (!locked) {
      return NextResponse.json(
        { error: 'An upload is already in progress. Please wait a moment and try again.' },
        { status: 409 },
      );
    }
  }

  let formData: FormData;
  try { formData = await req.formData(); } catch {
    // P0B-02: every early return after the entitlement lock must revert it —
    // a stuck 'processing' self-heals after 10 minutes, but a stuck
    // replacementUsedAt has no such recovery (it permanently forecloses the
    // one-time replacement grant), so this can't be left to self-heal.
    if (!isAdmin) await (isReplacement ? revertReplacementUpload(session.userId) : revertEntitlement(session.userId));
    return NextResponse.json({ error: 'Invalid multipart form data.' }, { status: 400 });
  }

  // Collect all files (field names: file_0, file_1, … or just "file" multiple times)
  const blobs: Blob[] = [];
  for (const [, value] of formData.entries()) {
    if (value instanceof Blob) blobs.push(value);
  }

  if (!blobs.length) {
    if (!isAdmin) await (isReplacement ? revertReplacementUpload(session.userId) : revertEntitlement(session.userId));
    return NextResponse.json({ error: 'No files uploaded.' }, { status: 400 });
  }
  if (blobs.length > MAX_FILES) {
    if (!isAdmin) await (isReplacement ? revertReplacementUpload(session.userId) : revertEntitlement(session.userId));
    return NextResponse.json({ error: `Maximum ${MAX_FILES} files allowed.` }, { status: 400 });
  }

  const allIssueArrays: Record<string, unknown>[][] = [];
  const fileWarnings: string[] = [];

  for (let i = 0; i < blobs.length; i++) {
    const blob = blobs[i];
    const name = (blob as File).name ?? `file_${i}`;

    if (!ALLOWED_EXT.has(ext(name))) {
      if (!isAdmin) await (isReplacement ? revertReplacementUpload(session.userId) : revertEntitlement(session.userId));
      return NextResponse.json({ error: `File "${name}" is not a supported format.` }, { status: 400 });
    }
    if (blob.size > MAX_FILE_SIZE) {
      if (!isAdmin) await (isReplacement ? revertReplacementUpload(session.userId) : revertEntitlement(session.userId));
      return NextResponse.json({ error: `File "${name}" exceeds 20 MB.` }, { status: 400 });
    }

    const buffer = Buffer.from(await blob.arrayBuffer());

    // Content-signature sanity check (SEC, 2026-07-18) — same defense-in-depth
    // gate as the single-file upload route (app/api/upload/route.ts); this
    // route was left out of that pass. See src/lib/fileSignature.ts for why
    // it's deliberately lenient for .xls/.csv.
    const signatureError = validateFileSignature(buffer, ext(name));
    if (signatureError) {
      if (!isAdmin) await (isReplacement ? revertReplacementUpload(session.userId) : revertEntitlement(session.userId));
      return NextResponse.json({ error: `File "${name}": ${signatureError}` }, { status: 400 });
    }

    try {
      const { issues, warnings } = parseJiraFile({ buffer, originalname: name });
      const validation = validateIssueData(issues);
      if (!validation.isValid) {
        if (!isAdmin) await (isReplacement ? revertReplacementUpload(session.userId) : revertEntitlement(session.userId));
        return NextResponse.json({ error: `File "${name}" failed validation: ${validation.errors.join(', ')}` }, { status: 422 });
      }
      allIssueArrays.push(issues);
      fileWarnings.push(...warnings.map(w => `[${name}] ${w}`));
    } catch (err) {
      if (!isAdmin) await (isReplacement ? revertReplacementUpload(session.userId) : revertEntitlement(session.userId));
      const msg = err instanceof Error ? err.message : 'Parse error';
      return NextResponse.json({ error: `File "${name}": ${msg}` }, { status: 400 });
    }
  }

  try {
    const { merged, stats } = mergeIssueArrays(allIssueArrays);
    const metrics = calculateDashboardMetrics(merged);
    // EP-020: scope the write to the caller's workspace/user — this route
    // previously wrote the single shared latest-metrics.json file.
    const workspace = await getWorkspaceForUser(session.userId).catch(() => null);
    const scopeKey  = workspace ? `ws:${workspace.id}` : `user:${session.userId}`;
    writeLatestMetrics(scopeKey, metrics, { source: 'file' });
    // Mark pending synchronously — see app/api/upload/route.ts for why.
    markPendingPush();
    import('@/services/storage/cloudSync')
      .then(({ pushToCloud }) => pushToCloud())
      .catch(() => {});

    // EP-024: verified users additionally get a durable copy pushed to their own bucket.
    if (storageProviderStatus === 'verified') {
      getVerifiedUserStorageProviderInstance(session.userId)
        .then(provider => provider?.upload('delivery-clarity-metrics.json', JSON.stringify(metrics)))
        .catch(() => {});
    }

    // EP-015: ImportLog creation and entitlement consumption are one atomic
    // transaction, mirroring app/api/upload/route.ts — a merge counts as one
    // successful free analysis, same as a single-file upload. This route
    // previously created no ImportLog row at all, so entitlement had no FK
    // target to consume against.
    const importLog = await prisma.$transaction(async (tx) => {
      const log = await tx.importLog.create({ data: {
        userId:        session.userId,
        workspaceId:   workspace?.id ?? null,
        sourceType:    'file',
        fileName:      `${blobs.length} merged files`,
        rowCount:      allIssueArrays.reduce((sum, arr) => sum + arr.length, 0),
        status:        'success',
        warningsCount: fileWarnings.length,
        totalIssues:   metrics.totalIssues ?? 0,
        doneIssues:    metrics.doneIssues  ?? 0,
        healthScore:   metrics.healthScore ?? 0,
      }});
      if (!isAdmin) await (isReplacement ? consumeReplacementUpload(tx, session.userId, log.id) : consumeEntitlement(tx, session.userId, log.id));
      return log;
    }).catch(() => null);

    return NextResponse.json({ metrics, warnings: fileWarnings, mergeStats: stats, importLog, isReplacement });
  } catch {
    if (!isAdmin) await (isReplacement ? revertReplacementUpload(session.userId) : revertEntitlement(session.userId)).catch(() => {});
    return NextResponse.json({ error: 'Failed to calculate metrics from merged data.' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
