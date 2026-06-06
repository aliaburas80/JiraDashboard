// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// Snapshot comparison logic tests — TC-SC-01 to TC-SC-08

// ── Delta direction helper ────────────────────────────────────────────────────

function delta(a: number, b: number, higherIsBetter = true): 'better' | 'worse' | 'same' {
  if (Math.abs(a - b) < 0.01) return 'same';
  return (higherIsBetter ? b > a : b < a) ? 'better' : 'worse';
}

// ── Insight builder ───────────────────────────────────────────────────────────

function buildInsights(a: any, b: any, aName: string, bName: string): string[] {
  const ins: string[] = [];
  const compDelta  = (b.completionRate ?? 0) - (a.completionRate ?? 0);
  const scoreDelta = (b.healthScore ?? 0) - (a.healthScore ?? 0);
  const blockedDelta = (b.blockedIssues ?? 0) - (a.blockedIssues ?? 0);
  if (Math.abs(compDelta) >= 1) {
    ins.push(`Completion ${compDelta > 0 ? 'improved' : 'decreased'} by ${Math.abs(Math.round(compDelta))}%.`);
  }
  if (Math.abs(scoreDelta) >= 2) {
    ins.push(`Health score ${scoreDelta > 0 ? 'improved' : 'dropped'} by ${Math.abs(Math.round(scoreDelta))} points.`);
  }
  if (blockedDelta !== 0) {
    ins.push(`Blocked items ${blockedDelta > 0 ? 'increased' : 'reduced'} by ${Math.abs(blockedDelta)}.`);
  }
  if (ins.length === 0) ins.push(`Metrics are broadly similar.`);
  return ins;
}

// TC-SC-01: same values → 'same' direction
test('TC-SC-01: same numeric values → direction is same', () => {
  expect(delta(80, 80)).toBe('same');
  expect(delta(80, 80.005)).toBe('same'); // below 0.01 threshold
});

// TC-SC-02: higher is better — improvement detected
test('TC-SC-02: higher-is-better metric improved → direction is better', () => {
  expect(delta(70, 85)).toBe('better');    // completion % improved
  expect(delta(60, 80)).toBe('better');    // health score improved
});

// TC-SC-03: higher is better — decline detected
test('TC-SC-03: higher-is-better metric declined → direction is worse', () => {
  expect(delta(85, 70)).toBe('worse');
});

// TC-SC-04: lower is better — improvement detected
test('TC-SC-04: lower-is-better metric improved (blocked items reduced) → better', () => {
  expect(delta(5, 2, false)).toBe('better'); // fewer blocked items = better
  expect(delta(14, 8, false)).toBe('better'); // lower cycle time = better
});

// TC-SC-05: lower is better — decline detected
test('TC-SC-05: lower-is-better metric declined → worse', () => {
  expect(delta(2, 5, false)).toBe('worse'); // more blocked = worse
});

// TC-SC-06: insights generated when completion improved
test('TC-SC-06: completion improvement generates insight text', () => {
  const a = { completionRate: 50, healthScore: 70, blockedIssues: 2 };
  const b = { completionRate: 68, healthScore: 75, blockedIssues: 0 };
  const ins = buildInsights(a, b, 'Sprint 1', 'Sprint 2');
  expect(ins.some(i => i.includes('improved'))).toBe(true);
  expect(ins.some(i => i.includes('18%') || i.includes('Completion'))).toBe(true);
});

// TC-SC-07: no change → stable insight
test('TC-SC-07: no significant change → stable message returned', () => {
  const a = { completionRate: 70, healthScore: 72, blockedIssues: 2 };
  const b = { completionRate: 70, healthScore: 72, blockedIssues: 2 };
  const ins = buildInsights(a, b, 'A', 'B');
  expect(ins).toHaveLength(1);
  expect(ins[0]).toContain('similar');
});

// TC-SC-08: blocked items change generates insight
test('TC-SC-08: blocked items change appears in insights', () => {
  const a = { completionRate: 70, healthScore: 72, blockedIssues: 5 };
  const b = { completionRate: 70, healthScore: 72, blockedIssues: 1 };
  const ins = buildInsights(a, b, 'A', 'B');
  expect(ins.some(i => i.toLowerCase().includes('blocked'))).toBe(true);
});
