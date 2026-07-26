// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Session cookie security tests — CI-only insecure-cookie bypass (bug 5,
// QA-GATE-09). SESSION_OPTIONS is computed once at module load from env vars,
// so each case resets modules and re-imports with a fresh env.

const originalEnv = process.env;

function setEnv(overrides: Record<string, string | undefined>): void {
  process.env = { ...originalEnv, SESSION_SECRET: 'a'.repeat(32), ...overrides } as NodeJS.ProcessEnv;
}

beforeEach(() => {
  jest.resetModules();
});

afterAll(() => {
  process.env = originalEnv;
});

test('production with no CI flags — cookie is Secure (real deploy behavior, unaffected)', async () => {
  setEnv({ NODE_ENV: 'production', CI: undefined, E2E_ALLOW_INSECURE_COOKIES: undefined });

  const { SESSION_OPTIONS } = await import('../lib/session');
  expect(SESSION_OPTIONS.cookieOptions.secure).toBe(true);
});

test('production + CI=true only (no explicit opt-in) — cookie stays Secure', async () => {
  setEnv({ NODE_ENV: 'production', CI: 'true', E2E_ALLOW_INSECURE_COOKIES: undefined });

  const { SESSION_OPTIONS } = await import('../lib/session');
  expect(SESSION_OPTIONS.cookieOptions.secure).toBe(true);
});

test('production + E2E_ALLOW_INSECURE_COOKIES=true only (no CI) — cookie stays Secure', async () => {
  setEnv({ NODE_ENV: 'production', CI: undefined, E2E_ALLOW_INSECURE_COOKIES: 'true' });

  const { SESSION_OPTIONS } = await import('../lib/session');
  expect(SESSION_OPTIONS.cookieOptions.secure).toBe(true);
});

test('production + CI=true + E2E_ALLOW_INSECURE_COOKIES=true — cookie is not Secure (CI-only bypass)', async () => {
  setEnv({ NODE_ENV: 'production', CI: 'true', E2E_ALLOW_INSECURE_COOKIES: 'true' });

  const { SESSION_OPTIONS } = await import('../lib/session');
  expect(SESSION_OPTIONS.cookieOptions.secure).toBe(false);
});

test('development — cookie is not Secure regardless of the CI flags', async () => {
  setEnv({ NODE_ENV: 'development', CI: 'true', E2E_ALLOW_INSECURE_COOKIES: 'true' });

  const { SESSION_OPTIONS } = await import('../lib/session');
  expect(SESSION_OPTIONS.cookieOptions.secure).toBe(false);
});
