// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Shares one loadMetricsWithSource() fetch across app/dashboard/layout.tsx and
// every /dashboard/* child page, instead of each of the 9 live pages (plus the
// layout itself) independently re-fetching the same dataset on every mount.
// Scoped to the dashboard layout's own lifetime — navigating away from
// /dashboard/* and back remounts the layout and fetches fresh, so this does
// not introduce the kind of indefinite cross-session staleness a module-level
// cache on loadMetricsWithSource() itself would (see product-audit
// 10-technical-cleanup.md Part 3 and the prior fix/dashboard-router-cache-
// stale-data incident this deliberately avoids repeating).
'use client';

import { createContext, useContext } from 'react';
import type { DashboardMetrics } from '@/types/metrics';

export interface DashboardMetricsContextValue {
  metrics: DashboardMetrics | null;
  loading: boolean;
}

const DashboardMetricsContext = createContext<DashboardMetricsContextValue | null>(null);

export const DashboardMetricsProvider = DashboardMetricsContext.Provider;

/**
 * Read the metrics already fetched once by app/dashboard/layout.tsx. Every
 * page under app/dashboard/* is structurally guaranteed by the App Router to
 * render inside that layout, so the provider is always present for these
 * call sites — a missing provider is a programming error, not a runtime case
 * to design around.
 */
export function useDashboardMetrics(): DashboardMetricsContextValue {
  const ctx = useContext(DashboardMetricsContext);
  if (!ctx) {
    throw new Error('useDashboardMetrics() must be called from a page rendered under app/dashboard/layout.tsx');
  }
  return ctx;
}
