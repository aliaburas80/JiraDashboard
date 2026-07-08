// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
import fs   from 'fs';
import path from 'path';
import type { PersonaPreviewSettings } from '@/types/personaPreview';
import { DEFAULT_PERSONA_PREVIEW_SETTINGS } from '@/types/personaPreview';
import { GLOBAL_SETTINGS_OWNER, readScopedSetting, writeScopedSetting } from './scopedAppSettings.service';

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'persona-preview.json');
const SETTINGS_KEY = 'persona-preview';

let _cache: PersonaPreviewSettings | null = null;

export function readPersonaPreviewSettings(): PersonaPreviewSettings {
  if (_cache) return _cache;
  try {
    if (!fs.existsSync(SETTINGS_FILE)) return { ...DEFAULT_PERSONA_PREVIEW_SETTINGS };
    const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
    _cache = { ...DEFAULT_PERSONA_PREVIEW_SETTINGS, ...JSON.parse(raw) };
    return _cache!;
  } catch {
    return { ...DEFAULT_PERSONA_PREVIEW_SETTINGS };
  }
}

export function writePersonaPreviewSettings(settings: PersonaPreviewSettings): void {
  _cache = null;
  fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
}

export function invalidatePersonaPreviewCache(): void { _cache = null; }

export function readLegacyPersonaPreviewSettings(): PersonaPreviewSettings {
  return readPersonaPreviewSettings();
}

export function mergePersonaPreviewSettings(settings: Partial<PersonaPreviewSettings>): PersonaPreviewSettings {
  return { ...DEFAULT_PERSONA_PREVIEW_SETTINGS, ...settings };
}

export async function readPersonaPreviewSettingsFromDb(): Promise<PersonaPreviewSettings> {
  return readScopedSetting(SETTINGS_KEY, GLOBAL_SETTINGS_OWNER, readLegacyPersonaPreviewSettings);
}

export async function writePersonaPreviewSettingsToDb(
  settings: PersonaPreviewSettings,
  updatedBy?: string,
): Promise<void> {
  _cache = null;
  await writeScopedSetting(SETTINGS_KEY, mergePersonaPreviewSettings(settings), {
    userId: GLOBAL_SETTINGS_OWNER,
    isSuperAdmin: true,
    updatedBy,
  });
}
