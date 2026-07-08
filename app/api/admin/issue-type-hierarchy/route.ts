// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// GET  /api/admin/issue-type-hierarchy — return this user's config (any logged-in user can read,
//      since the Explore page needs it for every user, not just admins)
// POST /api/admin/issue-type-hierarchy — replace this admin user's config

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import {
  readIssueTypeHierarchyForUser,
  writeIssueTypeHierarchyForUser,
  invalidateIssueTypeHierarchyCache,
} from '@/services/settings/issueTypeHierarchy.service';
import { safeAuditEvent } from '@/lib/system-error-logger';
import type { IssueTypeDefinition, IssueTypeHierarchyConfig } from '@/types/issueTypeHierarchy';
import { DEFAULT_ISSUE_TYPES } from '@/types/issueTypeHierarchy';

export async function GET() {
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  return NextResponse.json({ config: await readIssueTypeHierarchyForUser(session.userId) });
}

function validateTypes(types: unknown): string | null {
  if (!Array.isArray(types) || types.length === 0) {
    return 'At least one issue type is required.';
  }

  const ids = new Set<string>();
  const matchNames = new Set<string>();

  for (const raw of types) {
    const t = raw as Partial<IssueTypeDefinition>;
    if (!t.id || typeof t.id !== 'string') return 'Every type must have an id.';
    if (!t.label || typeof t.label !== 'string') return `Type "${t.id}" is missing a label.`;
    if (!Array.isArray(t.matchNames) || t.matchNames.length === 0) {
      return `Type "${t.label}" must match at least one raw Jira issue type name.`;
    }
    if (typeof t.level !== 'number' || !Number.isInteger(t.level) || t.level < 0) {
      return `Type "${t.label}" has an invalid hierarchy level.`;
    }
    if (ids.has(t.id)) return `Duplicate type id: "${t.id}".`;
    ids.add(t.id);

    for (const raw2 of t.matchNames) {
      const norm = String(raw2).trim().toLowerCase();
      if (!norm) return `Type "${t.label}" has an empty match name.`;
      if (matchNames.has(norm)) return `Raw issue type name "${norm}" is mapped to more than one type.`;
      matchNames.add(norm);
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });

  let body: Partial<IssueTypeHierarchyConfig>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const validationError = validateTypes(body.types);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const builtInIds = new Set(DEFAULT_ISSUE_TYPES.filter(t => t.builtIn).map(t => t.id));
  const incomingIds = new Set((body.types as IssueTypeDefinition[]).map(t => t.id));
  const removedBuiltIn = [...builtInIds].find(id => !incomingIds.has(id));
  if (removedBuiltIn) {
    return NextResponse.json(
      { error: `"${removedBuiltIn}" is a built-in type and cannot be deleted — you can still re-map its match names.` },
      { status: 400 },
    );
  }

  const updated: IssueTypeHierarchyConfig = {
    types: (body.types as IssueTypeDefinition[]).map(t => ({
      ...t,
      builtIn: builtInIds.has(t.id),
    })),
    updatedAt: new Date().toISOString(),
    updatedBy: session.email,
  };

  await writeIssueTypeHierarchyForUser(session.userId, updated, {
    userId: session.userId,
    isSuperAdmin: session.isSuperAdmin === true,
    updatedBy: session.email,
  });
  invalidateIssueTypeHierarchyCache(session.userId);

  await safeAuditEvent({
    userId: session.userId,
    eventType: 'admin_issue_type_hierarchy_updated',
    eventDescription: `${session.email} updated the issue-type hierarchy configuration.`,
  });

  return NextResponse.json({ ok: true, config: updated });
}

export const dynamic = 'force-dynamic';
