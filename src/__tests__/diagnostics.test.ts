// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// System diagnostics tests — TC-SD-01 to TC-SD-08

// Tests cover the ops score computation and helper functions used by diagnostics.

// ── Ops score formula (mirrors the API route logic) ───────────────────────────

interface OpsInputs {
  sessionSecretSet:   boolean;
  nodeEnvProduction:  boolean;
  registrationLocked: boolean;
  failedImports:      number;
  activeSessions:     number;
  totalUsers:         number;
}

function computeOpsScore(inputs: OpsInputs): number {
  let score = 100;
  if (!inputs.sessionSecretSet)    score -= 30;
  if (!inputs.nodeEnvProduction)   score -= 10;
  if (!inputs.registrationLocked)  score -= 10;
  if (inputs.failedImports > 0)    score -= Math.min(10, inputs.failedImports);
  if (inputs.activeSessions === 0 && inputs.totalUsers > 0) score -= 5;
  return Math.max(0, score);
}

// ── Helper: uptime formatting (mirrors page helper) ───────────────────────────

function uptime(s: number): string {
  if (s < 60)    return `${s}s`;
  if (s < 3600)  return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
  return `${Math.floor(s / 86400)}d ${Math.floor((s % 86400) / 3600)}h`;
}

// ── Helper: success rate ──────────────────────────────────────────────────────

function successRate(successful: number, total: number): number {
  return total > 0 ? Math.round((successful / total) * 100) : 0;
}

// ── TC-SD-01: Perfect config → score = 100 ───────────────────────────────────

test('TC-SD-01: all env checks pass + no failures → ops score = 100', () => {
  expect(computeOpsScore({
    sessionSecretSet: true, nodeEnvProduction: true, registrationLocked: true,
    failedImports: 0, activeSessions: 1, totalUsers: 2,
  })).toBe(100);
});

// ── TC-SD-02: Missing SESSION_SECRET → -30 pts ────────────────────────────────

test('TC-SD-02: missing SESSION_SECRET reduces score by 30', () => {
  const withSecret    = computeOpsScore({ sessionSecretSet: true,  nodeEnvProduction: true, registrationLocked: true, failedImports: 0, activeSessions: 1, totalUsers: 1 });
  const withoutSecret = computeOpsScore({ sessionSecretSet: false, nodeEnvProduction: true, registrationLocked: true, failedImports: 0, activeSessions: 1, totalUsers: 1 });
  expect(withSecret - withoutSecret).toBe(30);
});

// ── TC-SD-03: Non-production NODE_ENV → -10 pts ───────────────────────────────

test('TC-SD-03: non-production NODE_ENV reduces score by 10', () => {
  const prod = computeOpsScore({ sessionSecretSet: true, nodeEnvProduction: true,  registrationLocked: true, failedImports: 0, activeSessions: 1, totalUsers: 1 });
  const dev  = computeOpsScore({ sessionSecretSet: true, nodeEnvProduction: false, registrationLocked: true, failedImports: 0, activeSessions: 1, totalUsers: 1 });
  expect(prod - dev).toBe(10);
});

// ── TC-SD-04: Open registration → -10 pts ────────────────────────────────────

test('TC-SD-04: open registration reduces score by 10', () => {
  const locked = computeOpsScore({ sessionSecretSet: true, nodeEnvProduction: true, registrationLocked: true,  failedImports: 0, activeSessions: 1, totalUsers: 1 });
  const open   = computeOpsScore({ sessionSecretSet: true, nodeEnvProduction: true, registrationLocked: false, failedImports: 0, activeSessions: 1, totalUsers: 1 });
  expect(locked - open).toBe(10);
});

// ── TC-SD-05: Failed imports penalise score (capped at 10) ────────────────────

test('TC-SD-05: failed imports penalise score, capped at 10', () => {
  const base    = computeOpsScore({ sessionSecretSet: true, nodeEnvProduction: true, registrationLocked: true, failedImports: 0,  activeSessions: 1, totalUsers: 1 });
  const one     = computeOpsScore({ sessionSecretSet: true, nodeEnvProduction: true, registrationLocked: true, failedImports: 1,  activeSessions: 1, totalUsers: 1 });
  const many    = computeOpsScore({ sessionSecretSet: true, nodeEnvProduction: true, registrationLocked: true, failedImports: 20, activeSessions: 1, totalUsers: 1 });
  expect(base - one).toBe(1);
  expect(base - many).toBe(10); // capped
});

// ── TC-SD-06: Score clamped at 0 ─────────────────────────────────────────────

test('TC-SD-06: score cannot go below 0', () => {
  const score = computeOpsScore({ sessionSecretSet: false, nodeEnvProduction: false, registrationLocked: false, failedImports: 100, activeSessions: 0, totalUsers: 5 });
  expect(score).toBeGreaterThanOrEqual(0);
});

// ── TC-SD-07: Success rate computed correctly ─────────────────────────────────

test('TC-SD-07: success rate formula is correct', () => {
  expect(successRate(8, 10)).toBe(80);
  expect(successRate(10, 10)).toBe(100);
  expect(successRate(0, 10)).toBe(0);
  expect(successRate(0, 0)).toBe(0);   // zero-total guard
});

// ── TC-SD-08: Uptime formatting ───────────────────────────────────────────────

test('TC-SD-08: uptime helper formats seconds correctly', () => {
  expect(uptime(30)).toBe('30s');
  expect(uptime(90)).toBe('1m');
  expect(uptime(3661)).toBe('1h 1m');
  expect(uptime(90000)).toBe('1d 1h');
});
