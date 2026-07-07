// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Spreadsheet export safety tests — TC-SEC-CSV-01 to TC-SEC-CSV-07

import {
  buildSafeCsv,
  sanitizeSpreadsheetCell,
  sanitizeSpreadsheetMatrix,
  sanitizeSpreadsheetRow,
} from '../lib/exportSafety';

test.each([
  ['=SUM(A1)'],
  ['+HYPERLINK("http://evil.example","click")'],
  ['-10+20'],
  ['@SUM(A1)'],
  ['\t=SUM(A1)'],
  ['\r=SUM(A1)'],
])('TC-SEC-CSV-01: prefixes formula-triggering value %p', (value) => {
  expect(sanitizeSpreadsheetCell(value)).toBe(`'${value}`);
});

test('TC-SEC-CSV-02: leaves trigger characters away from position zero unchanged', () => {
  expect(sanitizeSpreadsheetCell('safe =SUM(A1)')).toBe('safe =SUM(A1)');
  expect(sanitizeSpreadsheetCell('release +1')).toBe('release +1');
});

test('TC-SEC-CSV-03: leaves non-string values unchanged', () => {
  const date = new Date('2026-07-07T00:00:00.000Z');
  expect(sanitizeSpreadsheetCell(42)).toBe(42);
  expect(sanitizeSpreadsheetCell(true)).toBe(true);
  expect(sanitizeSpreadsheetCell(null)).toBeNull();
  expect(sanitizeSpreadsheetCell(undefined)).toBeUndefined();
  expect(sanitizeSpreadsheetCell(date)).toBe(date);
});

test('TC-SEC-CSV-04: leaves empty strings unchanged', () => {
  expect(sanitizeSpreadsheetCell('')).toBe('');
});

test('TC-SEC-CSV-05: leaves leading-whitespace formulas unchanged', () => {
  expect(sanitizeSpreadsheetCell(' =SUM(A1)')).toBe(' =SUM(A1)');
});

test('TC-SEC-CSV-06: sanitizes object rows and matrix rows', () => {
  expect(sanitizeSpreadsheetRow({ Summary: '=cmd', Count: 1 })).toEqual({ Summary: "'=cmd", Count: 1 });
  expect(sanitizeSpreadsheetMatrix([['Header'], ['@cmd']])).toEqual([['Header'], ["'@cmd"]]);
});

test('TC-SEC-CSV-07: CSV helper sanitizes before quoting and escaping', () => {
  expect(buildSafeCsv([['Summary'], ['=cmd|\'/c calc\'!A1']], { alwaysQuote: true }))
    .toBe('"Summary"\n"\'=cmd|\'/c calc\'!A1"');
});
