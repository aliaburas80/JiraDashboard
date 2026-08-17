// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { z } from 'zod';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { createReportShare, listReportShares } from '@/server/sharing/reportShare.service';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  report: z.unknown(),
  expiresInDays: z.union([z.literal(1), z.literal(7), z.literal(14), z.literal(30), z.literal(90), z.null()]).optional(),
});

async function sessionOrNull(): Promise<SessionData | null> {
  const session = await getIronSession<SessionData>(await cookies(), SESSION_OPTIONS);
  return session.isLoggedIn ? session : null;
}

function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true;
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  if (!host) return false;
  try { return new URL(origin).host === host; } catch { return false; }
}

export async function GET(): Promise<NextResponse> {
  const session = await sessionOrNull();
  if (!session) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  const shares = await listReportShares(session.userId);
  return NextResponse.json({ shares });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await sessionOrNull();
  if (!session) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Cross-origin request rejected.' }, { status: 403 });

  const json = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid share request.' }, { status: 400 });

  try {
    const result = await createReportShare({ userId: session.userId, ...parsed.data });
    return NextResponse.json({
      share: result.share,
      sharePath: `/share/${result.token}`,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'ACTIVE_SHARE_LIMIT') {
      return NextResponse.json({ error: 'Active share-link limit reached. Revoke an old link first.' }, { status: 409 });
    }
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Report data is not shareable.' }, { status: 400 });
    throw error;
  }
}
