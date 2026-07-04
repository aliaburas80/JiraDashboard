// Migrated from backend/src/services/parser.js
// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
import * as XLSX from 'xlsx';
import type { ColumnMappingResult, ColumnEntry, ColumnStatus } from '@/types/columnMapping';

export const ESSENTIAL_FIELDS: string[] = ['Issue Key', 'Issue Type', 'Summary', 'Status'];

export const OPTIONAL_FIELDS: string[] = [
  'Issue Key', 'Issue Type', 'Summary', 'Epic Link', 'Parent Key', 'Project',
  'Component', 'Team', 'Assignee', 'Reporter', 'Status', 'High Level Status',
  'Priority', 'Risk Level', 'Risk Description', 'Labels', 'Fix Version/s',
  'Sprint', 'Sprint Goal', 'Story Points', 'Original Estimate', 'Time Spent',
  'Remaining Estimate', 'Created Date', 'Updated Date', 'Sprint Start', 'Sprint End',
  'In Progress Date', 'Code Review Date', 'QA Start Date', 'Done Date', 'Due Date',
  'Resolution', 'Resolution Date', 'Reopened Count', 'Blocked Flag', 'Blocker Reason',
  'Commitment Type', 'Added After Sprint Start', 'Scope Change Type', 'QA Pass',
  'UAT Status', 'Defects Count', 'Customer Visible', 'Release Ready',
  'Acceptance Criteria Ready', 'Definition of Ready Met', 'Definition of Done Met',
  'Business Value', 'Effort Confidence', 'Planned Sprint', 'Actual Sprint',
  'Dependencies', 'Stakeholder Owner', 'Requirement Stability', 'Risk Score',
  'Last Comment', 'Issue URL'
];

export const EXPECTED_FIELDS: string[] = [...new Set([...ESSENTIAL_FIELDS, ...OPTIONAL_FIELDS])];

export const FIELD_ALIASES: Record<string, string> = {
  'issue key': 'Issue Key',
  'issue type': 'Issue Type',
  summary: 'Summary',
  status: 'Status',
  'project name': 'Project',
  'project key': 'Project',
  'custom field (team)': 'Team',
  assignee: 'Assignee',
  reporter: 'Reporter',
  'status category': 'High Level Status',
  priority: 'Priority',
  labels: 'Labels',
  resolution: 'Resolution',
  'original estimate': 'Original Estimate',
  'remaining estimate': 'Remaining Estimate',
  'time spent': 'Time Spent',
  created: 'Created Date',
  updated: 'Updated Date',
  resolved: 'Resolution Date',
  'due date': 'Due Date',
  parent: 'Parent Key',
  'parent key': 'Parent Key',
  comment: 'Last Comment',
  'custom field (epic link)': 'Epic Link',
  'custom field (epic name)': 'Epic Link',
  'custom field (story points)': 'Story Points',
  'custom field (story point estimate)': 'Story Points',
  'custom field (start date)': 'Sprint Start',
  'custom field (target start)': 'Sprint Start',
  'custom field (target end)': 'Sprint End',
  'custom field (actual start)': 'In Progress Date',
  'custom field (actual end)': 'Done Date',
};

const normalizeHeader = (key: string): string =>
  String(key).replace(/^﻿/, '').trim();

const canonicalizeHeader = (key: string): string => {
  const normalizedKey = normalizeHeader(key);
  const aliasKey = normalizedKey.toLowerCase().replace(/\s+/g, ' ');
  return FIELD_ALIASES[aliasKey] || normalizedKey;
};

const normalizeRow = (row: Record<string, unknown>): Record<string, unknown> => {
  return Object.keys(row).reduce<Record<string, unknown>>((acc, key) => {
    const normalizedKey = canonicalizeHeader(key);
    if (acc[normalizedKey] === undefined || acc[normalizedKey] === '') {
      acc[normalizedKey] = row[key];
    }
    return acc;
  }, {});
};

// Fields that significantly affect dashboard quality
const IMPORTANT_FIELDS = [
  'In Progress Date', 'Done Date', 'Resolution Date', 'Story Points',
  'Sprint', 'Epic Link', 'Created Date', 'Sprint Start', 'Sprint End',
  'Assignee', 'Fix Version/s',
];

export function buildColumnMapping(
  rawHeaders: string[],
  canonicalHeaders: string[],
  sheetName: string,
): ColumnMappingResult {
  const knownCanonical = new Set(OPTIONAL_FIELDS);
  const columns: ColumnEntry[] = [];

  rawHeaders.forEach((original, i) => {
    const canonical = canonicalHeaders[i] ?? original;
    const wasAliased = original !== canonical && FIELD_ALIASES[normalizeHeader(original).toLowerCase().replace(/\s+/g, ' ')] !== undefined;
    const isKnown    = knownCanonical.has(canonical);

    let status: ColumnStatus;
    if (!isKnown)    status = 'unrecognised';
    else if (wasAliased) status = 'aliased';
    else                 status = 'mapped';

    columns.push({
      original,
      canonical,
      status,
      isEssential:  ESSENTIAL_FIELDS.includes(canonical),
      isImportant:  IMPORTANT_FIELDS.includes(canonical),
    });
  });

  // Missing fields
  const presentCanonical = new Set(canonicalHeaders);
  const missingEssential = ESSENTIAL_FIELDS.filter(f => !presentCanonical.has(f));
  const missingImportant = IMPORTANT_FIELDS.filter(f => !presentCanonical.has(f));

  const totalMapped      = columns.filter(c => c.status === 'mapped').length;
  const totalAliased     = columns.filter(c => c.status === 'aliased').length;
  const totalUnrecognised = columns.filter(c => c.status === 'unrecognised').length;

  // Score: penalise missing essentials heavily, missing importants moderately
  const essentialScore = missingEssential.length === 0 ? 40 : Math.max(0, 40 - missingEssential.length * 10);
  const importantScore = Math.max(0, 40 - missingImportant.length * 3);
  const recognitionScore = rawHeaders.length > 0
    ? Math.round(((totalMapped + totalAliased) / rawHeaders.length) * 20)
    : 20;
  const mappingScore = Math.min(100, essentialScore + importantScore + recognitionScore);

  return {
    totalInFile:      rawHeaders.length,
    totalMapped,
    totalAliased,
    totalUnrecognised,
    missingEssential,
    missingImportant,
    columns,
    mappingScore,
    sheetName,
  };
}

export function parseJiraFile(file: { buffer: Buffer; originalname: string }): {
  issues: Record<string, unknown>[];
  warnings: string[];
  headers: string[];
  rawHeaders: string[];
  sheetName: string;
  columnMapping: ColumnMappingResult;
} {
  const buffer   = file.buffer;
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawRows   = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

  // Capture raw (pre-alias) headers
  const rawHeaders   = Object.keys(rawRows[0] || {}).map(normalizeHeader);
  const issues       = rawRows.map(normalizeRow);
  const headers      = Object.keys(issues[0] || {});
  const warnings: string[] = [];

  const missingOptionalFields = OPTIONAL_FIELDS.filter(
    (field) => !ESSENTIAL_FIELDS.includes(field) && !headers.includes(field)
  );
  if (missingOptionalFields.length) {
    warnings.push(`Missing optional fields: ${missingOptionalFields.join(', ')}`);
  }

  const columnMapping = buildColumnMapping(rawHeaders, headers, sheetName);

  return { issues, warnings, headers, rawHeaders, sheetName, columnMapping };
}
