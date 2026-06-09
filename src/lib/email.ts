// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Thin nodemailer wrapper. SMTP settings loaded from encrypted cloud config first,
// falling back to environment variables when no cloud config exists.

import nodemailer from 'nodemailer';
import { getAppConfig } from './app-config';

interface EmailOptions {
  to:      string;
  toName?: string;
  subject: string;
  text:    string;
  html?:   string;
}

export async function sendEmail(opts: EmailOptions): Promise<boolean> {
  const cfg  = await getAppConfig();
  const smtp = cfg.smtp;

  if (!smtp.host || !smtp.user || !smtp.pass) {
    console.warn(`[email] SMTP not configured — skipping email to ${opts.to}`);
    return false;
  }

  const isGmail = smtp.host.toLowerCase() === 'smtp.gmail.com';
  const transporter = isGmail
    ? nodemailer.createTransport({ service: 'gmail', auth: { user: smtp.user, pass: smtp.pass } })
    : nodemailer.createTransport({
        host:              smtp.host,
        port:              smtp.port,
        secure:            smtp.port === 465,
        auth:              { user: smtp.user, pass: smtp.pass },
        connectionTimeout: 10_000,
        greetingTimeout:   10_000,
      });

  await transporter.sendMail({
    from: smtp.from,
    to:   opts.toName ? `${opts.toName} <${opts.to}>` : opts.to,
    subject: opts.subject,
    text:    opts.text,
    html:    opts.html,
  });

  return true;
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
