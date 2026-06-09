// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Thin nodemailer wrapper. Silently skips sending when SMTP is not configured.

import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  toName?: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(opts: EmailOptions): Promise<void> {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM ?? 'JiraDashboard <noreply@jiradashboard.local>';

  if (!host || !user || !pass) {
    console.warn(`[email] SMTP not configured — skipping email to ${opts.to}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from,
    to: opts.toName ? `${opts.toName} <${opts.to}>` : opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });
}

export function buildWelcomeEmail(
  name: string,
  email: string,
  tempPassword: string,
): Pick<EmailOptions, 'subject' | 'text' | 'html'> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const text = [
    `Hi ${name},`,
    '',
    'Your JiraDashboard account has been created.',
    '',
    `Email:             ${email}`,
    `Temporary password: ${tempPassword}`,
    '',
    `Log in at ${appUrl}/login and change your password immediately on first login.`,
    '',
    '— JiraDashboard',
  ].join('\n');

  const html = `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1e293b">
  <h2 style="color:#2563eb;margin-bottom:4px">Welcome to JiraDashboard</h2>
  <p>Hi ${name},</p>
  <p>Your account has been created. Use the credentials below to log in for the first time.</p>
  <table style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;width:100%;border-collapse:collapse">
    <tr>
      <td style="color:#64748b;padding:6px 12px;white-space:nowrap">Email</td>
      <td style="padding:6px 12px;font-weight:600">${email}</td>
    </tr>
    <tr>
      <td style="color:#64748b;padding:6px 12px;white-space:nowrap">Temporary password</td>
      <td style="padding:6px 12px;font-weight:700;font-family:monospace;font-size:15px;letter-spacing:.5px">${tempPassword}</td>
    </tr>
  </table>
  <p style="margin-top:20px">
    <a href="${appUrl}/login" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">
      Log in now
    </a>
  </p>
  <p style="font-size:12px;color:#94a3b8;margin-top:24px">
    You will be required to change your password on first login.
    This is an automated message — please do not reply.
  </p>
</div>`.trim();

  return { subject: 'Your JiraDashboard account is ready', text, html };
}
