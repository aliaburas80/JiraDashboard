// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
import type { DashboardMetrics, FlowItem } from '@/types/metrics';
import { getHealthBand, HEALTH_COLORS } from './utils';

// ── Executive PDF — one-page print-optimised summary ─────────────────────────
export async function exportExecutivePdf(metrics: DashboardMetrics): Promise<void> {
  const { downloadExecutivePdf } = await import('@/lib/executivePdf');
  downloadExecutivePdf(metrics);
}

// ── Excel — Smart statistical workbook (17 sheets) ───────────────────────────
export async function exportToExcel(metrics: DashboardMetrics, filename = 'delivery-clarity-report.xlsx') {
  const { downloadInsightWorkbook } = await import('@/services/export/excelInsightExport.service');
  downloadInsightWorkbook(metrics, filename);
  // Track onboarding step
  try {
    localStorage.setItem('dc_downloaded_report', '1');
    const { markStepDone } = await import('./onboarding');
    markStepDone('download_report');
  } catch {}
}

// ── Excel — Legacy basic export (kept for internal use/testing) ───────────────
export async function exportToExcelBasic(metrics: DashboardMetrics, filename = 'jira-report.xlsx') {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  const items: FlowItem[] = (metrics.flow?.items ?? []) as FlowItem[];

  // Sheet: All Issues
  const issueRows = items.map(i => ({
    Key: i.key,
    Summary: i.summary,
    Type: i.type,
    Status: i.status,
    Sprint: i.sprint,
    Epic: i.epic,
    Assignee: i.assignee,
    Priority: i.priority,
    'Story Points': i.storyPoints ?? '',
    Health: i.health,
    Reason: i.reason,
    'Age (days)': i.ageDays ?? '',
    'Lead Time (days)': i.leadTimeDays ?? '',
    'Cycle Time (days)': i.cycleTimeDays ?? '',
    Created: i.createdDate,
    Started: i.startedDate,
    Done: i.doneDate,
    Labels: i.labels,
    Project: i.project,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(issueRows.length ? issueRows : [{}]), 'All Issues');

  // Sheet: Summary KPIs
  const sp = metrics.storyPoints ?? ({} as DashboardMetrics['storyPoints']);
  const flow = metrics.flow ?? ({} as DashboardMetrics['flow']);
  const summaryRows = [
    { Metric: 'Health Score',                Value: metrics.healthScore ?? 0 },
    { Metric: 'Total Issues',                Value: metrics.totalIssues ?? 0 },
    { Metric: 'Done Issues',                 Value: metrics.doneIssues ?? 0 },
    { Metric: 'Completion Rate (%)',         Value: metrics.completionRate ?? 0 },
    { Metric: 'Active Issues',               Value: metrics.activeIssues ?? 0 },
    { Metric: 'Blocked Issues',              Value: metrics.blockedIssues ?? 0 },
    { Metric: 'Open Defects',                Value: metrics.openDefects ?? 0 },
    { Metric: 'Avg Lead Time (days)',        Value: flow.averageLeadTimeDays ?? 0 },
    { Metric: 'Avg Cycle Time (days)',       Value: flow.averageCycleTimeDays ?? 0 },
    { Metric: 'Total Story Points',          Value: sp.totalStoryPoints ?? 0 },
    { Metric: 'Completed Story Points',      Value: sp.completedStoryPoints ?? 0 },
    { Metric: 'Story Point Completion (%)',  Value: sp.pointCompletionRate ?? 0 },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'Summary');

  // Sheet: High Risk
  const riskRows = items
    .filter(i => i.health === 'critical' || i.health === 'warning')
    .map(i => ({
      Key: i.key, Summary: i.summary, Status: i.status,
      Assignee: i.assignee, Health: i.health, Reason: i.reason,
      'Age (days)': i.ageDays ?? '',
    }));
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(riskRows.length ? riskRows : [{ Message: 'No high-risk items' }]),
    'High Risk',
  );

  // Sheet: Capacity
  if (metrics.capacity?.length) {
    const capRows = metrics.capacity.map(c => ({
      Assignee: c.assignee,
      'Total Issues': c.issues,
      'Active Issues': c.activeIssues,
      'Done Issues': c.doneIssues,
      'Story Points': c.storyPoints,
      'Done Story Points': c.doneStoryPoints,
      'Load Share (%)': Math.round(c.loadShare),
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(capRows), 'Capacity');
  }

  // Sheet: Sprints
  if (metrics.sprint?.hasSprintData && metrics.sprint.sprints?.length) {
    const sprintRows = metrics.sprint.sprints.map(s => ({
      Sprint: s.name,
      Issues: s.issues,
      'Completed Issues': s.completedIssues,
      'Completion Rate (%)': s.completionRate,
      'Committed Points': s.committedPoints,
      'Completed Points': s.completedPoints,
      'Point Completion Rate (%)': s.pointCompletionRate,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sprintRows), 'Sprints');
  }

  XLSX.writeFile(wb, filename);
}

// ── HTML ──────────────────────────────────────────────────────────────────────
function esc(s: unknown): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function donutCss(segments: { value: number; color: string }[]): string {
  const total = Math.max(segments.reduce((s, seg) => s + seg.value, 0), 1);
  let cursor = 0;
  const stops = segments.map(seg => {
    const start = cursor;
    cursor += (seg.value / total) * 100;
    return `${seg.color} ${start.toFixed(1)}% ${cursor.toFixed(1)}%`;
  });
  return stops.length ? `conic-gradient(${stops.join(', ')})` : '#e2e8f0';
}

function section(title: string, icon: string, body: string): string {
  return `
  <section style="margin-bottom:24px;">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
      <span style="font-size:16px;">${icon}</span>
      <h2 style="margin:0;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:#64748b;">${esc(title)}</h2>
    </div>
    ${body}
  </section>`;
}

function card(content: string, extra = ''): string {
  return `<div style="background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:20px;${extra}">${content}</div>`;
}

function cardGrid(cards: string[], cols = 2): string {
  return `<div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:14px;">${cards.join('')}</div>`;
}

function cardTitle(t: string): string {
  return `<div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:#94a3b8;margin-bottom:14px;">${esc(t)}</div>`;
}

function donutCard(title: string, gradient: string, segments: { label: string; value: number; color: string }[], centerLabel: string, centerSub = ''): string {
  const legend = segments.filter(s => s.value > 0).map(s => {
    const total = Math.max(segments.reduce((a, b) => a + b.value, 0), 1);
    const pct = Math.round((s.value / total) * 100);
    return `
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">
        <span style="width:10px;height:10px;border-radius:50%;background:${s.color};flex-shrink:0;"></span>
        <span style="font-size:12px;color:#475569;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(s.label)}</span>
        <span style="font-size:12px;font-weight:700;color:#1e293b;">${s.value}</span>
        <span style="font-size:11px;color:#94a3b8;width:32px;text-align:right;">${pct}%</span>
      </div>`;
  }).join('');

  return card(`
    ${cardTitle(title)}
    <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap;">
      <div style="position:relative;width:120px;height:120px;border-radius:50%;background:${gradient};flex-shrink:0;">
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:72px;height:72px;border-radius:50%;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;">
          <span style="font-size:16px;font-weight:900;color:#0f172a;line-height:1;">${esc(centerLabel)}</span>
          ${centerSub ? `<span style="font-size:10px;color:#94a3b8;margin-top:2px;">${esc(centerSub)}</span>` : ''}
        </div>
      </div>
      <div style="flex:1;min-width:120px;">${legend}</div>
    </div>`);
}

function horizBars(title: string, rows: { label: string; value: number; sub?: string; color: string }[], maxVal: number): string {
  const bars = rows.map(r => {
    const w = Math.max(0, Math.min(100, maxVal > 0 ? (r.value / maxVal) * 100 : 0));
    return `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="font-size:12px;color:#475569;width:130px;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(r.label)}">${esc(r.label)}</span>
        <div style="flex:1;height:10px;border-radius:999px;background:#f1f5f9;overflow:hidden;">
          <div style="height:100%;border-radius:999px;background:${r.color};width:${w.toFixed(1)}%;"></div>
        </div>
        <span style="font-size:12px;font-weight:700;color:#1e293b;width:48px;text-align:right;flex-shrink:0;">${esc(r.sub ?? String(r.value))}</span>
      </div>`;
  }).join('');
  return card(`${cardTitle(title)}${bars || '<p style="font-size:13px;color:#94a3b8;font-style:italic;">No data.</p>'}`);
}

function ganttBars(title: string, rows: { label: string; pct: number; done: number; total: number; health: string }[]): string {
  const COLOR: Record<string, string> = { good: '#16a34a', warning: '#f59e0b', critical: '#dc2626' };
  const BG:    Record<string, string> = { good: 'rgba(22,163,74,.06)', warning: 'rgba(245,158,11,.08)', critical: 'rgba(220,38,38,.08)' };
  const bars = rows.map(r => {
    const c = COLOR[r.health] ?? '#cbd5e1';
    const bg = BG[r.health] ?? 'transparent';
    return `
      <div style="display:flex;align-items:center;gap:10px;border-radius:8px;padding:6px 4px;background:${bg};margin-bottom:4px;">
        <span style="font-size:12px;color:#334155;width:160px;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(r.label)}">${esc(r.label)}</span>
        <div style="flex:1;height:12px;border-radius:999px;background:#f1f5f9;overflow:hidden;position:relative;">
          <div style="height:100%;background:${c};width:${r.pct}%;border-radius:999px;"></div>
        </div>
        <div style="text-align:right;width:60px;flex-shrink:0;">
          <span style="font-size:12px;font-weight:900;color:${c};">${r.pct}%</span><br/>
          <span style="font-size:10px;color:#94a3b8;">${r.done}/${r.total}</span>
        </div>
      </div>`;
  }).join('');
  return card(`${cardTitle(title)}${bars || '<p style="font-size:13px;color:#94a3b8;font-style:italic;">No data.</p>'}`);
}

export function exportToHtml(
  metrics: DashboardMetrics,
  _filteredItems?: FlowItem[],
  filename = 'jira-report.html',
) {
  const band  = getHealthBand(metrics.healthScore ?? 0);
  const color = HEALTH_COLORS[band];
  const now   = new Date().toLocaleString();

  const flow     = (metrics.flow     ?? {}) as any;
  const sp       = (metrics.storyPoints ?? {}) as any;
  const items    = (flow.items ?? []) as any[];
  const total    = Math.max(items.length, 1);

  const DONE_ST   = ['done', 'closed', 'resolved'];
  const ACTIVE_ST = ['in progress', 'code review', 'qa', 'testing', 'uat'];
  const norm      = (v: unknown) => String(v ?? '').trim().toLowerCase();
  const PALETTE   = ['#2563eb','#14b8a6','#f59e0b','#dc2626','#7c3aed','#0891b2','#f97316','#16a34a'];

  // ── derived buckets (mirrors charts/page.tsx) ─────────────────────────────
  const doneBucket     = items.filter(i => DONE_ST.includes(norm(i.status))).length;
  const criticalBucket = items.filter(i => !DONE_ST.includes(norm(i.status)) && norm(i.health) === 'critical').length;
  const warningBucket  = items.filter(i => !DONE_ST.includes(norm(i.status)) && norm(i.health) === 'warning').length;
  const activeBucket   = items.filter(i => ACTIVE_ST.includes(norm(i.status)) && !DONE_ST.includes(norm(i.status)) && norm(i.health) !== 'critical' && norm(i.health) !== 'warning').length;
  const otherBucket    = Math.max(total - doneBucket - criticalBucket - warningBucket - activeBucket, 0);

  const deliverySegs = [
    { label: 'Done',        value: doneBucket,     color: '#16a34a' },
    { label: 'In Progress', value: activeBucket,   color: '#2563eb' },
    { label: 'At Risk',     value: warningBucket,  color: '#f59e0b' },
    { label: 'Critical',    value: criticalBucket, color: '#dc2626' },
    { label: 'Backlog',     value: otherBucket,    color: '#cbd5e1' },
  ].filter(s => s.value > 0);

  const healthSegs = [
    { label: 'Good',     value: flow.good     ?? 0, color: '#16a34a' },
    { label: 'Warning',  value: flow.warning  ?? 0, color: '#f59e0b' },
    { label: 'Critical', value: flow.critical ?? 0, color: '#dc2626' },
  ].filter(s => s.value > 0);

  const typeList  = ((metrics.types ?? []) as any[]).slice(0, 6);
  const typeSegs  = typeList.map((t: any, i: number) => ({ label: t.type, value: t.count, color: PALETTE[i % PALETTE.length] }));

  const spSegs = sp.totalStoryPoints > 0
    ? [{ label: 'Completed', value: sp.completedStoryPoints ?? 0, color: '#16a34a' },
       { label: 'Remaining', value: sp.remainingStoryPoints ?? 0, color: '#e2e8f0' }]
    : [];

  const capacity = ((metrics.capacity ?? []) as any[]).slice(0, 8);
  const maxLoad  = Math.max(...capacity.map((c: any) => c.loadShare ?? 0), 1);

  const sprints    = ((metrics.sprint?.sprints ?? []) as any[]).slice(0, 8).reverse();
  const maxSprint  = Math.max(...sprints.map((s: any) => s.issues ?? 0), 1);

  const epics = ((metrics.epics ?? []) as any[]).slice(0, 10);

  const quarters = ((metrics.quarters ?? []) as any[]).filter((q: any) => q.quarter !== 'No date').slice(0, 6).reverse();
  const maxQ     = Math.max(...quarters.map((q: any) => q.issues ?? 0), 1);

  const kanban    = ((metrics.kanban as any)?.byStatus ?? []) as any[];
  const maxKanban = Math.max(...kanban.slice(0, 8).map((k: any) => k.count ?? 0), 1);

  const labelStats = ((((metrics.labels as any)?.labelStats ?? []) as any[]).filter((l: any) => l.label !== '(unlabeled)').slice(0, 7));
  const maxLabel   = Math.max(...labelStats.map((l: any) => l.count ?? 0), 1);

  const prediction = metrics.prediction;
  const riskItems  = (flow.critical ?? 0) + (flow.warning ?? 0);

  const bandLabel: Record<string, string> = {
    excellent: 'Excellent', good: 'Good', moderate: 'Moderate', 'at-risk': 'At Risk', critical: 'Critical',
  };

  // ── Attention items ───────────────────────────────────────────────────────
  const topBlockers = items.filter(i => norm(i.health) === 'critical' && norm(i.reason ?? '').includes('block')).slice(0, 3);
  const topOverdue  = items.filter(i => Number(i.ageDays) > 10 && !DONE_ST.includes(norm(i.status))).slice(0, 3);
  const orphanCount = items.filter(i => i.isOrphan).length;

  const attentionCards: string[] = [];
  if (topBlockers.length) attentionCards.push(card(`
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
      <span style="font-size:20px;">🚫</span>
      <span style="font-size:24px;font-weight:900;color:#b91c1c;">${topBlockers.length}</span>
      <span style="font-size:13px;font-weight:700;color:#7f1d1d;">Blocker${topBlockers.length !== 1 ? 's' : ''}</span>
    </div>
    <p style="margin:0;font-size:12px;color:#b91c1c;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
      <strong>${esc(topBlockers[0].key)}</strong>: ${esc((topBlockers[0].summary ?? topBlockers[0].reason ?? '').slice(0, 60))}
    </p>`, 'background:#fef2f2;border-color:#fecaca;'));
  if (topOverdue.length) attentionCards.push(card(`
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
      <span style="font-size:20px;">⏰</span>
      <span style="font-size:24px;font-weight:900;color:#b45309;">${topOverdue.length}</span>
      <span style="font-size:13px;font-weight:700;color:#78350f;">Overdue</span>
    </div>
    <p style="margin:0;font-size:12px;color:#b45309;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
      <strong>${esc(topOverdue[0].key)}</strong>: open ${Math.round(Number(topOverdue[0].ageDays) || 0)} days
    </p>`, 'background:#fffbeb;border-color:#fde68a;'));
  if (orphanCount > 0) attentionCards.push(card(`
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
      <span style="font-size:20px;">👻</span>
      <span style="font-size:24px;font-weight:900;color:#475569;">${orphanCount}</span>
      <span style="font-size:13px;font-weight:700;color:#334155;">Orphan${orphanCount !== 1 ? 's' : ''}</span>
    </div>
    <p style="margin:0;font-size:12px;color:#64748b;">Items without epic or parent</p>`, 'background:#f8fafc;'));

  // ── Epic / Sprint gantt rows ───────────────────────────────────────────────
  const ganttRows = epics.length
    ? epics.map((e: any) => ({
        label:  (e.epic || 'No epic').slice(0, 36),
        pct:    e.progress ?? 0,
        done:   e.completedIssues ?? 0,
        total:  e.issues ?? 0,
        health: e.critical > 0 ? 'critical' : e.warning > 0 ? 'warning' : 'good',
      }))
    : sprints.map((s: any) => ({
        label:  (s.name || 'Sprint').slice(0, 36),
        pct:    s.completionRate ?? 0,
        done:   s.completedIssues ?? 0,
        total:  s.issues ?? 0,
        health: s.completionRate >= 80 ? 'good' : s.completionRate >= 50 ? 'warning' : 'critical',
      }));

  // ── Build HTML ────────────────────────────────────────────────────────────
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Delivery Clarity — Report</title>
  <style>
    *,*::before,*::after{box-sizing:border-box;}
    body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;color:#1e293b;}
    @media print{body{background:#fff;} .no-print{display:none!important;} section{break-inside:avoid;}}
    @media(max-width:640px){.two-col{grid-template-columns:1fr!important;} .three-col{grid-template-columns:1fr!important;}}
  </style>
</head>
<body>

<!-- ══ TOP HEADER ══════════════════════════════════════════════════════════ -->
<div style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);color:#fff;padding:28px 32px;">
  <div style="max-width:1100px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
    <div>
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#94a3b8;margin-bottom:4px;">Delivery Clarity</div>
      <h1 style="margin:0;font-size:26px;font-weight:900;line-height:1.2;">Delivery Report</h1>
      <p style="margin:6px 0 0;font-size:13px;color:#94a3b8;">Generated ${esc(now)}</p>
    </div>
    <!-- Health badge -->
    <div style="display:flex;align-items:center;gap:16px;">
      <div style="width:72px;height:72px;border-radius:50%;border:4px solid ${color};display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(255,255,255,.07);">
        <span style="font-size:22px;font-weight:900;color:${color};line-height:1;">${metrics.healthScore ?? 0}</span>
        <span style="font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.04em;">/ 100</span>
      </div>
      <div>
        <div style="font-size:20px;font-weight:900;color:${color};">${bandLabel[band] ?? band}</div>
        <div style="font-size:13px;color:#94a3b8;">${metrics.completionRate ?? 0}% complete · ${metrics.doneIssues ?? 0}/${metrics.totalIssues ?? 0} done</div>
        ${prediction && !prediction.complete && prediction.daysRemaining != null
          ? `<div style="margin-top:4px;font-size:12px;color:#7dd3fc;">Est. completion: ~${prediction.daysRemaining}d${prediction.predictedDate ? ' (' + esc(prediction.predictedDate) + ')' : ''}</div>`
          : prediction?.complete ? `<div style="margin-top:4px;font-size:12px;color:#86efac;">All issues complete ✓</div>` : ''}
      </div>
    </div>
  </div>
</div>

<div style="max-width:1100px;margin:0 auto;padding:28px 24px;">

<!-- ══ 1. SUMMARY KPIs ═══════════════════════════════════════════════════════ -->
${section('Key Metrics', '📊', `
  <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;" class="three-col">
    ${[
      { label: 'Completion',     value: `${metrics.completionRate ?? 0}%`,            color: '#16a34a' },
      { label: 'Health Alerts',  value: riskItems,                                    color: '#dc2626' },
      { label: 'Active Issues',  value: metrics.activeIssues ?? 0,                   color: '#d97706' },
      { label: 'Avg Lead Time',  value: `${flow.averageLeadTimeDays ?? 0}d`,          color: '#2563eb' },
      { label: 'Avg Cycle Time', value: `${flow.averageCycleTimeDays ?? 0}d`,         color: '#0f766e' },
      { label: 'Total Issues',   value: metrics.totalIssues ?? 0,                    color: '#2563eb' },
      { label: 'Done Issues',    value: metrics.doneIssues ?? 0,                     color: '#16a34a' },
      { label: 'Blocked',        value: metrics.blockedIssues ?? 0,                  color: '#dc2626' },
      { label: 'Open Defects',   value: metrics.openDefects ?? 0,                    color: '#dc2626' },
      { label: 'Story Points',   value: sp.totalStoryPoints > 0 ? `${sp.pointCompletionRate ?? 0}%` : '—', color: '#7c3aed' },
    ].map(k => `
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#94a3b8;margin-bottom:6px;">${esc(k.label)}</div>
        <div style="font-size:24px;font-weight:900;color:${k.color};line-height:1;">${esc(String(k.value))}</div>
      </div>`).join('')}
  </div>`)}

<!-- ══ 2. INSIGHTS & ATTENTION ════════════════════════════════════════════════ -->
${(metrics.insights ?? []).length || attentionCards.length ? section('Insights & Attention', '💡', `
  <div style="display:grid;grid-template-columns:${attentionCards.length ? '1fr 1fr' : '1fr'};gap:14px;" class="two-col">
    ${(metrics.insights ?? []).length ? card(`
      ${cardTitle('Key Insights')}
      <ul style="margin:0;padding:0 0 0 18px;">
        ${(metrics.insights ?? []).map(i => `<li style="margin-bottom:6px;font-size:13px;color:#334155;">${esc(i)}</li>`).join('')}
      </ul>`) : ''}
    ${attentionCards.length ? `<div style="display:flex;flex-direction:column;gap:12px;">${attentionCards.join('')}</div>` : ''}
  </div>`) : ''}

<!-- ══ 3. CHARTS ═════════════════════════════════════════════════════════════ -->
${section('Delivery Charts', '📈', `
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:14px;" class="two-col">
    ${donutCard('Delivery Composition', donutCss(deliverySegs), deliverySegs,
        `${metrics.completionRate ?? 0}%`, 'complete')}
    ${donutCard('Flow Health Mix', donutCss(healthSegs), healthSegs,
        String(items.length), 'issues')}
    ${typeSegs.length ? donutCard('Issue Types', donutCss(typeSegs), typeSegs,
        typeList.reduce((a: number, t: any) => a + (t.count ?? 0), 0), 'total') : ''}
    ${spSegs.length ? donutCard('Story Points', donutCss(spSegs), spSegs,
        `${sp.pointCompletionRate ?? 0}%`, 'complete') : ''}
  </div>`)}

<!-- ══ 4. TEAM CAPACITY ═══════════════════════════════════════════════════════ -->
${capacity.length ? section('Team Capacity', '👥', `
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:14px;" class="two-col">
    ${horizBars('Load Share (%)', capacity.map((c: any) => ({
        label: c.assignee || '(unassigned)',
        value: c.issues,
        sub:   `${Math.round(c.loadShare ?? 0)}%`,
        color: '#2563eb',
      })), maxLoad)}
    ${horizBars('Issues by Assignee', capacity.map((c: any) => ({
        label: c.assignee || '(unassigned)',
        value: c.issues,
        sub:   `${c.doneIssues ?? 0}/${c.issues}`,
        color: '#16a34a',
      })), Math.max(...capacity.map((c: any) => c.issues ?? 0), 1))}
  </div>`) : ''}

<!-- ══ 5. EPIC / SPRINT PROGRESS ══════════════════════════════════════════════ -->
${ganttRows.length ? section(epics.length ? 'Epic Progress' : 'Sprint Performance', '🗓️',
  ganttBars(epics.length ? 'Progress by Epic' : 'Completion by Sprint', ganttRows)) : ''}

<!-- ══ 6. STATUS & QUARTER THROUGHPUT ════════════════════════════════════════ -->
${kanban.length || quarters.length ? section('Status & Throughput', '📋', `
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:14px;" class="two-col">
    ${kanban.length ? horizBars('Issues by Status', kanban.slice(0, 8).map((k: any) => ({
        label: k.status ?? k.name ?? '?',
        value: k.count ?? 0,
        color: '#0891b2',
      })), maxKanban) : ''}
    ${quarters.length ? horizBars('Quarter Throughput', quarters.map((q: any) => ({
        label: q.quarter,
        value: q.issues ?? 0,
        color: '#7c3aed',
      })), maxQ) : ''}
  </div>`) : ''}

<!-- ══ 7. LABELS ══════════════════════════════════════════════════════════════ -->
${labelStats.length ? section('Label Distribution', '🏷️',
  horizBars('Top Labels', labelStats.map((l: any) => ({
    label: l.label,
    value: l.count ?? 0,
    color: '#14b8a6',
  })), maxLabel)) : ''}

<!-- ══ 8. FLOW METRICS ════════════════════════════════════════════════════════ -->
${section('Flow Metrics', '⚡', card(`
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;" class="two-col">
    ${[
      { label: 'Avg Lead Time',  value: `${flow.averageLeadTimeDays ?? 0}d`,  sub: `${flow.leadTimeSampleSize ?? 0} items`, color: '#2563eb' },
      { label: 'Avg Cycle Time', value: `${flow.averageCycleTimeDays ?? 0}d`, sub: `${flow.cycleTimeSampleSize ?? 0} items`, color: '#0f766e' },
      { label: 'Critical Items', value: flow.critical ?? 0,                   sub: 'need immediate action', color: '#dc2626' },
      { label: 'Warning Items',  value: flow.warning  ?? 0,                   sub: 'need attention', color: '#f59e0b' },
    ].map(m => `
      <div style="text-align:center;padding:12px 8px;">
        <div style="font-size:28px;font-weight:900;color:${m.color};line-height:1;">${esc(String(m.value))}</div>
        <div style="font-size:11px;font-weight:700;color:#1e293b;margin-top:4px;">${esc(m.label)}</div>
        <div style="font-size:11px;color:#94a3b8;margin-top:2px;">${esc(m.sub)}</div>
      </div>`).join('')}
  </div>`))}

<!-- ══ FOOTER ═════════════════════════════════════════════════════════════════ -->
<footer style="text-align:center;padding:20px 0;border-top:1px solid #e2e8f0;margin-top:8px;">
  <p style="margin:0;font-size:12px;color:#94a3b8;">
    Generated by <strong style="color:#2563eb;">Delivery Clarity</strong> · ${esc(now)}
  </p>
  <p style="margin:4px 0 0;font-size:12px;color:#64748b;font-weight:600;">Ali Abu Ras</p>
</footer>

</div><!-- /max-width -->
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
