// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// /charts — Visual Analytics: two tabs (bar/line Charts + donut Circles).
'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';
import AppShell from '@/components/layout/AppShell';
import { SvgIcon } from '@/components/ui/SvgIcon';
import type { DashboardMetrics } from '@/types/metrics';
import { loadMetricsWithSource } from '@/lib/storage';
import { redirectWithLoadError } from '@/lib/loadErrorSignal';
import SprintVelocityChart from '@/components/charts/SprintVelocityChart';
import ChartCustomizerPanel from '@/components/charts/ChartCustomizerPanel';
import { getChartPrefs, type ChartPref } from '@/lib/chartCustomizer';
import styles from './page.module.scss';

// ── Constants ─────────────────────────────────────────────────────────────────
const DONE_ST   = ['done', 'closed', 'resolved'];
const ACTIVE_ST = ['in progress', 'code review', 'qa', 'testing', 'uat'];
const PALETTE   = ['#2563eb', '#14b8a6', '#f59e0b', '#7c3aed', '#0891b2', '#f97316', '#16a34a', '#dc2626'];

const HEALTH_CSS: Record<string, string> = {
  good:     'var(--color-success, #22c55e)',
  warning:  'var(--color-warning, #f59e0b)',
  critical: 'var(--color-danger, #dc2626)',
};

const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();

// ── Types ─────────────────────────────────────────────────────────────────────
interface Seg { label: string; value: number; color: string; }

// ── SVG Donut (animated arcs) ─────────────────────────────────────────────────
const DONUT_R = 52;
const DONUT_CIRC = 2 * Math.PI * DONUT_R;
const DONUT_GAP  = 3; // gap between arcs in px

function AnimatedDonut({
  segs,
  size = 140,
  centerVal,
  centerSub,
  delayBase = 0,
}: {
  segs: Seg[];
  size?: number;
  centerVal?: string | number;
  centerSub?: string;
  delayBase?: number;
}) {
  const total = Math.max(segs.reduce((s, g) => s + (g.value || 0), 0), 1);
  const cx = size / 2;
  const cy = size / 2;
  const r  = (size / 2) * 0.68;
  const circ = 2 * Math.PI * r;
  const gap  = segs.length > 1 ? (DONUT_GAP / DONUT_CIRC) * circ : 0;

  let offset = 0; // cumulative arc offset (starts at top = -circ/4)

  return (
    <svg
      className={styles.donutSvg}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label="Donut chart"
      style={{ '--spin-delay': `${delayBase}ms` } as CSSProperties}
    >
      {/* Background ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--color-subtle,#f1f5f9)" strokeWidth={size * 0.09} />

      {segs.map((seg, i) => {
        const segLen   = (seg.value / total) * circ - gap;
        const startOff = circ / 4 - offset; // SVG starts at 3 o'clock; adjust to 12 o'clock
        const endOff   = startOff - segLen;
        offset += segLen + gap;

        return (
          <circle
            key={i}
            className={styles.donutArc}
            cx={cx}
            cy={cy}
            r={r}
            stroke={seg.color}
            strokeWidth={size * 0.09}
            style={{
              '--arc-len':   `${circ}`,
              '--arc-end':   `${endOff}`,
              '--arc-delay': `${delayBase + i * 120}ms`,
              '--arc-dur':   '850ms',
              strokeDasharray: `${circ}`,
              strokeDashoffset: endOff,
              transform: 'rotate(-90deg)',
              transformOrigin: `${cx}px ${cy}px`,
            } as CSSProperties}
          />
        );
      })}

      {/* Center text */}
      <text x={cx} y={cy - (centerSub ? size * 0.06 : 0)} className={styles.donutCenter}>
        <tspan className={styles.donutCenterVal} style={{ fontSize: size * 0.13 }}>{centerVal}</tspan>
      </text>
      {centerSub && (
        <text x={cx} y={cy + size * 0.1} className={styles.donutCenter}>
          <tspan className={styles.donutCenterSub} style={{ fontSize: size * 0.065 }}>{centerSub}</tspan>
        </text>
      )}
    </svg>
  );
}

// ── Widget card ────────────────────────────────────────────────────────────────
function Widget({
  title, icon, desc, source, children, colSpan = 1, delay = 0,
}: {
  title: string; icon: string; desc: string; source: string;
  children: React.ReactNode; colSpan?: 1 | 2 | 3; delay?: number;
}) {
  return (
    <article
      className={clsx(styles.widget, colSpan === 3 && styles.colSpan3, colSpan === 2 && styles.colSpan2)}
      style={{ '--widget-delay': `${delay}ms`, '--widget-dur': '320ms' } as CSSProperties}
    >
      <header className={styles.widgetHead}>
        <div className={styles.widgetIconBox} aria-hidden="true"><SvgIcon name={icon} size={20} /></div>
        <div className={styles.widgetMeta}>
          <p className={styles.widgetTitle}>{title}</p>
          <p className={styles.widgetDesc}>{desc}</p>
          <span className={styles.widgetSource}><SvgIcon name="download" size={12} /> {source}</span>
        </div>
      </header>
      <div className={styles.widgetBody}>{children}</div>
    </article>
  );
}

// ── Animated horizontal bar ────────────────────────────────────────────────────
function HBar({ label, pct, color, valLabel, delay = 0 }: {
  label: string; pct: number; color: string; valLabel: string; delay?: number;
}) {
  return (
    <div className={styles.hBarRow}>
      <span className={styles.hBarLabel} title={label}>{label}</span>
      <div className={styles.hBarTrack}>
        <div
          className={styles.hBarFill}
          style={{ '--bar-w': `${pct}%`, '--bar-color': color, '--bar-delay': `${delay}ms` } as CSSProperties}
        />
      </div>
      <span className={styles.hBarVal}>{valLabel}</span>
    </div>
  );
}

// ── Animated vertical bar ─────────────────────────────────────────────────────
function VBar({ label, valLabel, pct, color, delay = 0 }: {
  label: string; valLabel: string; pct: number; color: string; delay?: number;
}) {
  return (
    <div className={styles.vBarCol}>
      <span className={styles.vBarValLabel}>{valLabel}</span>
      <div className={styles.vBarTrack}>
        <div
          className={styles.vBarFill}
          style={{ '--bar-h': `${Math.max(3, pct)}%`, '--bar-color': color, '--bar-delay': `${delay}ms` } as CSSProperties}
        />
      </div>
      <span className={styles.vBarName} title={label}>{label}</span>
    </div>
  );
}

// ── Gantt row ─────────────────────────────────────────────────────────────────
const HEALTH_META = {
  good:     { color: '#16a34a', bg: 'rgba(22,163,74,0.06)',    accent: '#16a34a', chipBg: '#dcfce7', chipFg: '#15803d', label: 'On track'  },
  warning:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.07)',   accent: '#f59e0b', chipBg: '#fef9c3', chipFg: '#a16207', label: 'At risk'   },
  critical: { color: '#dc2626', bg: 'rgba(220,38,38,0.06)',    accent: '#dc2626', chipBg: '#fee2e2', chipFg: '#b91c1c', label: 'Critical'  },
};

function GanttRow({ label, pct, done, total, health, delay = 0 }: {
  label: string; pct: number; done: number; total: number;
  health: 'good' | 'warning' | 'critical'; delay?: number;
}) {
  const m = HEALTH_META[health] ?? HEALTH_META.warning;

  return (
    <div
      className={styles.ganttRow}
      style={{
        '--row-bg':     m.bg,
        '--row-accent': m.accent,
      } as CSSProperties}
    >
      {/* Label column */}
      <div className={styles.ganttRowLabel}>
        <span className={styles.ganttRowName} title={label}>{label}</span>
        <span className={styles.ganttRowSub}>{done} of {total} issues</span>
      </div>

      {/* Bar track */}
      <div className={styles.ganttTrack}>
        <div className={styles.ganttTick} />
        <div className={styles.ganttTick} />
        <div className={styles.ganttTick} />
        <div
          className={styles.ganttFill}
          style={{ '--bar-w': `${pct}%`, '--bar-color': m.color, '--bar-delay': `${delay}ms` } as CSSProperties}
        />
      </div>

      {/* Health chip */}
      <span
        className={styles.ganttHealthChip}
        style={{ '--chip-bg': m.chipBg, '--chip-fg': m.chipFg } as CSSProperties}
      >
        {m.label}
      </span>

      {/* % + fraction */}
      <div className={styles.ganttDoneCell}>
        <span className={styles.ganttPct} style={{ '--bar-color': m.color } as CSSProperties}>{pct}%</span>
      </div>
    </div>
  );
}

// ── DonutBlock (legend + svg) ─────────────────────────────────────────────────
function DonutBlock({ segs, total, centerVal, centerSub, size = 130, delayBase = 0 }: {
  segs: Seg[]; total: number; centerVal: string | number; centerSub: string;
  size?: number; delayBase?: number;
}) {
  return (
    <div className={styles.donutWrap}>
      <AnimatedDonut segs={segs} size={size} centerVal={centerVal} centerSub={centerSub} delayBase={delayBase} />
      <div className={styles.donutLegend}>
        {segs.map((s, i) => (
          <div key={i} className={styles.donutLegendRow}>
            <div className={styles.donutLegendDot} style={{ '--dot-color': s.color } as CSSProperties} />
            <span className={styles.donutLegendLabel}>{s.label}</span>
            <span className={styles.donutLegendVal}>{s.value}</span>
            <span className={styles.donutLegendPct}>{Math.round((s.value / total) * 100)}%</span>
          </div>
        ))}
        <hr className={styles.donutDivider} />
        <div className={styles.donutTotal}>
          <span>Total</span>
          <span className={styles.donutTotalVal}>{total}</span>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function ChartsPage() {
  const router = useRouter();
  const [metrics,    setMetrics]    = useState<DashboardMetrics | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [chartPrefs, setChartPrefs] = useState<ChartPref[]>([]);
  const [tab,        setTab]        = useState<'charts' | 'circles'>('charts');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await loadMetricsWithSource();
        if (cancelled) return;
        const data = result.metrics as DashboardMetrics | null;
        if (!data) { router.replace('/'); return; }
        setMetrics(data);
        setChartPrefs(getChartPrefs());
      } catch { redirectWithLoadError(router); }
      finally   { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [router]);

  // ── Derived data ────────────────────────────────────────────────────────────
  // Memoized as one view model: these ~10 filter/reduce/map passes ran over the
  // full flow.items array on every render, including tab switches and chart-
  // visibility toggles (neither of which changes `metrics`) before this fix.
  const derived = useMemo(() => {
    const flow   = metrics?.flow        || ({} as any);
    const sp     = metrics?.storyPoints || ({} as any);
    const items  = (flow.items || [])  as any[];
    const total  = Math.max(items.length, 1);

    // Delivery composition
    const doneBucket     = items.filter(i => DONE_ST.includes(norm(i.status))).length;
    const criticalBucket = items.filter(i => !DONE_ST.includes(norm(i.status)) && norm(i.health) === 'critical').length;
    const warningBucket  = items.filter(i => !DONE_ST.includes(norm(i.status)) && norm(i.health) === 'warning').length;
    const activeBucket   = items.filter(i => ACTIVE_ST.includes(norm(i.status)) && !DONE_ST.includes(norm(i.status)) && norm(i.health) !== 'critical' && norm(i.health) !== 'warning').length;
    const otherBucket    = Math.max(total - doneBucket - criticalBucket - warningBucket - activeBucket, 0);

    const deliverySegs: Seg[] = [
      { label: 'Done',        value: doneBucket,     color: '#16a34a' },
      { label: 'In Progress', value: activeBucket,   color: '#2563eb' },
      { label: 'At Risk',     value: warningBucket,  color: '#f59e0b' },
      { label: 'Critical',    value: criticalBucket, color: '#dc2626' },
      { label: 'Backlog',     value: otherBucket,    color: '#cbd5e1' },
    ].filter(s => s.value > 0);

    const healthSegs: Seg[] = [
      { label: 'Good',     value: flow.good     || 0, color: '#16a34a' },
      { label: 'Warning',  value: flow.warning  || 0, color: '#f59e0b' },
      { label: 'Critical', value: flow.critical || 0, color: '#dc2626' },
    ].filter(s => s.value > 0);

    const typeList   = ((metrics?.types || []) as any[]).slice(0, 6);
    const typeTotal  = Math.max(typeList.reduce((s: number, t: any) => s + (t.count || 0), 0), 1);
    const typeSegs: Seg[] = typeList.map((t: any, i: number) => ({ label: t.type, value: t.count, color: PALETTE[i % PALETTE.length] }));

    const spPct    = sp.pointCompletionRate || 0;
    const spSegs: Seg[] = sp.totalStoryPoints > 0
      ? [{ label: 'Completed', value: sp.completedStoryPoints || 0, color: '#16a34a' }, { label: 'Remaining', value: sp.remainingStoryPoints || 0, color: '#e2e8f0' }]
      : [];

    const sprints    = ((metrics?.sprint?.sprints || []) as any[]).slice(0, 7).reverse();
    const maxSprint  = Math.max(...sprints.map((s: any) => s.issues || 0), 1);

    const capacity  = ((metrics?.capacity || []) as any[]).slice(0, 8);
    const maxLoad   = Math.max(...capacity.map((c: any) => c.loadShare || 0), 1);

    const quarters  = ((metrics?.quarters || []) as any[]).filter((q: any) => q.quarter !== 'No date').slice(0, 6).reverse();
    const maxQ      = Math.max(...quarters.map((q: any) => q.issues || 0), 1);

    const kanbanTop = (((metrics?.kanban as any)?.byStatus || []) as any[]).slice(0, 8);
    const maxKanban = Math.max(...kanbanTop.map((k: any) => k.count || 0), 1);

    const labelStats  = (((metrics?.labels as any)?.labelStats || []) as any[]).filter((l: any) => l.label !== '(unlabeled)').slice(0, 7);
    const maxLabel    = Math.max(...labelStats.map((l: any) => l.count || 0), 1);

    const epics = ((metrics?.epics || []) as any[]).slice(0, 10);

    const relations  = (metrics?.relations as any) || {};
    const linkSegs: Seg[] = relations.hasLinks
      ? ((relations.linkStats || []) as any[]).slice(0, 5).map((l: any, i: number) => ({ label: l.type, value: l.count, color: PALETTE[i % PALETTE.length] }))
      : [];
    const linkTotal = Math.max(linkSegs.reduce((s, l) => s + l.value, 0), 1);

    const healthTotal = Math.max((flow.good || 0) + (flow.warning || 0) + (flow.critical || 0), 1);
    const spTotal     = sp.totalStoryPoints || 0;

    const KPI_PILLS = [
      { val: `${metrics?.completionRate || 0}%`, lbl: 'Complete',    grad: 'linear-gradient(135deg,#16a34a,#14b8a6)' },
      { val: flow.critical || 0,                lbl: 'Critical',    grad: 'linear-gradient(135deg,#dc2626,#f97316)' },
      { val: metrics?.healthScore || 0,          lbl: 'Health Score', grad: 'linear-gradient(135deg,#2563eb,#7c3aed)' },
      ...(metrics?.prediction && !metrics.prediction.complete && metrics.prediction.daysRemaining !== null
        ? [{ val: `~${metrics.prediction.daysRemaining}d`, lbl: 'Est. Done', grad: 'linear-gradient(135deg,#0891b2,#2563eb)' }]
        : []),
    ];

    return {
      total, deliverySegs, healthSegs, typeSegs, typeTotal, spPct, spSegs,
      sprints, maxSprint, capacity, maxLoad, quarters, maxQ, kanbanTop,
      maxKanban, labelStats, maxLabel, epics, relations, linkSegs, linkTotal,
      healthTotal, spTotal, KPI_PILLS,
    };
  }, [metrics]);

  const {
    total, deliverySegs, healthSegs, typeSegs, typeTotal, spPct, spSegs,
    sprints, maxSprint, capacity, maxLoad, quarters, maxQ, kanbanTop,
    maxKanban, labelStats, maxLabel, epics, relations, linkSegs, linkTotal,
    healthTotal, spTotal, KPI_PILLS,
  } = derived;

  if (loading) return (
    <AppShell showNav>
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm animate-pulse">
        Loading charts…
      </div>
    </AppShell>
  );
  if (!metrics) return null;

  // ── Chart pref helpers ──────────────────────────────────────────────────────
  const isVisible = (id: string) => {
    if (!chartPrefs.length) return true;
    const p = chartPrefs.find(c => c.id === id);
    return p ? p.visible : true;
  };
  const span = (id: string): 1 | 2 | 3 => {
    if (!chartPrefs.length) return 1;
    const p = chartPrefs.find(c => c.id === id);
    return (p?.span as 1 | 2 | 3) ?? 1;
  };

  return (
    <AppShell showNav>
      <div className={styles.page}>

        {/* ── Header ── */}
        <div className={styles.pageHead}>
          <div className={styles.headLeft}>
            <button type="button" className={styles.breadcrumb} onClick={() => router.push('/summary')}>
              ← Overview
            </button>
            <h1 id="tour-header-charts" className={styles.pageTitle}>Visual Analytics</h1>
            <p className={styles.pageSubtitle}>
              Charts and diagrams summarising delivery health, flow, team, and progress — all derived from your Jira export.
            </p>
          </div>
          <ChartCustomizerPanel onPrefsChange={setChartPrefs} />
          <div className={styles.kpiStrip}>
            {KPI_PILLS.map((p, i) => (
              <div
                key={p.lbl}
                className={styles.kpiPill}
                style={{ '--pill-gradient': p.grad, '--pill-delay': `${i * 60}ms` } as CSSProperties}
              >
                <span className={styles.kpiVal}>{p.val}</span>
                <span className={styles.kpiLbl}>{p.lbl}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div id="tour-section-charts-1" className={styles.tabBar} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'charts'}
            className={clsx(styles.tabBtn, tab === 'charts' && styles.tabBtnActive)}
            onClick={() => setTab('charts')}
          >
            <SvgIcon name="chartBar" size={14} />
            Bar Charts
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'circles'}
            className={clsx(styles.tabBtn, tab === 'circles' && styles.tabBtnActive)}
            onClick={() => setTab('circles')}
          >
            🍩 Circles
          </button>
        </div>

        {/* ═══════════════════ TAB: CHARTS ═══════════════════ */}
        {tab === 'charts' && (
          <div key="charts" className={styles.grid}>

            {/* Sprint Velocity — id: 'velocity' */}
            {isVisible('velocity') && sprints.length > 0 && (
              <Widget
                title="Sprint Velocity"
                icon="🏃"
                desc="Issues completed per sprint. Green = ≥80% completion rate, amber = ≥60%, red = below."
                source="Sprint field + Status"
                colSpan={span('velocity')}
                delay={0}
              >
                <div className={styles.vBarsWrap}>
                  {sprints.map((s: any, i: number) => {
                    const cr    = s.completionRate ?? 0;
                    const color = cr >= 80 ? '#16a34a' : cr >= 60 ? '#f59e0b' : '#dc2626';
                    return (
                      <VBar
                        key={s.name}
                        label={s.name || `S${i + 1}`}
                        valLabel={String(s.issues)}
                        pct={Math.max(3, Math.min(100, (s.issues / maxSprint) * 100))}
                        color={color}
                        delay={i * 60}
                      />
                    );
                  })}
                </div>
                <div id="tour-section-charts-2" className={styles.legendRow}>
                  {[['#16a34a','≥80% done'],['#f59e0b','≥60% done'],['#dc2626','<60% done']].map(([c,l]) => (
                    <span key={l} className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ '--dot-color': c } as CSSProperties} />
                      {l}
                    </span>
                  ))}
                </div>
              </Widget>
            )}

            {/* Team Load — id: 'team' */}
            {isVisible('team') && capacity.length > 0 && (
              <Widget
                title="Team Load"
                icon="👥"
                desc="Each team member's share of open issues. High load (>35%) risks burnout and delayed delivery."
                source="Assignee field"
                colSpan={span('team')}
                delay={60}
              >
                {capacity.map((c: any, i: number) => {
                  const share = c.loadShare || 0;
                  const color = share > 35 ? '#dc2626' : share > 20 ? '#f59e0b' : '#16a34a';
                  return (
                    <HBar
                      key={c.assignee}
                      label={c.assignee || '(unassigned)'}
                      pct={Math.max(0, Math.min(100, (share / maxLoad) * 100))}
                      color={color}
                      valLabel={`${share}%`}
                      delay={i * 50}
                    />
                  );
                })}
              </Widget>
            )}

            {/* Quarter Throughput — id: 'quarters' */}
            {isVisible('quarters') && quarters.length > 0 && (
              <Widget
                title="Quarter Throughput"
                icon="📅"
                desc="Total issues created per quarter. Spot whether your team's intake is growing or shrinking over time."
                source="Created Date + Resolution Date"
                colSpan={span('quarters')}
                delay={120}
              >
                <div className={styles.vBarsWrap}>
                  {quarters.map((q: any, i: number) => (
                    <VBar
                      key={q.quarter}
                      label={q.quarter}
                      valLabel={String(q.issues)}
                      pct={Math.max(3, Math.min(100, (q.issues / maxQ) * 100))}
                      color="#2563eb"
                      delay={i * 60}
                    />
                  ))}
                </div>
                <div className={styles.legendRow}>
                  <span className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ '--dot-color': '#2563eb' } as CSSProperties} />
                    Issues per quarter
                  </span>
                </div>
              </Widget>
            )}

            {/* Kanban Status Flow — id: 'kanban' */}
            {isVisible('kanban') && kanbanTop.length > 0 && (
              <Widget
                title="Kanban Status Flow"
                icon="🗃️"
                desc="Volume of issues in each workflow status. Red = status contains critical issues, amber = warning, blue = healthy."
                source="Status field"
                colSpan={span('kanban')}
                delay={180}
              >
                {kanbanTop.map((k: any, i: number) => {
                  const color = k.critical > 0 ? '#dc2626' : k.warning > 0 ? '#f59e0b' : '#2563eb';
                  return (
                    <HBar
                      key={k.name}
                      label={k.name || '?'}
                      pct={Math.max(0, Math.min(100, (k.count / maxKanban) * 100))}
                      color={color}
                      valLabel={String(k.count)}
                      delay={i * 50}
                    />
                  );
                })}
              </Widget>
            )}

            {/* Label Distribution — id: 'labels' */}
            {isVisible('labels') && labelStats.length > 0 && (
              <Widget
                title="Label Distribution"
                icon="🏷️"
                desc="How issues are tagged by label. Useful for spotting which themes or categories hold the most work."
                source="Labels field"
                colSpan={span('labels')}
                delay={240}
              >
                {labelStats.map((l: any, i: number) => (
                  <HBar
                    key={l.label}
                    label={l.label}
                    pct={Math.max(0, Math.min(100, (l.count / maxLabel) * 100))}
                    color={PALETTE[i % PALETTE.length]}
                    valLabel={String(l.count)}
                    delay={i * 50}
                  />
                ))}
              </Widget>
            )}

            {/* Epic / Sprint Gantt — id: 'timeline' */}
            {isVisible('timeline') && (epics.length > 0 || sprints.length > 0) && (
              <Widget
                title={epics.length > 0 ? 'Epic Delivery Progress' : 'Sprint Completion'}
                icon="📊"
                desc={epics.length > 0
                  ? 'Completion % per epic. Bar color reflects health: green = on track, amber = at risk, red = critical.'
                  : 'Sprint-level completion rate. Red sprints need immediate attention.'}
                source={epics.length > 0 ? 'Epic Link + Status' : 'Sprint field + Status'}
                colSpan={span('timeline') as 1 | 2 | 3}
                delay={300}
              >
                <div className={styles.ganttScaleRow}>
                  <span className={styles.ganttColHead}>{epics.length > 0 ? 'Epic' : 'Sprint'}</span>
                  <div className={styles.ganttScale}>
                    {['0%','25%','50%','75%','100%'].map(t => <span key={t}>{t}</span>)}
                  </div>
                  <span className={styles.ganttColHead}>Status</span>
                  <span className={styles.ganttDoneHead}>Progress</span>
                </div>
                {(epics.length > 0 ? epics : sprints).slice(0, 12).map((row: any, i: number) => {
                  const isEpic = epics.length > 0;
                  const pct    = isEpic ? (row.progress || 0) : (row.completionRate || 0);
                  const health: 'good' | 'warning' | 'critical' = isEpic
                    ? (row.critical > 0 ? 'critical' : row.warning > 0 ? 'warning' : 'good')
                    : (pct >= 80 ? 'good' : pct >= 50 ? 'warning' : 'critical');
                  return (
                    <GanttRow
                      key={i}
                      label={isEpic ? (row.epic || 'No epic') : (row.name || `Sprint ${i + 1}`)}
                      pct={pct}
                      done={row.completedIssues || 0}
                      total={row.issues || 0}
                      health={health}
                      delay={i * 40}
                    />
                  );
                })}
              </Widget>
            )}

            {/* Story Points sprint chart (if available) — uses 'velocity' pref */}
            {isVisible('velocity') && metrics.throughput?.sprint && (
              <div className={styles.colSpan3} style={{ '--widget-delay': '360ms', '--widget-dur': '320ms' } as CSSProperties}>
                <SprintVelocityChart summary={metrics.throughput.sprint} />
              </div>
            )}

          </div>
        )}

        {/* ═══════════════════ TAB: CIRCLES ═══════════════════ */}
        {tab === 'circles' && (
          <div key="circles" className={styles.grid}>

            {/* Delivery Composition — id: 'delivery' */}
            {isVisible('delivery') && deliverySegs.length > 0 && (
              <Widget
                title="Delivery Composition"
                icon="💠"
                desc="Breakdown of all issues by delivery state. The center % shows overall completion. Each ring segment is one delivery state."
                source="Status field → grouped into Done / Active / At Risk / Critical / Backlog"
                colSpan={span('delivery')}
                delay={0}
              >
                <DonutBlock
                  segs={deliverySegs}
                  total={total}
                  centerVal={`${metrics.completionRate || 0}%`}
                  centerSub="complete"
                  size={150}
                  delayBase={0}
                />
              </Widget>
            )}

            {/* Health Mix — id: 'health' */}
            {isVisible('health') && healthSegs.length > 0 && (
              <Widget
                title="Health Mix"
                icon="🏥"
                desc="Distribution of issue health across the board. Critical and warning items need immediate attention from the team."
                source="Health field (computed from flag, blocker, and age thresholds)"
                colSpan={span('health')}
                delay={60}
              >
                <DonutBlock
                  segs={healthSegs}
                  total={healthTotal}
                  centerVal={healthTotal}
                  centerSub="items"
                  size={150}
                  delayBase={60}
                />
              </Widget>
            )}

            {/* Issue Types — id: 'types' */}
            {isVisible('types') && typeSegs.length > 0 && (
              <Widget
                title="Issue Types"
                icon="📁"
                desc="Top issue types by volume. See Delivery Mix for the full categorised breakdown."
                source="Issue Type field"
                colSpan={span('types')}
                delay={120}
              >
                {[...typeSegs]
                  .sort((a, b) => b.value - a.value)
                  .slice(0, 3)
                  .map((s, i) => (
                    <HBar
                      key={s.label}
                      label={s.label}
                      pct={Math.max(0, Math.min(100, (s.value / typeTotal) * 100))}
                      color={s.color}
                      valLabel={String(s.value)}
                      delay={i * 50}
                    />
                  ))}
                <Link href="/delivery-mix" className={styles.widgetLinkOut}>
                  View full breakdown on Delivery Mix →
                </Link>
              </Widget>
            )}

            {/* Story Points — id: 'points' */}
            {isVisible('points') && spSegs.length > 0 && (
              <Widget
                title="Story Points"
                icon="💎"
                desc="Points completed vs remaining. The center % is the point completion rate, which often lags issue count if large stories remain."
                source="Story Points field (original estimate)"
                colSpan={span('points')}
                delay={180}
              >
                <DonutBlock
                  segs={spSegs}
                  total={spTotal}
                  centerVal={`${spPct}%`}
                  centerSub="pts done"
                  size={150}
                  delayBase={180}
                />
              </Widget>
            )}

            {/* Issue Relations — id: 'links' */}
            {isVisible('links') && linkSegs.length > 0 && (
              <Widget
                title="Issue Relations"
                icon="🔗"
                desc="Types of links between issues (blocks, is blocked by, relates to, clones, etc.). High 'blocks' links indicate dependency risk."
                source="Issue Links field"
                colSpan={span('links')}
                delay={240}
              >
                <DonutBlock
                  segs={linkSegs}
                  total={linkTotal}
                  centerVal={relations.totalLinks || linkTotal}
                  centerSub="links"
                  size={150}
                  delayBase={240}
                />
              </Widget>
            )}

            {/* Epic Progress circles — id: 'timeline' */}
            {isVisible('timeline') && epics.length > 0 && (
              <Widget
                title="Epic Completion Rings"
                icon="🎯"
                desc="Each ring shows how far a single epic is through its issues. Full green ring = 100% done. Red/amber = blocked or behind."
                source="Epic Link + Status → completion %"
                colSpan={span('timeline') as 1 | 2 | 3}
                delay={300}
              >
                <div className="flex flex-wrap gap-6">
                  {epics.map((e: any, i: number) => {
                    const pct    = Math.min(100, e.progress || 0);
                    const health = e.critical > 0 ? 'critical' : e.warning > 0 ? 'warning' : 'good';
                    const color  = HEALTH_CSS[health];
                    const seg: Seg = { label: 'Done', value: pct, color };
                    const bg: Seg  = { label: 'Remaining', value: 100 - pct, color: 'var(--color-subtle,#f1f5f9)' };
                    return (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <AnimatedDonut
                          segs={pct > 0 ? [seg, bg] : [bg]}
                          size={88}
                          centerVal={`${pct}%`}
                          delayBase={i * 80}
                        />
                        <span
                          className="text-center leading-tight font-semibold max-w-[80px] truncate"
                          style={{ fontSize: 9, color: 'var(--color-text-secondary,#64748b)' }}
                          title={e.epic}
                        >
                          {(e.epic || 'No epic').slice(0, 14)}
                        </span>
                        <span style={{ fontSize: 9, color: 'var(--color-text-muted,#94a3b8)' }}>
                          {e.completedIssues}/{e.issues}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Widget>
            )}

          </div>
        )}

        {/* ── CTA row ── */}
        <div className={styles.ctaRow}>
          <button type="button" onClick={() => router.push('/')} className="btn-secondary px-5 py-2.5">
            Upload new file
          </button>
          <button type="button" onClick={() => router.push('/summary')} className="btn-secondary px-5 py-2.5">
            ← Overview
          </button>
          <button type="button" onClick={() => router.push('/dashboard')} className="btn-primary px-5 py-2.5">
            View Full Report →
          </button>
        </div>

      </div>
    </AppShell>
  );
}
