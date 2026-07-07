// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.

import { setStoredOwner, tagCurrentOwner as tagOwner, isOwnedByCurrentUser } from '@/lib/localDataOwnership';

const STORAGE_KEY = "dc_metrics_v2";
const SOURCE_KEY  = "dc_metrics_source_v1";
// P0 fix, 2026-07-08: localStorage is scoped to the BROWSER, not the
// logged-in account — see src/lib/localDataOwnership.ts. This key tags
// whichever account's data is currently cached; every read is validated
// against the live, server-verified session before being trusted.
const OWNER_KEY   = "dc_metrics_owner_v1";
const MAX_ITEMS   = 5_000; // hard cap for flow.items before storage

const tagCurrentOwner = () => tagOwner(OWNER_KEY);

export type MetricsDataSource =
  | 'bucket'
  | 'cache'
  | 'server-local'
  | 'localstorage'
  | 'upload'
  | 'snapshot'
  | 'jira-api'
  | 'none';

export interface MetricsSourceInfo {
  source: MetricsDataSource;
  provider?: string;
  key?: string;
  status?: string;
  message?: string;
  error?: string;
  savedAt?: string;
  connectionName?: string;
}

export interface LoadMetricsResult extends MetricsSourceInfo {
  metrics: unknown | null;
  fallbackUsed: boolean;
}

function saveSource(info: MetricsSourceInfo): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SOURCE_KEY, JSON.stringify({ ...info, checkedAt: new Date().toISOString() }));
    window.dispatchEvent(new CustomEvent('dc-metrics-source-change'));
  } catch {}
}

export function getMetricsSource(): MetricsSourceInfo | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SOURCE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveMetrics(metrics: unknown): void {
  if (typeof window === "undefined") return;
  try {
    const json = JSON.stringify(metrics);
    localStorage.setItem(STORAGE_KEY, json);
    tagCurrentOwner();
    saveSource({ source: 'upload', message: 'Fresh Jira upload saved in this browser.' });
  } catch {
    // QuotaExceededError — try saving a reduced version
    try {
      const m = metrics as any;
      if (m?.flow?.items && m.flow.items.length > MAX_ITEMS) {
        const trimmed = {
          ...m,
          flow: {
            ...m.flow,
            items:          m.flow.items.slice(0, MAX_ITEMS),
            totalItemCount: m.flow.items.length,
            itemsCapped:    true,
          },
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
        tagCurrentOwner();
        saveSource({ source: 'upload', message: 'Fresh Jira upload saved in this browser with capped detail rows.' });
      }
    } catch {
      // Even the reduced version failed — clear stale data
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      console.error('[Delivery Clarity] localStorage quota exceeded. Try splitting your Jira export into smaller files.');
    }
  }
}

export function loadMetrics(): unknown | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function loadMetricsWithSource(): Promise<LoadMetricsResult> {
  let cloudError = '';

  try {
    const res = await fetch('/api/metrics/latest', { cache: 'no-store' });
    const data = await res.json().catch(() => null);

    if (res.ok && data?.available === false) {
      cloudError = data?.message ?? 'No bucket/server metrics are available yet.';
    } else if (res.ok && data?.metrics) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.metrics));
        setStoredOwner(OWNER_KEY, typeof data.userId === 'string' ? data.userId : null);
      } catch {}
      const info: MetricsSourceInfo = {
        source: data.source ?? 'server-local',
        provider: data.provider ?? data.sync?.provider,
        key: data.key ?? data.sync?.key,
        status: data.sync?.status,
        message: data.message,
        savedAt: data.savedAt,
        connectionName: data.connectionName,
      };
      saveSource(info);
      return { ...info, metrics: data.metrics, fallbackUsed: false };
    } else {
      cloudError = data?.message ?? data?.error ?? `Server metrics request failed (${res.status}).`;
    }
  } catch (error) {
    cloudError = error instanceof Error ? error.message : String(error);
  }

  const local = loadMetrics();
  if (local) {
    // P0 fix: never trust a locally-cached fallback without verifying it
    // belongs to whoever is actually logged in right now (server-verified,
    // not client state — the session cookie can't be spoofed). Untagged data
    // (written before this fix shipped) is treated as untrusted, not as "no
    // owner recorded, assume it's fine" — a one-time, deliberately safe loss
    // of stale local caches rather than any risk of leaking them.
    if (await isOwnedByCurrentUser(OWNER_KEY)) {
      const info: MetricsSourceInfo = {
        source: 'localstorage',
        status: 'fallback',
        error: cloudError,
        message: 'Bucket/server metrics were unavailable. Loaded dashboard data from browser localStorage.',
      };
      saveSource(info);
      return { ...info, metrics: local, fallbackUsed: true };
    }

    // Belongs to a different account (or ownership can't be verified) —
    // discard it rather than risk showing it to the wrong user.
    clearMetrics();
  }

  const info: MetricsSourceInfo = {
    source: 'none',
    status: 'error',
    error: cloudError,
    message: 'No bucket/server metrics or browser localStorage fallback found.',
  };
  saveSource(info);
  return { ...info, metrics: null, fallbackUsed: false };
}

export function clearMetrics(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SOURCE_KEY);
  localStorage.removeItem(OWNER_KEY);
}

export function hasMetrics(): boolean {
  if (typeof window === "undefined") return false;
  return STORAGE_KEY in localStorage;
}

export async function hasMetricsFromAnySource(): Promise<boolean> {
  const result = await loadMetricsWithSource();
  return !!result.metrics;
}

export function markMetricsSource(info: MetricsSourceInfo): void {
  saveSource(info);
}
