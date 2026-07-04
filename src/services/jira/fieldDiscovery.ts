// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// ARCH-05 Phase 1 (JIRA-06b) — discovers a Jira instance's actual field ID ->
// human-readable name mapping (custom field IDs are per-instance, e.g.
// customfield_10014 might be "Epic Link" on one Jira site and something
// unrelated on another). See product/JIRA_INTEGRATION_DESIGN.md §4 step 1.

import { callExternal } from '@/server/gateway/externalGateway';
import { buildJiraAuthHeader, jiraFieldPath } from './auth';

export interface JiraField {
  id: string;
  name: string;
}

interface DiscoverFieldsParams {
  baseUrl: string;
  deploymentType: string;
  authEmail: string | null;
  token: string;
  userId?: string | null;
}

export interface DiscoverFieldsResult {
  ok: boolean;
  fields?: JiraField[];
  error?: string;
}

/** Calls GET /rest/api/{2|3}/field through the Gateway. Never throws. */
export async function discoverJiraFields(params: DiscoverFieldsParams): Promise<DiscoverFieldsResult> {
  const isCloud = params.deploymentType === 'cloud';
  if (isCloud && !params.authEmail) {
    return { ok: false, error: 'This Cloud connection is missing its email address.' };
  }

  const authHeader = buildJiraAuthHeader(params.deploymentType, params.authEmail, params.token);

  const result = await callExternal<Array<{ id: string; name: string }>>({
    provider: 'jira',
    operation: 'jira.discoverFields',
    method: 'GET',
    path: jiraFieldPath(params.deploymentType),
    headers: { Authorization: authHeader, Accept: 'application/json' },
    baseUrlOverride: params.baseUrl,
    credentialsPresentOverride: true,
    userId: params.userId,
    timeoutMs: 15000,
  });

  if (!result.ok) {
    return { ok: false, error: result.error ?? 'Could not retrieve Jira fields.' };
  }
  const fields = (result.data ?? []).map(f => ({ id: f.id, name: f.name }));
  return { ok: true, fields };
}
