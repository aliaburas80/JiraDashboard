// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// POST /api/admin/restore — restore from a backup bundle JSON file (admin only)

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { restoreBackup } from '@/services/settings/backup.service';
import type { BackupBundle } from '@/services/settings/backup.service';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });

  let bundle: BackupBundle;
  try { bundle = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid backup file. Expected JSON.' }, { status: 400 });
  }

  const result = restoreBackup(bundle);

  await prisma.auditEvent.create({ data: {
    userId: session.userId, eventType: 'backup_restored',
    eventDescription: `Backup restored by ${session.email}. Restored: ${result.restored.join(', ')}. Errors: ${result.errors.length}`,
  }}).catch(() => {});

  return NextResponse.json({
    ok:      result.success,
    restored: result.restored,
    skipped:  result.skipped,
    errors:   result.errors,
  }, { status: result.success ? 200 : 500 });
}

export const dynamic = 'force-dynamic';
