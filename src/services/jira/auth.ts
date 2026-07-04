// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// ARCH-05 — shared Jira auth-header logic, used by connection testing,
// field discovery, and sync routes.

/** Builds the `Authorization` header value for a Jira Cloud or Server/DC call. */
export function buildJiraAuthHeader(
  deploymentType: string,
  authEmail: string | null | undefined,
  token: string,
): string {
  return deploymentType === 'cloud'
    ? `Basic ${Buffer.from(`${authEmail}:${token}`).toString('base64')}`
    : `Bearer ${token}`;
}

export function jiraMyselfPath(deploymentType: string): string {
  return deploymentType === 'cloud' ? '/rest/api/3/myself' : '/rest/api/2/myself';
}

export function jiraFieldPath(deploymentType: string): string {
  return deploymentType === 'cloud' ? '/rest/api/3/field' : '/rest/api/2/field';
}
