// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// GET  /api/admin/thresholds — return current health thresholds (any logged-in user)
// POST /api/admin/thresholds — update thresholds (admin only)

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { readThresholdsForUser, writeThresholdsForUser, invalidateThresholdCache } from '@/services/settings/thresholds.service';
import { safeAuditEvent } from '@/lib/system-error-logger';
import type { HealthThresholds } from '@/types/thresholds';

export async function GET() {
  const session = await getIronSession<SessionData>(await cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  return NextResponse.json({ thresholds: await readThresholdsForUser(session.userId) });
}

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });

  let body: Partial<HealthThresholds>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  // Validate: warning must be < critical for each pair
  if (body.cycleTimeWarningDays && body.cycleTimeCriticalDays &&
      body.cycleTimeWarningDays >= body.cycleTimeCriticalDays) {
    return NextResponse.json({ error: 'Cycle time warning must be less than critical.' }, { status: 400 });
  }
  if (body.activeAgeWarningDays && body.activeAgeCriticalDays &&
      body.activeAgeWarningDays >= body.activeAgeCriticalDays) {
    return NextResponse.json({ error: 'Active age warning must be less than critical.' }, { status: 400 });
  }
  if (body.blockedRatioWarningPct && body.blockedRatioCriticalPct &&
      body.blockedRatioWarningPct >= body.blockedRatioCriticalPct) {
    return NextResponse.json({ error: 'Blocked ratio warning must be less than critical.' }, { status: 400 });
  }

  const current = await readThresholdsForUser(session.userId);

  const excellent = body.healthScoreExcellentPct ?? current.healthScoreExcellentPct;
  const good      = body.healthScoreGoodPct      ?? current.healthScoreGoodPct;
  const fair      = body.healthScoreFairPct      ?? current.healthScoreFairPct;
  const weak      = body.healthScoreWeakPct      ?? current.healthScoreWeakPct;
  if (!(excellent > good && good > fair && fair > weak)) {
    return NextResponse.json({ error: 'Health Score bands must be strictly descending: Excellent > Good > Fair > Weak.' }, { status: 400 });
  }

  const updated: HealthThresholds = {
    ...current,
    ...body,
    updatedAt: new Date().toISOString(),
    updatedBy: session.email,
  };

  await writeThresholdsForUser(updated, {
    userId: session.userId,
    isSuperAdmin: session.isSuperAdmin === true,
    updatedBy: session.email,
  });
  invalidateThresholdCache();

  await safeAuditEvent({
    userId: session.userId,
    eventType: 'admin_thresholds_updated',
    eventDescription: `${session.email} updated health thresholds.`,
  });

  return NextResponse.json({ ok: true, thresholds: updated });
}

export const dynamic = 'force-dynamic';
