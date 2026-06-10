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

// ── Gantt Chart SVG ────────────────────────────────────────────────────────────

const HC = { good: '#22c55e', warning: '#f59e0b', critical: '#ef4444' };

function GanttChart({ timelines }: { timelines: EpicTimeline[] }) {
  const dated = timelines.filter(e => e.startMs && e.endMs).slice(0, 22);
  if (dated.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400">
        <p className="text-3xl mb-2">📅</p>
        <p className="text-sm font-semibold text-slate-500">No date data available for Gantt view.</p>
        <p className="text-xs mt-1">Ensure your Jira export includes <strong>Created</strong> and <strong>Resolved</strong> date columns.</p>
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

  // Monthly ticks
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
            <line x1="0" y1="0" x2="0" y2="8" stroke="#cbd5e1" strokeWidth="2.5" />
          </pattern>
        </defs>

        {/* Chart area bg */}
        <rect x={LABEL_W} y={0} width={CHART_W} height={TOTAL_H} fill="#f8fafc" rx="0" />

        {/* Monthly grid lines + labels */}
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={t.x} x2={t.x} y1={HEAD_H - 4} y2={TOTAL_H} stroke="#e2e8f0" strokeWidth="0.75" />
            <text x={t.x + 3} y={HEAD_H - 10} fontSize="8" fill="#94a3b8">{t.label}</text>
          </g>
        ))}

        {/* Today line */}
        {todayX >= LABEL_W && todayX <= LABEL_W + CHART_W && (
          <g>
            <line x1={todayX} x2={todayX} y1={0} y2={TOTAL_H} stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="5 3" />
            <rect x={todayX - 14} y={0} width={28} height={12} rx="3" fill="#3b82f6" />
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
              {i % 2 === 0 && <rect x={0} y={rowY} width={TOTAL_W} height={ROW_H} fill="#fff" opacity="0.55" />}

              {/* Health dot */}
              <circle cx={7} cy={rowY + ROW_H / 2} r={4} fill={col} />

              {/* Epic label */}
              <text x={15} y={rowY + ROW_H / 2 + 4} fontSize="9.5" fill="#334155" fontWeight="600">
                {epic.name.length > 21 ? epic.name.slice(0, 21) + '…' : epic.name}
              </text>

              {/* Bar background */}
              <rect x={x1} y={barY} width={bw} height={BAR_H} rx={5} fill="#e2e8f0" />

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
                <text x={x2 + 5} y={barY + BAR_H / 2 + 3.5} fontSize="8" fill="#64748b">
                  {epic.forecastLabel === 'Insufficient data' ? '' : epic.forecastLabel}
                </text>
              )}
            </g>
          );
        })}

        {/* Left label column separator */}
        <line x1={LABEL_W} x2={LABEL_W} y1={0} y2={TOTAL_H} stroke="#e2e8f0" strokeWidth="1" />
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-3 px-2 text-[11px] text-slate-500">
        {[['#22c55e','On track'],['#f59e0b','At risk'],['#ef4444','Critical']].map(([c,l]) => (
          <span key={l} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: c }} />
            {l}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="w-8 h-3 rounded inline-block border border-slate-300" style={{ background: 'repeating-linear-gradient(45deg,#cbd5e1,#cbd5e1 2px,transparent 2px,transparent 6px)' }} />
          Estimated
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-px h-3 inline-block bg-blue-400" />
          Today
        </span>
      </div>
    </div>
  );
}

// ── Epic Card (card view) ──────────────────────────────────────────────────────

const CONF_COLOR = {
  high:   'text-green-600 bg-green-50 border-green-200',
  medium: 'text-amber-600 bg-amber-50 border-amber-200',
  low:    'text-slate-500 bg-slate-50 border-slate-200',
};

function EpicCard({ epic }: { epic: EpicForecast }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <button type="button" onClick={() => setOpen(o => !o)} className="w-full text-left px-5 py-4 hover:bg-slate-50 transition-colors">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: HC[epic.health] }} />
              <p className="text-sm font-black text-slate-900 truncate">{epic.name}</p>
              {epic.progress >= 100 && <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">Done</span>}
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, epic.progress)}%`, background: HC[epic.health] }} />
            </div>
            <div className="flex items-center gap-4 mt-1.5 text-[11px] text-slate-500">
              <span>{epic.completedIssues}/{epic.issues} issues ({Math.round(epic.progress)}%)</span>
              {epic.storyPoints > 0 && <span>{epic.doneStoryPoints}/{epic.storyPoints} SP</span>}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs font-bold text-slate-700">{epic.forecastLabel}</p>
            <span className={`inline-block text-[10px] font-bold border rounded-full px-2 py-0.5 mt-1 ${CONF_COLOR[epic.confidence]}`}>
              {epic.confidence} confidence
            </span>
          </div>
        </div>
      </button>
      {open && (
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 grid grid-cols-3 gap-3">
          {[
            { label: 'Remaining', value: epic.remainingIssues },
            { label: 'Sprints est.', value: epic.sprintsRemaining ?? '—' },
            { label: 'Critical', value: epic.critical },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-lg font-black text-slate-900">{s.value}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide font-bold">{s.label}</p>
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

  if (loading) return <AppShell showNav><div className="flex items-center justify-center h-64 text-slate-400 animate-pulse">Building roadmap…</div></AppShell>;

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

  // Gantt uses all epics sorted by start date
  const ganttTimelines = [...timelines].sort((a, b) => (a.startMs ?? 0) - (b.startMs ?? 0));

  return (
    <AppShell showNav>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-5">
          <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-full px-3 py-1 text-xs font-bold text-purple-700 mb-3">
            🗺️ Planning
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Roadmap</h1>
              <p className="text-sm text-slate-500">Epic-level delivery timeline — based on your uploaded Jira data.</p>
            </div>
            {/* View toggle */}
            <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
              {(['gantt','cards'] as const).map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${view === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
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
            { label: 'Total Epics',  value: totalEpics,         icon: '📋', color: 'text-slate-900' },
            { label: 'Complete',     value: doneEpics,          icon: '✅', color: 'text-green-600' },
            { label: 'Avg Progress', value: `${avgProgress}%`,  icon: '📈', color: 'text-blue-600' },
            { label: 'Critical',     value: critEpics,          icon: '⚠️', color: critEpics > 0 ? 'text-red-600' : 'text-slate-400' },
          ].map(c => (
            <div key={c.label} className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
              <p className="text-xl mb-1">{c.icon}</p>
              <p className={`text-2xl font-black ${c.color}`}>{c.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Throughput context */}
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 mb-5 text-sm">
          <span>⚡</span>
          <span className="font-semibold text-blue-800">
            Avg throughput: <strong>{throughput > 0 ? `${throughput} items/sprint` : 'No sprint data'}</strong>
          </span>
          <span className="text-blue-500 text-xs ml-auto">
            {throughput > 0 ? 'Linear extrapolation · 2-week sprints · Hatched bars = estimated end' : 'Upload sprint data to enable forecasts'}
          </span>
        </div>

        {/* ── GANTT VIEW ── */}
        {view === 'gantt' && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-slate-900">Epic Timeline</h2>
              <span className="text-xs text-slate-400">{ganttTimelines.filter(t => t.startMs).length} of {totalEpics} epics with date data</span>
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                  >
                    {f === 'active' ? 'In Progress' : f === 'critical' ? '⚠️ Critical' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              <select
                value={sort}
                onChange={e => setSort(e.target.value as typeof sort)}
                className="text-xs font-bold text-slate-600 border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
              >
                <option value="forecast">Sort: Forecast</option>
                <option value="progress">Sort: Progress</option>
                <option value="name">Sort: Name</option>
              </select>
            </div>

            {sorted.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p className="text-4xl mb-3">🗺️</p>
                <p className="font-bold text-slate-600">No epics match this filter.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sorted.map((epic, i) => <EpicCard key={`${epic.name}-${i}`} epic={epic} />)}
              </div>
            )}
          </>
        )}

        {epics.length === 0 && !loading && (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl shadow-sm mt-4">
            <p className="text-5xl mb-4">🗺️</p>
            <p className="text-base font-black text-slate-700 mb-2">No epic data found</p>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">Upload a Jira export that includes the <strong>Epic Link</strong> or <strong>Epic Name</strong> column.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
