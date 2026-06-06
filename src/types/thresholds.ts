// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.

export interface HealthThresholds {
  // Cycle time (time from start to done)
  cycleTimeWarningDays:    number;   // default: 7
  cycleTimeCriticalDays:   number;   // default: 14

  // Lead time (time from created to done)
  leadTimeWarningDays:     number;   // default: 14
  leadTimeCriticalDays:    number;   // default: 21

  // Active item age (item has been In Progress for too long)
  activeAgeWarningDays:    number;   // default: 7
  activeAgeCriticalDays:   number;   // default: 14

  // Open item age (item sitting in backlog)
  openAgeWarningDays:      number;   // default: 30

  // Blocked ratio
  blockedRatioWarningPct:  number;   // default: 10  (10% blocked = warning)
  blockedRatioCriticalPct: number;   // default: 20

  updatedAt: string;
  updatedBy: string;
}

export const DEFAULT_THRESHOLDS: HealthThresholds = {
  cycleTimeWarningDays:    7,
  cycleTimeCriticalDays:   14,
  leadTimeWarningDays:     14,
  leadTimeCriticalDays:    21,
  activeAgeWarningDays:    7,
  activeAgeCriticalDays:   14,
  openAgeWarningDays:      30,
  blockedRatioWarningPct:  10,
  blockedRatioCriticalPct: 20,
  updatedAt: '',
  updatedBy: 'system',
};

export const THRESHOLD_LABELS: Record<keyof Omit<HealthThresholds, 'updatedAt' | 'updatedBy'>, { label: string; unit: string; description: string; min: number; max: number }> = {
  cycleTimeWarningDays:    { label: 'Cycle Time Warning',    unit: 'days', description: 'Items in progress longer than this are flagged as warning.',  min: 1,  max: 60  },
  cycleTimeCriticalDays:   { label: 'Cycle Time Critical',   unit: 'days', description: 'Items in progress longer than this are flagged as critical.', min: 1,  max: 90  },
  leadTimeWarningDays:     { label: 'Lead Time Warning',     unit: 'days', description: 'Done items with lead time above this are flagged as warning.', min: 1,  max: 90  },
  leadTimeCriticalDays:    { label: 'Lead Time Critical',    unit: 'days', description: 'Done items with lead time above this are flagged as critical.',min: 1,  max: 120 },
  activeAgeWarningDays:    { label: 'Active Item Age Warning', unit: 'days', description: 'In-progress items older than this are flagged as warning.',  min: 1,  max: 60  },
  activeAgeCriticalDays:   { label: 'Active Item Age Critical', unit: 'days', description: 'In-progress items older than this are flagged as critical.', min: 1,  max: 90  },
  openAgeWarningDays:      { label: 'Open Item Age Warning', unit: 'days', description: 'Backlog items older than this are flagged as warning.',        min: 7,  max: 180 },
  blockedRatioWarningPct:  { label: 'Blocked Ratio Warning', unit: '%',    description: 'If this % of items are blocked, the board is at warning.',     min: 1,  max: 50  },
  blockedRatioCriticalPct: { label: 'Blocked Ratio Critical', unit: '%',   description: 'If this % of items are blocked, the board is critical.',       min: 5,  max: 80  },
};
