// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Thin nodemailer wrapper. SMTP settings loaded from encrypted cloud config first,
// falling back to environment variables when no cloud config exists.

import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { setDefaultResultOrder } from 'node:dns';
import { getAppConfig, type AppSmtpConfig } from './app-config';

// Render free tier (and many other PaaS) block IPv6 outbound traffic.
// Nodemailer's `service: 'gmail'` shorthand defaults to port 465 + SSL,
// which resolves smtp.gmail.com to an IPv6 address → ENETUNREACH.
// setDefaultResultOrder('ipv4first') tells Node's DNS resolver to always
// return IPv4 addresses before IPv6 for every outbound connection in this
// process — no per-transporter type gymnastics required.
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

function createTransporter(smtp: AppSmtpConfig) {
  // Never use `service: 'gmail'` — it hard-codes port 465/SSL and may pick IPv6.
  // Always use explicit host + port 587 + STARTTLS so the IPv4 fix above applies.
  const effectivePort = smtp.port === 465 ? 587 : smtp.port;
  const options: SMTPTransport.Options = {
    host:              smtp.host,
    port:              effectivePort,
    secure:            false,   // STARTTLS on 587; not direct TLS
    auth:              { user: smtp.user, pass: smtp.pass },
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
      solution: 'Check the SMTP host, port, firewall, and provider settings. For Gmail, use smtp.gmail.com with port 587.',
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

// Send using explicit SMTP config — used by the admin test endpoint so it can
// test form-supplied credentials before they are saved to cloud.
export async function sendEmailWith(smtp: AppSmtpConfig, opts: EmailOptions): Promise<boolean> {
  if (!smtp.host || !smtp.user || !smtp.pass) return false;
  const transporter = createTransporter(smtp);
  await transporter.sendMail({
    from: smtp.from,
    to:   opts.toName ? `${opts.toName} <${opts.to}>` : opts.to,
    subject: opts.subject,
    text:    opts.text,
    html:    opts.html,
  });
  return true;
}

export async function sendEmail(opts: EmailOptions): Promise<boolean> {
  const cfg  = await getAppConfig();
  const smtp = cfg.smtp;

  if (!smtp.host || !smtp.user || !smtp.pass) {
    console.warn(`[email] SMTP not configured — skipping email to ${opts.to}`);
    return false;
  }

  await createTransporter(smtp).sendMail({
    from: smtp.from,
    to:   opts.toName ? `${opts.toName} <${opts.to}>` : opts.to,
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
  const esc = (value: string): string =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

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
    <p style="margin-top:0">Hi <strong>${name}</strong>,</p>
    <p>Your account has been created. Use the credentials below to log in for the first time.</p>
    <table style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;width:100%;border-collapse:collapse;margin:16px 0">
      <tr>
        <td style="color:#64748b;padding:10px 14px;font-size:12px;font-weight:600;white-space:nowrap;border-bottom:1px solid #e2e8f0">Email</td>
        <td style="padding:10px 14px;font-weight:600;border-bottom:1px solid #e2e8f0">${email}</td>
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
