// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Product tour tests — TC-PT-01 to TC-PT-06
// P0 fix, 2026-07-09: rewritten for the per-page tour model (PAGE_TOURS,
// keyed by route) replacing the old single cross-page TOUR_STEPS walkthrough.

import fs from 'fs';
import path from 'path';
import { PAGE_TOURS, getPageTour, type TourStep } from '../lib/tour';

const ROUTES = Object.keys(PAGE_TOURS);
const ALL_STEPS: TourStep[] = ROUTES.flatMap(route => PAGE_TOURS[route]);

// ── TC-PT-01: every route has at least one well-formed step ─────────────────

test('TC-PT-01: PAGE_TOURS covers a broad set of routes, each with well-formed steps', () => {
  expect(ROUTES.length).toBeGreaterThanOrEqual(40);
  ROUTES.forEach(route => {
    const steps = PAGE_TOURS[route];
    expect(steps.length).toBeGreaterThan(0);
    steps.forEach(step => {
      expect(typeof step.id).toBe('string');
      expect(step.id.length).toBeGreaterThan(0);
      expect(typeof step.title).toBe('string');
      expect(step.title.length).toBeGreaterThan(0);
      expect(typeof step.description).toBe('string');
      expect(step.description.length).toBeGreaterThan(0);
    });
  });
});

// ── TC-PT-02: every route key is a real app/ page ────────────────────────────

test('TC-PT-02: every PAGE_TOURS route corresponds to a real app/<route>/page.tsx', () => {
  ROUTES.forEach(route => {
    const pagePath = path.join(process.cwd(), 'app', route, 'page.tsx');
    expect(fs.existsSync(pagePath)).toBe(true);
  });
});

// ── TC-PT-03: every targetId is an id actually rendered by the app ──────────
// Greps the actual source tree for `id="<targetId>"` so a future rename that
// forgets to update one side fails this test instead of silently breaking
// the tour (this pattern predates this rewrite — see git history). Also
// matches `headerId="<targetId>"` (the 9 admin pages set their anchor via
// AdminConsoleLayout's `headerId` prop, rendered internally as `id={headerId}`)
// and `id={condition ? '<targetId>' : undefined}`-style dynamic expressions
// (used where only the first item in a repeated list should carry the anchor).

function idExistsInSource(id: string): boolean {
  const roots = ['app', 'src/components'];
  const pattern = new RegExp(`id=["']${id}["']|headerId=["']${id}["']|id=\\{[^}]*["']${id}["'][^}]*\\}`);
  function search(dir: string): boolean {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (search(full)) return true;
      } else if (/\.tsx?$/.test(entry.name)) {
        if (pattern.test(fs.readFileSync(full, 'utf8'))) return true;
      }
    }
    return false;
  }
  return roots.some(root => search(path.join(process.cwd(), root)));
}

test('TC-PT-03: every targetId is rendered somewhere in the app (not a stale/renamed anchor)', () => {
  const targetIds = ALL_STEPS.map(step => step.targetId).filter((id): id is string => !!id);
  expect(targetIds.length).toBeGreaterThan(0); // sanity: most steps still highlight something
  targetIds.forEach(id => {
    expect(idExistsInSource(id)).toBe(true);
  });
});

// ── TC-PT-04: getPageTour looks up by exact pathname ─────────────────────────

test('TC-PT-04: getPageTour returns the registered steps for a known route and null otherwise', () => {
  expect(getPageTour('/summary')).toBe(PAGE_TOURS['/summary']);
  expect(getPageTour('/dashboard/priority-attention')).toBe(PAGE_TOURS['/dashboard/priority-attention']);
  expect(getPageTour('/this-route-does-not-exist')).toBeNull();
});

// ── TC-PT-05: a step with no targetId is centered (nothing to highlight) ────

test('TC-PT-05: every step without a targetId uses center placement', () => {
  ALL_STEPS.forEach(step => {
    if (!step.targetId) {
      expect(step.placement).toBe('center');
    }
  });
});

// ── TC-PT-06: placement, when set, is one of the values ProductTour supports ─

test('TC-PT-06: every step placement is a supported value', () => {
  const allowed = new Set(['top', 'bottom', 'left', 'right', 'center']);
  ALL_STEPS.forEach(step => {
    if (step.placement) {
      expect(allowed.has(step.placement)).toBe(true);
    }
  });
});
