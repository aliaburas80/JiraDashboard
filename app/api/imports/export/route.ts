// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// GET /api/imports/export — downloads the current user's import logs (or, for
// admins with ?all=true, every workspace's logs) as an Excel workbook. Scoping
// mirrors GET /api/imports exactly: same session, workspace, and role checks.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { canViewAllImportData } from '@/lib/roles';
import { getWorkspaceForUser } from '@/lib/workspace';
import { exportImportLogRecordsWorkbook } from '@/services/imports/importLogs.service';

export async function GET(req: NextRequest) {
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  try {
    const canViewAll = canViewAllImportData(session.role);
    const showAll = canViewAll && req.nextUrl.searchParams.get('all') === 'true';

    let workspaceFilter: { workspaceId?: string } = {};
    if (!showAll) {
      const workspace = await getWorkspaceForUser(session.userId);
      workspaceFilter = { workspaceId: workspace?.id };
    }

    const dbLogs = await prisma.importLog.findMany({
      where:   showAll ? {} : { userId: session.userId, ...workspaceFilter },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { uploadedAt: 'desc' },
      take:    1000,
    });

    const logs = dbLogs.map((l) => ({
      id:          l.id,
      timestamp:   l.uploadedAt?.toISOString() ?? null,
      filename:    l.fileName,
      rowCount:    l.rowCount,
      status:      l.status,
      filesize:    l.fileSize,
      healthScore: l.healthScore,
      totalIssues: l.totalIssues,
      userName:    showAll ? (l.user?.name  ?? 'Unknown') : null,
      userEmail:   showAll ? (l.user?.email ?? '')        : null,
    }));

    const buffer = exportImportLogRecordsWorkbook(logs);
    const filename = `import-logs-${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to export import logs.' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
