// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// /sprint-kanban — Sprint throughput, delivery patterns, kanban flow health.
'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import AppShell from '@/components/layout/AppShell';
import { loadMetricsWithSource } from '@/lib/storage';
import type { DashboardMetrics } from '@/types/metrics';
import type {
  SprintThroughput,
  MidSprintInsight,
  KanbanPeriod,
  SprintGoalOutcome,
  SprintDeliveryPattern,
  KanbanFlowHealth,
  KanbanBottleneckStatus,
} from '@/types/throughput';
import styles from './page.module.scss';

// ── Semantic color maps (all passed as CSS custom properties) ─────────────────
// EXCEPTION: colors are data-driven from outcome/pattern enum values

const GOAL_COLORS: Record<SprintGoalOutcome, { bg: string; fg: string }> = {
  'Met':           { bg: 'color-mix(in srgb,#22c55e 12%,transparent)', fg: '#15803d' },
  'Partially Met': { bg: 'color-mix(in srgb,#f59e0b 12%,transparent)', fg: '#92400e' },
  'Missed':        { bg: 'color-mix(in srgb,#dc2626 10%,transparent)', fg: '#b91c1c' },
  'At Risk':       { bg: 'color-mix(in srgb,#ea580c 10%,transparent)', fg: '#9a3412' },
  'Unknown':       { bg: 'color-mix(in srgb,#94a3b8 10%,transparent)', fg: '#64748b' },
};

const PATTERN_COLORS: Record<SprintDeliveryPattern, { bg: string; fg: string; border: string; label: string }> = {
  'Healthy Early Progress': { bg: 'color-mix(in srgb,#22c55e 10%,transparent)', fg: '#15803d', border: '#22c55e', label: 'Healthy'      },
  'End-Loaded Sprint':      { bg: 'color-mix(in srgb,#f59e0b 10%,transparent)', fg: '#92400e', border: '#f59e0b', label: 'End-Loaded'   },
  'Scope Instability':      { bg: 'color-mix(in srgb,#8b5cf6 10%,transparent)', fg: '#6d28d9', border: '#8b5cf6', label: 'Scope Drift'  },
  'Blocked Sprint':         { bg: 'color-mix(in srgb,#dc2626 10%,transparent)', fg: '#b91c1c', border: '#dc2626', label: 'Blocked'      },
  'Late Delivery Risk':     { bg: 'color-mix(in srgb,#ea580c 10%,transparent)', fg: '#9a3412', border: '#ea580c', label: 'Late Risk'    },
  'Unknown':                { bg: 'color-mix(in srgb,#94a3b8 10%,transparent)', fg: '#64748b', border: '#94a3b8', label: 'Unknown'      },
};

const FLOW_HEALTH_COLORS: Record<KanbanFlowHealth, string> = {
  'Healthy':   '#16a34a',
  'At Risk':   '#d97706',
  'Degraded':  '#dc2626',
};

const BOTTLENECK_COLORS: Record<KanbanBottleneckStatus, string> = {
  'None':     '#16a34a',
  'Mild':     '#d97706',
  'Moderate': '#ea580c',
  'Severe':   '#dc2626',
};

function pctColor(pct: number): string {
  if (pct >= 80) return '#16a34a';
  if (pct >= 50) return '#d97706';
  return '#dc2626';
}

// ── Small chips ───────────────────────────────────────────────────────────────
function GoalChip({ outcome, delay }: { outcome: SprintGoalOutcome; delay?: number }) {
  const c = GOAL_COLORS[outcome] ?? GOAL_COLORS['Unknown'];
  return (
    <span
      className={styles.goalChip}
      style={{ '--chip-bg': c.bg, '--chip-fg': c.fg, '--chip-delay': `${delay ?? 0}ms` } as CSSProperties}
    >
      {outcome}
    </span>
  );
}

function PatternChip({ pattern, delay }: { pattern: SprintDeliveryPattern; delay?: number }) {
  const c = PATTERN_COLORS[pattern] ?? PATTERN_COLORS['Unknown'];
  return (
    <span
      className={styles.patternChip}
      style={{ '--chip-bg': c.bg, '--chip-fg': c.fg, '--chip-delay': `${delay ?? 0}ms` } as CSSProperties}
    >
      {c.label}
    </span>
  );
}

// ── Sprint row ────────────────────────────────────────────────────────────────
function SprintRow({ sp, index, isLatest }: { sp: SprintThroughput; index: number; isLatest: boolean }) {
  const pct     = sp.completionPct;
  const color   = pctColor(pct);
  const pattern = PATTERN_COLORS[sp.deliveryPattern] ?? PATTERN_COLORS['Unknown'];
  const delay   = index * 50;

  return (
    <div
      className={styles.sprintRow}
      data-latest={isLatest ? 'true' : undefined}
      style={{ '--row-delay': `${delay}ms` } as CSSProperties}
    >
      {/* Top row: name + chips + pct */}
      <div className={styles.sprintRowTop}>
        <span className={styles.sprintName}>{sp.sprintName}</span>
        {isLatest && (
          <GoalChip outcome={sp.goalOutcome} delay={delay + 80} />
        )}
        <PatternChip pattern={sp.deliveryPattern} delay={delay + 120} />
        <span
          className={styles.sprintPct}
          style={{ '--pct-color': color } as CSSProperties}
        >
          {pct}%
        </span>
      </div>

      {/* Progress bar */}
      <div className={styles.sprintTrack}>
        <div
          className={styles.sprintFill}
          style={{ '--bar-w': `${pct}%`, '--pct-color': color, '--bar-delay': `${delay}ms` } as CSSProperties}
        />
      </div>

      {/* Meta: issues, points, scope changes */}
      <div className={styles.sprintMeta}>
        <span className={styles.sprintMetaItem}>
          {sp.completedCount} of {sp.committedCount} issues
        </span>
        {sp.committedPoints > 0 && (
          <span className={styles.sprintMetaItem}>
            {sp.completedPoints}/{sp.committedPoints} pts
          </span>
        )}
        {sp.carryoverCount > 0 && (
          <span className={styles.sprintMetaAlert} data-type="carryover">
            {sp.carryoverCount} carried over
          </span>
        )}
        {sp.addedScopeCount > 0 && (
          <span className={styles.sprintMetaAlert} data-type="scope">
            +{sp.addedScopeCount} scope added
          </span>
        )}
        {sp.blockedCount > 0 && (
          <span className={styles.sprintMetaAlert} data-type="blocked">
            {sp.blockedCount} blocked
          </span>
        )}
        {/* Delivery confidence mini bar */}
        <div className={styles.confidenceBar} style={{ marginLeft: 'auto' }}>
          <div className={styles.confidenceTrack}>
            <div
              className={styles.confidenceFill}
              style={{
                '--bar-w':    `${sp.deliveryConfidence}%`,
                '--pct-color': color,
                '--bar-delay': `${delay + 200}ms`,
              } as CSSProperties}
            />
          </div>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8' }}>
            {sp.deliveryConfidence}% confidence
          </span>
        </div>
      </div>

      {/* Pattern interpretation */}
      {sp.patternInterpretation && (
        <p
          className={styles.sprintInterpretation}
          style={{ '--pattern-color': pattern.border } as CSSProperties}
        >
          {sp.patternInterpretation}
        </p>
      )}
    </div>
  );
}

// ── Mid-sprint insight card ───────────────────────────────────────────────────
function MidCard({ m, index }: { m: MidSprintInsight; index: number }) {
  const color = pctColor(m.midSprintPct);
  return (
    <div className={styles.midCard} style={{ '--row-delay': `${index * 50}ms` } as CSSProperties}>
      <div className={styles.midCardHead}>
        <span className={styles.midSprintName}>{m.sprintName}</span>
        <PatternChip pattern={m.pattern} delay={index * 50 + 80} />
      </div>

      {/* Mid-sprint completion bar */}
      <div className={styles.midPctRow}>
        <span>Done by mid-sprint</span>
        <div className={styles.midPctTrack}>
          <div
            className={styles.midPctFill}
            style={{
              '--bar-w':    `${m.midSprintPct}%`,
              '--bar-color': color,
              '--bar-delay': `${index * 50}ms`,
            } as CSSProperties}
          />
        </div>
        <span className={styles.midPctLabel} style={{ '--bar-color': color } as CSSProperties}>
          {m.midSprintPct}%
        </span>
      </div>

      <p className={styles.midInterpretation}>{m.interpretation}</p>
    </div>
  );
}

// ── Board status bar ──────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  'in progress': '#2563eb',
  'code review': '#7c3aed',
  'qa':          '#d97706',
  'testing':     '#d97706',
  'uat':         '#d97706',
  'done':        '#16a34a',
  'closed':      '#16a34a',
  'resolved':    '#16a34a',
  'to do':       '#94a3b8',
  'backlog':     '#94a3b8',
  'blocked':     '#dc2626',
};

function BoardStatusBar({
  status,
  count,
  maxCount,
  index,
}: { status: string; count: number; maxCount: number; index: number }) {
  const safeStatus = status ?? '';
  const color = STATUS_COLORS[safeStatus.toLowerCase()] ?? '#94a3b8';
  const pct   = Math.round((count / maxCount) * 100);
  return (
    <div className={styles.boardRow} style={{ '--row-delay': `${index * 40}ms` } as CSSProperties}>
      <div className={styles.boardRowTop}>
        <span className={styles.boardStatusName}>{safeStatus || '(unknown)'}</span>
        <span className={styles.boardStatusCount} style={{ '--bar-color': color } as CSSProperties}>
          {count}
        </span>
      </div>
      <div className={styles.boardTrack}>
        <div
          className={styles.boardFill}
          style={{
            '--bar-w':    `${pct}%`,
            '--bar-color': color,
            '--bar-delay': `${index * 40}ms`,
          } as CSSProperties}
        />
      </div>
    </div>
  );
}

// ── Kanban period card ────────────────────────────────────────────────────────
function buildPeriodSummary(p: KanbanPeriod): string {
  if (p.bottleneckStatus === 'Severe')
    return `Severe bottleneck — work is piling up in one stage, slowing the whole board.`;
  if (p.bottleneckStatus === 'Moderate')
    return `Moderate bottleneck detected — one stage is lagging and creating a queue.`;
  if (p.avgCycleTimeDays > 14)
    return `Cycle time is long (${p.avgCycleTimeDays.toFixed(1)}d) — tasks take too long once started. Review WIP limits.`;
  if (p.avgLeadTimeDays > 21)
    return `Lead time exceeds 3 weeks — items wait a long time before being picked up. Reduce queue depth.`;
  if (p.agingWipCount > 0)
    return `${p.agingWipCount} item${p.agingWipCount > 1 ? 's are' : ' is'} aging (active > 14 days) — investigate what is stalling progress.`;
  if (p.blockedCount > 0)
    return `${p.blockedCount} blocked item${p.blockedCount > 1 ? 's' : ''} this period — unblock to improve throughput.`;
  if (p.flowHealth === 'Healthy')
    return `Flow is healthy this period. Work moves through the board at a good pace.`;
  return `Some flow issues detected — review the metrics below for areas to improve.`;
}

function PeriodCard({ p, index }: { p: KanbanPeriod; index: number }) {
  const accent  = FLOW_HEALTH_COLORS[p.flowHealth];
  const bColor  = BOTTLENECK_COLORS[p.bottleneckStatus];
  const hasBot  = p.bottleneckStatus !== 'None';
  const trend   = p.throughputTrend;
  const summary = buildPeriodSummary(p);

  // Flow health chip colors
  const flowChipBg  = `color-mix(in srgb,${accent} 12%,transparent)`;
  const flowChipFg  = accent;

  // Bottleneck chip colors
  const botChipBg   = `color-mix(in srgb,${bColor} 12%,transparent)`;
  const botChipFg   = bColor;

  // Metric health colors
  const cycleColor  = p.avgCycleTimeDays > 14 ? '#dc2626' : p.avgCycleTimeDays > 7 ? '#d97706' : '#16a34a';
  const leadColor   = p.avgLeadTimeDays  > 21 ? '#dc2626' : p.avgLeadTimeDays  > 10 ? '#d97706' : '#16a34a';
  const flowColor   = p.flowEfficiencyPct < 30 ? '#dc2626' : p.flowEfficiencyPct < 50 ? '#d97706' : '#16a34a';
  const wipColor    = 'var(--color-text-primary,#0f172a)';

  return (
    <div
      className={styles.periodCard}
      style={{ '--period-accent': accent, '--row-delay': `${index * 60}ms` } as CSSProperties}
    >
      {/* Header: period label + health chips */}
      <div className={styles.periodCardHead}>
        <span className={styles.periodLabel}>{p.periodLabel}</span>
        <div className={styles.periodChips}>
          <span
            className={styles.periodFlowChip}
            style={{ '--chip-bg': flowChipBg, '--chip-fg': flowChipFg } as CSSProperties}
          >
            {p.flowHealth}
          </span>
          {hasBot && (
            <span
              className={styles.periodBotChip}
              style={{ '--chip-bg': botChipBg, '--chip-fg': botChipFg } as CSSProperties}
            >
              {p.bottleneckStatus} bottleneck
            </span>
          )}
        </div>
      </div>

      {/* Plain-English summary */}
      <p
        className={styles.periodSummary}
        style={{ '--summary-color': hasBot ? bColor : accent } as CSSProperties}
      >
        {summary}
      </p>

      {/* 2×2 metric grid */}
      <div className={styles.periodMetricGrid}>
        {[
          { label: 'Cycle time',   val: p.avgCycleTimeDays > 0 ? `${p.avgCycleTimeDays.toFixed(1)}d` : '—', color: cycleColor, hint: '< 7d fast · > 14d slow' },
          { label: 'Lead time',    val: p.avgLeadTimeDays  > 0 ? `${p.avgLeadTimeDays.toFixed(1)}d`  : '—', color: leadColor,  hint: '< 10d fast · > 21d slow' },
          { label: 'Flow eff.',    val: `${p.flowEfficiencyPct}%`,                                          color: flowColor,  hint: '> 50% = healthy flow' },
          { label: 'WIP average',  val: p.wipAverage > 0 ? p.wipAverage.toFixed(1) : '—',                  color: wipColor,   hint: 'active items at any time' },
        ].map(m => (
          <div key={m.label} className={styles.periodMetricBlock}>
            <span className={styles.periodMetricVal} style={{ '--metric-color': m.color } as CSSProperties}>
              {m.val}
            </span>
            <span className={styles.periodMetricLabel}>{m.label}</span>
            <span className={styles.periodMetricHint}>{m.hint}</span>
          </div>
        ))}
      </div>

      {/* Footer: completed + trend */}
      <div className={styles.periodFooter}>
        <span>{p.completedCount} completed · {p.completedPoints > 0 ? `${p.completedPoints} pts` : 'no points tracked'}</span>
        <span
          className={styles.periodFooterAlert}
          style={{ '--alert-color': trend > 0 ? '#16a34a' : trend < 0 ? '#dc2626' : '#94a3b8' } as CSSProperties}
        >
          {trend > 0 ? `▲ +${trend} vs prev` : trend < 0 ? `▼ ${trend} vs prev` : 'Stable throughput'}
        </span>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function SprintKanbanPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadMetricsWithSource().then(r => {
      if (cancelled) return;
      const data = r.metrics as DashboardMetrics | null;
      if (!data) { router.replace('/'); return; }
      setMetrics(data);
    }).catch(() => router.replace('/')).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [router]);

  if (loading || !metrics) return null;

  // ── Data ──────────────────────────────────────────────────────────────────
  const tp           = metrics.throughput;
  const tpSprint     = tp?.sprint;
  const tpKanban     = tp?.kanban;
  const midInsights  = (tp?.midSprint ?? []) as MidSprintInsight[];
  const richSprints  = (tpSprint?.sprints ?? []) as SprintThroughput[];
  const kanbanPeriods = (tpKanban?.periods ?? []) as KanbanPeriod[];

  const hasSprintData    = (metrics.sprint?.hasSprintData && metrics.sprint.sprints?.length > 0) || richSprints.length > 0;
  const hasKanbanPeriods = kanbanPeriods.length > 0;
  const hasMidData       = midInsights.length > 0;

  const byStatus  = (metrics.kanban?.byStatus  ?? []) as Array<{ status: string; count: number }>;
  const maxStatus = Math.max(...byStatus.map(s => s.count ?? 0), 1);

  // Sprint summary stats
  const avgCompletion  = tpSprint?.averageCompletionPct ?? 0;
  const avgThroughput  = tpSprint?.averageThroughputCount ?? 0;
  const trendDirection = tpSprint?.trendDirection ?? 'Stable';
  const confidence     = tpSprint?.overallDeliveryConfidence ?? 0;
  const bestSprint     = tpSprint?.bestSprintName  ?? '—';
  const worstSprint    = tpSprint?.worstSprintName ?? '—';
  const endLoaded      = tpSprint?.endLoadedSprintCount ?? 0;
  const blockedSprints = tpSprint?.blockedSprintCount   ?? 0;
  const sprintCount    = tpSprint?.totalSprints ?? metrics.sprint?.sprintCount ?? 0;

  // Kanban summary
  const avgCycleTime  = tpKanban?.avgCycleTimeDays     ?? 0;
  const avgLeadTime   = tpKanban?.avgLeadTimeDays      ?? 0;
  const avgFlowEff    = tpKanban?.avgFlowEfficiencyPct ?? 0;
  const totalAgingWip = tpKanban?.totalAgingWip        ?? 0;
  const flowHealth    = tpKanban?.overallFlowHealth    ?? 'Healthy';

  // ── KPI strip ──────────────────────────────────────────────────────────────
  const trendColor = trendDirection === 'Improving' ? '#16a34a' : trendDirection === 'Declining' ? '#dc2626' : '#d97706';
  const kpis = hasSprintData
    ? [
        { label: 'Sprints',      val: sprintCount,           sub: 'total sprints',        color: 'var(--color-primary,#2563eb)', delay: 0   },
        { label: 'Avg Complete', val: `${Math.round(avgCompletion)}%`, sub: 'avg sprint completion', color: pctColor(avgCompletion), delay: 40  },
        { label: 'Avg Velocity', val: Math.round(avgThroughput),      sub: 'issues per sprint',     color: 'var(--color-text-primary,#0f172a)', delay: 80  },
        { label: 'Trend',        val: trendDirection,                  sub: 'delivery direction',    color: trendColor,              delay: 120 },
        { label: 'Confidence',   val: `${Math.round(confidence)}%`,   sub: 'delivery confidence',  color: pctColor(confidence),    delay: 160 },
        { label: 'End-Loaded',   val: endLoaded,     sub: 'sprints end-loaded',           color: endLoaded  > 0 ? '#d97706' : '#94a3b8', delay: 200 },
        { label: 'Blocked',      val: blockedSprints, sub: 'sprints had blockers',         color: blockedSprints > 0 ? '#dc2626' : '#94a3b8', delay: 240 },
        { label: 'Active WIP',   val: metrics.activeIssues ?? 0, sub: 'in progress now',  color: (metrics.activeIssues ?? 0) > 15 ? '#dc2626' : 'var(--color-primary,#2563eb)', delay: 280 },
      ]
    : [
        { label: 'Active Issues', val: metrics.activeIssues  ?? 0, sub: 'in progress',    color: 'var(--color-primary,#2563eb)', delay: 0   },
        { label: 'Completion',    val: `${metrics.completionRate ?? 0}%`, sub: 'overall done', color: pctColor(metrics.completionRate ?? 0), delay: 40  },
        { label: 'Cycle Time',    val: avgCycleTime > 0 ? `${avgCycleTime.toFixed(1)}d` : '—', sub: 'avg cycle time', color: avgCycleTime > 14 ? '#dc2626' : '#16a34a', delay: 80  },
        { label: 'Lead Time',     val: avgLeadTime  > 0 ? `${avgLeadTime.toFixed(1)}d`  : '—', sub: 'avg lead time',  color: avgLeadTime  > 21 ? '#dc2626' : '#16a34a', delay: 120 },
        { label: 'Flow Eff.',     val: `${Math.round(avgFlowEff)}%`, sub: 'flow efficiency',    color: avgFlowEff < 30 ? '#dc2626' : avgFlowEff < 50 ? '#d97706' : '#16a34a', delay: 160 },
        { label: 'Aging WIP',     val: totalAgingWip, sub: 'items > 14 days',             color: totalAgingWip > 0 ? '#d97706' : '#94a3b8', delay: 200 },
        { label: 'Blocked',       val: metrics.blockedIssues ?? 0, sub: 'items blocked',  color: (metrics.blockedIssues ?? 0) > 0 ? '#dc2626' : '#94a3b8', delay: 240 },
        { label: 'Flow Health',   val: flowHealth,    sub: 'kanban flow status',           color: FLOW_HEALTH_COLORS[flowHealth], delay: 280 },
      ];

  return (
    <AppShell showNav>
      <div className={styles.page}>

        {/* ── Header ── */}
        <div className={styles.header}>
          <div className={styles.eyebrow}>
            <span className={styles.eyebrowLine} />
            Delivery
          </div>
          <h1 id="tour-header-sprint-kanban" className={styles.title}>Sprint & Kanban</h1>
          <p className={styles.subtitle}>
            {hasSprintData
              ? `${sprintCount} sprint${sprintCount !== 1 ? 's' : ''} analysed. Each row shows completion rate, delivery pattern, scope changes, and a plain-English interpretation of what happened.`
              : 'No sprints found in this export — Kanban analytics are shown as the primary delivery view. Each metric describes how work flows through your board.'}
          </p>
        </div>

        {/* ── Mode banner ── */}
        <div className={styles.modeBanner} data-mode={hasSprintData ? 'sprint' : 'kanban'}>
          {hasSprintData ? (
            <svg className={styles.modeBannerIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" aria-hidden="true">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          ) : (
            <svg className={styles.modeBannerIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
          )}
          <div>
            <p className={styles.modeBannerTitle}>
              {hasSprintData
                ? `Sprint Mode · ${sprintCount} sprint${sprintCount !== 1 ? 's' : ''} · Trend: ${trendDirection}`
                : 'Kanban Mode · No sprint boundaries detected'}
            </p>
            <p className={styles.modeBannerDesc}>
              {hasSprintData
                ? `Average completion ${Math.round(avgCompletion)}% · ${endLoaded} end-loaded sprint${endLoaded !== 1 ? 's' : ''} · ${blockedSprints} blocked sprint${blockedSprints !== 1 ? 's' : ''}. Delivery confidence: ${Math.round(confidence)}%.`
                : `Work is managed as a continuous flow. Cycle time ${avgCycleTime > 0 ? avgCycleTime.toFixed(1) + 'd' : 'N/A'} · Lead time ${avgLeadTime > 0 ? avgLeadTime.toFixed(1) + 'd' : 'N/A'} · Flow efficiency ${Math.round(avgFlowEff)}%.`}
            </p>
          </div>
        </div>

        {/* ── KPI strip ── */}
        <div className={styles.kpiStrip}>
          {kpis.map(k => (
            <div key={k.label} className={styles.kpiCard} style={{ '--kpi-delay': `${k.delay}ms` } as CSSProperties}>
              <p className={styles.kpiLabel}>{k.label}</p>
              <p className={styles.kpiVal} style={{ '--kpi-color': k.color } as CSSProperties}>{k.val}</p>
              <p className={styles.kpiSub}>{k.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Body ── */}
        <div className={styles.body}>

          {/* ── Left (main) column ── */}
          <div className={styles.mainCol}>

            {/* Sprint throughput rows */}
            {hasSprintData && richSprints.length > 0 && (
              <div className={styles.card} style={{ '--card-delay': '60ms' } as CSSProperties}>
                <div className={styles.cardHead}>
                  <span className={styles.cardTitle}>Sprint Throughput</span>
                  <span className={styles.cardBadge}>{richSprints.length} sprints · latest highlighted</span>
                </div>
                <p className={styles.cardDesc}>
                  Each sprint shows completion %, delivery pattern, scope changes, and what the pattern means for your team.
                  Goal chip shows the latest sprint outcome only.
                </p>
                {/* Delivery trend mini chart */}
                {richSprints.length > 1 && (
                  <div className={styles.trendWrap}>
                    <p className={styles.trendTitle}>Completion trend per sprint</p>
                    <div className={styles.trendChart}>
                      {richSprints.map((sp, i) => {
                        const color = pctColor(sp.completionPct);
                        return (
                          <div key={sp.sprintName} className={styles.trendCol}>
                            <div className={styles.trendBarTrack}>
                              <div
                                className={styles.trendBarFill}
                                style={{
                                  '--bar-h':    `${sp.completionPct}%`,
                                  '--bar-color': color,
                                  '--bar-delay': `${i * 50}ms`,
                                } as CSSProperties}
                                title={`${sp.sprintName}: ${sp.completionPct}%`}
                              />
                            </div>
                            <span className={styles.trendBarLabel}>
                              {sp.sprintName.replace(/sprint\s*/i, 'S').slice(0, 6)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className={styles.trendLegend}>
                      {[
                        { label: '≥ 80% (healthy)',  color: '#16a34a' },
                        { label: '50–79% (at risk)', color: '#d97706' },
                        { label: '< 50% (critical)', color: '#dc2626' },
                      ].map(l => (
                        <div key={l.label} className={styles.trendLegendItem}>
                          <div className={styles.trendLegendDot} style={{ '--dot-color': l.color } as CSSProperties} />
                          {l.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sprint rows */}
                {[...richSprints].reverse().map((sp, i) => (
                  <SprintRow
                    key={sp.sprintName}
                    sp={sp}
                    index={i}
                    isLatest={i === 0}
                  />
                ))}
              </div>
            )}

            {/* Mid-sprint patterns */}
            {hasMidData && (
              <div className={styles.card} style={{ '--card-delay': '90ms' } as CSSProperties}>
                <div className={styles.cardHead}>
                  <span className={styles.cardTitle}>Mid-Sprint Delivery Patterns</span>
                  <span className={styles.cardBadge}>{midInsights.length} sprints analysed</span>
                </div>
                <p className={styles.cardDesc}>
                  Shows how much work was done by the midpoint of each sprint. Low mid-sprint % with high final % means the team is end-loading — finishing most work in the last few days.
                </p>
                <div className={styles.midList}>
                  {[...midInsights].reverse().map((m, i) => (
                    <MidCard key={m.sprintName} m={m} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Board status distribution — always shown */}
            {byStatus.length > 0 && (
              <div className={styles.card} style={{ '--card-delay': hasSprintData ? '120ms' : '60ms' } as CSSProperties}>
                <div className={styles.cardHead}>
                  <span className={styles.cardTitle}>Board Status Distribution</span>
                  <span className={styles.cardBadge}>{byStatus.length} stages · {metrics.totalIssues ?? 0} total issues</span>
                </div>
                <p className={styles.cardDesc}>
                  How issues are spread across your workflow stages right now. Large To Do or Backlog columns indicate backlog debt. Large In Progress columns may indicate WIP limit violations.
                </p>
                <div className={styles.boardList}>
                  {byStatus.map((s, i) => (
                    <BoardStatusBar
                      key={s.status ?? i}
                      status={s.status ?? ''}
                      count={s.count ?? 0}
                      maxCount={maxStatus}
                      index={i}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Kanban period cards */}
            {hasKanbanPeriods && (
              <div className={styles.card} style={{ '--card-delay': '140ms' } as CSSProperties}>
                <div className={styles.cardHead}>
                  <span className={styles.cardTitle}>Kanban Period Breakdown</span>
                  <span className={styles.cardBadge}>{kanbanPeriods.length} periods</span>
                </div>
                <p className={styles.cardDesc}>
                  Each card shows one reporting period. Cycle time = how long active work takes. Lead time = total wait + work time. Flow efficiency = active work / total lead time.
                </p>
                <div className={clsx(styles.periodGrid, kanbanPeriods.length > 1 && styles.periodGridMulti)}>
                  {kanbanPeriods.map((p, i) => <PeriodCard key={p.periodLabel} p={p} index={i} />)}
                </div>
              </div>
            )}

          </div>

          {/* ── Right (sidebar) column ── */}
          <div className={styles.sideCol}>

            {/* Sprint best/worst callout */}
            {hasSprintData && (
              <div className={styles.card} style={{ '--card-delay': '70ms' } as CSSProperties}>
                <div className={styles.cardHead}>
                  <span className={styles.cardTitle}>Sprint Highlights</span>
                </div>
                <div className={styles.flowStatGrid}>
                  {[
                    { label: 'Best sprint',        val: bestSprint,  color: '#16a34a', sub: 'highest completion',          delay: 0   },
                    { label: 'Worst sprint',        val: worstSprint, color: '#dc2626', sub: 'lowest completion',           delay: 40  },
                    { label: 'Avg throughput',      val: `${Math.round(avgThroughput)} issues`, color: 'var(--color-text-primary,#0f172a)', sub: 'per sprint',    delay: 80  },
                    { label: 'Avg point velocity',  val: tpSprint?.averageThroughputPoints ? `${Math.round(tpSprint.averageThroughputPoints)} pts` : '—', color: 'var(--color-text-primary,#0f172a)', sub: 'per sprint', delay: 120 },
                    { label: 'Avg mid-sprint done', val: `${Math.round(tpSprint?.averageMidSprintPct ?? 0)}%`, color: pctColor(tpSprint?.averageMidSprintPct ?? 0), sub: 'done by midpoint', delay: 160 },
                  ].map(r => (
                    <div key={r.label} className={styles.flowStatRow} style={{ '--row-delay': `${r.delay}ms` } as CSSProperties}>
                      <div>
                        <p className={styles.flowStatLabel}>{r.label}</p>
                        <p className={styles.flowStatSub}>{r.sub}</p>
                      </div>
                      <span className={styles.flowStatVal} style={{ '--stat-color': r.color } as CSSProperties}>
                        {r.val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Flow health stats */}
            {(avgCycleTime > 0 || avgLeadTime > 0 || avgFlowEff > 0) && (
              <div className={styles.card} style={{ '--card-delay': '100ms' } as CSSProperties}>
                <div className={styles.cardHead}>
                  <span className={styles.cardTitle}>Flow Health</span>
                  <span className={styles.cardBadge} style={{ color: FLOW_HEALTH_COLORS[flowHealth] }}>{flowHealth}</span>
                </div>
                <div className={styles.flowStatGrid}>
                  {[
                    {
                      label: 'Cycle time',
                      val:   avgCycleTime > 0 ? `${avgCycleTime.toFixed(1)} days` : '—',
                      sub:   'avg active work time',
                      color: avgCycleTime > 14 ? '#dc2626' : avgCycleTime > 7 ? '#d97706' : '#16a34a',
                      delay: 0,
                    },
                    {
                      label: 'Lead time',
                      val:   avgLeadTime > 0 ? `${avgLeadTime.toFixed(1)} days` : '—',
                      sub:   'total wait + work time',
                      color: avgLeadTime > 21 ? '#dc2626' : avgLeadTime > 10 ? '#d97706' : '#16a34a',
                      delay: 40,
                    },
                    {
                      label: 'Flow efficiency',
                      val:   `${Math.round(avgFlowEff)}%`,
                      sub:   'active / lead time',
                      color: avgFlowEff < 30 ? '#dc2626' : avgFlowEff < 50 ? '#d97706' : '#16a34a',
                      delay: 80,
                    },
                    {
                      label: 'Aging WIP',
                      val:   `${totalAgingWip} items`,
                      sub:   'active > 14 days',
                      color: totalAgingWip > 5 ? '#dc2626' : totalAgingWip > 0 ? '#d97706' : '#94a3b8',
                      delay: 120,
                    },
                  ].map(r => (
                    <div key={r.label} className={styles.flowStatRow} style={{ '--row-delay': `${r.delay}ms` } as CSSProperties}>
                      <div>
                        <p className={styles.flowStatLabel}>{r.label}</p>
                        <p className={styles.flowStatSub}>{r.sub}</p>
                      </div>
                      <span className={styles.flowStatVal} style={{ '--stat-color': r.color } as CSSProperties}>
                        {r.val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Board health */}
            <div className={styles.card} style={{ '--card-delay': '130ms' } as CSSProperties}>
              <div className={styles.cardHead}>
                <span className={styles.cardTitle}>Board Health</span>
              </div>
              <div className={styles.flowStatGrid}>
                {[
                  { label: 'Total issues',    val: metrics.totalIssues    ?? 0, sub: 'in scope',            isAlert: false,                                   color: 'var(--color-text-primary,#0f172a)', delay: 0   },
                  { label: 'Done / Closed',   val: metrics.doneIssues     ?? 0, sub: 'completed',           isAlert: false,                                   color: '#16a34a',                           delay: 40  },
                  { label: 'Active WIP',      val: metrics.activeIssues   ?? 0, sub: 'in progress now',     isAlert: (metrics.activeIssues  ?? 0) > 15,       color: (metrics.activeIssues ?? 0) > 15 ? '#dc2626' : 'var(--color-primary,#2563eb)', delay: 80  },
                  { label: 'Blocked',         val: metrics.blockedIssues  ?? 0, sub: 'need unblocking',     isAlert: (metrics.blockedIssues ?? 0) > 0,        color: (metrics.blockedIssues ?? 0) > 0 ? '#dc2626' : '#94a3b8', delay: 120 },
                  { label: 'Open defects',    val: metrics.openDefects    ?? 0, sub: 'quality risk',        isAlert: (metrics.openDefects   ?? 0) > 5,        color: (metrics.openDefects ?? 0) > 5 ? '#dc2626' : (metrics.openDefects ?? 0) > 0 ? '#d97706' : '#94a3b8', delay: 160 },
                ].map(r => (
                  <div
                    key={r.label}
                    className={styles.healthRow}
                    data-alert={r.isAlert ? 'true' : undefined}
                    style={{ '--row-delay': `${r.delay}ms` } as CSSProperties}
                  >
                    <div>
                      <p className={styles.healthRowLabel}>{r.label}</p>
                      <p className={styles.healthRowSub}>{r.sub}</p>
                    </div>
                    <span className={styles.healthRowVal} style={{ '--stat-color': r.color } as CSSProperties}>
                      {r.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </AppShell>
  );
}
