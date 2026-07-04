// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.

import { resolveEvidenceRoute } from '@/lib/coachingEvidenceLink';

describe('TEST-RBC-LINK-01: resolveEvidenceRoute', () => {
  test('TC-RBC-LINK-01a: known metric families resolve to their source dashboard', () => {
    expect(resolveEvidenceRoute('flow.averageCycleTimeDays')).toBe('/dashboard/flow-health');
    expect(resolveEvidenceRoute('throughput.kanban.totalAgingWip')).toBe('/dashboard/kanban-health');
    expect(resolveEvidenceRoute('throughput.sprint.trendDirection')).toBe('/dashboard/sprint-status');
    expect(resolveEvidenceRoute('relations.blockedItems')).toBe('/dashboard/priority-attention');
    expect(resolveEvidenceRoute('dataQuality.score')).toBe('/dashboard/data-quality');
    expect(resolveEvidenceRoute('capacity[].loadShare')).toBe('/dashboard/ownership');
  });

  test('TC-RBC-LINK-01b: unknown metric keys resolve to null', () => {
    expect(resolveEvidenceRoute('totally.unknown.metric')).toBeNull();
  });
});
