// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Read/write health thresholds from data/health-thresholds.json

import fs   from 'fs';
import path from 'path';
import type { HealthThresholds } from '@/types/thresholds';
import { DEFAULT_THRESHOLDS } from '@/types/thresholds';
import { readScopedSetting, writeScopedSetting, type SettingsScopeInput } from './scopedAppSettings.service';

const THRESHOLDS_FILE = path.join(process.cwd(), 'data', 'health-thresholds.json');
const THRESHOLDS_KEY = 'health-thresholds';

let _cache: HealthThresholds | null = null;

export function readThresholds(): HealthThresholds {
  if (_cache) return _cache;
  try {
    if (!fs.existsSync(THRESHOLDS_FILE)) return { ...DEFAULT_THRESHOLDS };
    const raw = fs.readFileSync(THRESHOLDS_FILE, 'utf-8');
    _cache = { ...DEFAULT_THRESHOLDS, ...JSON.parse(raw) };
    return _cache!;
  } catch {
    return { ...DEFAULT_THRESHOLDS };
  }
}

export function writeThresholds(thresholds: HealthThresholds): void {
  _cache = null; // invalidate cache
  fs.mkdirSync(path.dirname(THRESHOLDS_FILE), { recursive: true });
  fs.writeFileSync(THRESHOLDS_FILE, JSON.stringify(thresholds, null, 2), 'utf-8');
}

export function invalidateThresholdCache(): void {
  _cache = null;
}

export function readLegacyThresholds(): HealthThresholds {
  return readThresholds();
}

export function mergeThresholds(thresholds: Partial<HealthThresholds>): HealthThresholds {
  return { ...DEFAULT_THRESHOLDS, ...thresholds };
}

export async function readThresholdsForUser(userId: string): Promise<HealthThresholds> {
  return readScopedSetting(THRESHOLDS_KEY, userId, readLegacyThresholds);
}

export async function writeThresholdsForUser(
  thresholds: HealthThresholds,
  scope: SettingsScopeInput & { updatedBy?: string },
): Promise<void> {
  _cache = null;
  await writeScopedSetting(THRESHOLDS_KEY, mergeThresholds(thresholds), scope);
}
