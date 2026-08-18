import { redirect } from 'next/navigation';

function separateAdminUrl(): string {
  const configured = process.env.ADMIN_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');
  if (process.env.NODE_ENV !== 'production') return 'http://localhost:3001';
  // Fail closed at request time without breaking production builds that do not
  // inject runtime-only deployment variables during `next build`.
  return '/login?adminUnavailable=1';
}

export default function AdminLayout() {
  // EP-024: operational administration no longer renders inside the user app.
  // The separate Admin runtime performs its own password + MFA authentication;
  // the user-app session is intentionally not forwarded or trusted there.
  redirect(separateAdminUrl());
}
