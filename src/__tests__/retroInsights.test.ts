// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Retrospective insights engine — TC-RETRO-14 to TC-RETRO-20 (RETRO-11,13,29,33-36)

import {
  generateRetrospectiveInsight, generateInsightsForRecords, detectRepeatedBlockers,
} from '@/services/retro/retroInsights.service';
import type { RetroRecord } from '@/types/retrospective';

function buildRecord(overrides: Partial<RetroRecord> = {}): RetroRecord {
  return {
    sprintName: 'Sprint 1', teamName: '', retroDate: '', goalMet: '', sprintGoal: '',
    wentWell: [], didntGoWell: [], blockers: [], actions: [],
    ...overrides,
  };
}

// TC-RETRO-14: theme detection
test('TC-RETRO-14: detects the qa-release theme from QA/release-related text', () => {
  const record = buildRecord({ didntGoWell: ['QA found several regression bugs before release'] });
  const insight = generateRetrospectiveInsight(record, 'form');
  expect(insight.themes.some(t => t.category === 'qa-release')).toBe(true);
});

// TC-RETRO-14b: positive feedback must never be flagged as a theme to "address"
test('TC-RETRO-14b: positive "What Went Well" text does not pollute theme detection', () => {
  const record = buildRecord({
    wentWell: ['Automated tests caught regressions before release'],
    didntGoWell: [],
    blockers: [],
  });
  const insight = generateRetrospectiveInsight(record, 'form');
  expect(insight.themes).toEqual([]);
  expect(insight.nextSprintSuggestions.some(s => s.includes('qa-release') || s.includes('QA & Release'))).toBe(false);
});

// TC-RETRO-14c: a sprint-planning-ceremony complaint is recognised as a process theme
test('TC-RETRO-14c: detects the process theme from sprint-planning ceremony complaints', () => {
  const record = buildRecord({ didntGoWell: ['Sprint planning was too long'] });
  const insight = generateRetrospectiveInsight(record, 'form');
  expect(insight.themes.some(t => t.category === 'process')).toBe(true);
});

// TC-RETRO-15: ownership gaps
test('TC-RETRO-15: flags missing owner and missing due date on action items', () => {
  const record = buildRecord({ actions: [{ text: 'Fix flaky test', owner: '', dueDate: '', priority: 'medium' }] });
  const insight = generateRetrospectiveInsight(record, 'form');
  expect(insight.ownershipGaps).toHaveLength(2);
  expect(insight.ownershipGaps.some(g => g.includes('missing an owner'))).toBe(true);
  expect(insight.ownershipGaps.some(g => g.includes('missing a due date'))).toBe(true);
});

// TC-RETRO-16: duplicate action items, case-insensitive
test('TC-RETRO-16: flags duplicate action items case-insensitively', () => {
  const record = buildRecord({
    actions: [
      { text: 'Improve standup', owner: 'A', dueDate: '', priority: 'medium' },
      { text: ' improve STANDUP ', owner: 'B', dueDate: '', priority: 'low' },
    ],
  });
  const insight = generateRetrospectiveInsight(record, 'form');
  expect(insight.duplicateActionItems).toContain('improve standup');
});

// TC-RETRO-17: next-sprint suggestions reference goal outcome, blockers, and the top theme
test('TC-RETRO-17: next-sprint suggestions cite goal outcome, blocker count, and top theme', () => {
  const record = buildRecord({
    goalMet: 'no',
    didntGoWell: ['Requirements were unclear from the start'],
    blockers: ['Infra dependency blocked deploy'],
  });
  const insight = generateRetrospectiveInsight(record, 'form');
  expect(insight.nextSprintSuggestions).toHaveLength(3);
  expect(insight.nextSprintSuggestions[0]).toMatch(/re-plan/i);
  expect(insight.nextSprintSuggestions[1]).toMatch(/blocker/i);
  expect(insight.nextSprintSuggestions[2]).toMatch(/requirements/i);
});

// TC-RETRO-18: confidence scales with how many fields were actually filled in
test('TC-RETRO-18: confidence is high/medium/low based on filled-field count', () => {
  const high = generateRetrospectiveInsight(buildRecord({ sprintGoal: 'Goal', goalMet: 'yes', wentWell: ['a'], didntGoWell: ['b'] }), 'form');
  const medium = generateRetrospectiveInsight(buildRecord({ sprintGoal: 'Goal', goalMet: 'yes' }), 'form');
  const low = generateRetrospectiveInsight(buildRecord(), 'form');

  expect(high.confidence).toBe('high');
  expect(medium.confidence).toBe('medium');
  expect(low.confidence).toBe('low');
});

// TC-RETRO-19: an empty record produces a safe, non-crashing insight
test('TC-RETRO-19: an empty record produces safe fallback fields without throwing', () => {
  const insight = generateRetrospectiveInsight(buildRecord({ sprintName: '' }), 'form');
  expect(insight.themes).toEqual([]);
  expect(insight.ownershipGaps).toEqual([]);
  expect(insight.duplicateActionItems).toEqual([]);
  expect(insight.confidence).toBe('low');
});

// TC-RETRO-20: repeated blockers are detected across multiple uploaded records
test('TC-RETRO-20: detects a blocker repeated across multiple sprints', () => {
  const records: RetroRecord[] = [
    buildRecord({ sprintName: 'Sprint 1', blockers: ['Same blocker'] }),
    buildRecord({ sprintName: 'Sprint 2', blockers: ['same blocker '] }),
    buildRecord({ sprintName: 'Sprint 3', blockers: ['Unrelated issue'] }),
  ];

  const repeated = detectRepeatedBlockers(records);
  expect(repeated).toContain('same blocker');

  const insights = generateInsightsForRecords(records, 'upload');
  expect(insights[0].repeatedBlockers).toContain('same blocker');
  expect(insights[1].repeatedBlockers).toContain('same blocker');
  expect(insights[2].repeatedBlockers).toContain('same blocker');
});
