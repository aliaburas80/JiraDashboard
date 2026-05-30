// @ts-nocheck
import { calculateDashboardMetrics } from '../services/metrics/metrics.service';

describe('calculateDashboardMetrics', () => {
  const mockIssues = [
    { 'Issue Key': 'TEST-1', 'Issue Type': 'Story', 'Summary': 'Test story', 'Status': 'Done',
      'Created Date': '01/Jan/24', 'Resolution Date': '15/Jan/24', 'Assignee': 'Alice', 'Story Points': '3' },
    { 'Issue Key': 'TEST-2', 'Issue Type': 'Bug', 'Summary': 'Test bug', 'Status': 'In Progress',
      'Created Date': '01/Jan/24', 'Assignee': 'Bob', 'Story Points': '2' },
    { 'Issue Key': 'TEST-3', 'Issue Type': 'Story', 'Summary': 'Another story', 'Status': 'To Do',
      'Created Date': '01/Jan/24', 'Assignee': 'Alice', 'Story Points': '5' },
  ] as Record<string, unknown>[];

  it('calculates totalIssues correctly', () => {
    const metrics = calculateDashboardMetrics(mockIssues);
    expect(metrics.totalIssues).toBe(3);
  });

  it('calculates doneIssues correctly', () => {
    const metrics = calculateDashboardMetrics(mockIssues);
    expect(metrics.doneIssues).toBe(1);
  });

  it('calculates completionRate correctly', () => {
    const metrics = calculateDashboardMetrics(mockIssues);
    expect(metrics.completionRate).toBe(33);
  });

  it('returns flow items for each issue', () => {
    const metrics = calculateDashboardMetrics(mockIssues);
    expect(metrics.flow.items.length).toBe(3);
  });

  it('identifies orphan issues', () => {
    const metrics = calculateDashboardMetrics(mockIssues);
    const orphans = metrics.flow.items.filter(i => i.isOrphan);
    expect(orphans.length).toBe(3); // no epics in mock data
  });

  it('includes story points metrics', () => {
    const metrics = calculateDashboardMetrics(mockIssues);
    expect(metrics.storyPoints.totalStoryPoints).toBe(10);
    expect(metrics.storyPoints.completedStoryPoints).toBe(3);
  });

  it('calculates healthScore between 0 and 100', () => {
    const metrics = calculateDashboardMetrics(mockIssues);
    expect(metrics.healthScore).toBeGreaterThanOrEqual(0);
    expect(metrics.healthScore).toBeLessThanOrEqual(100);
  });
});
