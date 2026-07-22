// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// POST /api/jira/sync — manual "Sync Jira" for any logged-in user (not
// admin-only), exposed on the dashboard. Auto-resolves which connection to
// sync: the most recently synced one, falling back to the most recently
// created connection if none has ever synced. The Jira API token itself is
// never exposed to the client; sync resolves the encrypted token on the active
// JiraConnection row.
//
// ARCH-05 — see product/JIRA_INTEGRATION_DESIGN.md §5/§7/§8.

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { resolveActiveJiraConnection, runJiraConnectionSync } from '@/services/jira/connectionSyncRunner';
import { getWorkspaceForUser } from '@/lib/workspace';

export async function POST() {
  const session = await getIronSession<SessionData>(await cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  // EP-020: only resolve a connection this caller created or that belongs
  // to their own workspace — this route used to auto-pick the single most
  // recently synced connection system-wide, regardless of owner.
  const workspace = await getWorkspaceForUser(session.userId).catch(() => null);
  const connection = await resolveActiveJiraConnection({ userId: session.userId, workspaceId: workspace?.id ?? null });
  if (!connection) {
    return NextResponse.json(
      { error: 'No Jira connection is configured yet. Ask an admin to set one up in Admin Settings → Jira Integration.' },
      { status: 404 },
    );
  }

  const result = await runJiraConnectionSync(connection, session.userId);
  return NextResponse.json(result.body, { status: result.status });
}

export const dynamic = 'force-dynamic';
