// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
//
// Distinguishes "the metrics fetch failed" from "no data has been uploaded
// yet" across the ~20 pages that redirect to / when loadMetricsWithSource()
// doesn't return usable data. Previously every one of these pages redirected
// silently on both a genuine network/server error AND a legitimate empty
// state, so a user hitting a transient fetch failure saw the exact same
// "upload your Jira export" screen as someone who had genuinely never
// uploaded anything — with no way to tell the two apart. See product-audit
// docs/product-audit/09-ux-and-accessibility.md §2 (the dominant Checkpoint 2
// finding) and docs/product-audit/11-prioritized-backlog.md Phase 3.
//
// Deliberately a sessionStorage signal consumed once by the upload page (/),
// not a full per-page error-state redesign — every affected page already
// redirects to / on failure; this makes that redirect land on a page that can
// say what happened instead of adding bespoke error UI to ~20 pages.

const KEY = 'dc_load_error_v1';

interface RouterLike {
  replace: (href: string) => void;
}

/**
 * Call from a data-load catch block instead of a bare router.replace('/').
 * Records a message for the upload page to show, then performs the redirect.
 */
export function redirectWithLoadError(router: RouterLike, message?: string): void {
  try {
    sessionStorage.setItem(
      KEY,
      message ?? 'We couldn’t load your dashboard data. Please try again — if this keeps happening, contact your administrator.',
    );
  } catch {
    // sessionStorage unavailable (private browsing, etc.) — redirect still proceeds,
    // just without the explanatory banner.
  }
  router.replace('/');
}

/**
 * Call once on the upload page's mount. Returns the message and clears the
 * signal so it doesn't reappear on a later, unrelated visit to /.
 */
export function consumeLoadErrorSignal(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const message = sessionStorage.getItem(KEY);
    if (message) sessionStorage.removeItem(KEY);
    return message;
  } catch {
    return null;
  }
}
