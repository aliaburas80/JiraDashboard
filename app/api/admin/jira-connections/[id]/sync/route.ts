// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// POST /api/admin/jira-connections/:id/sync — manual "Sync now". Runs a
// guided-filter JQL search through the Gateway, normalizes the results to
// the canonical issue shape, validates, computes dashboard metrics, and
// writes an ImportLog (sourceType: "api") — all-or-nothing, no partial
// commits on failure (the last-good dashboard data is never overwritten).
//
// ARCH-05 Phase 1 (JIRA-07) — see product/JIRA_INTEGRATION_DESIGN.md §5/§7/§8.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { prisma } from '@/lib/prisma';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { getJiraApiToken } from '@/lib/app-config';
import { fetchAllJiraIssues } from '@/services/jira/sync';
import { normalizeJiraIssues } from '@/services/jira/apiAdapter';
import { validateIssueData } from '@/services/jira/validation';
import { calculateDashboardMetrics } from '@/services/metrics/metrics.service';
import { writeLatestMetrics } from '@/services/metrics/latestMetricsStorage';
import type { JiraIssue } from '@/types/jira';

async function requireAdmin(): Promise<SessionData | NextResponse> {
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  return session;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const connection = await prisma.jiraConnection.findUnique({ where: { id: params.id } });
  if (!connection) {
    return NextResponse.json({ error: 'Connection not found.' }, { status: 404 });
  }

  const token = await getJiraApiToken();
  if (!token) {
    return NextResponse.json(
      { error: 'No Jira API token is configured. Set it in Admin Settings → App Config before syncing.' },
      { status: 409 },
    );
  }

  const projectFilters: string[] = JSON.parse(connection.projectFilters);
  const fieldMapping: Record<string, string> = JSON.parse(connection.fieldMapping);

  const fetchResult = await fetchAllJiraIssues({
    baseUrl: connection.baseUrl,
    deploymentType: connection.deploymentType,
    authEmail: connection.authEmail,
    token,
    projectFilters,
    fieldMapping,
    userId: session.userId,
  });

  if (!fetchResult.ok) {
    await prisma.jiraConnection.update({
      where: { id: connection.id },
      data: { lastSyncStatus: 'failed', lastSyncError: fetchResult.error ?? 'Unknown error' },
    });
    // A config error (bad project filters, missing email) never reached Jira
    // at all — that's a client/setup problem, not an upstream failure.
    return NextResponse.json(
      { ok: false, error: fetchResult.error },
      { status: fetchResult.configError ? 409 : 502 },
    );
  }

  const normalized = normalizeJiraIssues(fetchResult.issues ?? [], fieldMapping);
  const validation = validateIssueData(normalized);
  if (!validation.isValid) {
    const errorMsg = validation.errors.join('; ');
    await prisma.jiraConnection.update({
      where: { id: connection.id },
      data: { lastSyncStatus: 'failed', lastSyncError: errorMsg },
    });
    return NextResponse.json({ ok: false, error: 'Validation failed', details: validation.errors }, { status: 422 });
  }

  try {
    const startTime = Date.now();
    const metrics = calculateDashboardMetrics(normalized as JiraIssue[]);

    // All-or-nothing: only overwrite the live dashboard once everything above
    // has succeeded — a failed sync never clobbers the last-good data.
    writeLatestMetrics(metrics);

    const importLog = await prisma.importLog.create({ data: {
      userId: connection.createdByUserId,
      sourceType: 'api',
      jiraConnectionId: connection.id,
      rowCount: normalized.length,
      status: 'success',
      totalIssues: metrics.totalIssues ?? 0,
      doneIssues: metrics.doneIssues ?? 0,
      healthScore: metrics.healthScore ?? 0,
      processingTimeMs: Date.now() - startTime,
      metadataJson: JSON.stringify({
        completionRate: metrics.completionRate ?? 0,
        blockedIssues: metrics.blockedIssues ?? 0,
        activeIssues: metrics.activeIssues ?? 0,
        openDefects: metrics.openDefects ?? 0,
        truncated: fetchResult.truncated ?? false,
      }),
    }});

    await prisma.jiraConnection.update({
      where: { id: connection.id },
      data: { lastSyncAt: new Date(), lastSyncStatus: 'success', lastSyncError: null },
    });

    // Push-on-change: sync new data to cloud immediately (non-blocking, same as file upload).
    import('@/services/storage/cloudSync')
      .then(({ pushToCloud }) => pushToCloud())
      .catch(() => {});

    return NextResponse.json({
      ok: true,
      totalIssues: metrics.totalIssues ?? 0,
      doneIssues: metrics.doneIssues ?? 0,
      healthScore: metrics.healthScore ?? 0,
      truncated: fetchResult.truncated ?? false,
      importLogId: importLog.id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to process Jira sync.';
    await prisma.jiraConnection.update({
      where: { id: connection.id },
      data: { lastSyncStatus: 'failed', lastSyncError: message },
    });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
