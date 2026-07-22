// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// GET  /api/admin/backup — create and download a backup bundle (admin only)
// GET  /api/admin/backup?info=true — return file stats without downloading

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { createBackup, getBackupStats } from '@/services/settings/backup.service';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });

  // Info-only mode
  if (req.nextUrl.searchParams.get('info') === 'true') {
    return NextResponse.json({ files: getBackupStats() });
  }

  // Create backup bundle
  const bundle    = createBackup();
  const json      = JSON.stringify(bundle, null, 2);
  const filename  = `delivery-clarity-backup-${new Date().toISOString().slice(0, 10)}.json`;

  // Audit log
  await prisma.auditEvent.create({ data: {
    userId: session.userId, eventType: 'backup_created',
    eventDescription: `Database backup created by ${session.email}. Files: ${bundle.manifest.files.filter(f => f.included).length}`,
  }}).catch(() => {});

  return new NextResponse(json, {
    headers: {
      'Content-Type':        'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

export const dynamic = 'force-dynamic';
