// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// GET  /api/admin/orphan-rules — return current rules (any logged-in user can read)
// POST /api/admin/orphan-rules — update rules (admin only)

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { readOrphanRulesForUser, writeOrphanRulesForUser, invalidateOrphanCache } from '@/services/settings/orphanRules.service';
import { safeAuditEvent } from '@/lib/system-error-logger';
import type { OrphanRules } from '@/types/orphanRules';

export async function GET() {
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  return NextResponse.json({ rules: await readOrphanRulesForUser(session.userId) });
}

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });

  let body: Partial<OrphanRules>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  if (body.parentLinkFields && body.parentLinkFields.length === 0) {
    return NextResponse.json({ error: 'At least one parent link field is required.' }, { status: 400 });
  }

  const updated: OrphanRules = {
    ...(await readOrphanRulesForUser(session.userId)),
    ...body,
    updatedAt: new Date().toISOString(),
    updatedBy: session.email,
  };

  await writeOrphanRulesForUser(updated, {
    userId: session.userId,
    isSuperAdmin: session.isSuperAdmin === true,
    updatedBy: session.email,
  });
  invalidateOrphanCache();

  await safeAuditEvent({
    userId: session.userId,
    eventType: 'admin_orphan_rules_updated',
    eventDescription: `${session.email} updated orphan-detection rules.`,
  });

  return NextResponse.json({ ok: true, rules: updated });
}

export const dynamic = 'force-dynamic';
