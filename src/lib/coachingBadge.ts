// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.

import type { CheckSeverity } from '@/types/dataQuality';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const SEVERITY_TO_VARIANT: Record<CheckSeverity, BadgeVariant> = {
  critical: 'danger',
  high: 'warning',
  medium: 'info',
  low: 'success',
};

export function severityToBadgeVariant(severity: CheckSeverity): BadgeVariant {
  return SEVERITY_TO_VARIANT[severity];
}

export function deriveSeverity(weakPointCount: number, confidenceScore: number, criticalSignalPresent: boolean): CheckSeverity {
  if (criticalSignalPresent) return 'critical';
  if (weakPointCount >= 3) return 'high';
  if (weakPointCount >= 1 || confidenceScore < 60) return 'medium';
  return 'low';
}
