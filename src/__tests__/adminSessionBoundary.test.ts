// EP-022: the admin application must never share the user-app session boundary.
import { ADMIN_SESSION_OPTIONS } from '../../admin-app/lib/session';
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
