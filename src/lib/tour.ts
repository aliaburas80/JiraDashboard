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
}

export const TOUR_STEPS: TourStep[] = [
  {
    id:          'welcome',
    title:       'Welcome to Delivery Clarity 👋',
    description: 'This quick tour shows you the key features in under 2 minutes. You can skip at any time.',
    placement:   'center',
    ctaLabel:    'Start tour',
  },
  {
    id:          'section-switcher',
    title:       'Section Switcher',
    description: 'Use these tabs to jump directly to any dashboard section — Overview, Risks, Sprints, Kanban, Capacity, and more. Click "Full" to see everything at once.',
    targetId:    'dashboard-sticky-bar',
    placement:   'bottom',
  },
  {
    id:          'overview',
    title:       'Health Score & Key Metrics',
    description: 'Your delivery health score (0–100), completion rate, active issues, and key flow metrics at a glance. Click any KPI card to drill into the related detail.',
    targetId:    'section-overview',
    placement:   'bottom',
  },
  {
    id:          'attention',
    title:       'Priority Attention',
    description: 'Your top blockers, overdue items, and orphan issues — ranked by impact. These are the items that need action before your next standup.',
    targetId:    'section-attention',
    placement:   'top',
  },
  {
    id:          'recommendations',
    title:       'Smart Recommendations',
    description: 'AI-generated action cards based on your delivery data. Assign an owner to each, mark helpful/not helpful, or snooze/mute for later.',
    targetId:    'section-recommendations',
    placement:   'top',
  },
  {
    id:          'sprint',
    title:       'Sprint Throughput',
    description: 'Committed vs completed per sprint, carryover, scope changes, and mid-sprint delivery patterns. Spot End-Loaded or Blocked sprints before they become problems.',
    targetId:    'section-sprint',
    placement:   'top',
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
    description: 'You\'ve seen the key features. Explore Teams, Portfolio, Trends, and Charts for deeper analytics. Start the tour again any time from the Overview page.',
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
