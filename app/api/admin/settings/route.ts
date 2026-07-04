// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// GET  /api/admin/settings — return current retention settings + stats
// POST /api/admin/settings — update retention settings (admin only)

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { readSettings, writeSettings } from '@/services/settings/settings.service';
import { getRetentionStats } from '@/services/settings/dataRetention.service';
import type { RetentionSettings } from '@/types/settings';

async function requireAdmin(req: NextRequest): Promise<{ session: SessionData } | NextResponse> {
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  return { session };
}

export async function GET(req: NextRequest) {
  const check = await requireAdmin(req);
  if (check instanceof NextResponse) return check;

  const settings = readSettings();
  const stats    = await getRetentionStats(settings).catch(() => null);
  return NextResponse.json({ settings, stats });
}

export async function POST(req: NextRequest) {
  const check = await requireAdmin(req);
  if (check instanceof NextResponse) return check;
  const { session } = check;

  let body: Partial<RetentionSettings>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const current  = readSettings();
  const updated: RetentionSettings = {
    ...current,
    ...body,
    updatedAt: new Date().toISOString(),
    updatedBy: session.email,
  };

  writeSettings(updated);
  return NextResponse.json({ ok: true, settings: updated });
}

export const dynamic = 'force-dynamic';
