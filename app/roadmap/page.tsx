// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// /roadmap — Epic delivery roadmap: animated Gantt + card view.
'use client';
import { useEffect, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import AppShell from '@/components/layout/AppShell';
import { loadMetricsWithSource } from '@/lib/storage';
import { computePortfolioSummary, type EpicSummary } from '@/lib/portfolioHealth';
import type { DashboardMetrics } from '@/types/metrics';
import styles from './page.module.scss';

// ── Types ──────────────────────────────────────────────────────────────────────

interface EpicForecast extends EpicSummary {
  remainingIssues:  number;
  sprintsRemaining: number | null;
  weeksRemaining:   number | null;
  forecastLabel:    string;
  confidence:       'high' | 'medium' | 'low';
}

interface EpicTimeline extends EpicForecast {
  startMs:     number | null;
  endMs:       number | null;
  isEstimated: boolean;
}

// ── Health color tokens (CSS custom property values — data-driven) ─────────────
// EXCEPTION (CLAUDE.md Rule 1): color values are data-driven from health status
// and passed as CSS custom properties consumed by SCSS.
const HEALTH_COLOR: Record<string, string> = {
  good:     'var(--color-success, #22c55e)',
  warning:  'var(--color-warning, #f59e0b)',
  critical: 'var(--color-danger, #f87171)',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function msFromDate(d: string | null | undefined): number | null {
  if (!d) return null;
  const ts = Date.parse(d);
  return isNaN(ts) ? null : ts;
}

function forecastEpic(epic: EpicSummary, avgThroughput: number): EpicForecast {
  const remaining = epic.issues - epic.completedIssues;
  if (epic.progress >= 100)
    return { ...epic, remainingIssues: 0, sprintsRemaining: 0, weeksRemaining: 0, forecastLabel: 'Complete', confidence: 'high' };
  if (avgThroughput <= 0 || remaining <= 0)
    return { ...epic, remainingIssues: remaining, sprintsRemaining: null, weeksRemaining: null, forecastLabel: 'Insufficient data', confidence: 'low' };
  const sprints    = remaining / avgThroughput;
  const weeks      = Math.ceil(sprints * 2);
  const confidence = sprints < 2 ? 'high' : sprints < 5 ? 'medium' : 'low';
  const label      = weeks <= 2 ? 'Within 2 weeks' : weeks <= 6 ? `~${weeks} weeks` : `~${Math.round(weeks / 4)} months`;
  return { ...epic, remainingIssues: remaining, sprintsRemaining: parseFloat(sprints.toFixed(1)), weeksRemaining: weeks, forecastLabel: label, confidence };
}

function buildTimelines(forecasts: EpicForecast[], flowItems: any[]): EpicTimeline[] {
  const epicDates: Record<string, { starts: number[]; ends: number[] }> = {};
  for (const item of flowItems) {
    const name = (item.epic || '').trim();
    if (!name) continue;
    if (!epicDates[name]) epicDates[name] = { starts: [], ends: [] };
    const s = msFromDate(item.createdDate);
    const e = msFromDate(item.doneDate);
    if (s) epicDates[name].starts.push(s);
    if (e) epicDates[name].ends.push(e);
  }
  const now = Date.now();
  return forecasts.map(epic => {
    const dates = epicDates[epic.name] ??
      Object.entries(epicDates).find(([k]) =>
        k.toLowerCase().includes(epic.name.toLowerCase().slice(0, 8)) ||
        epic.name.toLowerCase().includes(k.toLowerCase().slice(0, 8))
      )?.[1] ?? null;

    if (!dates || dates.starts.length === 0) return { ...epic, startMs: null, endMs: null, isEstimated: false };

    const startMs = Math.min(...dates.starts);
    const isEstimated = !(epic.progress >= 100 && dates.ends.length > 0);
    const endMs = isEstimated
      ? (epic.weeksRemaining != null ? now + epic.weeksRemaining * 7 * 86_400_000 : now + 90 * 86_400_000)
      : Math.max(...dates.ends);

    return { ...epic, startMs, endMs, isEstimated };
  });
}

// ── Forecast helpers ───────────────────────────────────────────────────────────

function getForecastMs(epic: EpicTimeline): number | null {
  if (epic.progress >= 100) return epic.endMs;
  if (epic.endMs) return epic.endMs;
  if (epic.weeksRemaining != null) return Date.now() + epic.weeksRemaining * 7 * 86_400_000;
  return null;
}

function fmtMonthYear(ms: number | null): string {
  if (ms === null) return '—';
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

// ── Gantt Component ────────────────────────────────────────────────────────────

function GanttTimeline({ timelines }: { timelines: EpicTimeline[] }) {
  const dated = timelines.filter(e => e.startMs && e.endMs).slice(0, 24);

  if (dated.length === 0) {
    return (
      <div className={styles.emptyState} style={{ borderRadius: 0, border: 'none', padding: '48px 24px' }}>
        <div className={styles.emptyIcon}>📅</div>
        <p className={styles.emptyTitle}>No date data for Gantt view</p>
        <p className={styles.emptyText}>
          Ensure your Jira export includes <strong>Created</strong> and <strong>Resolved</strong> date columns.
        </p>
      </div>
    );
  }

  const now    = Date.now();
  const minMs  = Math.min(...dated.map(e => e.startMs!));
  const maxMs  = Math.max(...dated.map(e => e.endMs!), now + 14 * 86_400_000);
  const pad    = (maxMs - minMs) * 0.03;
  const rStart = minMs - pad;
  const rEnd   = maxMs + pad;
  const rMs    = rEnd - rStart;

  function frac(ms: number) { return (ms - rStart) / rMs; }

  // Monthly ticks
  const ticks: { frac: number; label: string }[] = [];
  const d = new Date(rStart); d.setDate(1); d.setHours(0, 0, 0, 0);
  while (d.getTime() < rEnd) {
    const f = frac(d.getTime());
    if (f >= 0 && f <= 1) ticks.push({ frac: f, label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) });
    d.setMonth(d.getMonth() + 1);
  }

  const todayFrac = frac(now);
  const showToday = todayFrac >= 0 && todayFrac <= 1;

  return (
    <>
      <div className={styles.ganttGrid}>
        {/* ── Axis header row ── */}
        <div className={clsx(styles.ganttRow, styles.axisRow)}>
          <div className={styles.ganttAxisLabel}>Epic</div>
          <div className={styles.ganttTrackArea}>
            {ticks.map((t, i) => (
              <div key={i} className={styles.ganttTick} style={{ '--tick-pct': `${t.frac * 100}%` } as CSSProperties}>
                <div className={styles.ganttTickLine} />
                <span className={styles.ganttTickLabel}>{t.label}</span>
              </div>
            ))}
            {showToday && (
              <div className={styles.ganttTodayAxis} style={{ '--today-pct': `${todayFrac * 100}%` } as CSSProperties}>
                <span className={styles.ganttTodayLabel}>TODAY</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Epic rows ── */}
        {dated.map((epic, i) => {
          const startF  = frac(epic.startMs!);
          const endF    = frac(epic.endMs!);
          const barLeft = `${Math.max(0, startF) * 100}%`;
          const barW    = `${Math.max(0.5, (endF - startF)) * 100}%`;
          const fillW   = `${Math.min(100, epic.progress)}%`;
          const pctLeft = `${Math.min(99, endF) * 100}%`;
          const color   = HEALTH_COLOR[epic.health] ?? HEALTH_COLOR.warning;

          return (
            <div key={i} className={styles.ganttRow}>
              <div className={styles.ganttLabel}>
                {/* EXCEPTION: health dot color is data-driven — use data attribute for SCSS targeting */}
                <div className={styles.healthDot} data-health={epic.health} aria-hidden="true" />
                <span className={styles.epicName} title={epic.name}>{epic.name}</span>
              </div>
              <div className={styles.ganttTrackArea}>
                {/* Today vertical line */}
                {showToday && (
                  <div className={styles.ganttTodayRow} style={{ '--today-pct': `${todayFrac * 100}%` } as CSSProperties} />
                )}

                {/* Bar track + fill */}
                {/* EXCEPTION: bar-left, bar-width, fill-w, bar-color are all data-driven from timeline math and health status */}
                <div
                  className={styles.ganttBarWrap}
                  style={{ '--bar-left': barLeft, '--bar-width': barW, '--bar-color': color } as CSSProperties}
                >
                  {epic.isEstimated && <div className={styles.ganttBarEst} aria-hidden="true" />}
                  <div
                    className={styles.ganttBarFill}
                    style={{ '--fill-w': fillW, '--bar-delay': `${i * 45}ms` } as CSSProperties}
                  />
                </div>

                {/* % label */}
                <span
                  className={styles.ganttPct}
                  style={{ '--pct-left': pctLeft } as CSSProperties}
                >
                  {Math.round(epic.progress)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className={styles.ganttLegend}>
        {([['good', 'On track'], ['warning', 'At risk'], ['critical', 'Critical']] as const).map(([h, lbl]) => (
          <span key={h} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: HEALTH_COLOR[h] } as CSSProperties} aria-hidden="true" />
            {lbl}
          </span>
        ))}
        <span className={styles.legendItem}>
          <span className={styles.legendHatch} aria-hidden="true" />
          Estimated end
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendTodayLine} aria-hidden="true" />
          Today
        </span>
      </div>

      {/* ── Forecast date comparison ─────────────────────────────────────────── */}
      <div className={styles.forecastSection}>
        <div className={styles.forecastSectionHead}>
          <span className={styles.forecastSectionTitle}>Estimated Completion</span>
          <span className={styles.forecastSectionHint}>All epics · sorted by earliest forecast</span>
        </div>

        {/* Column headers */}
        <div className={styles.forecastColRow}>
          <span className={styles.forecastColLabel}>Epic</span>
          <span className={styles.forecastColLabel}>Progress</span>
          <span className={styles.forecastColLabel}>Done</span>
          <span className={styles.forecastColLabel}>Est. date</span>
          <span className={styles.forecastColLabel}>Confidence</span>
        </div>

        {/* Data rows — ALL epics sorted by forecast date */}
        {[...timelines]
          .sort((a, b) => (getForecastMs(a) ?? Infinity) - (getForecastMs(b) ?? Infinity))
          .map((epic, i) => {
            const ms      = getForecastMs(epic);
            const isDone  = epic.progress >= 100;
            // EXCEPTION: fill-color and fill-w are data-driven from progress/health
            const color   = HEALTH_COLOR[epic.health] ?? HEALTH_COLOR.warning;
            return (
              <div key={i} className={styles.forecastRow}>
                {/* Epic name + health dot */}
                <div className={styles.forecastEpicCell}>
                  <div className={styles.healthDot} data-health={epic.health} aria-hidden="true" />
                  <span className={styles.forecastEpicName} title={epic.name}>{epic.name}</span>
                </div>

                {/* Mini progress bar */}
                <div className={styles.forecastMiniTrack}>
                  <div
                    className={styles.forecastMiniFill}
                    style={{ '--fill-w': `${Math.min(100, epic.progress)}%`, '--fill-color': color, '--bar-delay': `${i * 30}ms` } as CSSProperties}
                  />
                </div>

                {/* % complete */}
                <span className={styles.forecastPctCell}>{Math.round(epic.progress)}%</span>

                {/* Estimated completion date chip */}
                <span
                  className={styles.forecastDateChip}
                  data-health={isDone ? undefined : epic.health}
                  data-status={isDone ? 'done' : undefined}
                >
                  {isDone ? '✓ Done' : fmtMonthYear(ms)}
                </span>

                {/* Confidence badge */}
                <span className={styles.forecastConfChip} data-conf={isDone ? 'done' : epic.confidence}>
                  {isDone ? 'done' : epic.confidence}
                </span>
              </div>
            );
          })}
      </div>
    </>
  );
}

// ── Epic card (cards view) ─────────────────────────────────────────────────────

function EpicCard({ epic, index }: { epic: EpicForecast; index: number }) {
  const [open, setOpen] = useState(false);
  const color  = HEALTH_COLOR[epic.health] ?? HEALTH_COLOR.warning;
  const isDone = epic.progress >= 100;

  return (
    // EXCEPTION: --card-accent color is data-driven from health status
    <div className={styles.epicCard} data-health={epic.health}>
      <button type="button" onClick={() => setOpen(v => !v)} className={styles.epicCardBtn}>

        {/* Top row: name + forecast */}
        <div className={styles.epicTop}>
          <div className={styles.epicNameCol}>
            <p className={styles.epicTitle}>{epic.name}</p>
            <span
              className={styles.epicBadge}
              data-health={isDone ? undefined : epic.health}
              data-status={isDone ? 'done' : undefined}
            >
              {isDone ? 'Done' : epic.health}
            </span>
          </div>
          <div className={styles.epicForecastTag}>
            <p className={styles.epicForecastValue}>{epic.forecastLabel}</p>
            <span className={styles.epicForecastConf} data-conf={epic.confidence}>
              {epic.confidence} conf.
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className={styles.epicProgressLabel}>
          <span>{epic.completedIssues} / {epic.issues} issues</span>
          <span>{Math.round(epic.progress)}%</span>
        </div>
        <div className={styles.epicProgressTrack}>
          {/* EXCEPTION: fill-w and fill-color are data-driven */}
          <div
            className={styles.epicProgressFill}
            style={{
              '--fill-w': `${Math.min(100, epic.progress)}%`,
              '--fill-color': color,
              '--bar-delay': `${index * 55}ms`,
            } as CSSProperties}
          />
        </div>

        {/* Stat mini-grid */}
        <div className={styles.epicStatGrid}>
          {[
            { v: epic.remainingIssues,         l: 'Remaining' },
            { v: epic.sprintsRemaining ?? '—', l: 'Sprints est.' },
            { v: epic.critical,                l: 'Critical' },
          ].map(s => (
            <div key={s.l} className={styles.epicStat}>
              <div className={styles.epicStatVal}>{s.v}</div>
              <div className={styles.epicStatLbl}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Story points row (if available) */}
        {epic.storyPoints > 0 && (
          <div style={{ fontSize: 10, color: 'var(--color-text-muted, #94a3b8)', display: 'flex', justifyContent: 'space-between' } as CSSProperties}>
            <span>Story points</span>
            <span style={{ fontWeight: 700 } as CSSProperties}>{epic.doneStoryPoints} / {epic.storyPoints} SP</span>
          </div>
        )}
      </button>

      {/* Expanded drawer */}
      {open && (
        <div className={styles.epicExpanded}>
          {[
            { v: epic.issues,              l: 'Total issues'    },
            { v: epic.completedIssues,     l: 'Done'            },
            { v: epic.weeksRemaining ?? '—', l: 'Weeks left'   },
          ].map(s => (
            <div key={s.l} className={styles.expandStat}>
              <div className={styles.expandVal}>{s.v}</div>
              <div className={styles.expandLbl}>{s.l}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RoadmapPage() {
  const router = useRouter();
  const [epics,      setEpics]      = useState<EpicForecast[]>([]);
  const [timelines,  setTimelines]  = useState<EpicTimeline[]>([]);
  const [throughput, setThroughput] = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [noData,     setNoData]     = useState(false);
  const [view,       setView]       = useState<'gantt' | 'cards'>('gantt');
  const [filter,     setFilter]     = useState<'all' | 'active' | 'critical' | 'done'>('active');
  const [sort,       setSort]       = useState<'progress' | 'name' | 'forecast'>('forecast');

  useEffect(() => {
    async function load() {
      const result  = await loadMetricsWithSource();
      const metrics = result.metrics as DashboardMetrics | null;
      if (!metrics) { setNoData(true); setLoading(false); return; }

      const sprints       = (metrics.sprint?.sprints ?? []) as any[];
      const valid         = sprints.filter((s: any) => (s.completedCount ?? 0) > 0);
      const avgThroughput = valid.length > 0 ? valid.reduce((s: number, x: any) => s + x.completedCount, 0) / valid.length : 0;

      const portfolio = computePortfolioSummary(metrics);
      const forecast  = portfolio.epics.map(e => forecastEpic(e, avgThroughput));
      const flowItems = (metrics.flow?.items ?? []) as any[];

      setEpics(forecast);
      setTimelines(buildTimelines(forecast, flowItems));
      setThroughput(parseFloat(avgThroughput.toFixed(1)));
      setLoading(false);
    }
    load().catch(() => { setNoData(true); setLoading(false); });
  }, [router]);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) return (
    <AppShell showNav>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320, color: 'var(--color-text-muted)', fontSize: 13, fontWeight: 600 } as CSSProperties}>
        Building roadmap…
      </div>
    </AppShell>
  );

  // ── No-data state ──────────────────────────────────────────────────────────
  if (noData) return (
    <AppShell showNav>
      <div className={styles.page}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🗺️</div>
          <p className={styles.emptyTitle}>No data uploaded yet</p>
          <p className={styles.emptyText}>Upload a Jira export to see your epic roadmap and delivery forecast.</p>
          <button onClick={() => router.push('/')} className={styles.uploadBtn}>Upload data</button>
        </div>
      </div>
    </AppShell>
  );

  // ── Derived KPIs ───────────────────────────────────────────────────────────
  const totalEpics  = epics.length;
  const doneEpics   = epics.filter(e => e.progress >= 100).length;
  const activeEpics = epics.filter(e => e.progress > 0 && e.progress < 100).length;
  const onTrack     = epics.filter(e => e.health === 'good' && e.progress < 100).length;
  const atRisk      = epics.filter(e => e.health === 'warning').length;
  const critEpics   = epics.filter(e => e.health === 'critical').length;
  const avgProgress = totalEpics > 0 ? Math.round(epics.reduce((s, e) => s + e.progress, 0) / totalEpics) : 0;
  const totalIssues = epics.reduce((s, e) => s + e.issues, 0);
  const doneIssues  = epics.reduce((s, e) => s + e.completedIssues, 0);

  const kpis = [
    { icon: '📋', label: 'Total Epics',  value: totalEpics,        sub: `${doneEpics} complete`,      color: 'var(--color-text-primary)',        bg: 'var(--color-muted, #e2e8f0)' },
    { icon: '✅', label: 'Done',         value: doneEpics,         sub: `${Math.round(doneEpics / Math.max(1, totalEpics) * 100)}% of total`, color: 'var(--color-success, #22c55e)',    bg: '#dcfce7' },
    { icon: '🚀', label: 'In Progress',  value: activeEpics,       sub: `${onTrack} on track`,        color: 'var(--color-primary, #2563eb)',    bg: '#dbeafe' },
    { icon: '⚠️', label: 'At Risk',      value: atRisk,            sub: atRisk > 0 ? 'Needs attention' : 'All clear', color: atRisk > 0 ? 'var(--color-warning, #f59e0b)' : 'var(--color-text-muted)', bg: atRisk > 0 ? '#fef9c3' : 'var(--color-muted)' },
    { icon: '🔴', label: 'Critical',     value: critEpics,         sub: critEpics > 0 ? 'Immediate action' : 'None critical', color: critEpics > 0 ? 'var(--color-danger, #f87171)' : 'var(--color-text-muted)', bg: critEpics > 0 ? '#fee2e2' : 'var(--color-muted)' },
    { icon: '📊', label: 'Issues Done',  value: `${doneIssues}/${totalIssues}`, sub: `${Math.round(doneIssues / Math.max(1, totalIssues) * 100)}% complete`, color: 'var(--color-text-primary)', bg: 'var(--color-muted, #e2e8f0)' },
  ];

  // ── Filtered + sorted cards ────────────────────────────────────────────────
  const filtered = epics.filter(e =>
    filter === 'all'      ? true :
    filter === 'active'   ? e.progress < 100 :
    filter === 'critical' ? e.health === 'critical' :
    e.progress >= 100
  );
  const sorted = [...filtered].sort((a, b) =>
    sort === 'progress' ? b.progress - a.progress :
    sort === 'name'     ? a.name.localeCompare(b.name) :
    (a.weeksRemaining ?? 999) - (b.weeksRemaining ?? 999)
  );
  const ganttTimelines = [...timelines].sort((a, b) => (a.startMs ?? 0) - (b.startMs ?? 0));

  return (
    <AppShell showNav>
      <div className={styles.page}>

        {/* ── Page header ── */}
        <div className={styles.pageHeader}>
          <div>
            <div className={styles.breadcrumb}>🗺️ Planning</div>
            <h1 className={styles.title}>Epic Roadmap</h1>
            <p className={styles.subtitle}>Delivery timeline, forecasts & health — based on your Jira data</p>
          </div>
          <div className={styles.viewToggle} role="group" aria-label="View mode">
            {(['gantt', 'cards'] as const).map(v => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={clsx(styles.viewBtn, { [styles.active]: view === v })}
                aria-pressed={view === v}
              >
                {v === 'gantt' ? '📊 Timeline' : '📋 Cards'}
              </button>
            ))}
          </div>
        </div>

        {/* ── KPI strip ── */}
        <div className={styles.kpiStrip} role="list" aria-label="Key metrics">
          {kpis.map(k => (
            <div key={k.label} className={styles.kpiCard} role="listitem">
              {/* EXCEPTION: bg is data-driven from health/status — CSS custom property */}
              <div className={styles.kpiIconBox} style={{ background: k.bg } as CSSProperties}>{k.icon}</div>
              <div className={styles.kpiBody}>
                {/* EXCEPTION: color is data-driven from health/status */}
                <div className={styles.kpiValue} style={{ color: k.color } as CSSProperties}>{k.value}</div>
                <div className={styles.kpiLabel}>{k.label}</div>
                <div className={styles.kpiSub}>{k.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Portfolio progress + throughput banner ── */}
        <div className={styles.infoBanner}>
          <div className={styles.infoLeft}>
            <div className={styles.infoTopLabel}>Portfolio Progress</div>
            <div className={styles.infoBigValue}>{avgProgress}%</div>
          </div>
          <div className={styles.infoTrackWrap}>
            <div className={styles.infoTrackLabel}>
              <span>{doneIssues} issues done</span>
              <span>{totalIssues - doneIssues} remaining</span>
            </div>
            <div className={styles.infoTrack}>
              {/* EXCEPTION: fill-w is data-driven from avgProgress */}
              <div className={styles.infoFill} style={{ '--fill-w': `${avgProgress}%` } as CSSProperties} />
            </div>
          </div>
          <div className={styles.infoRight}>
            <div className={styles.throughputLabel}>Avg throughput</div>
            <div className={styles.throughputValue}>
              {throughput > 0 ? `${throughput} items / sprint` : 'No sprint data'}
            </div>
            <div className={styles.throughputHint}>
              {throughput > 0 ? 'Linear forecast · 2-week sprints' : 'Upload sprint data to enable forecasts'}
            </div>
          </div>
        </div>

        {/* ── GANTT VIEW ── */}
        {view === 'gantt' && (
          <div className={styles.ganttCard}>
            <div className={styles.ganttCardHead}>
              <h2 className={styles.ganttCardTitle}>Epic Timeline</h2>
              <span className={styles.ganttCardMeta}>
                {ganttTimelines.filter(t => t.startMs).length} of {totalEpics} epics with date data
                {ganttTimelines.filter(t => t.isEstimated).length > 0 &&
                  ` · ${ganttTimelines.filter(t => t.isEstimated).length} estimated`}
              </span>
            </div>
            <GanttTimeline timelines={ganttTimelines} />
          </div>
        )}

        {/* ── CARDS VIEW ── */}
        {view === 'cards' && (
          <>
            <div className={styles.cardsHeader}>
              <div className={styles.filterGroup} role="group" aria-label="Filter epics">
                {([['active', 'In Progress'], ['all', 'All Epics'], ['critical', '🔴 Critical'], ['done', '✅ Done']] as const).map(([f, lbl]) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={clsx(styles.filterBtn, { [styles.active]: filter === f })}
                    aria-pressed={filter === f}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
              <select
                value={sort}
                onChange={e => setSort(e.target.value as typeof sort)}
                className={styles.sortSelect}
                aria-label="Sort epics"
              >
                <option value="forecast">Sort: Forecast</option>
                <option value="progress">Sort: Progress</option>
                <option value="name">Sort: Name A–Z</option>
              </select>
            </div>

            {sorted.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🗺️</div>
                <p className={styles.emptyTitle}>No epics match this filter</p>
              </div>
            ) : (
              <div className={styles.cardsGrid}>
                {sorted.map((epic, i) => <EpicCard key={`${epic.name}-${i}`} epic={epic} index={i} />)}
              </div>
            )}
          </>
        )}

        {/* ── No epics at all ── */}
        {epics.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🗺️</div>
            <p className={styles.emptyTitle}>No epic data found</p>
            <p className={styles.emptyText}>Upload a Jira export that includes the <strong>Epic Link</strong> or <strong>Epic Name</strong> column.</p>
          </div>
        )}

      </div>
    </AppShell>
  );
}
