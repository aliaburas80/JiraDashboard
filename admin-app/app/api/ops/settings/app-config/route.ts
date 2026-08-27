import { NextRequest, NextResponse } from 'next/server';
import {
  getAppConfig,
  getSafeConfig,
  saveToCloud,
  invalidateConfig,
  saveAppUrlSetting,
  type AppConfig,
} from '../../../../../../src/lib/app-config';
import { buildAdminTestEmail, describeSmtpErrorDetails, sendEmailWith } from '../../../../../../src/lib/email';
import { callExternal } from '../../../../../../src/server/gateway/externalGateway';
import { findLatestOrganizationJiraConnection } from '../../../../../../src/server/tenancy/adminOperationalRepository';
import { buildJiraAuthHeader, jiraMyselfPath } from '../../../../../../src/services/jira/auth';
import { requireOwnerAdmin } from '../../../../../lib/adminGuard';
import { safeAdminAudit } from '../../../../../lib/auth';

export async function GET() {
  const guard = await requireOwnerAdmin();
  if (guard instanceof NextResponse) return guard;
  invalidateConfig();
  try {
    const config = await getSafeConfig(guard.admin.id);
    return NextResponse.json({ config, hasEncKey: Boolean(process.env.CONFIG_ENCRYPTION_KEY) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load app config.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const guard = await requireOwnerAdmin();
  if (guard instanceof NextResponse) return guard;
  if (!process.env.CONFIG_ENCRYPTION_KEY) {
    return NextResponse.json({ error: 'CONFIG_ENCRYPTION_KEY is required before saving deployment configuration.' }, { status: 400 });
  }

  let body: Partial<AppConfig> & { smtp?: Partial<AppConfig['smtp']>; jira?: Partial<AppConfig['jira']> };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 }); }

  const existing = await getAppConfig(guard.admin.id);
  const updated: AppConfig = {
    smtp: {
      host: body.smtp?.host?.trim() ?? existing.smtp.host,
      port: body.smtp?.port ?? existing.smtp.port,
      user: body.smtp?.user?.trim() ?? existing.smtp.user,
      pass: body.smtp?.pass?.trim() || existing.smtp.pass,
      from: body.smtp?.from?.trim() ?? existing.smtp.from,
    },
    jira: { apiToken: body.jira?.apiToken?.trim() || existing.jira.apiToken },
    appUrl: body.appUrl?.trim() ?? existing.appUrl,
  };

  let dbSaveError: string | undefined;
  try {
    const { saveSmtpSettings } = await import('../../../../../../src/services/smtp/smtpSettings.service');
    await saveSmtpSettings({
      host: updated.smtp.host,
      port: updated.smtp.port,
      username: updated.smtp.user,
      pass: updated.smtp.pass || undefined,
      fromAddress: updated.smtp.from,
      updatedByUserId: guard.admin.id,
    });
  } catch (error) {
    dbSaveError = error instanceof Error ? error.message : 'Could not save SMTP settings.';
  }

  let appUrlSaveError: string | undefined;
  try {
    await saveAppUrlSetting(updated.appUrl, {
      userId: guard.admin.id,
      isSuperAdmin: true,
      updatedBy: guard.admin.email,
    });
  } catch (error) {
    appUrlSaveError = error instanceof Error ? error.message : 'Could not save App URL.';
  }

  try { await saveToCloud(updated); } catch { /* DB remains primary */ }
  invalidateConfig();

  await safeAdminAudit({
    organizationId: guard.admin.organizationId,
    userId: guard.admin.id,
    eventType: 'admin_config_save',
    eventDescription: `${guard.admin.email} saved deployment configuration from the separate Admin console.`,
    ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? undefined,
    userAgent: req.headers.get('user-agent') ?? undefined,
  });

  return NextResponse.json({ ok: true, dbSaveError: dbSaveError ?? appUrlSaveError });
}

interface JiraMyselfResponse {
  accountId?: string;
  displayName?: string;
  emailAddress?: string;
  name?: string;
}

async function testJira(guard: Exclude<Awaited<ReturnType<typeof requireOwnerAdmin>>, NextResponse>, apiToken?: string) {
  if (!guard.admin.organizationId) {
    return NextResponse.json({ ok: false, skipped: true, error: 'Owner Admin is not assigned to an organization.' }, { status: 409 });
  }

  const connection = await findLatestOrganizationJiraConnection(guard.admin.organizationId);
  if (!connection) return NextResponse.json({ ok: false, skipped: true, error: 'No Jira connection exists for this organization.' });

  const token = apiToken?.trim() || (await getAppConfig(guard.admin.id)).jira.apiToken;
  if (!token) return NextResponse.json({ ok: false, skipped: true, error: 'Enter or save a Jira token before testing.' });
  if (connection.deploymentType === 'cloud' && !connection.authEmail) {
    return NextResponse.json({ ok: false, error: `Connection "${connection.name}" is missing its email address.` }, { status: 409 });
  }

  const result = await callExternal<JiraMyselfResponse>({
    provider: 'jira',
    operation: 'jira.testTokenFromSeparateAdmin',
    method: 'GET',
    path: jiraMyselfPath(connection.deploymentType),
    headers: { Authorization: buildJiraAuthHeader(connection.deploymentType, connection.authEmail, token), Accept: 'application/json' },
    baseUrlOverride: connection.baseUrl,
    credentialsPresentOverride: true,
    userId: guard.admin.id,
    timeoutMs: 15000,
  });

  if (!result.ok) return NextResponse.json({ ok: false, error: result.error ?? 'Connection test failed.' }, { status: 502 });
  const account = result.data?.displayName ?? result.data?.name ?? result.data?.emailAddress ?? 'unknown account';
  return NextResponse.json({ ok: true, account, connectionName: connection.name });
}

export async function POST(req: NextRequest) {
  const guard = await requireOwnerAdmin();
  if (guard instanceof NextResponse) return guard;
  const action = new URL(req.url).searchParams.get('action');

  if (action === 'test-jira') {
    let body: { jira?: { apiToken?: string } } = {};
    try { body = await req.json(); } catch { /* optional */ }
    return testJira(guard, body.jira?.apiToken);
  }

  if (action !== 'test-email') return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  invalidateConfig();

  let body: { smtp?: Partial<AppConfig['smtp']> } = {};
  try { body = await req.json(); } catch { /* optional */ }
  const stored = await getAppConfig(guard.admin.id);
  const smtp = body.smtp?.host && body.smtp?.user
    ? {
        host: body.smtp.host,
        port: body.smtp.port ?? 587,
        user: body.smtp.user,
        pass: body.smtp.pass?.trim() || stored.smtp.pass,
        from: body.smtp.from ?? stored.smtp.from,
      }
    : stored.smtp;

  const usingResend = Boolean(process.env.RESEND_API_KEY);
  if (!usingResend && (!smtp.host || !smtp.user || !smtp.pass)) {
    return NextResponse.json({ ok: false, skipped: true, error: 'SMTP configuration is incomplete.' });
  }

  try {
    const provider = usingResend ? 'Resend' : 'SMTP';
    const template = buildAdminTestEmail(provider, stored.appUrl || 'https://deliveryclarity.app');
    const sent = await sendEmailWith(smtp, {
      to: guard.admin.email,
      ...template,
    });
    return NextResponse.json({ ok: sent, provider: usingResend ? 'resend' : 'smtp' });
  } catch (error) {
    const details = describeSmtpErrorDetails(error, smtp);
    return NextResponse.json({ error: details.message, solution: details.solution, details: details.details }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
