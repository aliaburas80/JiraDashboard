// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// MPE-02: pagination slice helper tests.

import { paginate } from '../lib/pagination';

test('empty array returns no items and exactly one (empty) page', () => {
  const result = paginate([], 1, 25);
  expect(result.items).toEqual([]);
  expect(result.page).toBe(1);
  expect(result.totalPages).toBe(1);
});

test('first page returns the first pageSize items', () => {
  const items = Array.from({ length: 60 }, (_, i) => i);
  const result = paginate(items, 1, 25);
  expect(result.items).toEqual(items.slice(0, 25));
  expect(result.page).toBe(1);
  expect(result.totalPages).toBe(3);
});

test('exact page-boundary count divides evenly with no trailing empty page', () => {
  const items = Array.from({ length: 50 }, (_, i) => i);
  const result = paginate(items, 2, 25);
  expect(result.items).toEqual(items.slice(25, 50));
  expect(result.totalPages).toBe(2);
});

test('requesting a page past the end clamps to the last page', () => {
  const items = Array.from({ length: 30 }, (_, i) => i);
  const result = paginate(items, 99, 25);
  expect(result.page).toBe(2);
  expect(result.items).toEqual(items.slice(25, 30));
});

test('requesting page 0 or a negative page clamps to page 1', () => {
  const items = Array.from({ length: 10 }, (_, i) => i);
  expect(paginate(items, 0, 5).page).toBe(1);
  expect(paginate(items, -3, 5).page).toBe(1);
});

test('a search that narrows results below the stale page clamps back down', () => {
  // Simulates: user is on page 3 of unfiltered results, then types a search
  // query that narrows the array to 4 matches — must not return an empty page.
  const narrowed = ['a', 'b', 'c', 'd'];
  const result = paginate(narrowed, 3, 25);
  expect(result.page).toBe(1);
  expect(result.items).toEqual(narrowed);
});

test('array shorter than one page returns a single page with all items', () => {
  const items = [1, 2, 3];
  const result = paginate(items, 1, 25);
  expect(result.items).toEqual(items);
  expect(result.totalPages).toBe(1);
});
