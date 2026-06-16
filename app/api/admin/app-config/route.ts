// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// GET  /api/admin/app-config — return current config (passwords masked)
// PUT  /api/admin/app-config — save new config (encrypt + upload to cloud)
// POST /api/admin/app-config?action=test — send a test email to the logged-in admin

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { getAppConfig, getSafeConfig, saveToCloud, invalidateConfig, type AppConfig } from '@/lib/app-config';
import { sendEmail } from '@/lib/email';

async function requireAdmin(): Promise<SessionData | NextResponse> {
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn)      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  return session;
}

export async function GET(): Promise<NextResponse> {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  try {
    // Bust the module-level cache so the panel always reflects current env state.
    invalidateConfig();
    const safe = await getSafeConfig();
    const hasEncKey = !!process.env.CONFIG_ENCRYPTION_KEY;
    return NextResponse.json({ config: safe, hasEncKey });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  let body: Partial<AppConfig> & { smtp?: Partial<AppConfig['smtp']> } = {};
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 }); }

  if (!process.env.CONFIG_ENCRYPTION_KEY) {
    return NextResponse.json({ error: 'CONFIG_ENCRYPTION_KEY is not set. Add it to your .env file before saving config to cloud.' }, { status: 400 });
  }

  // Merge with existing config so a missing password field doesn't wipe the stored one
  const existing = await getAppConfig();
  const updated: AppConfig = {
    smtp: {
      host: body.smtp?.host?.trim() ?? existing.smtp.host,
      port: body.smtp?.port  ?? existing.smtp.port,
      user: body.smtp?.user?.trim() ?? existing.smtp.user,
      pass: body.smtp?.pass?.trim() || existing.smtp.pass,   // keep existing if blank
      from: body.smtp?.from?.trim() ?? existing.smtp.from,
    },
    appUrl: body.appUrl?.trim() ?? existing.appUrl,
  };

  try {
    await saveToCloud(updated);
    invalidateConfig();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  const action = new URL(req.url).searchParams.get('action');
  if (action !== 'test') return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });

  // Always re-read env values when testing — clears any stale module-level cache.
  invalidateConfig();

  try {
    const sent = await sendEmail({
      to:      (auth as SessionData).email ?? '',
      subject: 'Delivery Clarity — SMTP test',
      text:    'This is a test email from your Delivery Clarity app-config SMTP settings.',
      html:    '<p>This is a <strong>test email</strong> from your <strong>Delivery Clarity</strong> app-config SMTP settings.</p>',
    });
    return NextResponse.json({ ok: sent, skipped: !sent });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
