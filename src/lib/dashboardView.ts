// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
import { DASHBOARD_VIEWS, DEFAULT_VIEW_ID, type ViewId, type DashboardView } from '@/types/dashboardView';
import { defaultDashboardViewForRole, isDashboardViewLockedForRole } from '@/lib/roles';

const STORAGE_KEY = 'dc_dashboard_view';

export function getSavedViewId(): ViewId {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as ViewId | null;
    if (saved && DASHBOARD_VIEWS.find(v => v.id === saved)) return saved;
  } catch {}
  return DEFAULT_VIEW_ID;
}

export function getInitialViewId(role?: string | null): ViewId {
  if (isDashboardViewLockedForRole(role)) return defaultDashboardViewForRole(role);
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as ViewId | null;
    if (saved && DASHBOARD_VIEWS.find(v => v.id === saved)) return saved;
  } catch {}
  return defaultDashboardViewForRole(role);
}

export function saveViewId(id: ViewId): void {
  try { localStorage.setItem(STORAGE_KEY, id); } catch {}
}

export function getView(id: ViewId): DashboardView {
  return DASHBOARD_VIEWS.find(v => v.id === id) ?? DASHBOARD_VIEWS[0];
}

export function isTierHidden(view: DashboardView, tier: string): boolean {
  return view.hideTiers.includes(tier);
}
