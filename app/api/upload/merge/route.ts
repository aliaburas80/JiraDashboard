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
import { getMetricsScopeKeyForUser } from '@/lib/workspace';
import { mergeIssueArrays } from '@/lib/mergeIssues';
import { getUserStorageProviderStatus, getVerifiedUserStorageProviderInstance } from '@/services/storage/userStorageProvider.service';

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_FILES     = 10;
const ALLOWED_EXT   = new Set(['.csv', '.xlsx', '.xls']);

function ext(name: string): string {
  return name.slice(name.lastIndexOf('.')).toLowerCase();
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // P0A-04: file upload and metrics writes are not public — require an active session.
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
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

  let formData: FormData;
  try { formData = await req.formData(); } catch {
    return NextResponse.json({ error: 'Invalid multipart form data.' }, { status: 400 });
  }

  // Collect all files (field names: file_0, file_1, … or just "file" multiple times)
  const blobs: Blob[] = [];
  for (const [, value] of formData.entries()) {
    if (value instanceof Blob) blobs.push(value);
  }

  if (!blobs.length) {
    return NextResponse.json({ error: 'No files uploaded.' }, { status: 400 });
  }
  if (blobs.length > MAX_FILES) {
    return NextResponse.json({ error: `Maximum ${MAX_FILES} files allowed.` }, { status: 400 });
  }

  const allIssueArrays: Record<string, unknown>[][] = [];
  const fileWarnings: string[] = [];

  for (let i = 0; i < blobs.length; i++) {
    const blob = blobs[i];
    const name = (blob as File).name ?? `file_${i}`;

    if (!ALLOWED_EXT.has(ext(name))) {
      return NextResponse.json({ error: `File "${name}" is not a supported format.` }, { status: 400 });
    }
    if (blob.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: `File "${name}" exceeds 20 MB.` }, { status: 400 });
    }

    const buffer = Buffer.from(await blob.arrayBuffer());
    try {
      const { issues, warnings } = parseJiraFile({ buffer, originalname: name });
      const validation = validateIssueData(issues);
      if (!validation.isValid) {
        return NextResponse.json({ error: `File "${name}" failed validation: ${validation.errors.join(', ')}` }, { status: 422 });
      }
      allIssueArrays.push(issues);
      fileWarnings.push(...warnings.map(w => `[${name}] ${w}`));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Parse error';
      return NextResponse.json({ error: `File "${name}": ${msg}` }, { status: 400 });
    }
  }

  try {
    const { merged, stats } = mergeIssueArrays(allIssueArrays);
    const metrics = calculateDashboardMetrics(merged);
    // EP-020: scope the write to the caller's workspace/user — this route
    // previously wrote the single shared latest-metrics.json file.
    const scopeKey = await getMetricsScopeKeyForUser(session.userId);
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

    return NextResponse.json({ metrics, warnings: fileWarnings, mergeStats: stats });
  } catch {
    return NextResponse.json({ error: 'Failed to calculate metrics from merged data.' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
