// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// Onboarding checklist tests — TC-OB-01 to TC-OB-10

import {
  getCompletedSteps,
  markStepDone,
  isOnboardingDismissed,
  dismissOnboarding,
  resetOnboarding,
  autoDetectSteps,
  ONBOARDING_STEPS,
  type StepId,
} from '../lib/onboarding';

// Mock localStorage
const store: Record<string, string> = {};
const localStorageMock = {
  getItem:    (k: string)         => store[k] ?? null,
  setItem:    (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string)         => { delete store[k]; },
  clear:      ()                  => { Object.keys(store).forEach(k => delete store[k]); },
};
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

beforeEach(() => localStorageMock.clear());

// TC-OB-01: getCompletedSteps returns empty set on first visit
test('TC-OB-01: getCompletedSteps returns empty set on first visit', () => {
  const steps = getCompletedSteps();
  expect(steps.size).toBe(0);
});

// TC-OB-02: markStepDone persists the step
test('TC-OB-02: markStepDone persists the step to localStorage', () => {
  markStepDone('upload_file');
  const steps = getCompletedSteps();
  expect(steps.has('upload_file')).toBe(true);
});

// TC-OB-03: markStepDone is idempotent
test('TC-OB-03: markStepDone called twice does not duplicate', () => {
  markStepDone('view_dashboard');
  markStepDone('view_dashboard');
  const steps = getCompletedSteps();
  expect([...steps].filter(s => s === 'view_dashboard')).toHaveLength(1);
});

// TC-OB-04: Multiple steps can be marked done
test('TC-OB-04: multiple steps can be marked done independently', () => {
  markStepDone('upload_file');
  markStepDone('create_account');
  markStepDone('try_explorer');
  const steps = getCompletedSteps();
  expect(steps.has('upload_file')).toBe(true);
  expect(steps.has('create_account')).toBe(true);
  expect(steps.has('try_explorer')).toBe(true);
});

// TC-OB-05: isOnboardingDismissed returns false initially
test('TC-OB-05: isOnboardingDismissed returns false initially', () => {
  expect(isOnboardingDismissed()).toBe(false);
});

// TC-OB-06: dismissOnboarding sets dismissed flag
test('TC-OB-06: dismissOnboarding sets dismissed flag', () => {
  dismissOnboarding();
  expect(isOnboardingDismissed()).toBe(true);
});

// TC-OB-07: resetOnboarding clears all state
test('TC-OB-07: resetOnboarding clears completed steps and dismissed flag', () => {
  markStepDone('upload_file');
  dismissOnboarding();
  resetOnboarding();
  expect(getCompletedSteps().size).toBe(0);
  expect(isOnboardingDismissed()).toBe(false);
});

// TC-OB-08: autoDetectSteps detects upload_file from metrics key
test('TC-OB-08: autoDetectSteps detects upload_file when metrics exist', () => {
  store['dc_metrics_v2'] = '{"totalIssues":10}';
  const detected = autoDetectSteps();
  expect(detected).toContain('upload_file');
  expect(detected).toContain('view_dashboard');
});

// TC-OB-09: autoDetectSteps detects saved preset
test('TC-OB-09: autoDetectSteps detects save_preset when presets exist', () => {
  store['dc_filter_presets'] = JSON.stringify([{ id: 'p1', name: 'My preset', filters: {} }]);
  const detected = autoDetectSteps();
  expect(detected).toContain('save_preset');
});

// TC-OB-10: ONBOARDING_STEPS has 8 steps with required fields
test('TC-OB-10: ONBOARDING_STEPS has 8 steps, all with id, title, description', () => {
  expect(ONBOARDING_STEPS).toHaveLength(8);
  ONBOARDING_STEPS.forEach(step => {
    expect(step.id).toBeTruthy();
    expect(step.title.length).toBeGreaterThan(0);
    expect(step.description.length).toBeGreaterThan(0);
  });
});
