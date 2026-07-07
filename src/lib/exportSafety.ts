// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.

const FORMULA_TRIGGER_CHARS = new Set(['=', '+', '-', '@', '\t', '\r']);

// OWASP CSV/Formula Injection guard, required by CLAUDE.md §38.5.
// Leading whitespace is intentionally left unchanged: Excel formula detection
// requires the trigger to be the actual first character, and trimming would
// silently alter legitimate exported data.
export function sanitizeSpreadsheetCell(value: unknown): unknown {
  if (typeof value !== 'string' || value.length === 0) return value;
  return FORMULA_TRIGGER_CHARS.has(value[0]) ? `'${value}` : value;
}

export function sanitizeSpreadsheetRow(row: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, sanitizeSpreadsheetCell(value)]),
  );
}

export function sanitizeSpreadsheetRows(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map(sanitizeSpreadsheetRow);
}

export function sanitizeSpreadsheetMatrix<T extends readonly unknown[]>(rows: T[]): unknown[][] {
  return rows.map(row => row.map(sanitizeSpreadsheetCell));
}

export function encodeSafeCsvCell(value: unknown, alwaysQuote = false): string {
  const text = String(sanitizeSpreadsheetCell(value) ?? '');
  const escaped = text.replace(/"/g, '""');
  return alwaysQuote || /[,"\n\r]/.test(text) ? `"${escaped}"` : escaped;
}

export function buildSafeCsv(rows: unknown[][], options: { alwaysQuote?: boolean } = {}): string {
  return rows
    .map(row => row.map(cell => encodeSafeCsvCell(cell, options.alwaysQuote)).join(','))
    .join('\n');
}
