// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Email dispatch with two-provider strategy:
//   1. Resend HTTP API  (RESEND_API_KEY env var set)
//   2. SMTP via nodemailer (fallback)
//
// Every HTML email is built through the same Delivery Clarity light template
// so transactional, operational, support and test messages have one visual
// standard before public launch.

import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { setDefaultResultOrder } from 'node:dns';
import { resolve4 } from 'node:dns/promises';
import { getAppConfig, type AppSmtpConfig } from './app-config';

setDefaultResultOrder('ipv4first');

interface EmailOptions {
  to:      string;
  toName?: string;
  subject: string;
  text:    string;
  html?:   string;
}

interface SmtpErrorDescription {
  message:  string;
  solution: string;
  details?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface BrandedEmailAction {
  label: string;
  href: string;
}

interface BrandedEmailDetail {
  label: string;
  value: string;
  mono?: boolean;
}

interface BrandedEmailOptions {
  title: string;
  eyebrow?: string;
  heading: string;
  userName: string;
  body: string[];
  details?: BrandedEmailDetail[];
  callout?: { title: string; body: string };
  primaryAction?: BrandedEmailAction;
  secondaryAction?: BrandedEmailAction;
  footerReason?: string;
}

function buildTextEmail(options: BrandedEmailOptions): string {
  return [
    'Delivery Clarity',
    options.title,
    '',
    `Hi ${options.userName},`,
    '',
    ...options.body.flatMap((paragraph) => [paragraph, '']),
    ...(options.details?.length
      ? [...options.details.map((detail) => `${detail.label}: ${detail.value}`), '']
      : []),
    ...(options.callout ? [options.callout.title, options.callout.body, ''] : []),
    ...(options.primaryAction ? [`${options.primaryAction.label}: ${options.primaryAction.href}`, ''] : []),
    ...(options.secondaryAction ? [`${options.secondaryAction.label}: ${options.secondaryAction.href}`, ''] : []),
    'Need help? support@deliveryclarity.app',
    '',
    '— Delivery Clarity',
  ].join('\n').trim();
}

function buildBrandedEmailHtml(options: BrandedEmailOptions): string {
  const esc = escapeHtml;
  const body = options.body
    .map((paragraph) => `<p style="margin:18px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:25px;color:#334155;">${esc(paragraph)}</p>`)
    .join('');

  const eyebrow = options.eyebrow
    ? `<p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:#2563eb;">${esc(options.eyebrow)}</p>`
    : '';

  const detailRows = options.details?.length
    ? options.details.map((detail, index) => `
      <tr>
        <td style="padding:11px 14px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:#64748b;vertical-align:top;white-space:nowrap;${index < options.details!.length - 1 ? 'border-bottom:1px solid #e2e8f0;' : ''}">${esc(detail.label)}</td>
        <td style="padding:11px 14px;font-family:${detail.mono ? 'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace' : 'Arial,Helvetica,sans-serif'};font-size:14px;font-weight:${detail.mono ? '700' : '600'};line-height:21px;color:#0f172a;overflow-wrap:anywhere;${index < options.details!.length - 1 ? 'border-bottom:1px solid #e2e8f0;' : ''}">${esc(detail.value)}</td>
      </tr>`).join('')
    : '';

  const details = detailRows
    ? `
    <table role="presentation" style="width:100%;margin:22px 0 0;border-collapse:separate;border-spacing:0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
      ${detailRows}
    </table>`
    : '';

  const callout = options.callout
    ? `
    <div style="margin:22px 0 0;padding:16px 18px;border-radius:10px;background:#eff6ff;border:1px solid #bfdbfe;">
      <p style="margin:0 0 5px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:800;color:#0f172a;">${esc(options.callout.title)}</p>
      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#475569;">${esc(options.callout.body)}</p>
    </div>`
    : '';

  const primaryAction = options.primaryAction
    ? `<a href="${esc(options.primaryAction.href)}" style="display:inline-block;background:#2563eb;color:#ffffff;padding:13px 24px;border-radius:8px;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:800;">${esc(options.primaryAction.label)} →</a>`
    : '';

  const secondaryAction = options.secondaryAction
    ? `<p style="margin:17px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#64748b;"><a href="${esc(options.secondaryAction.href)}" style="color:#2563eb;text-decoration:underline;">${esc(options.secondaryAction.label)}</a></p>`
    : '';

  return `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#0f172a;background:#ffffff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 8px 24px rgba(15,23,42,.06);">
  <div style="background:linear-gradient(135deg,#2563eb 0%,#0891b2 100%);padding:26px 28px;">
    <h1 style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:28px;color:#ffffff;font-weight:800;letter-spacing:-.02em;">Delivery Clarity</h1>
    <p style="margin:5px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#dbeafe;">${esc(options.title)}</p>
  </div>
  <div style="padding:30px 28px;">
    ${eyebrow}
    <h2 style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:28px;line-height:35px;font-weight:800;letter-spacing:-.035em;color:#0f172a;">${esc(options.heading)}</h2>
    <p style="margin:20px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:25px;color:#334155;">Hi <strong>${esc(options.userName)}</strong>,</p>
    ${body}
    ${details}
    ${callout}
    ${(primaryAction || secondaryAction) ? `<div style="margin:24px 0 0;">${primaryAction}${secondaryAction}</div>` : ''}
  </div>
  <div style="padding:18px 28px;border-top:1px solid #e2e8f0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:19px;color:#64748b;">
    <p style="margin:0 0 7px;">${esc(options.footerReason ?? 'This is an automated Delivery Clarity message related to your account or product activity.')}</p>
    <p style="margin:0;">Need help? <a href="mailto:support@deliveryclarity.app" style="color:#2563eb;text-decoration:underline;">support@deliveryclarity.app</a></p>
    <p style="margin:12px 0 0;color:#94a3b8;">© ${new Date().getFullYear()} Delivery Clarity</p>
  </div>
</div>`.trim();
}

function buildBrandedEmail(options: BrandedEmailOptions): Pick<EmailOptions, 'text' | 'html'> {
  return {
    text: buildTextEmail(options),
    html: buildBrandedEmailHtml(options),
  };
}

interface ResendErrorBody { message?: string; name?: string; }

async function sendViaResend(from: string, opts: EmailOptions): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const to = opts.toName ? `${opts.toName} <${opts.to}>` : opts.to;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject: opts.subject, html: opts.html ?? opts.text, text: opts.text }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as ResendErrorBody;
    throw new Error(`Resend ${res.status}: ${body.message ?? body.name ?? 'unknown error'}`);
  }
  return true;
}

async function resolveSmtpHost(host: string): Promise<string> {
  try {
    const [address] = await resolve4(host);
    return address ?? host;
  } catch {
    return host;
  }
}

async function createSmtpTransporter(smtp: AppSmtpConfig) {
  const effectivePort = smtp.port === 465 ? 587 : smtp.port;
  const resolvedHost = await resolveSmtpHost(smtp.host);
  const options: SMTPTransport.Options = {
    host: resolvedHost,
    port: effectivePort,
    secure: false,
    auth: { user: smtp.user, pass: smtp.pass },
    tls: { servername: smtp.host },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
  };
  return nodemailer.createTransport(options);
}

export function describeSmtpErrorDetails(err: unknown, smtp?: AppSmtpConfig): SmtpErrorDescription {
  const message = err instanceof Error ? err.message : String(err ?? 'Unknown SMTP error');
  const code = typeof err === 'object' && err && 'code' in err ? String((err as { code?: unknown }).code ?? '') : '';
  const responseCode = typeof err === 'object' && err && 'responseCode' in err
    ? Number((err as { responseCode?: unknown }).responseCode)
    : undefined;
  const response = typeof err === 'object' && err && 'response' in err ? String((err as { response?: unknown }).response ?? '') : '';
  const combined = `${code} ${responseCode ?? ''} ${response} ${message}`.toLowerCase();
  const isGmail = smtp?.host?.toLowerCase() === 'smtp.gmail.com' || smtp?.user?.toLowerCase().endsWith('@gmail.com');

  if (isGmail && (responseCode === 535 || combined.includes('535') || combined.includes('invalid login') || combined.includes('application-specific password'))) {
    return {
      message: 'Gmail rejected the SMTP login.',
      solution: 'Generate a new 16-character Google App Password, paste it into Admin > App Config > Password, then click Send Test Email again. Do not use your normal Google password.',
      details: 'This commonly happens when the old App Password was revoked, expired, copied with spaces, or the Google account no longer allows SMTP app access.',
    };
  }

  if (combined.includes('eauth') || combined.includes('authentication')) {
    return {
      message: 'SMTP authentication failed.',
      solution: 'Check the SMTP username and password, then send a test email again. If this is Gmail, use a Google App Password instead of your normal account password.',
      details: message,
    };
  }

  if (combined.includes('etimedout') || combined.includes('timeout')) {
    return {
      message: 'SMTP connection timed out.',
      solution: 'Check whether your hosting platform permits outbound SMTP on port 587, or configure the Resend HTTP provider instead.',
      details: message,
    };
  }

  return {
    message: 'SMTP test failed.',
    solution: 'Review the SMTP host, port, username, password, and From address, then try Send Test Email again.',
    details: message,
  };
}

export function describeSmtpError(err: unknown, smtp?: AppSmtpConfig): string {
  const description = describeSmtpErrorDetails(err, smtp);
  return `${description.message} ${description.solution}`.trim();
}

export async function sendEmailWith(smtp: AppSmtpConfig, opts: EmailOptions): Promise<boolean> {
  if (process.env.RESEND_API_KEY) {
    return sendViaResend(smtp.from || opts.to, opts);
  }
  if (!smtp.host || !smtp.user || !smtp.pass) return false;
  const transporter = await createSmtpTransporter(smtp);
  await transporter.sendMail({
    from: smtp.from,
    to: opts.toName ? `${opts.toName} <${opts.to}>` : opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });
  return true;
}

export async function sendEmail(opts: EmailOptions): Promise<boolean> {
  const cfg = await getAppConfig();
  const smtp = cfg.smtp;

  if (process.env.RESEND_API_KEY) {
    return sendViaResend(smtp.from || opts.to, opts);
  }

  if (!smtp.host || !smtp.user || !smtp.pass) {
    console.warn(`[email] SMTP not configured — skipping email to ${opts.to}`);
    return false;
  }

  const transporter = await createSmtpTransporter(smtp);
  await transporter.sendMail({
    from: smtp.from,
    to: opts.toName ? `${opts.toName} <${opts.to}>` : opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });
  return true;
}

export interface DemoRequestDetails {
  name: string;
  email: string;
  organization: string;
  role: string;
  need: string;
  justification: string;
  submittedAt: string;
}

export function buildDemoRequestEmail(details: DemoRequestDetails): Pick<EmailOptions, 'subject' | 'text' | 'html'> {
  const content = buildBrandedEmail({
    title: 'New demo request',
    eyebrow: 'Demo request',
    heading: 'A new team wants to try Delivery Clarity',
    userName: 'Delivery Clarity team',
    body: ['A visitor submitted the public demo form. Review the details below and follow up directly.'],
    details: [
      { label: 'Name', value: details.name },
      { label: 'Work email', value: details.email },
      { label: 'Organization', value: details.organization },
      { label: 'Role', value: details.role },
      { label: 'What they need', value: details.need },
      { label: 'Why / justification', value: details.justification },
      { label: 'Submitted', value: details.submittedAt },
    ],
    primaryAction: { label: `Reply to ${details.name}`, href: `mailto:${details.email}` },
    footerReason: 'Automated message generated by the public Delivery Clarity demo form.',
  });
  return { subject: `Demo request — ${details.name} (${details.organization})`, ...content };
}

export interface FeedbackNotificationDetails {
  category: string;
  message: string;
  impactLevel: string;
  page?: string;
  browserFamily?: string;
  userEmail?: string;
  submittedAt: string;
}

export function buildFeedbackNotificationEmail(details: FeedbackNotificationDetails): Pick<EmailOptions, 'subject' | 'text' | 'html'> {
  const content = buildBrandedEmail({
    title: 'New feedback',
    eyebrow: 'Product feedback',
    heading: 'New Delivery Clarity feedback',
    userName: 'Delivery Clarity team',
    body: ['A user submitted feedback from the product. The Feedback table remains the source of truth.'],
    details: [
      { label: 'Category', value: details.category },
      { label: 'Impact', value: details.impactLevel },
      { label: 'Page', value: details.page ?? '—' },
      { label: 'Browser', value: details.browserFamily ?? '—' },
      { label: 'Reply-to', value: details.userEmail ?? '(not provided)' },
      { label: 'Submitted', value: details.submittedAt },
    ],
    callout: { title: 'Message', body: details.message },
    footerReason: 'Automated message generated by the in-app Delivery Clarity feedback button. View all feedback in Admin → Feedback.',
  });
  return { subject: `New feedback: ${details.category} (${details.impactLevel})`, ...content };
}

export function buildWelcomeEmail(
  name: string,
  email: string,
  tempPassword: string,
  appUrl: string,
): Pick<EmailOptions, 'subject' | 'text' | 'html'> {
  const content = buildBrandedEmail({
    title: 'Your account is ready',
    heading: 'Welcome to Delivery Clarity',
    userName: name,
    body: [
      'Your Delivery Clarity account has been created. Use the credentials below to sign in for the first time.',
      'After logging in, you will be required to set a new permanent password before accessing the dashboard.',
    ],
    details: [
      { label: 'Email', value: email },
      { label: 'Temporary password', value: tempPassword, mono: true },
    ],
    primaryAction: { label: 'Log in now', href: `${appUrl}/login` },
    footerReason: 'You are receiving this email because a Delivery Clarity account was created for you.',
  });
  return { subject: 'Welcome to Delivery Clarity — Your Account is Ready', ...content };
}

export function buildVerificationEmail(
  name: string,
  email: string,
  token: string,
  appUrl: string,
): Pick<EmailOptions, 'subject' | 'text' | 'html'> {
  const verifyUrl = `${appUrl}/verify-email?token=${token}`;
  const content = buildBrandedEmail({
    title: 'Verify your email address',
    heading: 'Verify your email',
    userName: name,
    body: [
      `Thanks for creating a Delivery Clarity account for ${email}. Verify your email address to start uploading data.`,
      'The verification link expires in 24 hours.',
    ],
    callout: { title: 'Didn’t create this account?', body: 'You can safely ignore this email.' },
    primaryAction: { label: 'Verify email', href: verifyUrl },
    footerReason: 'You are receiving this email because this address was used to create a Delivery Clarity account.',
  });
  return { subject: 'Verify your email — Delivery Clarity', ...content };
}

export function buildVerificationThankYouEmail(name: string): Pick<EmailOptions, 'subject' | 'text' | 'html'> {
  const content = buildBrandedEmail({
    title: 'Email verified',
    heading: 'Your email is verified',
    userName: name,
    body: [
      'Thanks for verifying your email address — your Delivery Clarity account is fully active now.',
      'You can sign in any time and start uploading data.',
    ],
    footerReason: 'You are receiving this email because your Delivery Clarity email verification completed successfully.',
  });
  return { subject: 'Email verified — Delivery Clarity', ...content };
}

export function buildPasswordResetEmail(
  name: string,
  token: string,
  appUrl: string,
): Pick<EmailOptions, 'subject' | 'text' | 'html'> {
  const resetUrl = `${appUrl}/reset-password?token=${token}`;
  const content = buildBrandedEmail({
    title: 'Reset your password',
    heading: 'Reset your Delivery Clarity password',
    userName: name,
    body: ['We received a request to reset your Delivery Clarity password. Click below to choose a new one.'],
    callout: {
      title: 'This link expires in 1 hour',
      body: 'If you did not request this, you can safely ignore this email — your password will not be changed.',
    },
    primaryAction: { label: 'Reset password', href: resetUrl },
    footerReason: 'You are receiving this email because a password reset was requested for your Delivery Clarity account.',
  });
  return { subject: 'Reset your password — Delivery Clarity', ...content };
}

interface UserEmailBase {
  userName: string;
  appUrl: string;
}

export function buildPasswordChangedEmail(
  userName: string,
  appUrl: string,
): Pick<EmailOptions, 'subject' | 'text' | 'html'> {
  const content = buildBrandedEmail({
    title: 'Password changed',
    eyebrow: 'Account security',
    heading: 'Your password was changed',
    userName,
    body: [
      'This is a quick confirmation that your Delivery Clarity password was changed successfully.',
      'If you made this change, no further action is needed.',
    ],
    callout: { title: 'Wasn’t you?', body: 'Contact support right away so we can help protect your account.' },
    primaryAction: { label: 'Go to sign in', href: `${appUrl}/login` },
    secondaryAction: { label: 'Contact support', href: 'mailto:support@deliveryclarity.app' },
    footerReason: 'You are receiving this email because your Delivery Clarity account password changed.',
  });
  return { subject: 'Your Delivery Clarity password was changed', ...content };
}

export interface UploadSuccessEmailDetails extends UserEmailBase {
  fileName: string;
}

export function buildUploadSuccessEmail(details: UploadSuccessEmailDetails): Pick<EmailOptions, 'subject' | 'text' | 'html'> {
  const content = buildBrandedEmail({
    title: 'Upload complete',
    heading: 'Your Jira export was uploaded',
    userName: details.userName,
    body: [
      `We received ${details.fileName} and Delivery Clarity is ready to turn it into flow, delivery, and quality signals.`,
      'You can review the dashboard now or continue with your next export.',
    ],
    callout: { title: 'Next step', body: 'Open your workspace to review the latest imported data and analysis views.' },
    primaryAction: { label: 'Open your workspace', href: details.appUrl },
    secondaryAction: { label: 'View delivery mix', href: `${details.appUrl}/delivery-mix` },
  });
  return { subject: 'Your Jira export was uploaded', ...content };
}

export interface UploadFailedEmailDetails extends UserEmailBase {
  fileName: string;
  errorMessage: string;
}

export function buildUploadFailedEmail(details: UploadFailedEmailDetails): Pick<EmailOptions, 'subject' | 'text' | 'html'> {
  const content = buildBrandedEmail({
    title: 'Upload needs attention',
    eyebrow: 'Import status',
    heading: 'Your Jira export could not be processed',
    userName: details.userName,
    body: [
      `We tried to process ${details.fileName}, but the import did not complete.`,
      'Please review the file and try the upload again. If the problem repeats, send the file details to support.',
    ],
    callout: { title: 'Error details', body: details.errorMessage },
    primaryAction: { label: 'Try upload again', href: details.appUrl },
    secondaryAction: { label: 'Contact support', href: 'mailto:support@deliveryclarity.app' },
  });
  return { subject: 'Your Jira export upload needs attention', ...content };
}

export type AnalysisReadyEmailDetails = UserEmailBase;

export function buildAnalysisReadyEmail(details: AnalysisReadyEmailDetails): Pick<EmailOptions, 'subject' | 'text' | 'html'> {
  const content = buildBrandedEmail({
    title: 'Analysis ready',
    heading: 'Your Delivery Clarity analysis is ready',
    userName: details.userName,
    body: [
      'Your Jira export has been processed and the dashboard is ready for review.',
      'Start with the delivery mix and flow health views to see where work is moving cleanly and where it may need attention.',
    ],
    callout: { title: 'Look for', body: 'Cycle time, blocker patterns, delivery mix, and the signals that explain what your Jira export is really telling you.' },
    primaryAction: { label: 'Open analysis', href: `${details.appUrl}/delivery-mix` },
    secondaryAction: { label: 'Back to dashboard', href: `${details.appUrl}/dashboard` },
  });
  return { subject: 'Your Delivery Clarity analysis is ready', ...content };
}

export interface FeedbackReceivedEmailDetails extends UserEmailBase {
  feedbackSummary: string;
}

export function buildFeedbackReceivedEmail(details: FeedbackReceivedEmailDetails): Pick<EmailOptions, 'subject' | 'text' | 'html'> {
  const content = buildBrandedEmail({
    title: 'Feedback received',
    eyebrow: 'Product feedback',
    heading: 'We received your feedback',
    userName: details.userName,
    body: [
      'Thank you for taking the time to send feedback during the Delivery Clarity soft launch.',
      'We read every submission and use it to improve the product workflow, analysis, and onboarding.',
    ],
    callout: { title: 'Your feedback', body: details.feedbackSummary },
    primaryAction: { label: 'Back to dashboard', href: `${details.appUrl}/dashboard` },
    secondaryAction: { label: 'Contact support', href: 'mailto:support@deliveryclarity.app' },
  });
  return { subject: 'We received your Delivery Clarity feedback', ...content };
}

export interface SupportTicketReceivedEmailDetails extends UserEmailBase {
  supportReference: string;
}

export function buildSupportTicketReceivedEmail(details: SupportTicketReceivedEmailDetails): Pick<EmailOptions, 'subject' | 'text' | 'html'> {
  const content = buildBrandedEmail({
    title: 'Support request received',
    eyebrow: 'Support',
    heading: 'Your support request is in',
    userName: details.userName,
    body: [
      'We received your Delivery Clarity support request and will follow up as soon as possible.',
      'Keep the reference below handy if you reply with more context.',
    ],
    callout: { title: 'Support reference', body: details.supportReference },
    primaryAction: { label: 'Return to Delivery Clarity', href: details.appUrl },
    secondaryAction: { label: 'Contact support', href: 'mailto:support@deliveryclarity.app' },
  });
  return { subject: 'Delivery Clarity support request received', ...content };
}

export type PrivateTestInviteEmailDetails = UserEmailBase;

export function buildPrivateTestInviteEmail(details: PrivateTestInviteEmailDetails): Pick<EmailOptions, 'subject' | 'text' | 'html'> {
  const content = buildBrandedEmail({
    title: 'Private test invitation',
    eyebrow: 'Soft launch',
    heading: 'You are invited to test Delivery Clarity',
    userName: details.userName,
    body: [
      'We are opening Delivery Clarity to a small group of testers before the wider launch.',
      'Your feedback will help shape the Jira export workflow, dashboards, and the analysis language teams see first.',
    ],
    callout: { title: 'Private test scope', body: 'Upload a Jira CSV or spreadsheet, review the dashboard, and tell us where the product is clear or confusing.' },
    primaryAction: { label: 'Open private test', href: `${details.appUrl}/login` },
    secondaryAction: { label: 'Upload a sheet', href: details.appUrl },
  });
  return { subject: 'You are invited to test Delivery Clarity', ...content };
}

export type WorkspaceReadyEmailDetails = UserEmailBase;

export function buildWorkspaceReadyEmail(details: WorkspaceReadyEmailDetails): Pick<EmailOptions, 'subject' | 'text' | 'html'> {
  const content = buildBrandedEmail({
    title: 'Workspace ready',
    heading: 'Your Delivery Clarity workspace is ready',
    userName: details.userName,
    body: [
      'Your workspace is set up and ready for your Jira export.',
      'Once you upload a CSV or spreadsheet, Delivery Clarity will prepare the dashboard and delivery mix views.',
    ],
    callout: { title: 'Recommended first action', body: 'Upload your most recent Jira export so the workspace can show real delivery signals instead of sample data.' },
    primaryAction: { label: 'Open your workspace', href: details.appUrl },
    secondaryAction: { label: 'Back to dashboard', href: `${details.appUrl}/dashboard` },
  });
  return { subject: 'Your Delivery Clarity workspace is ready', ...content };
}

export function buildAdminTestEmail(
  provider: string,
  appUrl = 'https://deliveryclarity.app',
): Pick<EmailOptions, 'subject' | 'text' | 'html'> {
  const normalizedProvider = provider.trim() || 'configured provider';
  const content = buildBrandedEmail({
    title: 'Email test',
    eyebrow: 'Admin settings',
    heading: 'Delivery Clarity email test passed',
    userName: 'Admin',
    body: ['This test confirms that Delivery Clarity can send transactional email using the current configuration.'],
    callout: { title: 'Provider', body: normalizedProvider },
    primaryAction: { label: 'Open Delivery Clarity', href: appUrl },
    footerReason: 'You are receiving this email because an Owner Admin ran an email test from Delivery Clarity settings.',
  });
  return { subject: 'Delivery Clarity — email test', ...content };
}
