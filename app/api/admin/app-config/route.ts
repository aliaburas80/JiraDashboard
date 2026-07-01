// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// GET  /api/admin/app-config — return current config (passwords masked)
// PUT  /api/admin/app-config — save new config (encrypt + upload to cloud)
// POST /api/admin/app-config?action=test — send a test email to the logged-in admin
// POST /api/admin/app-config?action=test-jira — verify an in-progress (unsaved) Jira
//   token against the most recently created JiraConnection, mirroring the SMTP test's
//   "test before saving" UX (ARCH-05, JIRA-05c follow-up).

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getAppConfig, getSafeConfig, saveToCloud, invalidateConfig, type AppConfig } from '@/lib/app-config';
import { describeSmtpErrorDetails, sendEmailWith } from '@/lib/email';
import { callExternal } from '@/server/gateway/externalGateway';
import { buildJiraAuthHeader, jiraMyselfPath } from '@/services/jira/auth';

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

  let body: Partial<AppConfig> & { smtp?: Partial<AppConfig['smtp']>; jira?: Partial<AppConfig['jira']> } = {};
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 }); }

  if (!process.env.CONFIG_ENCRYPTION_KEY) {
    return NextResponse.json({ error: 'CONFIG_ENCRYPTION_KEY is not set. Add it to your .env file before saving config to cloud.' }, { status: 400 });
  }

  // Merge with existing config so a missing password/token field doesn't wipe the stored one
  const existing = await getAppConfig();
  const updated: AppConfig = {
    smtp: {
      host: body.smtp?.host?.trim() ?? existing.smtp.host,
      port: body.smtp?.port  ?? existing.smtp.port,
      user: body.smtp?.user?.trim() ?? existing.smtp.user,
      pass: body.smtp?.pass?.trim() || existing.smtp.pass,   // keep existing if blank
      from: body.smtp?.from?.trim() ?? existing.smtp.from,
    },
    jira: {
      apiToken: body.jira?.apiToken?.trim() || existing.jira.apiToken,   // keep existing if blank
    },
    appUrl: body.appUrl?.trim() ?? existing.appUrl,
  };

  // Save SMTP to database (primary store) — does not require cloud storage to be configured.
  try {
    const { saveSmtpSettings } = await import('@/services/smtp/smtpSettings.service');
    await saveSmtpSettings({
      host:            updated.smtp.host,
      port:            updated.smtp.port,
      username:        updated.smtp.user,
      pass:            body.smtp?.pass?.trim() || undefined, // only pass new pass if explicitly provided
      fromAddress:     updated.smtp.from,
      updatedByUserId: (auth as SessionData).userId,
    });
  } catch (err) {
    // DB save failed — still attempt cloud save below; log but don't abort.
    console.error('[app-config] DB SMTP save failed:', (err as Error).message);
  }

  // Also save to cloud (S3/Azure/GCP) as a secondary backup, when configured.
  try {
    await saveToCloud(updated);
  } catch {
    // Cloud not configured or save failed — DB is the primary store, this is optional.
  }

  invalidateConfig();

  // P0A-07: audit log every config save so changes are traceable.
  await prisma.auditEvent.create({
    data: {
      userId:           (auth as SessionData).userId,
      eventType:        'admin_config_save',
      eventDescription: `${(auth as SessionData).email} saved app config (SMTP host: ${updated.smtp.host || 'unchanged'}, appUrl: ${updated.appUrl || 'unchanged'}).`,
    },
  }).catch(() => {}); // never block the response on audit failure

  return NextResponse.json({ ok: true });
}

interface JiraMyselfResponse {
  accountId?: string;
  displayName?: string;
  emailAddress?: string;
  name?: string; // Server/DC uses "name" instead of "accountId"/"emailAddress"
}

async function testJiraToken(auth: SessionData, apiToken?: string): Promise<NextResponse> {
  const connection = await prisma.jiraConnection.findFirst({ orderBy: { createdAt: 'desc' } });
  if (!connection) {
    return NextResponse.json({ ok: false, skipped: true, error: 'No Jira connection exists yet — create one on the Jira Integration tab, then come back to test the token.' });
  }

  const token = apiToken?.trim() || (await getAppConfig()).jira.apiToken;
  if (!token) {
    return NextResponse.json({ ok: false, skipped: true, error: 'Enter a token above (or save one) before testing.' });
  }

  if (connection.deploymentType === 'cloud' && !connection.authEmail) {
    return NextResponse.json({ ok: false, error: `Connection "${connection.name}" is missing its email address.` }, { status: 409 });
  }
  const authHeader = buildJiraAuthHeader(connection.deploymentType, connection.authEmail, token);

  const result = await callExternal<JiraMyselfResponse>({
    provider: 'jira',
    operation: 'jira.testTokenFromAppConfig',
    method: 'GET',
    path: jiraMyselfPath(connection.deploymentType),
    headers: { Authorization: authHeader, Accept: 'application/json' },
    baseUrlOverride: connection.baseUrl,
    credentialsPresentOverride: true,
    userId: auth.userId,
    timeoutMs: 15000,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error ?? 'Connection test failed.' }, { status: 502 });
  }
  const account = result.data?.displayName ?? result.data?.name ?? result.data?.emailAddress ?? 'unknown account';
  return NextResponse.json({ ok: true, account, connectionName: connection.name });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  const action = new URL(req.url).searchParams.get('action');

  if (action === 'test-jira') {
    let body: { jira?: { apiToken?: string } } = {};
    try { body = await req.json(); } catch { /* body is optional */ }
    return testJiraToken(auth as SessionData, body.jira?.apiToken);
  }

  if (action !== 'test') return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });

  // Always bust the module-level cache so env changes take effect.
  invalidateConfig();

  // If the client passed inline SMTP creds (form values), test with those directly
  // rather than whatever is stored in cloud config. This lets users test before saving.
  let body: { smtp?: Partial<AppConfig['smtp']> } = {};
  try { body = await req.json(); } catch { /* body is optional */ }

  let smtpToTest: AppConfig['smtp'];
  if (body.smtp?.host && body.smtp?.user) {
    // Inline creds provided — merge pass from stored config if the form left it blank.
    const stored = await getAppConfig();
    smtpToTest = {
      host: body.smtp.host,
      port: body.smtp.port ?? 587,
      user: body.smtp.user,
      pass: body.smtp.pass?.trim() || stored.smtp.pass,
      from: body.smtp.from ?? stored.smtp.from,
    };
  } else {
    smtpToTest = (await getAppConfig()).smtp;
  }

  const usingResend = !!process.env.RESEND_API_KEY;

  // When Resend is active the password is irrelevant — only the From address matters.
  // When falling back to SMTP, host + user + pass are all required.
  if (!usingResend && (!smtpToTest.host || !smtpToTest.user || !smtpToTest.pass)) {
    return NextResponse.json({ ok: false, skipped: true });
  }

  try {
    const adminEmail = (auth as SessionData).email ?? '';
    const sent = await sendEmailWith(smtpToTest, {
      to:      adminEmail,
      subject: 'Delivery Clarity — email test',
      text:    `This is a test email from Delivery Clarity. Provider: ${usingResend ? 'Resend' : 'SMTP'}.`,
      html:    `<p>This is a <strong>test email</strong> from <strong>Delivery Clarity</strong>.<br>Provider: <code>${usingResend ? 'Resend' : 'SMTP'}</code></p>`,
    });
    return NextResponse.json({ ok: sent, skipped: !sent, provider: usingResend ? 'resend' : 'smtp' });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err ?? '');
    const isResendErr = usingResend || errMsg.toLowerCase().includes('resend');

    const description = isResendErr
      ? {
          message:  'Resend email failed.',
          solution: errMsg.includes('403') || errMsg.includes('401')
            ? 'The RESEND_API_KEY is invalid or expired. Regenerate it at resend.com/api-keys and update the Render environment variable.'
            : errMsg.includes('422')
              ? 'Resend rejected the From address. Use "onboarding@resend.dev" for testing, or verify your own domain at resend.com/domains.'
              : 'Check your RESEND_API_KEY and From address at resend.com, then try again.',
          details: errMsg,
        }
      : describeSmtpErrorDetails(err, smtpToTest);

    return NextResponse.json({
      error:    description.message,
      solution: description.solution,
      details:  description.details,
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
