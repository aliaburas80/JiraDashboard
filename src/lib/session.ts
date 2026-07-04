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

export const SESSION_OPTIONS = {
  password: _sessionPassword,
  cookieName: 'dc_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict' as const,
    maxAge: 60 * 60 * Number(process.env.SESSION_TTL_HOURS ?? 8),
  },
};
