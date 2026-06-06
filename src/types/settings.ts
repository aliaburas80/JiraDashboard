// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.

export type RetentionPeriod = 7 | 30 | 90 | 365 | -1; // -1 = keep forever

export interface RetentionSettings {
  storeUploadLogs:         boolean;
  storeDashboardSnapshots: boolean;
  retentionDays:           RetentionPeriod;
  autoDeleteOldLogs:       boolean;
  autoDeleteOldSnapshots:  boolean;
  updatedAt:               string;
  updatedBy:               string;
}

export const DEFAULT_SETTINGS: RetentionSettings = {
  storeUploadLogs:         true,
  storeDashboardSnapshots: true,
  retentionDays:           -1,
  autoDeleteOldLogs:       false,
  autoDeleteOldSnapshots:  false,
  updatedAt:               '',
  updatedBy:               'system',
};

export interface RetentionStats {
  totalLogs:          number;
  logsEligible:       number;   // older than retention period
  totalSnapshots:     number;
  snapshotsEligible:  number;
  oldestLogDate:      string | null;
  newestLogDate:      string | null;
}
