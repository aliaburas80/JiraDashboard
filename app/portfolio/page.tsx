// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// Cross-team portfolio summary — 9.32
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { loadMetrics } from '@/lib/storage';
import {
  computePortfolioSummary,
  portfolioBandColor,
  type PortfolioSummary,
  type EpicSummary,
  type ProjectSummary,
  type QuarterSummary,
} from '@/lib/portfolioHealth';
import type { DashboardMetrics } from '@/types/metrics';

// ── Mini progress bar ─────────────────────────────────────────────────────────

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
    </div>
  );
}

// ── Health dot ────────────────────────────────────────────────────────────────

function HealthDot({ health }: { health: 'good' | 'warning' | 'critical' }) {
  const clr = health === 'good' ? '#16a34a' : health === 'warning' ? '#f59e0b' : '#dc2626';
  return <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: clr }} />;
}

// ── Epic row ──────────────────────────────────────────────────────────────────

function EpicRow({ epic }: { epic: EpicSummary }) {
  const color = epic.health === 'good' ? '#16a34a' : epic.health === 'warning' ? '#f59e0b' : '#dc2626';
  return (
    <div className="py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-2 mb-1.5">
        <HealthDot health={epic.health} />
        <span className="text-sm font-semibold text-slate-800 flex-1 truncate" title={epic.name}>{epic.name}</span>
        <span className="text-xs font-black shrink-0" style={{ color }}>{epic.progress}%</span>
        <span className="text-[10px] text-slate-400 shrink-0">{epic.completedIssues}/{epic.issues}</span>
      </div>
      <ProgressBar pct={epic.progress} color={color} />
      {(epic.critical > 0 || epic.warning > 0) && (
        <div className="flex gap-2 mt-1.5">
          {epic.critical > 0 && <span className="text-[10px] font-bold text-red-600">{epic.critical} critical</span>}
          {epic.warning  > 0 && <span className="text-[10px] font-bold text-amber-600">{epic.warning} warning</span>}
          {epic.storyPoints > 0 && <span className="text-[10px] text-slate-400 ml-auto">{epic.doneStoryPoints}/{epic.storyPoints} SP</span>}
        </div>
      )}
    </div>
  );
}

// ── Project card ──────────────────────────────────────────────────────────────

function ProjectCard({ project }: { project: ProjectSummary }) {
  const color  = project.health === 'good' ? '#16a34a' : project.health === 'warning' ? '#f59e0b' : '#dc2626';
  const bg     = project.health === 'good' ? '#f0fdf4' : project.health === 'warning' ? '#fffbeb' : '#fef2f2';
  const label  = project.health === 'good' ? 'Healthy' : project.health === 'warning' ? 'At Risk' : 'Behind';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-sm font-black text-slate-900 leading-tight truncate" title={project.name}>{project.name}</p>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: bg, color }}>{label}</span>
      </div>
      <ProgressBar pct={project.completionRate} color={color} />
      <div className="flex justify-between mt-2 text-[10px] text-slate-500 font-semibold">
        <span>{project.done}/{project.issues} done</span>
        <span style={{ color }}>{project.completionRate}%</span>
      </div>
    </div>
  );
}

// ── Quarter bar ───────────────────────────────────────────────────────────────

function QuarterBars({ quarters }: { quarters: QuarterSummary[] }) {
  const maxIssues = Math.max(...quarters.map(q => q.issues), 1);
  return (
    <div className="flex items-end gap-3 h-28 pt-2">
      {quarters.slice(-8).map(q => {
        const h = Math.max(4, Math.round((q.issues / maxIssues) * 100));
        const clr = q.completionRate >= 70 ? '#16a34a' : q.completionRate >= 40 ? '#f59e0b' : '#dc2626';
        return (
          <div key={q.quarter} className="flex flex-col items-center gap-1 flex-1 min-w-0">
            <span className="text-[9px] font-black text-slate-600">{q.issues}</span>
            <div className="w-full flex-1 flex items-end">
              <div className="w-full rounded-t" style={{ height: `${h}%`, background: clr }} title={`${q.completionRate}% complete`} />
            </div>
            <span className="text-[9px] text-slate-500 truncate max-w-full">{q.quarter.replace(/\d{4} /, '')}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [noData,  setNoData]  = useState(false);

  useEffect(() => {
    const metrics = loadMetrics() as DashboardMetrics | null;
    if (!metrics) { setNoData(true); return; }
    setSummary(computePortfolioSummary(metrics));
  }, []);

  if (noData) {
    return (
      <AppShell showNav>
        <div className="max-w-5xl mx-auto py-20 text-center">
          <span className="text-5xl mb-4 block">🗂️</span>
          <p className="text-base font-black text-slate-700 mb-2">No portfolio data available</p>
          <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
            Upload a Jira export from the <a href="/" className="underline font-bold">home page</a> to generate a portfolio summary.
          </p>
        </div>
      </AppShell>
    );
  }

  if (!summary) return null;

  const scoreColor = portfolioBandColor(summary.band);

  return (
    <AppShell showNav>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Portfolio Summary</h1>
          <p className="text-sm text-slate-500 mt-1">
            Cross-team delivery health across all epics, projects, sprints, and quarters.
          </p>
        </div>

        {/* Portfolio score banner */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mb-6 flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-4">
            <div
              className="w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center shrink-0"
              style={{ borderColor: scoreColor }}
            >
              <span className="text-2xl font-black leading-none" style={{ color: scoreColor }}>{summary.portfolioScore}</span>
              <span className="text-[10px] text-slate-400 font-semibold">/100</span>
            </div>
            <div>
              <p className="text-xl font-black" style={{ color: scoreColor }}>{summary.band}</p>
              <p className="text-sm text-slate-500">{summary.completionRate}% complete · {summary.doneStoryPoints}/{summary.totalStoryPoints} SP</p>
            </div>
          </div>
          {summary.insights.length > 0 && (
            <div className="flex-1 min-w-0 border-l border-slate-200 pl-6">
              <ul className="space-y-1">
                {summary.insights.map((ins, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-blue-500 shrink-0 mt-0.5">›</span>
                    {ins}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
          {[
            { label: 'Total Issues',     value: summary.totalIssues,        color: '#2563eb'                                           },
            { label: 'Completion',       value: `${summary.completionRate}%`,color: scoreColor                                         },
            { label: 'Active Epics',     value: summary.activeEpics,        color: '#7c3aed'                                           },
            { label: 'At-Risk Epics',    value: summary.atRiskEpics,        color: summary.atRiskEpics    > 0 ? '#dc2626' : '#94a3b8'  },
            { label: 'Blocked Items',    value: summary.totalBlockedItems,  color: summary.totalBlockedItems > 0 ? '#dc2626' : '#94a3b8'},
            { label: 'Healthy Projects', value: summary.healthyProjects,    color: '#16a34a'                                           },
          ].map(k => (
            <div key={k.label} className="bg-white border border-slate-200 rounded-xl px-3 py-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{k.label}</p>
              <p className="text-xl font-black leading-none" style={{ color: k.color }}>{k.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* Epics panel */}
          {summary.epics.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">
                Epic Progress ({summary.epics.length})
              </h2>
              <div className="max-h-80 overflow-y-auto pr-1">
                {summary.epics.map(e => <EpicRow key={e.name} epic={e} />)}
              </div>
            </div>
          )}

          {/* Projects panel */}
          {summary.projects.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">
                Projects ({summary.projects.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {summary.projects.map(p => <ProjectCard key={p.name} project={p} />)}
              </div>
            </div>
          )}

        </div>

        {/* Quarter throughput */}
        {summary.quarters.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 mb-6">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">
              Quarter Throughput
            </h2>
            <QuarterBars quarters={summary.quarters} />
            <div className="flex gap-4 mt-3 text-[10px] font-semibold text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />≥ 70% complete</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />40–69%</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500   inline-block" />&lt; 40%</span>
            </div>
          </div>
        )}

        {/* Detail comparison table */}
        {summary.epics.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">Epic Detail</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['Epic', 'Status', 'Issues', 'Done', 'Progress', 'SP Done/Total', 'Critical', 'Warning'].map(h => (
                      <th key={h} className="py-2.5 px-3 text-[10px] font-black uppercase tracking-wider text-slate-500 text-left whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.epics.map(e => {
                    const color = e.health === 'good' ? '#16a34a' : e.health === 'warning' ? '#f59e0b' : '#dc2626';
                    return (
                      <tr key={e.name} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-semibold text-slate-800 max-w-[200px] truncate" title={e.name}>{e.name}</td>
                        <td className="py-2 px-3">
                          <span className="flex items-center gap-1.5">
                            <HealthDot health={e.health} />
                            <span className="font-semibold capitalize" style={{ color }}>{e.health}</span>
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600">{e.issues}</td>
                        <td className="py-2 px-3 text-slate-600">{e.completedIssues}</td>
                        <td className="py-2 px-3 font-black" style={{ color }}>{e.progress}%</td>
                        <td className="py-2 px-3 text-slate-600">{e.storyPoints > 0 ? `${e.doneStoryPoints}/${e.storyPoints}` : '—'}</td>
                        <td className="py-2 px-3 font-semibold" style={{ color: e.critical > 0 ? '#dc2626' : '#94a3b8' }}>{e.critical}</td>
                        <td className="py-2 px-3 font-semibold" style={{ color: e.warning  > 0 ? '#f59e0b' : '#94a3b8' }}>{e.warning}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
