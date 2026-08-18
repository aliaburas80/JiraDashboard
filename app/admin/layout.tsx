import { redirect } from 'next/navigation';

function separateAdminUrl(): string {
  const configured = process.env.ADMIN_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');
  if (process.env.NODE_ENV !== 'production') return 'http://localhost:3001';
  throw new Error('ADMIN_APP_URL must be configured before the embedded Admin console can be retired in production.');
}

export default function AdminLayout() {
  // EP-024: operational administration no longer renders inside the user app.
  // The separate Admin runtime performs its own password + MFA authentication;
  // the user-app session is intentionally not forwarded or trusted there.
  redirect(separateAdminUrl());
}
