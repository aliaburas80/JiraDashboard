import { buildSharedReportPayload } from '@/services/export/sharedReportPayload.service';
import type { DashboardMetrics } from '@/types/metrics';

describe('shared stakeholder report payload', () => {
  it('keeps only the approved risk fields and caps public detail rows at 25', () => {
    const riskItems = Array.from({ length: 30 }, (_, index) => ({
      key: `DC-${index + 1}`,
      summary: `Risk ${index + 1}`,
      status: 'In Progress',
      assignee: `Owner ${index + 1}`,
      reason: 'Delivery risk',
      health: index % 2 === 0 ? 'critical' : 'warning',
      labels: ['internal-only'],
      project: 'SECRET',
      createdDate: '2026-01-01',
    }));

    const metrics = {
      healthScore: 78,
      totalIssues: 120,
      doneIssues: 80,
      completionRate: 66.7,
      blockedIssues: 4,
      openDefects: 6,
      flow: {
        averageLeadTimeDays: 8.5,
        averageCycleTimeDays: 4.2,
        items: riskItems,
      },
    } as unknown as DashboardMetrics;

    const report = buildSharedReportPayload(metrics, 'Client Report', new Date('2026-08-18T07:00:00.000Z'));

    expect(report.risks).toHaveLength(25);
    expect(report.risks[0]).toEqual({
      key: 'DC-1',
      summary: 'Risk 1',
      status: 'In Progress',
      assignee: 'Owner 1',
      reason: 'Delivery risk',
    });
    expect(report.risks[0]).not.toHaveProperty('labels');
    expect(report.risks[0]).not.toHaveProperty('project');
    expect(report.risks[0]).not.toHaveProperty('createdDate');
    expect(report.generatedAt).toBe('2026-08-18T07:00:00.000Z');
  });

  it('excludes ordinary healthy rows that have no stakeholder attention reason', () => {
    const metrics = {
      healthScore: 95,
      totalIssues: 2,
      doneIssues: 1,
      completionRate: 50,
      blockedIssues: 0,
      openDefects: 0,
      flow: {
        averageLeadTimeDays: 3,
        averageCycleTimeDays: 2,
        items: [
          { key: 'DC-1', summary: 'Normal work', status: 'Done', health: 'good' },
          { key: 'DC-2', summary: 'Needs attention', status: 'In Progress', health: 'good', reason: 'External dependency' },
        ],
      },
    } as unknown as DashboardMetrics;

    const report = buildSharedReportPayload(metrics);
    expect(report.risks.map(item => item.key)).toEqual(['DC-2']);
  });
});
