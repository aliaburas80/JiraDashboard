// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Dashboard view tests — TC-DV-01 to TC-DV-10

import { DASHBOARD_VIEWS, DEFAULT_VIEW_ID } from '../types/dashboardView';
import { getInitialViewId, getSavedViewId, saveViewId, getView } from '../lib/dashboardView';

const store: Record<string, string> = {};
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem:    (k: string) => store[k] ?? null,
    setItem:    (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear:      () => { Object.keys(store).forEach(k => delete store[k]); },
  },
});

beforeEach(() => Object.keys(store).forEach(k => delete store[k]));

// TC-DV-01: 5 views defined
test('TC-DV-01: exactly 5 views are defined', () => {
  expect(DASHBOARD_VIEWS).toHaveLength(5);
});

// TC-DV-02: Default view is full
test('TC-DV-02: default view id is full', () => {
  expect(DEFAULT_VIEW_ID).toBe('full');
});

// TC-DV-03: getSavedViewId returns full when nothing stored
test('TC-DV-03: getSavedViewId returns full when nothing in localStorage', () => {
  expect(getSavedViewId()).toBe('full');
});

// TC-DV-04: saveViewId persists and getSavedViewId retrieves
test('TC-DV-04: saveViewId + getSavedViewId round-trip', () => {
  saveViewId('executive');
  expect(getSavedViewId()).toBe('executive');
});

// TC-DV-05: getView returns correct view
test('TC-DV-05: getView returns view matching the id', () => {
  const view = getView('scrum_master');
  expect(view.id).toBe('scrum_master');
  expect(view.label).toBe('Scrum Master');
});

// TC-DV-06: getView falls back to full on unknown id
test('TC-DV-06: getView falls back to full for unknown id', () => {
  const view = getView('unknown_view' as any);
  expect(view.id).toBe('full');
});

// TC-DV-07: Full view hides nothing
test('TC-DV-07: full view has no hidden sections', () => {
  const full = getView('full');
  expect(full.hidden).toHaveLength(0);
});

// TC-DV-08: Executive view hides throughput
test('TC-DV-08: executive view hides throughput and visuals', () => {
  const exec = getView('executive');
  expect(exec.hidden).toContain('throughput');
  expect(exec.hidden).toContain('visuals');
});

// TC-DV-09: Every view has required fields
test('TC-DV-09: every view has id, label, icon, audience, description, defaultOpen, hidden', () => {
  DASHBOARD_VIEWS.forEach(v => {
    expect(v.id).toBeTruthy();
    expect(v.label).toBeTruthy();
    expect(v.icon).toBeTruthy();
    expect(v.audience).toBeTruthy();
    expect(v.description).toBeTruthy();
    expect(Array.isArray(v.defaultOpen)).toBe(true);
    expect(Array.isArray(v.hidden)).toBe(true);
  });
});

// TC-DV-10: Scrum Master view opens throughput
test('TC-DV-10: scrum_master defaultOpen includes throughput and attention', () => {
  const sm = getView('scrum_master');
  expect(sm.defaultOpen).toContain('throughput');
  expect(sm.defaultOpen).toContain('attention');
});

test('TC-DV-11: assigned role ignores saved dashboard view outside role', () => {
  saveViewId('executive');
  expect(getInitialViewId('scrum_master')).toBe('scrum_master');
});
