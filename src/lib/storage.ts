// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.

const STORAGE_KEY = "dc_metrics_v2";
const MAX_ITEMS   = 5_000; // hard cap for flow.items before storage

export function saveMetrics(metrics: unknown): void {
  if (typeof window === "undefined") return;
  try {
    const json = JSON.stringify(metrics);
    localStorage.setItem(STORAGE_KEY, json);
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

export function clearMetrics(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function hasMetrics(): boolean {
  if (typeof window === "undefined") return false;
  return STORAGE_KEY in localStorage;
}
