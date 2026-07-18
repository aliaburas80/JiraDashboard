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

// A single labeled block within a "sectioned" CSV — used by pages that have
// no single primary table (e.g. a grid of independent chart widgets or a
// stakeholder report made of several distinct blocks) but still need a
// baseline CSV export (MPE-01). Each section renders as a title row, a
// header row, then its data rows, separated from the next section by a
// blank row.
export interface CsvExportSection {
  title: string;
  header: string[];
  rows: unknown[][];
}

export function buildSectionedCsv(sections: CsvExportSection[]): string {
  const matrix: unknown[][] = [];
  sections.forEach((section, i) => {
    if (i > 0) matrix.push([]);
    matrix.push([section.title]);
    matrix.push(section.header);
    matrix.push(...section.rows);
  });
  return buildSafeCsv(matrix, { alwaysQuote: true });
}
