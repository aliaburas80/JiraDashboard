// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import KpiCard from '@/components/ui/KpiCard';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import LoadingState from '@/components/ui/LoadingState';
import type { DashboardMetrics } from '@/types/metrics';
import { getHealthBand, HEALTH_COLORS, formatDays, cn } from '@/lib/utils';

const HEALTH_VARIANT: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'neutral'> = {
  excellent: 'success',
  good: 'info',
  moderate: 'warning',
  'at-risk': 'danger',
  critical: 'danger',
};

const FLOW_STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  good: 'success',
  warning: 'warning',
  critical: 'danger',
};

export default function DashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('dc_metrics');
      if (!raw) { router.replace('/'); return; }
      const parsed = JSON.parse(raw) as DashboardMetrics;
      setMetrics(parsed);
    } catch {
      router.replace('/');
    } finally {
      setLoading(false);
    }
  }, [router]);

  if (loading) return <AppShell showNav><LoadingState message="Loading dashboard…" /></AppShell>;
  if (!metrics) return null;

  const band = getHealthBand(metrics.healthScore);
  const healthColor = HEALTH_COLORS[band];

  // Donut segments: Done / Active / AtRisk / Critical / Backlog
  const total = Math.max(metrics.totalIssues, 1);
  const donePct   = Math.round((metrics.doneIssues / total) * 100);
  const activePct = Math.round((metrics.activeIssues / total) * 100);
  const critPct   = Math.round((metrics.flow.critical / total) * 100);
  const warnPct   = Math.round((metrics.flow.warning / total) * 100);
  const backlogPct = Math.max(0, 100 - donePct - activePct - critPct - warnPct);

  let cursor = 0;
  function seg(pct: number, color: string): string {
    const s = `${color} ${cursor}%`;
    cursor += pct;
    return `${s} ${cursor}%`;
  }
  const donut = `conic-gradient(${[
    seg(donePct,    '#16a34a'),
    seg(activePct,  '#2563eb'),
    seg(warnPct,    '#d97706'),
    seg(critPct,    '#dc2626'),
    seg(backlogPct, '#e2e8f0'),
  ].join(', ')})`;

  const maxLoad = Math.max(...metrics.capacity.map(c => c.loadShare), 1);
  const maxSprint = Math.max(...(metrics.sprint.sprints ?? []).map(s => s.completionRate), 1);

  const criticalItems = metrics.flow.items
    .filter(i => i.health === 'critical')
    .slice(0, 3);

  const flowTableItems = metrics.flow.items.slice(0, 20);

  return (
    <AppShell showNav>
      {/* 1. Page header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Full Delivery Report</h1>
          <span
            className="inline-flex items-center gap-1.5 text-xs font-bold rounded-full px-3 py-1 border"
            style={{ color: healthColor, borderColor: healthColor, background: healthColor + '15' }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: healthColor }} />
            Health {metrics.healthScore} — {band.charAt(0).toUpperCase() + band.slice(1)}
          </span>
        </div>
        <button
          onClick={() => router.push('/')}
          className="text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg px-4 py-2 transition-colors"
        >
          Upload new file
        </button>
      </div>

      {/* 2. KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <KpiCard label="Completion" value={`${metrics.completionRate}%`} detail={`${metrics.doneIssues} / ${metrics.totalIssues} issues`} accent="#16a34a" />
        <KpiCard label="Health Alerts" value={metrics.flow.critical + metrics.flow.warning} detail={`${metrics.flow.critical} critical · ${metrics.flow.warning} warning`} accent="#dc2626" />
        <KpiCard label="Active Work" value={metrics.activeIssues} detail={`${metrics.blockedIssues} blocked`} accent="#2563eb" />
        <KpiCard label="Lead Time" value={formatDays(metrics.flow.averageLeadTimeDays)} detail={`${metrics.flow.leadTimeSampleSize} samples`} accent="#7c3aed" />
        <KpiCard label="Cycle Time" value={formatDays(metrics.flow.averageCycleTimeDays)} detail={`${metrics.flow.cycleTimeSampleSize} samples`} accent="#0f766e" />
        <KpiCard label="Story Points" value={`${metrics.storyPoints.completedStoryPoints} / ${metrics.storyPoints.totalStoryPoints}`} detail={`${metrics.storyPoints.pointCompletionRate}% complete`} accent="#d97706" />
      </div>

      {/* 3. Summary bar */}
      <Card className="flex flex-wrap items-center gap-4 px-5 py-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</span>
          <Badge
            label={band.charAt(0).toUpperCase() + band.slice(1)}
            variant={HEALTH_VARIANT[band]}
          />
        </div>
        <div className="h-4 w-px bg-slate-200" />
        {metrics.prediction.predictedDate ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Predicted done</span>
            <span className="text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-0.5">
              {metrics.prediction.predictedDate}
            </span>
          </div>
        ) : metrics.prediction.complete ? (
          <Badge label="All issues complete" variant="success" />
        ) : (
          <Badge label="Insufficient data for prediction" variant="neutral" />
        )}
        <div className="h-4 w-px bg-slate-200" />
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Story points</span>
          <span className="text-xs font-semibold text-slate-700">
            {metrics.storyPoints.completedStoryPoints} done · {metrics.storyPoints.remainingStoryPoints} remaining
          </span>
        </div>
      </Card>

      {/* 4. Smart recommendations */}
      {criticalItems.length > 0 && (
        <Card className="p-5 mb-6">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-700 mb-3">Critical Items Requiring Attention</h2>
          <ul className="space-y-2">
            {criticalItems.map(item => (
              <li key={item.key} className="flex flex-wrap items-start gap-2 text-sm">
                <span className="font-mono font-bold text-blue-700 shrink-0">{item.key}</span>
                <span className="text-slate-700 flex-1 min-w-0 truncate">{item.summary}</span>
                <Badge label={item.status} variant="danger" />
                <span className="text-xs text-slate-500 hidden sm:block">{item.reason}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* 5 + 6 + 7: Composition, Sprint velocity, Team capacity — 3-col grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

        {/* 5. Delivery Composition donut */}
        <Card className="p-5 flex flex-col items-center">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-700 mb-4 self-start">Delivery Composition</h2>
          <div
            className="w-36 h-36 rounded-full mb-4 shrink-0"
            style={{ background: donut }}
            role="img"
            aria-label="Delivery composition donut chart"
          >
            <div className="w-full h-full rounded-full flex items-center justify-center" style={{ background: 'radial-gradient(circle, white 55%, transparent 55%)' }}>
              <span className="text-xl font-black text-slate-900">{metrics.completionRate}%</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs w-full">
            {[
              { label: 'Done',    color: '#16a34a', pct: donePct },
              { label: 'Active',  color: '#2563eb', pct: activePct },
              { label: 'At Risk', color: '#d97706', pct: warnPct },
              { label: 'Critical',color: '#dc2626', pct: critPct },
              { label: 'Backlog', color: '#94a3b8', pct: backlogPct },
            ].map(({ label, color, pct }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                <span className="text-slate-600">{label}</span>
                <span className="font-bold text-slate-800 ml-auto">{pct}%</span>
              </div>
            ))}
          </div>
        </Card>

        {/* 6. Sprint velocity */}
        <Card className="p-5">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-700 mb-4">Sprint Velocity</h2>
          {metrics.sprint.hasSprintData ? (
            <div className="space-y-2.5">
              {metrics.sprint.sprints.slice(0, 6).map(s => (
                <div key={s.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 truncate max-w-[60%]" title={s.name}>{s.name}</span>
                    <span className="font-bold text-slate-800">{s.completionRate}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{ width: `${(s.completionRate / Math.max(maxSprint, 100)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">No sprint data found in this export.</p>
          )}
        </Card>

        {/* 7. Team capacity */}
        <Card className="p-5">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-700 mb-4">Team Capacity</h2>
          {metrics.capacity.length ? (
            <div className="space-y-2.5">
              {metrics.capacity.slice(0, 6).map(c => (
                <div key={c.assignee}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 truncate max-w-[60%]" title={c.assignee}>{c.assignee}</span>
                    <span className="font-bold text-slate-800">{c.loadShare}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-teal-500 transition-all"
                      style={{ width: `${(c.loadShare / maxLoad) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">No assignee data found.</p>
          )}
        </Card>
      </div>

      {/* 8. Key insights */}
      {metrics.insights.length > 0 && (
        <Card className="p-5 mb-6">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-700 mb-3">Key Insights</h2>
          <ul className="space-y-1.5">
            {metrics.insights.map((insight, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                {insight}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* 9. Flow table */}
      <Card className="mb-8 overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-700">Flow Detail</h2>
          <p className="text-xs text-slate-500 mt-0.5">Showing top {flowTableItems.length} items sorted by health severity</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-slate-200 bg-slate-50">
                {['Key', 'Summary', 'Status', 'Health', 'Reason'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {flowTableItems.map((item, idx) => (
                <tr
                  key={item.key}
                  className={cn('border-t border-slate-100', idx % 2 === 1 && 'bg-slate-50/50')}
                >
                  <td className="px-4 py-2.5 font-mono font-bold text-blue-700 whitespace-nowrap">{item.key}</td>
                  <td className="px-4 py-2.5 text-slate-700 max-w-xs truncate" title={item.summary}>{item.summary}</td>
                  <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{item.status}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <Badge
                      label={item.health.charAt(0).toUpperCase() + item.health.slice(1)}
                      variant={FLOW_STATUS_VARIANT[item.health] ?? 'neutral'}
                    />
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 text-xs max-w-xs truncate" title={item.reason}>{item.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 10. Back to Upload */}
      <div className="flex justify-center pb-4">
        <button
          onClick={() => router.push('/')}
          className="text-sm font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg px-6 py-2.5 shadow-sm transition-colors"
        >
          Back to Upload
        </button>
      </div>
    </AppShell>
  );
}
