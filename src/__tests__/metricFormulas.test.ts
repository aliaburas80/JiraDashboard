// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// P0A-03 — Metric formula regression tests.
// Covers gaps found in the P0A-03 audit: lead/cycle time calculation,
// zero-denominator safety, safeAverage with empty/NaN inputs, sprint
// velocity, pointCompletionRate, and missing-date handling.
//
// Field names mirror actual Jira export column names consumed by the service:
//   'Done Date' or 'Resolution Date'  — resolved/done timestamp
//   'In Progress Date'               — work-started timestamp
//   'Story Points'                   — numeric points per issue
//   'Sprint'                         — sprint name

import { calculateDashboardMetrics } from '../services/metrics/metrics.service';

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const day = String(d.getDate()).padStart(2, '0');
  const mon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()];
  return `${day}/${mon}/${d.getFullYear()}`;
}

// ── Lead time and cycle time ──────────────────────────────────────────────────

describe('Lead time and cycle time', () => {
  it('TC-FM-01: averageLeadTimeDays ≈ days from Created to Done Date', () => {
    const issues = [{
      'Issue Key':   'LT-1',
      'Issue Type':  'Story',
      'Summary':     'Lead time test',
      'Status':      'Done',
      'Created Date':     daysAgo(10),
      'Done Date':   daysAgo(0),
      'Story Points': '3',
    }];
    const result = calculateDashboardMetrics(issues);
    expect(result.flow?.averageLeadTimeDays).toBeGreaterThanOrEqual(9);
    expect(result.flow?.averageLeadTimeDays).toBeLessThanOrEqual(11);
  });

  it('TC-FM-02: averageCycleTimeDays ≈ days from In Progress Date to Done Date', () => {
    const issues = [{
      'Issue Key':        'CT-1',
      'Issue Type':       'Story',
      'Summary':          'Cycle time test',
      'Status':           'Done',
      'Created Date':          daysAgo(20),
      'In Progress Date': daysAgo(5),
      'Done Date':        daysAgo(0),
      'Story Points':     '2',
    }];
    const result = calculateDashboardMetrics(issues);
    expect(result.flow?.averageCycleTimeDays).toBeGreaterThanOrEqual(4);
    expect(result.flow?.averageCycleTimeDays).toBeLessThanOrEqual(6);
  });

  it('TC-FM-03: averageLeadTimeDays = 0 when Created date is missing', () => {
    const issues = [{
      'Issue Key': 'LT-NULL-1', 'Issue Type': 'Bug',
      'Summary': 'No created date', 'Status': 'Done', 'Done Date': daysAgo(0),
    }];
    const result = calculateDashboardMetrics(issues);
    expect(result.flow?.averageLeadTimeDays).toBe(0);
  });

  it('TC-FM-04: averageCycleTimeDays = 0 when In Progress Date missing, lead time still calculated', () => {
    const issues = [{
      'Issue Key': 'CT-NULL-1', 'Issue Type': 'Story',
      'Summary': 'No started date', 'Status': 'Done',
      'Created Date': daysAgo(8), 'Done Date': daysAgo(0),
    }];
    const result = calculateDashboardMetrics(issues);
    expect(result.flow?.averageLeadTimeDays).toBeGreaterThan(0);
    expect(result.flow?.averageCycleTimeDays).toBe(0);
  });

  it('TC-FM-05: averageLeadTimeDays is the mean across multiple done issues', () => {
    const issues = [
      { 'Issue Key': 'LT-A', 'Issue Type': 'Story', 'Summary': 'A', 'Status': 'Done', 'Created Date': daysAgo(10), 'Done Date': daysAgo(0) },
      { 'Issue Key': 'LT-B', 'Issue Type': 'Story', 'Summary': 'B', 'Status': 'Done', 'Created Date': daysAgo(20), 'Done Date': daysAgo(0) },
    ];
    const result = calculateDashboardMetrics(issues);
    // Mean of ~10 and ~20 → ~15 days
    expect(result.flow?.averageLeadTimeDays).toBeGreaterThanOrEqual(13);
    expect(result.flow?.averageLeadTimeDays).toBeLessThanOrEqual(17);
  });

  it('TC-FM-06: open issues are excluded from lead/cycle time averages', () => {
    const issues = [
      { 'Issue Key': 'DONE-1', 'Issue Type': 'Story', 'Summary': 'Done',  'Status': 'Done',        'Created Date': daysAgo(10), 'Done Date': daysAgo(0) },
      { 'Issue Key': 'OPEN-1', 'Issue Type': 'Story', 'Summary': 'Open',  'Status': 'In Progress', 'Created Date': daysAgo(100) },
    ];
    const result = calculateDashboardMetrics(issues);
    // Should reflect only the Done issue (~10 days), not inflated by the 100-day open issue
    expect(result.flow?.averageLeadTimeDays).toBeLessThan(20);
  });
});

// ── Zero-denominator safety ───────────────────────────────────────────────────

describe('Zero denominator safety', () => {
  it('TC-FM-07: completionRate = 0 when no issues are Done', () => {
    const issues = [
      { 'Issue Key': 'A', 'Issue Type': 'Story', 'Summary': 'A', 'Status': 'In Progress' },
      { 'Issue Key': 'B', 'Issue Type': 'Story', 'Summary': 'B', 'Status': 'To Do' },
    ];
    const result = calculateDashboardMetrics(issues);
    expect(result.completionRate).toBe(0);
    expect(result.doneIssues).toBe(0);
  });

  it('TC-FM-08: completionRate = 100 when all issues are Done', () => {
    const issues = [
      { 'Issue Key': 'A', 'Issue Type': 'Story', 'Summary': 'A', 'Status': 'Done' },
      { 'Issue Key': 'B', 'Issue Type': 'Story', 'Summary': 'B', 'Status': 'Done' },
    ];
    const result = calculateDashboardMetrics(issues);
    expect(result.completionRate).toBe(100);
  });

  it('TC-FM-09: pointCompletionRate = 0 when sprint has 0 committed story points (no NaN)', () => {
    const issues = [{
      'Issue Key': 'SP-1', 'Issue Type': 'Story',
      'Summary': 'No points', 'Status': 'Done', 'Sprint': 'Sprint 1',
    }];
    const result = calculateDashboardMetrics(issues);
    const sprint = result.sprint?.sprints?.[0];
    expect(sprint?.pointCompletionRate).toBe(0);
    expect(sprint?.pointCompletionRate).not.toBeNaN();
  });

  it('TC-FM-10: averageLeadTimeDays = 0 (not NaN) when no Done issues exist', () => {
    const issues = [{ 'Issue Key': 'OPEN-1', 'Issue Type': 'Task', 'Summary': 'Open', 'Status': 'To Do' }];
    const result = calculateDashboardMetrics(issues);
    expect(result.flow?.averageLeadTimeDays).toBe(0);
    expect(result.flow?.averageLeadTimeDays).not.toBeNaN();
  });

  it('TC-FM-11: healthScore is a finite number between 0 and 100 for any input', () => {
    expect(calculateDashboardMetrics([]).healthScore).toBeGreaterThanOrEqual(0);
    expect(calculateDashboardMetrics([]).healthScore).toBeLessThanOrEqual(100);
    const done = [{ 'Issue Key': 'X', 'Issue Type': 'Story', 'Summary': 'X', 'Status': 'Done' }];
    const score = calculateDashboardMetrics(done).healthScore;
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('TC-FM-12: no crash and sensible zeros on empty input', () => {
    const result = calculateDashboardMetrics([]);
    expect(result.totalIssues).toBe(0);
    expect(result.doneIssues).toBe(0);
    expect(result.completionRate).toBe(0);
    expect(result.storyPoints.totalStoryPoints).toBe(0);
  });
});

// ── Sprint velocity and story-point metrics ───────────────────────────────────

describe('Sprint velocity and story-point metrics', () => {
  const sprintIssues = [
    { 'Issue Key': 'S1-1', 'Issue Type': 'Story', 'Summary': 'Done s1',    'Status': 'Done',        'Sprint': 'Sprint 1', 'Story Points': '5' },
    { 'Issue Key': 'S1-2', 'Issue Type': 'Story', 'Summary': 'Open s1',    'Status': 'In Progress', 'Sprint': 'Sprint 1', 'Story Points': '3' },
    { 'Issue Key': 'S2-1', 'Issue Type': 'Story', 'Summary': 'Done s2a',   'Status': 'Done',        'Sprint': 'Sprint 2', 'Story Points': '8' },
    { 'Issue Key': 'S2-2', 'Issue Type': 'Story', 'Summary': 'Done s2b',   'Status': 'Done',        'Sprint': 'Sprint 2', 'Story Points': '4' },
  ];

  it('TC-FM-13: committedPoints = sum of ALL story points in sprint (done + open)', () => {
    const result = calculateDashboardMetrics(sprintIssues);
    const s1 = result.sprint?.sprints?.find(s => s.name === 'Sprint 1');
    expect(s1?.committedPoints).toBe(8); // 5 + 3
  });

  it('TC-FM-14: completedPoints = sum of story points for Done issues only', () => {
    const result = calculateDashboardMetrics(sprintIssues);
    const s1 = result.sprint?.sprints?.find(s => s.name === 'Sprint 1');
    expect(s1?.completedPoints).toBe(5);
  });

  it('TC-FM-15: pointCompletionRate = round(completedPoints / committedPoints × 100)', () => {
    const result = calculateDashboardMetrics(sprintIssues);
    const s1 = result.sprint?.sprints?.find(s => s.name === 'Sprint 1');
    // 5/8 = 62.5% → rounds to 63
    expect(s1?.pointCompletionRate).toBeGreaterThanOrEqual(62);
    expect(s1?.pointCompletionRate).toBeLessThanOrEqual(63);
  });

  it('TC-FM-16: sprint with all issues Done has pointCompletionRate = 100', () => {
    const result = calculateDashboardMetrics(sprintIssues);
    const s2 = result.sprint?.sprints?.find(s => s.name === 'Sprint 2');
    expect(s2?.pointCompletionRate).toBe(100); // 12/12
  });

  it('TC-FM-17: totalStoryPoints and completedStoryPoints are not NaN', () => {
    const result = calculateDashboardMetrics(sprintIssues);
    expect(result.storyPoints.totalStoryPoints).not.toBeNaN();
    expect(result.storyPoints.completedStoryPoints).not.toBeNaN();
    expect(result.storyPoints.totalStoryPoints).toBe(20);    // 5+3+8+4
    expect(result.storyPoints.completedStoryPoints).toBe(17); // 5+8+4
  });
});

// ── Missing and malformed field handling ─────────────────────────────────────

describe('Missing and malformed field handling', () => {
  it('TC-FM-18: issue with undefined Status is counted in totalIssues', () => {
    const issues = [{ 'Issue Key': 'X-1', 'Issue Type': 'Task', 'Summary': 'No status' }];
    const result = calculateDashboardMetrics(issues);
    expect(result.totalIssues).toBe(1);
    expect(result.doneIssues).toBe(0);
  });

  it('TC-FM-19: issue with null Story Points does not throw', () => {
    const issues = [{ 'Issue Key': 'X-1', 'Issue Type': 'Story', 'Summary': 'Null pts', 'Status': 'Done', 'Story Points': null }];
    expect(() => calculateDashboardMetrics(issues)).not.toThrow();
  });

  it('TC-FM-20: non-numeric Story Points ("TBD") default to 0', () => {
    const issues = [{ 'Issue Key': 'X-1', 'Issue Type': 'Story', 'Summary': 'Text pts', 'Status': 'Done', 'Story Points': 'TBD' }];
    const result = calculateDashboardMetrics(issues);
    expect(result.storyPoints.totalStoryPoints).toBe(0);
    expect(result.storyPoints.completedStoryPoints).toBe(0);
  });

  it('TC-FM-21: negative story points are parsed as-is (not clamped) — totals may be negative', () => {
    // The service sums story points directly; -5 + 3 = -2. This is the current
    // documented behavior. If requirements change to clamp at 0, update this test
    // and the parseNumber function together.
    const issues = [
      { 'Issue Key': 'NEG-1', 'Issue Type': 'Story', 'Summary': 'Neg', 'Status': 'Done', 'Story Points': '-5' },
      { 'Issue Key': 'POS-1', 'Issue Type': 'Story', 'Summary': 'Pos', 'Status': 'Done', 'Story Points': '3' },
    ];
    const result = calculateDashboardMetrics(issues);
    // -5 + 3 = -2 for completed; total same since both are Done
    expect(result.storyPoints.completedStoryPoints).toBe(-2);
    expect(result.storyPoints.completedStoryPoints).not.toBeNaN();
  });

  it('TC-FM-22: future Done Date does not produce NaN or Infinity in lead time', () => {
    const future = new Date();
    future.setDate(future.getDate() + 30);
    const day = String(future.getDate()).padStart(2, '0');
    const mon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][future.getMonth()];
    const futureStr = `${day}/${mon}/${future.getFullYear()}`;
    const issues = [{
      'Issue Key': 'F-1', 'Issue Type': 'Story', 'Summary': 'Future',
      'Status': 'Done', 'Created Date': daysAgo(5), 'Done Date': futureStr,
    }];
    const result = calculateDashboardMetrics(issues);
    expect(Number.isFinite(result.flow?.averageLeadTimeDays ?? 0)).toBe(true);
    expect(result.flow?.averageLeadTimeDays).not.toBeNaN();
  });
});
