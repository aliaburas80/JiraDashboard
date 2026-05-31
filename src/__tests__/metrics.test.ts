import { calculateDashboardMetrics } from '../services/metrics/metrics.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Return an ISO date string N days before today so timing-sensitive tests are
 * not anchored to a hard-coded calendar date.
 */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  // Use the Jira DD/Mon/YY format that the parser understands
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const mon = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day}/${mon}/${year}`;
}

// ---------------------------------------------------------------------------
// 1. Basic metrics
// ---------------------------------------------------------------------------

describe('Group 1 — Basic metrics', () => {
  const mockIssues = [
    {
      'Issue Key': 'TEST-1',
      'Issue Type': 'Story',
      'Summary': 'Test story',
      'Status': 'Done',
      'Created Date': '01/Jan/24',
      'Resolution Date': '15/Jan/24',
      'Assignee': 'Alice',
      'Story Points': '3',
    },
    {
      'Issue Key': 'TEST-2',
      'Issue Type': 'Bug',
      'Summary': 'Test bug',
      'Status': 'In Progress',
      'Created Date': '01/Jan/24',
      'Assignee': 'Bob',
      'Story Points': '2',
    },
    {
      'Issue Key': 'TEST-3',
      'Issue Type': 'Story',
      'Summary': 'Another story',
      'Status': 'To Do',
      'Created Date': '01/Jan/24',
      'Assignee': 'Alice',
      'Story Points': '5',
    },
  ] as Record<string, unknown>[];

  it('calculates totalIssues correctly', () => {
    const metrics = calculateDashboardMetrics(mockIssues);
    expect(metrics.totalIssues).toBe(3);
  });

  it('calculates doneIssues correctly', () => {
    const metrics = calculateDashboardMetrics(mockIssues);
    expect(metrics.doneIssues).toBe(1);
  });

  it('calculates completionRate as 33', () => {
    const metrics = calculateDashboardMetrics(mockIssues);
    expect(metrics.completionRate).toBe(33);
  });

  it('returns flow items equal to issue count (3)', () => {
    const metrics = calculateDashboardMetrics(mockIssues);
    expect(metrics.flow.items.length).toBe(3);
  });

  it('identifies all three issues as orphans (no epic/parent in data)', () => {
    const metrics = calculateDashboardMetrics(mockIssues);
    const orphans = metrics.flow.items.filter((i) => i.isOrphan);
    expect(orphans.length).toBe(3);
  });

  it('totals story points to 10', () => {
    const metrics = calculateDashboardMetrics(mockIssues);
    expect(metrics.storyPoints.totalStoryPoints).toBe(10);
  });

  it('totals completed story points to 3', () => {
    const metrics = calculateDashboardMetrics(mockIssues);
    expect(metrics.storyPoints.completedStoryPoints).toBe(3);
  });

  it('calculates healthScore between 0 and 100', () => {
    const metrics = calculateDashboardMetrics(mockIssues);
    expect(metrics.healthScore).toBeGreaterThanOrEqual(0);
    expect(metrics.healthScore).toBeLessThanOrEqual(100);
  });

  it('returns remainingStoryPoints as totalStoryPoints minus completedStoryPoints', () => {
    const metrics = calculateDashboardMetrics(mockIssues);
    expect(metrics.storyPoints.remainingStoryPoints).toBe(
      metrics.storyPoints.totalStoryPoints - metrics.storyPoints.completedStoryPoints,
    );
  });

  it('returns activeIssues count equal to In Progress issues', () => {
    const metrics = calculateDashboardMetrics(mockIssues);
    expect(metrics.activeIssues).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// 2. Health classification
// ---------------------------------------------------------------------------

describe('Group 2 — Health classification', () => {
  it('marks active issue with activeAgeDays > 14 as critical', () => {
    const issues = [
      {
        'Issue Key': 'H-1',
        'Issue Type': 'Story',
        'Summary': 'Long running',
        'Status': 'In Progress',
        'Created Date': daysAgo(20),
        'In Progress Date': daysAgo(20),
      },
    ] as Record<string, unknown>[];

    const metrics = calculateDashboardMetrics(issues);
    const item = metrics.flow.items.find((i) => i.key === 'H-1');
    expect(item?.health).toBe('critical');
  });

  it('marks active issue with activeAgeDays between 8 and 14 as warning', () => {
    const issues = [
      {
        'Issue Key': 'H-2',
        'Issue Type': 'Story',
        'Summary': 'Mid-age active',
        'Status': 'In Progress',
        'Created Date': daysAgo(10),
        'In Progress Date': daysAgo(10),
      },
    ] as Record<string, unknown>[];

    const metrics = calculateDashboardMetrics(issues);
    const item = metrics.flow.items.find((i) => i.key === 'H-2');
    expect(item?.health).toBe('warning');
  });

  it('marks active issue younger than 7 days as good', () => {
    const issues = [
      {
        'Issue Key': 'H-3',
        'Issue Type': 'Story',
        'Summary': 'Fresh active',
        'Status': 'In Progress',
        'Created Date': daysAgo(3),
        'In Progress Date': daysAgo(3),
      },
    ] as Record<string, unknown>[];

    const metrics = calculateDashboardMetrics(issues);
    const item = metrics.flow.items.find((i) => i.key === 'H-3');
    expect(item?.health).toBe('good');
  });

  it('marks issue with Blocked Flag true as critical', () => {
    const issues = [
      {
        'Issue Key': 'H-4',
        'Issue Type': 'Story',
        'Summary': 'Blocked story',
        'Status': 'To Do',
        'Created Date': daysAgo(2),
        'Blocked Flag': true,
      },
    ] as Record<string, unknown>[];

    const metrics = calculateDashboardMetrics(issues);
    const item = metrics.flow.items.find((i) => i.key === 'H-4');
    expect(item?.health).toBe('critical');
  });

  it('marks issue with Blocked Flag "true" (string) as critical', () => {
    const issues = [
      {
        'Issue Key': 'H-5',
        'Issue Type': 'Story',
        'Summary': 'String blocked',
        'Status': 'In Progress',
        'Created Date': daysAgo(2),
        'Blocked Flag': 'true',
      },
    ] as Record<string, unknown>[];

    const metrics = calculateDashboardMetrics(issues);
    const item = metrics.flow.items.find((i) => i.key === 'H-5');
    expect(item?.health).toBe('critical');
  });

  it('marks overdue open issue as critical', () => {
    const issues = [
      {
        'Issue Key': 'H-6',
        'Issue Type': 'Story',
        'Summary': 'Overdue task',
        'Status': 'To Do',
        'Created Date': daysAgo(30),
        'Due Date': daysAgo(5),
      },
    ] as Record<string, unknown>[];

    const metrics = calculateDashboardMetrics(issues);
    const item = metrics.flow.items.find((i) => i.key === 'H-6');
    expect(item?.health).toBe('critical');
  });

  it('marks high-priority open issue (otherwise fine) as warning', () => {
    const issues = [
      {
        'Issue Key': 'H-7',
        'Issue Type': 'Story',
        'Summary': 'High priority open',
        'Status': 'To Do',
        'Created Date': daysAgo(3),
        'Priority': 'High',
      },
    ] as Record<string, unknown>[];

    const metrics = calculateDashboardMetrics(issues);
    const item = metrics.flow.items.find((i) => i.key === 'H-7');
    expect(item?.health).toBe('warning');
  });

  it('marks done issue with short cycle time as good', () => {
    // Created 5 days ago, started 3 days ago, done today
    const issues = [
      {
        'Issue Key': 'H-8',
        'Issue Type': 'Story',
        'Summary': 'Quick done',
        'Status': 'Done',
        'Created Date': daysAgo(5),
        'In Progress Date': daysAgo(3),
        'Resolution Date': daysAgo(0),
      },
    ] as Record<string, unknown>[];

    const metrics = calculateDashboardMetrics(issues);
    const item = metrics.flow.items.find((i) => i.key === 'H-8');
    expect(item?.health).toBe('good');
  });

  it('marks overdue but already Done issue as good (not overdue)', () => {
    // Due date has passed but the issue is Done — should NOT be flagged overdue
    const issues = [
      {
        'Issue Key': 'H-9',
        'Issue Type': 'Story',
        'Summary': 'Technically overdue but done',
        'Status': 'Done',
        'Created Date': daysAgo(15),
        'Resolution Date': daysAgo(1),
        'Due Date': daysAgo(3),
      },
    ] as Record<string, unknown>[];

    const metrics = calculateDashboardMetrics(issues);
    const item = metrics.flow.items.find((i) => i.key === 'H-9');
    // Done issues are never marked overdue by the logic
    expect(item?.health).not.toBe('critical');
  });
});

// ---------------------------------------------------------------------------
// 3. Prediction
// ---------------------------------------------------------------------------

describe('Group 3 — Prediction', () => {
  it('returns complete:true when all issues are done', () => {
    const issues = [
      { 'Issue Key': 'P-1', 'Issue Type': 'Story', 'Summary': 'Done 1', 'Status': 'Done', 'Created Date': daysAgo(10), 'Resolution Date': daysAgo(5) },
      { 'Issue Key': 'P-2', 'Issue Type': 'Story', 'Summary': 'Done 2', 'Status': 'Done', 'Created Date': daysAgo(10), 'Resolution Date': daysAgo(3) },
    ] as Record<string, unknown>[];

    const metrics = calculateDashboardMetrics(issues);
    expect(metrics.prediction.complete).toBe(true);
  });

  it('returns daysRemaining:0 when all issues are done', () => {
    const issues = [
      { 'Issue Key': 'P-3', 'Issue Type': 'Story', 'Summary': 'All done', 'Status': 'Done', 'Created Date': daysAgo(10), 'Resolution Date': daysAgo(2) },
    ] as Record<string, unknown>[];

    const metrics = calculateDashboardMetrics(issues);
    expect(metrics.prediction.daysRemaining).toBe(0);
  });

  it('returns daysRemaining:null when no Created Date is available', () => {
    const issues = [
      { 'Issue Key': 'P-4', 'Issue Type': 'Story', 'Summary': 'No dates', 'Status': 'To Do' },
      { 'Issue Key': 'P-5', 'Issue Type': 'Story', 'Summary': 'No dates either', 'Status': 'In Progress' },
    ] as Record<string, unknown>[];

    const metrics = calculateDashboardMetrics(issues);
    expect(metrics.prediction.daysRemaining).toBeNull();
  });

  it('returns daysRemaining >= 0 for partial completion with dates', () => {
    const issues = [
      { 'Issue Key': 'P-6', 'Issue Type': 'Story', 'Summary': 'Done', 'Status': 'Done', 'Created Date': daysAgo(20), 'Resolution Date': daysAgo(5) },
      { 'Issue Key': 'P-7', 'Issue Type': 'Story', 'Summary': 'Open A', 'Status': 'To Do', 'Created Date': daysAgo(20) },
      { 'Issue Key': 'P-8', 'Issue Type': 'Story', 'Summary': 'Open B', 'Status': 'In Progress', 'Created Date': daysAgo(20) },
    ] as Record<string, unknown>[];

    const metrics = calculateDashboardMetrics(issues);
    expect(metrics.prediction.complete).toBe(false);
    expect(metrics.prediction.daysRemaining).not.toBeNull();
    expect(metrics.prediction.daysRemaining as number).toBeGreaterThanOrEqual(0);
  });

  it('returns complete:false when there are remaining open issues', () => {
    const issues = [
      { 'Issue Key': 'P-9', 'Issue Type': 'Story', 'Summary': 'Done', 'Status': 'Done', 'Created Date': daysAgo(10), 'Resolution Date': daysAgo(5) },
      { 'Issue Key': 'P-10', 'Issue Type': 'Story', 'Summary': 'Still open', 'Status': 'To Do', 'Created Date': daysAgo(10) },
    ] as Record<string, unknown>[];

    const metrics = calculateDashboardMetrics(issues);
    expect(metrics.prediction.complete).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 4. Sprint data
// ---------------------------------------------------------------------------

describe('Group 4 — Sprint data', () => {
  it('returns hasSprintData:false when no Sprint field is present', () => {
    const issues = [
      { 'Issue Key': 'SP-1', 'Issue Type': 'Story', 'Summary': 'No sprint', 'Status': 'To Do' },
      { 'Issue Key': 'SP-2', 'Issue Type': 'Bug', 'Summary': 'Also no sprint', 'Status': 'Done', 'Created Date': '01/Jan/24', 'Resolution Date': '10/Jan/24' },
    ] as Record<string, unknown>[];

    const metrics = calculateDashboardMetrics(issues);
    expect(metrics.sprint.hasSprintData).toBe(false);
  });

  it('returns sprintCount:0 when no Sprint field is present', () => {
    const issues = [
      { 'Issue Key': 'SP-3', 'Issue Type': 'Story', 'Summary': 'No sprint', 'Status': 'To Do' },
    ] as Record<string, unknown>[];

    const metrics = calculateDashboardMetrics(issues);
    expect(metrics.sprint.sprintCount).toBe(0);
  });

  it('returns hasSprintData:true when Sprint field is present', () => {
    const issues = [
      { 'Issue Key': 'SP-4', 'Issue Type': 'Story', 'Summary': 'Sprinted', 'Status': 'Done', 'Sprint': 'Sprint 1', 'Story Points': '3' },
      { 'Issue Key': 'SP-5', 'Issue Type': 'Story', 'Summary': 'Also sprinted', 'Status': 'In Progress', 'Sprint': 'Sprint 1', 'Story Points': '2' },
    ] as Record<string, unknown>[];

    const metrics = calculateDashboardMetrics(issues);
    expect(metrics.sprint.hasSprintData).toBe(true);
  });

  it('returns sprintCount > 0 when Sprint field is populated', () => {
    const issues = [
      { 'Issue Key': 'SP-6', 'Issue Type': 'Story', 'Summary': 'Sprint A', 'Status': 'Done', 'Sprint': 'Sprint 1' },
      { 'Issue Key': 'SP-7', 'Issue Type': 'Story', 'Summary': 'Sprint B', 'Status': 'To Do', 'Sprint': 'Sprint 2' },
    ] as Record<string, unknown>[];

    const metrics = calculateDashboardMetrics(issues);
    expect(metrics.sprint.sprintCount).toBeGreaterThan(0);
  });

  it('counts distinct sprint groups correctly', () => {
    const issues = [
      { 'Issue Key': 'SP-8', 'Issue Type': 'Story', 'Summary': 'A1', 'Status': 'Done', 'Sprint': 'Sprint 1' },
      { 'Issue Key': 'SP-9', 'Issue Type': 'Story', 'Summary': 'A2', 'Status': 'Done', 'Sprint': 'Sprint 1' },
      { 'Issue Key': 'SP-10', 'Issue Type': 'Story', 'Summary': 'B1', 'Status': 'To Do', 'Sprint': 'Sprint 2' },
    ] as Record<string, unknown>[];

    const metrics = calculateDashboardMetrics(issues);
    expect(metrics.sprint.sprintCount).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// 5. Risk metrics
// ---------------------------------------------------------------------------

describe('Group 5 — Risk metrics', () => {
  it('counts blockedIssues correctly', () => {
    const issues = [
      { 'Issue Key': 'R-1', 'Issue Type': 'Story', 'Summary': 'Blocked A', 'Status': 'In Progress', 'Blocked Flag': true },
      { 'Issue Key': 'R-2', 'Issue Type': 'Story', 'Summary': 'Blocked B', 'Status': 'To Do', 'Blocked Flag': 'true' },
      { 'Issue Key': 'R-3', 'Issue Type': 'Story', 'Summary': 'Not blocked', 'Status': 'To Do' },
    ] as Record<string, unknown>[];

    const metrics = calculateDashboardMetrics(issues);
    expect(metrics.risk.blockedIssues).toBe(2);
  });

  it('returns blockedIssues:0 when no issues are blocked', () => {
    const issues = [
      { 'Issue Key': 'R-4', 'Issue Type': 'Story', 'Summary': 'Fine', 'Status': 'In Progress' },
    ] as Record<string, unknown>[];

    const metrics = calculateDashboardMetrics(issues);
    expect(metrics.risk.blockedIssues).toBe(0);
  });

  it('counts overdueIssues correctly', () => {
    const issues = [
      { 'Issue Key': 'R-5', 'Issue Type': 'Story', 'Summary': 'Overdue X', 'Status': 'To Do', 'Created Date': daysAgo(30), 'Due Date': daysAgo(5) },
      { 'Issue Key': 'R-6', 'Issue Type': 'Story', 'Summary': 'Overdue Y', 'Status': 'In Progress', 'Created Date': daysAgo(20), 'Due Date': daysAgo(2) },
      { 'Issue Key': 'R-7', 'Issue Type': 'Story', 'Summary': 'Not overdue', 'Status': 'To Do', 'Created Date': daysAgo(5) },
    ] as Record<string, unknown>[];

    const metrics = calculateDashboardMetrics(issues);
    expect(metrics.risk.overdueIssues).toBe(2);
  });

  it('returns overdueIssues:0 when no issues are overdue', () => {
    const issues = [
      { 'Issue Key': 'R-8', 'Issue Type': 'Story', 'Summary': 'On track', 'Status': 'In Progress', 'Created Date': daysAgo(3) },
    ] as Record<string, unknown>[];

    const metrics = calculateDashboardMetrics(issues);
    expect(metrics.risk.overdueIssues).toBe(0);
  });

  it('does not count Done issues as overdue even if due date has passed', () => {
    const issues = [
      {
        'Issue Key': 'R-9',
        'Issue Type': 'Story',
        'Summary': 'Done but past due',
        'Status': 'Done',
        'Created Date': daysAgo(20),
        'Resolution Date': daysAgo(2),
        'Due Date': daysAgo(10),
      },
    ] as Record<string, unknown>[];

    const metrics = calculateDashboardMetrics(issues);
    expect(metrics.risk.overdueIssues).toBe(0);
  });

  it('counts highPriorityOpenIssues correctly', () => {
    const issues = [
      { 'Issue Key': 'R-10', 'Issue Type': 'Story', 'Summary': 'High open', 'Status': 'In Progress', 'Priority': 'High' },
      { 'Issue Key': 'R-11', 'Issue Type': 'Story', 'Summary': 'Highest open', 'Status': 'To Do', 'Priority': 'Highest' },
      { 'Issue Key': 'R-12', 'Issue Type': 'Story', 'Summary': 'Low open', 'Status': 'To Do', 'Priority': 'Low' },
      { 'Issue Key': 'R-13', 'Issue Type': 'Story', 'Summary': 'High done', 'Status': 'Done', 'Priority': 'High', 'Resolution Date': daysAgo(1) },
    ] as Record<string, unknown>[];

    const metrics = calculateDashboardMetrics(issues);
    expect(metrics.risk.highPriorityOpenIssues).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// 6. Labels
// ---------------------------------------------------------------------------

describe('Group 6 — Labels', () => {
  it('populates labels field for an issue that has a Labels string', () => {
    const issues = [
      {
        'Issue Key': 'L-1',
        'Issue Type': 'Story',
        'Summary': 'Labelled item',
        'Status': 'To Do',
        'Labels': 'frontend, performance',
      },
    ] as Record<string, unknown>[];

    const metrics = calculateDashboardMetrics(issues);
    const item = metrics.flow.items.find((i) => i.key === 'L-1');
    expect(item?.labels).toBeTruthy();
    expect(item?.labels).toContain('frontend');
  });

  it('returns empty labels string for issue with no Labels field', () => {
    const issues = [
      { 'Issue Key': 'L-2', 'Issue Type': 'Story', 'Summary': 'No labels', 'Status': 'To Do' },
    ] as Record<string, unknown>[];

    const metrics = calculateDashboardMetrics(issues);
    const item = metrics.flow.items.find((i) => i.key === 'L-2');
    expect(item?.labels).toBe('');
  });

  it('counts totalLabeled in label metrics correctly', () => {
    const issues = [
      { 'Issue Key': 'L-3', 'Issue Type': 'Story', 'Summary': 'Has label', 'Status': 'To Do', 'Labels': 'backend' },
      { 'Issue Key': 'L-4', 'Issue Type': 'Story', 'Summary': 'No label', 'Status': 'To Do' },
    ] as Record<string, unknown>[];

    const metrics = calculateDashboardMetrics(issues);
    expect(metrics.labels.totalLabeled).toBe(1);
    expect(metrics.labels.totalUnlabeled).toBe(1);
  });

  it('counts uniqueLabels in label metrics correctly', () => {
    const issues = [
      { 'Issue Key': 'L-5', 'Issue Type': 'Story', 'Summary': 'Multi labels', 'Status': 'To Do', 'Labels': 'alpha, beta' },
      { 'Issue Key': 'L-6', 'Issue Type': 'Story', 'Summary': 'One label', 'Status': 'To Do', 'Labels': 'alpha' },
    ] as Record<string, unknown>[];

    const metrics = calculateDashboardMetrics(issues);
    // alpha appears on both, beta on one — 2 unique labels
    expect(metrics.labels.uniqueLabels).toBe(2);
  });

  it('semicolon-separated labels are each counted as distinct', () => {
    const issues = [
      { 'Issue Key': 'L-7', 'Issue Type': 'Story', 'Summary': 'Semicolons', 'Status': 'To Do', 'Labels': 'x;y;z' },
    ] as Record<string, unknown>[];

    const metrics = calculateDashboardMetrics(issues);
    const item = metrics.flow.items.find((i) => i.key === 'L-7');
    // labels string should contain all three values joined
    expect(item?.labels.split(', ').length).toBe(3);
  });
});
