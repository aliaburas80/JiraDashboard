// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// GET/POST /api/consent — P0B-03: view and update consent status.
// Only the "analytics" purpose is user-togglable here — "terms_and_privacy"
// is required and set once at registration; withdrawing it means requesting
// account deletion (see /privacy §10), not a state this endpoint models.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import type { IronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { getConsentStatus, recordConsent } from '@/lib/consent';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function requireUser(): Promise<IronSession<SessionData> | NextResponse> {
  const session = await getIronSession<SessionData>(await cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  return session;
}

export async function GET(): Promise<NextResponse> {
  const session = await requireUser();
  if (session instanceof NextResponse) return session;

  const status = await getConsentStatus(session.userId);
  return NextResponse.json({ consent: status });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await requireUser();
  if (session instanceof NextResponse) return session;

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  if (body.purpose !== 'analytics') {
    return NextResponse.json(
      { error: 'Only the "analytics" consent purpose can be changed here. To withdraw required Terms & Privacy consent, request account deletion.' },
      { status: 400 },
    );
  }
  if (typeof body.granted !== 'boolean') {
    return NextResponse.json({ error: '"granted" must be true or false.' }, { status: 400 });
  }

  await recordConsent(session.userId, 'analytics', body.granted, {
    source:    'settings',
    ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? undefined,
    userAgent: req.headers.get('user-agent') ?? undefined,
  });

  await prisma.auditEvent.create({ data: {
    userId:           session.userId,
    eventType:        'consent_update',
    eventDescription: `User ${body.granted ? 'granted' : 'withdrew'} analytics consent.`,
    ipAddress:        req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? undefined,
    userAgent:        req.headers.get('user-agent') ?? undefined,
  }}).catch(() => {});

  const status = await getConsentStatus(session.userId);
  return NextResponse.json({ ok: true, consent: status });
}
