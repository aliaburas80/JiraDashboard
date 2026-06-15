'use client';
// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.

import { useState, useEffect, useCallback } from 'react';

// ─── Bash syntax highlighter ──────────────────────────────────────────────────

function colorizeCmd(part: string): string {
  return part.replace(/^(git|npm|npx|cp|node|cd|mkdir|echo|export|curl|cat)\b/,
    m => `<span style="color:var(--dc-green,#22C55E)">${m}</span>`);
}

function highlightBash(raw: string): string {
  if (/^\s*#/.test(raw)) return `<span style="color:var(--dc-acc2,#FF8A4C)">${raw}</span>`;
  const ci = raw.indexOf('  #');
  if (ci > 0) {
    return colorizeCmd(raw.slice(0, ci)) + `<span style="color:var(--dc-acc2,#FF8A4C)">${raw.slice(ci)}</span>`;
  }
  return colorizeCmd(raw);
}

function highlightText(raw: string): string {
  return raw.replace(/(\([^)]+\))/g, (_, group) => {
    if (group.toLowerCase() === '(required)') {
      return `<span style="background:rgba(248,113,113,0.11);color:#fca5a5;padding:1px 5px;border-radius:3px;font-size:9px;font-weight:700">(required)</span>`;
    }
    return `<span style="color:var(--dc-acc2,#FF8A4C)">${group}</span>`;
  });
}

// ─── Simple markdown renderer ─────────────────────────────────────────────────

function inlineMd(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*([^*]+)\*\*/g, '<strong style="font-weight:700;color:var(--dc-p1,#F2F2F2)">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background:var(--dc-s3,#282828);color:var(--dc-acc2,#FF8A4C);padding:1px 6px;border-radius:3px;font-size:10px;font-family:var(--font-mono,monospace)">$1</code>');
}

function renderMd(md: string): string {
  if (!md) return '';
  const lines = md.split('\n');
  const out: string[] = [];
  let inCode = false;
  let inTable = false;
  let inUl = false;
  let inOl = false;
  let codeLang = 'text';

  const closeOpenBlocks = () => {
    if (inUl)   { out.push('</ul>'); inUl = false; }
    if (inOl)   { out.push('</ol>'); inOl = false; }
    if (inTable) { out.push('</tbody></table></div>'); inTable = false; }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (!inCode) {
        closeOpenBlocks();
        codeLang = line.slice(3).trim() || 'text';
        out.push(`<pre style="background:var(--dc-s2,#1E1E1E);border:1px solid var(--dc-bdr,rgba(255,255,255,0.07));border-radius:10px;padding:14px 16px;overflow-x:auto;margin:14px 0;font-family:var(--font-mono,monospace);font-size:11px;line-height:1.8;color:var(--dc-p1,#F2F2F2);white-space:pre"><code>`);
        inCode = true;
      } else {
        out.push('</code></pre>');
        inCode = false;
      }
      continue;
    }
    if (inCode) {
      const esc = line.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      out.push((codeLang === 'bash' ? highlightBash(esc) : codeLang === 'text' ? highlightText(esc) : esc) + '\n');
      continue;
    }

    if (line.startsWith('#### ')) { closeOpenBlocks(); out.push(`<h4 style="font-size:12px;font-weight:700;color:var(--dc-p1,#F2F2F2);margin:14px 0 4px">${inlineMd(line.slice(5))}</h4>`); continue; }
    if (line.startsWith('### '))  { closeOpenBlocks(); out.push(`<h3 style="font-size:13px;font-weight:700;color:var(--dc-p1,#F2F2F2);margin:18px 0 6px;padding-bottom:4px;border-bottom:1px solid var(--dc-bdr,rgba(255,255,255,0.07))">${inlineMd(line.slice(4))}</h3>`); continue; }
    if (line.startsWith('## '))   { closeOpenBlocks(); out.push(`<h2 style="font-size:16px;font-weight:800;color:var(--dc-p1,#F2F2F2);margin:24px 0 10px;padding-bottom:8px;border-bottom:1px solid var(--dc-bdr2,rgba(255,255,255,0.13))">${inlineMd(line.slice(3))}</h2>`); continue; }
    if (line.startsWith('# '))    { closeOpenBlocks(); out.push(`<h1 style="font-size:22px;font-weight:800;color:var(--dc-p1,#F2F2F2);margin:20px 0 14px;letter-spacing:-0.02em">${inlineMd(line.slice(2))}</h1>`); continue; }

    if (line.startsWith('|')) {
      if (inUl || inOl) closeOpenBlocks();
      if (!inTable) {
        out.push('<div style="overflow-x:auto;margin:14px 0"><table style="width:100%;border-collapse:collapse">');
        inTable = true;
      }
      if (line.match(/^\|[-| :]+\|$/)) continue;
      const cells = line.split('|').filter((_c, idx, arr) => idx > 0 && idx < arr.length - 1);
      const nextLine = lines[i + 1] || '';
      const isHeader = !!nextLine.match(/^\|[-| :]+\|$/);
      if (isHeader) {
        out.push(`<thead><tr style="background:var(--dc-s1,#141414);border-bottom:1px solid var(--dc-bdr2,rgba(255,255,255,0.13))">${cells.map(c => `<th style="padding:8px 12px;text-align:left;font-size:10px;font-weight:700;color:var(--dc-p3,#505050);text-transform:uppercase;letter-spacing:0.06em;white-space:nowrap">${inlineMd(c.trim())}</th>`).join('')}</tr></thead><tbody>`);
      } else {
        const row = cells.map((c, ci) => {
          const val = c.trim();
          const isCode = ci === 0 && (val.startsWith('/') || /^[A-Z]{2,}$/.test(val) || /^\d{3}$/.test(val) || /^(GET|POST|PUT|DELETE|PATCH)$/.test(val));
          const s = isCode
            ? 'padding:7px 12px;font-size:10px;color:var(--dc-acc2,#FF8A4C);font-family:var(--font-mono,monospace);white-space:nowrap'
            : ci === 0
            ? 'padding:7px 12px;font-size:12px;color:var(--dc-p1,#F2F2F2);font-weight:600;white-space:nowrap'
            : 'padding:7px 12px;font-size:12px;color:var(--dc-p2,#909090)';
          return `<td style="${s}">${inlineMd(val)}</td>`;
        }).join('');
        out.push(`<tr style="border-bottom:1px solid var(--dc-bdr,rgba(255,255,255,0.07))">${row}</tr>`);
      }
      continue;
    }
    if (inTable && !line.startsWith('|')) { out.push('</tbody></table></div>'); inTable = false; }

    if (line.match(/^[-*] /)) {
      if (inOl) { out.push('</ol>'); inOl = false; }
      if (!inUl) { out.push('<ul style="padding-left:18px;margin:8px 0;list-style:disc">'); inUl = true; }
      out.push(`<li style="font-size:13px;color:var(--dc-p2,#909090);line-height:1.65;margin:3px 0">${inlineMd(line.slice(2))}</li>`);
      continue;
    }
    if (line.match(/^\d+\. /)) {
      if (inUl) { out.push('</ul>'); inUl = false; }
      if (!inOl) { out.push('<ol style="padding-left:18px;margin:8px 0;list-style:decimal">'); inOl = true; }
      out.push(`<li style="font-size:13px;color:var(--dc-p2,#909090);line-height:1.65;margin:3px 0">${inlineMd(line.replace(/^\d+\. /,''))}</li>`);
      continue;
    }
    if ((inUl || inOl) && line.trim() === '') { closeOpenBlocks(); out.push('<div style="margin:4px 0"></div>'); continue; }
    if (line.match(/^---+$/)) { closeOpenBlocks(); out.push('<hr style="border:none;border-top:1px solid var(--dc-bdr,rgba(255,255,255,0.07));margin:20px 0" />'); continue; }
    if (line.trim() === '') { closeOpenBlocks(); out.push('<div style="margin:8px 0"></div>'); continue; }

    out.push(`<p style="font-size:13px;color:var(--dc-p2,#909090);line-height:1.7;margin:6px 0">${inlineMd(line)}</p>`);
  }
  if (inCode)  out.push('</code></pre>');
  if (inTable) out.push('</tbody></table></div>');
  if (inUl)    out.push('</ul>');
  if (inOl)    out.push('</ol>');
  return out.join('\n');
}

// ─── Inline static sections ───────────────────────────────────────────────────

const INLINE: Record<string, string> = {
  quickstart: `# Quick Start

## Prerequisites
- Node.js 18 or later
- npm 9 or later

## Install & Run

\`\`\`bash
git clone <repo-url> && cd JiraDashboard
npm install
cp .env.example .env.local
npm run dev         # http://localhost:3000
npm run build       # production build
npm run start       # serve production
npm test            # run test suite
npm run lint        # lint check
\`\`\`

## Pages

| Route | Description |
|---|---|
| / | Upload page — drag-and-drop Jira file |
| /summary | Executive summary — health score + KPIs |
| /charts | Visual analytics — 11 chart widgets |
| /dashboard | Full delivery report — 3-zone layout (DashboardTopbar + DashboardSidebarNav + 15 sections) |
| /roadmap | Roadmap — epic progress + delivery forecasts |
| /forecast | Forecast — burn-up chart + delivery status |
| /retro | Retrospective — form, template download, insights |
| /developer | This page — documentation portal |
| /backend | Backend status — import logs + API health |
| /help | User guide — 31 sections + grouped nav |

## Jira Export Tips

Include these columns for best results:

\`\`\`
Issue Key, Issue Type, Summary, Status       (required)
Sprint, Story Points, Assignee               (capacity)
Created Date, Resolution Date                (lead time)
In Progress Date, Done Date                  (cycle time)
Epic Link, Parent Key, Labels, Priority      (classification)
Due Date, Blocked Flag                       (risk detection)
Inward issue link (Blocks)                   (relations)
\`\`\``,

  architecture: `# Architecture

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 — App Router |
| Language | TypeScript 5.x (strict: false) |
| Styling | Tailwind CSS 3 + SCSS |
| Testing | Jest + ts-jest |
| Runtime | Node.js 18+ |

## Directory Structure

\`\`\`
app/
  page.tsx                Upload / home
  layout.tsx              Root layout + font
  globals.scss            Tailwind base + component layer
  summary/page.tsx        Executive summary
  charts/page.tsx         Visual analytics
  dashboard/page.tsx      Full delivery report (3-zone: DashboardTopbar + DashboardSidebarNav + 15-section main)
  developer/page.tsx      Documentation portal (this page)
  backend/page.tsx        Backend status
  help/page.tsx           User guide
  api/
    upload/route.ts       POST — upload Jira file
    imports/route.ts      GET  — import history
    metrics/route.ts      GET  — last metrics
    dashboard/route.ts    GET  — service info
    health/route.ts       GET  — health check
    backend-view/route.ts GET  — stats + logs
    developer-view/route.ts GET — architecture JSON
    docs/route.ts         GET  — serve product/ docs

src/
  components/
    layout/AppShell.tsx   Header + nav + footer
    ui/
      Card.tsx, Badge.tsx, KpiCard.tsx
      LoadingState.tsx, EmptyState.tsx
  services/
    metrics/metrics.service.ts    All metric calculations
    jira/parser.ts                XLSX/CSV parsing (55+ aliases)
    jira/validation.ts            Essential field validation
    imports/importLogs.service.ts Import history management
  types/
    jira.ts     ParseResult, JiraRawIssue
    metrics.ts  DashboardMetrics + 15 sub-interfaces
    api.ts      UploadResponse, ImportLogEntry
  lib/utils.ts  cn(), getHealthBand(), HEALTH_COLORS

data/
  import-logs.json   Auto-created (gitignored)
product/             All documentation
\`\`\`

## Data Flow

\`\`\`
User drops file
  POST /api/upload (multipart, max 20 MB, 20 req/15min/IP)
    parseJiraFile()        XLSX/CSV → normalised issues[]
    validateIssueData()    check ESSENTIAL_FIELDS
    calculateDashboardMetrics() → DashboardMetrics
    appendImportLog()      save to data/import-logs.json
    return { metrics, warnings, importLog }
  writeLatestMetrics(metrics)
  saveMetrics(metrics) // browser fallback: dc_metrics_v2
  router.push('/summary')
\`\`\``,

  api: `# API Reference

## POST /api/upload

**Purpose:** Upload a Jira export and receive full delivery metrics.

**Request:** \`multipart/form-data\`, field name \`file\`
**Accepted:** .csv, .xlsx, .xls (max 20 MB)
**Rate limit:** 20 requests / 15 min / IP

**Success 200:**
\`\`\`json
{
  "metrics": { "totalIssues": 142, "healthScore": 84, "completionRate": 19, ... },
  "warnings": ["Missing optional fields: Sprint"],
  "importLog": { "id": "...", "status": "success", "rowCount": 142 }
}
\`\`\`

| Code | Meaning |
|---|---|
| 200 | Success — metrics returned |
| 400 | No file provided or invalid file type |
| 413 | File exceeds 20 MB size limit |
| 422 | Missing required Jira columns |
| 429 | Rate limit exceeded — wait 15 min |
| 500 | Processing error |

---

## GET /api/imports

Returns full import log history.

**Response:** \`{ logs: ImportLogEntry[] }\`

---

## GET /api/metrics

Returns the last successful metrics payload.

**Response:** \`{ log: ImportLogEntry, available: true, lastImport: string }\`
**404** if no successful import exists yet.

---

## GET /api/health

Service health check with endpoint inventory.

**Response:** \`{ status, service, version, endpoints[] }\`

---

## GET /api/backend-view

Stats about past imports plus live endpoint list.

**Response:** \`{ stats, logs: ImportLogEntry[], endpoints[] }\`

---

## GET /api/developer-view

Architecture JSON — same data rendered here.

---

## GET /api/docs?slug=brd

Serve a product/ documentation file as JSON.

**slug values:** brd, srs, use-cases, scenarios, test-cases, user-journeys, dev-guide, readme

**Response:** \`{ slug, filename, content: string }\``,

  services: `# Services

## metrics.service.ts

Main export: \`calculateDashboardMetrics(issues)\`

### Builder Functions

| Function | Returns |
|---|---|
| getHealthFromIssue(issue) | FlowItem with health + reason |
| buildFlowMetrics(flowItems) | FlowMetrics |
| buildSprintMetrics(issues, flowItems) | SprintMetrics |
| buildKanbanMetrics(issues, flowItems) | KanbanMetrics |
| buildQuarterMetrics(issues, flowItems) | QuarterData[] |
| buildCapacityMetrics(issues) | CapacityItem[] |
| buildEpicMetrics(issues, flowItems) | EpicItem[] |
| buildLabelMetrics(issues, flowItems) | LabelMetrics |
| buildTypeMetrics(issues, flowItems) | TypeMetric[] |
| buildProjectMetrics(issues, flowItems) | ProjectMetric[] |
| buildParentMetrics(issues, flowItems) | ParentMetric[] |
| buildLinksMetrics(issues) | RelationsMetrics |
| buildRiskMetrics(issues) | RiskMetrics |
| calculateHealthScore(metrics) | number 0-100 |
| calculatePrediction(issues, done, total) | PredictionResult |
| buildInsights(metrics) | string[] |

### Health Score Formula

\`\`\`
score =
  completionRate         × 0.28
  + (1 - criticalRatio)  × 100 × 0.24
  + (1 - warningRatio)   × 100 × 0.12
  + sprintCompletionRate × 0.14
  + (1 - orphanRatio)    × 100 × 0.12
  + cycleTimeScore       × 0.10

cycleTimeScore = max(0, 100 − (avgCycleDays − 3) × 8)
\`\`\`

Score bands: **90-100** Excellent · **75-89** Good · **60-74** Moderate · **40-59** At Risk · **0-39** Critical

### Health Classification per Issue

| Signal | Warning threshold | Critical threshold |
|---|---|---|
| Active work age | > 7 days in progress | > 14 days |
| Cycle time (done items) | > 7 days | > 14 days |
| Waiting age (not started) | > 30 days | — |
| Due date | — | Overdue + not done |
| Priority | — | High/Highest/Critical + open |
| Blocked Flag | — | = true |

---

## parser.ts

\`\`\`typescript
parseJiraFile({ buffer: Buffer, originalname: string })
  → { issues, warnings, headers, sheetName }
\`\`\`

Reads XLSX/CSV via the xlsx library. Normalises all column names through 55+ \`FIELD_ALIASES\`.

### Key Aliases

| Input column | Canonical field |
|---|---|
| created | Created Date |
| resolved | Resolution Date |
| parent / parent key | Parent Key |
| custom field (epic link) | Epic Link |
| custom field (story points) | Story Points |
| labels | Labels |
| custom field (actual start) | In Progress Date |
| custom field (actual end) | Done Date |

---

## validation.ts

Checks ESSENTIAL_FIELDS: \`Issue Key\`, \`Issue Type\`, \`Summary\`, \`Status\`

Returns \`{ isValid, errors }\`

---

## importLogs.service.ts

| Function | Description |
|---|---|
| readImportLogs() | Read data/import-logs.json; return [] if missing |
| appendImportLog(entry) | Prepend + trim to 200 entries |
| buildImportLog(params) | Build ImportLogEntry from upload params |
| exportImportLogsWorkbook(logs) | Generate Excel workbook |`,

  types: `# TypeScript Types

## DashboardMetrics

\`\`\`typescript
interface DashboardMetrics {
  totalIssues: number;        doneIssues: number;
  activeIssues: number;       blockedIssues: number;
  completionRate: number;     healthScore: number;
  flow: FlowMetrics;          sprint: SprintMetrics;
  kanban: KanbanMetrics;      quarters: QuarterData[];
  capacity: CapacityItem[];   epics: EpicItem[];
  labels: LabelMetrics;       types: TypeMetric[];
  projects: ProjectMetric[];  parents: ParentMetric[];
  relations: RelationsMetrics; risk: RiskMetrics;
  storyPoints: StoryPointMetrics;
  prediction: PredictionResult;
  insights: string[];
}
\`\`\`

## FlowItem

\`\`\`typescript
interface FlowItem {
  key: string;          summary: string;       type: string;
  status: string;       sprint: string;        epic: string;
  isOrphan: boolean;    assignee: string;      priority: string;
  labels: string;       parent: string;        project: string;
  linkedTo: string;     storyPoints: number;
  leadTimeDays: number | null;
  cycleTimeDays: number | null;
  ageDays: number | null;
  health: 'good' | 'warning' | 'critical';
  reason: string;
}
\`\`\`

## PredictionResult

\`\`\`typescript
interface PredictionResult {
  complete: boolean;
  daysRemaining: number | null;
  predictedDate?: string;       // 'DD Mon YYYY'
  velocityPerDay?: number;      // issues per day
}
\`\`\`

## ImportLogEntry

\`\`\`typescript
interface ImportLogEntry {
  id: string;           timestamp: string;
  filename: string;     filesize: number;
  sheetName: string;    rowCount: number;
  headers: string[];    warnings: string[];
  status: 'success' | 'validation_failed' | 'failed';
  error?: string;
}
\`\`\`

## HealthBand

\`\`\`typescript
type HealthBand = 'excellent' | 'good' | 'moderate' | 'at-risk' | 'critical';

function getHealthBand(score: number): HealthBand {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'moderate';
  if (score >= 40) return 'at-risk';
  return 'critical';
}
\`\`\``,

  testing: `# Testing

## Test Suite

- **Location:** src/__tests__/metrics.test.ts
- **Runner:** Jest + ts-jest
- **Command:** \`npm test\`
- **Result:** 7 tests, 1 suite, all passing

## Current Tests

| Test | Assert |
|---|---|
| calculates totalIssues correctly | = 3 |
| calculates doneIssues correctly | = 1 |
| calculates completionRate correctly | = 33 |
| returns flow items for each issue | length = 3 |
| identifies orphan issues | all 3 orphans |
| includes story points metrics | total=10, completed=3 |
| calculates healthScore between 0 and 100 | 0 ≤ score ≤ 100 |

## Add a New Test

\`\`\`typescript
import { calculateDashboardMetrics } from '../services/metrics/metrics.service';

it('describes what is being tested', () => {
  const mockIssues = [
    { 'Issue Key': 'T-1', 'Issue Type': 'Story',
      'Summary': 'Test', 'Status': 'Done',
      'Created Date': '01/Jan/24',
      'Assignee': 'Alice', 'Story Points': '3' }
  ] as Record<string, unknown>[];

  const metrics = calculateDashboardMetrics(mockIssues);
  expect(metrics.completionRate).toBe(100);
  expect(metrics.healthScore).toBeGreaterThanOrEqual(0);
});
\`\`\`

## Coverage Areas Needed

- ⬜ Parser: FIELD_ALIASES normalisation
- ⬜ Parser: BOM character stripping
- ⬜ Validation: missing essential fields
- ⬜ Health: blocked flag detection
- ⬜ Health: overdue date detection
- ⬜ Metrics: sprint data extraction
- ⬜ Metrics: label multi-value parsing
- ⬜ Metrics: link column detection
- ⬜ API: upload rate limiting`,

  'cloud-sync': `# Cloud Sync Architecture

## Strategy: Cache-first · Push-on-change · Fallback · No-data-loss switch

---

## Rule 1 — Cache-First (never re-fetch unnecessarily)

On startup: list bucket → find latest key → compare SHA-256 content hash with \`data/.cloud-cache-meta.json\` → hash match = use local cache (no download); hash differs = download + restore + update cache. Analytics pages then fetch \`/api/metrics/latest\`, which returns \`data/latest-metrics.json\` from the restored/cache-backed server copy before the browser falls back to \`localStorage\`.

**Files:** \`src/services/storage/cloudSync.ts — syncFromCloud()\`

---

## Rule 2 — Fallback on cloud failure

Cloud unreachable → serve from local server/cache when possible. If no server latest metrics are available, the client falls back to browser \`localStorage\` and shows the ⚠️ localStorage fallback badge. If local changes are waiting to be pushed, startup sync does not pull an older bucket backup over them.

---

## Rule 3 — Push-on-change (all copies always same version)

| Trigger | Where |
|---------|-------|
| Jira CSV upload | \`POST /api/upload\` (non-blocking) |
| Snapshot save | \`POST /api/snapshots\` |
| Config change | Admin settings save handlers |
| Manual | \`POST /api/admin/storage/sync?action=push\` |

If push fails → \`pendingPush=true\` → retried on next startup or sync request.

---

## Rule 4 — Provider switch (zero data loss)

\`switchProvider()\`: 1. Pull latest from current provider. 2. Push to new provider. Both end at same version.

Storage provider selection and credentials live in \`data/storage-settings.json\`, not in the browser session. Login, logout, session expiry, and locked admin Test connection / Upload backup actions must not clear the active provider or saved secrets. API responses return only \`hasCredentials\`; blank/redacted credential fields from the browser are ignored so existing server-side secrets are preserved unless the admin explicitly saves replacement values.

---

## Data Source Badge

Shows in AppShell header next to theme toggle. Updates automatically:

| Badge | Meaning |
|-------|---------|
| ☁️ S3 | Data restored from Amazon S3 |
| 🔷 Azure | Data from Azure Blob Storage |
| 🌐 GCP | Data from Google Cloud Storage |
| 💾 Local cache | Cloud set; hash matched; no download needed |
| 📤 Jira upload | Fresh upload in this browser session |
| ⚠️ localStorage fallback | Bucket/server metrics unavailable; served from browser fallback |

**File:** \`src/components/ui/DataSourceBadge.tsx\`

When loading, a blue banner appears below the header: "Loading data from Amazon S3…"

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| \`/api/admin/storage/sync\` | GET | Sync status + cache meta |
| \`/api/admin/storage/sync?action=push\` | POST | Push local to cloud |
| \`/api/admin/storage/sync?action=switch\` | POST | Pull old → push new provider |
| \`/api/admin/storage/download?key=X\` | GET | Download backup file |
| \`/api/admin/storage/download?key=X&restore=true\` | GET | Restore from cloud |
| \`/api/admin/storage/auto-restore\` | GET | DB health (users, imports, size) |
| \`/api/admin/storage/auto-restore?force=true\` | POST | Force restore latest backup |
| \`/api/metrics/latest\` | GET | Bucket/server latest metrics; returns \`available:false\` with HTTP 200 when none exist yet |
| \`/api/profile/image\` | GET/POST | Authenticated S3-backed profile image upload/proxy; stores objects under \`images/profile/\` |

---

## What is backed up to cloud

| File | Contents |
|------|----------|
| \`delivery_clarity.db\` | Users, sessions, import logs, snapshots, audit events |
| \`latest-metrics.json\` | Latest computed DashboardMetrics payload for bucket-first dashboard startup |
| \`health-thresholds.json\` | Admin health threshold config |
| \`retention-settings.json\` | Data retention rules |
| \`orphan-rules.json\` | Orphan detection rules |
| \`import-logs.json\` | File-based import log |
| \`images/profile/*\` | S3-stored member profile images uploaded from \`/profile\` |

**Browser-only localStorage fallback/preferences:** \`dc_metrics_v2\` (fallback copy), \`dc_metrics_source_v1\`, filter presets, layout/theme prefs, rec owners/feedback.

---

## Startup Auto-Restore

\`instrumentation.ts register()\` runs once on Node.js server start. If local DB is empty: find latest cloud backup → download → \`restoreBackup()\`. Cloud SDK packages are kept external by \`next.config.js\` and loaded by the provider layer at runtime.`,

  gateway: `# Backend Integration Gateway (Foundation — v4.3)

> **Server-only module** — \`src/server/gateway/\`. No dedicated API route. No live providers wired up by default. This is the chokepoint that every future outbound call (Jira live API, email, Slack, Teams, push, custom HTTP) MUST route through.

---

## Goal

Provide a single, controlled, auditable entry point for all future external HTTP calls — with SSRF protection, host allowlisting, credential isolation, retry/backoff, and secret-redacted observability built in from day one.

## Module Map

| File | Role |
|------|------|
| \`types.ts\` | Full type contract (\`GatewayResult<T>\`, \`GatewayProviderType\`, \`GatewayRoutingStrategy\`, \`GatewayLogRecord\`, ...) |
| \`endpointPolicy.ts\` | \`validateEndpoint()\` — protocol allowlist, host allowlist, SSRF, path safety. Never throws |
| \`retryPolicy.ts\` | Timeout (10s), 2 retries, exponential backoff, retryable/non-retryable status tables |
| \`gatewayLogger.ts\` | \`redact()\` + \`logGatewayCall()\` → \`data/gateway-audit.jsonl\` JSONL |
| \`providerRegistry.ts\` | Config-file-driven provider resolution — reads \`data/gateway-providers.json\` |
| \`externalGateway.ts\` | \`callExternal<T>()\` — the single entry point. Never throws |

## Zero-Code-Change Config

Provider env-var names, host allowlist additions, and kill-switches live in \`data/gateway-providers.json\` — not in source. Edit the file and the next call picks it up (no redeploy). Credential *values* stay in \`process.env\` only — never in the config file.

\`\`\`json
{
  "version": "1.0",
  "providers": {
    "jira": {
      "baseUrlEnvVar": "MY_JIRA_URL",
      "credentialEnvVars": ["MY_JIRA_TOKEN"],
      "allowedHosts": ["jira.mycompany.com"],
      "enabled": true
    }
  }
}
\`\`\`

## Security Model

| Check | Where |
|-------|-------|
| https-only in production | \`endpointPolicy.validateEndpoint()\` |
| Host allowlist | per-provider from registry + config file |
| Private/internal IP block (SSRF) | RFC 1918 + link-local + loopback patterns |
| Localhost block in production | \`LOCAL_HOSTNAMES\` set + isProduction guard |
| Path traversal (pre-parse) | \`TRAVERSAL_PATTERN\` on raw URL string before \`new URL()\` |
| Secret redaction | \`gatewayLogger.redact()\` — 9 patterns before any log write |

## Why JSONL, Not AuditEvent Table

Gateway calls are high-volume operational telemetry — every retry would be a row. Routing them through \`prisma.auditEvent\` would pollute the admin-facing audit trail and require a migration. Records append to \`data/gateway-audit.jsonl\` (same convention as \`storage-settings.json\`). Write failures are swallowed.

## Tests — 23 passing (TC-GW-01–TC-GW-21 + TC-GW-05b/TC-GW-15b)

\`src/__tests__/gateway.test.ts\` covers endpoint policy (SSRF/allowlist/traversal), retry/backoff math, secret redaction + JSONL logging, config-file-driven provider resolution, and \`callExternal()\` end-to-end (happy path, policy rejection, SSRF-via-path-injection, retry-then-succeed, retry-exhaustion, non-retryable immediate fail).

See **FR-313** in \`product/SRS.md\` and the full architecture section in \`product/DEVELOPER_GUIDE.md\`.`,
};

// ─── Nav config ───────────────────────────────────────────────────────────────

const SECTIONS = [
  { id: 'quickstart',    label: '🚀 Quick Start',           group: 'Getting Started' },
  { id: 'architecture',  label: '🏗️ Architecture',           group: 'Getting Started' },
  { id: 'packages',      label: '📦 Package Reference',      group: 'Reference'       },
  { id: 'calculations',  label: '🧮 Calculation Reference',  group: 'Reference'       },
  { id: 'api',           label: '🔌 API Reference',          group: 'Technical'       },
  { id: 'services',      label: '⚙️ Services',                group: 'Technical'       },
  { id: 'types',         label: '📐 TypeScript Types',       group: 'Technical'       },
  { id: 'testing',       label: '🧪 Testing',                group: 'Technical'       },
  { id: 'brd',           label: '📋 BRD',                    group: 'Product Docs'    },
  { id: 'srs',           label: '📄 SRS',                    group: 'Product Docs'    },
  { id: 'use-cases',     label: '🎯 Use Cases',              group: 'Product Docs'    },
  { id: 'scenarios',     label: '🎬 Scenarios',              group: 'Product Docs'    },
  { id: 'test-cases',    label: '✅ Test Cases',             group: 'Product Docs'    },
  { id: 'user-journeys', label: '🗺️ User Journeys',          group: 'Product Docs'    },
  { id: 'dev-guide',     label: '📖 Developer Guide',        group: 'Product Docs'    },
  { id: 'deployment',   label: '🚢 Deployment Guide',        group: 'Product Docs'    },
  { id: 'cloud-sync',  label: '🔄 Cloud Sync Architecture', group: 'Technical'       },
  { id: 'gateway',     label: '🌐 Backend Gateway',         group: 'Technical'       },
];

// ── Package Reference data ────────────────────────────────────────────────────

const PACKAGES = [
  { name:'next',            version:'14.2.5',   usedFor:'App Router, SSR, API routes',                   feature:'Core Framework',      scope:'Shared',    status:'Installed', risk:'Application fails completely' },
  { name:'react',           version:'^18.3.1',  usedFor:'UI rendering, hooks, state',                    feature:'Core Framework',      scope:'Client',    status:'Installed', risk:'Application fails completely' },
  { name:'react-dom',       version:'^18.3.1',  usedFor:'React DOM rendering',                           feature:'Core Framework',      scope:'Client',    status:'Installed', risk:'Application fails completely' },
  { name:'typescript',      version:'^5.4.5',   usedFor:'Type safety, interfaces, strict mode',          feature:'Core Framework',      scope:'Dev-only',  status:'Installed', risk:'Type errors uncaught, build fails' },
  { name:'tailwindcss',     version:'^3.4.4',   usedFor:'Utility-first CSS styling',                     feature:'UI/Styling',          scope:'Client',    status:'Installed', risk:'All styling breaks' },
  { name:'sass',            version:'^1.77.8',  usedFor:'globals.scss global stylesheet',                feature:'UI/Styling',          scope:'Client',    status:'Installed', risk:'Global styles break' },
  { name:'xlsx',            version:'^0.18.5',  usedFor:'Parse Jira CSV/XLSX exports, generate Excel',  feature:'Upload + Export',     scope:'Server',    status:'Installed', risk:'Upload and export completely broken' },
  { name:'reactflow',       version:'^11.11.4', usedFor:'Interactive hierarchy graph in Work Item Explorer', feature:'F2 Explorer',    scope:'Client',    status:'Installed', risk:'Work Item Explorer graph fails' },
  { name:'@dagrejs/dagre',  version:'^3.0.0',   usedFor:'Hierarchical layout algorithm for React Flow', feature:'F2 Explorer',         scope:'Client',    status:'Installed', risk:'Graph layout broken (spaghetti)' },
  { name:'prisma',          version:'^5.22.0',  usedFor:'ORM, schema, migrations, DB queries',          feature:'F3 Auth & Database',  scope:'Server',    status:'Installed', risk:'No database access, auth fails' },
  { name:'@prisma/client',  version:'^5.22.0',  usedFor:'Generated Prisma client for queries',          feature:'F3 Auth & Database',  scope:'Server',    status:'Installed', risk:'Database queries fail completely' },
  { name:'iron-session',    version:'^8.0.4',   usedFor:'HTTP-only cookie sessions, auth state',         feature:'F3 Auth & Database',  scope:'Server',    status:'Installed', risk:'Login/logout/session completely broken' },
  { name:'bcryptjs',        version:'^3.0.3',   usedFor:'Password hashing (rounds=12)',                  feature:'F3 Auth & Database',  scope:'Server',    status:'Installed', risk:'Passwords stored in plaintext' },
  { name:'@types/bcryptjs', version:'^2.4.6',   usedFor:'TypeScript types for bcryptjs',                feature:'F3 Auth & Database',  scope:'Dev-only',  status:'Installed', risk:'TypeScript errors in auth code' },
  { name:'lucide-react',    version:'^0.427.0', usedFor:'SVG icon components used sparingly',            feature:'UI/Icons',            scope:'Client',    status:'Installed', risk:'Icons disappear, minor visual issue' },
  { name:'clsx',            version:'^2.1.1',   usedFor:'Conditional className utility',                 feature:'UI/Styling',          scope:'Client',    status:'Installed', risk:'className logic errors in components' },
  { name:'tailwind-merge',  version:'^2.3.0',   usedFor:'Merge Tailwind classes without conflicts',      feature:'UI/Styling',          scope:'Client',    status:'Installed', risk:'Duplicate Tailwind class conflicts' },
  { name:'jest',            version:'^29.7.0',  usedFor:'Test runner for 253 automated tests',           feature:'Testing',             scope:'Dev-only',  status:'Installed', risk:'No automated testing' },
  { name:'ts-jest',         version:'^29.2.2',  usedFor:'TypeScript support for Jest',                   feature:'Testing',             scope:'Dev-only',  status:'Installed', risk:'TypeScript tests fail to compile' },
  // Planned — future features
  { name:'@aws-sdk/client-s3',      version:'—', usedFor:'Amazon S3 cloud storage',          feature:'P3 Cloud Storage',    scope:'Server',  status:'Planned', risk:'N/A — not yet implemented' },
  { name:'@azure/storage-blob',     version:'—', usedFor:'Azure Blob Storage',               feature:'P3 Cloud Storage',    scope:'Server',  status:'Planned', risk:'N/A — not yet implemented' },
  { name:'@google-cloud/storage',   version:'—', usedFor:'Google Cloud Storage',             feature:'P3 Cloud Storage',    scope:'Server',  status:'Planned', risk:'N/A — not yet implemented' },
  { name:'jira-api-client (TBD)',   version:'—', usedFor:'Jira REST API integration',        feature:'P3 Jira Integration', scope:'Server',  status:'Planned', risk:'N/A — not yet implemented' },
  { name:'nodemailer',               version:'^8.0.10', usedFor:'Welcome email on user-add-request accept', feature:'P1 USERREQ', scope:'Server', status:'Installed', risk:'Gmail App Password rotation breaks email delivery' },
];

// ── Calculation Reference data ────────────────────────────────────────────────

const CALCULATIONS = [
  {
    name:'Delivery Health Index', category:'Delivery Health',
    formula:'score = completionRate×0.25 + flowHealth×0.20 + velocityTrend×0.15 + cycleTimeScore×0.15 + (1−blockedRatio)×0.15 + (1−orphanRatio)×0.10 → clamp(0,100)',
    inputs:'doneIssues, totalIssues, criticalCount, warningCount, avgCycleTimeDays, blockedIssues, orphanCount, sprintTrend',
    why:'Single composite number summarises delivery quality across 6 independent signals.',
    benefit:'Executives and stakeholders get one actionable score instead of 10 charts.',
    alternatives:'Simple completion % alone lacks risk/flow signals. Separate KPIs require manual synthesis. Composite weighted index is standard in delivery intelligence tools (LinearB, Jellyfish use similar composites).',
    usedIn:'Dashboard header, Summary page, Customer View, Excel Executive Summary, health band classification',
    assumptions:'All 6 signals are available from the Jira export; more missing fields = lower score reliability.',
    limitations:'Does not capture customer satisfaction, team morale, or external blockers.',
    file:'src/services/metrics/metrics.service.ts — calculateHealthScore()',
    ref:'ALGORITHM_SPEC.md §Health Score Algorithm', status:'Implemented',
  },
  {
    name:'Completion Percentage', category:'Delivery Health',
    formula:'completionRate = (doneIssues / totalIssues) × 100',
    inputs:'Status field (Done/Closed/Resolved), totalIssues',
    why:'Most fundamental delivery metric — what fraction of committed work is done.',
    benefit:'Instantly communicates project progress to any audience.',
    alternatives:'Story-point-only completion ignores non-estimated items. Issue-count is unbiased by estimation quality and works on any Jira export.',
    usedIn:'Dashboard KPI card, Summary page, Customer View, Excel Executive Summary, all views and reports',
    assumptions:'Done statuses correctly reflect completed work.',
    limitations:'Does not weight by effort — 1 epic = 1 sub-task in this calculation.',
    file:'src/services/metrics/metrics.service.ts',
    ref:'Standard Agile completion tracking', status:'Implemented',
  },
  {
    name:'Sprint Throughput (Count)', category:'Scrum Metrics',
    formula:'throughputByCount = COUNT(issues WHERE doneDate >= sprintStart AND doneDate <= sprintEnd AND status ∈ DONE_STATUSES)',
    inputs:'Sprint, Sprint Start, Sprint End, Done Date, Status',
    why:'Measures how many items a team actually delivers per sprint, not just what was committed.',
    benefit:'Used for velocity trending, sprint comparison, and commitment accuracy.',
    alternatives:'Story-point throughput is effort-weighted but requires consistent estimation. Issue-count throughput works even when story points are absent or inconsistently estimated.',
    usedIn:'SprintThroughputPanel, Sprint Comparison panel, Excel Sprint Throughput sheet, Delivery Trend',
    assumptions:'Sprint dates are present in the Jira export.',
    limitations:'Does not weight by complexity or effort.',
    file:'src/services/metrics/throughput.service.ts — calculateSprintThroughput()',
    ref:'Scrum Guide: Sprint velocity; ALGORITHM_SPEC.md', status:'Implemented',
  },
  {
    name:'Sprint Throughput (Story Points)', category:'Scrum Metrics',
    formula:'throughputByPoints = SUM(storyPoints WHERE doneDate <= sprintEnd AND status ∈ DONE_STATUSES)',
    inputs:'Story Points, Done Date, Sprint Start, Sprint End',
    why:'Effort-weighted throughput is more accurate than issue count for comparing sprints of different complexity.',
    benefit:'Enables story-point velocity forecasting and capacity planning.',
    alternatives:'Issue-count throughput is less sensitive to estimation inflation but loses effort signal. Story points are preferred when teams estimate consistently.',
    usedIn:'SprintThroughputPanel, Sprint Velocity Chart (/charts), Excel Sprint Throughput sheet',
    assumptions:'Story points are estimated and present in the export.',
    limitations:'Story point inflation over time can distort trends.',
    file:'src/services/metrics/throughput.service.ts',
    ref:'Scrum velocity planning principles', status:'Implemented',
  },
  {
    name:'Mid-Sprint Completion %', category:'Scrum Metrics',
    formula:'midSprintPct = (doneByMidpoint / committedCount) × 100\nmidpoint = sprintStart + FLOOR((sprintEnd − sprintStart) / 2)',
    inputs:'Sprint Start, Sprint End, Done Date, committed issues',
    why:'Detects end-loaded sprints before the retrospective — allows corrective action mid-sprint.',
    benefit:'Scrum Masters can identify delivery risk while there is still time to act.',
    alternatives:'Retrospective-only analysis misses the window for corrective action. Burn-down charts require real-time Jira data this tool does not have. Midpoint check is a lightweight leading indicator.',
    usedIn:'MidSprintDeliveryPanel, Sprint Comparison panel, Excel Mid-Sprint sheet',
    assumptions:'Sprint Start and Sprint End dates are present in the export.',
    limitations:'Midpoint is time-based, not effort-based — a difficult story may still be incomplete at midpoint legitimately.',
    file:'src/services/metrics/throughput.service.ts',
    ref:'Mid-sprint pattern research; TECHNICAL_METHOD.md §Method 6', status:'Implemented',
  },
  {
    name:'Average Sprint Throughput', category:'Scrum Metrics',
    formula:'averageThroughputCount = SUM(sprintThroughputCount[]) / sprintCount',
    inputs:'All sprint throughput values from the export',
    why:'Smooths out sprint-to-sprint variation to give a reliable planning baseline.',
    benefit:'Used to forecast future delivery dates and set realistic sprint commitments.',
    alternatives:'Simple average is transparent and easy for stakeholders to verify. Weighted moving average would be more responsive to recent trends but harder to explain.',
    usedIn:'SprintThroughputPanel summary stats, predictive completion estimate, Delivery Trend',
    assumptions:'At least 3 sprints of history for a reliable average.',
    limitations:'Sensitive to outlier sprints (holidays, large releases, scope changes).',
    file:'src/services/metrics/throughput.service.ts',
    ref:'Statistical average / moving average principles', status:'Implemented',
  },
  {
    name:'Lead Time', category:'Time Metrics',
    formula:'leadTimeDays = doneDate − createdDate (in days)',
    inputs:'Created Date, Done Date (or Resolution Date)',
    why:'Measures end-to-end delivery time from idea to completion — the customer\'s experience of speed.',
    benefit:'Used for SLA commitments (P85 Lead Time = delivery SLA target). Identifies backlog age issues.',
    alternatives:'Cycle Time excludes backlog queue wait — useful for team efficiency but not for customer SLA. Lead Time is the customer-facing metric; Cycle Time is the team execution metric.',
    usedIn:'Dashboard KPI card, flow health table, Excel Cycle & Lead Time sheet, P50/P85/P95 percentile calculations',
    assumptions:'Created Date and Done Date are both present in the export.',
    limitations:'Does not distinguish active work time from queue wait time (use Flow Efficiency for that).',
    file:'src/services/metrics/metrics.service.ts — getHealthFromIssue()',
    ref:'Kanban Guide: Lead Time definition', status:'Implemented',
  },
  {
    name:'Cycle Time', category:'Time Metrics',
    formula:'cycleTimeDays = doneDate − startedDate (In Progress Date or Sprint Start fallback)',
    inputs:'In Progress Date (or Sprint Start as fallback), Done Date (or Resolution Date)',
    why:'Measures active execution time only — excludes backlog wait. Reflects team execution speed, not queue depth.',
    benefit:'Used for team process improvement, Flow Efficiency calculation, and cycle time SLA.',
    alternatives:'Lead Time includes backlog queue wait — better for customer SLA. Cycle Time is better for identifying team execution bottlenecks. Both are needed for complete flow analysis.',
    usedIn:'Dashboard KPI card, flow health table, Flow Efficiency, Bottleneck Status, Excel Cycle & Lead Time sheet',
    assumptions:'In Progress Date is tracked via Jira transition logging. Falls back to Sprint Start if absent.',
    limitations:'Falls back to Sprint Start if In Progress Date is missing — less accurate for Kanban teams.',
    file:'src/services/metrics/metrics.service.ts',
    ref:'Kanban Guide: Cycle Time definition', status:'Implemented',
  },
  {
    name:'Flow Efficiency', category:'Kanban Flow Metrics',
    formula:'flowEfficiencyPct = (cycleTimeDays / leadTimeDays) × 100',
    inputs:'Cycle Time (active work), Lead Time (end-to-end)',
    why:'Shows what % of total delivery time was spent actively working vs waiting in queues.',
    benefit:'Identifies process bottlenecks. Low efficiency signals large queues, not an overloaded team.',
    alternatives:'Raw cycle vs lead time comparison is hard to interpret. Percentage form (efficiency ratio) is a standard Kanban metric that enables cross-team and cross-period comparison.',
    usedIn:'KanbanThroughputPanel, Flow Health label, Excel Kanban Flow sheet',
    assumptions:'Both Lead Time and Cycle Time are calculable from the available fields.',
    limitations:'Cannot identify WHICH workflow stage creates the most queue time — value stream mapping is needed for that.',
    file:'src/services/metrics/kanbanFlow.service.ts',
    ref:'Kanban flow efficiency formula; ALGORITHM_SPEC.md §Flow Efficiency', status:'Implemented',
  },
  {
    name:'Aging WIP', category:'Kanban Flow Metrics',
    formula:'agingWip = COUNT(activeItems WHERE ageDays > threshold)\ndefault threshold: 14 days (configurable via /admin/settings)',
    inputs:'Status (active statuses), Created Date, threshold from data/health-thresholds.json',
    why:'Items stuck in active states signal blockers or over-commitment before they become critical.',
    benefit:'Early warning system for delivery risk. Drives WIP limit and process intervention conversations.',
    alternatives:'WIP count alone does not distinguish stuck vs. actively-worked items. Age threshold filter identifies specifically items that have been sitting too long.',
    usedIn:'KanbanThroughputPanel, Bottleneck Status calculation, dashboard Kanban section',
    assumptions:'Items with active status that are old are truly stuck, not just deprioritised.',
    limitations:'Cannot distinguish intentionally parked items from unintentionally blocked ones.',
    file:'src/services/metrics/kanbanFlow.service.ts; src/services/settings/thresholds.service.ts',
    ref:'Kanban aging WIP practice; 9.15 Configurable Health Thresholds', status:'Implemented',
  },
  {
    name:'Blocked Ratio', category:'Risk Metrics',
    formula:'blockedRatio = blockedIssues / totalIssues × 100',
    inputs:'Blocked Flag field (boolean or "true" string)',
    why:'High blocked ratio signals systemic process failures, not isolated incidents.',
    benefit:'Drives escalation decisions and WIP limit policy. Enables cross-sprint blocked ratio comparison.',
    alternatives:'Absolute blocked count grows with project size, making cross-team comparison meaningless. Ratio normalises for project size, enabling threshold-based alerting.',
    usedIn:'Dashboard health score, Risk Metrics section, Excel Risks & Blockers sheet',
    assumptions:'Blocked Flag is consistently set in Jira by the team.',
    limitations:'Teams that do not use the Blocked Flag will show 0% regardless of actual blockers.',
    file:'src/services/metrics/metrics.service.ts',
    ref:'Kanban flow impediment tracking', status:'Implemented',
  },
  {
    name:'Orphan Ratio', category:'Risk Metrics',
    formula:'orphanRatio = orphanCount / nonEpicIssueCount × 100\norphan = no resolvable parent after all hierarchy signals (configurable)',
    inputs:'Epic Link, Parent Key, Issue Key prefix, configurable rules from data/orphan-rules.json',
    why:'Orphan items are invisible in hierarchy-based reporting — a delivery risk, not just a data gap.',
    benefit:'Drives data quality improvements. Ensures roadmap and epic reporting is complete.',
    alternatives:'Absolute orphan count grows with project size. Ratio enables cross-project comparison and threshold alerting. Multi-signal orphan detection (not just Epic Link) gives more accurate results than binary field checks.',
    usedIn:'Dashboard health score, Data Quality card, Excel Orphan & Data Quality sheet, Work Item Explorer',
    assumptions:'Epic Link and Parent Key are used by the team when linking work to epics.',
    limitations:'Prefix inference reduces false orphan detection but may produce false positives for projects with shared key prefixes.',
    file:'src/services/settings/orphanRules.service.ts; src/services/dataQuality/dataQuality.service.ts',
    ref:'PATENT_DISCLOSURE.md §Orphan Risk Detection; TECHNICAL_METHOD.md §Method 4', status:'Implemented',
  },
  {
    name:'Data Quality Score', category:'Data Quality Metrics',
    formula:'score = 100 − Σ(weight × missingPct / 100) − orphanPenalty\nclamp(0,100)',
    inputs:'10 field checks: Done Date(14), In Progress Date(14), Story Points(12), Sprint(12), Epic Link(10), Created Date(10), Assignee(9), Sprint Start(9), Fix Version(6), Priority(4)',
    why:'Users need to know whether their Jira data is trustworthy before making decisions from it. A dashboard without a quality indicator encourages false confidence.',
    benefit:'Surfaces data gaps proactively. Prevents over-reliance on metrics calculated from incomplete data.',
    alternatives:'Simple missing-field count does not account for field criticality (Done Date matters more than Labels). Weighted score reflects which fields most affect metric reliability.',
    usedIn:'Column-mapping preview page, dashboard Data Quality card, confidence badge calculations, upload API warnings',
    assumptions:'Missing fields reduce metric reliability proportionally to their weight.',
    limitations:'Score is an approximation — 100% score does not guarantee perfectly accurate metrics, only complete fields.',
    file:'src/services/dataQuality/dataQuality.service.ts',
    ref:'9.1 Data Quality Score; ALGORITHM_SPEC.md', status:'Implemented',
  },
  {
    name:'Metric Confidence Score', category:'Data Quality Metrics',
    formula:'confidence level per KPI: High / Medium / Low / Unreliable / N/A\nbased on required-field presence rate and sample size',
    inputs:'Varies per KPI — required fields, fill rates, sample size (see metricConfidence.service.ts)',
    why:'Not every metric can be trusted equally. Missing In Progress Date means Cycle Time is an estimate, not a measurement.',
    benefit:'Per-KPI confidence badge prevents over-reliance on unreliable metrics. Empowers users to present numbers with appropriate caveats.',
    alternatives:'Hiding uncertain metrics is unhelpful — users need all signals even if imperfect. Showing metrics without confidence context is misleading. Per-metric badge is the best balance between transparency and usability.',
    usedIn:'Each dashboard KPI card confidence badge, column-mapping preview, Developer Portal Calculation Reference',
    assumptions:'Field presence is a reasonable proxy for data completeness.',
    limitations:'Does not detect incorrect values — only missing ones. A field present but badly formatted may show High confidence incorrectly.',
    file:'src/services/metrics/metricConfidence.service.ts',
    ref:'9.2 Metric Confidence Score; ALGORITHM_SPEC.md §Metric Confidence', status:'Implemented',
  },
  {
    name:'P50 / P75 / P85 / P95 Percentiles', category:'Forecasting and Percentiles',
    formula:'percentile(arr, p) = arr.sorted[CEIL(p/100 × arr.length) − 1]',
    inputs:'Lead Time or Cycle Time values for all completed items (sorted array)',
    why:'Mean is distorted by long-tail outliers (vacations, scope changes, delayed items). Percentiles are more robust for SLA commitments.',
    benefit:'P85 = "85% of items complete within X days" — the industry-standard delivery SLA target. Stakeholders get a defensible, statistically grounded commitment.',
    alternatives:'Mean (average) is pulled upward by outliers and unreliable for SLA promises. Median (P50) alone misses the tail risk that SLAs must capture. The combination of P50/P75/P85/P95 gives a complete picture.',
    usedIn:'Excel Cycle & Lead Time sheet, SLA recommendation section',
    assumptions:'Sufficient sample size (≥10 completed items) for reliable percentile estimates.',
    limitations:'Small samples produce unreliable percentile estimates. P95 especially needs large samples.',
    file:'src/services/export/excelSheets/cycleLeadTime.sheet.ts',
    ref:'ALGORITHM_SPEC.md §Percentile Computation; Kanban SLA practice', status:'Implemented',
  },
  {
    name:'Delivery Trend', category:'Scrum Metrics',
    formula:'trend = AVG(last3Sprints.throughput) − AVG(prev3Sprints.throughput)\nImproving if delta > 5%, Declining if delta < −5%, else Stable',
    inputs:'Sprint throughput count history — minimum 6 sprints for full Improving/Declining classification',
    why:'Single-sprint throughput is noisy. 3-sprint rolling average smooths random variation while remaining responsive to genuine change.',
    benefit:'Shows whether team velocity is genuinely accelerating, decelerating, or stable. Supports resource and capacity planning decisions.',
    alternatives:'Sprint-over-sprint delta is too noisy to be reliable. Exponential moving average would be more statistically correct but harder to explain to non-technical stakeholders. 3-sprint average is the best balance.',
    usedIn:'SprintThroughputPanel trend indicator chip, Excel Sprint Throughput sheet trend column',
    assumptions:'At least 3 sprints of history available in the export.',
    limitations:'Requires 6 sprints for a meaningful Improving/Declining verdict. Fewer sprints shows Stable by default.',
    file:'src/services/metrics/throughput.service.ts — calcTrend()',
    ref:'ALGORITHM_SPEC.md §Sprint Throughput Algorithm', status:'Implemented',
  },
  {
    name:'Sprint Goal Outcome', category:'Scrum Metrics',
    formula:'Met: completionPct ≥ 90%\nPartially Met: ≥ 60%\nMissed: < 60% (sprint has ended)\nAt Risk: < 60% (sprint still active)',
    inputs:'sprint completionPct, sprintEnd date vs today',
    why:'Binary pass/fail (done / not done) is too harsh for complex sprints where 89% completion is effectively the same as 95%.',
    benefit:'Provides nuanced retrospective input and is used in sprint comparison and delivery confidence reporting.',
    alternatives:'Binary Met/Missed classification penalises good sprints with one incomplete item. 4-level classification gives contextual nuance while remaining objective and formula-driven.',
    usedIn:'SprintThroughputPanel goal outcome chip, Sprint Comparison panel, Excel Sprint Throughput sheet',
    assumptions:'Sprint End date is available and accurate in the Jira export.',
    limitations:'Does not capture sprint goal quality, team intent, or planned vs. unplanned scope.',
    file:'src/services/metrics/throughput.service.ts — goalOutcome()',
    ref:'Scrum Guide: Sprint Goal; ALGORITHM_SPEC.md §Sprint Throughput', status:'Implemented',
  },
  {
    name:'Carryover Items', category:'Scrum Metrics',
    formula:'carryover = committedCount − completedCount (items committed but not done by sprint end)',
    inputs:'Sprint field, Done Date, Sprint End date',
    why:'Carryover reveals over-commitment patterns and sprint instability that completion rate alone hides.',
    benefit:'Used in retrospectives to tune future sprint capacity and improve commitment accuracy.',
    alternatives:'Completion rate alone does not show what was deferred — a 60% completion sprint could mean 2 carryover items or 20. Explicit carryover count is needed for accurate retrospective analysis.',
    usedIn:'SprintThroughputPanel carryover chip, Sprint Comparison panel, Excel Sprint Throughput sheet',
    assumptions:'Items not done by sprint end are counted as carryover (some teams intentionally carry over items).',
    limitations:'Does not distinguish planned carryover (known before sprint start) from unexpected (commitment failure).',
    file:'src/services/metrics/throughput.service.ts',
    ref:'Scrum sprint stability metrics', status:'Implemented',
  },
  {
    name:'Added Scope', category:'Scrum Metrics',
    formula:'addedScopeCount = COUNT(issues WHERE addedAfterSprintStart = true OR commitmentType = "added")',
    inputs:'Added After Sprint Start field, Commitment Type field, Scope Change Type field',
    why:'Scope creep disrupts sprint predictability and is a leading indicator of missed commitments.',
    benefit:'Makes scope injection visible as a pattern, driving sprint planning discipline and stakeholder expectation management.',
    alternatives:'Commitment ratio (committed/total) hides the direction of change. Explicit added scope count identifies the specific source of sprint instability and enables targeted process improvement.',
    usedIn:'SprintThroughputPanel scope stats, MidSprintDeliveryPanel pattern detection, Sprint Comparison',
    assumptions:'Jira export includes scope change fields (Added After Sprint Start, Commitment Type).',
    limitations:'Teams that do not track scope changes show 0 regardless of the actual amount of scope injection.',
    file:'src/services/metrics/throughput.service.ts',
    ref:'Scrum sprint scope stability', status:'Implemented',
  },
  {
    name:'Flow Health', category:'Kanban Flow Metrics',
    formula:'Healthy: bottleneck=None AND flowEfficiency ≥ 50%\nAt Risk: bottleneck=Moderate OR flowEfficiency < 50%\nDegraded: bottleneck=Severe OR flowEfficiency < 30%',
    inputs:'flowEfficiencyPct (from Cycle/Lead Time), bottleneckStatus (from Aging WIP + Blocked)',
    why:'Single labelled health status is more immediately actionable in standups than interpreting two raw percentages.',
    benefit:'Drives WIP or process interventions with a clear, named signal rather than requiring manual threshold interpretation.',
    alternatives:'Showing raw efficiency % and bottleneck % separately requires mental thresholds. Labelled status (Healthy/At Risk/Degraded) is immediately actionable and consistent across teams.',
    usedIn:'KanbanThroughputPanel health badge, Excel Kanban Flow sheet flow health column',
    assumptions:'Cycle Time and Lead Time are calculable from the export data.',
    limitations:'Thresholds (50%/30% efficiency) are based on industry Kanban practices and may not suit all team contexts.',
    file:'src/services/metrics/kanbanFlow.service.ts — flowHealth()',
    ref:'Kanban flow health indicators; David Anderson Kanban book', status:'Implemented',
  },
  {
    name:'Bottleneck Status', category:'Kanban Flow Metrics',
    formula:'riskRatio = (agingWipCount + blockedCount) / totalActiveItems\nNone: < 10%; Mild: < 25%; Moderate: < 40%; Severe: ≥ 40%',
    inputs:'agingWipCount (active items over age threshold), blockedCount, totalActiveItems',
    why:'Detects flow impediments at the system level, beyond just counting individual blocked items.',
    benefit:'Drives WIP limit decisions and queue management policy. Input to Flow Health classification.',
    alternatives:'Blocked count alone varies with team size. Risk ratio normalises by active items, enabling cross-team comparison and threshold-based alerting without needing team-size adjustments.',
    usedIn:'KanbanThroughputPanel bottleneck badge, Flow Health label calculation',
    assumptions:'Aging WIP threshold correctly identifies stuck items (default 14 days, configurable).',
    limitations:'Percentage-based — very small teams (< 5 active items) may show high ratio from a single blocked item.',
    file:'src/services/metrics/kanbanFlow.service.ts — bottleneck()',
    ref:'Kanban bottleneck detection; TECHNICAL_METHOD.md §Method 6', status:'Implemented',
  },
  {
    name:'Release Readiness', category:'Delivery Health',
    formula:'readinessPct = completedInRelease / releaseScope × 100\nGo: ≥ 95% complete, no blockers, no open bugs\nConditional Go: ≥ 80%, ≤ 1 blocker, ≤ 2 open bugs\nNo-Go: < 80% complete, or blockers, or > 2 open bugs',
    inputs:'Fix Version/s field, Status, Issue Type (Bug), Blocked Flag',
    why:'Reduces manual release readiness reviews. Objective, data-driven criteria per fix version remove subjectivity from Go/No-Go decisions.',
    benefit:'Enables consistent Go/No-Go decisions at the end of each sprint or release cycle, grounded in Jira data rather than gut feel.',
    alternatives:'Manual release checklists are inconsistent across teams and release managers. Objective formula-driven criteria applied to Jira data remove personal bias while remaining auditable.',
    usedIn:'/readiness page, Excel Release Readiness sheet, dashboard Readiness section',
    assumptions:'Fix Version is set on all release-scoped items in Jira.',
    limitations:'Cannot assess code quality, automated test coverage, or customer validation — only Jira field state.',
    file:'src/services/metrics/releaseReadiness.service.ts',
    ref:'9.21 Release Readiness Checklist; standard release gate criteria', status:'Implemented',
  },
  {
    name:'Recommendation Rules', category:'Recommendation Rules',
    formula:'10+ rule evaluations on metrics; each rule: threshold check → evidence string + priority (Critical/High/Medium/Low) + area + suggested owner + suggested action',
    inputs:'blockedIssues, criticalRatio, avgLeadTime, orphanRatio, defectRatio, sprint.avgCompletionPct, endLoadedCount, kanban.avgFlowEfficiency, storyPoints.total, unassignedRatio',
    why:'Deterministic rule engine ensures every recommendation is traceable to specific, verifiable data evidence. Users can see exactly why a recommendation was generated.',
    benefit:'Users act on specific, evidenced, prioritised actions rather than generic advice. Every recommendation includes: what the problem is, why it matters, who should fix it, and what to do.',
    alternatives:'AI-generated recommendations are non-deterministic and cannot be audited. Generic advice ("improve your process") is not actionable. Rule-based engine produces consistent, traceable, data-grounded recommendations.',
    usedIn:'Dashboard Recommendations section, Excel Recommendations sheet (17-sheet workbook), Customer View highlights',
    assumptions:'Rule thresholds are calibrated to industry Agile/Kanban norms. Teams can reconfigure thresholds via /admin/settings.',
    limitations:'Rules do not adapt to team-specific context unless thresholds are reconfigured in /admin/settings.',
    file:'src/services/export/recommendationEngine.ts — generateRecommendations()',
    ref:'TECHNICAL_METHOD.md §Method 7; ALGORITHM_SPEC.md §Recommendation Rule Engine', status:'Implemented',
  },
  {
    name:'Hierarchy Reconstruction', category:'Work Item Explorer Metrics',
    formula:'Step 1: explicit Parent Key field (confidence 1.0)\nStep 2: explicit Epic Link field (confidence 1.0)\nStep 3: Issue Key prefix match against known Epics (confidence 0.8)\nOrphan: no signal reaches confidence threshold (0.5)',
    inputs:'Issue Key, Issue Type, Epic Link, Parent Key',
    why:'Real Jira exports frequently have incomplete hierarchy data. Multi-signal inference recovers structure where single-field checks would produce excessive orphans.',
    benefit:'Work Item Explorer shows meaningful hierarchy even for partially-linked exports. Reduces orphan count, improves delivery structure visibility.',
    alternatives:'Using only explicit Parent Key misses Epic Link relationships. Using only Epic Link misses sub-tasks. Single-field checks produce 3–5× more orphans than multi-signal inference with confidence scoring.',
    usedIn:'Work Item Explorer (/explore), orphan detection logic, Orphan Ratio calculation',
    assumptions:'Key prefix convention (e.g. PROJ-123) is consistent within a project.',
    limitations:'Prefix matching may produce false positives for multi-team projects that share key prefixes.',
    file:'src/services/relations/hierarchy.service.ts — reconstructHierarchy()',
    ref:'PATENT_DISCLOSURE.md §Claim C-02; TECHNICAL_METHOD.md §Method 3; ALGORITHM_SPEC.md §Hierarchy Reconstruction', status:'Implemented',
  },
  {
    name:'Release Confidence Score', category:'Risk Metrics',
    formula:'clamp(0,100, (completionRate/100)×55 + (1−min(blocked/total,1))×25 + (1−min(critical/total,1))×12 + max(0, 8−defects×2))',
    inputs:'completionRate, blockedIssues, criticalCount (flow.critical), openDefects, totalIssues',
    why:'Health Score tracks overall project health. Release Confidence specifically tracks the four release-gate signals: completion, blockers, critical items, and open defects — giving a release-specific confidence trend.',
    benefit:'Teams can track whether their release readiness is improving sprint-over-sprint, not just whether the project is generally healthy.',
    alternatives:'Using Health Score alone conflates sprint velocity with release gate signals. Release Confidence is focused only on what blocks a release.',
    usedIn:'Upload route (stored per upload), /trends page (chart + stat card + log column)',
    assumptions:'Blocking issues are already tracked in the Blocked Issues count. Defects = openDefects from metrics.',
    limitations:'Score does not account for fix version assignment or release date proximity. It is a proxy metric, not a formal release gate.',
    file:'src/lib/releaseConfidence.ts — computeReleaseConfidence()',
    ref:'ALGORITHM_SPEC.md §Release Confidence Score Algorithm; TECHNICAL_METHOD.md §Method 15', status:'Implemented',
  },
  {
    name:'Team Health Score', category:'Delivery Health',
    formula:'clamp(0,100, (doneIssues/max(total,1))×50 + (1−min(criticalCount/max(total,1),1))×30 + (1−min(blockedCount/max(total,1),1))×20)',
    inputs:'doneIssues, totalIssues, criticalCount (open critical items), blockedCount (open items with "block" in reason)',
    why:'capacity[] gives workload counts but no health comparison. A per-assignee score enables managers to identify who is healthy vs at risk before retrospectives.',
    benefit:'Side-by-side team comparison with scores, bands, and charts — data-driven retro discussions without manual aggregation.',
    alternatives:'Using completion rate alone ignores quality signals. Using load share alone ignores delivery risk. Team Health Score combines all three.',
    usedIn:'/teams page — scorecards, comparison charts, detail table',
    assumptions:'Done status is one of: done, closed, resolved (case-insensitive). "Blocked" is detected from reason string containing "block".',
    limitations:'Does not account for issue complexity or story point weight. Two assignees with the same score may have very different workload complexity.',
    file:'src/lib/teamHealth.ts — computeTeamHealth()',
    ref:'ALGORITHM_SPEC.md §Team Health Score Algorithm; TECHNICAL_METHOD.md §Method 16', status:'Implemented',
  },
  {
    name:'Portfolio Score', category:'Delivery Health',
    formula:'clamp(0,100, weightedAvg(epics.progress)×0.40 + weightedAvg(projects.completionRate)×0.30 + sprint.averageCompletionPct×0.20 + dataQuality.score×0.10)',
    inputs:'metrics.epics[].progress (issue-weighted), metrics.projects[].completionRate (issue-weighted), throughput.sprint.averageCompletionPct, dataQuality.score',
    why:'Individual metrics (health score, sprint throughput, epic progress) each tell part of the story. A unified portfolio score gives programme leads a single number for cross-team delivery health.',
    benefit:'Programme leads can open /portfolio before a steering committee and immediately see whether the portfolio is Excellent, Good, Moderate, At Risk, or Critical — without aggregating multiple pages.',
    alternatives:'Health Score is issue-level; it does not weight epics or projects. Averaging individual team health scores ignores epic/project structure. Portfolio Score is the only metric that spans all delivery dimensions.',
    usedIn:'/portfolio page — score banner, KPI strip, insights',
    assumptions:'Epics and projects are correctly populated from Jira export (Epic Link / Fix Version fields). Falls back to overall completionRate when epics or projects are absent.',
    limitations:'Does not account for project priority — all projects weighted equally by issue count. Data quality contribution is capped at 10 pts.',
    file:'src/lib/portfolioHealth.ts — computePortfolioSummary()',
    ref:'ALGORITHM_SPEC.md §Portfolio Score Algorithm; TECHNICAL_METHOD.md §Method 17', status:'Implemented',
  },
  {
    name:'Executive PDF Layout', category:'Delivery Health',
    formula:'3-column A4 landscape HTML: col1=(health score + 6 KPIs + insights), col2=(top 5 epics + top 4 team capacity), col3=(top 3 recommendations). All data escaped via esc(). @page{size:A4 landscape;margin:10mm}.',
    inputs:'DashboardMetrics (healthScore, completionRate, epics, capacity, insights, recommendations)',
    why:'Executives and steering committees need a one-page shareable summary, not a multi-page dashboard. A single print-optimised page eliminates manual aggregation and formatting.',
    benefit:'Directors can produce a print-ready executive summary in under 60 seconds from the Overview page, ready for steering committees and board updates.',
    alternatives:'Third-party PDF libraries (jsPDF, pdfmake) add 300–500 KB to the bundle and produce lower-quality output than the browser print engine. The browser approach produces smaller, higher-quality PDFs with zero dependencies.',
    usedIn:'/summary page — "Executive PDF" button',
    assumptions:'User has a modern browser with PDF print support (Chrome, Firefox, Safari, Edge all supported).',
    limitations:'Layout is fixed — A4 landscape only. Cannot be customised by the user. Colours depend on the browser\'s print-color-adjust setting.',
    file:'src/lib/executivePdf.ts — buildExecutivePdfHtml()',
    ref:'ALGORITHM_SPEC.md §Executive PDF Layout Algorithm; TECHNICAL_METHOD.md §Method 18', status:'Implemented',
  },
  {
    name:'Ops Health Score', category:'Risk Metrics',
    formula:'clamp(0,100, 100 − (sessionSecretSet?0:30) − (nodeEnvProd?0:10) − (regLocked?0:10) − min(failedImports,10) − (activeSessions===0&&users>0?5:0))',
    inputs:'sessionSecretSet (bool), nodeEnvProduction (bool), registrationLocked (bool), failedImports (count), activeSessions (count), totalUsers (count)',
    why:'Security score covers auth config. Ops score covers operational readiness — import reliability, session activity, and critical env vars. Two separate signals give admins a complete picture.',
    benefit:'Admins get a single actionable number for operational health without needing to manually count failed imports or check env vars.',
    alternatives:'Using only the security score conflates configuration risk with operational risk. Ops Score is specifically about whether the system is functioning correctly day-to-day.',
    usedIn:'/admin/diagnostics page, GET /api/admin/diagnostics',
    assumptions:'Failed import count is the total across all time. One failed import costs 1 pt regardless of age.',
    limitations:'Does not account for import volume context — 1 failure on 1 total import is different from 1 failure on 1000. Score resets to 100 base on each page refresh.',
    file:'app/api/admin/diagnostics/route.ts — opsScore computation',
    ref:'ALGORITHM_SPEC.md §System Diagnostics; TECHNICAL_METHOD.md §Admin Diagnostics; SRS.md FR-299', status:'Implemented',
  },
  {
    name:'Epic Delivery Forecast', category:'Delivery Health',
    formula:'sprintsRemaining = remaining / avgThroughput; weeksRemaining = ceil(sprintsRemaining × 2). Confidence: high < 2 sprints, medium < 5, low ≥ 5. Label: Complete / Within 2 weeks / ~N weeks / ~N months / Insufficient data.',
    inputs:'EpicSummary (issues, completedIssues, progress), avgThroughputPerSprint (mean completedCount across valid sprints)',
    why:'Epic health scores and completion percentages are backward-looking. Teams need a forward-looking answer: when will this epic finish at the current velocity?',
    benefit:'Delivery managers and product owners can identify which epics are on track, which are months out, and which lack enough data to forecast — all in one ranked roadmap view.',
    alternatives:'Manual estimation by the team is subjective and does not update automatically when new sprint data is uploaded. Gantt-style planning tools require manual input and do not integrate with Jira export data.',
    usedIn:'/roadmap page — EpicCard forecast label and confidence badge',
    assumptions:'2-week sprint cadence assumed for weeks calculation. Linear velocity assumed — no seasonality or team-size adjustment.',
    limitations:'Does not account for scope change mid-epic. Low confidence is expected for large epics or teams with inconsistent sprint data.',
    file:'app/roadmap/page.tsx — forecastEpic()',
    ref:'ALGORITHM_SPEC.md §Epic Delivery Forecast; SRS.md FR-326, FR-327; BR-115', status:'Implemented',
  },
  {
    name:'Delivery Forecast Status', category:'Delivery Health',
    formula:'complete if done≥total; insufficient_data if avgThroughput=0; on_track if sprintsRemaining≤6; at_risk if ≤12; off_track otherwise. Confidence: high<3, medium<6, low≥6 sprints.',
    inputs:'DashboardMetrics (summary.totalIssues, summary.completedIssues, sprint.sprints[].completedCount)',
    why:'Delivery managers need a single status answer — "are we on track?" — that accounts for both remaining work and current velocity, not just a completion percentage.',
    benefit:'Transforms raw sprint throughput into a clear delivery outlook (on_track/at_risk/off_track) with colour-coded status, a burn-up chart, and actionable recommendations.',
    alternatives:'Completion % alone cannot answer "are we on track?" without knowing the target date and velocity. Sprint burndown requires a target capacity per sprint that Jira exports do not always provide.',
    usedIn:'/forecast page — status banner, burn-up chart, recommendations',
    assumptions:'2-week sprint cadence assumed. Linear velocity assumed. Blocked issues not automatically deducted from throughput.',
    limitations:'Forecast is only as reliable as sprint history quality. Single outlier sprints can skew avgThroughput significantly.',
    file:'app/forecast/page.tsx — computeForecast()',
    ref:'ALGORITHM_SPEC.md §Delivery Forecast Status; SRS.md FR-328, FR-329; BR-116', status:'Implemented',
  },
  {
    name:'Retro Insights Engine', category:'Team Health',
    formula:'Rule-based: evaluate 8 independent conditions on RetroForm, each producing 0 or 1 string suggestion. Output is string[] of all matching suggestions.',
    inputs:'RetroForm (goalMet, blockers[], actions[], wentWell[])',
    why:'Retrospective action quality depends on recognising patterns: repeated blockers, missing accountability, unset timelines. A rule-based checker catches what teams commonly overlook under time pressure.',
    benefit:'Teams get instant objective feedback on their retrospective without a facilitator — missing owners, due dates, and unresolved blockers are flagged automatically on submit.',
    alternatives:'LLM-based suggestions would produce richer text but add API latency, cost, and privacy risk for team data. A deterministic rule engine is fast, private, and predictable.',
    usedIn:'/retro page — insights view after form submit',
    assumptions:'All observations are text-only. No persistence — insights are computed from in-memory form state.',
    limitations:'Rules are fixed and generic. Does not learn from historical retros or cross-sprint patterns.',
    file:'app/retro/page.tsx — generateInsights()',
    ref:'ALGORITHM_SPEC.md §Retro Insights Engine; SRS.md FR-332; BR-117', status:'Implemented',
  },
];

type CalcCategory = typeof CALCULATIONS[0]['category'];
const CALC_CATEGORIES = [...new Set(CALCULATIONS.map(c => c.category))] as CalcCategory[];

const DOC_SLUGS = new Set(['brd','srs','use-cases','scenarios','test-cases','user-journeys','dev-guide','deployment']);
// cloud-sync is in INLINE — no API fetch needed (handled by INLINE check in go())

// ─── Page ─────────────────────────────────────────────────────────────────────

const INTERACTIVE_SECTIONS = new Set(['packages', 'calculations']);

export default function DeveloperPage() {
  const [active,    setActive]    = useState('quickstart');
  const [html,      setHtml]      = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [navOpen,      setNavOpen]      = useState(false);
  // Global search
  const [globalSearch, setGlobalSearch] = useState('');
  // Package Reference state
  const [pkgSearch, setPkgSearch] = useState('');
  const [pkgScope,  setPkgScope]  = useState('all');
  const [pkgStatus, setPkgStatus] = useState('all');
  // Calculation Reference state
  const [calcSearch,   setCalcSearch]   = useState('');
  const [calcCategory, setCalcCategory] = useState('all');
  const [expandedCalc, setExpandedCalc] = useState<string | null>(null);

  const go = useCallback(async (id: string) => {
    setActive(id);
    setNavOpen(false);
    setError(null);

    if (INLINE[id]) {
      setHtml(renderMd(INLINE[id]));
      return;
    }

    if (INTERACTIVE_SECTIONS.has(id)) { setHtml(''); return; }
    if (DOC_SLUGS.has(id)) {
      setLoading(true);
      setHtml('');
      try {
        const res = await fetch('/api/docs?slug=' + id);
        if (!res.ok) throw new Error('Document unavailable — run npm run build to generate product docs.');
        const data = await res.json();
        setHtml(renderMd(data.content));
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => { go('quickstart'); }, [go]);

  const groups = Array.from(new Set(SECTIONS.map(s => s.group)));

  return (
    <div className="flex w-full min-h-[calc(100vh-var(--header-height,52px))]">

        {/* Mobile toggle */}
        <button
          onClick={() => setNavOpen(v => !v)}
          className="lg:hidden fixed bottom-5 right-5 z-50 w-12 h-12 rounded-full text-white shadow-xl flex items-center justify-center font-bold"
          style={{ background: 'var(--dc-acc, #E85D12)' }}
          aria-label="Toggle navigation"
        >
          {navOpen ? '✕' : '☰'}
        </button>

        {/* Sidebar */}
        <aside
          className={[
            'fixed lg:sticky lg:top-[52px]',
            'top-[52px] bottom-0 left-0',
            'z-30',
            'w-60 shrink-0',
            'overflow-y-auto',
            'px-2 py-4 flex flex-col gap-0.5',
            'transition-transform duration-200',
            navOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          ].join(' ')}
          style={{ background: 'rgba(5,5,5,0.95)', borderRight: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}
        >
          <div className="px-3 pb-3 mb-2" style={{ borderBottom: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--dc-p1, #F2F2F2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Developer Portal</p>
            <p style={{ fontSize: 11, color: 'var(--dc-p2, #909090)', marginTop: 2 }}>Delivery Clarity v4.6</p>
            {/* Global search */}
            <div className="relative mt-2">
              <input
                type="text"
                value={globalSearch}
                onChange={e => setGlobalSearch(e.target.value)}
                placeholder="Search portal…"
                className="w-full px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[rgba(232,93,18,0.4)]"
                style={{
                  background: 'var(--dc-s2, #1E1E1E)',
                  border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))',
                  borderRadius: 8,
                  color: 'var(--dc-p1, #F2F2F2)',
                }}
              />
              {globalSearch && (
                <button type="button" onClick={() => setGlobalSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs"
                  style={{ color: 'var(--dc-p3, #505050)' }}>✕</button>
              )}
            </div>
          </div>

          {groups.map(group => (
            <div key={group} className="mb-3">
              <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--dc-p3, #505050)', textTransform: 'uppercase', letterSpacing: '0.09em', padding: '4px 12px' }}>{group}</p>
              {SECTIONS.filter(s => s.group === group).map(s => {
                const isActive = active === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => go(s.id)}
                    className="w-full text-left py-2 rounded-lg text-xs font-medium mb-0.5 transition-all"
                    style={{
                      background: isActive ? 'rgba(232,93,18,0.11)' : 'transparent',
                      color: isActive ? 'var(--dc-acc2, #FF8A4C)' : 'var(--dc-p2, #909090)',
                      borderLeft: isActive ? '2px solid var(--dc-acc, #E85D12)' : '2px solid transparent',
                      paddingLeft: isActive ? 10 : 12,
                      paddingRight: 12,
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          ))}

          <div className="mt-auto pt-3 px-3" style={{ borderTop: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>
            <p style={{ fontSize: 10, color: 'var(--dc-p3, #505050)' }}>© 2026 Ali Abu Ras</p>
            <p className="truncate" style={{ fontSize: 10, color: 'var(--dc-p3, #505050)' }}>aliaburas80@gmail.com</p>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 px-4 sm:px-8 py-6 overflow-auto">

          {/* ── Global Search Results ───────────────────────────────────────── */}
          {globalSearch.trim() && (() => {
            const q = globalSearch.trim().toLowerCase();
            const matchedCalcs = CALCULATIONS.filter(c =>
              c.name.toLowerCase().includes(q) ||
              c.formula.toLowerCase().includes(q) ||
              c.why.toLowerCase().includes(q) ||
              c.usedIn.toLowerCase().includes(q) ||
              c.file.toLowerCase().includes(q) ||
              c.category.toLowerCase().includes(q)
            );
            const matchedPkgs = PACKAGES.filter(p =>
              p.name.toLowerCase().includes(q) ||
              p.usedFor.toLowerCase().includes(q) ||
              p.feature.toLowerCase().includes(q)
            );
            const matchedSects = SECTIONS.filter(s =>
              s.label.toLowerCase().includes(q) ||
              s.id.toLowerCase().includes(q)
            );
            const total = matchedCalcs.length + matchedPkgs.length + matchedSects.length;

            return (
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <h2 style={{ fontSize: 14, fontWeight: 800, color: 'var(--dc-p1, #F2F2F2)' }}>Search results for &quot;{globalSearch}&quot;</h2>
                  <span style={{ fontSize: 12, color: 'var(--dc-p3, #505050)' }}>{total} match{total !== 1 ? 'es' : ''}</span>
                  <button type="button" onClick={() => setGlobalSearch('')}
                    className="ml-auto text-xs font-semibold"
                    style={{ color: 'var(--dc-acc2, #FF8A4C)' }}>Clear search</button>
                </div>

                {total === 0 && (
                  <div className="py-8 text-center" style={{ fontSize: 13, color: 'var(--dc-p3, #505050)' }}>No results found for &quot;{globalSearch}&quot;</div>
                )}

                {matchedSects.length > 0 && (
                  <div className="mb-5">
                    <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--dc-p3, #505050)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Sections ({matchedSects.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {matchedSects.map(s => (
                        <button key={s.id} type="button"
                          onClick={() => { setGlobalSearch(''); go(s.id); }}
                          className="text-xs font-semibold rounded-lg px-3 py-1.5 transition-all"
                          style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))', color: 'var(--dc-p2, #909090)' }}
                          onMouseEnter={e => { e.currentTarget.style.color = 'var(--dc-acc2, #FF8A4C)'; e.currentTarget.style.border = '1px solid rgba(232,93,18,0.22)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--dc-p2, #909090)'; e.currentTarget.style.border = '1px solid var(--dc-bdr, rgba(255,255,255,0.07))'; }}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {matchedCalcs.length > 0 && (
                  <div className="mb-5">
                    <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--dc-p3, #505050)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Calculations ({matchedCalcs.length})</p>
                    <div className="space-y-2">
                      {matchedCalcs.map(c => (
                        <button key={c.name} type="button"
                          onClick={() => { setGlobalSearch(''); setExpandedCalc(c.name); go('calculations'); }}
                          className="w-full text-left rounded-xl p-3 transition-all"
                          style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}
                          onMouseEnter={e => (e.currentTarget.style.border = '1px solid var(--dc-bdr2, rgba(255,255,255,0.13))')}
                          onMouseLeave={e => (e.currentTarget.style.border = '1px solid var(--dc-bdr, rgba(255,255,255,0.07))')}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--dc-p1, #F2F2F2)' }}>{c.name}</span>
                            <span className="chip c-nt" style={{ fontSize: 9, borderRadius: 4 }}>{c.category}</span>
                            <span className={c.status === 'Implemented' ? 'chip c-gr' : 'chip c-am'} style={{ fontSize: 9, borderRadius: 4, marginLeft: 'auto' }}>{c.status}</span>
                          </div>
                          <p style={{ fontSize: 10, color: 'var(--dc-p3, #505050)', fontFamily: 'var(--font-mono, monospace)' }} className="truncate">{c.formula.slice(0, 80)}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {matchedPkgs.length > 0 && (
                  <div className="mb-5">
                    <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--dc-p3, #505050)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Packages ({matchedPkgs.length})</p>
                    <div className="space-y-2">
                      {matchedPkgs.map(p => (
                        <button key={p.name} type="button"
                          onClick={() => { setGlobalSearch(''); setPkgSearch(p.name); go('packages'); }}
                          className="w-full text-left rounded-xl p-3 transition-all"
                          style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}
                          onMouseEnter={e => (e.currentTarget.style.border = '1px solid var(--dc-bdr2, rgba(255,255,255,0.13))')}
                          onMouseLeave={e => (e.currentTarget.style.border = '1px solid var(--dc-bdr, rgba(255,255,255,0.07))')}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--dc-acc2, #FF8A4C)', fontFamily: 'var(--font-mono, monospace)' }}>{p.name}</span>
                            <span style={{ fontSize: 11, color: 'var(--dc-p3, #505050)' }}>{p.version}</span>
                            <span className={p.status === 'Installed' ? 'chip c-gr' : 'chip c-am'} style={{ fontSize: 9, borderRadius: 4, marginLeft: 'auto' }}>{p.status}</span>
                          </div>
                          <p style={{ fontSize: 11, color: 'var(--dc-p2, #909090)' }} className="truncate">{p.usedFor}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Breadcrumb — always visible */}
          {!globalSearch.trim() && (
          <div className="flex items-center gap-2 mb-5 flex-wrap" style={{ fontSize: 12 }}>
            <span style={{ fontWeight: 500, color: 'var(--dc-p2, #909090)' }}>Developer Portal</span>
            <span style={{ color: 'var(--dc-p3, #505050)' }}>›</span>
            <span style={{ fontWeight: 600, color: 'var(--dc-p1, #F2F2F2)' }}>
              {SECTIONS.find(s => s.id === active)?.label ?? active}
            </span>
            {DOC_SLUGS.has(active) && (
              <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(232,93,18,0.10)', border: '1px solid rgba(232,93,18,0.20)', color: 'var(--dc-acc2, #FF8A4C)' }}>
                From product/
              </span>
            )}
          </div>
          )}

          {!globalSearch.trim() && <>
          {loading && (
            <div className="flex items-center gap-3 py-16 justify-center" style={{ color: 'var(--dc-p3, #505050)' }}>
              <div className="w-6 h-6 rounded-full animate-spin"
                style={{ border: '2px solid rgba(232,93,18,0.2)', borderTopColor: 'var(--dc-acc, #E85D12)' }} />
              <span style={{ fontSize: 13, fontWeight: 500 }}>Loading document…</span>
            </div>
          )}

          {error && !loading && (
            <div className="rounded-xl p-5 my-4"
              style={{ background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.18)' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#fca5a5', marginBottom: 4 }}>⚠ Failed to load document</p>
              <p style={{ fontSize: 13, color: '#fca5a5' }}>{error}</p>
            </div>
          )}

          {/* ── Package Reference ── */}
          {active === 'packages' && (
            <div className="max-w-5xl">
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--dc-p1, #F2F2F2)', marginBottom: 4 }}>Package Reference</h2>
              <p style={{ fontSize: 13, color: 'var(--dc-p2, #909090)', marginBottom: 14 }}>All packages used by Delivery Clarity — version, purpose, scope, and risk if removed.</p>
              {/* Filters */}
              <div className="flex flex-wrap gap-3 mb-4">
                <input type="text" placeholder="Search packages…" value={pkgSearch} onChange={e => setPkgSearch(e.target.value)}
                  className="flex-1 min-w-[180px] px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-[rgba(232,93,18,0.3)]"
                  style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))', borderRadius: 8, color: 'var(--dc-p1, #F2F2F2)' }} />
                <select value={pkgScope} onChange={e => setPkgScope(e.target.value)}
                  className="px-3 py-1.5 text-sm outline-none"
                  style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))', borderRadius: 8, color: 'var(--dc-p2, #909090)' }}>
                  {['all','Client','Server','Shared','Dev-only'].map(s => <option key={s} value={s}>{s === 'all' ? 'All scopes' : s}</option>)}
                </select>
                <select value={pkgStatus} onChange={e => setPkgStatus(e.target.value)}
                  className="px-3 py-1.5 text-sm outline-none"
                  style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))', borderRadius: 8, color: 'var(--dc-p2, #909090)' }}>
                  {['all','Installed','Planned'].map(s => <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>)}
                </select>
              </div>
              <div className="overflow-x-auto rounded-2xl"
                style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: 'var(--dc-s1, #141414)', borderBottom: '1px solid var(--dc-bdr2, rgba(255,255,255,0.13))' }}>
                      {['Package','Version','Used For','Feature / Area','Scope','Status','Risk if Removed'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', fontSize: 10, fontWeight: 700, color: 'var(--dc-p3, #505050)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', textAlign: 'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PACKAGES.filter(p =>
                      (!pkgSearch || p.name.toLowerCase().includes(pkgSearch.toLowerCase()) || p.usedFor.toLowerCase().includes(pkgSearch.toLowerCase())) &&
                      (pkgScope === 'all' || p.scope === pkgScope) &&
                      (pkgStatus === 'all' || p.status === pkgStatus)
                    ).map(p => (
                      <tr key={p.name}
                        style={{ borderBottom: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono,monospace)', fontWeight: 700, color: 'var(--dc-acc2, #FF8A4C)', whiteSpace: 'nowrap' }}>{p.name}</td>
                        <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono,monospace)', color: 'var(--dc-p3, #505050)', whiteSpace: 'nowrap' }}>{p.version}</td>
                        <td style={{ padding: '8px 12px', color: 'var(--dc-p2, #909090)', maxWidth: 200 }}>{p.usedFor}</td>
                        <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                          <span style={{ background: 'rgba(232,93,18,0.10)', color: 'var(--dc-acc2, #FF8A4C)', padding: '1px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>{p.feature}</span>
                        </td>
                        <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: 4,
                            ...(p.scope === 'Client'   ? { background: 'rgba(34,197,94,0.10)',  color: '#4ade80'  } :
                                p.scope === 'Server'   ? { background: 'rgba(124,58,237,0.10)', color: '#c4b5fd' } :
                                p.scope === 'Dev-only' ? { background: 'rgba(255,255,255,0.06)', color: 'var(--dc-p3, #505050)' } :
                                                         { background: 'rgba(20,184,166,0.10)', color: '#5eead4' }),
                          }}>{p.scope}</span>
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <span className={p.status === 'Installed' ? 'chip c-gr' : 'chip c-am'} style={{ borderRadius: 4 }}>{p.status}</span>
                        </td>
                        <td style={{ padding: '8px 12px', color: 'var(--dc-p2, #909090)', maxWidth: 200, fontSize: 11 }}>{p.risk}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p style={{ fontSize: 11, color: 'var(--dc-p3, #505050)', marginTop: 10 }}>{PACKAGES.filter(p => p.status === 'Installed').length} installed · {PACKAGES.filter(p => p.status === 'Planned').length} planned</p>
            </div>
          )}

          {/* ── Calculation Reference ── */}
          {active === 'calculations' && (
            <div className="max-w-5xl">
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--dc-p1, #F2F2F2)', marginBottom: 4 }}>Calculation Reference</h2>
              <p style={{ fontSize: 13, color: 'var(--dc-p2, #909090)', marginBottom: 14 }}>Every major metric, formula, and calculation used by Delivery Clarity — with purpose, assumptions, and code location.</p>
              {/* Filters */}
              <div className="flex flex-wrap gap-3 mb-5">
                <input type="text" placeholder="Search metrics…" value={calcSearch} onChange={e => setCalcSearch(e.target.value)}
                  className="flex-1 min-w-[200px] px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-[rgba(232,93,18,0.3)]"
                  style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))', borderRadius: 8, color: 'var(--dc-p1, #F2F2F2)' }} />
                <select value={calcCategory} onChange={e => setCalcCategory(e.target.value)}
                  className="px-3 py-1.5 text-sm outline-none"
                  style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))', borderRadius: 8, color: 'var(--dc-p2, #909090)' }}>
                  <option value="all">All categories</option>
                  {CALC_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                {CALCULATIONS.filter(c =>
                  (calcCategory === 'all' || c.category === calcCategory) &&
                  (!calcSearch || c.name.toLowerCase().includes(calcSearch.toLowerCase()) || c.formula.toLowerCase().includes(calcSearch.toLowerCase()))
                ).map(calc => {
                  const isExpanded = expandedCalc === calc.name;
                  return (
                    <div key={calc.name} className="rounded-xl overflow-hidden"
                      style={{ background: 'var(--dc-s2, #1E1E1E)', border: isExpanded ? '1px solid rgba(232,93,18,0.2)' : '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>
                      <button type="button" onClick={() => setExpandedCalc(isExpanded ? null : calc.name)}
                        className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors"
                        onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--dc-p1, #F2F2F2)' }}>{calc.name}</span>
                            <span className="chip c-nt" style={{ fontSize: 9, borderRadius: 4 }}>{calc.category}</span>
                            <span className={calc.status === 'Implemented' ? 'chip c-gr' : 'chip c-am'} style={{ fontSize: 9, borderRadius: 4 }}>{calc.status}</span>
                          </div>
                          <p style={{ fontSize: 10, color: 'var(--dc-p3, #505050)', fontFamily: 'var(--font-mono,monospace)', marginTop: 2 }} className="truncate">{calc.formula.split('\n')[0]}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button type="button" onClick={e => { e.stopPropagation(); navigator.clipboard?.writeText(calc.formula).catch(() => {}); }}
                            className="text-[10px] font-bold rounded px-2 py-0.5 transition-colors"
                            style={{ background: 'var(--dc-s3, #282828)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))', color: 'var(--dc-p2, #909090)' }}
                            title="Copy formula">
                            Copy formula
                          </button>
                          <span style={{ color: 'var(--dc-p3, #505050)', transition: 'transform 0.15s', display: 'inline-block', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="px-5 pb-5 pt-4 space-y-3"
                          style={{ borderTop: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))', background: 'var(--dc-s1, #141414)' }}>
                          <div>
                            <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--dc-p3, #505050)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Formula</p>
                            <pre style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))', borderRadius: 8, padding: '10px 14px', fontSize: 11, fontFamily: 'var(--font-mono,monospace)', color: 'var(--dc-p1, #F2F2F2)', whiteSpace: 'pre-wrap' }}>{calc.formula}</pre>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                              ['Input Fields', calc.inputs],
                              ['Used In', calc.usedIn],
                              ['Why We Use It', calc.why],
                              ['Why Not Alternatives', calc.alternatives],
                              ['Benefit & Decision Supported', calc.benefit],
                              ['Assumptions', calc.assumptions],
                              ['Limitations', calc.limitations],
                            ].map(([label, value]) => (
                              <div key={label as string}>
                                <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--dc-p3, #505050)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{label}</p>
                                <p style={{ fontSize: 11, color: 'var(--dc-p2, #909090)', lineHeight: 1.5 }}>{value}</p>
                              </div>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-4 pt-2" style={{ borderTop: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>
                            <div>
                              <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--dc-p3, #505050)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Related File</p>
                              <code style={{ fontSize: 10, fontFamily: 'var(--font-mono,monospace)', color: 'var(--dc-acc2, #FF8A4C)', background: 'rgba(232,93,18,0.08)', padding: '1px 6px', borderRadius: 3 }}>{calc.file}</code>
                            </div>
                            <div>
                              <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--dc-p3, #505050)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Reference</p>
                              <p style={{ fontSize: 11, color: 'var(--dc-p2, #909090)' }}>{calc.ref}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p style={{ fontSize: 11, color: 'var(--dc-p3, #505050)', marginTop: 14 }}>{CALCULATIONS.length} calculations documented · {CALCULATIONS.filter(c => c.status === 'Implemented').length} implemented</p>
            </div>
          )}

          {!loading && !error && html && (
            <article
              className="max-w-4xl"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
          </>} {/* end !globalSearch.trim() */}
        </main>
    </div>
  );
}
