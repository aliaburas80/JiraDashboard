// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Server env validation tests — CI-only temporary-storage bypass (ERR-004)

import { getServerEnv } from '../lib/env/server';

const REQUIRED_PRODUCTION_ENV = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
  SESSION_SECRET: 'a'.repeat(32),
  CONFIG_ENCRYPTION_KEY: 'b'.repeat(32),
  STORAGE_DRIVER: 'temporary',
};

let originalEnv: NodeJS.ProcessEnv;

beforeEach(() => {
  originalEnv = { ...process.env };
});

afterEach(() => {
  process.env = originalEnv;
});

function setEnv(overrides: Record<string, string | undefined>): void {
  process.env = { ...originalEnv, ...REQUIRED_PRODUCTION_ENV, ...overrides } as NodeJS.ProcessEnv;
}

// ── Real production must still reject temporary storage ──────────────────────

test('production + temporary storage + no CI flags — still throws (guard intact)', () => {
  setEnv({ CI: undefined, ALLOW_TEMPORARY_STORAGE_IN_CI: undefined });
  expect(() => getServerEnv()).toThrow(/persistent object storage/);
});

test('production + temporary storage + CI=true only (no explicit opt-in) — still throws', () => {
  setEnv({ CI: 'true', ALLOW_TEMPORARY_STORAGE_IN_CI: undefined });
  expect(() => getServerEnv()).toThrow(/persistent object storage/);
});

test('production + temporary storage + ALLOW_TEMPORARY_STORAGE_IN_CI only (no CI) — still throws', () => {
  setEnv({ CI: undefined, ALLOW_TEMPORARY_STORAGE_IN_CI: 'true' });
  expect(() => getServerEnv()).toThrow(/persistent object storage/);
});

// ── The doubly-gated CI/E2E bypass ────────────────────────────────────────────

test('production + temporary storage + CI=true + ALLOW_TEMPORARY_STORAGE_IN_CI=true — passes', () => {
  setEnv({ CI: 'true', ALLOW_TEMPORARY_STORAGE_IN_CI: 'true' });
  const env = getServerEnv();
  expect(env.STORAGE_DRIVER).toBe('temporary');
});

// ── Unaffected guards stay enforced even with the bypass active ──────────────

test('bypass does not relax the DATABASE_URL-must-not-be-file check', () => {
  setEnv({
    CI: 'true',
    ALLOW_TEMPORARY_STORAGE_IN_CI: 'true',
    DATABASE_URL: 'file:./data/delivery_clarity.db',
  });
  expect(() => getServerEnv()).toThrow(/PostgreSQL connection string/);
});
