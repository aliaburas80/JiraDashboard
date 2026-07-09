// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Product tour tests — TC-PT-01 to TC-PT-10

import fs from 'fs';
import path from 'path';
import {
  TOUR_STEPS,
  isTourDismissed,
  isTourCompleted,
  dismissTour,
  completeTour,
  resetTour,
} from '../lib/tour';

// ── Mock localStorage ─────────────────────────────────────────────────────────

const store: Record<string, string> = {};
beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k]);
  Object.defineProperty(global, 'localStorage', {
    value: {
      getItem:    (k: string) => store[k] ?? null,
      setItem:    (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
    },
    writable: true,
  });
});

// ── TC-PT-01: Tour steps array is non-empty and well-formed ───────────────────

test('TC-PT-01: TOUR_STEPS has at least 8 steps, each with id and title', () => {
  expect(TOUR_STEPS.length).toBeGreaterThanOrEqual(8);
  TOUR_STEPS.forEach(step => {
    expect(typeof step.id).toBe('string');
    expect(step.id.length).toBeGreaterThan(0);
    expect(typeof step.title).toBe('string');
    expect(step.title.length).toBeGreaterThan(0);
    expect(typeof step.description).toBe('string');
  });
});

// ── TC-PT-02: First step is 'welcome', last is 'done' ────────────────────────

test('TC-PT-02: first step is welcome, last step is done', () => {
  expect(TOUR_STEPS[0].id).toBe('welcome');
  expect(TOUR_STEPS[TOUR_STEPS.length - 1].id).toBe('done');
});

// ── TC-PT-03: isTourDismissed returns false initially ────────────────────────

test('TC-PT-03: isTourDismissed returns false when not dismissed', () => {
  expect(isTourDismissed()).toBe(false);
});

// ── TC-PT-04: dismissTour persists and isTourDismissed returns true ──────────

test('TC-PT-04: dismissTour sets dismissed flag', () => {
  dismissTour();
  expect(isTourDismissed()).toBe(true);
});

// ── TC-PT-05: isTourCompleted returns false initially ────────────────────────

test('TC-PT-05: isTourCompleted returns false when not completed', () => {
  expect(isTourCompleted()).toBe(false);
});

// ── TC-PT-06: completeTour sets both completed and dismissed flags ────────────

test('TC-PT-06: completeTour sets completed and dismissed flags', () => {
  completeTour();
  expect(isTourCompleted()).toBe(true);
  expect(isTourDismissed()).toBe(true);
});

// ── TC-PT-07: resetTour clears all flags ─────────────────────────────────────

test('TC-PT-07: resetTour clears both flags', () => {
  completeTour();
  resetTour();
  expect(isTourDismissed()).toBe(false);
  expect(isTourCompleted()).toBe(false);
});

// ── TC-PT-08: every targetId is an id actually rendered by the app ──────────
// P0 fix, 2026-07-09: this test used to check targetId values against a
// hardcoded "known ids" list that was itself stale (dashboard-sticky-bar,
// section-overview, etc. — leftovers from before the dashboard was split
// into separate routed pages) — it always passed without proving anything
// real. Now greps the actual source tree for `id="<targetId>"` /
// `id={id}`-style props, so a future rename that forgets to update one side
// fails this test instead of silently breaking the tour.

function idExistsInSource(id: string): boolean {
  const roots = ['app', 'src/components'];
  const pattern = new RegExp(`id=["']${id}["']`);
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

test('TC-PT-08: every targetId is rendered somewhere in the app (not a stale/renamed anchor)', () => {
  const targetIds = TOUR_STEPS.map(step => step.targetId).filter((id): id is string => !!id);
  expect(targetIds.length).toBeGreaterThan(0); // sanity: the tour still highlights something
  targetIds.forEach(id => {
    expect(idExistsInSource(id)).toBe(true);
  });
});

// ── TC-PT-09: every route referenced by a step is a real, existing page ─────

test('TC-PT-09: every step route corresponds to a real app/ page.tsx', () => {
  const routes = TOUR_STEPS.map(step => step.route).filter((r): r is string => !!r);
  expect(routes.length).toBeGreaterThan(0);
  routes.forEach(route => {
    const pagePath = path.join(process.cwd(), 'app', route, 'page.tsx');
    expect(fs.existsSync(pagePath)).toBe(true);
  });
});

// ── TC-PT-10: steps with an href (not a `route`) also point at a real page ──

test('TC-PT-10: a step\'s href (CTA-navigates-and-ends-tour) also points at a real page', () => {
  const hrefs = TOUR_STEPS.map(step => step.href).filter((h): h is string => !!h);
  hrefs.forEach(href => {
    const pagePath = path.join(process.cwd(), 'app', href, 'page.tsx');
    expect(fs.existsSync(pagePath)).toBe(true);
  });
});
