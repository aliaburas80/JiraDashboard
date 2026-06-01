// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// Onboarding step tracking — persisted to localStorage.
// Auto-detects some steps; others are set explicitly when the user acts.

export type StepId =
  | 'upload_file'       // uploaded or used sample data
  | 'create_account'    // logged in / registered
  | 'view_dashboard'    // reached the dashboard
  | 'explore_quality'   // saw data quality + field impact
  | 'try_explorer'      // visited /explore
  | 'download_report'   // downloaded Excel or HTML report
  | 'save_preset'       // saved at least one filter preset
  | 'review_sprints';   // opened sprint throughput panel

export interface OnboardingStep {
  id:          StepId;
  title:       string;
  description: string;
  href?:       string;
  ctaLabel?:   string;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id:          'upload_file',
    title:       'Upload your first Jira export',
    description: 'Drop a CSV or XLSX file — or click "Try with sample data" to see a demo instantly.',
    href:        '/',
    ctaLabel:    'Upload file',
  },
  {
    id:          'create_account',
    title:       'Create your account',
    description: 'Sign in so your import history is saved and private to you.',
    href:        '/register',
    ctaLabel:    'Create account',
  },
  {
    id:          'view_dashboard',
    title:       'Review your delivery health',
    description: 'See your health score, KPIs, and smart recommendations on the Full Report.',
    href:        '/dashboard',
    ctaLabel:    'Open dashboard',
  },
  {
    id:          'explore_quality',
    title:       'Check your data quality',
    description: 'See which Jira columns are missing and how they affect your metrics.',
    href:        '/dashboard',
    ctaLabel:    'View data quality',
  },
  {
    id:          'try_explorer',
    title:       'Explore a work item',
    description: 'Enter any issue key in Work Item Explorer to see its full hierarchy visually.',
    href:        '/explore',
    ctaLabel:    'Try Explorer',
  },
  {
    id:          'download_report',
    title:       'Download a statistical report',
    description: 'Export a 17-sheet Excel workbook with delivery insights — useful in board meetings.',
    href:        '/dashboard',
    ctaLabel:    'Download Excel',
  },
  {
    id:          'save_preset',
    title:       'Save a filter preset',
    description: 'Set filters on the Full Report, then save them as a named preset for quick access.',
    href:        '/dashboard',
    ctaLabel:    'Save preset',
  },
  {
    id:          'review_sprints',
    title:       'Review sprint throughput',
    description: 'Expand the Throughput section to see per-sprint delivery patterns and trends.',
    href:        '/dashboard',
    ctaLabel:    'View sprints',
  },
];

const STORAGE_KEY    = 'dc_onboarding_completed';
const DISMISSED_KEY  = 'dc_onboarding_dismissed';

export function getCompletedSteps(): Set<StepId> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) as StepId[] : []);
  } catch { return new Set(); }
}

export function markStepDone(id: StepId): void {
  try {
    const current = getCompletedSteps();
    current.add(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...current]));
  } catch {}
}

export function isOnboardingDismissed(): boolean {
  try { return localStorage.getItem(DISMISSED_KEY) === '1'; } catch { return false; }
}

export function dismissOnboarding(): void {
  try { localStorage.setItem(DISMISSED_KEY, '1'); } catch {}
}

export function resetOnboarding(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(DISMISSED_KEY);
  } catch {}
}

// Auto-detect steps from existing app state
export function autoDetectSteps(): StepId[] {
  const detected: StepId[] = [];
  try {
    // Has uploaded a file
    if (localStorage.getItem('dc_metrics_v2')) detected.push('upload_file');
    // Has viewed dashboard (implies metrics loaded)
    if (localStorage.getItem('dc_metrics_v2')) detected.push('view_dashboard');
    // Data quality is shown automatically when metrics exist
    if (localStorage.getItem('dc_metrics_v2')) detected.push('explore_quality');
    // Has a saved filter preset
    const presets = JSON.parse(localStorage.getItem('dc_filter_presets') ?? '[]');
    if (presets.length > 0) detected.push('save_preset');
    // Visited explorer
    if (localStorage.getItem('dc_visited_explore') === '1') detected.push('try_explorer');
    // Downloaded a report
    if (localStorage.getItem('dc_downloaded_report') === '1') detected.push('download_report');
    // Sprint panel opened
    if (localStorage.getItem('dc_viewed_sprints') === '1') detected.push('review_sprints');
  } catch {}
  return detected;
}
