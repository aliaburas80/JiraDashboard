// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// MPE-01 — CSV-injection safety for the 7 pages that gained export capability
// (/work-explorer, /teams, /portfolio, /delivery-mix, /charts, /customer,
// /roadmap). Every new CSV-building function must route formula-triggering
// field values (=, +, -, @) through buildSafeCsv per CLAUDE.md §38.5.

import { buildWorkExplorerCsv } from '../services/export/workExplorerListExport.service';
import { buildTeamsCsv } from '../services/export/teamsExport.service';
import { buildPortfolioEpicsCsv } from '../services/export/portfolioExport.service';
import { buildDeliveryMixCsv } from '../services/export/deliveryMixExport.service';
import { buildRoadmapCsv } from '../services/export/roadmapExport.service';
import { buildChartsCsv } from '../services/export/chartsExport.service';
import { buildCustomerReportCsv } from '../services/export/customerReportExport.service';
import type { FlowItem } from '../types/metrics';
import type { TeamHealthEntry } from '../lib/teamHealth';
import type { EpicSummary } from '../lib/portfolioHealth';
import type { DeliveryMixExportRow } from '../services/export/deliveryMixExport.service';
import type { RoadmapExportRow } from '../services/export/roadmapExport.service';

function makeFlowItem(overrides: Partial<FlowItem> = {}): FlowItem {
  return {
    key: 'PROJ-1', summary: 'Normal summary', type: 'Story', status: 'In Progress',
    highLevelStatus: 'In Progress', sprint: 'Sprint 1', epic: 'EPIC-1', isOrphan: false,
    assignee: 'Ali', priority: 'High', storyPoints: 3, createdDate: '', startedDate: '',
    doneDate: '', leadTimeDays: null, cycleTimeDays: null, ageDays: 5, activeAgeDays: null,
    labels: '', parent: '', project: 'PROJ', health: 'critical', reason: 'Blocked',
    fixVersion: '', blocked: false,
    ...overrides,
  } as FlowItem;
}

function makeTeamEntry(overrides: Partial<TeamHealthEntry> = {}): TeamHealthEntry {
  return {
    assignee: 'Ali', totalIssues: 10, doneIssues: 5, activeIssues: 3, blockedCount: 1,
    criticalCount: 1, warningCount: 0, goodCount: 8, storyPoints: 20, doneStoryPoints: 10,
    loadShare: 25, completionPct: 50, healthScore: 70, band: 'Healthy', avgOpenAgeDays: 4,
    ...overrides,
  };
}

function makeEpic(overrides: Partial<EpicSummary> = {}): EpicSummary {
  return {
    name: 'Checkout Revamp', issues: 10, completedIssues: 4, storyPoints: 20,
    doneStoryPoints: 8, progress: 40, pointProgress: 40, critical: 1, warning: 2,
    good: 7, health: 'warning',
    ...overrides,
  };
}

function makeDeliveryMixRow(overrides: Partial<DeliveryMixExportRow> = {}): DeliveryMixExportRow {
  return {
    type: 'Bug', cat: 'bug', count: 12, pct: 24, done: 6, completionRate: 50,
    storyPoints: 10, good: 5, warning: 4, critical: 3,
    averageCycleTimeDays: 3.2, cycleTimeSampleSize: 6,
    averageLeadTimeDays: 8.1, leadTimeSampleSize: 6,
    ...overrides,
  };
}

function makeRoadmapRow(overrides: Partial<RoadmapExportRow> = {}): RoadmapExportRow {
  return {
    name: 'Checkout Revamp', health: 'warning', progress: 40, issues: 10,
    completedIssues: 4, remainingIssues: 6, storyPoints: 20, doneStoryPoints: 8,
    critical: 1, warning: 2, forecastLabel: '~4 weeks', sprintsRemaining: 2,
    weeksRemaining: 4, confidence: 'medium',
    ...overrides,
  };
}

// ── TC-MPE01-01: Work Explorer CSV neutralizes formula-like fields ───────────

test('TC-MPE01-01: work explorer CSV neutralizes a formula-triggering summary', () => {
  const csv = buildWorkExplorerCsv([makeFlowItem({ summary: '=cmd|\'/c calc\'!A1', assignee: '+HYPERLINK("http://evil.example","click")' })]);
  expect(csv).toContain("'=cmd|'/c calc'!A1");
  expect(csv).toContain('\'+HYPERLINK(""http://evil.example"",""click"")');
});

test('TC-MPE01-01b: work explorer CSV leaves benign fields unchanged', () => {
  const csv = buildWorkExplorerCsv([makeFlowItem({ summary: 'Fix login bug', assignee: 'Ali' })]);
  expect(csv).toContain('Fix login bug');
  expect(csv).toContain('Ali');
});

// ── TC-MPE01-02: Teams CSV neutralizes formula-like fields ───────────────────

test('TC-MPE01-02: teams CSV neutralizes a formula-triggering assignee name', () => {
  const csv = buildTeamsCsv([makeTeamEntry({ assignee: '=cmd|\'/c calc\'!A1' })]);
  expect(csv).toContain("'=cmd|'/c calc'!A1");
});

test('TC-MPE01-02b: teams CSV leaves benign fields unchanged', () => {
  const csv = buildTeamsCsv([makeTeamEntry({ assignee: 'Priya' })]);
  expect(csv).toContain('Priya');
});

// ── TC-MPE01-03: Portfolio epics CSV neutralizes formula-like fields ─────────

test('TC-MPE01-03: portfolio epics CSV neutralizes a formula-triggering epic name', () => {
  const csv = buildPortfolioEpicsCsv([makeEpic({ name: '+HYPERLINK("http://evil.example","click")' })]);
  expect(csv).toContain('\'+HYPERLINK(""http://evil.example"",""click"")');
});

test('TC-MPE01-03b: portfolio epics CSV leaves benign fields unchanged', () => {
  const csv = buildPortfolioEpicsCsv([makeEpic({ name: 'Checkout Revamp' })]);
  expect(csv).toContain('Checkout Revamp');
});

// ── TC-MPE01-04: Delivery Mix CSV neutralizes formula-like fields ────────────

test('TC-MPE01-04: delivery mix CSV neutralizes a formula-triggering issue type', () => {
  const csv = buildDeliveryMixCsv([makeDeliveryMixRow({ type: '@SUM(A1)' })]);
  expect(csv).toContain("'@SUM(A1)");
});

test('TC-MPE01-04b: delivery mix CSV leaves benign fields unchanged', () => {
  const csv = buildDeliveryMixCsv([makeDeliveryMixRow({ type: 'Bug' })]);
  expect(csv).toContain('Bug');
});

// ── TC-MPE01-05: Roadmap CSV neutralizes formula-like fields ─────────────────

test('TC-MPE01-05: roadmap CSV neutralizes a formula-triggering epic name', () => {
  const csv = buildRoadmapCsv([makeRoadmapRow({ name: '-10+20' })]);
  expect(csv).toContain("'-10+20");
});

test('TC-MPE01-05b: roadmap CSV leaves benign fields unchanged', () => {
  const csv = buildRoadmapCsv([makeRoadmapRow({ name: 'Checkout Revamp' })]);
  expect(csv).toContain('Checkout Revamp');
});

// ── TC-MPE01-06: Charts sectioned CSV neutralizes formula-like fields ────────

test('TC-MPE01-06: charts sectioned CSV neutralizes a formula-triggering label', () => {
  const csv = buildChartsCsv([
    { title: 'Team Load', header: ['Assignee', 'Load %'], rows: [['=cmd|\'/c calc\'!A1', 42]] },
  ]);
  expect(csv).toContain("'=cmd|'/c calc'!A1");
});

test('TC-MPE01-06b: charts sectioned CSV leaves benign fields unchanged and separates sections', () => {
  const csv = buildChartsCsv([
    { title: 'Key Metrics', header: ['Metric', 'Value'], rows: [['Complete', '42%']] },
    { title: 'Team Load', header: ['Assignee', 'Load %'], rows: [['Ali', 25]] },
  ]);
  expect(csv).toContain('Key Metrics');
  expect(csv).toContain('Team Load');
  expect(csv).toContain('Ali');
});

// ── TC-MPE01-07: Customer report CSV neutralizes formula-like fields ─────────

test('TC-MPE01-07: customer report CSV neutralizes a formula-triggering risk text', () => {
  const csv = buildCustomerReportCsv({
    kpis: [{ label: 'Overall Done', val: '40%', sub: '4 of 10 items' }],
    statusDistribution: [{ label: 'Done', count: 4, pct: 40 }],
    epics: [],
    risks: [{ level: 'high', text: '+HYPERLINK("http://evil.example","click")' }],
  });
  expect(csv).toContain('\'+HYPERLINK(""http://evil.example"",""click"")');
});

test('TC-MPE01-07b: customer report CSV leaves benign fields unchanged', () => {
  const csv = buildCustomerReportCsv({
    kpis: [{ label: 'Overall Done', val: '40%', sub: '4 of 10 items' }],
    statusDistribution: [{ label: 'Done', count: 4, pct: 40 }],
    epics: [{ epic: 'Checkout Revamp', healthLabel: 'On Track', progress: 40, completedIssues: 4, issues: 10, critical: 0 }],
    risks: [],
  });
  expect(csv).toContain('Checkout Revamp');
  expect(csv).toContain('No significant delivery risks identified at this time.');
});
