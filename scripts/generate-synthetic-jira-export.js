#!/usr/bin/env node
// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// P0A-09: synthetic Jira export generator for performance benchmarking.
// The committed public/samples/sample-jira-export.csv is only 35 issues —
// nowhere near the 3,000-7,000 issue scale CLAUDE.md §40 wants performance
// measured at. This produces a CSV matching the real column contract
// (src/services/jira/parser.ts's ESSENTIAL_FIELDS/OPTIONAL_FIELDS) with
// realistic variety (multiple sprints/types/statuses, some blocked/orphaned
// issues, some missing optional fields) rather than uniform rows, so it
// exercises the real code paths instead of a degenerate best case.
//
// Usage:
//   node scripts/generate-synthetic-jira-export.js --rows=5000 --out=data/synthetic-jira-export.csv --seed=1
//
// See product/PERFORMANCE.md for how this is used in the benchmark.
// Plain CommonJS (not .mjs) so both `node` (no "type": "module" in
// package.json) and Jest (via ts-jest's existing allowJs transform) can load
// it directly — buildRows()/rowsToCsv() are reused by
// src/__tests__/syntheticJiraGenerator.test.ts.

const { writeFileSync, mkdirSync } = require('node:fs');
const { dirname } = require('node:path');

const HEADER = [
  'Issue Key', 'Issue Type', 'Summary', 'Status', 'Assignee', 'Priority',
  'Story Points', 'Sprint', 'Sprint Start', 'Sprint End', 'In Progress Date',
  'Done Date', 'Created Date', 'Epic Link', 'Parent Key', 'Fix Version/s',
  'Labels', 'Blocked Flag',
];

const ASSIGNEES = [
  'Ali Abu Ras', 'Sara Ahmed', 'Ahmed Nasser', 'Layla Hassan', 'Omar Khalid',
  'Nour Ibrahim', 'Yousef Saleh', 'Mona Farid', 'Khalid Sami', 'Rana Adel',
];
const PRIORITIES = ['Low', 'Medium', 'Medium', 'High', 'High', 'Critical'];
const STORY_POINTS = [1, 2, 3, 5, 8, 13];
const FIX_VERSIONS = ['v1.0', 'v1.1', 'v1.2', 'v2.0', 'v2.1'];
const LABEL_POOL = ['frontend', 'backend', 'api', 'ui', 'tech-debt', 'export', 'auth', 'dashboard', 'performance'];
const NON_EPIC_TYPES = ['Story', 'Story', 'Story', 'Bug', 'Bug', 'Task', 'Task'];
// Weighted toward a "mostly-complete project" shape rather than uniform.
const STATUSES = [
  'Done', 'Done', 'Done', 'Done', 'Done',
  'In Progress', 'In Progress',
  'To Do',
  'Backlog',
];

/** Deterministic PRNG (mulberry32) so --seed reproduces the same dataset. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function addDays(date, days) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/** Formats a Date as Jira's DD/Mon/YYYY — matches parseDate()'s regex in metrics.service.ts. */
function formatJiraDate(date) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${dd}/${months[date.getUTCMonth()]}/${date.getUTCFullYear()}`;
}

function buildSprints(rng, count) {
  const sprintCount = Math.min(25, Math.max(15, Math.round(count / 250)));
  const sprints = [];
  let cursor = new Date(Date.UTC(2025, 0, 1));
  for (let i = 1; i <= sprintCount; i++) {
    const start = cursor;
    const end = addDays(start, 13);
    sprints.push({ name: `Sprint ${i}`, start, end });
    cursor = addDays(end, 1);
  }
  return sprints;
}

function csvEscape(value) {
  const s = String(value ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Builds `count` synthetic rows (plain objects keyed by the CSV header
 * names). Pure function — used by both the CLI entry point below and
 * src/__tests__/syntheticJiraGenerator.test.ts.
 */
function buildRows(count, seed = 1) {
  const rng = mulberry32(seed);
  const sprints = buildSprints(rng, count);
  const epicCount = Math.max(5, Math.round(count * 0.01));

  const epics = [];
  const rows = [];
  let issueNum = 0;

  for (let i = 0; i < epicCount; i++) {
    issueNum += 1;
    const key = `SYN-${issueNum}`;
    epics.push(key);
    const created = addDays(sprints[0].start, -Math.floor(rng() * 10));
    rows.push({
      'Issue Key': key,
      'Issue Type': 'Epic',
      Summary: `Epic ${i + 1}: ${pick(rng, LABEL_POOL)} initiative`,
      Status: pick(rng, ['Done', 'In Progress', 'To Do']),
      Assignee: pick(rng, ASSIGNEES),
      Priority: pick(rng, PRIORITIES),
      'Story Points': '',
      Sprint: '',
      'Sprint Start': '',
      'Sprint End': '',
      'In Progress Date': formatJiraDate(created),
      'Done Date': '',
      'Created Date': formatJiraDate(created),
      'Epic Link': '',
      'Parent Key': '',
      'Fix Version/s': pick(rng, FIX_VERSIONS),
      Labels: pick(rng, LABEL_POOL),
      'Blocked Flag': '',
    });
  }

  const remaining = count - epicCount;
  for (let i = 0; i < remaining; i++) {
    issueNum += 1;
    const key = `SYN-${issueNum}`;
    const type = pick(rng, NON_EPIC_TYPES);
    const status = pick(rng, STATUSES);
    const sprint = status === 'Backlog' ? null : pick(rng, sprints);
    const created = sprint ? addDays(sprint.start, -Math.floor(rng() * 5)) : addDays(sprints[0].start, -Math.floor(rng() * 10));

    let inProgressDate = '';
    let doneDate = '';
    if (status === 'In Progress' || status === 'Done' || status === 'Blocked') {
      const ip = addDays(created, 1 + Math.floor(rng() * 3));
      inProgressDate = formatJiraDate(ip);
      if (status === 'Done') {
        doneDate = formatJiraDate(addDays(ip, 1 + Math.floor(rng() * 8)));
      }
    }

    // ~3-5% orphans: no Epic Link at all on a non-Epic issue.
    const isOrphan = rng() < 0.04;
    // ~5-10% blocked, only among non-Done issues.
    const isBlocked = status !== 'Done' && rng() < 0.08;

    rows.push({
      'Issue Key': key,
      'Issue Type': type,
      Summary: `${type} ${issueNum}: ${pick(rng, LABEL_POOL)} work item`,
      Status: isBlocked ? 'Blocked' : status,
      Assignee: rng() < 0.05 ? '' : pick(rng, ASSIGNEES),
      Priority: pick(rng, PRIORITIES),
      'Story Points': type === 'Epic' || rng() < 0.1 ? '' : pick(rng, STORY_POINTS),
      Sprint: sprint ? sprint.name : '',
      'Sprint Start': sprint ? formatJiraDate(sprint.start) : '',
      'Sprint End': sprint ? formatJiraDate(sprint.end) : '',
      'In Progress Date': inProgressDate,
      'Done Date': doneDate,
      'Created Date': formatJiraDate(created),
      'Epic Link': isOrphan ? '' : pick(rng, epics),
      'Parent Key': '',
      'Fix Version/s': rng() < 0.3 ? '' : pick(rng, FIX_VERSIONS),
      Labels: rng() < 0.4 ? '' : pick(rng, LABEL_POOL),
      'Blocked Flag': isBlocked ? 'true' : '',
    });
  }

  return rows;
}

function rowsToCsv(rows) {
  const lines = [HEADER.join(',')];
  for (const row of rows) {
    lines.push(HEADER.map(col => csvEscape(row[col])).join(','));
  }
  return lines.join('\n') + '\n';
}

function parseArgs(argv) {
  const args = { rows: 5000, out: 'data/synthetic-jira-export.csv', seed: 1 };
  for (const arg of argv) {
    const match = arg.match(/^--(\w+)=(.+)$/);
    if (!match) continue;
    const [, key, value] = match;
    if (key === 'rows' || key === 'seed') args[key] = Number(value);
    else if (key === 'out') args[key] = value;
  }
  return args;
}

function main() {
  const { rows, out, seed } = parseArgs(process.argv.slice(2));
  if (!Number.isFinite(rows) || rows < 1) {
    console.error('--rows must be a positive number');
    process.exit(1);
  }
  if (rows < 1000 || rows > 20000) {
    console.warn(`[generate-synthetic-jira-export] --rows=${rows} is outside the typical 1,000-20,000 range — proceeding anyway.`);
  }

  const data = buildRows(rows, seed);
  const csv = rowsToCsv(data);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, csv, 'utf8');
  console.log(`[generate-synthetic-jira-export] wrote ${data.length} rows to ${out}`);
}

module.exports = { buildRows, rowsToCsv };

if (require.main === module) {
  main();
}
