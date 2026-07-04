// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Backend Integration Gateway — provider registry (GW-04, GW-16).
//
// Nothing here is static: every provider's base-URL env var, credential env
// vars, allowlist additions, and enabled/kill-switch flag are read from
// data/gateway-providers.json at call time and can be changed with ZERO code
// changes (no redeploy) — edit the JSON file and the next call picks it up.
// Built-in DEFAULT_BLUEPRINTS exist only so the gateway works out of the box
// before that file is ever created; any field in it can be overridden per
// provider by adding an entry to the config file's "providers" map.
//
// Credential *values* are still read from process.env at call time only —
// never persisted to the config file, never logged, never returned to the
// browser (mirrors the process.env.X ?? default convention in
// src/lib/session.ts / src/services/settings/securityCheck.service.ts).

import fs   from 'fs';
import path from 'path';
import type { GatewayProviderType, ProviderConfig } from './types';

const CONFIG_FILE = path.join(process.cwd(), 'data', 'gateway-providers.json');

export interface ProviderBlueprint {
  baseUrlEnvVar: string;
  credentialEnvVars: string[];
  /** Extra hostnames to allow beyond the resolved base-URL host — optional. */
  allowedHosts?: string[];
  /** Manual kill-switch — `false` always disables the provider regardless of env vars. */
  enabled?: boolean;
}

type ProviderBlueprintMap = Record<GatewayProviderType, ProviderBlueprint>;

const DEFAULT_BLUEPRINTS: ProviderBlueprintMap = {
  jira:              { baseUrlEnvVar: 'GATEWAY_JIRA_BASE_URL',         credentialEnvVars: ['GATEWAY_JIRA_API_TOKEN'] },
  aws_s3:            { baseUrlEnvVar: 'GATEWAY_AWS_S3_BASE_URL',       credentialEnvVars: ['GATEWAY_AWS_ACCESS_KEY_ID', 'GATEWAY_AWS_SECRET_ACCESS_KEY'] },
  azure_blob:        { baseUrlEnvVar: 'GATEWAY_AZURE_BLOB_BASE_URL',   credentialEnvVars: ['GATEWAY_AZURE_CONNECTION_STRING'] },
  gcp_storage:       { baseUrlEnvVar: 'GATEWAY_GCP_STORAGE_BASE_URL',  credentialEnvVars: ['GATEWAY_GCP_SERVICE_ACCOUNT_JSON'] },
  email:             { baseUrlEnvVar: 'GATEWAY_EMAIL_BASE_URL',        credentialEnvVars: ['GATEWAY_EMAIL_API_KEY'] },
  slack:             { baseUrlEnvVar: 'GATEWAY_SLACK_BASE_URL',        credentialEnvVars: ['GATEWAY_SLACK_BOT_TOKEN'] },
  teams:             { baseUrlEnvVar: 'GATEWAY_TEAMS_BASE_URL',        credentialEnvVars: ['GATEWAY_TEAMS_WEBHOOK_URL'] },
  push_notification: { baseUrlEnvVar: 'GATEWAY_PUSH_BASE_URL',         credentialEnvVars: ['GATEWAY_PUSH_API_KEY'] },
  custom:            { baseUrlEnvVar: 'GATEWAY_CUSTOM_BASE_URL',       credentialEnvVars: ['GATEWAY_CUSTOM_API_KEY'] },
};

interface ProviderConfigFile {
  version?: string;
  providers?: Partial<Record<GatewayProviderType, Partial<ProviderBlueprint>>>;
}

function readConfigFile(): ProviderConfigFile['providers'] {
  try {
    if (!fs.existsSync(CONFIG_FILE)) return undefined;
    const parsed = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8')) as ProviderConfigFile;
    return parsed && typeof parsed === 'object' ? parsed.providers : undefined;
  } catch {
    return undefined;
  }
}

/** Writes (or creates) the gateway provider config file — the zero-code-change override surface. */
export function writeProviderConfigFile(config: ProviderConfigFile): void {
  const dir = path.dirname(CONFIG_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify({ version: '1.0', ...config }, null, 2));
}

function blueprintFor(type: GatewayProviderType): ProviderBlueprint {
  const override = readConfigFile()?.[type];
  return { ...DEFAULT_BLUEPRINTS[type], ...override };
}

function readEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() !== '' ? value : undefined;
}

function hostnameOf(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}

export interface ProviderConfigOverrides {
  /**
   * ARCH-05: per-connection base URL (e.g. a JiraConnection row's baseUrl)
   * for providers that support multiple admin-configured instances rather
   * than a single global env-var URL.
   */
  baseUrlOverride?: string;
  extraAllowedHosts?: string[];
  /**
   * ARCH-05: lets a caller that has already resolved credentials through a
   * non-env source (e.g. the encrypted app-config store, src/lib/app-config.ts)
   * tell the gateway credentials are present, instead of the default
   * env-var-presence check. The credential *value* itself is still never
   * read by the gateway from this override — it only affects the `enabled`
   * gate; the caller supplies the actual value via request headers.
   */
  credentialsPresentOverride?: boolean;
}

/**
 * Resolves a provider's live configuration. The blueprint (env-var names,
 * allowlist additions, kill-switch) comes from data/gateway-providers.json
 * (falling back to DEFAULT_BLUEPRINTS); the base URL and credential
 * *presence* check default to process.env at call time, but either can be
 * overridden per-call (see ProviderConfigOverrides) for providers like Jira
 * whose credentials live in the encrypted app-config store instead of env.
 * A provider is enabled only when its blueprint isn't kill-switched AND its
 * base URL resolves AND credentials are present.
 */
export function getProviderConfig(type: GatewayProviderType, overrides?: ProviderConfigOverrides): ProviderConfig {
  const blueprint = blueprintFor(type);
  const baseUrl = overrides?.baseUrlOverride ?? readEnv(blueprint.baseUrlEnvVar);
  const credentialsPresent = overrides?.credentialsPresentOverride
    ?? blueprint.credentialEnvVars.every((name) => readEnv(name) !== undefined);
  const host = hostnameOf(baseUrl);
  const killSwitched = blueprint.enabled === false;
  const enabled = !killSwitched && Boolean(baseUrl && host && credentialsPresent);

  const allowedHosts = enabled && host
    ? Array.from(new Set([host, ...(blueprint.allowedHosts ?? []), ...(overrides?.extraAllowedHosts ?? [])]))
    : [];

  return {
    type,
    baseUrlEnvVar: blueprint.baseUrlEnvVar,
    credentialEnvVars: blueprint.credentialEnvVars,
    allowedHosts,
    enabled,
    baseUrl: enabled ? baseUrl : undefined,
  };
}

export function listRegisteredProviders(): ProviderConfig[] {
  return (Object.keys(DEFAULT_BLUEPRINTS) as GatewayProviderType[]).map((type) => getProviderConfig(type));
}
