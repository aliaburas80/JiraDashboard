// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Server-side runtime/network policy for the self-hosted Ollama provider.

import { normaliseOllamaBaseUrl } from './ollamaProvider';

export interface OllamaRuntimeConfig {
  baseUrl: string;
  authToken?: string;
}

function isPrivateIpv4(hostname: string): boolean {
  const octets = hostname.split('.').map(Number);
  if (octets.length !== 4 || octets.some(value => !Number.isInteger(value) || value < 0 || value > 255)) {
    return false;
  }

  const [a, b] = octets;
  return a === 10
    || a === 127
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168)
    || (a === 169 && b === 254);
}

function isPrivateIpv6(hostname: string): boolean {
  const value = hostname.toLowerCase().replace(/^\[/, '').replace(/\]$/, '');
  if (value === '::1' || value === '0:0:0:0:0:0:0:1') return true;
  if (value.startsWith('fc') || value.startsWith('fd')) return true; // RFC 4193 unique-local.
  return /^fe[89ab]/.test(value); // RFC 4291 link-local fe80::/10.
}

export function isLocalOrPrivateOllamaUrl(baseUrl: string): boolean {
  try {
    const parsed = new URL(baseUrl);
    const hostname = parsed.hostname.toLowerCase();
    return hostname === 'localhost'
      || isPrivateIpv4(hostname)
      || isPrivateIpv6(hostname);
  } catch {
    return false;
  }
}

export function buildOllamaHeaders(authToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };
  const token = authToken?.trim();
  if (token) headers.authorization = `Bearer ${token}`;
  return headers;
}

/**
 * Resolve the server-only Ollama runtime configuration.
 *
 * Production policy:
 * - localhost/private-IP endpoints may use HTTP because they are not routed over
 *   the public internet;
 * - every other endpoint must use HTTPS and a bearer token. This prevents an
 *   accidental `http://<public-vps-ip>:11434` deployment of the raw Ollama API.
 *
 * Returning null deliberately activates deterministic Evidence mode.
 */
export function resolveOllamaRuntimeConfig(
  env: Pick<NodeJS.ProcessEnv, 'NODE_ENV' | 'OLLAMA_BASE_URL' | 'OLLAMA_AUTH_TOKEN'> = process.env,
): OllamaRuntimeConfig | null {
  const baseUrl = normaliseOllamaBaseUrl(env.OLLAMA_BASE_URL);
  const authToken = env.OLLAMA_AUTH_TOKEN?.trim() || undefined;

  if (env.NODE_ENV === 'production' && !isLocalOrPrivateOllamaUrl(baseUrl)) {
    let protocol = '';
    try {
      protocol = new URL(baseUrl).protocol;
    } catch {
      return null;
    }
    if (protocol !== 'https:' || !authToken) return null;
  }

  return authToken ? { baseUrl, authToken } : { baseUrl };
}
