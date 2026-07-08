// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Read/write retention settings from data/retention-settings.json
// Uses a JSON file so no Prisma migration is required.

import fs   from 'fs';
import path from 'path';
import type { RetentionSettings } from '@/types/settings';
import { DEFAULT_SETTINGS } from '@/types/settings';
import { readScopedSetting, writeScopedSetting, type SettingsScopeInput } from './scopedAppSettings.service';

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'retention-settings.json');
const SETTINGS_KEY = 'retention-settings';

export function readSettings(): RetentionSettings {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) return { ...DEFAULT_SETTINGS };
    const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function writeSettings(settings: RetentionSettings): void {
  fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
}

export function readLegacySettings(): RetentionSettings {
  return readSettings();
}

export function mergeRetentionSettings(settings: Partial<RetentionSettings>): RetentionSettings {
  return { ...DEFAULT_SETTINGS, ...settings };
}

export async function readSettingsForUser(userId: string): Promise<RetentionSettings> {
  return readScopedSetting(SETTINGS_KEY, userId, readLegacySettings);
}

export async function writeSettingsForUser(
  settings: RetentionSettings,
  scope: SettingsScopeInput & { updatedBy?: string },
): Promise<void> {
  await writeScopedSetting(SETTINGS_KEY, mergeRetentionSettings(settings), scope);
}
