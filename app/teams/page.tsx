// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Team-level health comparison — 9.31
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { SvgIcon } from '@/components/ui/SvgIcon';
import { loadMetricsWithSource } from '@/lib/storage';
import { computeTeamHealth, teamBandColor, teamBandBg, type TeamHealthEntry } from '@/lib/teamHealth';
import { exportTeamsToCsv } from '@/services/export/teamsExport.service';
import type { DashboardMetrics, FlowItem } from '@/types/metrics';

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');
}

function avatarBg(name: string): string {
  const colors = ['#2563eb','#0891b2','#7c3aed','#16a34a','#f59e0b','#ea580c','#dc2626','#0d9488'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return colors[Math.abs(h) % colors.length];
}

// ── Reusable mini-bar ─────────────────────────────────────────────────────────

function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
    </div>
  );
}

// ── Team card ─────────────────────────────────────────────────────────────────

function TeamCard({ entry }: { entry: TeamHealthEntry }) {
  const color = teamBandColor(entry.band);
  const bg    = teamBandBg(entry.band);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col gap-3">

      {/* Header: avatar + name + score */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-black shrink-0"
          style={{ background: avatarBg(entry.assignee) }}
        >
          {initials(entry.assignee) || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-slate-900 truncate" title={entry.assignee}>{entry.assignee}</p>
          <span
            className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5"
            style={{ background: bg, color }}
          >
            {entry.band}
          </span>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-black leading-none" style={{ color }}>{entry.healthScore}</p>
          <p className="text-[10px] text-slate-400 font-semibold">/100</p>
        </div>
      </div>

      {/* Completion bar */}
      <div>
        <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
          <span>Completion</span>
          <span style={{ color }}>{entry.completionPct}%</span>
        </div>
        <MiniBar pct={entry.completionPct} color={color} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-1 text-center">
        {[
          { label: 'Issues',   value: entry.totalIssues,   clr: '#64748b' },
          { label: 'Done',     value: entry.doneIssues,    clr: '#16a34a' },
          { label: 'Blocked',  value: entry.blockedCount,  clr: entry.blockedCount  > 0 ? '#dc2626' : '#94a3b8' },
          { label: 'Critical', value: entry.criticalCount, clr: entry.criticalCount > 0 ? '#dc2626' : '#94a3b8' },
        ].map(s => (
          <div key={s.label}>
            <p className="text-sm font-black" style={{ color: s.clr }}>{s.value}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Health distribution pills */}
      <div className="flex gap-1.5 flex-wrap">
        {entry.goodCount     > 0 && <span className="text-[10px] font-bold bg-green-50  text-green-700  border border-green-200  rounded-full px-2 py-0.5">Good: {entry.goodCount}</span>}
        {entry.warningCount  > 0 && <span className="text-[10px] font-bold bg-amber-50  text-amber-700  border border-amber-200  rounded-full px-2 py-0.5">Warn: {entry.warningCount}</span>}
        {entry.criticalCount > 0 && <span className="text-[10px] font-bold bg-red-50    text-red-700    border border-red-200    rounded-full px-2 py-0.5">Crit: {entry.criticalCount}</span>}
        {entry.storyPoints   > 0 && <span className="text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200 rounded-full px-2 py-0.5">SP: {entry.doneStoryPoints}/{entry.storyPoints}</span>}
      </div>

      {/* Load + age footer */}
      <div className="flex justify-between text-[10px] text-slate-400 font-semibold border-t border-slate-100 pt-2">
        <span>Load: <span className="text-slate-600 font-black">{entry.loadShare}%</span></span>
        {entry.avgOpenAgeDays !== null && (
          <span>Avg open age: <span className={`font-black ${entry.avgOpenAgeDays > 14 ? 'text-red-600' : 'text-slate-600'}`}>{entry.avgOpenAgeDays}d</span></span>
        )}
      </div>
    </div>
  );
}

// ── Horizontal comparison bar ─────────────────────────────────────────────────

function CompareBar({ label, value, maxValue, color, unit = '' }: {
  label: string; value: number; maxValue: number; color: string; unit?: string;
}) {
  const pct = maxValue > 0 ? Math.max(0, Math.min(100, (value / maxValue) * 100)) : 0;
  return (
    <div className="flex items-center gap-2 text-xs mb-1.5">
      <span className="text-slate-600 truncate w-28 shrink-0 font-semibold" title={label}>{label}</span>
      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="font-black text-slate-800 w-12 text-right shrink-0">{value}{unit}</span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TeamsPage() {
  const router = useRouter();
  const [teams, setTeams]     = useState<TeamHealthEntry[]>([]);
  const [noData, setNoData]   = useState(false);
  // 09-ux §4 (silent redirect / conflated error state): a genuine fetch
  // failure previously rendered the identical "No team data available"
  // empty state as a real empty state, with no way to tell them apart.
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
    const result = await loadMetricsWithSource();
    if (cancelled) return;
    const metrics = result.metrics as DashboardMetrics | null;
    if (!metrics) { setNoData(true); return; }

    const capacity  = metrics.capacity ?? [];
    const flowItems = (metrics.flow?.items ?? []) as FlowItem[];

    if (!capacity.length) { setNoData(true); return; }
    setTeams(computeTeamHealth(capacity, flowItems));
    }
    load().catch(() => { if (!cancelled) setLoadError(true); });
    return () => { cancelled = true; };
  }, []);

  // ── Summary aggregates ────────────────────────────────────────────────────
  const totalMembers    = teams.length;
  const avgHealth       = totalMembers > 0 ? Math.round(teams.reduce((s, t) => s + t.healthScore, 0) / totalMembers) : 0;
  const totalAtRisk     = teams.reduce((s, t) => s + t.criticalCount + t.blockedCount, 0);
  const healthyCount    = teams.filter(t => t.band === 'Healthy').length;
  const atRiskCount     = teams.filter(t => t.band === 'Team At Risk').length;
  const criticalCount   = teams.filter(t => t.band === 'Critical').length;

  const avgColor = avgHealth >= 70 ? '#16a34a' : avgHealth >= 40 ? '#f59e0b' : '#dc2626';

  if (loadError) {
    return (
      <AppShell showNav>
        <div className="max-w-5xl mx-auto py-20 text-center">
          <SvgIcon name="warning" size={48} className="mx-auto mb-4 text-slate-400" />
          <p className="text-base font-black text-slate-700 mb-2">Couldn&apos;t load team data</p>
          <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
            Something went wrong loading your dashboard data. Try refreshing the page — if this keeps happening, contact your administrator.
          </p>
        </div>
      </AppShell>
    );
  }

  if (noData) {
    return (
      <AppShell showNav>
        <div className="max-w-5xl mx-auto py-20 text-center">
          <SvgIcon name="people" size={48} className="mx-auto mb-4 text-slate-400" />
          <p className="text-base font-black text-slate-700 mb-2">No team data available</p>
          <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
            Upload a Jira export with assignee data from the <a href="/" className="underline font-bold">home page</a>.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell showNav>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 id="tour-header-teams" className="text-2xl font-black text-slate-900 tracking-tight">Team Health Comparison</h1>
            <p className="text-sm text-slate-500 mt-1">
              Side-by-side health scores, workload, and risk signals per team member.
            </p>
            {/* CP3-007: this ranks individuals, not normalized teams — a member who
                estimates story points more conservatively, or takes on larger/harder
                tickets, can show a lower score or higher load without that reflecting
                their actual performance. See docs/product-audit/08-metric-dictionary.md
                CP3-007 for why an automated normalization fix wasn't attempted. */}
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3 max-w-2xl">
              <strong className="font-black">Note:</strong> this compares individuals, not normalized for
              different story-point estimation habits between team members. A member who estimates more
              conservatively, or takes on larger or harder tickets, may show a lower score without that
              reflecting their actual performance — use this as a conversation starter, not a ranking.
            </p>
          </div>
          <button
            type="button"
            onClick={() => exportTeamsToCsv(teams)}
            className="btn-secondary btn-sm shrink-0"
          >
            ↓ Export CSV
          </button>
        </div>

        {/* Summary KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          {[
            { label: 'Team Members',   value: totalMembers,               unit: '',     color: '#2563eb' },
            { label: 'Avg Health',     value: `${avgHealth}/100`,         unit: '',     color: avgColor   },
            { label: 'Healthy',        value: healthyCount,               unit: '',     color: '#16a34a' },
            { label: 'Team At Risk',   value: atRiskCount,                unit: '',     color: '#f59e0b' },
            { label: 'Critical Items', value: totalAtRisk,                unit: '',     color: totalAtRisk > 0 ? '#dc2626' : '#94a3b8' },
          ].map(k => (
            <div key={k.label} className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{k.label}</p>
              <p className="text-xl font-black" style={{ color: k.color }}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Team cards grid */}
        {teams.length > 0 && (
          <section className="mb-8">
            <h2 id="tour-section-teams-1" className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Member Scorecards</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map(t => <TeamCard key={t.assignee} entry={t} />)}
            </div>
          </section>
        )}

        {/* Comparison charts */}
        {teams.length > 1 && (
          <section className="mb-8">
            <h2 id="tour-section-teams-2" className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Comparison Charts</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Health score chart */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Team Health Score</p>
                {teams.map(t => (
                  <CompareBar
                    key={t.assignee}
                    label={t.assignee}
                    value={t.healthScore}
                    maxValue={100}
                    color={teamBandColor(t.band)}
                    unit="/100"
                  />
                ))}
              </div>

              {/* Completion % chart */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Completion %</p>
                {[...teams].sort((a, b) => b.completionPct - a.completionPct).map(t => (
                  <CompareBar
                    key={t.assignee}
                    label={t.assignee}
                    value={t.completionPct}
                    maxValue={100}
                    color={t.completionPct >= 70 ? '#16a34a' : t.completionPct >= 40 ? '#f59e0b' : '#dc2626'}
                    unit="%"
                  />
                ))}
              </div>

              {/* Load distribution chart */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Workload Share</p>
                {[...teams].sort((a, b) => b.loadShare - a.loadShare).map(t => (
                  <CompareBar
                    key={t.assignee}
                    label={t.assignee}
                    value={t.loadShare}
                    maxValue={Math.max(...teams.map(x => x.loadShare), 1)}
                    color={t.loadShare > 35 ? '#dc2626' : t.loadShare > 20 ? '#f59e0b' : '#16a34a'}
                    unit="%"
                  />
                ))}
              </div>

              {/* Critical + blocked chart */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Blocked + Critical Items</p>
                {[...teams].sort((a, b) => (b.blockedCount + b.criticalCount) - (a.blockedCount + a.criticalCount)).map(t => {
                  const risk = t.blockedCount + t.criticalCount;
                  const maxRisk = Math.max(...teams.map(x => x.blockedCount + x.criticalCount), 1);
                  return (
                    <CompareBar
                      key={t.assignee}
                      label={t.assignee}
                      value={risk}
                      maxValue={maxRisk}
                      color={risk > 3 ? '#dc2626' : risk > 0 ? '#f59e0b' : '#16a34a'}
                    />
                  );
                })}
              </div>

            </div>
          </section>
        )}

        {/* Detail table */}
        {teams.length > 0 && (
          <section>
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Detail Table</h2>
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {['Member', 'Score', 'Band', 'Issues', 'Done%', 'Active', 'Blocked', 'Critical', 'SP Done/Total', 'Load%', 'Avg Age'].map(h => (
                        <th key={h} className="py-2.5 px-3 text-[10px] font-black uppercase tracking-wider text-slate-500 text-left whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {teams.map(t => {
                      const color = teamBandColor(t.band);
                      return (
                        <tr key={t.assignee} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-semibold text-slate-800 max-w-[140px] truncate" title={t.assignee}>{t.assignee}</td>
                          <td className="py-2 px-3 font-black" style={{ color }}>{t.healthScore}</td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: teamBandBg(t.band), color }}>{t.band}</span>
                          </td>
                          <td className="py-2 px-3 text-slate-600">{t.totalIssues}</td>
                          <td className="py-2 px-3 font-semibold" style={{ color: t.completionPct >= 70 ? '#16a34a' : t.completionPct >= 40 ? '#f59e0b' : '#dc2626' }}>{t.completionPct}%</td>
                          <td className="py-2 px-3 text-slate-600">{t.activeIssues}</td>
                          <td className="py-2 px-3 font-semibold" style={{ color: t.blockedCount  > 0 ? '#dc2626' : '#94a3b8' }}>{t.blockedCount}</td>
                          <td className="py-2 px-3 font-semibold" style={{ color: t.criticalCount > 0 ? '#dc2626' : '#94a3b8' }}>{t.criticalCount}</td>
                          <td className="py-2 px-3 text-slate-600">{t.storyPoints > 0 ? `${t.doneStoryPoints}/${t.storyPoints}` : '—'}</td>
                          <td className="py-2 px-3 font-semibold" style={{ color: t.loadShare > 35 ? '#dc2626' : t.loadShare > 20 ? '#f59e0b' : '#16a34a' }}>{t.loadShare}%</td>
                          <td className="py-2 px-3 text-slate-600">{t.avgOpenAgeDays !== null ? `${t.avgOpenAgeDays}d` : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

      </div>
    </AppShell>
  );
}
