// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Regression tests (JIRA-11 follow-up): a root-level container above Epic
// (Initiative/Project/Product under Advanced Roadmaps hierarchy) must never
// receive a phantom epic link from prefix-based inference, and must never be
// flagged as an orphan just because it has no parent of its own.

import { reconstructHierarchy, getAncestorChain } from '../services/relations/hierarchy.service';

function flowItem(key: string, type: string, extra: Record<string, unknown> = {}) {
  return {
    key, type, summary: `Summary ${key}`, status: 'Backlog', assignee: 'Unassigned',
    health: 'good', storyPoints: 0, parent: '', epic: '', isOrphan: false, ...extra,
  };
}

// Product (root) -> Project -> Epic, all sharing the "AJ" key prefix.
const PRODUCT = flowItem('AJ-26', 'Product');
const PROJECT = flowItem('AJ-27', 'Project', { parent: 'AJ-26', epic: 'AJ-26' });
const EPIC    = flowItem('AJ-28', 'Epic',    { parent: 'AJ-27', epic: 'AJ-27' });
const issues  = [PRODUCT, PROJECT, EPIC];

test('TC-HIER-01: a root container with the same key prefix as an Epic does not receive a phantom epic link', () => {
  const map = reconstructHierarchy(issues);
  expect(map.epic.has('AJ-26')).toBe(false);
});

test('TC-HIER-02: ancestor chain for the middle node terminates at the true root, with no cycle back to itself', () => {
  const map = reconstructHierarchy(issues);
  expect(getAncestorChain('AJ-27', map)).toEqual(['AJ-26']);
});

test('TC-HIER-03: ancestor chain for the Epic includes both the Project and the Product', () => {
  const map = reconstructHierarchy(issues);
  expect(getAncestorChain('AJ-28', map)).toEqual(['AJ-27', 'AJ-26']);
});

test('TC-HIER-04: a root container that already has children is never flagged as an orphan', () => {
  const map = reconstructHierarchy(issues);
  expect(map.orphanKeys.has('AJ-26')).toBe(false);
});

test('TC-HIER-05: children map reflects only the real parent-key links, never the inferred phantom one', () => {
  const map = reconstructHierarchy(issues);
  expect(map.children.get('AJ-26')).toEqual(['AJ-27']);
  expect(map.children.get('AJ-27')).toEqual(['AJ-28']);
  expect(map.children.get('AJ-28') ?? []).not.toContain('AJ-26');
});
