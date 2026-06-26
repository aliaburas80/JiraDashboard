// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Retrospective file parser — TC-RETRO-08 to TC-RETRO-13 (RETRO-04 to RETRO-07)

import * as XLSX from 'xlsx';
import { parseRetroFile } from '@/services/retro/retroFileParser.service';

const HEADER = [
  'Sprint Name', 'Team Name', 'Retro Date', 'Sprint Goal Met (yes/no/partial)', 'Sprint Goal',
  'What Went Well', 'What Did Not Go Well', 'Blocker/Impediment',
  'Action Item', 'Action Owner', 'Action Due Date', 'Action Priority (high/medium/low)',
];

function csv(rows: string[][]): Buffer {
  const text = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
  return Buffer.from(text, 'utf-8');
}

// TC-RETRO-08: groups consecutive rows into one record per sprint, carrying Sprint Name forward
test('TC-RETRO-08: carries Sprint Name forward across blank rows into grouped records', () => {
  const buffer = csv([
    HEADER,
    ['Sprint 1', 'Team A', '2026-06-01', 'yes', 'Goal A', 'Went well A', '', '', 'Action A', 'Owner A', '2026-06-08', 'high'],
    ['', '', '', '', '', 'Went well B', 'Didnt go well B', 'Blocker B', 'Action B', '', '', 'medium'],
    ['Sprint 2', 'Team A', '2026-06-15', 'no', 'Goal B', '', 'Didnt go well C', 'Blocker B', 'Action C', 'Owner C', '2026-06-22', 'low'],
  ]);

  const result = parseRetroFile(buffer, 'retro.csv');

  expect(result.records).toHaveLength(2);
  expect(result.records[0].sprintName).toBe('Sprint 1');
  expect(result.records[0].wentWell).toEqual(['Went well A', 'Went well B']);
  expect(result.records[0].didntGoWell).toEqual(['Didnt go well B']);
  expect(result.records[0].actions).toEqual([
    { text: 'Action A', owner: 'Owner A', dueDate: '2026-06-08', priority: 'high' },
    { text: 'Action B', owner: '', dueDate: '', priority: 'medium' },
  ]);
  expect(result.records[1].sprintName).toBe('Sprint 2');
  expect(result.records[1].goalMet).toBe('no');
});

// TC-RETRO-08b: a real binary .xlsx file (not text-based CSV) parses the same way
test('TC-RETRO-08b: parses a binary .xlsx workbook the same way as a CSV file', () => {
  const ws = XLSX.utils.aoa_to_sheet([HEADER, ['Sprint 1', 'Team A', '2026-06-01', 'yes', '', 'Went well A', '', '', '', '', '', '']]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Retrospective');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  const result = parseRetroFile(buffer, 'retro.xlsx');

  expect(result.records).toHaveLength(1);
  expect(result.records[0].sprintName).toBe('Sprint 1');
  expect(result.records[0].wentWell).toEqual(['Went well A']);
});

// TC-RETRO-09: missing required Sprint Name column
test('TC-RETRO-09: missing Sprint Name column produces a warning and no records', () => {
  const buffer = csv([
    ['Team Name', 'What Went Well'],
    ['Team A', 'Good teamwork'],
  ]);

  const result = parseRetroFile(buffer, 'retro.csv');

  expect(result.records).toHaveLength(0);
  expect(result.warnings[0]).toMatch(/Missing required column "Sprint Name"/);
});

// TC-RETRO-10: a row before any Sprint Name has appeared is skipped and recorded as a correction
test('TC-RETRO-10: row preceding any Sprint Name is skipped and logged as a correction', () => {
  const buffer = csv([
    HEADER,
    ['', '', '', '', '', '', '', '', 'Orphan action', '', '', ''],
    ['Sprint 1', '', '', '', '', '', '', '', '', '', '', ''],
  ]);

  const result = parseRetroFile(buffer, 'retro.csv');

  expect(result.records).toHaveLength(1);
  expect(result.corrections).toHaveLength(1);
  expect(result.corrections[0].field).toBe('Sprint Name');
  expect(result.corrections[0].severity).toBe('warning');
});

// TC-RETRO-11: a record with a Sprint Name but no observations/actions is flagged
test('TC-RETRO-11: Sprint Name with no observations or actions produces a warning', () => {
  const buffer = csv([
    HEADER,
    ['Sprint X', '', '', '', '', '', '', '', '', '', '', ''],
  ]);

  const result = parseRetroFile(buffer, 'retro.csv');

  expect(result.records).toHaveLength(1);
  expect(result.warnings.some(w => w.includes('Sprint X') && w.includes('no observations'))).toBe(true);
});

// TC-RETRO-12: Markdown heuristic parsing extracts sections and Sprint Name
test('TC-RETRO-12: parses a well-formed Markdown retrospective into one record', () => {
  const md = [
    'Sprint Name: Sprint 99',
    '',
    '## What Went Well',
    '- Great teamwork',
    '- Fast deploys',
    '',
    '## What Did Not Go Well',
    '- Too many meetings',
    '',
    '## Blockers',
    '- Waiting on infra',
    '',
    '## Action Items',
    '- Improve standup format',
  ].join('\n');

  const result = parseRetroFile(Buffer.from(md, 'utf-8'), 'retro.md');

  expect(result.records).toHaveLength(1);
  const record = result.records[0];
  expect(record.sprintName).toBe('Sprint 99');
  expect(record.wentWell).toEqual(['Great teamwork', 'Fast deploys']);
  expect(record.didntGoWell).toEqual(['Too many meetings']);
  expect(record.blockers).toEqual(['Waiting on infra']);
  expect(record.actions).toEqual([{ text: 'Improve standup format', owner: '', dueDate: '', priority: 'medium' }]);
  expect(result.warnings).toHaveLength(0);
});

// TC-RETRO-13: Markdown without a Sprint Name line falls back safely
test('TC-RETRO-13: Markdown without a Sprint Name line defaults to a safe title and warns', () => {
  const md = ['## What Went Well', '- Good standup'].join('\n');

  const result = parseRetroFile(Buffer.from(md, 'utf-8'), 'retro.txt');

  expect(result.records).toHaveLength(1);
  expect(result.records[0].sprintName).toBe('Untitled Retrospective');
  expect(result.warnings.length).toBeGreaterThan(0);
});
