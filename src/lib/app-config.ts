// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Encrypted app-config service.
// Stores SMTP and app-level settings in the active cloud provider as app-config.json.
// Falls back to environment variables when no cloud is configured or decryption fails.
// The file on disk / S3 is opaque: { v:1, d:"<base64 AES-256-GCM>" }.

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { normalizeAppUrl } from '@/lib/url';

const ALGORITHM  = 'aes-256-gcm';
const KDF_SALT   = 'dc-app-config-v1';
const CLOUD_KEY  = 'app-config.json';
const APP_URL_SETTING_KEY = 'app-url';

// ── Schema ────────────────────────────────────────────────────────────────────

export interface AppSmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

export interface AppJiraConfig {
  apiToken: string;
}

export interface AppConfig {
  smtp:   AppSmtpConfig;
  jira:   AppJiraConfig;
  appUrl: string;
}

export type SafeAppConfig = Omit<AppSmtpConfig, 'pass'> & {
  hasPass: boolean;
  hasJiraToken: boolean;
  appUrl:  string;
  source:  'cloud' | 'env';
};

// ── Module-level cache ────────────────────────────────────────────────────────

let _cached: AppConfig | null = null;
let _source: 'cloud' | 'env'  = 'env';

// ── Encryption helpers ────────────────────────────────────────────────────────

function deriveKey(secret: string): Buffer {
  return scryptSync(secret, KDF_SALT, 32) as Buffer;
}

export function encryptConfig(config: AppConfig, secret: string): string {
  const key  = deriveKey(secret);
  const iv   = randomBytes(16);
  const ciph = createCipheriv(ALGORITHM, key, iv);
  const data = JSON.stringify(config);
  const enc  = Buffer.concat([ciph.update(data, 'utf8'), ciph.final()]);
  const tag  = ciph.getAuthTag();
  // Layout: [iv 16 bytes][tag 16 bytes][ciphertext] → base64
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

export function decryptConfig(b64: string, secret: string): AppConfig {
  const buf  = Buffer.from(b64, 'base64');
  const key  = deriveKey(secret);
  const iv   = buf.subarray(0, 16);
  const tag  = buf.subarray(16, 32);
  const enc  = buf.subarray(32);
  const dciph = createDecipheriv(ALGORITHM, key, iv);
  dciph.setAuthTag(tag);
  const plain = dciph.update(enc, undefined, 'utf8') + dciph.final('utf8');
  return JSON.parse(plain) as AppConfig;
}

// ── Cloud read / write ────────────────────────────────────────────────────────

async function loadFromCloud(): Promise<AppConfig | null> {
  try {
    const { readStorageSettings, createProvider } = await import('@/services/storage/storageProvider');
    const settings = readStorageSettings();
    if (settings.active === 'local') return null;            // no cloud configured
    const provider = await createProvider(settings.active, settings);
    const raw = await provider.download(CLOUD_KEY);
    if (!raw) return null;
    const envelope = JSON.parse(raw) as { v: number; d: string };
    if (envelope.v !== 1 || !envelope.d) return null;
    const secret = process.env.CONFIG_ENCRYPTION_KEY;
    if (!secret) {
      console.warn('[app-config] CONFIG_ENCRYPTION_KEY not set — cannot decrypt cloud config');
      return null;
    }
    return decryptConfig(envelope.d, secret);
  } catch (err) {
    console.warn('[app-config] Could not load cloud config:', (err as Error).message);
    return null;
  }
}

export async function saveToCloud(config: AppConfig): Promise<void> {
  const secret = process.env.CONFIG_ENCRYPTION_KEY;
  if (!secret) throw new Error('CONFIG_ENCRYPTION_KEY is not set in the environment.');
  const { readStorageSettings, createProvider } = await import('@/services/storage/storageProvider');
  const settings = readStorageSettings();
  if (settings.active === 'local') throw new Error('No cloud storage provider configured. Configure S3, Azure, or GCP first.');
  const provider = await createProvider(settings.active, settings);
  const d        = encryptConfig(config, secret);
  await provider.upload(CLOUD_KEY, JSON.stringify({ v: 1, d }), 'application/json');
  _cached = config;
  _source = 'cloud';
}

// ── Env fallback ──────────────────────────────────────────────────────────────

function buildFromEnv(): AppConfig {
  return {
    smtp: {
      host: process.env.SMTP_HOST ?? 'smtp.hostinger.com',
      port: parseInt(process.env.SMTP_PORT ?? '587', 10),
      user: process.env.SMTP_USER ?? 'noreply@deliveryclarity.app',
      pass: process.env.SMTP_PASS ?? '',
      from: process.env.SMTP_FROM ?? 'Delivery Clarity <noreply@deliveryclarity.app>',
    },
    jira: {
      apiToken: process.env.GATEWAY_JIRA_API_TOKEN ?? '',
    },
    appUrl: normalizeAppUrl(process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL),
  };
}

// ── Public getters ────────────────────────────────────────────────────────────

// Priority chain for SMTP config:
//   1. Database SmtpSettings table (encrypted, set via Admin UI)
//   2. Cloud S3/Azure/GCP config (legacy encrypted blob)
//   3. SMTP_* environment variables, then Hostinger defaults (password stays empty)
async function readSavedAppUrl(userId?: string): Promise<string> {
  try {
    const { readScopedSetting, GLOBAL_SETTINGS_OWNER } = await import('@/services/settings/scopedAppSettings.service');
    return await readScopedSetting(APP_URL_SETTING_KEY, userId ?? GLOBAL_SETTINGS_OWNER, () => '');
  } catch {
    return '';
  }
}

export async function saveAppUrlSetting(
  appUrl: string,
  scope: { userId: string; isSuperAdmin?: boolean; updatedBy?: string },
): Promise<void> {
  const { writeScopedSetting } = await import('@/services/settings/scopedAppSettings.service');
  await writeScopedSetting(APP_URL_SETTING_KEY, normalizeAppUrl(appUrl), scope);
}

export async function getAppConfig(userId?: string): Promise<AppConfig> {
  if (!userId && _cached) return _cached;
  const savedAppUrl = await readSavedAppUrl(userId);

  // 1. Try database first — avoids cloud storage dependency for SMTP.
  try {
    const { getSmtpConfig } = await import('@/services/smtp/smtpSettings.service');
    const dbSmtp = await getSmtpConfig();
    if (dbSmtp) {
      const env = buildFromEnv();
      const config = {
        smtp:   dbSmtp,
        jira:   { apiToken: env.jira.apiToken },
        appUrl: savedAppUrl || env.appUrl,
      };
      if (!userId) _cached = config;
      _source = 'cloud'; // treat DB as the "cloud" source for the UI badge
      return config;
    }
  } catch {
    // DB unavailable or decryption failed — fall through to cloud config.
  }

  // 2. Try encrypted cloud blob (S3 / Azure / GCP).
  const cloud = await loadFromCloud();
  if (cloud) {
    cloud.jira ??= { apiToken: '' };
    cloud.appUrl = savedAppUrl || cloud.appUrl;
    const env = buildFromEnv();
    // Env vars are a bootstrap fallback for a config that has never been explicitly
    // saved — NOT a permanent override. Bug found 2026-07-04: this used to apply
    // unconditionally, so once an admin saved e.g. a custom "From address" to the
    // cloud config, it was silently clobbered by SMTP_* env vars on every single
    // read, forever, with no way to make the saved value stick. Now env only fills
    // in when the cloud config genuinely has nothing saved yet.
    if (!cloud.smtp.host && !cloud.smtp.user && env.smtp.user && env.smtp.pass) cloud.smtp = env.smtp;
    if (!cloud.jira.apiToken && env.jira.apiToken)                             cloud.jira = env.jira;
    if (!userId) _cached = cloud;
    _source = 'cloud';
    return cloud;
  }

  // 3. Fall back to environment variables / safe Hostinger defaults.
  // The password is intentionally never hard-coded and must come from a secret
  // env var or be saved through Admin Settings → App Config.
  const envConfig = buildFromEnv();
  const config = { ...envConfig, appUrl: savedAppUrl || envConfig.appUrl };
  if (!userId) _cached = config;
  _source = 'env';
  return config;
}

export function invalidateConfig(): void {
  _cached = null;
  _source = 'env';
}

export async function getSafeConfig(userId?: string): Promise<SafeAppConfig> {
  const cfg = await getAppConfig(userId);
  return {
    host:    cfg.smtp.host,
    port:    cfg.smtp.port,
    user:    cfg.smtp.user,
    hasPass: !!cfg.smtp.pass,
    hasJiraToken: !!cfg.jira.apiToken,
    from:    cfg.smtp.from,
    appUrl:  cfg.appUrl,
    source:  _source,
  };
}

/** Server-side helper for routes that need the raw Jira API token/PAT. */
export async function getJiraApiToken(): Promise<string> {
  // Jira credentials are often saved immediately before testing a connection.
  // Re-read the encrypted config instead of trusting a stale module cache.
  invalidateConfig();
  const cfg = await getAppConfig();
  return cfg.jira.apiToken;
}
