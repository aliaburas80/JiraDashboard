// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// GET  /api/admin/storage/sync — return current sync status + cache meta
// POST /api/admin/storage/sync — trigger sync from cloud or push to cloud

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { getCacheMeta } from '@/services/storage/cloudSync';
import { readStorageSettings } from '@/services/storage/storageProvider';

async function requireAdmin(): Promise<{ session: SessionData } | NextResponse> {
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn)      return NextResponse.json({ error: 'Not authenticated.' },     { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  return { session };
}

// ── GET — sync status ─────────────────────────────────────────────────────────

export async function GET() {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  const meta     = getCacheMeta();
  const settings = readStorageSettings();

  return NextResponse.json({
    provider:     settings.active,
    cacheMeta:    meta,
    isCurrent:    meta ? !meta.pendingPush : false,
    pendingPush:  meta?.pendingPush ?? false,
    lastFetched:  meta?.fetchedAt ?? null,
    lastPushed:   meta?.pushedAt  ?? null,
    cachedKey:    meta?.key       ?? null,
  });
}

// ── POST — trigger fetch or push ──────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  const action = req.nextUrl.searchParams.get('action') ?? 'fetch';

  try {
    if (action === 'push') {
      const { pushToCloud } = await import('@/services/storage/cloudSync');
      const result = await pushToCloud();
      return NextResponse.json(result);
    }

    if (action === 'switch') {
      const { switchProvider } = await import('@/services/storage/cloudSync');
      const result = await switchProvider(readStorageSettings().active);
      return NextResponse.json(result);
    }

    // Default: fetch/sync from cloud
    const { syncFromCloud } = await import('@/services/storage/cloudSync');
    const result = await syncFromCloud();
    return NextResponse.json(result);
  } catch (e: unknown) {
    return NextResponse.json({ status: 'error', error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
