import { parseRoadmapDateMs } from '@/lib/roadmapDate';

describe('parseRoadmapDateMs', () => {
  test('parses Jira DD/Mon/YYYY dates deterministically', () => {
    expect(parseRoadmapDateMs('01/Jan/2025')).toBe(Date.UTC(2025, 0, 1));
    expect(parseRoadmapDateMs('08/Feb/2025')).toBe(Date.UTC(2025, 1, 8));
  });

  test('accepts Jira dates with a time suffix at day granularity', () => {
    expect(parseRoadmapDateMs('15/Mar/2025 10:30 AM')).toBe(Date.UTC(2025, 2, 15));
  });

  test('keeps ISO dates supported', () => {
    expect(parseRoadmapDateMs('2025-04-20T00:00:00.000Z')).toBe(Date.UTC(2025, 3, 20));
  });

  test('rejects empty and impossible Jira dates', () => {
    expect(parseRoadmapDateMs('')).toBeNull();
    expect(parseRoadmapDateMs(undefined)).toBeNull();
    expect(parseRoadmapDateMs('31/Feb/2025')).toBeNull();
    expect(parseRoadmapDateMs('not-a-date')).toBeNull();
  });
});
