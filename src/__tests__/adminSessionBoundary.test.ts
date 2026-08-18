// EP-022/EP-023: the admin application must never share the user-app session
// boundary, and a password-only admin session must never count as signed in.
import {
  ADMIN_SESSION_OPTIONS,
  isFullyAuthenticatedAdminSession,
} from '../../admin-app/lib/session';
import { SESSION_OPTIONS } from '@/lib/session';

describe('EP-022 separate admin session boundary', () => {
  test('uses a different cookie name from the user application', () => {
    expect(ADMIN_SESSION_OPTIONS.cookieName).toBe('dc_admin_session');
    expect(ADMIN_SESSION_OPTIONS.cookieName).not.toBe(SESSION_OPTIONS.cookieName);
  });

  test('uses a different encryption secret from the user application', () => {
    expect(ADMIN_SESSION_OPTIONS.password).not.toBe(SESSION_OPTIONS.password);
  });

  test('uses a shorter session lifetime and strict httpOnly cookies', () => {
    expect(ADMIN_SESSION_OPTIONS.cookieOptions.httpOnly).toBe(true);
    expect(ADMIN_SESSION_OPTIONS.cookieOptions.sameSite).toBe('strict');
    expect(ADMIN_SESSION_OPTIONS.cookieOptions.maxAge).toBeLessThan(SESSION_OPTIONS.cookieOptions.maxAge);
  });
});

describe('EP-023 admin MFA boundary', () => {
  const base = {
    userId: 'admin-1',
    email: 'owner@example.com',
    name: 'Owner',
    isSuperAdmin: true,
  };

  test('rejects a password-only pre-MFA session', () => {
    expect(isFullyAuthenticatedAdminSession({
      ...base,
      passwordVerified: true,
      mfaVerified: false,
      isLoggedIn: false,
    })).toBe(false);
  });

  test('requires password, MFA, and logged-in state together', () => {
    expect(isFullyAuthenticatedAdminSession({
      ...base,
      passwordVerified: true,
      mfaVerified: true,
      isLoggedIn: true,
    })).toBe(true);

    expect(isFullyAuthenticatedAdminSession({
      ...base,
      passwordVerified: false,
      mfaVerified: true,
      isLoggedIn: true,
    })).toBe(false);
  });
});
