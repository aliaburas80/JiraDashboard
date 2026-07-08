// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Email dispatch with two-provider strategy:
//   1. Resend HTTP API  (RESEND_API_KEY env var set)  — works on Render free tier;
//      Render blocks outbound SMTP ports 465/587 making raw SMTP impossible there.
//   2. SMTP via nodemailer (fallback)                 — used in local dev and on
//      any host that allows outbound 587/STARTTLS.
//
// Provider selection is automatic: set RESEND_API_KEY on production, omit it
// locally to keep using SMTP from .env.

import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { setDefaultResultOrder } from 'node:dns';
import { resolve4 } from 'node:dns/promises';
import { getAppConfig, type AppSmtpConfig } from './app-config';

// Still set IPv4-first as a safety net for any remaining outbound connections
// (e.g. Jira, external APIs) that run through this Node process.
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

// Shared across every build*Email function — any value that did not
// originate on the server (name, email, free-text message, etc.) must be
// escaped before interpolation into an HTML email body.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function emailLogoUrl(appUrl: string): string {
  return `${appUrl.replace(/\/+$/, '')}/logo/delivery_clarity_mark_128.png`;
}

interface BrandedEmailAction {
  label: string;
  href: string;
}

interface BrandedEmailOptions {
  appUrl: string;
  title: string;
  eyebrow?: string;
  heading: string;
  userName: string;
  body: string[];
  callout?: { title: string; body: string };
  primaryAction?: BrandedEmailAction;
  secondaryAction?: BrandedEmailAction;
  footerReason?: string;
}

function buildTextEmail(options: BrandedEmailOptions): string {
  return [
    options.title,
    '',
    `Hi ${options.userName},`,
    '',
    ...options.body.flatMap((paragraph) => [paragraph, '']),
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
  const logoUrl = emailLogoUrl(options.appUrl);
  const body = options.body
    .map((paragraph) => `<p style="margin:18px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:25px;color:#c8cfdd;">${esc(paragraph)}</p>`)
    .join('');
  const callout = options.callout
    ? `
    <div style="margin:24px 0 0 0;padding:16px 18px;border-radius:16px;background:#111827;border:1px solid #263246;">
      <p style="margin:0 0 6px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#ffffff;">${esc(options.callout.title)}</p>
      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#a7adbd;">${esc(options.callout.body)}</p>
    </div>`
    : '';
  const primaryAction = options.primaryAction
    ? `
      <a href="${esc(options.primaryAction.href)}" style="display:inline-block;background:linear-gradient(135deg,#ff8a4c,#e85d12);color:#190902;padding:14px 22px;border-radius:999px;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;">
        ${esc(options.primaryAction.label)}
      </a>`
    : '';
  const secondaryAction = options.secondaryAction
    ? `<p style="margin:18px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#a7adbd;"><a href="${esc(options.secondaryAction.href)}" style="color:#dce2ff;text-decoration:underline;">${esc(options.secondaryAction.label)}</a></p>`
    : '';

  return `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:0 auto;color:#dce2ff;background:#070b16;border-radius:22px;border:1px solid #1f2a44;overflow:hidden">
  <div style="padding:28px 30px;border-bottom:1px solid #1f2a44;background:#0b1020">
    <table role="presentation" style="border-collapse:collapse;width:100%">
      <tr>
        <td style="width:48px">
          <img src="${esc(logoUrl)}" width="40" height="40" alt="Delivery Clarity logo" style="display:block;width:40px;height:40px;border:0;outline:none;text-decoration:none;">
        </td>
        <td style="font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:800;color:#ffffff;">Delivery Clarity</td>
      </tr>
    </table>
  </div>
  <div style="padding:34px 30px">
    <p style="margin:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#ff9a66;">${esc(options.eyebrow ?? 'Jira export analytics')}</p>
    <h1 style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:32px;line-height:38px;font-weight:800;letter-spacing:-.04em;color:#ffffff;">${esc(options.heading)}</h1>
    <p style="margin:18px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:25px;color:#c8cfdd;">Hi ${esc(options.userName)},</p>
    ${body}
    ${callout}
    <div style="margin:26px 0 0 0">
      ${primaryAction}
      ${secondaryAction}
    </div>
  </div>
  <div style="padding:22px 30px;border-top:1px solid #1f2a44;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:20px;color:#7e879b;background:#070b16">
    <p style="margin:0 0 8px 0;">${esc(options.footerReason ?? 'You are receiving this email because you are using Delivery Clarity during the controlled soft launch.')}</p>
    <p style="margin:0;">Need help? <a href="mailto:support@deliveryclarity.app" style="color:#dce2ff;text-decoration:underline;">support@deliveryclarity.app</a></p>
    <p style="margin:14px 0 0 0;color:#676f82;">© ${new Date().getFullYear()} Delivery Clarity</p>
  </div>
</div>`.trim();
}

function buildBrandedEmail(options: BrandedEmailOptions): Pick<EmailOptions, 'text' | 'html'> {
  return {
    text: buildTextEmail(options),
    html: buildBrandedEmailHtml(options),
  };
}

// ── Resend (HTTPS API — primary for production) ───────────────────────────────

interface ResendErrorBody { message?: string; name?: string; }

async function sendViaResend(from: string, opts: EmailOptions): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const to = opts.toName ? `${opts.toName} <${opts.to}>` : opts.to;
  const res = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ from, to: [to], subject: opts.subject, html: opts.html ?? opts.text, text: opts.text }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as ResendErrorBody;
    throw new Error(`Resend ${res.status}: ${body.message ?? body.name ?? 'unknown error'}`);
  }
  return true;
}

// ── SMTP (nodemailer — fallback for local dev / SMTP-capable hosts) ───────────

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
    host:              resolvedHost,
    port:              effectivePort,
    secure:            false,
    auth:              { user: smtp.user, pass: smtp.pass },
    tls:               { servername: smtp.host },
    connectionTimeout: 15_000,
    greetingTimeout:   15_000,
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
      message:  'Gmail rejected the SMTP login.',
      solution: 'Generate a new 16-character Google App Password, paste it into Admin > App Config > Password, then click Send Test Email again. Do not use your normal Google password.',
      details:  'This commonly happens when the old App Password was revoked, expired, copied with spaces, or the Google account no longer allows SMTP app access.',
    };
  }

  if (combined.includes('eauth') || combined.includes('authentication')) {
    return {
      message:  'SMTP authentication failed.',
      solution: 'Check the SMTP username and password, then send a test email again. If this is Gmail, use a Google App Password instead of your normal account password.',
      details:  message,
    };
  }

  if (combined.includes('etimedout') || combined.includes('timeout')) {
    return {
      message:  'SMTP connection timed out.',
      solution: 'Render free tier blocks outbound SMTP (port 587). Set RESEND_API_KEY in your Render environment to use the Resend HTTP API instead — it works from any PaaS. Get a free key at resend.com.',
      details:  message,
    };
  }

  return {
    message:  'SMTP test failed.',
    solution: 'Review the SMTP host, port, username, password, and From address, then try Send Test Email again.',
    details:  message,
  };
}

export function describeSmtpError(err: unknown, smtp?: AppSmtpConfig): string {
  const description = describeSmtpErrorDetails(err, smtp);
  return `${description.message} ${description.solution}`.trim();
}

// ── Public send functions ─────────────────────────────────────────────────────

// Used by the admin test endpoint — tests the form-supplied SMTP credentials
// directly, or Resend if RESEND_API_KEY is set (SMTP unreachable on Render free).
export async function sendEmailWith(smtp: AppSmtpConfig, opts: EmailOptions): Promise<boolean> {
  // Resend takes priority when the API key is present — SMTP is blocked on Render free.
  if (process.env.RESEND_API_KEY) {
    return sendViaResend(smtp.from || opts.to, opts);
  }
  if (!smtp.host || !smtp.user || !smtp.pass) return false;
  const transporter = await createSmtpTransporter(smtp);
  await transporter.sendMail({
    from:    smtp.from,
    to:      opts.toName ? `${opts.toName} <${opts.to}>` : opts.to,
    subject: opts.subject,
    text:    opts.text,
    html:    opts.html,
  });
  return true;
}

// General-purpose send used by welcome emails, password reset, notifications, etc.
export async function sendEmail(opts: EmailOptions): Promise<boolean> {
  const cfg  = await getAppConfig();
  const smtp = cfg.smtp;

  // Resend takes priority when the API key is present.
  if (process.env.RESEND_API_KEY) {
    return sendViaResend(smtp.from || opts.to, opts);
  }

  if (!smtp.host || !smtp.user || !smtp.pass) {
    console.warn(`[email] SMTP not configured — skipping email to ${opts.to}`);
    return false;
  }

  const transporter = await createSmtpTransporter(smtp);
  await transporter.sendMail({
    from:    smtp.from,
    to:      opts.toName ? `${opts.toName} <${opts.to}>` : opts.to,
    subject: opts.subject,
    text:    opts.text,
    html:    opts.html,
  });
  return true;
}

export interface DemoRequestDetails {
  name:         string;
  email:        string;
  organization: string;
  role:         string;
  need:         string;
  justification: string;
  submittedAt:  string;
}

// Builds the notification email sent to the product owner when a visitor
// submits the public "Request a demo" form on /promo. Plain values are
// HTML-escaped before interpolation to keep the message injection-safe.
export function buildDemoRequestEmail(
  details: DemoRequestDetails,
): Pick<EmailOptions, 'subject' | 'text' | 'html'> {
  const esc = escapeHtml;

  const rows: Array<[string, string]> = [
    ['Name', details.name],
    ['Work email', details.email],
    ['Organization', details.organization],
    ['Role', details.role],
    ['What they need', details.need],
    ['Why / justification', details.justification],
    ['Submitted', details.submittedAt],
  ];

  const text = [
    'New Delivery Clarity demo request',
    '',
    ...rows.map(([label, value]) => `${label}: ${value}`),
    '',
    `Reply directly to ${details.email} to follow up.`,
    '',
    '— Delivery Clarity /promo',
  ].join('\n');

  const tableRows = rows
    .map(
      ([label, value]) => `
      <tr>
        <td style="color:#64748b;padding:10px 14px;font-size:12px;font-weight:600;white-space:nowrap;vertical-align:top;border-bottom:1px solid #e2e8f0">${esc(label)}</td>
        <td style="padding:10px 14px;font-size:14px;border-bottom:1px solid #e2e8f0;white-space:pre-wrap">${esc(value)}</td>
      </tr>`,
    )
    .join('');

  const html = `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1e293b;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden">
  <div style="background:linear-gradient(135deg,#ff8a4c,#e85d12);padding:24px 28px">
    <h1 style="margin:0;font-size:20px;color:#ffffff;font-weight:800;letter-spacing:-0.3px">New demo request</h1>
    <p style="margin:4px 0 0;font-size:13px;color:#ffe6d6">Submitted from the Delivery Clarity promo page</p>
  </div>
  <div style="padding:28px">
    <table style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;width:100%;border-collapse:collapse;margin:0 0 16px">
      ${tableRows}
    </table>
    <a href="mailto:${esc(details.email)}" style="display:inline-block;background:#e85d12;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">
      Reply to ${esc(details.name)} →
    </a>
    <p style="font-size:11px;color:#94a3b8;margin-top:28px;padding-top:16px;border-top:1px solid #f1f5f9">
      Automated message from Delivery Clarity — generated by the public /promo demo form.
    </p>
  </div>
</div>`.trim();

  return { subject: `Demo request — ${details.name} (${details.organization})`, text, html };
}

export interface FeedbackNotificationDetails {
  category:       string;
  message:        string;
  impactLevel:    string;
  page?:          string;
  browserFamily?: string;
  userEmail?:     string;
  submittedAt:    string;
}

// Notifies the support inbox whenever a user submits feedback via the
// in-app FeedbackButton (POST /api/feedback). The feedback itself is
// already durably stored in the Feedback table — this is a best-effort
// side notification, not the source of truth, so a failed send here must
// never fail the feedback submission itself (see the calling route).
export function buildFeedbackNotificationEmail(
  details: FeedbackNotificationDetails,
): Pick<EmailOptions, 'subject' | 'text' | 'html'> {
  const esc = escapeHtml;

  const rows: Array<[string, string]> = [
    ['Category', details.category],
    ['Impact', details.impactLevel],
    ['Page', details.page ?? '—'],
    ['Browser', details.browserFamily ?? '—'],
    ['Reply-to', details.userEmail ?? '(not provided)'],
    ['Submitted', details.submittedAt],
  ];

  const text = [
    'New Delivery Clarity feedback',
    '',
    ...rows.map(([label, value]) => `${label}: ${value}`),
    '',
    'Message:',
    details.message,
    '',
    '— Delivery Clarity FeedbackButton',
  ].join('\n');

  const tableRows = rows
    .map(
      ([label, value]) => `
      <tr>
        <td style="color:#64748b;padding:10px 14px;font-size:12px;font-weight:600;white-space:nowrap;vertical-align:top;border-bottom:1px solid #e2e8f0">${esc(label)}</td>
        <td style="padding:10px 14px;font-size:14px;border-bottom:1px solid #e2e8f0;white-space:pre-wrap">${esc(value)}</td>
      </tr>`,
    )
    .join('');

  const html = `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1e293b;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden">
  <div style="background:linear-gradient(135deg,#2563eb,#0891b2);padding:24px 28px">
    <h1 style="margin:0;font-size:20px;color:#ffffff;font-weight:800;letter-spacing:-0.3px">New feedback</h1>
    <p style="margin:4px 0 0;font-size:13px;color:#bfdbfe">Submitted from the Delivery Clarity feedback button</p>
  </div>
  <div style="padding:28px">
    <table style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;width:100%;border-collapse:collapse;margin:0 0 16px">
      ${tableRows}
    </table>
    <p style="font-size:12px;font-weight:700;color:#64748b;margin:0 0 6px;text-transform:uppercase;letter-spacing:.04em">Message</p>
    <p style="font-size:14px;white-space:pre-wrap;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px">${esc(details.message)}</p>
    <p style="font-size:11px;color:#94a3b8;margin-top:28px;padding-top:16px;border-top:1px solid #f1f5f9">
      Automated message from Delivery Clarity — generated by the in-app feedback button. View all feedback in Admin → Feedback.
    </p>
  </div>
</div>`.trim();

  return { subject: `New feedback: ${details.category} (${details.impactLevel})`, text, html };
}

export function buildWelcomeEmail(
  name:         string,
  email:        string,
  tempPassword: string,
  appUrl:       string,
): Pick<EmailOptions, 'subject' | 'text' | 'html'> {
  const loginUrl = `${appUrl}/login`;

  const text = [
    `Hi ${name},`,
    '',
    'Your Delivery Clarity account has been created.',
    '',
    `Email:              ${email}`,
    `Temporary password: ${tempPassword}`,
    '',
    `Log in at ${loginUrl} — you will be required to change your password on first login.`,
    '',
    '— Delivery Clarity',
  ].join('\n');

  const html = `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1e293b;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden">
  <div style="background:linear-gradient(135deg,#2563eb,#0891b2);padding:24px 28px">
    <h1 style="margin:0;font-size:20px;color:#ffffff;font-weight:800;letter-spacing:-0.3px">Delivery Clarity</h1>
    <p style="margin:4px 0 0;font-size:13px;color:#bfdbfe">Your account is ready</p>
  </div>
  <div style="padding:28px">
    <p style="margin-top:0">Hi <strong>${escapeHtml(name)}</strong>,</p>
    <p>Your account has been created. Use the credentials below to log in for the first time.</p>
    <table style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;width:100%;border-collapse:collapse;margin:16px 0">
      <tr>
        <td style="color:#64748b;padding:10px 14px;font-size:12px;font-weight:600;white-space:nowrap;border-bottom:1px solid #e2e8f0">Email</td>
        <td style="padding:10px 14px;font-weight:600;border-bottom:1px solid #e2e8f0">${escapeHtml(email)}</td>
      </tr>
      <tr>
        <td style="color:#64748b;padding:10px 14px;font-size:12px;font-weight:600;white-space:nowrap">Temporary password</td>
        <td style="padding:10px 14px;font-weight:700;font-family:monospace;font-size:15px;letter-spacing:.8px;color:#1e40af">${tempPassword}</td>
      </tr>
    </table>
    <p style="margin-bottom:20px;font-size:13px;color:#475569">After logging in, you will be asked to set a new permanent password before accessing the dashboard.</p>
    <a href="${loginUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">
      Log In Now →
    </a>
    <p style="font-size:11px;color:#94a3b8;margin-top:28px;padding-top:16px;border-top:1px solid #f1f5f9">
      This is an automated message from Delivery Clarity — please do not reply.<br>
      If you did not expect this email, contact your administrator.
    </p>
  </div>
</div>`.trim();

  return { subject: 'Welcome to Delivery Clarity — Your Account is Ready', text, html };
}

// EP-012: sent on self-registration. Clicking the link calls POST /api/auth/verify-email,
// which flips User.emailVerified and clears the token. Uploads are blocked until then.
export function buildVerificationEmail(
  name:        string,
  email:       string,
  token:       string,
  appUrl:      string,
): Pick<EmailOptions, 'subject' | 'text' | 'html'> {
  const verifyUrl = `${appUrl}/verify-email?token=${token}`;

  const text = [
    `Hi ${name},`,
    '',
    'Thanks for creating a Delivery Clarity account. Please verify your email address to start uploading data:',
    '',
    verifyUrl,
    '',
    'This link expires in 24 hours. If you did not create this account, you can ignore this email.',
    '',
    '— Delivery Clarity',
  ].join('\n');

  const html = `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1e293b;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden">
  <div style="background:linear-gradient(135deg,#2563eb,#0891b2);padding:24px 28px">
    <h1 style="margin:0;font-size:20px;color:#ffffff;font-weight:800;letter-spacing:-0.3px">Delivery Clarity</h1>
    <p style="margin:4px 0 0;font-size:13px;color:#bfdbfe">Verify your email address</p>
  </div>
  <div style="padding:28px">
    <p style="margin-top:0">Hi <strong>${escapeHtml(name)}</strong>,</p>
    <p>Thanks for creating a Delivery Clarity account for <strong>${escapeHtml(email)}</strong>. Please verify your email address to start uploading data.</p>
    <a href="${verifyUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;margin:8px 0 20px">
      Verify Email →
    </a>
    <p style="font-size:13px;color:#475569">This link expires in 24 hours.</p>
    <p style="font-size:11px;color:#94a3b8;margin-top:28px;padding-top:16px;border-top:1px solid #f1f5f9">
      If you did not create this account, you can safely ignore this email.
    </p>
  </div>
</div>`.trim();

  return { subject: 'Verify your email — Delivery Clarity', text, html };
}

// Sent once, right after a successful POST /api/auth/verify-email — not on a
// replay of an already-verified link (see the calling route's alreadyVerified
// check).
export function buildVerificationThankYouEmail(
  name: string,
): Pick<EmailOptions, 'subject' | 'text' | 'html'> {
  const text = [
    `Hi ${name},`,
    '',
    'Thanks for verifying your email address — your Delivery Clarity account is fully active now.',
    '',
    'You can sign in any time and start uploading data.',
    '',
    '— Delivery Clarity',
  ].join('\n');

  const html = `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1e293b;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden">
  <div style="background:linear-gradient(135deg,#2563eb,#0891b2);padding:24px 28px">
    <h1 style="margin:0;font-size:20px;color:#ffffff;font-weight:800;letter-spacing:-0.3px">Delivery Clarity</h1>
    <p style="margin:4px 0 0;font-size:13px;color:#bfdbfe">Email verified</p>
  </div>
  <div style="padding:28px">
    <p style="margin-top:0">Hi <strong>${escapeHtml(name)}</strong>,</p>
    <p>Thanks for verifying your email address — your account is fully active now.</p>
    <p style="font-size:13px;color:#475569">You can sign in any time and start uploading data.</p>
  </div>
</div>`.trim();

  return { subject: 'Email verified — Delivery Clarity', text, html };
}

// EP-013: sent when a user requests a password reset. Clicking the link lands on
// /reset-password, which calls POST /api/auth/reset-password to consume the token.
export function buildPasswordResetEmail(
  name:   string,
  token:  string,
  appUrl: string,
): Pick<EmailOptions, 'subject' | 'text' | 'html'> {
  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  const text = [
    `Hi ${name},`,
    '',
    'We received a request to reset your Delivery Clarity password. Click the link below to choose a new one:',
    '',
    resetUrl,
    '',
    'This link expires in 1 hour. If you did not request this, you can safely ignore this email — your password will not be changed.',
    '',
    '— Delivery Clarity',
  ].join('\n');

  const html = `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1e293b;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden">
  <div style="background:linear-gradient(135deg,#2563eb,#0891b2);padding:24px 28px">
    <h1 style="margin:0;font-size:20px;color:#ffffff;font-weight:800;letter-spacing:-0.3px">Delivery Clarity</h1>
    <p style="margin:4px 0 0;font-size:13px;color:#bfdbfe">Reset your password</p>
  </div>
  <div style="padding:28px">
    <p style="margin-top:0">Hi <strong>${escapeHtml(name)}</strong>,</p>
    <p>We received a request to reset your Delivery Clarity password. Click below to choose a new one.</p>
    <a href="${resetUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;margin:8px 0 20px">
      Reset Password →
    </a>
    <p style="font-size:13px;color:#475569">This link expires in 1 hour.</p>
    <p style="font-size:11px;color:#94a3b8;margin-top:28px;padding-top:16px;border-top:1px solid #f1f5f9">
      If you did not request this, you can safely ignore this email — your password will not be changed.
    </p>
  </div>
</div>`.trim();

  return { subject: 'Reset your password — Delivery Clarity', text, html };
}

interface UserEmailBase {
  userName: string;
  appUrl:   string;
}

export function buildPasswordChangedEmail(
  userName: string,
  appUrl:   string,
): Pick<EmailOptions, 'subject' | 'text' | 'html'> {
  const content = buildBrandedEmail({
    appUrl,
    title: 'Password changed',
    eyebrow: 'Account security',
    heading: 'Your password was changed',
    userName,
    body: [
      'This is a quick confirmation that your Delivery Clarity password was changed successfully.',
      'If you made this change, no further action is needed.',
    ],
    callout: {
      title: 'Wasn\'t you?',
      body: 'Contact support right away so we can help protect your account.',
    },
    primaryAction: { label: 'Go to login', href: `${appUrl}/login` },
    secondaryAction: { label: 'Contact support', href: 'mailto:support@deliveryclarity.app' },
    footerReason: 'You are receiving this email because your Delivery Clarity account password changed.',
  });

  return { subject: 'Your Delivery Clarity password was changed', ...content };
}

export interface UploadSuccessEmailDetails extends UserEmailBase {
  fileName: string;
}

export function buildUploadSuccessEmail(
  details: UploadSuccessEmailDetails,
): Pick<EmailOptions, 'subject' | 'text' | 'html'> {
  const content = buildBrandedEmail({
    appUrl: details.appUrl,
    title: 'Upload complete',
    heading: 'Your Jira export was uploaded',
    userName: details.userName,
    body: [
      `We received ${details.fileName} and Delivery Clarity is ready to turn it into flow, delivery, and quality signals.`,
      'You can review the dashboard now or continue with your next export.',
    ],
    callout: {
      title: 'Next step',
      body: 'Open your workspace to review the latest imported data and analysis views.',
    },
    primaryAction: { label: 'Open your workspace', href: details.appUrl },
    secondaryAction: { label: 'View delivery mix', href: `${details.appUrl}/delivery-mix` },
  });

  return { subject: 'Your Jira export was uploaded', ...content };
}

export interface UploadFailedEmailDetails extends UserEmailBase {
  fileName:      string;
  errorMessage:  string;
}

export function buildUploadFailedEmail(
  details: UploadFailedEmailDetails,
): Pick<EmailOptions, 'subject' | 'text' | 'html'> {
  const content = buildBrandedEmail({
    appUrl: details.appUrl,
    title: 'Upload needs attention',
    eyebrow: 'Import status',
    heading: 'Your Jira export could not be processed',
    userName: details.userName,
    body: [
      `We tried to process ${details.fileName}, but the import did not complete.`,
      'Please review the file and try the upload again. If the problem repeats, send the file details to support.',
    ],
    callout: {
      title: 'Error details',
      body: details.errorMessage,
    },
    primaryAction: { label: 'Try upload again', href: details.appUrl },
    secondaryAction: { label: 'Contact support', href: 'mailto:support@deliveryclarity.app' },
  });

  return { subject: 'Your Jira export upload needs attention', ...content };
}

export type AnalysisReadyEmailDetails = UserEmailBase;

export function buildAnalysisReadyEmail(
  details: AnalysisReadyEmailDetails,
): Pick<EmailOptions, 'subject' | 'text' | 'html'> {
  const content = buildBrandedEmail({
    appUrl: details.appUrl,
    title: 'Analysis ready',
    heading: 'Your Delivery Clarity analysis is ready',
    userName: details.userName,
    body: [
      'Your Jira export has been processed and the dashboard is ready for review.',
      'Start with the delivery mix and flow health views to see where work is moving cleanly and where it may need attention.',
    ],
    callout: {
      title: 'Look for',
      body: 'Cycle time, blocker patterns, delivery mix, and the signals that explain what your Jira export is really telling you.',
    },
    primaryAction: { label: 'Open analysis', href: `${details.appUrl}/delivery-mix` },
    secondaryAction: { label: 'Back to dashboard', href: `${details.appUrl}/dashboard` },
  });

  return { subject: 'Your Delivery Clarity analysis is ready', ...content };
}

export interface FeedbackReceivedEmailDetails extends UserEmailBase {
  feedbackSummary: string;
}

export function buildFeedbackReceivedEmail(
  details: FeedbackReceivedEmailDetails,
): Pick<EmailOptions, 'subject' | 'text' | 'html'> {
  const content = buildBrandedEmail({
    appUrl: details.appUrl,
    title: 'Feedback received',
    eyebrow: 'Product feedback',
    heading: 'We received your feedback',
    userName: details.userName,
    body: [
      'Thank you for taking the time to send feedback during the Delivery Clarity soft launch.',
      'We read every submission and use it to improve the product workflow, analysis, and onboarding.',
    ],
    callout: {
      title: 'Your feedback',
      body: details.feedbackSummary,
    },
    primaryAction: { label: 'Back to dashboard', href: `${details.appUrl}/dashboard` },
    secondaryAction: { label: 'Contact support', href: 'mailto:support@deliveryclarity.app' },
  });

  return { subject: 'We received your Delivery Clarity feedback', ...content };
}

export interface SupportTicketReceivedEmailDetails extends UserEmailBase {
  supportReference: string;
}

export function buildSupportTicketReceivedEmail(
  details: SupportTicketReceivedEmailDetails,
): Pick<EmailOptions, 'subject' | 'text' | 'html'> {
  const content = buildBrandedEmail({
    appUrl: details.appUrl,
    title: 'Support request received',
    eyebrow: 'Support',
    heading: 'Your support request is in',
    userName: details.userName,
    body: [
      'We received your Delivery Clarity support request and will follow up as soon as possible.',
      'Keep the reference below handy if you reply with more context.',
    ],
    callout: {
      title: 'Support reference',
      body: details.supportReference,
    },
    primaryAction: { label: 'Return to Delivery Clarity', href: details.appUrl },
    secondaryAction: { label: 'Contact support', href: 'mailto:support@deliveryclarity.app' },
  });

  return { subject: 'Delivery Clarity support request received', ...content };
}

export type PrivateTestInviteEmailDetails = UserEmailBase;

export function buildPrivateTestInviteEmail(
  details: PrivateTestInviteEmailDetails,
): Pick<EmailOptions, 'subject' | 'text' | 'html'> {
  const content = buildBrandedEmail({
    appUrl: details.appUrl,
    title: 'Private test invitation',
    eyebrow: 'Soft launch',
    heading: 'You are invited to test Delivery Clarity',
    userName: details.userName,
    body: [
      'We are opening Delivery Clarity to a small group of testers before the wider launch.',
      'Your feedback will help shape the Jira export workflow, dashboards, and the analysis language teams see first.',
    ],
    callout: {
      title: 'Private test scope',
      body: 'Upload a Jira CSV or spreadsheet, review the dashboard, and tell us where the product is clear or confusing.',
    },
    primaryAction: { label: 'Open private test', href: `${details.appUrl}/login` },
    secondaryAction: { label: 'Upload a sheet', href: details.appUrl },
  });

  return { subject: 'You are invited to test Delivery Clarity', ...content };
}

export type WorkspaceReadyEmailDetails = UserEmailBase;

export function buildWorkspaceReadyEmail(
  details: WorkspaceReadyEmailDetails,
): Pick<EmailOptions, 'subject' | 'text' | 'html'> {
  const content = buildBrandedEmail({
    appUrl: details.appUrl,
    title: 'Workspace ready',
    heading: 'Your Delivery Clarity workspace is ready',
    userName: details.userName,
    body: [
      'Your workspace is set up and ready for your Jira export.',
      'Once you upload a CSV or spreadsheet, Delivery Clarity will prepare the dashboard and delivery mix views.',
    ],
    callout: {
      title: 'Recommended first action',
      body: 'Upload your most recent Jira export so the workspace can show real delivery signals instead of sample data.',
    },
    primaryAction: { label: 'Open your workspace', href: details.appUrl },
    secondaryAction: { label: 'Back to dashboard', href: `${details.appUrl}/dashboard` },
  });

  return { subject: 'Your Delivery Clarity workspace is ready', ...content };
}
