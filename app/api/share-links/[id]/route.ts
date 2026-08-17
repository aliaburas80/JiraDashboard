// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { revokeReportShare } from '@/server/sharing/reportShare.service';

export const dynamic = 'force-dynamic';

function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true;
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  if (!host) return false;
  try { return new URL(origin).host === host; } catch { return false; }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const session = await getIronSession<SessionData>(await cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Cross-origin request rejected.' }, { status: 403 });

  const { id } = await context.params;
  if (!/^share_[A-Za-z0-9-]{20,80}$/.test(id)) return NextResponse.json({ error: 'Invalid share id.' }, { status: 400 });
  const revoked = await revokeReportShare(session.userId, id);
  if (!revoked) return NextResponse.json({ error: 'Share link not found.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
