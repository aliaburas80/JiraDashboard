// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Shared "run a sync for this connection" logic — used by both the
// admin-scoped per-connection route (POST /api/admin/jira-connections/:id/sync)
// and the any-logged-in-user dashboard route (POST /api/jira/sync). Extracted
// so both entry points share one all-or-nothing implementation rather than
// drifting apart. See product/JIRA_INTEGRATION_DESIGN.md §5/§7/§8.

import type { JiraConnection } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getJiraApiToken } from '@/lib/app-config';
import { fetchAllJiraIssues } from '@/services/jira/sync';
import { normalizeJiraIssues } from '@/services/jira/apiAdapter';
import { validateIssueData } from '@/services/jira/validation';
import { calculateDashboardMetrics } from '@/services/metrics/metrics.service';
import { writeLatestMetrics } from '@/services/metrics/latestMetricsStorage';
import type { JiraIssue } from '@/types/jira';

export interface JiraSyncRunResult {
  status: number;
  body: Record<string, unknown>;
}

/** Picks the connection currently powering the live dashboard: the most
 * recently synced one, falling back to the most recently created connection
 * if none has ever synced yet. Returns null when no connection exists. */
export async function resolveActiveJiraConnection(): Promise<JiraConnection | null> {
  const connections = await prisma.jiraConnection.findMany();
  if (connections.length === 0) return null;

  const everSynced = connections.filter(c => c.lastSyncAt);
  if (everSynced.length > 0) {
    return everSynced.sort((a, b) => b.lastSyncAt!.getTime() - a.lastSyncAt!.getTime())[0];
  }
  return connections.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
}

export async function runJiraConnectionSync(
  connection: JiraConnection,
  userId: string,
): Promise<JiraSyncRunResult> {
  const token = await getJiraApiToken();
  if (!token) {
    return {
      status: 409,
      body: { ok: false, error: 'No Jira API token is configured. Set it in Admin Settings → App Config before syncing.' },
    };
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
    userId,
  });

  if (!fetchResult.ok) {
    await prisma.jiraConnection.update({
      where: { id: connection.id },
      data: { lastSyncStatus: 'failed', lastSyncError: fetchResult.error ?? 'Unknown error' },
    });
    // A config error (bad project filters, missing email) never reached Jira
    // at all — that's a client/setup problem, not an upstream failure.
    return { status: fetchResult.configError ? 409 : 502, body: { ok: false, error: fetchResult.error } };
  }

  const normalized = normalizeJiraIssues(fetchResult.issues ?? [], fieldMapping);
  const validation = validateIssueData(normalized);
  if (!validation.isValid) {
    const errorMsg = validation.errors.join('; ');
    await prisma.jiraConnection.update({
      where: { id: connection.id },
      data: { lastSyncStatus: 'failed', lastSyncError: errorMsg },
    });
    return { status: 422, body: { ok: false, error: 'Validation failed', details: validation.errors } };
  }

  try {
    const startTime = Date.now();
    const metrics = calculateDashboardMetrics(normalized as JiraIssue[]);

    // All-or-nothing: only overwrite the live dashboard once everything above
    // has succeeded — a failed sync never clobbers the last-good data.
    writeLatestMetrics(metrics, {
      source: 'jira-api',
      connectionName: connection.name,
      connectionId: connection.id,
    });

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

    return {
      status: 200,
      body: {
        ok: true,
        connectionId: connection.id,
        connectionName: connection.name,
        totalIssues: metrics.totalIssues ?? 0,
        doneIssues: metrics.doneIssues ?? 0,
        healthScore: metrics.healthScore ?? 0,
        truncated: fetchResult.truncated ?? false,
        importLogId: importLog.id,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to process Jira sync.';
    await prisma.jiraConnection.update({
      where: { id: connection.id },
      data: { lastSyncStatus: 'failed', lastSyncError: message },
    });
    return { status: 500, body: { ok: false, error: message } };
  }
}
