// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Orphan detection rules tests — TC-OR-01 to TC-OR-10

import { isOrphanByRules } from '../services/settings/orphanRules.service';
import { DEFAULT_ORPHAN_RULES } from '../types/orphanRules';
import type { OrphanRules } from '../types/orphanRules';

function issue(overrides: Record<string, unknown> = {}) {
  return { 'Issue Type': 'Story', 'Epic Link': '', 'Parent Key': '', ...overrides };
}

const defaults = { ...DEFAULT_ORPHAN_RULES };

// TC-OR-01: Item with Epic Link → NOT an orphan
test('TC-OR-01: item with Epic Link is not an orphan', () => {
  expect(isOrphanByRules(issue({ 'Epic Link': 'EPIC-1' }), defaults)).toBe(false);
});

// TC-OR-02: Item with Parent Key → NOT an orphan
test('TC-OR-02: item with Parent Key is not an orphan', () => {
  expect(isOrphanByRules(issue({ 'Parent Key': 'STORY-5' }), defaults)).toBe(false);
});

// TC-OR-03: Item with neither field → orphan
test('TC-OR-03: item with no Epic Link and no Parent Key is an orphan', () => {
  expect(isOrphanByRules(issue(), defaults)).toBe(true);
});

// TC-OR-04: Epic type is exempt → NOT an orphan even without links
test('TC-OR-04: Epic issue type is never an orphan', () => {
  expect(isOrphanByRules(issue({ 'Issue Type': 'Epic', 'Epic Link': '', 'Parent Key': '' }), defaults)).toBe(false);
});

// TC-OR-05: Custom exempt types respected
test('TC-OR-05: custom exempt type is not flagged as orphan', () => {
  const rules: OrphanRules = { ...defaults, exemptIssueTypes: ['Epic', 'Story'] };
  expect(isOrphanByRules(issue({ 'Issue Type': 'Story', 'Epic Link': '', 'Parent Key': '' }), rules)).toBe(false);
});

// TC-OR-06: Sub-task flagging controlled by rule
test('TC-OR-06: sub-task without parent is orphan when flag is true', () => {
  const rules: OrphanRules = { ...defaults, flagSubTasksWithoutParent: true };
  expect(isOrphanByRules(issue({ 'Issue Type': 'Sub-task' }), rules)).toBe(true);
});

test('TC-OR-06b: sub-task without parent is NOT orphan when flag is false', () => {
  const rules: OrphanRules = { ...defaults, flagSubTasksWithoutParent: false };
  expect(isOrphanByRules(issue({ 'Issue Type': 'Sub-task' }), rules)).toBe(false);
});

// TC-OR-07: Custom parent link fields
test('TC-OR-07: custom parent field used instead of Epic Link/Parent Key', () => {
  const rules: OrphanRules = { ...defaults, parentLinkFields: ['Component/s', 'Project'] };
  // Has Epic Link but not the custom fields — still orphan
  expect(isOrphanByRules(issue({ 'Epic Link': 'EPIC-1' }), rules)).toBe(true);
  // Has custom field — not orphan
  expect(isOrphanByRules(issue({ 'Component/s': 'Auth' }), rules)).toBe(false);
});

// TC-OR-08: Multiple parent fields — any one is enough
test('TC-OR-08: having any one of multiple parent fields prevents orphan flag', () => {
  const rules: OrphanRules = { ...defaults, parentLinkFields: ['Epic Link', 'Parent Key', 'Project'] };
  expect(isOrphanByRules(issue({ 'Project': 'PROJ' }), rules)).toBe(false);
  expect(isOrphanByRules(issue({ 'Epic Link': 'E-1' }), rules)).toBe(false);
  expect(isOrphanByRules(issue(), rules)).toBe(true);
});

// TC-OR-09: Empty exempt types — nothing exempt
test('TC-OR-09: empty exempt types means Epics can be orphans', () => {
  const rules: OrphanRules = { ...defaults, exemptIssueTypes: [] };
  expect(isOrphanByRules(issue({ 'Issue Type': 'Epic' }), rules)).toBe(true);
});

// TC-OR-10: DEFAULT_ORPHAN_RULES has correct defaults
test('TC-OR-10: DEFAULT_ORPHAN_RULES defaults are correct', () => {
  expect(DEFAULT_ORPHAN_RULES.parentLinkFields).toContain('Epic Link');
  expect(DEFAULT_ORPHAN_RULES.parentLinkFields).toContain('Parent Key');
  expect(DEFAULT_ORPHAN_RULES.exemptIssueTypes).toContain('Epic');
  expect(DEFAULT_ORPHAN_RULES.flagSubTasksWithoutParent).toBe(true);
});
