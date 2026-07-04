// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Column mapping preview tests — TC-CM-01 to TC-CM-10

import { buildColumnMapping } from '../services/jira/parser';
import { ESSENTIAL_FIELDS } from '../services/jira/parser';

// TC-CM-01: Perfect headers → all mapped, high score
test('TC-CM-01: essential columns mapped directly → high mapping score', () => {
  const raw       = ['Issue Key', 'Issue Type', 'Summary', 'Status', 'Assignee', 'Story Points'];
  const canonical = ['Issue Key', 'Issue Type', 'Summary', 'Status', 'Assignee', 'Story Points'];
  const result = buildColumnMapping(raw, canonical, 'Sheet1');
  expect(result.mappingScore).toBeGreaterThanOrEqual(50);
  expect(result.missingEssential).toHaveLength(0);
  expect(result.totalMapped).toBeGreaterThan(0);
});

// TC-CM-02: Missing essential columns detected
test('TC-CM-02: missing essential columns reported', () => {
  const raw       = ['Summary', 'Status'];
  const canonical = ['Summary', 'Status'];
  const result = buildColumnMapping(raw, canonical, 'Sheet1');
  expect(result.missingEssential).toContain('Issue Key');
  expect(result.missingEssential).toContain('Issue Type');
  expect(result.mappingScore).toBeLessThan(60);
});

// TC-CM-03: Aliased column detected (original ≠ canonical)
test('TC-CM-03: aliased column detected and marked correctly', () => {
  const raw       = ['issue key', 'Issue Type', 'Summary', 'Status'];
  const canonical = ['Issue Key', 'Issue Type', 'Summary', 'Status'];
  const result = buildColumnMapping(raw, canonical, 'Sheet1');
  const aliased = result.columns.find(c => c.original === 'issue key');
  expect(aliased?.status).toBe('aliased');
  expect(aliased?.canonical).toBe('Issue Key');
  expect(result.totalAliased).toBeGreaterThanOrEqual(1);
});

// TC-CM-04: Unrecognised column detected
test('TC-CM-04: unrecognised column (not in OPTIONAL_FIELDS) detected', () => {
  const raw       = ['Issue Key', 'Issue Type', 'Summary', 'Status', 'Custom Foo Column'];
  const canonical = ['Issue Key', 'Issue Type', 'Summary', 'Status', 'Custom Foo Column'];
  const result = buildColumnMapping(raw, canonical, 'Sheet1');
  const unknown = result.columns.find(c => c.original === 'Custom Foo Column');
  expect(unknown?.status).toBe('unrecognised');
  expect(result.totalUnrecognised).toBeGreaterThanOrEqual(1);
});

// TC-CM-05: Missing important field listed
test('TC-CM-05: missing In Progress Date listed in missingImportant', () => {
  const raw       = ['Issue Key', 'Issue Type', 'Summary', 'Status'];
  const canonical = ['Issue Key', 'Issue Type', 'Summary', 'Status'];
  const result = buildColumnMapping(raw, canonical, 'Sheet1');
  expect(result.missingImportant).toContain('In Progress Date');
  expect(result.missingImportant).toContain('Story Points');
});

// TC-CM-06: totalInFile matches input
test('TC-CM-06: totalInFile matches the number of raw headers', () => {
  const raw = ['Issue Key', 'Issue Type', 'Summary', 'Status', 'Assignee'];
  const result = buildColumnMapping(raw, raw, 'Sheet1');
  expect(result.totalInFile).toBe(5);
});

// TC-CM-07: mappingScore is 0–100
test('TC-CM-07: mappingScore is always clamped to 0–100', () => {
  const result = buildColumnMapping([], [], 'Sheet1');
  expect(result.mappingScore).toBeGreaterThanOrEqual(0);
  expect(result.mappingScore).toBeLessThanOrEqual(100);
});

// TC-CM-08: sheetName is preserved
test('TC-CM-08: sheetName passed through correctly', () => {
  const result = buildColumnMapping(['Issue Key'], ['Issue Key'], 'My Sprint Board');
  expect(result.sheetName).toBe('My Sprint Board');
});

// TC-CM-09: Essential field marked isEssential=true
test('TC-CM-09: essential fields marked correctly', () => {
  const raw = ['Issue Key', 'Issue Type', 'Summary', 'Status'];
  const result = buildColumnMapping(raw, raw, 'Sheet1');
  const issueKey = result.columns.find(c => c.canonical === 'Issue Key');
  expect(issueKey?.isEssential).toBe(true);
});

// TC-CM-10: Empty file → all essentials missing
test('TC-CM-10: empty headers → all essentials missing', () => {
  const result = buildColumnMapping([], [], 'Sheet1');
  ESSENTIAL_FIELDS.forEach(f => {
    expect(result.missingEssential).toContain(f);
  });
});
