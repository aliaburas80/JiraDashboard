// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// POST /api/admin/storage/auto-restore — manually trigger config/diagnostics
//      restore from cloud (see src/services/settings/backup.service.ts —
//      this restores local JSON config files, not the database)
// GET  /api/admin/storage/auto-restore — check database connectivity

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';

async function requireAdmin(): Promise<{ session: SessionData } | NextResponse> {
  const session = await getIronSession<SessionData>(await cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn)      return NextResponse.json({ error: 'Not authenticated.' },     { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  return { session };
}

// ── GET — database connectivity ───────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  let dbConnected = false;
  let users       = 0;
  let imports     = 0;
  let healthy     = false;

  try {
    [users, imports] = await Promise.all([prisma.user.count(), prisma.importLog.count()]);
    dbConnected = true;
    healthy     = users > 0;
  } catch {}

  return NextResponse.json({ dbConnected, users, imports, healthy });
}

// ── POST — trigger auto-restore ───────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;
  const { session } = check as { session: SessionData };

  try {
    const { autoRestoreFromCloud } = await import('@/services/storage/autoRestore');

    // Force-mode: skip the "DB already has users" guard if ?force=true
    const force = req.nextUrl.searchParams.get('force') === 'true';
    if (force) {
      // Clear user count guard by temporarily renaming the DB file won't work cleanly
      // Instead, directly call download-latest-and-restore
      const { readStorageSettings, createProvider } = await import('@/services/storage/storageProvider');
      const settings = readStorageSettings();

      if (settings.active === 'local') {
        return NextResponse.json({ ok: false, error: 'No cloud provider configured. Set one in Cloud Storage settings.' });
      }

      const provider = await createProvider(settings.active, settings);
      const backups  = await provider.list();

      if (!backups.length) {
        return NextResponse.json({ ok: false, error: 'No backups found in the cloud bucket.' });
      }

      const sorted = [...backups].sort((a, b) =>
        (b.lastModified ?? b.key).localeCompare(a.lastModified ?? a.key)
      );
      const latest = sorted[0];
      const content = await provider.download(latest.key);
      const bundle  = JSON.parse(content);

      const { restoreBackup } = await import('@/services/settings/backup.service');
      const result = restoreBackup(bundle);

      await prisma.auditEvent.create({ data: {
        userId:           session.userId,
        eventType:        'backup_restored',
        eventDescription: `Manual cloud restore by ${session.email}. Key: ${latest.key}. Restored: ${result.restored.join(', ')}.`,
      }}).catch(() => {});

      return NextResponse.json({ ok: result.success, action: 'restored', key: latest.key, restored: result.restored, errors: result.errors });
    }

    // Normal mode — respects existing DB guard
    const result = await autoRestoreFromCloud();
    if (result.action === 'restored') {
      await prisma.auditEvent.create({ data: {
        userId:           session.userId,
        eventType:        'backup_restored',
        eventDescription: `Auto-restore from cloud triggered by ${session.email}.`,
      }}).catch(() => {});
    }
    return NextResponse.json({ ok: result.action === 'restored', ...result });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
