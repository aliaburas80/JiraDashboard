// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// GET /api/admin/feedback/[id]/screenshot — P0B-09: fetches one feedback
// submission's screenshot on demand. Kept as its own route, separate from
// GET /api/admin/feedback's list, so the (potentially large) image data is
// never shipped as part of a 30-row list response.

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await getIronSession<SessionData>(await cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const feedback = await prisma.feedback.findUnique({ where: { id }, select: { screenshotData: true } });

  if (!feedback?.screenshotData) {
    return NextResponse.json({ error: 'No screenshot for this feedback item.' }, { status: 404 });
  }

  return NextResponse.json({ screenshot: feedback.screenshotData });
}
