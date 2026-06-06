// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// Read/write retention settings from data/retention-settings.json
// Uses a JSON file so no Prisma migration is required.

import fs   from 'fs';
import path from 'path';
import type { RetentionSettings } from '@/types/settings';
import { DEFAULT_SETTINGS } from '@/types/settings';

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'retention-settings.json');

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
