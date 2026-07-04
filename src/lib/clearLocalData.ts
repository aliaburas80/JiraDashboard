// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.

/** All fixed localStorage / sessionStorage keys owned by Delivery Clarity. */
export const DC_FIXED_KEYS = [
  'dc_metrics_v2',
  'dc_onboarding_completed',
  'dc_onboarding_dismissed',
  'dc_filter_presets',
  'dc_dashboard_view',
  'dc-theme',
  'dc_muted_recs',
  'dc_downloaded_report',
  'dc_visited_explore',
  'dc_viewed_sprints',
  'dc_explore_recent',
  'dc_local_import_history_v1',
] as const;

/** Dynamic-prefix keys (e.g. dc_col_order_<tableId>). */
const DC_PREFIXES = ['dc_col_order_'];

function getLocalDCKeys(): string[] {
  if (typeof window === 'undefined') return [];
  const dynamic: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && DC_PREFIXES.some(p => k.startsWith(p))) dynamic.push(k);
  }
  return [...DC_FIXED_KEYS, ...dynamic];
}

/** Returns true if any Delivery Clarity data exists in localStorage. */
export function hasLocalData(): boolean {
  if (typeof window === 'undefined') return false;
  return getLocalDCKeys().some(k => localStorage.getItem(k) !== null);
}

/**
 * Removes all Delivery Clarity keys from localStorage and sessionStorage.
 * Does NOT touch server-side import logs or any unrelated browser keys.
 */
export function clearLocalData(): void {
  if (typeof window === 'undefined') return;
  getLocalDCKeys().forEach(k => { try { localStorage.removeItem(k); } catch {} });
  DC_FIXED_KEYS.forEach(k => { try { sessionStorage.removeItem(k); } catch {} });
}
