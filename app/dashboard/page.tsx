// @ts-nocheck
// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import KpiCard from '@/components/ui/KpiCard';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import LoadingState from '@/components/ui/LoadingState';
import type { DashboardMetrics, FlowItem } from '@/types/metrics';
import { getHealthBand, HEALTH_COLORS, formatDays, cn } from '@/lib/utils';

// ─── accent map ───────────────────────────────────────────────────────────────
const HEALTH_VARIANT: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'neutral'> = {
  excellent: 'success', good: 'info', moderate: 'warning', 'at-risk': 'danger', critical: 'danger',
};
const FLOW_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  good: 'success', warning: 'warning', critical: 'danger',
};
const DONE_STATUSES = ['done', 'closed', 'resolved'];
const ACTIVE_STATUSES = ['in progress', 'code review', 'qa', 'testing', 'uat'];

// ─── tiny helpers ─────────────────────────────────────────────────────────────
function norm(v: unknown): string { return String(v ?? '').trim().toLowerCase(); }
function matchText(val: unknown, q: string): boolean {
  const terms = norm(q).split(/\s+/).filter(Boolean);
  const t = norm(val);
  return !terms.length || terms.every(term => t.includes(term));
}
function matchSel(val: unknown, sel: string): boolean {
  return sel === 'all' || norm(val) === norm(sel);
}
function withinMax(val: unknown, max: string): boolean {
  if (max === '') return true;
  const m = Number(max);
  if (!Number.isFinite(m)) return false;
  if (val === null || val === undefined) return false;
  return Number(val) <= m;
}
function uniqueSorted(items: FlowItem[], key: keyof FlowItem): string[] {
  return [...new Set(items.map(i => i[key]).filter(Boolean))].sort() as string[];
}
function csvFromRows(rows: FlowItem[], cols: { key: string; label: string }[]): string {
  const lines = [cols.map(c => `"${c.label}"`).join(',')];
  rows.forEach(row => {
    lines.push(cols.map(c => `"${String((row as any)[c.key] ?? '').replace(/"/g, '""')}"`).join(','));
  });
  return lines.join('\n');
}

// ─── progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value }: { value: number }) {
  const w = Math.max(0, Math.min(value, 100));
  return (
    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden" aria-label={`${value}%`}>
      <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${w}%` }} />
    </div>
  );
}

// ─── health badge ─────────────────────────────────────────────────────────────
function HealthBadge({ value }: { value: string }) {
  const v = (value || 'unknown') as keyof typeof FLOW_VARIANT;
  return <Badge label={value || 'unknown'} variant={FLOW_VARIANT[v] ?? 'neutral'} />;
}

// ─── metric table ─────────────────────────────────────────────────────────────
interface ColDef { key: string; label: string; render?: (row: any) => React.ReactNode }
function MetricTable({ columns, rows, emptyMessage, rowClassName }: {
  columns: ColDef[]; rows: any[]; emptyMessage: string; rowClassName?: (row: any) => string;
}) {
  if (!rows?.length) return <p className="text-sm text-slate-500 italic py-2">{emptyMessage}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {columns.map(c => (
              <th key={c.key} className="px-3 py-2 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={row.id || row.key || row.name || row.assignee || row.epic || idx}
              className={cn('border-b border-slate-100', idx % 2 === 1 && 'bg-slate-50/50', rowClassName?.(row))}
            >
              {columns.map(c => (
                <td key={c.key} className="px-3 py-2 text-slate-700 whitespace-nowrap">{c.render ? c.render(row) : (row as any)[c.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── compact bar chart ────────────────────────────────────────────────────────
function CompactBarChart({ rows, labelKey = 'name', valueKey = 'count', emptyMessage = 'No data.' }: {
  rows: any[]; labelKey?: string; valueKey?: string; emptyMessage?: string;
}) {
  const items = (rows || []).map(r => ({ label: r[labelKey], value: Number(r[valueKey]) || 0 })).filter(r => r.label && r.value >= 0);
  const max = Math.max(...items.map(r => r.value), 1);
  if (!items.length) return <p className="text-sm text-slate-500 italic">{emptyMessage}</p>;
  return (
    <div className="space-y-2">
      {items.map(item => (
        <div key={item.label} className="flex items-center gap-2 text-xs">
          <span className="w-32 shrink-0 text-slate-600 truncate" title={item.label}>{item.label}</span>
          <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-blue-400 transition-all" style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
          <strong className="w-8 text-right text-slate-800 shrink-0">{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

// ─── distribution donut ───────────────────────────────────────────────────────
const PALETTE = ['#1d4ed8', '#14b8a6', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2'];
function DistributionDonut({ title, rows, labelKey = 'name', valueKey = 'count', emptyMessage = 'No data.' }: {
  title: string; rows: any[]; labelKey?: string; valueKey?: string; emptyMessage?: string;
}) {
  const items = (rows || []).map((r, i) => ({ label: r[labelKey], value: Number(r[valueKey]) || 0, color: PALETTE[i % PALETTE.length] })).filter(r => r.label && r.value > 0).slice(0, 6);
  const total = items.reduce((s, r) => s + r.value, 0);
  let cursor = 0;
  const bg = items.length
    ? `conic-gradient(${items.map(r => { const s = cursor; cursor += (r.value / Math.max(total, 1)) * 100; return `${r.color} ${s}% ${cursor}%`; }).join(', ')})`
    : '#e2e8f0';
  return (
    <div className="mb-4">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{title}</p>
      {items.length ? (
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full shrink-0 relative" style={{ background: bg }}>
            <div className="absolute inset-0 rounded-full flex flex-col items-center justify-center" style={{ background: 'radial-gradient(circle, white 52%, transparent 52%)' }}>
              <span className="text-sm font-black text-slate-900">{total}</span>
              <span className="text-xs text-slate-500">items</span>
            </div>
          </div>
          <div className="space-y-1 text-xs flex-1 min-w-0">
            {items.map(r => (
              <div key={r.label} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: r.color }} />
                <span className="text-slate-600 truncate flex-1">{r.label}</span>
                <strong className="text-slate-800">{r.value}</strong>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500 italic">{emptyMessage}</p>
      )}
    </div>
  );
}

// ─── collapsible section ──────────────────────────────────────────────────────
interface Chip { label: string; type?: 'good' | 'warning' | 'critical' | 'neutral' | 'info' }
const CHIP_CLS: Record<string, string> = {
  good: 'bg-green-50 text-green-700 border border-green-200',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200',
  critical: 'bg-red-50 text-red-700 border border-red-200',
  info: 'bg-blue-50 text-blue-700 border border-blue-200',
  neutral: 'bg-slate-100 text-slate-600 border border-slate-200',
};
function CollapsibleTrigger({ id, icon, title, chips, accent, expanded, onToggle }: {
  id: string; icon: string; title: string; chips: Chip[]; accent: string; expanded: boolean; onToggle: () => void;
}) {
  return (
    <button
      type="button"
      id={`trigger-${id}`}
      aria-expanded={expanded}
      aria-controls={`sec-${id}`}
      onClick={onToggle}
      className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border-l-4 bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow text-left mb-1"
      style={{ borderLeftColor: accent }}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-base" aria-hidden="true">{icon}</span>
        <span className="text-sm font-black text-slate-800">{title}</span>
        {chips.map((c, i) => (
          <span key={i} className={cn('text-xs font-semibold rounded-full px-2 py-0.5', CHIP_CLS[c.type ?? 'neutral'])}>{c.label}</span>
        ))}
      </div>
      <span className={cn('text-slate-400 transition-transform duration-200', expanded && 'rotate-180')} aria-hidden="true">▾</span>
    </button>
  );
}

// ─── tier separator ───────────────────────────────────────────────────────────
const TIER_COLORS = ['#ef4444', '#3b82f6', '#f97316', '#8b5cf6'] as const;
function TierSep({ icon, label, tier }: { icon: string; label: string; tier: 0 | 1 | 2 | 3 }) {
  return (
    <div
      className="flex items-center gap-2 my-6 px-4 py-2 rounded-lg text-white text-xs font-black uppercase tracking-widest"
      style={{ background: TIER_COLORS[tier] }}
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </div>
  );
}

// ─── scroll to top FAB ────────────────────────────────────────────────────────
function ScrollToTopFab() {
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const handler = () => setVis(window.scrollY > 400);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);
  if (!vis) return null;
  return (
    <button
      type="button"
      aria-label="Scroll to top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 flex items-center justify-center text-lg font-black transition-colors"
    >
      ↑
    </button>
  );
}

// ─── main component ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // filter state
  const [keyFilter, setKeyFilter] = useState('');
  const [summaryFilter, setSummaryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sprintFilter, setSprintFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [healthFilter, setHealthFilter] = useState('all');
  const [leadMaxFilter, setLeadMaxFilter] = useState('');
  const [cycleMaxFilter, setCycleMaxFilter] = useState('');
  const [openAgeMaxFilter, setOpenAgeMaxFilter] = useState('');
  const [reasonFilter, setReasonFilter] = useState('');
  const [labelFilter, setLabelFilter] = useState('');
  const [activeQuickFilter, setActiveQuickFilter] = useState('all');
  const [flowPanelOpen, setFlowPanelOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(100);
  const [reportMsg, setReportMsg] = useState('');
  const [detailPanel, setDetailPanel] = useState<{ title: string; description: string; items: FlowItem[] } | null>(null);
  const detailPanelRef = useRef<HTMLDivElement>(null);
  const flowFiltersRef = useRef<HTMLDivElement>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['delivery']));

  const toggleSection = (key: string) =>
    setExpandedSections(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });

  // load metrics from sessionStorage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('dc_metrics');
      if (!raw) { router.replace('/'); return; }
      setMetrics(JSON.parse(raw) as DashboardMetrics);
    } catch { router.replace('/'); }
    finally { setLoading(false); }
  }, [router]);

  // reset visible count on filter change
  useEffect(() => { setVisibleCount(100); },
    [keyFilter, summaryFilter, statusFilter, sprintFilter, assigneeFilter,
      leadMaxFilter, cycleMaxFilter, openAgeMaxFilter, healthFilter, reasonFilter, labelFilter]);

  // detail panel focus trap
  useEffect(() => {
    if (!detailPanel) return;
    const node = detailPanelRef.current;
    node?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDetailPanel(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [detailPanel]);

  // ── useMemo hooks must be ABOVE all early returns (Rules of Hooks) ─────────
  const flowItems: FlowItem[] = metrics?.flow?.items || [];

  const filteredFlowItems = useMemo(() => flowItems.filter(item =>
    matchText(item.key, keyFilter) &&
    matchText(item.summary, summaryFilter) &&
    matchSel(item.status, statusFilter) &&
    matchSel(item.sprint, sprintFilter) &&
    matchSel(item.assignee, assigneeFilter) &&
    withinMax(item.leadTimeDays, leadMaxFilter) &&
    withinMax(item.cycleTimeDays, cycleMaxFilter) &&
    withinMax(item.ageDays, openAgeMaxFilter) &&
    matchSel(item.health, healthFilter) &&
    matchText(item.reason, reasonFilter) &&
    (!labelFilter || (item.labels || '').toLowerCase().includes(labelFilter.toLowerCase()))
  ), [flowItems, keyFilter, summaryFilter, statusFilter, sprintFilter, assigneeFilter,
    leadMaxFilter, cycleMaxFilter, openAgeMaxFilter, healthFilter, reasonFilter, labelFilter]);

  const visibleFlowItems = filteredFlowItems.slice(0, visibleCount);
  const activeFilterCount =
    [keyFilter, summaryFilter, reasonFilter, labelFilter].filter(s => s !== '').length +
    [statusFilter, sprintFilter, assigneeFilter, healthFilter].filter(s => s !== 'all').length +
    [leadMaxFilter, cycleMaxFilter, openAgeMaxFilter].filter(s => s !== '').length;

  // epic readiness — guard metrics?.epics so hook runs even before metrics loads
  const epicReadiness = useMemo(() => {
    const epics = (metrics?.epics as any[]) || [];
    return epics.map(e => {
      const issues = Number(e.issues || 0);
      const done = Number(e.completedIssues || 0);
      const completion = issues ? Math.round((done / issues) * 100) : 0;
      const risk2 = Number(e.critical || 0) > 0 ? 'critical' : Number(e.warning || 0) > 0 ? 'warning' : completion >= 80 ? 'good' : 'warning';
      return { ...e, completion, risk: risk2 };
    }).sort((a, b) => {
      const rank: Record<string, number> = { critical: 0, warning: 1, good: 2 };
      return (rank[a.risk] - rank[b.risk]) || (a.completion - b.completion);
    });
  }, [metrics?.epics]);

  // smart actions — guard all metrics.* refs so hook runs before metrics loads
  const smartActions = useMemo(() => {
    if (!metrics) return [];
    const acts: { type: string; icon: string; navTarget: string; filterAction: string | null; title: string; detail: string }[] = [];
    const orphans = flowItems.filter(i => i.isOrphan).length;
    const critBlockers = flowItems.filter(i => i.health === 'critical' && norm(i.reason).includes('block'));
    if (critBlockers.length)
      acts.push({ type: 'critical', icon: '🚫', navTarget: 'flow-health-panel', filterAction: 'blockers',
        title: `Unblock ${critBlockers.length} critical item${critBlockers.length > 1 ? 's' : ''}`,
        detail: `${critBlockers[0].key}: ${(critBlockers[0].summary || critBlockers[0].reason).slice(0, 70)}` });
    const staleActive = flowItems.filter(i => i.health === 'critical' && norm(i.reason).includes('in progress over 14'));
    if (staleActive.length)
      acts.push({ type: 'critical', icon: '⏳', navTarget: 'flow-health-panel', filterAction: 'stale',
        title: `${staleActive.length} item${staleActive.length > 1 ? 's' : ''} stalled in progress`,
        detail: `${staleActive[0].key} has been active for ${Math.round((staleActive[0] as any).activeAgeDays || 0)} days` });
    const capacity = ((metrics?.capacity || []) as any[]);
    const overloaded = capacity.filter((c: any) => c.loadShare > 35);
    if (overloaded.length && capacity.length > 2)
      acts.push({ type: 'warning', icon: '⚖️', navTarget: 'section-ownership', filterAction: null,
        title: 'Team capacity imbalance detected',
        detail: `${overloaded[0].assignee} carries ${overloaded[0].loadShare}% — consider redistributing` });
    if (orphans > 0)
      acts.push({ type: 'info', icon: '👻', navTarget: 'section-attention', filterAction: null,
        title: `Link ${orphans} orphan item${orphans > 1 ? 's' : ''} to epics`,
        detail: 'Items without epic reduce scope traceability and epic completion accuracy' });
    const critEpics = epicReadiness.filter((e: any) => e.risk === 'critical');
    if (critEpics.length)
      acts.push({ type: 'warning', icon: '🚨', navTarget: 'section-readiness', filterAction: null,
        title: `${critEpics.length} epic${critEpics.length > 1 ? 's' : ''} in critical state`,
        detail: `${(critEpics[0] as any).epic || 'Top epic'}: ${(critEpics[0] as any).completion}% complete — needs attention` });
    const rels = metrics?.relations as any;
    if (rels?.blockedItems?.length)
      acts.push({ type: 'critical', icon: '🔗', navTarget: 'section-relations', filterAction: null,
        title: `${rels.blockedItems.length} item${rels.blockedItems.length > 1 ? 's' : ''} explicitly blocked`,
        detail: `${rels.blockedItems[0].key} is blocked by ${rels.blockedItems[0].blockedBy}` });
    return acts.slice(0, 5);
  }, [flowItems, metrics?.capacity, metrics?.relations, epicReadiness]);

  // ── All hooks are now above this line. Early returns are safe here. ─────────
  if (loading) return <AppShell showNav><LoadingState message="Loading dashboard…" /></AppShell>;
  if (!metrics) return null;

  // ── derived values (computed after hooks — metrics is guaranteed non-null here)
  const flow = metrics.flow;
  const sprint = metrics.sprint;
  const kanban = metrics.kanban as any;
  const storyPoints = metrics.storyPoints;
  const risk = metrics.risk;
  const quarters = (metrics.quarters as any[]) || [];
  const orphanCount = flowItems.filter(i => i.isOrphan).length;
  const totalIssues = Math.max(metrics.totalIssues, 1);
  const riskItems = (flow.critical || 0) + (flow.warning || 0);
  const band = getHealthBand(metrics.healthScore);
  const healthColor = HEALTH_COLORS[band];
  const healthStatus = riskItems === 0 ? 'Healthy' : riskItems < 4 ? 'At Risk' : 'Urgent Attention';
  const healthMessage = riskItems === 0 ? 'Delivery is stable' : `${riskItems} items require attention`;
  const statusOptions = uniqueSorted(flowItems, 'status');
  const sprintOptions = uniqueSorted(flowItems, 'sprint');
  const assigneeOptions = uniqueSorted(flowItems, 'assignee');
  const healthOptions = uniqueSorted(flowItems, 'health');
  const topBlockers = flowItems.filter(i => norm(i.reason).includes('block')).slice(0, 5);
  const topOverdue = flowItems.filter(i => Number(i.ageDays) > 10 && !DONE_STATUSES.includes(norm(i.status))).slice(0, 5);
  const topOrphans = flowItems.filter(i => i.isOrphan).slice(0, 5);

  // scroll helper
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const header = document.querySelector('header') as HTMLElement | null;
    const offset = (header ? header.offsetHeight : 0) + 16;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
  };

  const handleSmartAction = (action: (typeof smartActions)[number]) => {
    if (action.filterAction === 'blockers') { setFlowPanelOpen(true); setHealthFilter('critical'); setReasonFilter('block'); setActiveQuickFilter('blocked'); }
    else if (action.filterAction === 'stale') { setFlowPanelOpen(true); setHealthFilter('critical'); }
    setTimeout(() => scrollTo(action.navTarget), 200);
  };

  const applyQuickFilter = (type: string) => {
    setActiveQuickFilter(type);
    setKeyFilter(''); setSummaryFilter(''); setStatusFilter('all'); setSprintFilter('all');
    setAssigneeFilter('all'); setLeadMaxFilter(''); setCycleMaxFilter('');
    setOpenAgeMaxFilter(''); setHealthFilter('all'); setReasonFilter(''); setLabelFilter('');
    if (type === 'high-risk') setHealthFilter('critical');
    if (type === 'needs-review') setStatusFilter('in progress');
    if (type === 'blocked') setReasonFilter('block');
    setFlowPanelOpen(true);
    setTimeout(() => scrollTo('flow-health-panel'), 120);
  };

  const clearFilters = () => {
    applyQuickFilter('all');
    setReportMsg('Filters cleared');
    setTimeout(() => setReportMsg(''), 1400);
  };

  const exportRisk = () => {
    const rows = flowItems.filter(i => ['critical', 'warning'].includes(norm(i.health)));
    const cols = [
      { key: 'key', label: 'Issue' }, { key: 'summary', label: 'Summary' },
      { key: 'status', label: 'Status' }, { key: 'assignee', label: 'Assignee' },
      { key: 'health', label: 'Health' }, { key: 'reason', label: 'Reason' },
    ];
    const blob = new Blob([csvFromRows(rows, cols)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'jira-risk-report.csv'; a.click();
    URL.revokeObjectURL(url);
    setReportMsg(`Exported ${rows.length} high-risk items`);
    setTimeout(() => setReportMsg(''), 3000);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await (navigator.clipboard?.writeText?.(text) ?? Promise.reject());
    } catch {
      const ta = document.createElement('textarea'); ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    }
    setReportMsg('Copied'); setTimeout(() => setReportMsg(''), 1800);
  };

  // delivery donut
  const doneBucket = flowItems.filter(i => DONE_STATUSES.includes(norm(i.status))).length;
  const critBucket = flowItems.filter(i => !DONE_STATUSES.includes(norm(i.status)) && norm(i.health) === 'critical').length;
  const warnBucket = flowItems.filter(i => !DONE_STATUSES.includes(norm(i.status)) && norm(i.health) === 'warning').length;
  const activeBucket = flowItems.filter(i =>
    ACTIVE_STATUSES.includes(norm(i.status)) && !DONE_STATUSES.includes(norm(i.status)) &&
    norm(i.health) !== 'critical' && norm(i.health) !== 'warning'
  ).length;
  const otherBucket = Math.max(totalIssues - doneBucket - critBucket - warnBucket - activeBucket, 0);
  const donutSegs = [
    { key: 'done', label: 'Done', value: doneBucket, color: '#16a34a' },
    { key: 'active', label: 'In Progress', value: activeBucket, color: '#2563eb' },
    { key: 'warning', label: 'At Risk', value: warnBucket, color: '#f59e0b' },
    { key: 'critical', label: 'Critical', value: critBucket, color: '#dc2626' },
    { key: 'other', label: 'Backlog / Other', value: otherBucket, color: '#cbd5e1' },
  ].filter(s => s.value > 0);
  const segTotal = Math.max(donutSegs.reduce((a, s) => a + s.value, 0), 1);
  let donutCursor = 0;
  const donutBg = `conic-gradient(${donutSegs.map(s => { const st = donutCursor; donutCursor += (s.value / segTotal) * 100; return `${s.color} ${st}% ${donutCursor}%`; }).join(', ')})`;

  // health donut (health mix)
  const hmGood = flow.good || 0;
  const hmWarn = flow.warning || 0;
  const hmCrit = flow.critical || 0;
  const hmTotal = Math.max(hmGood + hmWarn + hmCrit, 1);
  const hmGoodEnd = (hmGood / hmTotal) * 100;
  const hmWarnEnd = hmGoodEnd + (hmWarn / hmTotal) * 100;
  const healthMixBg = `conic-gradient(#16a34a 0 ${hmGoodEnd}%, #f59e0b ${hmGoodEnd}% ${hmWarnEnd}%, #dc2626 ${hmWarnEnd}% 100%)`;

  // quarter chart max
  const qMax = Math.max(...quarters.map((q: any) => q.issues || 0), 1);

  // work state buckets
  const wsBacklog = flowItems.filter(i => ['backlog', 'selected for development', 'to do', 'todo'].includes(norm(i.status))).length;
  const wsActive2 = flowItems.filter(i => ['in progress', 'code review', 'qa', 'testing', 'uat'].includes(norm(i.status))).length;
  const wsDone2 = flowItems.filter(i => ['done', 'closed', 'resolved'].includes(norm(i.status))).length;
  const wsOther = flowItems.length - wsBacklog - wsActive2 - wsDone2;
  const wsRows = [
    { name: 'To Do', value: wsBacklog },
    { name: 'In Progress', value: wsActive2 },
    { name: 'Done', value: wsDone2 },
    ...(wsOther > 0 ? [{ name: 'Other', value: wsOther }] : []),
  ].filter(r => r.value > 0);

  const maxLoad = Math.max(...(metrics.capacity || []).map(c => c.loadShare), 1);

  const prediction = metrics.prediction;
  const targetCompletion = (metrics as any).sprintTargetCompletion || '82%';
  const rels = metrics.relations as any;

  // ── render ───────────────────────────────────────────────────────────────────
  return (
    <AppShell showNav>
      <div aria-hidden={detailPanel ? true : undefined}>

        {/* ── 1. HEADER ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
          <div>
            <button
              type="button"
              onClick={() => router.push('/charts')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 mb-1 block"
            >
              ← Charts
            </button>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Full Delivery Report</h1>
            <p className="text-sm text-slate-500 mt-0.5">Flow, sprint, kanban, capacity, story points, and epic performance.</p>
          </div>
          <div className="flex items-center gap-3">
            {metrics.healthScore !== undefined && (
              <div
                className="flex items-center gap-2 rounded-xl border px-4 py-2 cursor-pointer hover:shadow-md transition-shadow"
                style={{ borderColor: healthColor, background: healthColor + '12' }}
              >
                <div
                  className="w-10 h-10 rounded-full flex flex-col items-center justify-center text-white font-black text-sm"
                  style={{ background: `conic-gradient(${healthColor} 0 ${metrics.healthScore}%, #e2e8f0 ${metrics.healthScore}% 100%)` }}
                >
                  <span className="sr-only">{metrics.healthScore}</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-600">Health Score</p>
                  <p className="text-sm font-black" style={{ color: healthColor }}>{metrics.healthScore} — {band.charAt(0).toUpperCase() + band.slice(1)}</p>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => router.push('/')}
              className="text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 shadow-sm transition-colors"
            >
              Upload new file
            </button>
          </div>
        </div>

        {/* ── 2. SUMMARY BAR ─────────────────────────────────────────────────── */}
        <Card id="dashboard-summary" className="px-5 py-4 mb-4">
          <div className="flex flex-wrap items-center gap-4 mb-3">
            <div className={cn(
              'flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold border',
              riskItems === 0 ? 'bg-green-50 text-green-700 border-green-200'
                : riskItems < 4 ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-red-50 text-red-700 border-red-200'
            )}>
              <span className={cn('w-2 h-2 rounded-full', riskItems === 0 ? 'bg-green-500' : riskItems < 4 ? 'bg-amber-500' : 'bg-red-500')} />
              {healthStatus}
              <span className="font-normal opacity-75">— {healthMessage}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="font-bold text-slate-500 uppercase tracking-wider">Target vs Actual</span>
              <span className="font-semibold">{targetCompletion} target / {metrics.completionRate || 0}% actual</span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Completion</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{metrics.completionRate || 0}%</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Critical</p>
              <p className="text-xl font-black text-red-600 mt-0.5">{flow.critical || 0}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Cycle Time</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{flow.averageCycleTimeDays || 0}d</p>
            </div>
            {prediction && !prediction.complete && prediction.daysRemaining !== null ? (
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Est. Completion</p>
                <p className="text-xl font-black text-blue-700 mt-0.5">~{prediction.daysRemaining}d</p>
                {prediction.predictedDate && <p className="text-xs text-blue-500">{prediction.predictedDate}</p>}
              </div>
            ) : prediction?.complete ? (
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <p className="text-xs text-green-600 font-bold uppercase tracking-wider">Completion</p>
                <p className="text-xl font-black text-green-700 mt-0.5">Done ✅</p>
              </div>
            ) : <div />}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={exportRisk}
              className="text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors">
              Export risk report
            </button>
            {reportMsg && <span className="text-xs text-green-700 font-semibold">{reportMsg}</span>}
          </div>
        </Card>

        {/* ── STICKY QUICK FILTERS ────────────────────────────────────────────── */}
        <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200 mb-4 -mx-4 px-4 py-2 flex flex-wrap items-center gap-2 shadow-sm">
          {(['all', 'high-risk', 'blocked', 'needs-review'] as const).map(f => (
            <button key={f} type="button"
              onClick={() => applyQuickFilter(f)}
              className={cn('text-xs font-bold rounded-full px-3 py-1 border transition-colors',
                activeQuickFilter === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
              )}>
              {f === 'all' ? 'All' : f === 'high-risk' ? 'High Risk' : f === 'blocked' ? 'Blocked' : 'Needs Review'}
            </button>
          ))}
          <div className="flex items-center gap-2 ml-auto">
            {activeFilterCount > 0 && (
              <span className="text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2.5 py-0.5">{activeFilterCount} active</span>
            )}
            <button type="button" onClick={clearFilters}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-full px-3 py-1 bg-white transition-colors">
              Clear
            </button>
            <button type="button" onClick={() => { setFlowPanelOpen(true); setTimeout(() => scrollTo('flow-health-panel'), 120); }}
              className="text-xs font-bold bg-blue-600 text-white rounded-full px-3 py-1 hover:bg-blue-700 transition-colors">
              Show filters
            </button>
          </div>
        </div>

        {/* ── 3. SMART RECOMMENDATIONS ────────────────────────────────────────── */}
        {smartActions.length > 0 && (
          <section className="mb-6" aria-label="Smart recommendations">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">⚡ Smart Recommendations</h2>
              <span className="text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-0.5">
                {smartActions.length} action{smartActions.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {smartActions.map((action, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSmartAction(action)}
                  className={cn(
                    'text-left rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow',
                    action.type === 'critical' ? 'border-red-200 bg-red-50' :
                      action.type === 'warning' ? 'border-amber-200 bg-amber-50' : 'border-blue-200 bg-blue-50'
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg" aria-hidden="true">{action.icon}</span>
                    <span className={cn('text-xs font-black uppercase tracking-wider rounded-full px-2 py-0.5 border',
                      action.type === 'critical' ? 'text-red-700 bg-red-100 border-red-200' :
                        action.type === 'warning' ? 'text-amber-700 bg-amber-100 border-amber-200' :
                          'text-blue-700 bg-blue-100 border-blue-200'
                    )}>{action.type}</span>
                    <span className="text-xs text-slate-400 ml-auto">#{i + 1}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 mb-1">{action.title}</p>
                  <p className="text-xs text-slate-600 mb-2">{action.detail}</p>
                  <p className="text-xs font-bold text-blue-600">Go to details →</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── TIER 1: PRIORITY ATTENTION ──────────────────────────────────────── */}
        <TierSep icon="🚨" label="Priority Attention" tier={0} />

        {/* ── 4. TIER 1 — TOP 3 HIGHLIGHT CARDS ──────────────────────────────── */}
        <section id="section-attention" className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { id: 'blockers', title: 'Top Blockers', tag: 'Blockers', items: topBlockers, color: 'border-red-400 bg-red-50', tagCls: 'bg-red-100 text-red-700' },
            { id: 'overdue', title: 'Top Overdue', tag: 'Schedule', items: topOverdue, color: 'border-amber-400 bg-amber-50', tagCls: 'bg-amber-100 text-amber-700' },
            { id: 'orphans', title: 'Top Orphans', tag: 'Ownership', items: topOrphans, color: 'border-violet-400 bg-violet-50', tagCls: 'bg-violet-100 text-violet-700' },
          ].map(({ id, title, tag, items, color, tagCls }) => (
            <div key={id} className={cn('rounded-xl border-l-4 p-4 shadow-sm', color, 'border border-slate-200')}>
              <div className="flex items-center justify-between mb-2">
                <span className={cn('text-xs font-black uppercase tracking-wider rounded-full px-2 py-0.5', tagCls)}>{tag}</span>
                <strong className="text-lg font-black text-slate-900">{items.length}</strong>
              </div>
              <h3 className="text-sm font-black text-slate-800 mb-2">{title}</h3>
              {items.length ? (
                <ul className="space-y-1.5">
                  {items.map(item => (
                    <li key={item.key} className="flex items-start gap-2 text-xs">
                      <span className="font-mono font-bold text-blue-700 shrink-0">{item.key}</span>
                      <span className="text-slate-600 truncate">{item.summary || (item as any).reason || (item as any).epic || 'No epic'}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400 italic">None found.</p>
              )}
            </div>
          ))}
        </section>

        {/* ── TIER 2: PRIMARY METRICS ─────────────────────────────────────────── */}
        <TierSep icon="📊" label="Primary Metrics" tier={1} />

        {/* ── 5. TIER 2 — 6 KPI CARDS ─────────────────────────────────────────── */}
        <section id="section-overview" className="mb-6">
          <div className="mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overview</span>
            <h2 className="text-base font-black text-slate-800">Executive delivery snapshot</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard label="Completion" value={`${metrics.completionRate}%`} detail={`${metrics.doneIssues} of ${metrics.totalIssues} done`} accent="#16a34a" onClick={() => { setFlowPanelOpen(true); setTimeout(() => scrollTo('flow-health-panel'), 100); }} />
            <KpiCard label="Health Alerts" value={(flow.critical || 0) + (flow.warning || 0)} detail={`${flow.critical || 0} critical · ${flow.warning || 0} warning`} accent="#dc2626" onClick={() => { setFlowPanelOpen(true); setTimeout(() => scrollTo('flow-health-panel'), 100); }} />
            <KpiCard label="Active Work" value={metrics.activeIssues || 0} detail="In progress, review, QA, UAT" accent="#f59e0b" />
            <KpiCard label="Lead Time" value={`${flow.averageLeadTimeDays || 0}d`} detail={`${flow.leadTimeSampleSize || 0} completed items`} accent="#2563eb" onClick={() => { setFlowPanelOpen(true); setTimeout(() => scrollTo('flow-health-panel'), 100); }} />
            <KpiCard label="Cycle Time" value={`${flow.averageCycleTimeDays || 0}d`} detail={`${flow.cycleTimeSampleSize || 0} items w/ start dates`} accent="#0f766e" onClick={() => { setFlowPanelOpen(true); setTimeout(() => scrollTo('flow-health-panel'), 100); }} />
            <KpiCard label="Story Points" value={storyPoints.totalStoryPoints || 0} detail={`${storyPoints.pointCompletionRate || 0}% complete`} accent="#7c3aed" />
          </div>
        </section>

        {/* ── 6. DELIVERY COMPOSITION RING ─────────────────────────────────────── */}
        <section id="section-ratios" className="mb-6">
          <div className="mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ratios</span>
            <h2 className="text-base font-black text-slate-800">Delivery composition at a glance</h2>
          </div>
          <Card className="p-5 flex flex-col md:flex-row items-center gap-8">
            <div className="shrink-0 relative">
              <div
                className="w-48 h-48 rounded-full"
                style={{ background: donutBg }}
                role="img"
                aria-label="Delivery composition ring"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full" style={{ background: 'radial-gradient(circle, white 52%, transparent 52%)' }}>
                <span className="text-2xl font-black text-slate-900">{metrics.completionRate || 0}%</span>
                <span className="text-xs text-slate-500">complete</span>
                <span className="text-xs text-slate-400">{metrics.doneIssues || 0} of {totalIssues}</span>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {donutSegs.map(s => (
                <div key={s.key} className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: s.color }} />
                  <span className="text-sm text-slate-600 flex-1">{s.label}</span>
                  <strong className="text-sm text-slate-900">{s.value}</strong>
                  <span className="text-xs text-slate-400">{Math.round((s.value / segTotal) * 100)}%</span>
                </div>
              ))}
              <div className="col-span-full border-t border-slate-100 pt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                <span>Total <strong className="text-slate-900">{totalIssues}</strong> issues</span>
                {orphanCount > 0 && <span>Orphans <strong className="text-slate-900">{orphanCount}</strong></span>}
                {storyPoints.totalStoryPoints > 0 && <span>Points <strong className="text-slate-900">{storyPoints.completedStoryPoints || 0} / {storyPoints.totalStoryPoints}</strong></span>}
              </div>
            </div>
          </Card>
        </section>

        {/* ── 7. VISUAL INTELLIGENCE ───────────────────────────────────────────── */}
        <section id="section-visuals" className="mb-6">
          <div className="mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Visual Intelligence</span>
            <h2 className="text-base font-black text-slate-800">Charts that explain the result</h2>
          </div>
          {/* hero row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* health mix donut */}
            <Card className="p-5">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-4">Health Mix</h3>
              <div className="flex items-center gap-5">
                <div className="w-24 h-24 rounded-full shrink-0 relative" style={{ background: healthMixBg }}>
                  <div className="absolute inset-0 rounded-full flex flex-col items-center justify-center" style={{ background: 'radial-gradient(circle, white 52%, transparent 52%)' }}>
                    <span className="text-base font-black text-slate-900">{hmTotal}</span>
                    <span className="text-xs text-slate-400">items</span>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs">
                  {[['Good', '#16a34a', hmGood], ['Warning', '#f59e0b', hmWarn], ['Critical', '#dc2626', hmCrit]].map(([lbl, clr, val]) => (
                    <div key={lbl as string} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: clr as string }} />
                      <span className="text-slate-600">{lbl}</span>
                      <strong className="text-slate-800 ml-auto">{val}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
            {/* quarter progress bars */}
            <Card className="p-5">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-4">Quarter Progress</h3>
              {quarters.length ? (
                <div className="flex items-end gap-3 h-28">
                  {quarters.map((q: any) => (
                    <div key={q.quarter} className="flex flex-col items-center gap-1 flex-1">
                      <div className="relative w-full flex-1 flex items-end gap-0.5">
                        <div className="w-3 rounded-t bg-slate-200" style={{ height: `${Math.max((q.issues / qMax) * 100, 8)}%` }} />
                        <div className="w-3 rounded-t bg-blue-500" style={{ height: `${Math.max((q.doneIssues / qMax) * 100, q.doneIssues ? 8 : 0)}%` }} />
                      </div>
                      <span className="text-xs font-bold text-slate-600">{q.quarter}</span>
                      <span className="text-xs text-slate-400">{q.completionRate}%</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-slate-400 italic">No quarter data.</p>}
            </Card>
            {/* work state bars */}
            <Card className="p-5">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-4">Work State Distribution</h3>
              <CompactBarChart rows={wsRows} valueKey="value" emptyMessage="No work state data." />
            </Card>
          </div>
          {/* secondary row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Kanban Distribution</h3>
              <CompactBarChart rows={(kanban?.byStatus || []).slice(0, 6)} emptyMessage="No status data." />
            </Card>
            <Card className="p-5">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Sprint Comparison</h3>
              <CompactBarChart rows={(sprint.sprints || []).map(s => ({ name: s.name, count: s.issues }))} emptyMessage="No sprint data." />
            </Card>
            <Card className="p-5 flex flex-col items-center justify-center text-center">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Orphan Items</h3>
              <p className="text-4xl font-black text-slate-900">{orphanCount}</p>
              <p className="text-xs text-slate-500 mt-1">items without epic or parent</p>
            </Card>
          </div>
        </section>

        {/* ── TIER 3: DELIVERY DETAIL ──────────────────────────────────────────── */}
        <TierSep icon="📋" label="Delivery Detail" tier={2} />

        {/* ── 8a. DELIVERY CONTROLS ────────────────────────────────────────────── */}
        <CollapsibleTrigger
          id="delivery"
          icon="🌊"
          title="Delivery Controls"
          chips={[
            { label: `${flow.critical || 0} critical`, type: (flow.critical || 0) > 0 ? 'critical' : 'good' },
            { label: `${flow.averageCycleTimeDays || 0}d avg cycle`, type: 'neutral' },
          ]}
          accent="#f97316"
          expanded={expandedSections.has('delivery')}
          onToggle={() => toggleSection('delivery')}
        />
        {expandedSections.has('delivery') && (
          <section id="section-delivery-controls" className="mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <Card className="p-4">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Flow Efficiency</h4>
                <dl className="space-y-2 text-sm">
                  {[['Avg lead time', `${flow.averageLeadTimeDays || 0} days`], ['Avg cycle time', `${flow.averageCycleTimeDays || 0} days`], ['Completed sample', `${flow.leadTimeSampleSize || 0} issues`], ['Critical items', String(flow.critical || 0)]].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <dt className="text-slate-500">{k}</dt>
                      <dd className="font-bold text-slate-900">{v}</dd>
                    </div>
                  ))}
                </dl>
              </Card>
              <Card className="p-4">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Story Point Delivery</h4>
                <dl className="space-y-2 text-sm mb-3">
                  {[['Completed points', String(storyPoints.completedStoryPoints || 0)], ['Remaining points', String(storyPoints.remainingStoryPoints || 0)], ['Point completion', `${storyPoints.pointCompletionRate || 0}%`]].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <dt className="text-slate-500">{k}</dt>
                      <dd className="font-bold text-slate-900">{v}</dd>
                    </div>
                  ))}
                </dl>
                <ProgressBar value={storyPoints.pointCompletionRate || 0} />
              </Card>
              <Card className="p-4">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Risk Readout</h4>
                <dl className="space-y-2 text-sm">
                  {[['Blocked', String(risk.blockedIssues || 0)], ['Overdue', String(risk.overdueIssues || 0)], ['High priority open', String(risk.highPriorityOpenIssues || 0)]].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <dt className="text-slate-500">{k}</dt>
                      <dd className="font-bold text-slate-900">{v}</dd>
                    </div>
                  ))}
                </dl>
              </Card>
            </div>
          </section>
        )}

        {/* ── 8b. QUARTER STATISTICS ───────────────────────────────────────────── */}
        <CollapsibleTrigger
          id="quarters"
          icon="📅"
          title="Quarter Statistics"
          chips={[{ label: `${quarters.filter((q: any) => q.quarter !== 'No date').length} quarters`, type: 'neutral' }]}
          accent="#f97316"
          expanded={expandedSections.has('quarters')}
          onToggle={() => toggleSection('quarters')}
        />
        {expandedSections.has('quarters') && (
          <section id="section-quarters" className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <MetricTable
              columns={[
                { key: 'quarter', label: 'Quarter' }, { key: 'issues', label: 'Issues' },
                { key: 'doneIssues', label: 'Done' }, { key: 'activeIssues', label: 'Active' },
                { key: 'completionRate', label: 'Completion', render: (r: any) => `${r.completionRate}%` },
                { key: 'averageLeadTimeDays', label: 'Lead', render: (r: any) => formatDays(r.averageLeadTimeDays) },
                { key: 'averageCycleTimeDays', label: 'Cycle', render: (r: any) => formatDays(r.averageCycleTimeDays) },
                { key: 'critical', label: 'Critical' }, { key: 'warning', label: 'Warning' },
                { key: 'storyPoints', label: 'Points' },
              ]}
              rows={quarters}
              emptyMessage="No date data found to split work by quarter."
            />
          </section>
        )}

        {/* ── 8c. KANBAN STATUS ────────────────────────────────────────────────── */}
        <CollapsibleTrigger
          id="kanban"
          icon="🗃️"
          title="Kanban Status Health"
          chips={[
            { label: `${(kanban?.byStatus || []).length} statuses`, type: 'neutral' },
            { label: `${flow.critical || 0} critical`, type: (flow.critical || 0) > 0 ? 'critical' : 'good' },
          ]}
          accent="#0f766e"
          expanded={expandedSections.has('kanban')}
          onToggle={() => toggleSection('kanban')}
        />
        {expandedSections.has('kanban') && (
          <section id="section-kanban" className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
            <DistributionDonut title="Kanban Share" rows={(kanban?.byStatus || []).slice(0, 6)} emptyMessage="No status data." />
            <CompactBarChart rows={(kanban?.byStatus || []).slice(0, 8)} emptyMessage="No status data." />
            <MetricTable
              columns={[
                { key: 'name', label: 'Status' }, { key: 'count', label: 'Issues' },
                { key: 'done', label: 'Done' },
                { key: 'averageLeadTimeDays', label: 'Lead', render: (r: any) => formatDays(r.averageLeadTimeDays) },
                { key: 'averageCycleTimeDays', label: 'Cycle', render: (r: any) => formatDays(r.averageCycleTimeDays) },
                { key: 'critical', label: 'Critical' }, { key: 'warning', label: 'Warning' },
                { key: 'good', label: 'Good' }, { key: 'storyPoints', label: 'Points' },
              ]}
              rows={kanban?.byStatus || []}
              emptyMessage="No status data found."
            />
          </section>
        )}

        {/* ── 8d. SPRINT STATUS ────────────────────────────────────────────────── */}
        <CollapsibleTrigger
          id="sprint"
          icon="🏃"
          title="Sprint Status"
          chips={[
            { label: `${sprint.sprintCount || 0} sprints`, type: 'neutral' },
            ...(sprint.sprints?.[0] ? [{ label: `${sprint.sprints[0].completionRate}% recent`, type: (sprint.sprints[0].completionRate >= 80 ? 'good' : sprint.sprints[0].completionRate >= 60 ? 'warning' : 'critical') as Chip['type'] }] : []),
          ]}
          accent="#7c3aed"
          expanded={expandedSections.has('sprint')}
          onToggle={() => toggleSection('sprint')}
        />
        {expandedSections.has('sprint') && (
          <section id="section-sprint" className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
            <DistributionDonut title="Sprint Share" rows={(sprint.sprints || []).slice(0, 6)} labelKey="name" valueKey="issues" emptyMessage="No sprint data." />
            <MetricTable
              columns={[
                { key: 'name', label: 'Sprint' }, { key: 'issues', label: 'Issues' },
                { key: 'completedIssues', label: 'Done' }, { key: 'completedPoints', label: 'Done Points' },
                { key: 'averageLeadTimeDays', label: 'Lead', render: (r: any) => formatDays(r.averageLeadTimeDays) },
                { key: 'averageCycleTimeDays', label: 'Cycle', render: (r: any) => formatDays(r.averageCycleTimeDays) },
                { key: 'critical', label: 'Critical' }, { key: 'warning', label: 'Warning' },
                { key: 'completionRate', label: 'Completion', render: (r: any) => `${r.completionRate}%` },
              ]}
              rows={sprint.sprints || []}
              emptyMessage="No sprint field was found in this Jira export."
            />
          </section>
        )}

        {/* ── 8e. OWNERSHIP & CAPACITY ─────────────────────────────────────────── */}
        <CollapsibleTrigger
          id="ownership"
          icon="👥"
          title="Ownership & Capacity"
          chips={[
            { label: `${(metrics.capacity || []).length} assignees`, type: 'neutral' },
            ...((metrics.capacity || [])[0] ? [{ label: `${(metrics.capacity || [])[0].assignee}: ${(metrics.capacity || [])[0].loadShare}%`, type: ((metrics.capacity || [])[0].loadShare > 35 ? 'critical' : 'good') as Chip['type'] }] : []),
          ]}
          accent="#0f766e"
          expanded={expandedSections.has('ownership')}
          onToggle={() => toggleSection('ownership')}
        />
        {expandedSections.has('ownership') && (
          <section id="section-ownership" className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card id="capacity-section" className="p-4">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Capacity By Assignee</h4>
                <CompactBarChart rows={(metrics.capacity || []).slice(0, 8)} labelKey="assignee" valueKey="issues" emptyMessage="No assignee data." />
                <div className="mt-4">
                  <MetricTable
                    columns={[
                      { key: 'assignee', label: 'Assignee' }, { key: 'issues', label: 'Issues' },
                      { key: 'activeIssues', label: 'Active' }, { key: 'storyPoints', label: 'Points' },
                      { key: 'loadShare', label: 'Load', render: (r: any) => `${r.loadShare}%` },
                    ]}
                    rows={metrics.capacity || []}
                    emptyMessage="No assignee data found."
                  />
                </div>
              </Card>
              <Card className="p-4">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Epic / Parent Performance</h4>
                <MetricTable
                  columns={[
                    { key: 'epic', label: 'Epic or Parent' }, { key: 'issues', label: 'Issues' },
                    { key: 'completedIssues', label: 'Done' },
                    { key: 'averageLeadTimeDays', label: 'Lead', render: (r: any) => formatDays(r.averageLeadTimeDays) },
                    { key: 'averageCycleTimeDays', label: 'Cycle', render: (r: any) => formatDays(r.averageCycleTimeDays) },
                    { key: 'critical', label: 'Critical' }, { key: 'warning', label: 'Warning' },
                    { key: 'progress', label: 'Progress', render: (r: any) => (
                      <div className="flex items-center gap-2 min-w-[80px]">
                        <ProgressBar value={r.progress || 0} />
                        <span className="text-xs text-slate-600 w-8 shrink-0">{r.progress || 0}%</span>
                      </div>
                    )},
                  ]}
                  rows={(metrics.epics as any[]) || []}
                  emptyMessage="No epic or parent data found."
                />
              </Card>
            </div>
          </section>
        )}

        {/* ── TIER 4: DEEP DIVE ────────────────────────────────────────────────── */}
        <TierSep icon="🔍" label="Deep Dive" tier={3} />

        {/* ── 9a. CLASSIFICATION (LABELS + TYPES) ──────────────────────────────── */}
        <section id="section-labels" className="mb-6">
          <div className="mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Classification</span>
            <h2 className="text-base font-black text-slate-800">Labels, types &amp; project breakdown</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Card className="p-4">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Label Distribution</h4>
              {(metrics.labels as any)?.labelStats?.filter((l: any) => l.label !== '(unlabeled)').length ? (
                <>
                  <div className="flex gap-2 mb-3">
                    <span className="text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-0.5">{(metrics.labels as any).uniqueLabels} unique labels</span>
                    <span className="text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 rounded-full px-2.5 py-0.5">{(metrics.labels as any).totalUnlabeled} unlabeled</span>
                  </div>
                  <CompactBarChart rows={(metrics.labels as any).labelStats.filter((l: any) => l.label !== '(unlabeled)').slice(0, 8)} labelKey="label" valueKey="count" emptyMessage="No labels found." />
                </>
              ) : <p className="text-sm text-slate-500 italic">No label data found in this export.</p>}
            </Card>
            <Card className="p-4">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Issue Type Breakdown</h4>
              {(metrics.types as any[])?.length ? (
                <>
                  <DistributionDonut title="Type Share" rows={metrics.types as any[]} labelKey="type" valueKey="count" emptyMessage="No type data." />
                  <CompactBarChart rows={metrics.types as any[]} labelKey="type" valueKey="count" emptyMessage="No type data." />
                </>
              ) : <p className="text-sm text-slate-500 italic">No issue type data found.</p>}
            </Card>
          </div>
          {(metrics.labels as any)?.labelStats?.filter((l: any) => l.label !== '(unlabeled)').length > 0 && (
            <Card className="p-4 mb-4">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Label Health &amp; Completion</h4>
              <MetricTable
                columns={[
                  { key: 'label', label: 'Label' }, { key: 'count', label: 'Issues' },
                  { key: 'done', label: 'Done' },
                  { key: 'completionRate', label: 'Completion', render: (r: any) => (
                    <div className="flex items-center gap-2 min-w-[100px]">
                      <ProgressBar value={r.completionRate} />
                      <span className="text-xs">{r.completionRate}%</span>
                    </div>
                  )},
                  { key: 'critical', label: 'Critical' }, { key: 'warning', label: 'Warning' },
                  { key: 'storyPoints', label: 'Points' },
                  { key: 'averageLeadTimeDays', label: 'Avg Lead', render: (r: any) => formatDays(r.averageLeadTimeDays) },
                  { key: 'averageCycleTimeDays', label: 'Avg Cycle', render: (r: any) => formatDays(r.averageCycleTimeDays) },
                ]}
                rows={(metrics.labels as any).labelStats.filter((l: any) => l.label !== '(unlabeled)')}
                emptyMessage="No label data found."
              />
            </Card>
          )}
          {((metrics.parents as any[])?.length > 0 || (metrics.projects as any[])?.length > 1) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(metrics.parents as any[])?.length > 0 && (
                <Card className="p-4">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Parent Key Breakdown</h4>
                  <CompactBarChart rows={(metrics.parents as any[]).slice(0, 8)} labelKey="parent" valueKey="count" emptyMessage="No parent data." />
                  <div className="mt-3">
                    <MetricTable
                      columns={[
                        { key: 'parent', label: 'Parent' }, { key: 'count', label: 'Issues' },
                        { key: 'done', label: 'Done' },
                        { key: 'completionRate', label: 'Completion', render: (r: any) => `${r.completionRate}%` },
                        { key: 'critical', label: 'Critical' }, { key: 'warning', label: 'Warning' },
                        { key: 'storyPoints', label: 'Points' },
                      ]}
                      rows={metrics.parents as any[]}
                      emptyMessage="No parent key data found."
                    />
                  </div>
                </Card>
              )}
              {(metrics.projects as any[])?.length > 1 && (
                <Card className="p-4">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Project Breakdown</h4>
                  <DistributionDonut title="Project Share" rows={metrics.projects as any[]} labelKey="project" valueKey="count" emptyMessage="No project data." />
                  <MetricTable
                    columns={[
                      { key: 'project', label: 'Project' }, { key: 'count', label: 'Issues' },
                      { key: 'done', label: 'Done' },
                      { key: 'completionRate', label: 'Completion', render: (r: any) => `${r.completionRate}%` },
                      { key: 'critical', label: 'Critical' }, { key: 'warning', label: 'Warning' },
                    ]}
                    rows={metrics.projects as any[]}
                    emptyMessage="No project data found."
                  />
                </Card>
              )}
            </div>
          )}
        </section>

        {/* ── 9b. RELATIONS ────────────────────────────────────────────────────── */}
        <section id="section-relations" className="mb-6">
          <div className="mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Relations</span>
            <h2 className="text-base font-black text-slate-800">Linked issues &amp; dependency map</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {rels?.hasLinks
                ? `${rels.totalLinks} link relationship${rels.totalLinks !== 1 ? 's' : ''} across ${rels.itemsWithLinks} item${rels.itemsWithLinks !== 1 ? 's' : ''} — ${rels.linkTypes} link type${rels.linkTypes !== 1 ? 's' : ''} detected.`
                : 'Linked issue columns were not found in this export. Re-export from Jira with linked issue columns to see dependency data here.'}
            </p>
          </div>
          {rels?.hasLinks ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Link Type Distribution</h4>
                  <DistributionDonut title="Link Types" rows={rels.linkStats} labelKey="type" valueKey="count" emptyMessage="No link types found." />
                  <CompactBarChart rows={rels.linkStats} labelKey="type" valueKey="count" emptyMessage="No link types found." />
                </Card>
                <Card className="p-4">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Most Connected Items</h4>
                  <MetricTable
                    columns={[
                      { key: 'key', label: 'Key' }, { key: 'summary', label: 'Summary' },
                      { key: 'linkCount', label: 'Links' }, { key: 'linkTypes', label: 'Types' },
                      { key: 'status', label: 'Status' },
                    ]}
                    rows={rels.mostLinked}
                    emptyMessage="No linked items found."
                  />
                </Card>
              </div>
              {rels.blockedItems?.length > 0 && (
                <Card className="p-4">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Items Explicitly Blocked</h4>
                  <MetricTable
                    columns={[
                      { key: 'key', label: 'Blocked Item' }, { key: 'summary', label: 'Summary' },
                      { key: 'status', label: 'Status' }, { key: 'blockedBy', label: 'Blocked By' },
                      { key: 'blockCount', label: 'Blockers' },
                    ]}
                    rows={rels.blockedItems}
                    emptyMessage="No explicitly blocked items."
                  />
                </Card>
              )}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-3xl mb-3" aria-hidden="true">🔗</p>
              <h3 className="text-sm font-black text-slate-700 mb-2">No linked issues found in this export</h3>
              <p className="text-sm text-slate-500 mb-4">Re-export from Jira with linked issue columns included to see blockers, dependencies, and related items here.</p>
              <ol className="text-xs text-slate-500 text-left inline-block space-y-1 list-decimal pl-4">
                <li>In Jira, open your board → Export → Excel/CSV</li>
                <li>Select all columns or check <strong>Linked Issues</strong></li>
                <li>Re-upload the new file to this dashboard</li>
              </ol>
            </Card>
          )}
        </section>

        {/* ── 9c. JUSTIFICATION ────────────────────────────────────────────────── */}
        {(metrics.insights || []).length > 0 && (
          <Card className="p-5 mb-6">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Justification — Key Insights</h3>
            <ul className="space-y-2">
              {(metrics.insights || []).map((insight, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  {insight}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* ── 9d. READINESS ────────────────────────────────────────────────────── */}
        <section id="section-readiness" className="mb-6">
          <div className="mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Readiness</span>
            <h2 className="text-base font-black text-slate-800">Epic health &amp; release readiness</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Top At-Risk Epics</h4>
              {epicReadiness.filter(e => e.risk === 'critical' || e.completion < 60).length ? (
                <ul className="space-y-3">
                  {epicReadiness.filter(e => e.risk === 'critical' || e.completion < 60).slice(0, 8).map(e => (
                    <li key={e.epic || e.id} className="border border-slate-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-slate-800">{e.epic || e.id}</span>
                        <Badge
                          label={e.risk}
                          variant={e.risk === 'critical' ? 'danger' : e.risk === 'warning' ? 'warning' : 'success'}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <ProgressBar value={e.completion} />
                        <span className="text-xs font-bold text-slate-700 w-10 shrink-0">{e.completion}%</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDetailPanel({ title: `Epic ${e.epic || e.id}`, description: 'Issues in this epic', items: flowItems.filter(i => (i.epic || i.parent) === (e.epic || e.id)) })}
                        className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
                      >
                        View items
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500 italic">No at-risk epics detected.</p>
              )}
            </Card>
            <Card className="p-4">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Dependency Callouts</h4>
              <p className="text-xs text-slate-500 mb-3">Items referencing other epics or external blockers.</p>
              {flowItems.filter(i => (i as any).dependsOn || (i as any).externalEpic).length ? (
                <ul className="space-y-2">
                  {flowItems.filter(i => (i as any).dependsOn || (i as any).externalEpic).slice(0, 10).map(it => (
                    <li key={it.key || it.summary} className="text-xs text-slate-700">
                      <span className="font-mono font-bold text-blue-700">{it.key}</span>: {it.summary}
                      {(it as any).dependsOn && <span className="text-slate-500"> — depends on {(it as any).dependsOn}</span>}
                      {(it as any).externalEpic && <span className="text-slate-500"> — external epic {(it as any).externalEpic}</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500 italic">No dependency callouts detected.</p>
              )}
            </Card>
          </div>
        </section>

        {/* ── 10. FLOW HEALTH PANEL ────────────────────────────────────────────── */}
        <section id="flow-health-panel" className="mb-8">
          <button
            type="button"
            aria-expanded={flowPanelOpen}
            aria-controls="flow-health-body"
            onClick={() => setFlowPanelOpen(v => !v)}
            className="w-full flex items-center justify-between gap-3 px-5 py-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow text-left mb-2"
          >
            <div>
              <h3 className="text-sm font-black text-slate-800">Story / Task Flow Health</h3>
              <p className="text-xs text-slate-500">{flowPanelOpen ? 'Close expanded view and return to dashboard' : 'Open filters, health graph, and matching items'}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-bold text-slate-700">{filteredFlowItems.length} of {flowItems.length} items</span>
              <span className={cn('text-slate-400 transition-transform duration-200', flowPanelOpen && 'rotate-180')} aria-hidden="true">▾</span>
            </div>
          </button>

          {flowPanelOpen && (
            <div id="flow-health-body" className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5">
              <p className="text-xs text-slate-500 italic">The graph and table below show only items matching selected filters.</p>

              {/* filters */}
              <div ref={flowFiltersRef} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {[
                  { label: 'Key', value: keyFilter, setter: setKeyFilter, type: 'search', placeholder: 'AJ-24' },
                  { label: 'Story / Task', value: summaryFilter, setter: setSummaryFilter, type: 'search', placeholder: 'Summary text' },
                  { label: 'Reason', value: reasonFilter, setter: setReasonFilter, type: 'search', placeholder: 'Blocked, overdue…' },
                  { label: 'Labels', value: labelFilter, setter: setLabelFilter, type: 'search', placeholder: 'bug-fix, mobile…' },
                  { label: 'Lead <=', value: leadMaxFilter, setter: setLeadMaxFilter, type: 'number', placeholder: 'Days' },
                  { label: 'Cycle <=', value: cycleMaxFilter, setter: setCycleMaxFilter, type: 'number', placeholder: 'Days' },
                  { label: 'Open Age <=', value: openAgeMaxFilter, setter: setOpenAgeMaxFilter, type: 'number', placeholder: 'Days' },
                ].map(({ label, value, setter, type, placeholder }) => (
                  <label key={label} className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-slate-500">{label}</span>
                    <input
                      type={type}
                      value={value}
                      min={type === 'number' ? '0' : undefined}
                      placeholder={placeholder}
                      onChange={e => setter(e.target.value)}
                      className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </label>
                ))}
                {[
                  { label: 'Status', value: statusFilter, setter: setStatusFilter, opts: statusOptions, allLabel: 'All statuses' },
                  { label: 'Sprint', value: sprintFilter, setter: setSprintFilter, opts: sprintOptions, allLabel: 'All sprints' },
                  { label: 'Assignee', value: assigneeFilter, setter: setAssigneeFilter, opts: assigneeOptions, allLabel: 'All assignees' },
                  { label: 'Health', value: healthFilter, setter: setHealthFilter, opts: healthOptions, allLabel: 'All health' },
                ].map(({ label, value, setter, opts, allLabel }) => (
                  <label key={label} className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-slate-500">{label}</span>
                    <select
                      value={value}
                      onChange={e => setter(e.target.value)}
                      className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    >
                      <option value="all">{allLabel}</option>
                      {opts.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </label>
                ))}
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => {
                      setKeyFilter(''); setSummaryFilter(''); setStatusFilter('all'); setSprintFilter('all');
                      setAssigneeFilter('all'); setLeadMaxFilter(''); setCycleMaxFilter('');
                      setOpenAgeMaxFilter(''); setHealthFilter('all'); setReasonFilter(''); setLabelFilter('');
                      setActiveQuickFilter('all');
                    }}
                    className="text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 bg-white hover:bg-slate-50 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* status graph */}
              <div>
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Status Distribution (filtered)</h4>
                <CompactBarChart
                  rows={Object.entries(
                    filteredFlowItems.reduce((acc: Record<string, number>, i) => { acc[i.status] = (acc[i.status] || 0) + 1; return acc; }, {})
                  ).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)}
                  emptyMessage="No items match the selected filters."
                />
              </div>

              {/* summary */}
              <div className="text-xs text-slate-600 bg-slate-50 rounded-lg px-4 py-2">
                Showing <strong>{visibleFlowItems.length}</strong> of <strong>{filteredFlowItems.length}</strong> matching items from <strong>{flowItems.length}</strong> total.
                {filteredFlowItems.some(i => i.isOrphan) && (
                  <span className="ml-2 text-violet-600 font-bold">{filteredFlowItems.filter(i => i.isOrphan).length} orphan items highlighted</span>
                )}
              </div>

              {/* flow table */}
              <MetricTable
                columns={[
                  { key: 'key', label: 'Key' },
                  { key: 'summary', label: 'Story / Task' },
                  { key: 'status', label: 'Status' },
                  { key: 'sprint', label: 'Sprint' },
                  { key: 'epic', label: 'Epic / Parent', render: (row: any) => row.epic || 'Orphan' },
                  { key: 'assignee', label: 'Assignee' },
                  { key: 'labels', label: 'Labels' },
                  { key: 'linkedTo', label: 'Linked To' },
                  { key: 'leadTimeDays', label: 'Lead', render: (row: any) => formatDays(row.leadTimeDays) },
                  { key: 'cycleTimeDays', label: 'Cycle', render: (row: any) => formatDays(row.cycleTimeDays) },
                  { key: 'ageDays', label: 'Open Age', render: (row: any) => formatDays(row.ageDays) },
                  { key: 'health', label: 'Health', render: (row: any) => <HealthBadge value={row.health} /> },
                  { key: 'reason', label: 'Reason' },
                ]}
                rows={visibleFlowItems}
                emptyMessage="No story or task data found."
                rowClassName={(row: any) => row.isOrphan ? 'bg-violet-50/60' : ''}
              />

              {filteredFlowItems.length > visibleCount && (
                <button
                  type="button"
                  onClick={() => setVisibleCount(c => c + 100)}
                  className="text-sm font-semibold text-slate-700 border border-slate-200 rounded-lg px-4 py-2 bg-white hover:bg-slate-50 transition-colors"
                >
                  Show {Math.min(100, filteredFlowItems.length - visibleCount)} more
                  <span className="text-slate-400 ml-1">— {filteredFlowItems.length - visibleCount} remaining</span>
                </button>
              )}
            </div>
          )}
        </section>

        {/* ── DETAIL MODAL ─────────────────────────────────────────────────────── */}
        {detailPanel && (
          <div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setDetailPanel(null)}
            role="dialog"
            aria-modal="true"
          >
            <div
              ref={detailPanelRef}
              tabIndex={-1}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col outline-none"
            >
              <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-200">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Detail</p>
                  <h3 className="text-base font-black text-slate-900">{detailPanel.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{detailPanel.description}</p>
                </div>
                <button type="button" onClick={() => setDetailPanel(null)}
                  className="text-slate-400 hover:text-slate-700 font-bold text-sm border border-slate-200 rounded-lg px-3 py-1.5 shrink-0">
                  Close
                </button>
              </div>
              <div className="overflow-y-auto flex-1 px-6 py-4">
                {detailPanel.items.length ? (
                  <ul className="space-y-3">
                    {detailPanel.items.map(item => (
                      <li key={item.key || item.summary} className="flex items-start justify-between gap-3 text-sm border-b border-slate-100 pb-3">
                        <div>
                          <p className="font-mono font-bold text-blue-700">{item.key}</p>
                          <p className="text-slate-600">{item.summary || item.status || item.reason}</p>
                        </div>
                        <button type="button" onClick={() => copyToClipboard(item.key || item.summary)}
                          className="text-xs font-semibold text-slate-500 border border-slate-200 rounded px-2 py-1 hover:bg-slate-50 shrink-0">
                          Copy
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500 italic">No items available for this detail view.</p>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
      <ScrollToTopFab />
    </AppShell>
  );
}
