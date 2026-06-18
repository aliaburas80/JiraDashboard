// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Multi-file merge / dedup tests — TC-UM-01 to TC-UM-06
// Closes TRACE-02 / Gaps Summary COVER-06 (UC-094, FR-312): mergeIssueArrays() had
// a live route and UI but zero FR/UC/TC anchor and zero test coverage.

import { mergeIssueArrays } from '../lib/mergeIssues';

// TC-UM-01: Issues with distinct Issue Keys across files are all kept, no dedup
test('TC-UM-01: distinct Issue Keys across files are all kept', () => {
  const fileA = [{ 'Issue Key': 'PROJ-1', Summary: 'Alpha' }];
  const fileB = [{ 'Issue Key': 'PROJ-2', Summary: 'Beta' }];
  const { merged, stats } = mergeIssueArrays([fileA, fileB]);
  expect(merged).toHaveLength(2);
  expect(stats).toEqual({ fileCount: 2, totalBeforeMerge: 2, duplicatesRemoved: 0, uniqueIssues: 2 });
});

// TC-UM-02: Same Issue Key across files is deduplicated into one record
test('TC-UM-02: duplicate Issue Key across files is merged into a single record', () => {
  const fileA = [{ 'Issue Key': 'PROJ-1', Summary: 'Alpha' }];
  const fileB = [{ 'Issue Key': 'PROJ-1', Summary: 'Alpha (more detail)' }];
  const { merged, stats } = mergeIssueArrays([fileA, fileB]);
  expect(merged).toHaveLength(1);
  expect(stats.duplicatesRemoved).toBe(1);
  expect(stats.uniqueIssues).toBe(1);
  expect(stats.totalBeforeMerge).toBe(2);
});

// TC-UM-03: When merging duplicates, a non-empty value wins over an empty one
test('TC-UM-03: non-empty field value wins over empty/null/undefined on merge', () => {
  const fileA = [{ 'Issue Key': 'PROJ-1', Assignee: '', Reporter: null }];
  const fileB = [{ 'Issue Key': 'PROJ-1', Assignee: 'Jane Doe', Reporter: 'John Roe' }];
  const { merged } = mergeIssueArrays([fileA, fileB]);
  expect(merged[0].Assignee).toBe('Jane Doe');
  expect(merged[0].Reporter).toBe('John Roe');
});

// TC-UM-04: Between two non-empty strings, the longer (more detailed) one wins
test('TC-UM-04: longer string value wins between two non-empty strings on merge', () => {
  const fileA = [{ 'Issue Key': 'PROJ-1', Summary: 'Short' }];
  const fileB = [{ 'Issue Key': 'PROJ-1', Summary: 'Short but with much more detail' }];
  const { merged } = mergeIssueArrays([fileA, fileB]);
  expect(merged[0].Summary).toBe('Short but with much more detail');

  // Order independence — the longer value wins regardless of which file it came from
  const { merged: reversed } = mergeIssueArrays([fileB, fileA]);
  expect(reversed[0].Summary).toBe('Short but with much more detail');
});

// TC-UM-05: Issues with a missing/blank Issue Key are dropped from the merged result
test('TC-UM-05: rows with missing or blank Issue Key are excluded from the merge', () => {
  const fileA = [
    { 'Issue Key': 'PROJ-1', Summary: 'Has a key' },
    { 'Issue Key': '', Summary: 'Blank key' },
    { Summary: 'No key field at all' },
    { 'Issue Key': '   ', Summary: 'Whitespace-only key' },
  ];
  const { merged, stats } = mergeIssueArrays([fileA]);
  expect(merged).toHaveLength(1);
  expect(merged[0].Summary).toBe('Has a key');
  expect(stats.totalBeforeMerge).toBe(4);
  expect(stats.uniqueIssues).toBe(1);
});

// TC-UM-06: Merging three files combines fileCount, totals, and duplicate accounting correctly
test('TC-UM-06: three-file merge reports correct fileCount, totals, and duplicate accounting', () => {
  const fileA = [{ 'Issue Key': 'PROJ-1' }, { 'Issue Key': 'PROJ-2' }];
  const fileB = [{ 'Issue Key': 'PROJ-2' }, { 'Issue Key': 'PROJ-3' }];
  const fileC = [{ 'Issue Key': 'PROJ-3' }, { 'Issue Key': 'PROJ-4' }];
  const { merged, stats } = mergeIssueArrays([fileA, fileB, fileC]);
  expect(merged).toHaveLength(4);
  expect(stats).toEqual({ fileCount: 3, totalBeforeMerge: 6, duplicatesRemoved: 2, uniqueIssues: 4 });
});
