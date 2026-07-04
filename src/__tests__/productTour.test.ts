// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Product tour tests — TC-PT-01 to TC-PT-08

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

// ── TC-PT-08: Steps with targetId reference existing section IDs ─────────────

test('TC-PT-08: targetId values match known dashboard section IDs', () => {
  const knownIds = new Set([
    'dashboard-sticky-bar',
    'section-overview',
    'section-attention',
    'section-recommendations',
    'section-sprint',
    'section-ratios',
    'section-kanban',
    'section-throughput',
  ]);
  TOUR_STEPS.forEach(step => {
    if (step.targetId) {
      expect(knownIds.has(step.targetId)).toBe(true);
    }
  });
});
