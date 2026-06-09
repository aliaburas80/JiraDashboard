// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// /roadmap — Epic-level delivery roadmap: progress, health, estimated completion.
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { loadMetricsWithSource } from '@/lib/storage';
import { computePortfolioSummary, type EpicSummary } from '@/lib/portfolioHealth';
import type { DashboardMetrics } from '@/types/metrics';

// ── Forecast helpers ──────────────────────────────────────────────────────────

interface EpicForecast extends EpicSummary {
  remainingIssues:   number;
  sprintsRemaining:  number | null;
  weeksRemaining:    number | null;
  forecastLabel:     string;
  confidence:        'high' | 'medium' | 'low';
}

function forecastEpic(epic: EpicSummary, avgThroughputPerSprint: number): EpicForecast {
  const remaining = epic.issues - epic.completedIssues;
  if (epic.progress >= 100) {
    return { ...epic, remainingIssues: 0, sprintsRemaining: 0, weeksRemaining: 0, forecastLabel: 'Complete', confidence: 'high' };
  }
  if (avgThroughputPerSprint <= 0 || remaining <= 0) {
    return { ...epic, remainingIssues: remaining, sprintsRemaining: null, weeksRemaining: null, forecastLabel: 'Insufficient data', confidence: 'low' };
  }
  const sprints = remaining / avgThroughputPerSprint;
  const weeks   = Math.ceil(sprints * 2); // 2-week sprints
  const confidence: EpicForecast['confidence'] = sprints < 2 ? 'high' : sprints < 5 ? 'medium' : 'low';
  const label = weeks <= 2 ? 'Within 2 weeks' : weeks <= 6 ? `~${weeks} weeks` : `~${Math.round(weeks / 4)} months`;
  return { ...epic, remainingIssues: remaining, sprintsRemaining: parseFloat(sprints.toFixed(1)), weeksRemaining: weeks, forecastLabel: label, confidence };
}

// ── Components ────────────────────────────────────────────────────────────────

const HEALTH_COLOR = { good: '#22c55e', warning: '#f59e0b', critical: '#ef4444' };
const CONF_COLOR   = { high: 'text-green-600 bg-green-50 border-green-200', medium: 'text-amber-600 bg-amber-50 border-amber-200', low: 'text-slate-500 bg-slate-50 border-slate-200' };

function ProgressBar({ value, health }: { value: number; health: 'good' | 'warning' | 'critical' }) {
  return (
    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, value)}%`, background: HEALTH_COLOR[health] }}
      />
    </div>
  );
}

function EpicCard({ epic }: { epic: EpicForecast }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full text-left px-5 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: HEALTH_COLOR[epic.health] }} />
              <p className="text-sm font-black text-slate-900 truncate">{epic.name}</p>
              {epic.progress >= 100 && <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">Done</span>}
            </div>
            <ProgressBar value={epic.progress} health={epic.health} />
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
          <div className="text-center">
            <p className="text-lg font-black text-slate-900">{epic.remainingIssues}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide font-bold">Remaining</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-slate-900">{epic.sprintsRemaining ?? '—'}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide font-bold">Sprints est.</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-slate-900">{epic.critical > 0 ? epic.critical : '0'}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide font-bold">Critical</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RoadmapPage() {
  const router = useRouter();
  const [epics,         setEpics]         = useState<EpicForecast[]>([]);
  const [throughput,    setThroughput]    = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [filter,        setFilter]        = useState<'all' | 'active' | 'critical' | 'done'>('active');
  const [sort,          setSort]          = useState<'progress' | 'name' | 'forecast'>('forecast');

  useEffect(() => {
    async function load() {
      const result  = await loadMetricsWithSource();
      const metrics = result.metrics as DashboardMetrics | null;
      if (!metrics) { router.replace('/'); return; }

      // Throughput: items completed per sprint
      const sprints    = (metrics.sprint?.sprints ?? []) as any[];
      const validSprints = sprints.filter((s: any) => typeof s.completedCount === 'number' && s.completedCount > 0);
      const avgThroughput = validSprints.length > 0
        ? validSprints.reduce((sum: number, s: any) => sum + (s.completedCount ?? 0), 0) / validSprints.length
        : 0;

      const portfolio = computePortfolioSummary(metrics);
      const forecast  = portfolio.epics.map(e => forecastEpic(e, avgThroughput));
      setEpics(forecast);
      setThroughput(parseFloat(avgThroughput.toFixed(1)));
      setLoading(false);
    }
    load().catch(() => router.replace('/'));
  }, [router]);

  if (loading) return <AppShell showNav><div className="flex items-center justify-center h-64 text-slate-400 animate-pulse">Building roadmap…</div></AppShell>;

  const filtered = epics.filter(e =>
    filter === 'all'      ? true :
    filter === 'active'   ? e.progress < 100 :
    filter === 'critical' ? e.health === 'critical' :
    filter === 'done'     ? e.progress >= 100 : true
  );

  const sorted = [...filtered].sort((a, b) =>
    sort === 'progress' ? b.progress - a.progress :
    sort === 'name'     ? a.name.localeCompare(b.name) :
    // forecast: sort by weeks remaining (null = worst, 0 = done first for done filter, else ascending)
    sort === 'forecast' ?
      (a.weeksRemaining === null ? 999 : a.weeksRemaining) - (b.weeksRemaining === null ? 999 : b.weeksRemaining)
    : 0
  );

  const totalEpics   = epics.length;
  const doneEpics    = epics.filter(e => e.progress >= 100).length;
  const critEpics    = epics.filter(e => e.health === 'critical').length;
  const avgProgress  = totalEpics > 0 ? Math.round(epics.reduce((s, e) => s + e.progress, 0) / totalEpics) : 0;

  return (
    <AppShell showNav>
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-full px-3 py-1 text-xs font-bold text-purple-700 mb-3">
            🗺️ Delivery
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Roadmap</h1>
          <p className="text-sm text-slate-500">
            Epic progress, delivery forecasts, and estimated completion — based on your uploaded Jira data.
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Epics',    value: totalEpics,                     icon: '📋', color: 'text-slate-900' },
            { label: 'Complete',       value: doneEpics,                      icon: '✅', color: 'text-green-600' },
            { label: 'Avg Progress',   value: `${avgProgress}%`,              icon: '📈', color: 'text-blue-600' },
            { label: 'Critical',       value: critEpics,                      icon: '⚠️', color: critEpics > 0 ? 'text-red-600' : 'text-slate-400' },
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
            Average throughput: <strong>{throughput > 0 ? `${throughput} items/sprint` : 'No sprint data'}</strong>
          </span>
          <span className="text-blue-500 text-xs ml-auto">Forecasts assume 2-week sprints · {throughput > 0 ? 'Linear extrapolation' : 'Upload sprint data for forecasts'}</span>
        </div>

        {/* Filters + Sort */}
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

        {/* Epic cards */}
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

        {epics.length === 0 && !loading && (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <p className="text-5xl mb-4">🗺️</p>
            <p className="text-base font-black text-slate-700 mb-2">No epic data found</p>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">Upload a Jira export that includes the <strong>Epic Link</strong> or <strong>Epic Name</strong> column to see your roadmap.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
