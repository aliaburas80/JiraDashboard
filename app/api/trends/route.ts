// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// GET /api/trends — returns upload history with metrics for trend analysis.

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getWorkspaceForUser } from '@/lib/workspace';
import type { TrendPoint } from '@/types/trends';

export type { TrendPoint };

export async function GET(req: Request) {
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const url   = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get('last') ?? 30), 30);

  // EP-008: scope by workspaceId so trends only include the user's own workspace data.
  const workspace = await getWorkspaceForUser(session.userId).catch(() => null);
  const logs = await prisma.importLog.findMany({
    where:   { userId: session.userId, workspaceId: workspace?.id, status: 'success' },
    orderBy: { uploadedAt: 'asc' },
    take:    limit,
    select:  { id: true, fileName: true, uploadedAt: true, healthScore: true,
                totalIssues: true, doneIssues: true, metadataJson: true },
  });

  const points: TrendPoint[] = logs.map(log => {
    let meta: Record<string, any> = {};
    try { if (log.metadataJson) meta = JSON.parse(log.metadataJson); } catch {}

    return {
      id:               log.id,
      fileName:         log.fileName,
      uploadedAt:       log.uploadedAt.toISOString(),
      healthScore:      log.healthScore ?? 0,
      totalIssues:      log.totalIssues ?? 0,
      doneIssues:       log.doneIssues  ?? 0,
      completionRate:          meta.completionRate   ?? (log.totalIssues > 0 ? Math.round((log.doneIssues / log.totalIssues) * 100) : 0),
      blockedIssues:           meta.blockedIssues    ?? 0,
      activeIssues:            meta.activeIssues     ?? 0,
      openDefects:             meta.openDefects      ?? 0,
      avgLeadTimeDays:         meta.avgLeadTimeDays  ?? 0,
      avgCycleTimeDays:        meta.avgCycleTimeDays ?? 0,
      criticalCount:           meta.criticalCount    ?? 0,
      dataQualityScore:        meta.dataQualityScore ?? null,
      avgSprintThroughput:     meta.avgSprintThroughput     ?? null,
      releaseConfidenceScore:  meta.releaseConfidenceScore  ?? null,
    };
  });

  return NextResponse.json({ points, count: points.length });
}

export const dynamic = 'force-dynamic';
