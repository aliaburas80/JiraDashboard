// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Product tour state — localStorage-persisted, integrates with onboarding.

const KEY_DISMISSED  = 'dc_tour_dismissed';
const KEY_COMPLETED  = 'dc_tour_completed';

export interface TourStep {
  id:          string;
  title:       string;
  description: string;
  targetId?:   string;   // DOM element id to highlight (optional)
  placement?:  'top' | 'bottom' | 'left' | 'right' | 'center';
  ctaLabel?:   string;   // override the "Next" button text
  href?:       string;   // if set, CTA navigates here instead of next step
  // Route this step's content lives on. When advancing to a step whose route
  // differs from the current page, ProductTour.tsx navigates there first,
  // then keeps polling for targetId (it may take a render or two to mount).
  // Omit for steps that work on whatever page the tour was started from
  // (e.g. the centered welcome/done steps).
  route?:      string;
}

// P0 fix, 2026-07-09: the dashboard used to be a single page with named
// section anchors (section-overview, section-attention, etc.) — it was
// later split into ~16 separate routed pages (see DC_NAV_GROUPS in
// src/components/dc-shell/navigation.ts), and those anchor ids stopped
// existing anywhere. This rewrite points each step at a real anchor id on
// the actual current page for that content — see the `id` props added to
// DashboardNavSidebar, PageHeader (via its optional `id` prop), and the KPI
// grid on /summary.
export const TOUR_STEPS: TourStep[] = [
  {
    id:          'welcome',
    title:       'Welcome to Delivery Clarity 👋',
    description: 'This quick tour shows you the key features in under 2 minutes. You can skip at any time.',
    placement:   'center',
    ctaLabel:    'Start tour',
  },
  {
    id:          'overview',
    title:       'Health Score & Key Metrics',
    description: 'Your delivery health score (0–100), completion rate, active issues, and key flow metrics at a glance.',
    route:       '/summary',
    targetId:    'tour-kpi-grid',
    placement:   'bottom',
  },
  {
    id:          'section-switcher',
    title:       'Dashboard Navigation',
    description: 'Use this sidebar to jump directly to any dashboard section — Priority Attention, Key Metrics, Sprint Status, Kanban Health, Ownership, and more.',
    route:       '/dashboard/priority-attention',
    targetId:    'dashboard-nav-sidebar',
    placement:   'bottom',
  },
  {
    id:          'attention',
    title:       'Priority Attention',
    description: 'Your top blockers, overdue items, and orphan issues — ranked by impact. These are the items that need action before your next standup.',
    route:       '/dashboard/priority-attention',
    targetId:    'tour-priority-attention',
    placement:   'bottom',
  },
  {
    id:          'recommendations',
    title:       'Smart Recommendations',
    description: 'AI-generated action cards based on your delivery data. Assign an owner to each, mark helpful/not helpful, or snooze/mute for later.',
    route:       '/dashboard/actions',
    targetId:    'tour-recommendations',
    placement:   'bottom',
  },
  {
    id:          'sprint',
    title:       'Sprint Throughput',
    description: 'Committed vs completed per sprint, carryover, scope changes, and mid-sprint delivery patterns. Spot End-Loaded or Blocked sprints before they become problems.',
    route:       '/dashboard/sprint-status',
    targetId:    'tour-sprint',
    placement:   'bottom',
  },
  {
    id:          'explore',
    title:       'Work Item Explorer',
    description: 'Navigate to /explore to visualise any issue\'s complete hierarchy — parent, children, risk path, orphan detection — as an interactive graph.',
    placement:   'center',
    ctaLabel:    'Open Explorer →',
    href:        '/explore',
  },
  {
    id:          'done',
    title:       "You're all set! 🎉",
    description: 'You\'ve seen the key features. Explore Teams, Portfolio, Trends, and Charts for deeper analytics. Start the tour again any time from the "Take a tour" button on the Overview page.',
    placement:   'center',
    ctaLabel:    'Finish',
  },
];

export function isTourDismissed(): boolean {
  try { return localStorage.getItem(KEY_DISMISSED) === '1'; } catch { return false; }
}

export function isTourCompleted(): boolean {
  try { return localStorage.getItem(KEY_COMPLETED) === '1'; } catch { return false; }
}

export function dismissTour(): void {
  try { localStorage.setItem(KEY_DISMISSED, '1'); } catch {}
}

export function completeTour(): void {
  try {
    localStorage.setItem(KEY_COMPLETED, '1');
    localStorage.setItem(KEY_DISMISSED, '1');
  } catch {}
}

export function resetTour(): void {
  try {
    localStorage.removeItem(KEY_DISMISSED);
    localStorage.removeItem(KEY_COMPLETED);
  } catch {}
}
