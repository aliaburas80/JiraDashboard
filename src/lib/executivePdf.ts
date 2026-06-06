// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
//
// Executive one-page PDF export — 9.33
// Generates a print-optimised single-page HTML document.
// Designed to fit on one A4/Letter page (landscape) when printed from any browser.
// No external PDF library — uses the browser's built-in print engine.

import type { DashboardMetrics } from '@/types/metrics';
import { getHealthBand, HEALTH_COLORS } from '@/lib/utils';
import { generateRecommendations } from '@/services/export/recommendationEngine';

const esc = (s: unknown) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const BAND_LABEL: Record<string, string> = {
  excellent: 'Excellent', good: 'Good', moderate: 'Moderate', 'at-risk': 'At Risk', critical: 'Critical',
};

export function buildExecutivePdfHtml(metrics: DashboardMetrics): string {
  const band       = getHealthBand(metrics.healthScore ?? 0);
  const scoreColor = HEALTH_COLORS[band];
  const bandLabel  = BAND_LABEL[band] ?? band;
  const now        = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const flow    = (metrics.flow     ?? {}) as any;
  const sp      = (metrics.storyPoints ?? {}) as any;
  const epics   = ((metrics.epics   ?? []) as any[]).slice(0, 5);
  const cap     = ((metrics.capacity ?? []) as any[]).slice(0, 4);
  const recs    = generateRecommendations(metrics).slice(0, 3);
  const insights= (metrics.insights ?? []).slice(0, 4);

  const kpis = [
    { label: 'Completion',    value: `${metrics.completionRate ?? 0}%`,       color: scoreColor },
    { label: 'Total Issues',  value: metrics.totalIssues ?? 0,                color: '#2563eb'  },
    { label: 'Done',          value: metrics.doneIssues  ?? 0,                color: '#16a34a'  },
    { label: 'Active',        value: metrics.activeIssues ?? 0,               color: '#f59e0b'  },
    { label: 'Blocked',       value: metrics.blockedIssues ?? 0,              color: metrics.blockedIssues ? '#dc2626' : '#94a3b8' },
    { label: 'Story Points',  value: sp.totalStoryPoints > 0 ? `${sp.pointCompletionRate ?? 0}%` : '—', color: '#7c3aed' },
  ];

  const kpiGrid = kpis.map(k => `
    <div style="background:#f8fafc;border-radius:8px;padding:10px 12px;text-align:center;">
      <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:4px;">${esc(k.label)}</div>
      <div style="font-size:20px;font-weight:900;color:${k.color};line-height:1;">${esc(String(k.value))}</div>
    </div>`).join('');

  const epicRows = epics.map(e => {
    const pct   = e.progress ?? 0;
    const color = (e.critical ?? 0) > 0 ? '#dc2626' : (e.warning ?? 0) > 0 ? '#f59e0b' : '#16a34a';
    return `
    <div style="margin-bottom:7px;">
      <div style="display:flex;justify-content:space-between;font-size:9px;margin-bottom:3px;">
        <span style="color:#334155;font-weight:600;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(e.epic || 'No epic')}">${esc((e.epic || 'No epic').slice(0, 28))}</span>
        <span style="font-weight:900;color:${color};">${pct}%</span>
      </div>
      <div style="height:5px;background:#e2e8f0;border-radius:9999px;overflow:hidden;">
        <div style="height:100%;background:${color};width:${pct}%;border-radius:9999px;"></div>
      </div>
    </div>`;
  }).join('');

  const teamRows = cap.map(c => {
    const done = c.doneIssues ?? 0;
    const total = Math.max(c.issues ?? 0, 1);
    const pct  = Math.round((done / total) * 100);
    const color = pct >= 70 ? '#16a34a' : pct >= 40 ? '#f59e0b' : '#dc2626';
    return `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;">
      <span style="font-size:9px;color:#475569;width:90px;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(c.assignee || '(unassigned)')}</span>
      <div style="flex:1;height:5px;background:#e2e8f0;border-radius:9999px;overflow:hidden;">
        <div style="height:100%;background:${color};width:${pct}%;border-radius:9999px;"></div>
      </div>
      <span style="font-size:9px;font-weight:700;color:${color};width:28px;text-align:right;flex-shrink:0;">${pct}%</span>
    </div>`;
  }).join('');

  const recRows = recs.map((r, i) => {
    const dot = r.priority === 'Critical' ? '#dc2626' : r.priority === 'High' ? '#f59e0b' : '#2563eb';
    return `
    <div style="display:flex;gap:6px;margin-bottom:6px;align-items:flex-start;">
      <span style="width:6px;height:6px;border-radius:50%;background:${dot};flex-shrink:0;margin-top:3px;"></span>
      <div>
        <div style="font-size:9px;font-weight:700;color:#1e293b;">${esc(r.text)}</div>
        <div style="font-size:8px;color:#64748b;margin-top:1px;">${esc(r.evidence.slice(0, 80))}</div>
      </div>
    </div>`;
  }).join('');

  const insightList = insights.map(i =>
    `<div style="font-size:9px;color:#475569;padding:3px 0;border-bottom:1px solid #f1f5f9;">› ${esc(i)}</div>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Delivery Clarity — Executive Summary</title>
  <style>
    *,*::before,*::after{box-sizing:border-box;}
    body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#fff;color:#1e293b;font-size:11px;}
    @page{size:A4 landscape;margin:10mm;}
    @media print{
      body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
      .no-print{display:none!important;}
    }
  </style>
</head>
<body>

<!-- HEADER -->
<div style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);color:#fff;padding:14px 20px;display:flex;align-items:center;justify-content:space-between;border-radius:8px 8px 0 0;">
  <div style="display:flex;align-items:center;gap:12px;">
    <!-- Brand mark -->
    <div style="width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#1455f5,#2563eb 48%,#17b8d6);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
      <svg viewBox="0 0 24 24" style="width:20px;height:20px;fill:white;" aria-hidden="true"><path d="M13.7 2.3 4.8 13.1c-.5.6-.1 1.5.7 1.5h5.2l-1 6.6c-.1.8.9 1.2 1.4.6l8.1-10.5c.5-.6.1-1.5-.7-1.5h-4.8l1.4-6.8c.2-.8-.9-1.3-1.4-.7Z"/></svg>
    </div>
    <div>
      <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#94a3b8;">Delivery Clarity</div>
      <div style="font-size:18px;font-weight:900;margin-top:2px;">Executive Summary</div>
      <div style="font-size:9px;color:#94a3b8;margin-top:2px;">${esc(now)}</div>
    </div>
  </div>
  <div style="display:flex;align-items:center;gap:12px;">
    <div style="width:56px;height:56px;border-radius:50%;border:3px solid ${scoreColor};display:flex;flex-direction:column;align-items:center;justify-content:center;">
      <span style="font-size:18px;font-weight:900;color:${scoreColor};line-height:1;">${metrics.healthScore ?? 0}</span>
      <span style="font-size:8px;color:#64748b;">/100</span>
    </div>
    <div>
      <div style="font-size:16px;font-weight:900;color:${scoreColor};">${esc(bandLabel)}</div>
      <div style="font-size:9px;color:#94a3b8;">${metrics.completionRate ?? 0}% complete · ${metrics.doneIssues ?? 0}/${metrics.totalIssues ?? 0} done</div>
    </div>
  </div>
</div>

<!-- BODY -->
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;padding:12px 0 0 0;">

  <!-- LEFT: KPIs + Insights -->
  <div>
    <div style="font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:#94a3b8;margin-bottom:6px;">Key Metrics</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:12px;">
      ${kpiGrid}
    </div>
    <div style="font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:#94a3b8;margin-bottom:5px;">Key Insights</div>
    <div>${insightList}</div>
  </div>

  <!-- CENTRE: Epic Progress + Team Capacity -->
  <div>
    <div style="font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:#94a3b8;margin-bottom:6px;">Epic Progress (top ${epics.length})</div>
    <div style="margin-bottom:12px;">${epicRows || '<div style="font-size:9px;color:#94a3b8;">No epic data</div>'}</div>
    <div style="font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:#94a3b8;margin-bottom:6px;">Team Capacity (top ${cap.length})</div>
    <div>${teamRows || '<div style="font-size:9px;color:#94a3b8;">No assignee data</div>'}</div>
  </div>

  <!-- RIGHT: Recommendations -->
  <div>
    <div style="font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:#94a3b8;margin-bottom:6px;">Top Recommendations</div>
    <div>${recRows || '<div style="font-size:9px;color:#94a3b8;">No recommendations generated</div>'}</div>
  </div>

</div>

<!-- FOOTER -->
<div style="margin-top:10px;padding-top:6px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;">
  <span style="font-size:8px;color:#94a3b8;">Generated by <strong style="color:#2563eb;">Delivery Clarity v4.1</strong> · ${esc(now)} · Ali Abu Ras · aliaburas80@gmail.com</span>
  <span class="no-print" style="font-size:8px;color:#94a3b8;">Print this page (Ctrl/Cmd+P) or save as PDF from your browser.</span>
</div>

</body>
</html>`;
}

export function downloadExecutivePdf(metrics: DashboardMetrics): void {
  const html = buildExecutivePdfHtml(metrics);
  const blob  = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const url   = URL.createObjectURL(blob);
  const a     = document.createElement('a');
  a.href      = url;
  a.download  = `executive-summary-${new Date().toISOString().slice(0, 10)}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
