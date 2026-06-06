// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// Activate after: npm install iron-session

import type { AppRole } from '@/lib/roles';

export interface SessionData {
  userId: string;
  email: string;
  name: string;
  role: AppRole;
  isLoggedIn: boolean;
}

export const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET ?? 'delivery-clarity-change-this-in-production-32chars',
  cookieName: 'dc_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict' as const,
    maxAge: 60 * 60 * Number(process.env.SESSION_TTL_HOURS ?? 8),
  },
};
