// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import type { DashboardMetrics } from '@/types/metrics';

// ─── Constants ────────────────────────────────────────────────────────────────
const DONE_ST   = ['done', 'closed', 'resolved'];
const ACTIVE_ST = ['in progress', 'code review', 'qa', 'testing', 'uat'];
const PALETTE   = ['#2563eb', '#14b8a6', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2', '#f97316', '#16a34a'];

const norm = (v: unknown): string => String(v ?? '').trim().toLowerCase();

// ─── Types ────────────────────────────────────────────────────────────────────
interface Segment {
  label: string;
  value: number;
  color: string;
}

interface GanttRow {
  label: string;
  pct: number;
  done: number;
  total: number;
  health: 'good' | 'warning' | 'critical';
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────
function DonutChart({
  segments,
  size = 160,
  centerLabel,
  centerSub,
}: {
  segments: Segment[];
  size?: number;
  centerLabel?: string | number;
  centerSub?: string;
}) {
  let cursor = 0;
  const total = Math.max(
    segments.reduce((s, seg) => s + (seg.value || 0), 0),
    1
  );

  const gradient =
    segments.length > 0
      ? `conic-gradient(${segments
          .map((seg) => {
            const start = cursor;
            cursor += (seg.value / total) * 100;
            return `${seg.color} ${start}% ${cursor}%`;
          })
          .join(', ')})`
      : '#e2e8f0';

  const holeSize = Math.round(size * 0.58);
  const holeOffset = Math.round((size - holeSize) / 2);

  return (
    <div
      className="rounded-full shrink-0 relative"
      style={{ width: size, height: size, background: gradient }}
      role="img"
      aria-label="Donut chart"
    >
      <div
        className="absolute rounded-full bg-white flex flex-col items-center justify-center"
        style={{
          width: holeSize,
          height: holeSize,
          top: holeOffset,
          left: holeOffset,
        }}
      >
        {centerLabel !== undefined && (
          <span className="text-sm font-black text-slate-900 leading-none">{centerLabel}</span>
        )}
        {centerSub && (
          <span className="text-xs text-slate-500 leading-none mt-0.5">{centerSub}</span>
        )}
      </div>
    </div>
  );
}

// ─── Legend Row ───────────────────────────────────────────────────────────────
function LegendRow({
  color,
  label,
  value,
  pct,
}: {
  color: string;
  label: string;
  value: number;
  pct?: number;
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
      <span className="text-slate-600 flex-1 min-w-0 truncate">{label}</span>
      <span className="font-bold text-slate-800 shrink-0">{value}</span>
      {pct !== undefined && (
        <span className="text-slate-400 shrink-0 w-8 text-right">{pct}%</span>
      )}
    </div>
  );
}

// ─── Horizontal Bar ───────────────────────────────────────────────────────────
function HorizBar({
  label,
  value,
  maxValue,
  color,
  pct,
  subLabel,
}: {
  label: string;
  value: number;
  maxValue?: number;
  color: string;
  pct?: number;
  subLabel?: string;
}) {
  const width =
    pct !== undefined
      ? pct
      : maxValue
      ? Math.max(0, Math.min(100, (value / maxValue) * 100))
      : 0;

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-slate-600 truncate w-28 shrink-0" title={label}>
        {label}
      </span>
      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${width}%`, background: color }}
        />
      </div>
      <span className="font-bold text-slate-800 w-10 text-right shrink-0">
        {subLabel ?? value}
      </span>
    </div>
  );
}

// ─── Vertical Bar ─────────────────────────────────────────────────────────────
function VertBar({
  label,
  value,
  maxValue,
  color,
  pct,
}: {
  label: string;
  value: number;
  maxValue?: number;
  color: string;
  pct?: number;
}) {
  const h =
    pct !== undefined
      ? pct
      : maxValue
      ? Math.max(3, Math.min(100, (value / maxValue) * 100))
      : 3;

  return (
    <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
      <span className="text-xs font-bold text-slate-700">{value}</span>
      <div className="w-full relative h-24 flex items-end">
        <div
          className="w-full rounded-t transition-all"
          style={{ height: `${h}%`, background: color }}
        />
      </div>
      <span
        className="text-xs text-slate-500 text-center leading-none max-w-full truncate"
        title={label}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Chart Widget ─────────────────────────────────────────────────────────────
function ChartWidget({
  title,
  icon,
  children,
  span = 1,
  className = '',
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  span?: 1 | 2 | 3;
  className?: string;
}) {
  const spanClass =
    span === 3
      ? 'col-span-1 md:col-span-3'
      : span === 2
      ? 'col-span-1 md:col-span-2'
      : 'col-span-1';

  return (
    <article
      className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${spanClass} ${className}`}
    >
      <header className="flex items-center gap-2 px-5 pt-4 pb-3 border-b border-slate-100">
        <span aria-hidden="true" className="text-base">
          {icon}
        </span>
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">{title}</h3>
      </header>
      <div className="p-5">{children}</div>
    </article>
  );
}

// ─── Gantt / Timeline Chart ───────────────────────────────────────────────────
function GanttChart({
  epics,
  sprints,
}: {
  epics: unknown[];
  sprints: unknown[];
}) {
  const COLOR = { good: '#16a34a', warning: '#f59e0b', critical: '#dc2626' } as const;
  const BG    = {
    good:     'rgba(22,163,74,0.06)',
    warning:  'rgba(245,158,11,0.08)',
    critical: 'rgba(220,38,38,0.08)',
  } as const;

  const rows: GanttRow[] = (epics as any[]).length
    ? (epics as any[]).slice(0, 12).map((e) => ({
        label: (e.epic || 'No epic').slice(0, 32),
        pct:   e.progress    || 0,
        done:  e.completedIssues || 0,
        total: e.issues      || 0,
        health:
          e.critical > 0
            ? 'critical'
            : e.warning > 0
            ? 'warning'
            : 'good',
      }))
    : (sprints as any[]).slice(0, 10).map((s) => ({
        label: (s.name || 'Sprint').slice(0, 32),
        pct:   s.completionRate || 0,
        done:  s.completedIssues || 0,
        total: s.issues          || 0,
        health:
          s.completionRate >= 80
            ? 'good'
            : s.completionRate >= 50
            ? 'warning'
            : 'critical',
      }));

  if (!rows.length) {
    return (
      <p className="text-sm text-slate-400 italic">
        No epic or sprint data — include Epic Link or Sprint columns in the export.
      </p>
    );
  }

  const colLabel = (epics as any[]).length ? 'Epic' : 'Sprint';

  return (
    <div className="space-y-0">
      {/* Scale header */}
      <div className="flex items-center gap-3 mb-1 px-1">
        <span className="text-xs font-bold text-slate-400 uppercase w-36 shrink-0">{colLabel}</span>
        <div className="flex-1 flex justify-between text-xs text-slate-300 font-mono select-none">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
        <span className="text-xs font-bold text-slate-400 uppercase w-20 text-right shrink-0">Done</span>
      </div>

      {rows.map((r, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg px-1 py-1.5"
          style={{ background: BG[r.health] }}
        >
          <span
            className="text-xs text-slate-700 font-medium truncate w-36 shrink-0"
            title={r.label}
          >
            {r.label}
          </span>

          <div className="flex-1 relative h-4 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all"
              style={{ width: `${r.pct}%`, background: COLOR[r.health] }}
            />
            {/* tick marks at 25/50/75 */}
            {[25, 50, 75].map((t) => (
              <div
                key={t}
                className="absolute inset-y-0 w-px bg-white/60"
                style={{ left: `${t}%` }}
                aria-hidden="true"
              />
            ))}
          </div>

          <div className="flex flex-col items-end w-20 shrink-0">
            <span className="text-xs font-black" style={{ color: COLOR[r.health] }}>
              {r.pct}%
            </span>
            <span className="text-xs text-slate-400 leading-none">
              {r.done}/{r.total}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── KPI Pill ─────────────────────────────────────────────────────────────────
function KpiPill({
  value,
  label,
  gradient,
}: {
  value: string | number;
  label: string;
  gradient: string;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl px-5 py-3 text-white shadow-sm min-w-[80px]"
      style={{ background: gradient }}
    >
      <span className="text-xl font-black leading-none">{value}</span>
      <span className="text-xs opacity-85 mt-0.5 font-semibold">{label}</span>
    </div>
  );
}

// ─── Charts Page ──────────────────────────────────────────────────────────────
export default function ChartsPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('dc_metrics');
      if (!raw) {
        router.replace('/');
        return;
      }
      setMetrics(JSON.parse(raw) as DashboardMetrics);
    } catch {
      router.replace('/');
    } finally {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <AppShell showNav>
        <div className="flex items-center justify-center h-64 text-slate-400 text-sm animate-pulse">
          Loading charts…
        </div>
      </AppShell>
    );
  }
  if (!metrics) return null;

  // ── Derived data ─────────────────────────────────────────────────────────────
  const flow   = metrics.flow          || ({} as any);
  const sp     = metrics.storyPoints   || ({} as any);
  const items  = (flow.items           || []) as any[];
  const total  = Math.max(items.length, 1);

  // 1. Delivery Composition
  const doneBucket     = items.filter((i) => DONE_ST.includes(norm(i.status))).length;
  const criticalBucket = items.filter(
    (i) => !DONE_ST.includes(norm(i.status)) && norm(i.health) === 'critical'
  ).length;
  const warningBucket  = items.filter(
    (i) => !DONE_ST.includes(norm(i.status)) && norm(i.health) === 'warning'
  ).length;
  const activeBucket   = items.filter(
    (i) =>
      ACTIVE_ST.includes(norm(i.status)) &&
      !DONE_ST.includes(norm(i.status)) &&
      norm(i.health) !== 'critical' &&
      norm(i.health) !== 'warning'
  ).length;
  const otherBucket = Math.max(
    total - doneBucket - criticalBucket - warningBucket - activeBucket,
    0
  );

  const deliverySegs: Segment[] = [
    { label: 'Done',        value: doneBucket,     color: '#16a34a' },
    { label: 'In Progress', value: activeBucket,   color: '#2563eb' },
    { label: 'At Risk',     value: warningBucket,  color: '#f59e0b' },
    { label: 'Critical',    value: criticalBucket, color: '#dc2626' },
    { label: 'Backlog',     value: otherBucket,    color: '#cbd5e1' },
  ].filter((s) => s.value > 0);

  // 2. Health Mix
  const healthSegs: Segment[] = [
    { label: 'Good',     value: flow.good     || 0, color: '#16a34a' },
    { label: 'Warning',  value: flow.warning  || 0, color: '#f59e0b' },
    { label: 'Critical', value: flow.critical || 0, color: '#dc2626' },
  ].filter((s) => s.value > 0);

  // 3. Issue Types
  const typeList  = ((metrics.types || []) as any[]).slice(0, 6);
  const typeTotal = Math.max(typeList.reduce((s: number, t: any) => s + (t.count || 0), 0), 1);
  const typeSegs: Segment[]  = typeList.map((t: any, i: number) => ({
    label: t.type,
    value: t.count,
    color: PALETTE[i % PALETTE.length],
  }));

  // 4. Story Points
  const spPct  = sp.pointCompletionRate || 0;
  const spSegs: Segment[] =
    sp.totalStoryPoints > 0
      ? [
          { label: 'Completed', value: sp.completedStoryPoints || 0, color: '#16a34a' },
          { label: 'Remaining', value: sp.remainingStoryPoints || 0, color: '#e2e8f0' },
        ]
      : [];

  // 5. Sprint Velocity
  const sprints    = ((metrics.sprint?.sprints || []) as any[]).slice(0, 7).reverse();
  const maxSprint  = Math.max(...sprints.map((s: any) => s.issues || 0), 1);

  // 6. Team Load
  const capacity = ((metrics.capacity || []) as any[]).slice(0, 8);
  const maxLoad  = Math.max(...capacity.map((c: any) => c.loadShare || 0), 1);

  // 7. Quarter Throughput
  const quarters = ((metrics.quarters || []) as any[])
    .filter((q: any) => q.quarter !== 'No date')
    .slice(0, 5)
    .reverse();
  const maxQ = Math.max(...quarters.map((q: any) => q.issues || 0), 1);

  // 8. Kanban Status
  const kanban    = ((metrics.kanban as any)?.byStatus || []) as any[];
  const kanbanTop = kanban.slice(0, 8);
  const maxKanban = Math.max(...kanbanTop.map((k: any) => k.count || 0), 1);

  // 9. Label Distribution
  const labelStats = (((metrics.labels as any)?.labelStats || []) as any[])
    .filter((l: any) => l.label !== '(unlabeled)')
    .slice(0, 7);
  const maxLabel = Math.max(...labelStats.map((l: any) => l.count || 0), 1);

  // 10. Epic Progress
  const epics = ((metrics.epics || []) as any[]).slice(0, 8);

  // 11. Relations
  const relations  = (metrics.relations as any) || {};
  const linkSegs: Segment[]   = relations.hasLinks
    ? ((relations.linkStats || []) as any[]).slice(0, 5).map((l: any, i: number) => ({
        label: l.type,
        value: l.count,
        color: PALETTE[i % PALETTE.length],
      }))
    : [];
  const linkTotal = Math.max(linkSegs.reduce((s, l) => s + l.value, 0), 1);

  return (
    <AppShell showNav>
      {/* Page Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <button
            type="button"
            onClick={() => router.push('/summary')}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 mb-2"
          >
            ← Overview
          </button>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Visual Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">
            Charts and diagrams summarising delivery health, flow, team, and progress across all dimensions.
          </p>
        </div>

        {/* KPI Pills */}
        <div className="flex flex-wrap gap-2">
          <KpiPill
            value={`${metrics.completionRate || 0}%`}
            label="Complete"
            gradient="linear-gradient(135deg,#16a34a,#14b8a6)"
          />
          <KpiPill
            value={flow.critical || 0}
            label="Critical"
            gradient="linear-gradient(135deg,#dc2626,#f97316)"
          />
          <KpiPill
            value={metrics.healthScore || 0}
            label="Health Score"
            gradient="linear-gradient(135deg,#2563eb,#7c3aed)"
          />
          {metrics.prediction &&
            !metrics.prediction.complete &&
            metrics.prediction.daysRemaining !== null && (
              <KpiPill
                value={`~${metrics.prediction.daysRemaining}d`}
                label="Est. Done"
                gradient="linear-gradient(135deg,#0891b2,#2563eb)"
              />
            )}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

        {/* 1. Delivery Composition — span 2 */}
        <ChartWidget title="Delivery Composition" icon="💠" span={2}>
          <div className="flex flex-wrap items-center gap-6">
            <DonutChart
              segments={deliverySegs}
              size={180}
              centerLabel={`${metrics.completionRate || 0}%`}
              centerSub="complete"
            />
            <div className="flex-1 min-w-[140px] space-y-2">
              {deliverySegs.map((s) => (
                <LegendRow
                  key={s.label}
                  color={s.color}
                  label={s.label}
                  value={s.value}
                  pct={Math.round((s.value / total) * 100)}
                />
              ))}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 mt-1">
                <span className="text-slate-500">Total</span>
                <span className="font-bold text-slate-800">{total} issues</span>
              </div>
            </div>
          </div>
        </ChartWidget>

        {/* 2. Health Mix — span 1 */}
        <ChartWidget title="Health Mix" icon="🏥" span={1}>
          <div className="flex flex-wrap items-center gap-4">
            <DonutChart
              segments={healthSegs}
              size={140}
              centerLabel={total}
              centerSub="items"
            />
            <div className="flex-1 min-w-[100px] space-y-2">
              {healthSegs.map((s) => (
                <LegendRow
                  key={s.label}
                  color={s.color}
                  label={s.label}
                  value={s.value}
                  pct={Math.round((s.value / total) * 100)}
                />
              ))}
            </div>
          </div>
        </ChartWidget>

        {/* 3. Issue Types — span 1 */}
        <ChartWidget title="Issue Types" icon="📁" span={1}>
          {typeList.length > 0 ? (
            <div className="flex flex-wrap items-center gap-4">
              <DonutChart
                segments={typeSegs}
                size={130}
                centerLabel={typeTotal}
                centerSub="total"
              />
              <div className="flex-1 min-w-[100px] space-y-2">
                {typeSegs.map((s) => (
                  <LegendRow
                    key={s.label}
                    color={s.color}
                    label={s.label}
                    value={s.value}
                    pct={Math.round((s.value / typeTotal) * 100)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">No issue type data</p>
          )}
        </ChartWidget>

        {/* 4. Story Points — span 1 */}
        <ChartWidget title="Story Points" icon="💎" span={1}>
          {sp.totalStoryPoints > 0 ? (
            <div className="flex flex-wrap items-center gap-4">
              <DonutChart
                segments={spSegs}
                size={130}
                centerLabel={`${spPct}%`}
                centerSub="done"
              />
              <div className="flex-1 min-w-[100px] space-y-2">
                <LegendRow color="#16a34a" label="Completed" value={sp.completedStoryPoints || 0} />
                <LegendRow color="#e2e8f0" label="Remaining" value={sp.remainingStoryPoints || 0} />
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                  <span className="text-slate-500">Total</span>
                  <span className="font-bold text-slate-800">{sp.totalStoryPoints} pts</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">No story point data</p>
          )}
        </ChartWidget>

        {/* 5. Sprint Velocity — span 2 */}
        <ChartWidget title="Sprint Velocity" icon="🏃" span={2}>
          {sprints.length > 0 ? (
            <>
              <div className="flex items-end gap-2 h-28 w-full">
                {sprints.map((s: any) => (
                  <VertBar
                    key={s.name}
                    label={s.name?.length > 9 ? s.name.slice(0, 9) + '…' : s.name}
                    value={s.issues}
                    maxValue={maxSprint}
                    color={
                      s.completionRate >= 80
                        ? '#16a34a'
                        : s.completionRate >= 60
                        ? '#f59e0b'
                        : '#dc2626'
                    }
                  />
                ))}
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-600 inline-block" />
                  <span className="text-slate-500">≥80%</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                  <span className="text-slate-500">≥60%</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-600 inline-block" />
                  <span className="text-slate-500">&lt;60%</span>
                </span>
                <span className="text-slate-400 ml-1">completion rate</span>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400 italic">
              No sprint data — include Sprint column in export.
            </p>
          )}
        </ChartWidget>

        {/* 6. Team Load — span 1 */}
        <ChartWidget title="Team Load" icon="👥" span={1}>
          {capacity.length > 0 ? (
            <div className="space-y-2.5">
              {capacity.map((c: any) => (
                <HorizBar
                  key={c.assignee}
                  label={c.assignee?.length > 14 ? c.assignee.slice(0, 14) + '…' : c.assignee}
                  value={c.loadShare}
                  maxValue={maxLoad}
                  color={
                    c.loadShare > 35
                      ? '#dc2626'
                      : c.loadShare > 20
                      ? '#f59e0b'
                      : '#16a34a'
                  }
                  subLabel={`${c.loadShare}%`}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">No assignee data</p>
          )}
        </ChartWidget>

        {/* 7. Quarter Throughput — span 2 */}
        <ChartWidget title="Quarter Throughput" icon="📅" span={2}>
          {quarters.length > 0 ? (
            <>
              <div className="flex items-end gap-3 h-28 w-full">
                {quarters.map((q: any) => {
                  const totalH = Math.max(3, Math.min(100, (q.issues / maxQ) * 100));
                  const doneH  = Math.max(0, Math.min(totalH, (q.doneIssues / maxQ) * 100));
                  return (
                    <div key={q.quarter} className="flex flex-col items-center flex-1 min-w-0 gap-1">
                      <span className="text-xs font-bold text-slate-600">{q.issues}</span>
                      <div
                        className="w-full relative rounded-t overflow-hidden"
                        style={{ height: `${totalH}%`, minHeight: 6, background: '#bfdbfe' }}
                      >
                        <div
                          className="absolute bottom-0 left-0 right-0 rounded-t"
                          style={{ height: `${(doneH / totalH) * 100}%`, background: '#2563eb' }}
                        />
                      </div>
                      <span
                        className="text-xs text-slate-500 text-center leading-tight max-w-full"
                        title={q.quarter}
                      >
                        {q.quarter.replace(' ', ' ')}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#bfdbfe' }} />
                  <span className="text-slate-500">Total issues</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                  <span className="text-slate-500">Done</span>
                </span>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400 italic">
              No date data — include Created Date and Resolution Date in export.
            </p>
          )}
        </ChartWidget>

        {/* 8. Kanban Status Flow — span 1 */}
        <ChartWidget title="Kanban Status Flow" icon="🗃️" span={1}>
          {kanbanTop.length > 0 ? (
            <div className="space-y-2.5">
              {kanbanTop.map((k: any) => (
                <HorizBar
                  key={k.name}
                  label={k.name?.length > 16 ? k.name.slice(0, 16) + '…' : k.name}
                  value={k.count}
                  maxValue={maxKanban}
                  color={
                    k.critical > 0
                      ? '#dc2626'
                      : k.warning > 0
                      ? '#f59e0b'
                      : '#2563eb'
                  }
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">No status data</p>
          )}
        </ChartWidget>

        {/* 9. Gantt / Timeline — span 3 */}
        <ChartWidget
          title={epics.length > 0 ? 'Epic Delivery Timeline' : 'Sprint Completion Timeline'}
          icon="📊"
          span={3}
        >
          <GanttChart epics={epics} sprints={sprints} />
        </ChartWidget>

        {/* 10. Label Distribution — span 2 (conditional) */}
        {labelStats.length > 0 && (
          <ChartWidget title="Label Distribution" icon="🏷️" span={2}>
            <div className="space-y-2.5">
              {labelStats.map((l: any, i: number) => (
                <HorizBar
                  key={l.label}
                  label={l.label}
                  value={l.count}
                  maxValue={maxLabel}
                  color={PALETTE[i % PALETTE.length]}
                />
              ))}
            </div>
          </ChartWidget>
        )}

        {/* 11. Epic Progress — span 1 (or 3 if no labels) */}
        {epics.length > 0 && (
          <ChartWidget
            title="Epic Progress"
            icon="🎯"
            span={labelStats.length > 0 ? 1 : 3}
          >
            <div className="space-y-3">
              {epics.map((e: any) => (
                <div key={e.epic || e.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="text-xs text-slate-700 font-medium truncate max-w-[70%]"
                      title={e.epic}
                    >
                      {(e.epic || 'No epic').slice(0, 28)}
                    </span>
                    <span
                      className="text-xs font-black ml-2 shrink-0"
                      style={{
                        color:
                          e.critical > 0
                            ? '#dc2626'
                            : e.warning > 0
                            ? '#f59e0b'
                            : '#16a34a',
                      }}
                    >
                      {e.progress || 0}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${e.progress || 0}%`,
                        background:
                          e.critical > 0
                            ? '#dc2626'
                            : e.warning > 0
                            ? '#f59e0b'
                            : '#16a34a',
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {e.completedIssues || 0} / {e.issues || 0} issues
                  </p>
                </div>
              ))}
            </div>
          </ChartWidget>
        )}

        {/* 12. Issue Relations — span 1 (conditional) */}
        {linkSegs.length > 0 && (
          <ChartWidget title="Issue Relations" icon="🔗" span={1}>
            <div className="flex flex-wrap items-center gap-4">
              <DonutChart
                segments={linkSegs}
                size={130}
                centerLabel={relations.totalLinks}
                centerSub="links"
              />
              <div className="flex-1 min-w-[100px] space-y-2">
                {linkSegs.map((s) => (
                  <LegendRow
                    key={s.label}
                    color={s.color}
                    label={s.label.length > 14 ? s.label.slice(0, 14) + '…' : s.label}
                    value={s.value}
                    pct={Math.round((s.value / linkTotal) * 100)}
                  />
                ))}
              </div>
            </div>
          </ChartWidget>
        )}
      </div>

      {/* CTA */}
      <div className="flex flex-wrap items-center justify-center gap-3 pb-4">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="text-sm font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg px-5 py-2.5 shadow-sm transition-colors"
        >
          Upload new file
        </button>
        <button
          type="button"
          onClick={() => router.push('/summary')}
          className="text-sm font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg px-5 py-2.5 shadow-sm transition-colors"
        >
          ← Overview
        </button>
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-6 py-2.5 shadow-sm transition-colors"
        >
          View Full Report →
        </button>
      </div>
    </AppShell>
  );
}
