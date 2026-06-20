// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Encrypted app-config service.
// Stores SMTP and app-level settings in the active cloud provider as app-config.json.
// Falls back to environment variables when no cloud is configured or decryption fails.
// The file on disk / S3 is opaque: { v:1, d:"<base64 AES-256-GCM>" }.

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM  = 'aes-256-gcm';
const KDF_SALT   = 'dc-app-config-v1';
const CLOUD_KEY  = 'app-config.json';

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
      host: process.env.SMTP_HOST ?? '',
      port: parseInt(process.env.SMTP_PORT ?? '587', 10),
      user: process.env.SMTP_USER ?? '',
      pass: process.env.SMTP_PASS ?? '',
      from: process.env.SMTP_FROM ?? 'JiraDashboard <noreply@deliveryclarity.local>',
    },
    jira: {
      apiToken: process.env.GATEWAY_JIRA_API_TOKEN ?? '',
    },
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  };
}

// ── Public getters ────────────────────────────────────────────────────────────

export async function getAppConfig(): Promise<AppConfig> {
  if (_cached) return _cached;
  const cloud = await loadFromCloud();
  if (cloud) {
    // Configs saved before the `jira` field existed won't have it — default it
    // so callers can always read cfg.jira.apiToken safely.
    cloud.jira ??= { apiToken: '' };

    // If SMTP/Jira env vars are explicitly set, they override the cloud config.
    // This lets operators fix credentials via .env without needing a cloud update.
    const env = buildFromEnv();
    if (env.smtp.user && env.smtp.pass) {
      cloud.smtp = env.smtp;
    }
    if (env.jira.apiToken) {
      cloud.jira = env.jira;
    }
    _cached = cloud;
    _source = 'cloud';
    return _cached;
  }
  _cached = buildFromEnv();
  _source = 'env';
  return _cached;
}

export function invalidateConfig(): void {
  _cached = null;
  _source = 'env';
}

export async function getSafeConfig(): Promise<SafeAppConfig> {
  const cfg = await getAppConfig();
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
  const cfg = await getAppConfig();
  return cfg.jira.apiToken;
}
