import { buildEvidenceAnswer } from '@/lib/intelligence/evidence';
import { refineEvidenceAnswer } from '@/lib/intelligence/evidenceQuestion';
import type { IntelligenceSnapshot } from '@/lib/intelligence/types';

function snapshotFixture(): IntelligenceSnapshot {
  return {
    generatedAt: '2026-08-25T20:00:00.000Z',
    totalIssues: 35,
    doneIssues: 22,
    activeIssues: 6,
    completionRate: 63,
    deliveryConfidence: 0,
    healthScore: 68,
    blockedIssues: 1,
    criticalIssues: 9,
    openDefects: 1,
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
      {
        key: 'DC-18',
        summary: 'Forecast data cleanup',
        status: 'To Do',
        assignee: 'Omar Nasser',
        reason: 'High priority open work',
        ageDays: 16,
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
    ],
    sourceInsights: ['One blocker is constraining flow.'],
  };
}

function ask(agent: 'executive' | 'flow' | 'risk' | 'forecast', question: string) {
  const snapshot = snapshotFixture();
  return refineEvidenceAnswer(buildEvidenceAnswer(agent, snapshot), snapshot, question);
}

describe('question-aware deterministic Evidence mode', () => {
  it('returns distinct Executive answers for the three suggested questions', () => {
    const attention = ask('executive', 'What should leadership pay attention to today?');
    const briefing = ask('executive', 'Give me a one-minute delivery briefing.');
    const threat = ask('executive', 'What is the biggest threat to delivery confidence?');

    expect(new Set([attention.title, briefing.title, threat.title]).size).toBe(3);
    expect(briefing.title).toBe('One-minute delivery briefing');
    expect(briefing.summary).toContain('22 of 35');
    expect(threat.title).toBe('Biggest threat to delivery confidence');
    expect(threat.summary).toContain('DC-24');
    expect(attention.summary).not.toContain('Asked:');
  });

  it('answers Flow questions with bottleneck, unblock, and capacity-specific evidence', () => {
    const stuck = ask('flow', 'Where is work getting stuck?');
    const unblock = ask('flow', 'Which items should we unblock first?');
    const capacity = ask('flow', 'Is team capacity concentrated on too few people?');

    expect(stuck.title).toBe('Where work is getting stuck');
    expect(unblock.title).toBe('Unblock-first queue');
    expect(unblock.summary).toContain('DC-24');
    expect(capacity.title).toBe('Capacity concentration check');
    expect(capacity.summary).toContain('44%');
  });

  it('answers Risk questions with risk ranking, action split, and data confidence', () => {
    const topRisks = ask('risk', 'What are the top delivery risks?');
    const actionNow = ask('risk', 'Which risks need action now versus monitoring?');
    const trust = ask('risk', 'Can I trust this data enough to make a decision?');

    expect(topRisks.title).toBe('Top delivery risks');
    expect(topRisks.findings[0]?.title).toBe('DC-24');
    expect(actionNow.title).toBe('Act now vs monitor');
    expect(actionNow.findings.some(item => item.title.includes('ACT NOW'))).toBe(true);
    expect(trust.title).toBe('Decision-data confidence');
    expect(trust.summary).toContain('92%');
  });

  it('answers Forecast questions with completion, movement, and confidence-specific evidence', () => {
    const finish = ask('forecast', 'When are we likely to finish?');
    const movement = ask('forecast', 'What could move the forecast date?');
    const confidence = ask('forecast', 'How confident should I be in the current outlook?');

    expect(finish.title).toBe('Likely completion');
    expect(finish.summary).toContain('2026-09-12');
    expect(movement.title).toBe('What could move the forecast date');
    expect(movement.summary).toContain('1 blocked');
    expect(confidence.title).toBe('Forecast confidence');
    expect(confidence.summary).toContain('0%');
  });

  it('keeps baseline specialist evidence for unmatched free-form questions', () => {
    const answer = ask('executive', 'Tell me something unrelated to the supported delivery intents.');

    expect(answer.title).toBe('Leadership delivery brief');
    expect(answer.mode).toBe('evidence');
    expect(answer.summary).not.toContain('Asked:');
  });
});
