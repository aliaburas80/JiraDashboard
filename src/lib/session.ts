// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Activate after: npm install iron-session

import type { AppRole } from '@/lib/roles';

export interface SessionData {
  userId:              string;
  email:               string;
  name:                string;
  role:                AppRole;
  mustChangePassword?: boolean;
  emailVerified?:      boolean; // EP-011: false until verification link clicked (EP-012)
  // EP-017: "cloud" (default) or "local" — see prisma/schema.prisma User.dataStorageMode.
  dataStorageMode?:    'cloud' | 'local';
  // EP-025: distinct from role: 'admin' — gates the Members directory to the
  // single protected super-admin account only. See prisma/schema.prisma User.isSuperAdmin.
  isSuperAdmin?:       boolean;
  isLoggedIn:          boolean;
}

// In production SESSION_SECRET is enforced by start-production.mjs before the
// process starts. In local dev, fall back to a clearly-labelled dev placeholder
// so the app starts without the var, but the string is never a guessable secret.
const _sessionPassword =
  process.env.SESSION_SECRET ??
  (process.env.NODE_ENV === 'production'
    ? (() => { throw new Error('SESSION_SECRET must be set in production.'); })()
    : 'dev-only-placeholder-not-a-real-secret-do-not-use');

// CI/E2E-only: the e2e workflow runs `next start` (NODE_ENV=production)
// against a plain http://127.0.0.1 origin in the same job — there's no TLS
// terminator like Render provides in real production. A Secure cookie set
// over an insecure origin is silently dropped by some browser engines
// (confirmed via real CI runs: Chromium/Firefox tolerated it, WebKit did
// not — every WebKit-based Playwright project, including the Tablet/Mobile
// device presets which both run on WebKit, bounced straight back to /login
// after an otherwise-successful login response, since the session cookie
// never actually got stored). Doubly gated exactly like
// src/lib/env/server.ts's isEphemeralCiRun() so real Render deploys — which
// never set either of these — are unaffected.
const isEphemeralCiHttpRun = process.env.CI === 'true' && process.env.E2E_ALLOW_INSECURE_COOKIES === 'true';

export const SESSION_OPTIONS = {
  password: _sessionPassword,
  cookieName: 'dc_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production' && !isEphemeralCiHttpRun,
    httpOnly: true,
    sameSite: 'strict' as const,
    maxAge: 60 * 60 * Number(process.env.SESSION_TTL_HOURS ?? 8),
  },
};
