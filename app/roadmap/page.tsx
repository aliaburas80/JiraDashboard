// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// /roadmap — Epic delivery roadmap: Gantt chart + card view.
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { loadMetricsWithSource } from '@/lib/storage';
import { computePortfolioSummary, type EpicSummary } from '@/lib/portfolioHealth';
import type { DashboardMetrics } from '@/types/metrics';

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
  const sprints = remaining / avgThroughput;
  const weeks   = Math.ceil(sprints * 2);
  const confidence: EpicForecast['confidence'] = sprints < 2 ? 'high' : sprints < 5 ? 'medium' : 'low';
  const label = weeks <= 2 ? 'Within 2 weeks' : weeks <= 6 ? `~${weeks} weeks` : `~${Math.round(weeks / 4)} months`;
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
      Object.entries(epicDates).find(([k]) => k.toLowerCase().includes(epic.name.toLowerCase().slice(0, 8)) || epic.name.toLowerCase().includes(k.toLowerCase().slice(0, 8)))?.[1] ??
      null;
    let startMs: number | null = null;
    let endMs:   number | null = null;
    let isEstimated = false;
    if (dates && dates.starts.length > 0) {
      startMs = Math.min(...dates.starts);
      if (epic.progress >= 100 && dates.ends.length > 0) {
        endMs = Math.max(...dates.ends);
        isEstimated = false;
      } else {
        endMs = epic.weeksRemaining != null
          ? now + epic.weeksRemaining * 7 * 86_400_000
          : now + 90 * 86_400_000;
        isEstimated = true;
      }
    }
    return { ...epic, startMs, endMs, isEstimated };
  });
}

// ── Health colour map (Theme D tokens) ────────────────────────────────────────

const HC = { good: '#22C55E', warning: '#F59E0B', critical: '#E85D12' };

// ── Gantt Chart SVG ────────────────────────────────────────────────────────────

function GanttChart({ timelines }: { timelines: EpicTimeline[] }) {
  const dated = timelines.filter(e => e.startMs && e.endMs).slice(0, 22);
  if (dated.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-3xl mb-2">📅</p>
        <p className="text-sm font-semibold" style={{ color: 'var(--dc-p2, #909090)' }}>No date data available for Gantt view.</p>
        <p className="text-xs mt-1" style={{ color: 'var(--dc-p3, #505050)' }}>Ensure your Jira export includes <strong>Created</strong> and <strong>Resolved</strong> date columns.</p>
      </div>
    );
  }

  const now = Date.now();
  const LABEL_W = 164;
  const CHART_W = 556;
  const ROW_H   = 36;
  const BAR_H   = 20;
  const HEAD_H  = 26;
  const TOTAL_W = LABEL_W + CHART_W;
  const TOTAL_H = HEAD_H + dated.length * ROW_H + 6;

  const minMs = Math.min(...dated.map(e => e.startMs!));
  const maxMs = Math.max(...dated.map(e => e.endMs!), now + 14 * 86_400_000);
  const pad   = (maxMs - minMs) * 0.04;
  const rStart = minMs - pad;
  const rEnd   = maxMs + pad;
  const rMs    = rEnd - rStart;

  function xOf(ms: number) { return LABEL_W + ((ms - rStart) / rMs) * CHART_W; }

  const ticks: { x: number; label: string }[] = [];
  const d = new Date(rStart); d.setDate(1); d.setHours(0,0,0,0);
  while (d.getTime() < rEnd) {
    const x = xOf(d.getTime());
    if (x >= LABEL_W)
      ticks.push({ x, label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) });
    d.setMonth(d.getMonth() + 1);
  }

  const todayX = xOf(now);

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${TOTAL_W} ${TOTAL_H}`} style={{ width: '100%', minWidth: 520 }}>
        <defs>
          <pattern id="est-hatch" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(232,93,18,0.5)" strokeWidth="2.5" />
          </pattern>
        </defs>

        {/* Chart area bg */}
        <rect x={LABEL_W} y={0} width={CHART_W} height={TOTAL_H} fill="#141414" rx="0" />

        {/* Monthly grid lines + labels */}
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={t.x} x2={t.x} y1={HEAD_H - 4} y2={TOTAL_H} stroke="rgba(255,255,255,0.07)" strokeWidth="0.75" />
            <text x={t.x + 3} y={HEAD_H - 10} fontSize="8" fill="#505050">{t.label}</text>
          </g>
        ))}

        {/* Today line */}
        {todayX >= LABEL_W && todayX <= LABEL_W + CHART_W && (
          <g>
            <line x1={todayX} x2={todayX} y1={0} y2={TOTAL_H} stroke="#FF8A4C" strokeWidth="1.5" strokeDasharray="5 3" />
            <rect x={todayX - 14} y={0} width={28} height={12} rx="3" fill="#FF8A4C" />
            <text x={todayX} y={9} fontSize="7" fill="#fff" textAnchor="middle" fontWeight="bold">TODAY</text>
          </g>
        )}

        {/* Rows */}
        {dated.map((epic, i) => {
          const rowY = HEAD_H + i * ROW_H;
          const barY = rowY + (ROW_H - BAR_H) / 2;
          const x1 = Math.max(LABEL_W + 1, xOf(epic.startMs!));
          const x2 = Math.min(LABEL_W + CHART_W - 1, xOf(epic.endMs!));
          const bw  = Math.max(6, x2 - x1);
          const fw  = Math.max(3, bw * (epic.progress / 100));
          const col = HC[epic.health];

          return (
            <g key={i}>
              {i % 2 === 0 && <rect x={0} y={rowY} width={TOTAL_W} height={ROW_H} fill="#1E1E1E" opacity="0.4" />}

              {/* Health dot */}
              <circle cx={7} cy={rowY + ROW_H / 2} r={4} fill={col} />

              {/* Epic label */}
              <text x={15} y={rowY + ROW_H / 2 + 4} fontSize="9.5" fill="#F2F2F2" fontWeight="600">
                {epic.name.length > 21 ? epic.name.slice(0, 21) + '…' : epic.name}
              </text>

              {/* Bar background (track) */}
              <rect x={x1} y={barY} width={bw} height={BAR_H} rx={5} fill="#282828" />

              {/* Estimated hatch overlay */}
              {epic.isEstimated && (
                <rect x={x1} y={barY} width={bw} height={BAR_H} rx={5} fill="url(#est-hatch)" />
              )}

              {/* Filled progress */}
              <rect x={x1} y={barY} width={fw} height={BAR_H} rx={5} fill={col} opacity="0.9" />

              {/* Progress % label inside bar */}
              {bw > 36 && (
                <text x={x1 + bw / 2} y={barY + BAR_H / 2 + 3.5} fontSize="8" fill="#fff" textAnchor="middle" fontWeight="bold">
                  {Math.round(epic.progress)}%
                </text>
              )}

              {/* Forecast label to the right */}
              {x2 + 4 < TOTAL_W - 2 && (
                <text x={x2 + 5} y={barY + BAR_H / 2 + 3.5} fontSize="8" fill="#505050">
                  {epic.forecastLabel === 'Insufficient data' ? '' : epic.forecastLabel}
                </text>
              )}
            </g>
          );
        })}

        {/* Left label column separator */}
        <line x1={LABEL_W} x2={LABEL_W} y1={0} y2={TOTAL_H} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-3 px-2 text-[11px]" style={{ color: 'var(--dc-p3, #505050)' }}>
        {[['#22C55E','On track'],['#F59E0B','At risk'],['#E85D12','Critical']].map(([c,l]) => (
          <span key={l} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: c }} />
            {l}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="w-8 h-3 rounded inline-block"
            style={{ background: 'repeating-linear-gradient(45deg,rgba(232,93,18,0.4),rgba(232,93,18,0.4) 2px,transparent 2px,transparent 6px)', border: '1px solid rgba(232,93,18,0.25)' }} />
          Estimated
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-px h-3 inline-block" style={{ background: '#FF8A4C' }} />
          Today
        </span>
      </div>
    </div>
  );
}

// ── Epic Card (card view) ──────────────────────────────────────────────────────

const CONF_CHIP: Record<string, string> = {
  high:   'chip c-gr',
  medium: 'chip c-am',
  low:    'chip c-nt',
};

function EpicCard({ epic }: { epic: EpicForecast }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl shadow-sm overflow-hidden"
      style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full text-left px-5 py-4 transition-colors"
        style={{ background: 'transparent' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: HC[epic.health] }} />
              <p className="text-sm font-black truncate" style={{ color: 'var(--dc-p1, #F2F2F2)' }}>{epic.name}</p>
              {epic.progress >= 100 && <span className="chip c-gr" style={{ fontSize: 10 }}>Done</span>}
            </div>
            <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: 'var(--dc-s3, #282828)' }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, epic.progress)}%`, background: HC[epic.health] }} />
            </div>
            <div className="flex items-center gap-4 mt-1.5 text-[11px]" style={{ color: 'var(--dc-p2, #909090)' }}>
              <span>{epic.completedIssues}/{epic.issues} issues ({Math.round(epic.progress)}%)</span>
              {epic.storyPoints > 0 && <span>{epic.doneStoryPoints}/{epic.storyPoints} SP</span>}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs font-bold" style={{ color: 'var(--dc-p1, #F2F2F2)' }}>{epic.forecastLabel}</p>
            <span className={`${CONF_CHIP[epic.confidence] ?? 'chip c-nt'} mt-1`} style={{ fontSize: 10 }}>
              {epic.confidence} confidence
            </span>
          </div>
        </div>
      </button>
      {open && (
        <div className="px-5 py-3 grid grid-cols-3 gap-3"
          style={{ borderTop: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))', background: 'var(--dc-s1, #141414)' }}>
          {[
            { label: 'Remaining', value: epic.remainingIssues },
            { label: 'Sprints est.', value: epic.sprintsRemaining ?? '—' },
            { label: 'Critical', value: epic.critical },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-lg font-black" style={{ color: 'var(--dc-p1, #F2F2F2)', fontFamily: 'var(--font-mono, monospace)' }}>{s.value}</p>
              <p className="text-[10px] uppercase tracking-wide font-bold" style={{ color: 'var(--dc-p3, #505050)' }}>{s.label}</p>
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
  const [view,       setView]       = useState<'gantt' | 'cards'>('gantt');
  const [filter,     setFilter]     = useState<'all' | 'active' | 'critical' | 'done'>('active');
  const [sort,       setSort]       = useState<'progress' | 'name' | 'forecast'>('forecast');

  useEffect(() => {
    async function load() {
      const result    = await loadMetricsWithSource();
      const metrics   = result.metrics as DashboardMetrics | null;
      if (!metrics) { router.replace('/'); return; }

      const sprints      = (metrics.sprint?.sprints ?? []) as any[];
      const valid        = sprints.filter((s: any) => (s.completedCount ?? 0) > 0);
      const avgThroughput = valid.length > 0 ? valid.reduce((s: number, x: any) => s + x.completedCount, 0) / valid.length : 0;

      const portfolio = computePortfolioSummary(metrics);
      const forecast  = portfolio.epics.map(e => forecastEpic(e, avgThroughput));
      const flowItems = (metrics.flow?.items ?? []) as any[];
      const tl        = buildTimelines(forecast, flowItems);

      setEpics(forecast);
      setTimelines(tl);
      setThroughput(parseFloat(avgThroughput.toFixed(1)));
      setLoading(false);
    }
    load().catch(() => router.replace('/'));
  }, [router]);

  if (loading) return (
    <AppShell showNav>
      <div className="flex items-center justify-center h-64 animate-pulse" style={{ color: 'var(--dc-p3, #505050)' }}>
        Building roadmap…
      </div>
    </AppShell>
  );

  const totalEpics  = epics.length;
  const doneEpics   = epics.filter(e => e.progress >= 100).length;
  const critEpics   = epics.filter(e => e.health === 'critical').length;
  const avgProgress = totalEpics > 0 ? Math.round(epics.reduce((s, e) => s + e.progress, 0) / totalEpics) : 0;

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

  // KPI card value colours
  const avgProgColor = avgProgress >= 80 ? 'var(--dc-acc2, #FF8A4C)' : 'var(--dc-amber, #F59E0B)';

  return (
    <AppShell showNav>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-5">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold mb-3"
            style={{ background: 'rgba(232,93,18,0.10)', border: '1px solid rgba(232,93,18,0.22)', color: 'var(--dc-acc2, #FF8A4C)' }}>
            🗺️ Planning
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight mb-1" style={{ color: 'var(--dc-p1, #F2F2F2)' }}>Roadmap</h1>
              <p className="text-sm" style={{ color: 'var(--dc-p3, #505050)' }}>Epic-level delivery timeline — based on your uploaded Jira data.</p>
            </div>
            {/* View toggle */}
            <div className="flex rounded-[9px] p-[3px] gap-1" style={{ background: 'var(--dc-s3, #282828)' }}>
              {(['gantt','cards'] as const).map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className="px-4 py-1.5 text-xs font-bold transition-colors"
                  style={{
                    borderRadius: 7,
                    background: view === v ? 'var(--dc-s2, #1E1E1E)' : 'transparent',
                    color: view === v ? 'var(--dc-acc2, #FF8A4C)' : 'var(--dc-p2, #909090)',
                    boxShadow: view === v ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
                  }}
                >
                  {v === 'gantt' ? '📊 Gantt' : '📋 Cards'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary KPI row */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total Epics',  value: totalEpics,        icon: '📋', color: 'var(--dc-p1, #F2F2F2)' },
            { label: 'Complete',     value: doneEpics,         icon: '✅', color: 'var(--dc-green, #22C55E)' },
            { label: 'Avg Progress', value: `${avgProgress}%`, icon: '📈', color: avgProgColor },
            { label: 'Critical',     value: critEpics,         icon: '⚠️', color: critEpics > 0 ? 'var(--dc-red, #F87171)' : 'var(--dc-p3, #505050)' },
          ].map(c => (
            <div key={c.label} className="rounded-2xl p-4 text-center shadow-sm"
              style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>
              <p className="text-xl mb-1">{c.icon}</p>
              <p className="text-2xl font-black" style={{ color: c.color, fontFamily: 'var(--font-mono, monospace)' }}>{c.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide mt-0.5" style={{ color: 'var(--dc-p3, #505050)' }}>{c.label}</p>
            </div>
          ))}
        </div>

        {/* Throughput context */}
        <div className="flex items-center gap-2 rounded-[9px] px-4 py-2.5 mb-5 text-sm"
          style={{
            background: 'rgba(245,158,11,0.06)',
            border: '1px solid rgba(245,158,11,0.18)',
          }}>
          <span style={{ color: 'var(--dc-amber, #F59E0B)', fontSize: 14 }}>⚡</span>
          <span className="font-semibold" style={{ color: 'var(--dc-amber, #F59E0B)', fontSize: 11 }}>
            Avg throughput: <strong>{throughput > 0 ? `${throughput} items/sprint` : 'No sprint data'}</strong>
          </span>
          <span className="text-xs ml-auto" style={{ color: 'var(--dc-p2, #909090)' }}>
            {throughput > 0 ? 'Linear extrapolation · 2-week sprints · Hatched bars = estimated end' : 'Upload sprint data to enable forecasts'}
          </span>
        </div>

        {/* ── GANTT VIEW ── */}
        {view === 'gantt' && (
          <div className="rounded-2xl shadow-sm p-5"
            style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black" style={{ color: 'var(--dc-p1, #F2F2F2)' }}>Epic Timeline</h2>
              <span className="text-xs" style={{ color: 'var(--dc-p3, #505050)' }}>{ganttTimelines.filter(t => t.startMs).length} of {totalEpics} epics with date data</span>
            </div>
            <GanttChart timelines={ganttTimelines} />
          </div>
        )}

        {/* ── CARDS VIEW ── */}
        {view === 'cards' && (
          <>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex gap-1">
                {(['active','all','critical','done'] as const).map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                    style={{
                      background: filter === f ? 'var(--dc-acc, #E85D12)' : 'var(--dc-s2, #1E1E1E)',
                      color: filter === f ? '#fff' : 'var(--dc-p2, #909090)',
                      border: filter === f ? '1px solid var(--dc-acc)' : '1px solid var(--dc-bdr)',
                    }}
                  >
                    {f === 'active' ? 'In Progress' : f === 'critical' ? '⚠️ Critical' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              <select
                value={sort}
                onChange={e => setSort(e.target.value as typeof sort)}
                className="text-xs font-bold rounded-lg px-2 py-1.5"
                style={{
                  background: 'var(--dc-s2, #1E1E1E)',
                  border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))',
                  color: 'var(--dc-p2, #909090)',
                }}
              >
                <option value="forecast">Sort: Forecast</option>
                <option value="progress">Sort: Progress</option>
                <option value="name">Sort: Name</option>
              </select>
            </div>

            {sorted.length === 0 ? (
              <div className="text-center py-12" style={{ color: 'var(--dc-p3, #505050)' }}>
                <p className="text-4xl mb-3">🗺️</p>
                <p className="font-bold" style={{ color: 'var(--dc-p2, #909090)' }}>No epics match this filter.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sorted.map((epic, i) => <EpicCard key={`${epic.name}-${i}`} epic={epic} />)}
              </div>
            )}
          </>
        )}

        {epics.length === 0 && !loading && (
          <div className="text-center py-16 rounded-2xl shadow-sm mt-4"
            style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>
            <p className="text-5xl mb-4">🗺️</p>
            <p className="text-base font-black mb-2" style={{ color: 'var(--dc-p1, #F2F2F2)' }}>No epic data found</p>
            <p className="text-sm max-w-sm mx-auto" style={{ color: 'var(--dc-p3, #505050)' }}>Upload a Jira export that includes the <strong>Epic Link</strong> or <strong>Epic Name</strong> column.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
