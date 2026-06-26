// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
//
// Retrospective file parser — RETRO-04 to RETRO-07. Supports CSV/XLSX/XLS
// (column-based, one row per observation/action, Sprint Name carried
// forward across blank rows the way the existing CSV template is shaped)
// and Markdown/plain text (heading + bullet heuristic, one record per file).

import * as XLSX from 'xlsx';
import type { RetroRecord, ActionPriority, RetroDataCorrection } from '@/types/retrospective';

export const REQUIRED_RETRO_FIELD = 'Sprint Name';
export const OBSERVATION_FIELDS = [
  'What Went Well', 'What Did Not Go Well', 'Blocker', 'Action Item',
];

const HEADER_ALIASES: Record<string, string> = {
  'sprint name': 'Sprint Name',
  'team name': 'Team Name',
  date: 'Retro Date',
  'retro date': 'Retro Date',
  'sprint goal met': 'Sprint Goal Met',
  'sprint goal met (yes/no/partial)': 'Sprint Goal Met',
  'sprint goal': 'Sprint Goal',
  'what went well': 'What Went Well',
  'what did not go well': 'What Did Not Go Well',
  blockers: 'Blocker',
  'blocker/impediment': 'Blocker',
  'root cause': 'Root Cause',
  'action item': 'Action Item',
  owner: 'Action Owner',
  'action owner': 'Action Owner',
  'due date': 'Action Due Date',
  'action due date': 'Action Due Date',
  priority: 'Action Priority',
  'action priority': 'Action Priority',
  'action priority (high/medium/low)': 'Action Priority',
  category: 'Category',
  status: 'Status',
  notes: 'Notes',
};

function normalizeHeader(key: string): string {
  return String(key).replace(/^﻿/, '').trim();
}

function canonicalizeHeader(key: string): string {
  const normalized = normalizeHeader(key);
  return HEADER_ALIASES[normalized.toLowerCase()] ?? normalized;
}

function normalizeRow(row: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of Object.keys(row)) {
    const canonical = canonicalizeHeader(key);
    const value = String(row[key] ?? '').trim();
    if (out[canonical] === undefined || out[canonical] === '') out[canonical] = value;
  }
  return out;
}

function emptyRecord(): RetroRecord {
  return {
    sprintName: '', teamName: '', retroDate: '', goalMet: '', sprintGoal: '',
    wentWell: [], didntGoWell: [], blockers: [], actions: [],
  };
}

function normalizePriority(value: string): ActionPriority {
  const v = value.trim().toLowerCase();
  if (v === 'high' || v === 'h') return 'high';
  if (v === 'low' || v === 'l') return 'low';
  return 'medium';
}

// Groups consecutive rows into one record per sprint — a blank "Sprint Name"
// cell carries forward the previous row's sprint context, matching the shape
// of the existing downloadable CSV template.
function groupRowsIntoRecords(rows: Record<string, string>[]): { records: RetroRecord[]; corrections: RetroDataCorrection[] } {
  const records: RetroRecord[] = [];
  const corrections: RetroDataCorrection[] = [];
  let current: RetroRecord | null = null;

  rows.forEach((row, index) => {
    const sprintName = row['Sprint Name'];
    if (sprintName) {
      current = emptyRecord();
      current.sprintName = sprintName;
      current.teamName   = row['Team Name'] ?? '';
      current.retroDate  = row['Retro Date'] ?? '';
      current.sprintGoal = row['Sprint Goal'] ?? '';
      const goalRaw = (row['Sprint Goal Met'] ?? '').trim().toLowerCase();
      current.goalMet = goalRaw === 'yes' || goalRaw === 'partial' || goalRaw === 'no' ? goalRaw : '';
      records.push(current);
    }

    if (!current) {
      corrections.push({
        field: 'Sprint Name', originalValue: sprintName, reason: `Row ${index + 1} has no Sprint Name and no prior sprint to carry forward — row skipped.`, severity: 'warning',
      });
      return;
    }

    if (row['What Went Well'])      current.wentWell.push(row['What Went Well']);
    if (row['What Did Not Go Well']) current.didntGoWell.push(row['What Did Not Go Well']);
    if (row['Blocker'])             current.blockers.push(row['Blocker']);
    if (row['Action Item']) {
      current.actions.push({
        text: row['Action Item'],
        owner: row['Action Owner'] ?? '',
        dueDate: row['Action Due Date'] ?? '',
        priority: normalizePriority(row['Action Priority'] ?? ''),
      });
    }
  });

  return { records, corrections };
}

function validateRecords(records: RetroRecord[]): string[] {
  const warnings: string[] = [];
  records.forEach((r) => {
    const hasObservation = r.wentWell.length || r.didntGoWell.length || r.blockers.length || r.actions.length;
    if (!hasObservation) {
      warnings.push(`Sprint "${r.sprintName}" has a Sprint Name but no observations or action items.`);
    }
  });
  return warnings;
}

// ── Markdown / plain-text heuristic parser ──────────────────────────────────
// One record per file. Recognises headings (markdown "#"/"##" or a line
// ending in ":") matching the four known sections; bullet lines ("-", "*",
// numbered) under a heading become entries in that section.
const SECTION_MATCHERS: { test: RegExp; field: keyof Pick<RetroRecord, 'wentWell' | 'didntGoWell' | 'blockers'> | 'actions' }[] = [
  { test: /went well/i, field: 'wentWell' },
  { test: /did(n.?t| not) go well|didn.?t go well|went wrong/i, field: 'didntGoWell' },
  { test: /blocker|impediment/i, field: 'blockers' },
  { test: /action item|next step/i, field: 'actions' },
];

function parsePlainTextRetro(text: string): { records: RetroRecord[]; warnings: string[] } {
  const record = emptyRecord();
  const lines = text.split(/\r?\n/);
  let activeField: typeof SECTION_MATCHERS[number]['field'] | null = null;
  const sprintNameMatch = text.match(/sprint\s*(?:name)?\s*[:#]\s*(.+)/i);
  if (sprintNameMatch) record.sprintName = sprintNameMatch[1].trim();

  for (const rawLine of lines) {
    const line = rawLine.replace(/^#+\s*/, '').trim();
    if (!line) continue;

    const heading = SECTION_MATCHERS.find(m => m.test.test(line) && line.length < 60 && (rawLine.startsWith('#') || line.endsWith(':')));
    if (heading) { activeField = heading.field; continue; }

    const bullet = line.match(/^(?:[-*•]|\d+[.)])\s*(.+)/);
    if (bullet && activeField) {
      const value = bullet[1].trim();
      if (activeField === 'actions') record.actions.push({ text: value, owner: '', dueDate: '', priority: 'medium' });
      else record[activeField].push(value);
    }
  }

  const warnings: string[] = [];
  if (!record.sprintName) {
    record.sprintName = 'Untitled Retrospective';
    warnings.push('No "Sprint Name:" line found — defaulted to "Untitled Retrospective". Markdown/plain-text parsing is heuristic; verify the preview before relying on it.');
  }
  return { records: [record], warnings };
}

// Minimal RFC4180 CSV parser — used instead of XLSX.read() for .csv files.
// XLSX.read() auto-detects date-like strings (e.g. "2026-06-08") in CSV input
// and silently reformats them to a locale date string, corrupting user data.
// XLSX.read() is still used for true binary .xlsx/.xls files below, where its
// date-cell handling is correct because the cell type is actually stored.
function parseCsvText(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else field += char;
      continue;
    }
    if (char === '"') { inQuotes = true; continue; }
    if (char === ',') { row.push(field); field = ''; continue; }
    if (char === '\r') continue;
    if (char === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue; }
    field += char;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }

  const nonEmpty = rows.filter((r) => r.some((c) => c.trim() !== ''));
  if (!nonEmpty.length) return [];

  const headerRow = nonEmpty[0];
  return nonEmpty.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    headerRow.forEach((h, i) => { obj[h] = r[i] ?? ''; });
    return obj;
  });
}

export interface RetroParseResult {
  records:     RetroRecord[];
  warnings:    string[];
  corrections: RetroDataCorrection[];
}

export function parseRetroFile(buffer: Buffer, filename: string): RetroParseResult {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();

  if (ext === '.md' || ext === '.txt') {
    const { records, warnings } = parsePlainTextRetro(buffer.toString('utf-8'));
    return { records, warnings, corrections: [] };
  }

  const rawRows: Record<string, unknown>[] = ext === '.csv'
    ? parseCsvText(buffer.toString('utf-8'))
    : (() => {
        const workbook  = XLSX.read(buffer, { type: 'buffer' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        return XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });
      })();

  if (!rawRows.length) {
    return { records: [], warnings: ['File contains no rows.'], corrections: [] };
  }

  const headers = Object.keys(rawRows[0]).map(canonicalizeHeader);
  if (!headers.includes(REQUIRED_RETRO_FIELD)) {
    return {
      records: [],
      warnings: [`Missing required column "${REQUIRED_RETRO_FIELD}". Expected headers include: ${OBSERVATION_FIELDS.join(', ')}.`],
      corrections: [],
    };
  }

  const normalizedRows = rawRows.map(normalizeRow);
  const { records, corrections } = groupRowsIntoRecords(normalizedRows);
  const warnings = validateRecords(records);

  if (!records.length) {
    warnings.unshift(`No rows had a value in "${REQUIRED_RETRO_FIELD}" — nothing could be imported.`);
  }

  return { records, warnings, corrections };
}
