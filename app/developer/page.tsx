'use client';
// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.

import { useState, useEffect, useCallback } from 'react';
import AppShell from '@/components/layout/AppShell';

// ─── Simple markdown renderer ─────────────────────────────────────────────────

function inlineMd(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-slate-800">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="bg-slate-100 text-blue-700 px-1 py-0.5 rounded text-xs font-mono">$1</code>');
}

function renderMd(md: string): string {
  if (!md) return '';
  const lines = md.split('\n');
  const out: string[] = [];
  let inCode = false;
  let inTable = false;
  let inUl = false;
  let inOl = false;

  const closeOpenBlocks = () => {
    if (inUl)  { out.push('</ul>');    inUl = false; }
    if (inOl)  { out.push('</ol>');    inOl = false; }
    if (inTable){ out.push('</table>'); inTable = false; }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (!inCode) {
        closeOpenBlocks();
        const lang = line.slice(3).trim() || 'text';
        out.push(`<pre class="bg-slate-900 text-green-300 rounded-lg p-4 overflow-x-auto text-xs my-4 font-mono leading-relaxed whitespace-pre"><code class="language-${lang}">`);
        inCode = true;
      } else {
        out.push('</code></pre>');
        inCode = false;
      }
      continue;
    }
    if (inCode) { out.push(line.replace(/</g,'&lt;').replace(/>/g,'&gt;') + '\n'); continue; }

    if (line.startsWith('#### ')) { closeOpenBlocks(); out.push(`<h4 class="text-sm font-bold text-slate-800 mt-4 mb-1">${inlineMd(line.slice(5))}</h4>`); continue; }
    if (line.startsWith('### '))  { closeOpenBlocks(); out.push(`<h3 class="text-base font-bold text-slate-800 mt-5 mb-2 border-b border-slate-100 pb-1">${inlineMd(line.slice(4))}</h3>`); continue; }
    if (line.startsWith('## '))   { closeOpenBlocks(); out.push(`<h2 class="text-lg font-black text-slate-900 mt-7 mb-3 border-b-2 border-blue-100 pb-2">${inlineMd(line.slice(3))}</h2>`); continue; }
    if (line.startsWith('# '))    { closeOpenBlocks(); out.push(`<h1 class="text-2xl font-black text-slate-900 mt-6 mb-4">${inlineMd(line.slice(2))}</h1>`); continue; }

    if (line.startsWith('|')) {
      if (inUl || inOl) closeOpenBlocks();
      if (!inTable) {
        out.push('<div class="overflow-x-auto my-4"><table class="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">');
        inTable = true;
      }
      if (line.match(/^\|[-| :]+\|$/)) continue;
      const cells = line.split('|').filter((_c, idx, arr) => idx > 0 && idx < arr.length - 1);
      const nextLine = lines[i + 1] || '';
      const isHeader = nextLine.match(/^\|[-| :]+\|$/);
      const tag = isHeader ? 'th' : 'td';
      const cls = isHeader
        ? 'bg-slate-50 font-bold text-slate-600 uppercase tracking-wide px-3 py-2 border-b border-slate-200 text-left text-xs'
        : 'px-3 py-2 border-b border-slate-100 text-slate-700';
      out.push(`<tr>${cells.map(c => `<${tag} class="${cls}">${inlineMd(c.trim())}</${tag}>`).join('')}</tr>`);
      continue;
    }
    if (inTable && !line.startsWith('|')) { out.push('</table></div>'); inTable = false; }

    if (line.match(/^[-*] /)) {
      if (inOl) { out.push('</ol>'); inOl = false; }
      if (!inUl) { out.push('<ul class="list-disc list-inside space-y-1 my-3 text-sm text-slate-700 ml-2">'); inUl = true; }
      out.push(`<li class="leading-relaxed">${inlineMd(line.slice(2))}</li>`);
      continue;
    }
    if (line.match(/^\d+\. /)) {
      if (inUl) { out.push('</ul>'); inUl = false; }
      if (!inOl) { out.push('<ol class="list-decimal list-inside space-y-1 my-3 text-sm text-slate-700 ml-2">'); inOl = true; }
      out.push(`<li class="leading-relaxed">${inlineMd(line.replace(/^\d+\. /,''))}</li>`);
      continue;
    }
    if ((inUl || inOl) && line.trim() === '') { closeOpenBlocks(); out.push('<div class="my-1"></div>'); continue; }
    if (line.match(/^---+$/)) { closeOpenBlocks(); out.push('<hr class="my-5 border-slate-200" />'); continue; }
    if (line.trim() === '') { closeOpenBlocks(); out.push('<div class="my-2"></div>'); continue; }

    out.push(`<p class="text-sm text-slate-700 leading-relaxed my-1.5">${inlineMd(line)}</p>`);
  }
  if (inCode)  out.push('</code></pre>');
  if (inTable) out.push('</table></div>');
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
| /dashboard | Full delivery report — all sections |
| /developer | This page — documentation portal |
| /backend | Backend status — import logs + API health |
| /help | User guide — 21 sections |

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
  dashboard/page.tsx      Full delivery report
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
  sessionStorage.setItem('dc_metrics', JSON.stringify(metrics))
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
};

// ─── Nav config ───────────────────────────────────────────────────────────────

const SECTIONS = [
  { id: 'quickstart',    label: '🚀 Quick Start',        group: 'Getting Started' },
  { id: 'architecture',  label: '🏗️ Architecture',        group: 'Getting Started' },
  { id: 'api',           label: '🔌 API Reference',       group: 'Technical' },
  { id: 'services',      label: '⚙️ Services',             group: 'Technical' },
  { id: 'types',         label: '📐 TypeScript Types',    group: 'Technical' },
  { id: 'testing',       label: '🧪 Testing',             group: 'Technical' },
  { id: 'brd',           label: '📋 BRD',                 group: 'Product Docs' },
  { id: 'srs',           label: '📄 SRS',                 group: 'Product Docs' },
  { id: 'use-cases',     label: '🎯 Use Cases',           group: 'Product Docs' },
  { id: 'scenarios',     label: '🎬 Scenarios',           group: 'Product Docs' },
  { id: 'test-cases',    label: '✅ Test Cases',          group: 'Product Docs' },
  { id: 'user-journeys', label: '🗺️ User Journeys',       group: 'Product Docs' },
  { id: 'dev-guide',     label: '📖 Developer Guide',     group: 'Product Docs' },
];

const DOC_SLUGS = new Set(['brd','srs','use-cases','scenarios','test-cases','user-journeys','dev-guide']);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DeveloperPage() {
  const [active,  setActive]  = useState('quickstart');
  const [html,    setHtml]    = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState(false);

  const go = useCallback(async (id: string) => {
    setActive(id);
    setNavOpen(false);
    setError(null);

    if (INLINE[id]) {
      setHtml(renderMd(INLINE[id]));
      return;
    }

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
    <AppShell showNav>
      <div className="flex -mx-4 sm:-mx-6 min-h-[calc(100vh-8rem)]">

        {/* Mobile toggle */}
        <button
          onClick={() => setNavOpen(v => !v)}
          className="lg:hidden fixed bottom-5 right-5 z-50 w-12 h-12 rounded-full bg-blue-600 text-white shadow-xl flex items-center justify-center font-bold"
          aria-label="Toggle navigation"
        >
          {navOpen ? '✕' : '☰'}
        </button>

        {/* Sidebar */}
        <aside className={[
          'fixed lg:relative inset-y-0 left-0 z-40 w-60 shrink-0',
          'bg-slate-900 text-slate-200 overflow-y-auto',
          'px-2 py-4 flex flex-col gap-0.5',
          'transition-transform duration-200',
          navOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}>
          <div className="px-3 pb-3 mb-2 border-b border-slate-700">
            <p className="text-xs font-black text-white uppercase tracking-widest">Developer Portal</p>
            <p className="text-xs text-slate-400 mt-0.5">Delivery Clarity v2.0</p>
          </div>

          {groups.map(group => (
            <div key={group} className="mb-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-3 py-1">{group}</p>
              {SECTIONS.filter(s => s.group === group).map(s => (
                <button
                  key={s.id}
                  onClick={() => go(s.id)}
                  className={[
                    'w-full text-left px-3 py-2 rounded-lg text-sm font-medium mb-0.5 transition-colors',
                    active === s.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                  ].join(' ')}
                >
                  {s.label}
                </button>
              ))}
            </div>
          ))}

          <div className="mt-auto pt-3 border-t border-slate-700 px-3">
            <p className="text-xs text-slate-500">© 2026 Ali Abu Ras</p>
            <p className="text-xs text-slate-600 truncate">aburasali80@gmail.com</p>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 px-4 sm:px-8 py-6 overflow-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-5 flex-wrap">
            <span className="font-medium text-slate-500">Developer Portal</span>
            <span>›</span>
            <span className="text-blue-600 font-semibold">
              {SECTIONS.find(s => s.id === active)?.label ?? active}
            </span>
            {DOC_SLUGS.has(active) && (
              <span className="ml-auto bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                From product/
              </span>
            )}
          </div>

          {loading && (
            <div className="flex items-center gap-3 text-slate-500 py-16 justify-center">
              <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <span className="text-sm font-medium">Loading document…</span>
            </div>
          )}

          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 my-4">
              <p className="text-sm font-bold text-red-700 mb-1">⚠ Failed to load document</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {!loading && !error && html && (
            <article
              className="max-w-4xl"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
        </main>
      </div>
    </AppShell>
  );
}
