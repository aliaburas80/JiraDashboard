// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Security check tests — TC-SC2-01 to TC-SC2-08

import { runSecurityChecks } from '../services/settings/securityCheck.service';

// TC-SC2-01: Returns a SecurityReport with checks array
test('TC-SC2-01: runSecurityChecks returns a report with checks', () => {
  const report = runSecurityChecks();
  expect(Array.isArray(report.checks)).toBe(true);
  expect(report.checks.length).toBeGreaterThan(5);
});

// TC-SC2-02: Each check has required fields
test('TC-SC2-02: every check has id, label, status, severity, category', () => {
  const { checks } = runSecurityChecks();
  checks.forEach(c => {
    expect(typeof c.id).toBe('string');
    expect(typeof c.label).toBe('string');
    expect(['pass','fail','warn','manual']).toContain(c.status);
    expect(['critical','high','medium','low']).toContain(c.severity);
    expect(typeof c.category).toBe('string');
    expect(typeof c.isAuto).toBe('boolean');
  });
});

// TC-SC2-03: overallScore is 0–100
test('TC-SC2-03: overallScore is between 0 and 100', () => {
  const { overallScore } = runSecurityChecks();
  expect(overallScore).toBeGreaterThanOrEqual(0);
  expect(overallScore).toBeLessThanOrEqual(100);
});

// TC-SC2-04: Count fields are consistent
test('TC-SC2-04: pass+fail+warn+manual counts sum to total checks', () => {
  const r = runSecurityChecks();
  const sum = r.passCount + r.failCount + r.warnCount + r.manualCount;
  expect(sum).toBe(r.checks.length);
});

// TC-SC2-05: isProductionReady is false when criticalFails > 0
test('TC-SC2-05: isProductionReady is false when there are critical failures', () => {
  const r = runSecurityChecks();
  if (r.criticalFails > 0) {
    expect(r.isProductionReady).toBe(false);
  }
});

// TC-SC2-06: Manual checks have isAuto=false
test('TC-SC2-06: manual status checks have isAuto=false', () => {
  const { checks } = runSecurityChecks();
  checks.filter(c => c.status === 'manual').forEach(c => {
    expect(c.isAuto).toBe(false);
  });
});

// TC-SC2-07: Auto checks have isAuto=true
test('TC-SC2-07: non-manual checks have isAuto=true', () => {
  const { checks } = runSecurityChecks();
  checks.filter(c => c.status !== 'manual').forEach(c => {
    expect(c.isAuto).toBe(true);
  });
});

// TC-SC2-08: session_secret check detects default value
test('TC-SC2-08: session_secret check fails when using default secret', () => {
  const original = process.env.SESSION_SECRET;
  delete process.env.SESSION_SECRET;
  const { checks } = runSecurityChecks();
  const secretCheck = checks.find(c => c.id === 'session_secret');
  expect(secretCheck?.status).toBe('fail');
  if (original !== undefined) process.env.SESSION_SECRET = original;
});
