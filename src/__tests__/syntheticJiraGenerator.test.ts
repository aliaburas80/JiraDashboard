// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// P0A-09: round-trip smoke test for scripts/generate-synthetic-jira-export.js —
// guards against the generator silently drifting from parser.ts's
// ESSENTIAL_FIELDS/FIELD_ALIASES contract. See product/PERFORMANCE.md.

import { ESSENTIAL_FIELDS, parseJiraFile } from '../services/jira/parser';
import { validateIssueData } from '../services/jira/validation';
import { calculateDashboardMetrics } from '../services/metrics/metrics.service';

const generator = require('../../scripts/generate-synthetic-jira-export.js') as {
  buildRows: (count: number, seed?: number) => Record<string, string>[];
  rowsToCsv: (rows: Record<string, string>[]) => string;
};

async function loadGenerator() {
  return generator;
}

test('buildRows produces the requested row count with every essential field populated', async () => {
  const { buildRows } = await loadGenerator();
  const rows = buildRows(300, 42);

  expect(rows).toHaveLength(300);
  for (const row of rows) {
    for (const field of ESSENTIAL_FIELDS) {
      expect(String(row[field] ?? '').trim()).not.toBe('');
    }
  }
});

test('generated CSV round-trips through the real parser, validator, and metrics calculation', async () => {
  const { buildRows, rowsToCsv } = await loadGenerator();
  const rows = buildRows(300, 42);
  const csv = rowsToCsv(rows);

  const parseResult = parseJiraFile({
    buffer: Buffer.from(csv, 'utf8'),
    originalname: 'synthetic.csv',
  });
  expect(parseResult.issues).toHaveLength(300);

  const validation = validateIssueData(parseResult.issues);
  expect(validation.isValid).toBe(true);
  expect(validation.errors).toEqual([]);

  expect(() => calculateDashboardMetrics(parseResult.issues as any)).not.toThrow();
  const metrics = calculateDashboardMetrics(parseResult.issues as any);
  expect(metrics.totalIssues).toBe(300);
});

test('buildRows is deterministic for a given seed', async () => {
  const { buildRows } = await loadGenerator();
  const a = buildRows(50, 7);
  const b = buildRows(50, 7);
  expect(a).toEqual(b);
});
