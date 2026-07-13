// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Roadmap page epic-forecast logic — TC-ROAD-01 to TC-ROAD-05
// Mirrors forecastEpic() in app/roadmap/page.tsx (see product/TEST_CASES.md §9.54).
//
// forecastEpic() itself was never buggy — only its caller's avgThroughput
// input was (CP3-008: the page computed it inline against the wrong field
// name on the wrong sprint source, always producing 0). That call site now
// uses the shared, tested computeAverageThroughput() from
// forecastEngine.service.ts instead of a page-local duplicate — see
// TC-FCAST-07b in forecastEngine.test.ts for the regression coverage.

import type { EpicSummary } from '@/lib/portfolioHealth';

interface EpicForecast extends EpicSummary {
  remainingIssues:  number;
  sprintsRemaining: number | null;
  weeksRemaining:   number | null;
  forecastLabel:    string;
  confidence:       'high' | 'medium' | 'low';
}

function forecastEpic(epic: EpicSummary, avgThroughput: number): EpicForecast {
  const remaining = epic.issues - epic.completedIssues;
  if (epic.progress >= 100)
    return { ...epic, remainingIssues: 0, sprintsRemaining: 0, weeksRemaining: 0, forecastLabel: 'Complete', confidence: 'high' };
  if (avgThroughput <= 0 || remaining <= 0)
    return { ...epic, remainingIssues: remaining, sprintsRemaining: null, weeksRemaining: null, forecastLabel: 'Insufficient data', confidence: 'low' };
  const sprints    = remaining / avgThroughput;
  const weeks      = Math.ceil(sprints * 2);
  const confidence = sprints < 2 ? 'high' : sprints < 5 ? 'medium' : 'low';
  const label      = weeks <= 2 ? 'Within 2 weeks' : weeks <= 6 ? `~${weeks} weeks` : `~${Math.round(weeks / 4)} months`;
  return { ...epic, remainingIssues: remaining, sprintsRemaining: parseFloat(sprints.toFixed(1)), weeksRemaining: weeks, forecastLabel: label, confidence };
}

function buildEpic(overrides: Partial<EpicSummary> = {}): EpicSummary {
  return {
    name: 'Epic A', issues: 10, completedIssues: 0, storyPoints: 0, doneStoryPoints: 0,
    progress: 0, pointProgress: 0, critical: 0, warning: 0, good: 0, health: 'good',
    ...overrides,
  };
}

// TC-ROAD-01: progress >= 100 → Complete
test('TC-ROAD-01: epic at 100% progress forecasts as Complete', () => {
  const epic = buildEpic({ progress: 100, completedIssues: 10 });
  const result = forecastEpic(epic, 5);
  expect(result.forecastLabel).toBe('Complete');
  expect(result.confidence).toBe('high');
  expect(result.weeksRemaining).toBe(0);
});

// TC-ROAD-02: avgThroughput = 0 → Insufficient data
test('TC-ROAD-02: zero average throughput forecasts as Insufficient data', () => {
  const epic = buildEpic({ issues: 10, completedIssues: 2 });
  const result = forecastEpic(epic, 0);
  expect(result.forecastLabel).toBe('Insufficient data');
  expect(result.confidence).toBe('low');
  expect(result.sprintsRemaining).toBeNull();
});

// TC-ROAD-03: 3 remaining issues, throughput 5 → Within 2 weeks, high confidence
test('TC-ROAD-03: 3 remaining issues at throughput 5 forecasts Within 2 weeks (high confidence)', () => {
  const epic = buildEpic({ issues: 10, completedIssues: 7 });
  const result = forecastEpic(epic, 5);
  expect(result.sprintsRemaining).toBe(0.6);
  expect(result.weeksRemaining).toBe(2);
  expect(result.forecastLabel).toBe('Within 2 weeks');
  expect(result.confidence).toBe('high');
});

// TC-ROAD-04: 12 remaining issues, throughput 4 → ~6 weeks, medium confidence
test('TC-ROAD-04: 12 remaining issues at throughput 4 forecasts ~6 weeks (medium confidence)', () => {
  const epic = buildEpic({ issues: 12, completedIssues: 0 });
  const result = forecastEpic(epic, 4);
  expect(result.sprintsRemaining).toBe(3);
  expect(result.weeksRemaining).toBe(6);
  expect(result.forecastLabel).toBe('~6 weeks');
  expect(result.confidence).toBe('medium');
});

// TC-ROAD-05: 40 remaining issues, throughput 4 → ~5 months, low confidence
test('TC-ROAD-05: 40 remaining issues at throughput 4 forecasts ~5 months (low confidence)', () => {
  const epic = buildEpic({ issues: 40, completedIssues: 0 });
  const result = forecastEpic(epic, 4);
  expect(result.weeksRemaining).toBe(20);
  expect(result.forecastLabel).toBe('~5 months');
  expect(result.confidence).toBe('low');
});

// Edge case: remaining <= 0 but progress < 100 (data inconsistency) → Insufficient data, not a crash
test('TC-ROAD-02b: remaining issues <= 0 with progress under 100 forecasts as Insufficient data', () => {
  const epic = buildEpic({ issues: 5, completedIssues: 5, progress: 90 });
  const result = forecastEpic(epic, 5);
  expect(result.forecastLabel).toBe('Insufficient data');
  expect(result.confidence).toBe('low');
});
