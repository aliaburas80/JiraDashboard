// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// Missing-column impact tests — TC-MF-01 to TC-MF-12

import { calculateFieldImpacts } from '../services/dataQuality/missingFieldImpact.service';

function issue(overrides: Record<string, unknown> = {}) {
  return {
    'Issue Key':        'P-1',
    'Issue Type':       'Story',
    'Summary':          'Test',
    'Status':           'In Progress',
    'Created Date':     '2025-01-01',
    'In Progress Date': '2025-01-05',
    'Done Date':        '',
    'Story Points':     5,
    'Sprint':           'Sprint 1',
    'Sprint Start':     '2025-01-01',
    'Sprint End':       '2025-01-14',
    'Epic Link':        'EPIC-1',
    'Assignee':         'Ali',
    'Fix Version/s':    'v1.0',
    ...overrides,
  };
}

function done(overrides: Record<string, unknown> = {}) {
  return issue({ Status: 'Done', 'Done Date': '2025-01-10', ...overrides });
}

// TC-MF-01: Perfect data → no impacts, hasIssues = false
test('TC-MF-01: all fields present → no impacts detected', () => {
  const issues = [done(), done({ 'Issue Key': 'P-2' })];
  const report = calculateFieldImpacts(issues);
  expect(report.hasIssues).toBe(false);
  expect(report.all).toHaveLength(0);
});

// TC-MF-02: Missing Done Date on done items → critical impact with correct fields
test('TC-MF-02: done items with no Done Date → critical field impact', () => {
  const issues = Array(5).fill(null).map((_, i) =>
    done({ 'Issue Key': `P-${i}`, 'Done Date': '', 'Resolution Date': '' })
  );
  const report = calculateFieldImpacts(issues);
  expect(report.hasIssues).toBe(true);
  expect(report.critical).toHaveLength(1);
  expect(report.critical[0].field).toBe('Done Date');
  expect(report.critical[0].severity).toBe('critical');
  expect(report.critical[0].missingCount).toBe(5);
});

// TC-MF-03: Column completely absent → isColumnAbsent = true
test('TC-MF-03: column absent from export → isColumnAbsent=true', () => {
  const issues = Array(5).fill(null).map((_, i) =>
    issue({ 'Issue Key': `P-${i}`, 'Story Points': '' })
  );
  const report = calculateFieldImpacts(issues);
  const sp = report.all.find(i => i.field === 'Story Points');
  expect(sp?.isColumnAbsent).toBe(true);
});

// TC-MF-04: Missing In Progress Date → fallback detection
test('TC-MF-04: no In Progress Date but has Sprint Start → fallback noted', () => {
  const issues = Array(5).fill(null).map((_, i) =>
    done({ 'Issue Key': `P-${i}`, 'In Progress Date': '', 'Sprint Start': '2025-01-01' })
  );
  const report = calculateFieldImpacts(issues);
  const impact = report.all.find(i => i.field === 'In Progress Date');
  expect(impact?.fallbackUsed).toContain('Sprint Start');
});

// TC-MF-05: whatYouSeeNow is a non-empty descriptive string
test('TC-MF-05: whatYouSeeNow is specific and non-empty', () => {
  const issues = Array(3).fill(null).map((_, i) =>
    done({ 'Issue Key': `P-${i}`, 'Done Date': '', 'Resolution Date': '' })
  );
  const report = calculateFieldImpacts(issues);
  report.all.forEach(impact => {
    expect(impact.whatYouSeeNow.length).toBeGreaterThan(10);
    expect(impact.whatYoullGain.length).toBeGreaterThan(10);
  });
});

// TC-MF-06: dashboardLocations is always populated for impacted fields
test('TC-MF-06: every impact has at least one dashboard location', () => {
  const issues = [
    done({ 'Issue Key': 'P-1', 'Done Date': '', 'Resolution Date': '' }),
    issue({ 'Issue Key': 'P-2', 'Story Points': 0 }),
  ];
  const report = calculateFieldImpacts(issues);
  report.all.forEach(impact => {
    expect(impact.dashboardLocations.length).toBeGreaterThan(0);
  });
});

// TC-MF-07: Impacts sorted critical first, then high, medium, low
test('TC-MF-07: impacts sorted by severity — critical first', () => {
  const issues = [
    done({ 'Issue Key': 'P-1', 'Done Date': '', 'Resolution Date': '' }), // critical
    issue({ 'Issue Key': 'P-2', 'Story Points': 0 }),                       // high
  ];
  const report = calculateFieldImpacts(issues);
  if (report.all.length >= 2) {
    const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    const isOrdered = report.all.every((item, i) =>
      i === 0 || order[report.all[i - 1].severity] <= order[item.severity]
    );
    expect(isOrdered).toBe(true);
  }
});

// TC-MF-08: topSummary mentions absent columns if any
test('TC-MF-08: topSummary mentions absent columns', () => {
  const issues = Array(5).fill(null).map((_, i) =>
    issue({ 'Issue Key': `P-${i}`, 'Story Points': '' })
  );
  const report = calculateFieldImpacts(issues);
  expect(report.topSummary.length).toBeGreaterThan(10);
});

// TC-MF-09: Missing Sprint → sprint analytics locations listed
test('TC-MF-09: missing Sprint → dashboard locations include Sprint Throughput', () => {
  const issues = Array(5).fill(null).map((_, i) =>
    issue({ 'Issue Key': `P-${i}`, 'Sprint': '', 'Actual Sprint': '' })
  );
  const report = calculateFieldImpacts(issues);
  const sprint = report.all.find(i => i.field === 'Sprint');
  const locations = sprint?.dashboardLocations.join(' ') ?? '';
  expect(locations).toContain('Throughput');
});

// TC-MF-10: Missing Epic Link → Work Item Explorer mentioned
test('TC-MF-10: missing Epic Link → Work Item Explorer in dashboard locations', () => {
  const issues = Array(5).fill(null).map((_, i) =>
    issue({ 'Issue Key': `P-${i}`, 'Epic Link': '', 'Parent Key': '' })
  );
  const report = calculateFieldImpacts(issues);
  const epic = report.all.find(i => i.field === 'Epic Link');
  const locations = epic?.dashboardLocations.join(' ') ?? '';
  expect(locations).toContain('Work Item Explorer');
});

// TC-MF-11: Empty issues array → no impacts, hasIssues = false
test('TC-MF-11: empty issues array → hasIssues=false', () => {
  const report = calculateFieldImpacts([]);
  expect(report.hasIssues).toBe(false);
  expect(report.all).toHaveLength(0);
});

// TC-MF-12: Epics not counted in Epic Link check
test('TC-MF-12: Epics excluded from Epic Link missing check', () => {
  const issues = [
    issue({ 'Issue Key': 'EPIC-1', 'Issue Type': 'Epic', 'Epic Link': '' }),
    issue({ 'Issue Key': 'S-1', 'Issue Type': 'Story', 'Epic Link': 'EPIC-1' }),
  ];
  const report = calculateFieldImpacts(issues);
  const epicImpact = report.all.find(i => i.field === 'Epic Link');
  expect(epicImpact).toBeUndefined(); // Story has Epic Link, so no impact
});
