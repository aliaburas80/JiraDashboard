// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.

import { computeSeverityTrend } from '@/services/coaching/coachingTrend.service';

describe('TEST-RBC-TREND-01: computeSeverityTrend', () => {
  test('TC-RBC-TREND-01a: lower urgency than before is improved', () => {
    expect(computeSeverityTrend('medium', 'critical')).toBe('improved');
    expect(computeSeverityTrend('low', 'high')).toBe('improved');
  });

  test('TC-RBC-TREND-01b: higher urgency than before is worsened', () => {
    expect(computeSeverityTrend('critical', 'medium')).toBe('worsened');
    expect(computeSeverityTrend('high', 'low')).toBe('worsened');
  });

  test('TC-RBC-TREND-01c: unchanged severity is same', () => {
    expect(computeSeverityTrend('critical', 'critical')).toBe('same');
    expect(computeSeverityTrend('low', 'low')).toBe('same');
  });
});
