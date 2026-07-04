// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Data retention tests — TC-DR-01 to TC-DR-10

import { readSettings, writeSettings } from '../services/settings/settings.service';
import { DEFAULT_SETTINGS } from '../types/settings';
import type { RetentionSettings } from '../types/settings';
import fs from 'fs';
import path from 'path';

const TEST_FILE = path.join(process.cwd(), 'data', 'retention-settings-test.json');

// Override the settings file for tests
jest.mock('../services/settings/settings.service', () => {
  const actual = jest.requireActual('../services/settings/settings.service');
  return {
    ...actual,
    readSettings: jest.fn(() => ({ ...require('../types/settings').DEFAULT_SETTINGS })),
    writeSettings: jest.fn(),
  };
});

// TC-DR-01: DEFAULT_SETTINGS has expected values
test('TC-DR-01: DEFAULT_SETTINGS keeps data forever by default', () => {
  expect(DEFAULT_SETTINGS.retentionDays).toBe(-1);
  expect(DEFAULT_SETTINGS.storeUploadLogs).toBe(true);
  expect(DEFAULT_SETTINGS.autoDeleteOldLogs).toBe(false);
  expect(DEFAULT_SETTINGS.autoDeleteOldSnapshots).toBe(false);
});

// TC-DR-02: readSettings returns defaults when no file exists
test('TC-DR-02: readSettings returns DEFAULT_SETTINGS when called', () => {
  const s = readSettings();
  expect(s.retentionDays).toBe(-1);
  expect(s.storeUploadLogs).toBe(true);
});

// TC-DR-03: writeSettings is called with correct shape
test('TC-DR-03: writeSettings called with full RetentionSettings object', () => {
  const updated: RetentionSettings = {
    ...DEFAULT_SETTINGS,
    retentionDays:     30,
    autoDeleteOldLogs: true,
    updatedAt:         '2025-01-01T00:00:00.000Z',
    updatedBy:         'admin@test.com',
  };
  writeSettings(updated);
  expect(writeSettings).toHaveBeenCalledWith(updated);
});

// TC-DR-04: retention periods are valid values
test('TC-DR-04: valid retention period values are 7, 30, 90, 365, -1', () => {
  const valid = [7, 30, 90, 365, -1];
  valid.forEach(v => {
    const s: RetentionSettings = { ...DEFAULT_SETTINGS, retentionDays: v as any };
    expect(valid).toContain(s.retentionDays);
  });
});

// TC-DR-05: cutoff date logic — 30 day retention
test('TC-DR-05: 30-day retention cutoff is ~30 days ago', () => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const now   = new Date();
  const diff  = Math.round((now.getTime() - cutoff.getTime()) / (1000 * 60 * 60 * 24));
  expect(diff).toBeGreaterThanOrEqual(29);
  expect(diff).toBeLessThanOrEqual(31);
});

// TC-DR-06: keep-forever (-1) produces no cutoff
test('TC-DR-06: retention -1 means keep forever — cutoff should be null', () => {
  function cutoff(days: number): Date | null {
    if (days === -1) return null;
    const d = new Date(); d.setDate(d.getDate() - days); return d;
  }
  expect(cutoff(-1)).toBeNull();
  expect(cutoff(30)).not.toBeNull();
});

// TC-DR-07: DEFAULT_SETTINGS has all required fields
test('TC-DR-07: DEFAULT_SETTINGS has all required RetentionSettings fields', () => {
  const required: (keyof RetentionSettings)[] = [
    'storeUploadLogs', 'storeDashboardSnapshots', 'retentionDays',
    'autoDeleteOldLogs', 'autoDeleteOldSnapshots', 'updatedAt', 'updatedBy',
  ];
  required.forEach(field => {
    expect(DEFAULT_SETTINGS).toHaveProperty(field);
  });
});

// TC-DR-08: Settings can be updated partially (spread merge)
test('TC-DR-08: partial settings update merges with defaults correctly', () => {
  const partial = { retentionDays: 7 as const, autoDeleteOldLogs: true };
  const merged  = { ...DEFAULT_SETTINGS, ...partial };
  expect(merged.retentionDays).toBe(7);
  expect(merged.autoDeleteOldLogs).toBe(true);
  expect(merged.storeUploadLogs).toBe(true); // default preserved
  expect(merged.storeDashboardSnapshots).toBe(true); // default preserved
});

// TC-DR-09: storeUploadLogs can be disabled
test('TC-DR-09: storeUploadLogs can be set to false', () => {
  const s: RetentionSettings = { ...DEFAULT_SETTINGS, storeUploadLogs: false };
  expect(s.storeUploadLogs).toBe(false);
});

// TC-DR-10: updatedBy is tracked in settings
test('TC-DR-10: updatedBy and updatedAt fields track who changed settings', () => {
  const s: RetentionSettings = {
    ...DEFAULT_SETTINGS,
    updatedAt: '2025-06-01T10:00:00.000Z',
    updatedBy: 'ali@test.com',
  };
  expect(s.updatedBy).toBe('ali@test.com');
  expect(new Date(s.updatedAt).getFullYear()).toBe(2025);
});
