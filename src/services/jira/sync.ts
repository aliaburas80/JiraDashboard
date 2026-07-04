// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// ARCH-05 Phase 1 (JIRA-07) — fetches issues from a Jira connection via JQL,
// paginating through the Gateway, ready to be normalized by apiAdapter.ts.
// See product/JIRA_INTEGRATION_DESIGN.md §3 (API scope) and §5 (refresh).

import { callExternal } from '@/server/gateway/externalGateway';
import { buildJiraAuthHeader } from './auth';

// v1 ships with guided filters only (project keys), never raw JQL text entry
// — see design doc §3: a free-text JQL box could leak an entire backlog via
// a misconfigured query.
const PROJECT_KEY_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/;

// Safety cap — a single "Sync now" click must not be able to pull an entire
// multi-year Jira instance. Revisit with incremental sync in a future phase.
const MAX_ISSUES_PER_SYNC = 1000;
const PAGE_SIZE = 100;

const STANDARD_FIELD_IDS = [
  'issuetype', 'summary', 'status', 'project', 'assignee', 'reporter',
  'priority', 'resolution', 'labels', 'fixVersions', 'parent',
  'created', 'updated', 'resolutiondate', 'duedate',
];

export interface BuildJqlResult {
  ok: boolean;
  jql?: string;
  error?: string;
}

/** Builds a safe, bounded JQL query from admin-entered project keys. Never raw JQL. */
export function buildSyncJql(projectFilters: string[]): BuildJqlResult {
  const validKeys = projectFilters.filter(key => PROJECT_KEY_PATTERN.test(key));
  if (validKeys.length === 0) {
    return { ok: false, error: 'This connection has no valid project keys configured. Add at least one project key before syncing.' };
  }
  return { ok: true, jql: `project in (${validKeys.join(',')}) ORDER BY updated DESC` };
}

interface JiraSearchPage {
  issues?: Array<{ id?: string; key: string; fields: Record<string, unknown> }>;
  // Cloud (/rest/api/3/search/jql)
  nextPageToken?: string;
  // Server/DC (/rest/api/2/search)
  startAt?: number;
  total?: number;
}

export interface FetchIssuesParams {
  baseUrl: string;
  deploymentType: string;
  authEmail: string | null;
  token: string;
  projectFilters: string[];
  fieldMapping: Record<string, string>;
  userId?: string | null;
}

export interface FetchIssuesResult {
  ok: boolean;
  issues?: Array<{ id?: string; key: string; fields: Record<string, unknown> }>;
  truncated?: boolean;
  error?: string;
  /** True when the failure is a connection misconfiguration caught before any
   *  Gateway call was made (bad project filters, missing email) — the
   *  caller should respond 4xx, not 502, since Jira was never even reached. */
  configError?: boolean;
}

/** Runs the JQL through the Gateway, paginating until exhausted or MAX_ISSUES_PER_SYNC. Never throws. */
export async function fetchAllJiraIssues(params: FetchIssuesParams): Promise<FetchIssuesResult> {
  const jqlResult = buildSyncJql(params.projectFilters);
  if (!jqlResult.ok) return { ok: false, error: jqlResult.error, configError: true };

  const isCloud = params.deploymentType === 'cloud';
  if (isCloud && !params.authEmail) {
    return { ok: false, error: 'This Cloud connection is missing its email address.', configError: true };
  }
  const authHeader = buildJiraAuthHeader(params.deploymentType, params.authEmail, params.token);
  const fields = [...STANDARD_FIELD_IDS, ...Object.values(params.fieldMapping)].join(',');

  const allIssues: Array<{ id?: string; key: string; fields: Record<string, unknown> }> = [];
  let nextPageToken: string | undefined;
  let startAt = 0;
  let total = Infinity;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const query: Record<string, string> = {
      jql: jqlResult.jql!,
      maxResults: String(PAGE_SIZE),
      fields,
    };
    if (isCloud) {
      if (nextPageToken) query.nextPageToken = nextPageToken;
    } else {
      query.startAt = String(startAt);
    }

    const result = await callExternal<JiraSearchPage>({
      provider: 'jira',
      operation: 'jira.syncSearch',
      method: 'GET',
      path: isCloud ? '/rest/api/3/search/jql' : '/rest/api/2/search',
      query,
      headers: { Authorization: authHeader, Accept: 'application/json' },
      baseUrlOverride: params.baseUrl,
      credentialsPresentOverride: true,
      userId: params.userId,
      timeoutMs: 30000,
    });

    if (!result.ok) {
      return { ok: false, error: result.error ?? 'Could not fetch issues from Jira.' };
    }

    const page = result.data?.issues ?? [];
    allIssues.push(...page);

    if (allIssues.length >= MAX_ISSUES_PER_SYNC) {
      return { ok: true, issues: allIssues.slice(0, MAX_ISSUES_PER_SYNC), truncated: true };
    }
    if (page.length === 0) break;

    if (isCloud) {
      nextPageToken = result.data?.nextPageToken;
      if (!nextPageToken) break;
    } else {
      startAt += page.length;
      total = result.data?.total ?? page.length;
      if (startAt >= total) break;
    }
  }

  return { ok: true, issues: allIssues, truncated: false };
}
