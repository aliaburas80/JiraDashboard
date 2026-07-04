// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Pure helpers for the dashboard's section-trigger status chips — shared between the page and its tests.

export type ChipType = 'good' | 'warning' | 'critical' | 'neutral' | 'info';

export interface Chip {
  label: string;
  type?: ChipType;
}

export const CHIP_CLS: Record<ChipType, string> = {
  good: 'bg-green-50 text-green-700 border border-green-200',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200',
  critical: 'bg-red-50 text-red-700 border border-red-200',
  info: 'bg-blue-50 text-blue-700 border border-blue-200',
  neutral: 'bg-slate-100 text-slate-600 border border-slate-200',
};

const CHIP_RANK: Record<ChipType, number> = {
  critical: 4,
  warning: 3,
  info: 2,
  good: 1,
  neutral: 0,
};

export function chipClass(type?: ChipType): string {
  return CHIP_CLS[type ?? 'neutral'];
}

/** Reduces a list of chips to the single most severe type, for badges that must summarize a section in one glance. */
export function mostSevereChipType(chips: Chip[]): ChipType {
  return chips.reduce<ChipType>((acc, c) => {
    const t = c.type ?? 'neutral';
    return CHIP_RANK[t] > CHIP_RANK[acc] ? t : acc;
  }, 'neutral');
}
