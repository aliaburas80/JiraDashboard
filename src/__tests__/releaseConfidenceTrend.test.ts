// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// Release confidence trend tests — TC-RC-01 to TC-RC-10

import { computeReleaseConfidence, releaseConfidenceBand } from '../lib/releaseConfidence';

// ── TC-RC-01: Perfect delivery → score near 100 ───────────────────────────────

test('TC-RC-01: perfect delivery scores 100', () => {
  const score = computeReleaseConfidence({
    completionRate: 100,
    blockedIssues:  0,
    criticalCount:  0,
    openDefects:    0,
    totalIssues:    20,
  });
  expect(score).toBe(100);
});

// ── TC-RC-02: Zero completion → low score ─────────────────────────────────────

test('TC-RC-02: zero completion rate produces low score', () => {
  const score = computeReleaseConfidence({
    completionRate: 0,
    blockedIssues:  0,
    criticalCount:  0,
    openDefects:    0,
    totalIssues:    20,
  });
  // completion=0pts, blocked=25pts, critical=12pts, defects=8pts → 45
  expect(score).toBe(45);
});

// ── TC-RC-03: Blockers penalise score ─────────────────────────────────────────

test('TC-RC-03: blocked issues reduce score proportionally', () => {
  const noBlockers = computeReleaseConfidence({
    completionRate: 80, blockedIssues: 0, criticalCount: 0, openDefects: 0, totalIssues: 20,
  });
  const withBlockers = computeReleaseConfidence({
    completionRate: 80, blockedIssues: 10, criticalCount: 0, openDefects: 0, totalIssues: 20,
  });
  expect(withBlockers).toBeLessThan(noBlockers);
});

// ── TC-RC-04: All issues blocked → 0 blocked points ──────────────────────────

test('TC-RC-04: all issues blocked caps penalty at full 25pts', () => {
  const allBlocked = computeReleaseConfidence({
    completionRate: 100, blockedIssues: 20, criticalCount: 0, openDefects: 0, totalIssues: 20,
  });
  const noneBlocked = computeReleaseConfidence({
    completionRate: 100, blockedIssues: 0, criticalCount: 0, openDefects: 0, totalIssues: 20,
  });
  expect(allBlocked).toBeLessThan(noneBlocked);
  expect(allBlocked).toBe(noneBlocked - 25);
});

// ── TC-RC-05: Open defects penalise at 2 pts each ────────────────────────────

test('TC-RC-05: each open defect costs 2 points (max 8)', () => {
  const base = computeReleaseConfidence({
    completionRate: 100, blockedIssues: 0, criticalCount: 0, openDefects: 0, totalIssues: 20,
  });
  const oneDefect = computeReleaseConfidence({
    completionRate: 100, blockedIssues: 0, criticalCount: 0, openDefects: 1, totalIssues: 20,
  });
  const fourDefects = computeReleaseConfidence({
    completionRate: 100, blockedIssues: 0, criticalCount: 0, openDefects: 4, totalIssues: 20,
  });
  expect(base - oneDefect).toBe(2);
  expect(base - fourDefects).toBe(8);  // capped at 8
});

// ── TC-RC-06: Score is clamped 0–100 ─────────────────────────────────────────

test('TC-RC-06: score is always between 0 and 100', () => {
  const worst = computeReleaseConfidence({
    completionRate: 0, blockedIssues: 100, criticalCount: 100, openDefects: 100, totalIssues: 100,
  });
  const best = computeReleaseConfidence({
    completionRate: 100, blockedIssues: 0, criticalCount: 0, openDefects: 0, totalIssues: 1,
  });
  expect(worst).toBeGreaterThanOrEqual(0);
  expect(best).toBeLessThanOrEqual(100);
});

// ── TC-RC-07: Band classification ────────────────────────────────────────────

test('TC-RC-07: band classification thresholds', () => {
  expect(releaseConfidenceBand(100)).toBe('High');
  expect(releaseConfidenceBand(80)).toBe('High');
  expect(releaseConfidenceBand(79)).toBe('Medium');
  expect(releaseConfidenceBand(60)).toBe('Medium');
  expect(releaseConfidenceBand(59)).toBe('Low');
  expect(releaseConfidenceBand(40)).toBe('Low');
  expect(releaseConfidenceBand(39)).toBe('Critical');
  expect(releaseConfidenceBand(0)).toBe('Critical');
});

// ── TC-RC-08: totalIssues = 0 does not throw ─────────────────────────────────

test('TC-RC-08: zero totalIssues does not throw or divide by zero', () => {
  expect(() => computeReleaseConfidence({
    completionRate: 0, blockedIssues: 0, criticalCount: 0, openDefects: 0, totalIssues: 0,
  })).not.toThrow();
});

// ── TC-RC-09: Typical mid-sprint delivery ────────────────────────────────────

test('TC-RC-09: typical mid-sprint scenario scores in Medium range', () => {
  const score = computeReleaseConfidence({
    completionRate: 65,
    blockedIssues:  2,
    criticalCount:  1,
    openDefects:    1,
    totalIssues:    30,
  });
  expect(score).toBeGreaterThanOrEqual(50);
  expect(score).toBeLessThanOrEqual(80);
});

// ── TC-RC-10: Improving uploads produce increasing scores ────────────────────

test('TC-RC-10: improving delivery inputs produce higher scores over time', () => {
  const sprint1 = computeReleaseConfidence({ completionRate: 40, blockedIssues: 5, criticalCount: 3, openDefects: 2, totalIssues: 20 });
  const sprint2 = computeReleaseConfidence({ completionRate: 65, blockedIssues: 2, criticalCount: 1, openDefects: 1, totalIssues: 20 });
  const sprint3 = computeReleaseConfidence({ completionRate: 90, blockedIssues: 0, criticalCount: 0, openDefects: 0, totalIssues: 20 });
  expect(sprint2).toBeGreaterThan(sprint1);
  expect(sprint3).toBeGreaterThan(sprint2);
});
