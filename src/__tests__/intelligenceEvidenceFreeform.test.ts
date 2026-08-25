import { buildEvidenceAnswer } from '@/lib/intelligence/evidence';
import { answerFreeformEvidenceQuestion } from '@/lib/intelligence/evidenceFreeform';
import type { IntelligenceSnapshot } from '@/lib/intelligence/types';

function snapshotFixture(): IntelligenceSnapshot {
  return {
    generatedAt: '2026-08-26T00:00:00.000Z',
    totalIssues: 35,
    doneIssues: 22,
    activeIssues: 6,
    completionRate: 63,
    deliveryConfidence: 51,
    healthScore: 68,
    blockedIssues: 1,
    criticalIssues: 9,
    openDefects: 3,
    dataQualityScore: 92,
    averageLeadTimeDays: 18.2,
    averageCycleTimeDays: 11.4,
    forecast: {
      complete: false,
      daysRemaining: 18,
      predictedDate: '2026-09-12',
      velocityPerDay: 0.72,
    },
    riskItems: [
      {
        key: 'DC-24',
        summary: 'Kanban flow analytics with WIP and aging detection',
        status: 'Blocked',
        assignee: 'Ahmed Nasser',
        reason: 'Blocked by a delivery dependency',
        ageDays: 556,
        blocked: true,
        severity: 'critical',
      },
      {
        key: 'DC-31',
        summary: 'Release readiness checks',
        status: 'In Progress',
        assignee: 'Maya Saleh',
        reason: 'Active work is aging',
        ageDays: 28,
        blocked: false,
        severity: 'warning',
      },
    ],
    capacityHotspots: [
      { assignee: 'Ahmed Nasser', loadShare: 44, activeIssues: 4, issues: 12 },
      { assignee: 'Maya Saleh', loadShare: 27, activeIssues: 2, issues: 9 },
    ],
    epicSignals: [
      { name: 'Flow analytics', progress: 52, critical: 3, warning: 1, issues: 8 },
      { name: 'Release readiness', progress: 78, critical: 1, warning: 2, issues: 10 },
    ],
    sourceInsights: [
      'Average lead time is 18.2 days across 22 completed items.',
      '37 sprint groups were found for sprint commitment and completion analysis.',
      '5650 of 15948 story points are complete.',
    ],
  };
}

function ask(question: string) {
  const snapshot = snapshotFixture();
  return answerFreeformEvidenceQuestion(buildEvidenceAnswer('executive', snapshot), snapshot, question);
}

describe('free-form deterministic evidence QA', () => {
  it('answers metric questions regardless of selected specialist', () => {
    expect(ask('How many active issues do we have?').summary).toContain('6 issues are active');
    expect(ask('What is our average cycle time?').summary).toContain('11.4 days');
    expect(ask('How many open defects are there?').summary).toContain('3 open defects');
    expect(ask('What is the delivery confidence score?').summary).toContain('51%');
  });

  it('answers named Jira issue questions from ranked evidence', () => {
    const answer = ask('Tell me everything you have about DC-31.');
    expect(answer.title).toBe('DC-31 snapshot detail');
    expect(answer.summary).toContain('Maya Saleh');
    expect(answer.summary).toContain('28 days');
  });

  it('answers assignee and capacity questions from analyzed evidence', () => {
    const answer = ask('What do you know about Ahmed Nasser?');
    expect(answer.title).toBe('Ahmed Nasser in this snapshot');
    expect(answer.summary).toContain('44%');
    expect(answer.summary).toContain('DC-24');
  });

  it('answers named epic questions', () => {
    const answer = ask('How is the Release readiness epic doing?');
    expect(answer.title).toBe('Release readiness epic signal');
    expect(answer.summary).toContain('78% complete');
    expect(answer.summary).toContain('1 critical');
  });

  it('retrieves matching analysis insights for other supported data questions', () => {
    const sprint = ask('What does the analysis say about sprint groups?');
    expect(sprint.title).toBe('Matching analyzed evidence');
    expect(sprint.findings.some(item => item.detail.includes('37 sprint groups'))).toBe(true);

    const points = ask('What does the data say about completed story points?');
    expect(points.findings.some(item => item.detail.includes('5650 of 15948 story points'))).toBe(true);
  });

  it('does not invent an answer outside the snapshot boundary', () => {
    const answer = ask('What is the weather in Amman tomorrow?');
    expect(answer.title).toBe('Insufficient evidence in this snapshot');
    expect(answer.summary).toContain('without guessing');
    expect(answer.mode).toBe('evidence');
  });
});
