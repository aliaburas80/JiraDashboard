// @ts-nocheck
// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';

// ---------------------------------------------------------------------------
// Path constants
// ---------------------------------------------------------------------------

const LOG_DIR = path.join(process.cwd(), 'data');
const LOG_FILE = path.join(LOG_DIR, 'import-logs.json');

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

export interface CountItem {
  name: string;
  count: number;
}

export interface QuarterRow {
  quarter: string;
  issues: number;
  doneIssues: number;
  activeIssues: number;
  completionRate: number;
  averageLeadTimeDays: number;
  averageCycleTimeDays: number;
  critical: number;
  warning: number;
}

export interface ImportLog {
  id: string;
  importedAt: string;
  status: 'success' | 'validation_failed' | 'failed';
  file: {
    name: string;
    sizeBytes: number;
    mimetype: string;
  };
  extraction: {
    sheetName: string;
    rowCount: number;
    columnCount: number;
    headers: string[];
    missingOptionalWarnings: string[];
    validationErrors: string[];
    error: string;
  };
  statistics: {
    totalIssues: number;
    doneIssues: number;
    activeIssues: number;
    completionRate: number;
    averageLeadTimeDays: number;
    averageCycleTimeDays: number;
    criticalItems: number;
    warningItems: number;
    statusBreakdown: CountItem[];
    issueTypeBreakdown: CountItem[];
    assigneeBreakdown: CountItem[];
    projectBreakdown: CountItem[];
    quarters: QuarterRow[];
  };
}

interface BuildImportLogInput {
  file?: { originalname?: string; size?: number; mimetype?: string };
  parseResult?: {
    issues?: Record<string, unknown>[];
    headers?: string[];
    sheetName?: string;
    warnings?: string[];
  };
  validation?: { errors?: string[] };
  metrics?: {
    totalIssues?: number;
    doneIssues?: number;
    activeIssues?: number;
    completionRate?: number;
    flow?: {
      averageLeadTimeDays?: number;
      averageCycleTimeDays?: number;
      critical?: number;
      warning?: number;
    };
    quarters?: QuarterRow[];
  };
  status: ImportLog['status'];
  error?: string;
}

interface AggregateStats {
  importCount: number;
  successCount: number;
  latestImport: string;
  totalRows: number;
  totalIssues: number;
  totalCritical: number;
}

// ---------------------------------------------------------------------------
// File helpers
// ---------------------------------------------------------------------------

function ensureLogFile(): void {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
  if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, '[]', 'utf8');
  }
}

export function readImportLogs(): ImportLog[] {
  ensureLogFile();
  try {
    return JSON.parse(fs.readFileSync(LOG_FILE, 'utf8')) as ImportLog[];
  } catch {
    return [];
  }
}

function writeImportLogs(logs: ImportLog[]): void {
  ensureLogFile();
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2), 'utf8');
}

// ---------------------------------------------------------------------------
// Count helpers
// ---------------------------------------------------------------------------

function countBy(issues: Record<string, unknown>[], field: string): Record<string, number> {
  return issues.reduce<Record<string, number>>((counts, issue) => {
    const value = (issue[field] as string) || 'Unassigned';
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function topCounts(counts: Record<string, number>, limit = 8): CountItem[] {
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Build / append
// ---------------------------------------------------------------------------

export function buildImportLog({
  file,
  parseResult,
  validation,
  metrics,
  status,
  error,
}: BuildImportLogInput): ImportLog {
  const issues = parseResult?.issues ?? [];
  const headers = parseResult?.headers ?? [];

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    importedAt: new Date().toISOString(),
    status,
    file: {
      name: file?.originalname ?? 'unknown',
      sizeBytes: file?.size ?? 0,
      mimetype: file?.mimetype ?? '',
    },
    extraction: {
      sheetName: parseResult?.sheetName ?? '',
      rowCount: issues.length,
      columnCount: headers.length,
      headers,
      missingOptionalWarnings: parseResult?.warnings ?? [],
      validationErrors: validation?.errors ?? [],
      error: error ?? '',
    },
    statistics: {
      totalIssues: metrics?.totalIssues ?? issues.length,
      doneIssues: metrics?.doneIssues ?? 0,
      activeIssues: metrics?.activeIssues ?? 0,
      completionRate: metrics?.completionRate ?? 0,
      averageLeadTimeDays: metrics?.flow?.averageLeadTimeDays ?? 0,
      averageCycleTimeDays: metrics?.flow?.averageCycleTimeDays ?? 0,
      criticalItems: metrics?.flow?.critical ?? 0,
      warningItems: metrics?.flow?.warning ?? 0,
      statusBreakdown: topCounts(countBy(issues, 'Status')),
      issueTypeBreakdown: topCounts(countBy(issues, 'Issue Type')),
      assigneeBreakdown: topCounts(countBy(issues, 'Assignee')),
      projectBreakdown: topCounts(countBy(issues, 'Project')),
      quarters: metrics?.quarters ?? [],
    },
  };
}

export function appendImportLog(log: ImportLog): ImportLog {
  const logs = readImportLogs();
  logs.unshift(log);
  writeImportLogs(logs.slice(0, 200));
  return log;
}

// ---------------------------------------------------------------------------
// Aggregate stats
// ---------------------------------------------------------------------------

function flattenCounts(items: CountItem[] = []): string {
  return items.map((item) => `${item.name}: ${item.count}`).join('; ');
}

function getAggregateStats(logs: ImportLog[]): AggregateStats {
  const successfulLogs = logs.filter((log) => log.status === 'success');
  const latest = logs[0];
  const totalRows = successfulLogs.reduce((total, log) => total + (log.extraction.rowCount ?? 0), 0);
  const totalIssues = successfulLogs.reduce((total, log) => total + (log.statistics.totalIssues ?? 0), 0);
  const totalCritical = successfulLogs.reduce((total, log) => total + (log.statistics.criticalItems ?? 0), 0);

  return {
    importCount: logs.length,
    successCount: successfulLogs.length,
    latestImport: latest ? new Date(latest.importedAt).toLocaleString() : 'No imports yet',
    totalRows,
    totalIssues,
    totalCritical,
  };
}

// ---------------------------------------------------------------------------
// HTML rendering helpers
// ---------------------------------------------------------------------------

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderCountBars(items: CountItem[] = [], className = ''): string {
  if (!items.length) {
    return '<p class="muted">No data</p>';
  }

  const maxCount = Math.max(...items.map((item) => item.count), 1);

  return items
    .map(
      (item) => `
    <div class="bar-row ${className}">
      <span>${escapeHtml(item.name)}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${(item.count / maxCount) * 100}%"></div></div>
      <strong>${escapeHtml(item.count)}</strong>
    </div>
  `,
    )
    .join('');
}

function renderQuarterRows(quarters: QuarterRow[] = []): string {
  if (!quarters.length) {
    return '<tr><td colspan="8">No quarter data</td></tr>';
  }

  return quarters
    .map(
      (quarter) => `
    <tr>
      <td>${escapeHtml(quarter.quarter)}</td>
      <td>${escapeHtml(quarter.issues)}</td>
      <td>${escapeHtml(quarter.doneIssues)}</td>
      <td>${escapeHtml(quarter.activeIssues)}</td>
      <td>${escapeHtml(quarter.completionRate)}%</td>
      <td>${escapeHtml(quarter.averageLeadTimeDays)}d</td>
      <td>${escapeHtml(quarter.averageCycleTimeDays)}d</td>
      <td>${escapeHtml(quarter.critical)} critical / ${escapeHtml(quarter.warning)} warning</td>
    </tr>
  `,
    )
    .join('');
}

// ---------------------------------------------------------------------------
// renderImportLogView
// ---------------------------------------------------------------------------

export function renderImportLogView(logs: ImportLog[]): string {
  const stats = getAggregateStats(logs);

  const logCards = logs
    .map(
      (log) => `
    <article class="log-card">
      <div class="log-head">
        <div>
          <h2>${escapeHtml(log.file.name)}</h2>
          <p>${escapeHtml(new Date(log.importedAt).toLocaleString())} · ${escapeHtml(log.extraction.rowCount)} rows · ${escapeHtml(log.extraction.columnCount)} columns</p>
        </div>
        <span class="status ${escapeHtml(log.status)}">${escapeHtml(log.status)}</span>
      </div>

      <section class="metric-grid">
        <div><strong>${escapeHtml(log.statistics.totalIssues)}</strong><span>Total issues</span></div>
        <div><strong>${escapeHtml(log.statistics.doneIssues)}</strong><span>Done</span></div>
        <div><strong>${escapeHtml(log.statistics.activeIssues)}</strong><span>Active</span></div>
        <div><strong>${escapeHtml(log.statistics.completionRate)}%</strong><span>Completion</span></div>
        <div><strong>${escapeHtml(log.statistics.averageLeadTimeDays)}d</strong><span>Lead time</span></div>
        <div><strong>${escapeHtml(log.statistics.averageCycleTimeDays)}d</strong><span>Cycle time</span></div>
        <div><strong>${escapeHtml(log.statistics.criticalItems)}</strong><span>Critical</span></div>
        <div><strong>${escapeHtml(log.statistics.warningItems)}</strong><span>Warning</span></div>
      </section>

      <section class="log-columns">
        <div>
          <h3>Status Breakdown</h3>
          ${renderCountBars(log.statistics.statusBreakdown)}
        </div>
        <div>
          <h3>Issue Types</h3>
          ${renderCountBars(log.statistics.issueTypeBreakdown)}
        </div>
        <div>
          <h3>Assignees</h3>
          ${renderCountBars(log.statistics.assigneeBreakdown)}
        </div>
      </section>

      <details>
        <summary>Extracted data and quarter statistics</summary>
        <div class="details-grid">
          <div>
            <h3>Extracted Headers</h3>
            <p class="chips">${(log.extraction.headers ?? []).map((header) => `<span>${escapeHtml(header)}</span>`).join('')}</p>
          </div>
          <div>
            <h3>Warnings / Errors</h3>
            <p class="muted">${escapeHtml(
              [
                ...(log.extraction.missingOptionalWarnings ?? []),
                ...(log.extraction.validationErrors ?? []),
                log.extraction.error,
              ]
                .filter(Boolean)
                .join(' | ') || 'None',
            )}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Quarter</th>
              <th>Issues</th>
              <th>Done</th>
              <th>Active</th>
              <th>Completion</th>
              <th>Lead</th>
              <th>Cycle</th>
              <th>Health</th>
            </tr>
          </thead>
          <tbody>${renderQuarterRows(log.statistics.quarters)}</tbody>
        </table>
      </details>
    </article>
  `,
    )
    .join('');

  const content = `
    <section class="summary-grid">
      <div class="summary-card"><strong>${escapeHtml(stats.importCount)}</strong><span>Total imports</span></div>
      <div class="summary-card"><strong>${escapeHtml(stats.successCount)}</strong><span>Successful imports</span></div>
      <div class="summary-card"><strong>${escapeHtml(stats.totalRows)}</strong><span>Rows extracted</span></div>
      <div class="summary-card"><strong>${escapeHtml(stats.totalIssues)}</strong><span>Issues analyzed</span></div>
      <div class="summary-card"><strong>${escapeHtml(stats.totalCritical)}</strong><span>Critical items</span></div>
      <div class="summary-card"><strong>${escapeHtml(stats.latestImport)}</strong><span>Latest import</span></div>
    </section>

    ${logCards || '<section class="log-card"><h2>No imports yet</h2><p class="muted">Upload a Jira file to create the first log.</p></section>'}
  `;

  // Inline shell render (backendView is JS-only; shell markup reproduced here)
  const navItems: Array<{ id: string; label: string; href: string }> = [
    { id: 'home', label: 'Home', href: '/' },
    { id: 'logs', label: 'Import Logs', href: '/api/upload/logs/view' },
    { id: 'json', label: 'JSON Logs', href: '/api/upload/logs' },
    { id: 'export', label: 'Export Excel', href: '/api/upload/logs/export' },
    { id: 'health', label: 'Health', href: '/api/health' },
    { id: 'developer', label: 'Developer Wiki', href: '/developer' },
    { id: 'frontend', label: 'Frontend', href: 'http://localhost:3000' },
  ];

  const active = 'logs';
  const title = 'Jira Import Logs';
  const subtitle =
    'Visual backend view of uploaded files, extracted fields, import process, and stored statistics.';
  const actions =
    '<a class="button" href="/api/upload/logs/export">Export Excel</a><a class="button secondary" href="/api/upload/logs">View JSON</a>';

  const nav = navItems
    .map(
      (item) =>
        `<a href="${escapeHtml(item.href)}" class="${item.id === active ? 'active' : ''}">${escapeHtml(item.label)}</a>`,
    )
    .join('');

  return `<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(title)}</title>
      </head>
      <body>
        <div class="layout">
          <aside>
            <div class="brand"><strong>Jira Dashboard</strong><span>Backend</span></div>
            <nav>${nav}</nav>
          </aside>
          <main>
            <div class="topbar">
              <div>
                <h1>${escapeHtml(title)}</h1>
                <p class="muted">${escapeHtml(subtitle)}</p>
              </div>
              <div class="actions">${actions}</div>
            </div>
            ${content}
          </main>
        </div>
      </body>
    </html>`;
}

// ---------------------------------------------------------------------------
// exportImportLogsWorkbook
// ---------------------------------------------------------------------------

export function exportImportLogsWorkbook(logs: ImportLog[]): Buffer {
  const rows = logs.map((log) => ({
    'Import ID': log.id,
    'Imported At': log.importedAt,
    Status: log.status,
    'File Name': log.file.name,
    'File Size Bytes': log.file.sizeBytes,
    'MIME Type': log.file.mimetype,
    'Sheet Name': log.extraction.sheetName,
    Rows: log.extraction.rowCount,
    Columns: log.extraction.columnCount,
    Headers: log.extraction.headers.join(', '),
    Warnings: log.extraction.missingOptionalWarnings.join(' | '),
    'Validation Errors': log.extraction.validationErrors.join(' | '),
    Error: log.extraction.error,
    'Total Issues': log.statistics.totalIssues,
    'Done Issues': log.statistics.doneIssues,
    'Active Issues': log.statistics.activeIssues,
    'Completion Rate': log.statistics.completionRate,
    'Avg Lead Time Days': log.statistics.averageLeadTimeDays,
    'Avg Cycle Time Days': log.statistics.averageCycleTimeDays,
    'Critical Items': log.statistics.criticalItems,
    'Warning Items': log.statistics.warningItems,
    'Status Breakdown': flattenCounts(log.statistics.statusBreakdown),
    'Issue Type Breakdown': flattenCounts(log.statistics.issueTypeBreakdown),
    'Assignee Breakdown': flattenCounts(log.statistics.assigneeBreakdown),
    'Project Breakdown': flattenCounts(log.statistics.projectBreakdown),
    'Quarter Statistics': (log.statistics.quarters ?? [])
      .map(
        (quarter) =>
          `${quarter.quarter}: ${quarter.issues} issues, ${quarter.doneIssues} done, ${quarter.completionRate}% complete`,
      )
      .join(' | '),
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Import Logs');
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }) as Buffer;
}
