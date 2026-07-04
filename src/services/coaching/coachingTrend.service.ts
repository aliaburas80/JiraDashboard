// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
//
// Compares a category's current severity against its severity in a previously
// saved snapshot, so the coaching UI can show whether things are improving.

import type { CheckSeverity } from '@/types/dataQuality';
import { SEVERITY_RANK } from '@/lib/coachingBadge';

export type SeverityTrend = 'improved' | 'worsened' | 'same';

export function computeSeverityTrend(current: CheckSeverity, previous: CheckSeverity): SeverityTrend {
  const delta = SEVERITY_RANK[current] - SEVERITY_RANK[previous];
  if (delta > 0) return 'improved'; // higher rank number = less urgent
  if (delta < 0) return 'worsened';
  return 'same';
}
