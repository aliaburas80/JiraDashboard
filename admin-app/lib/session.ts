export interface AdminSessionData {
  userId: string;
  email: string;
  name: string;
  isSuperAdmin: boolean;
  isLoggedIn: boolean;
}

const adminSessionPassword =
  process.env.ADMIN_SESSION_SECRET ??
  (process.env.NODE_ENV === 'production'
    ? (() => { throw new Error('ADMIN_SESSION_SECRET must be set in production.'); })()
    : 'dev-only-admin-session-placeholder-not-for-production');

const isEphemeralCiHttpRun =
  process.env.CI === 'true' && process.env.E2E_ALLOW_INSECURE_COOKIES === 'true';

export const ADMIN_SESSION_OPTIONS = {
  password: adminSessionPassword,
  cookieName: 'dc_admin_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production' && !isEphemeralCiHttpRun,
    httpOnly: true,
    sameSite: 'strict' as const,
    maxAge: 60 * 60 * Number(process.env.ADMIN_SESSION_TTL_HOURS ?? 4),
  },
};
