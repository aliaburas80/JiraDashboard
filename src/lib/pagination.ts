// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// MPE-02: pure client-side pagination slice helper for admin/list pages that
// render an already-fetched, bounded array (import logs, users, members,
// snapshots). Used identically on 5 pages — meets CLAUDE.md's Rule of Three
// for extracting a shared helper.
//
// Not for genuinely unbounded, server-side datasets — those page via API
// query params instead (see /api/admin/audit-events's ?page=&limit=).

export interface PaginationResult<T> {
  /** The slice of `items` for the (clamped) current page. */
  items: T[];
  /** The current page, clamped to the valid [1, totalPages] range. */
  page: number;
  /** Total number of pages, always at least 1 (even for an empty array). */
  totalPages: number;
}

/**
 * Slice `items` into a single page of at most `pageSize` entries.
 *
 * `page` is 1-indexed and automatically clamped so a stale page number
 * (e.g. after a search narrows the result set) never produces an
 * out-of-range or empty page while earlier pages still have data.
 */
export function paginate<T>(items: readonly T[], page: number, pageSize: number): PaginationResult<T> {
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const totalPages = Math.max(1, Math.ceil(items.length / safePageSize));
  const safePage = Math.min(Math.max(1, Math.floor(page) || 1), totalPages);
  const start = (safePage - 1) * safePageSize;

  return {
    items: items.slice(start, start + safePageSize),
    page: safePage,
    totalPages,
  };
}
