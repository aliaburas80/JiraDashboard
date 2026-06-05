// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// GET /api/admin/storage/download?key=<object-key>
// Downloads a backup file from the active cloud provider and returns it as JSON.
// Optionally: ?restore=true to immediately restore the downloaded bundle.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { getActiveProvider } from '@/services/storage/storageProvider';
import { restoreBackup } from '@/services/settings/backup.service';
import type { BackupBundle } from '@/services/settings/backup.service';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn)      return NextResponse.json({ error: 'Not authenticated.' },     { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });

  const key     = req.nextUrl.searchParams.get('key');
  const restore = req.nextUrl.searchParams.get('restore') === 'true';

  if (!key) return NextResponse.json({ error: 'Missing ?key= parameter.' }, { status: 400 });

  try {
    const provider = await getActiveProvider();
    const content  = await provider.download(key);

    // Validate it parses as a backup bundle
    let bundle: BackupBundle;
    try {
      bundle = JSON.parse(content);
    } catch {
      return NextResponse.json({ error: 'Downloaded file is not valid JSON.' }, { status: 422 });
    }

    if (!bundle.manifest || !bundle.files) {
      return NextResponse.json({ error: 'Downloaded file does not appear to be a Delivery Clarity backup bundle.' }, { status: 422 });
    }

    // ── Restore mode ──────────────────────────────────────────────────────────
    if (restore) {
      const result = restoreBackup(bundle);

      await prisma.auditEvent.create({ data: {
        userId:           session.userId,
        eventType:        'backup_restored',
        eventDescription: `Cloud backup restored by ${session.email}. Key: ${key}. Restored: ${result.restored.join(', ')}.`,
      }}).catch(() => {});

      return NextResponse.json({
        ok:       result.success,
        restored: result.restored,
        errors:   result.errors,
        key,
      });
    }

    // ── Download mode — return the bundle for client-side save ────────────────
    return new NextResponse(content, {
      headers: {
        'Content-Type':        'application/json',
        'Content-Disposition': `attachment; filename="${key.split('/').pop() ?? 'backup.json'}"`,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `Failed to download from cloud: ${msg}` }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
