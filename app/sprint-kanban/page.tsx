'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import DCKpiCard from '@/components/dc-shell/DCKpiCard';
import DCStatusChip from '@/components/dc-shell/DCStatusChip';
import LoadingState from '@/components/ui/LoadingState';
import type { DashboardMetrics } from '@/types/metrics';
import { loadMetricsWithSource } from '@/lib/storage';

const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();

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

  if (loading) return <AppShell showNav><LoadingState message="Loading sprint & kanban data…" /></AppShell>;
  if (!metrics) return null;

  const sprint = metrics.sprint;
  const kanban = (metrics.kanban as any) ?? {};
  const hasSprintData = sprint?.hasSprintData && sprint.sprints?.length > 0;

  // Throughput from sprint data
  const sprints   = sprint?.sprints ?? [];
  const lastSprint = sprints[sprints.length - 1];
  const avgVelocity = sprints.length > 0
    ? Math.round(sprints.reduce((s: number, sp: any) => s + (sp.completedIssues ?? 0), 0) / sprints.length)
    : 0;
  const avgPoints = sprints.length > 0
    ? Math.round(sprints.reduce((s: number, sp: any) => s + (sp.completedPoints ?? 0), 0) / sprints.length)
    : 0;

  // Kanban board health from byStatus
  const byStatus = (kanban.byStatus ?? []) as any[];
  const maxCount  = Math.max(...byStatus.map((s: any) => s.count ?? 0), 1);

  const STATUS_COLORS: Record<string, string> = {
    'in progress':   'var(--dc-info)',
    'code review':   'var(--dc-purple)',
    'qa':            'var(--dc-warning)',
    'testing':       'var(--dc-warning)',
    'uat':           'var(--dc-warning)',
    'done':          'var(--dc-success)',
    'closed':        'var(--dc-success)',
    'resolved':      'var(--dc-success)',
    'to do':         'var(--dc-text-3)',
    'backlog':       'var(--dc-text-3)',
  };

  return (
    <AppShell showNav>
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ width: 20, height: 2, background: 'var(--blue)', display: 'inline-block' }} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--blue)', textTransform: 'uppercase' }}>Delivery</span>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--n900)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Sprint & Kanban</h1>
        <p style={{ fontSize: 13, color: 'var(--n500)', margin: '0 0 12px' }}>
          {hasSprintData
            ? `${sprint.sprintCount} sprint${sprint.sprintCount !== 1 ? 's' : ''} detected. Average velocity: ${avgVelocity} issues · ${avgPoints} points per sprint.`
            : 'No sprint data found in this export. Showing Kanban analytics as primary delivery view.'}
        </p>
        <DCStatusChip
          label={hasSprintData ? `${sprint.sprintCount} Sprints` : 'Kanban Mode'}
          tone={hasSprintData ? 'info' : 'neutral'}
          size="md"
        />
      </div>

      {/* No sprint data banner */}
      {!hasSprintData && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
          background: 'var(--dc-surface-blue)', border: '1px solid rgba(37,99,235,0.2)',
          borderRadius: 14, padding: '14px 18px',
        }} role="status">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--dc-brand)" strokeWidth="2" style={{ flexShrink: 0 }} aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--dc-text-2)', margin: 0 }}>
            <strong style={{ color: 'var(--dc-text)' }}>No sprint data found</strong> in this export. Kanban analytics are shown as the primary delivery view.
          </p>
        </div>
      )}

      {/* KPI strip */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }} aria-label="Sprint & Kanban metrics">
        <DCKpiCard label="Sprints" value={sprint.sprintCount ?? 0} subtitle={hasSprintData ? `${avgVelocity} avg issues/sprint` : 'No sprint data'} tone={hasSprintData ? 'info' : 'neutral'} />
        <DCKpiCard label="Avg Velocity" value={avgVelocity || '—'} subtitle={avgPoints > 0 ? `${avgPoints} avg pts/sprint` : 'Issues per sprint'} tone={avgVelocity > 0 ? 'success' : 'neutral'} />
        <DCKpiCard label="Active Issues" value={metrics.activeIssues ?? 0} subtitle="In Progress, Review, QA" tone={(metrics.activeIssues ?? 0) > 15 ? 'warning' : 'success'} />
        <DCKpiCard label="Board Columns" value={byStatus.length} subtitle="Active workflow stages" tone="info" />
      </section>

      {/* Two-column content */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) 300px', gap: 20 }}>

        {/* Left: Throughput chart OR Kanban board */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {hasSprintData ? (
            <div className="dc-card" style={{ padding: 22 }}>
              <h2 style={{ fontSize: 15, fontWeight: 900, color: 'var(--dc-text)', margin: '0 0 18px' }}>Sprint Throughput</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {sprints.map((sp: any, i: number) => {
                  const completePct = sp.committedPoints > 0
                    ? Math.round((sp.completedPoints / sp.committedPoints) * 100)
                    : sp.issues > 0 ? Math.round((sp.completedIssues / sp.issues) * 100) : 0;
                  const isLast = i === sprints.length - 1;
                  return (
                    <div key={sp.name || i} style={{ padding: '12px 14px', borderRadius: 12, background: isLast ? 'var(--dc-brand-soft)' : 'var(--dc-surface-soft)', border: `1px solid ${isLast ? 'rgba(37,99,235,0.2)' : 'var(--dc-line)'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--dc-text)' }}>{sp.name || `Sprint ${i + 1}`}</span>
                          {isLast && <DCStatusChip label="Latest" tone="info" />}
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 900, color: completePct >= 80 ? 'var(--dc-success)' : completePct >= 50 ? 'var(--dc-warning)' : 'var(--dc-critical)' }}>
                          {completePct}%
                        </span>
                      </div>
                      <div style={{ height: 8, background: 'var(--dc-line)', borderRadius: 4, marginBottom: 8 }}>
                        <div style={{ width: `${completePct}%`, height: '100%', background: completePct >= 80 ? 'var(--dc-success)' : completePct >= 50 ? 'var(--dc-warning)' : 'var(--dc-critical)', borderRadius: 4, transition: 'width 600ms ease-out' }} />
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--dc-text-2)', fontWeight: 600 }}>
                        <span>{sp.completedIssues ?? 0} / {sp.issues ?? 0} issues</span>
                        {sp.committedPoints > 0 && <span>{sp.completedPoints ?? 0} / {sp.committedPoints} pts</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="dc-card" style={{ padding: 22 }}>
              <h2 style={{ fontSize: 15, fontWeight: 900, color: 'var(--dc-text)', margin: '0 0 4px' }}>Kanban Board Health</h2>
              <p style={{ fontSize: 12, color: 'var(--dc-text-2)', margin: '0 0 18px' }}>Work distribution across stages</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {byStatus.map((s: any, i: number) => {
                  const pct = Math.round((s.count / maxCount) * 100);
                  const color = STATUS_COLORS[norm(s.status)] ?? 'var(--dc-text-3)';
                  return (
                    <div key={s.status || i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--dc-text)', textTransform: 'capitalize' }}>{s.status}</span>
                        <span style={{ fontSize: 13, fontWeight: 900, color }}>{s.count}</span>
                      </div>
                      <div style={{ height: 10, background: 'var(--dc-line)', borderRadius: 5 }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 5, transition: 'width 600ms ease-out' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Board health summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="dc-card" style={{ padding: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 900, color: 'var(--dc-text)', margin: '0 0 14px' }}>Board Health</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Total issues', value: metrics.totalIssues ?? 0, tone: 'neutral' as const },
                { label: 'Done / Closed', value: metrics.doneIssues ?? 0, tone: 'success' as const },
                { label: 'Active WIP', value: metrics.activeIssues ?? 0, tone: 'info' as const },
                { label: 'Blocked', value: metrics.blockedIssues ?? 0, tone: (metrics.blockedIssues ?? 0) > 0 ? 'critical' as const : 'neutral' as const },
                { label: 'Open defects', value: metrics.openDefects ?? 0, tone: (metrics.openDefects ?? 0) > 5 ? 'warning' as const : 'neutral' as const },
              ].map(row => (
                <div key={row.label} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 12px', borderRadius: 10,
                  background: 'var(--dc-surface-soft)', border: '1px solid var(--dc-line)',
                }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--dc-text-2)' }}>{row.label}</span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: row.tone === 'critical' ? 'var(--dc-critical)' : row.tone === 'warning' ? 'var(--dc-warning)' : row.tone === 'success' ? 'var(--dc-success)' : row.tone === 'info' ? 'var(--dc-info)' : 'var(--dc-text)' }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {lastSprint && hasSprintData && (
            <div className="dc-card" style={{ padding: 20 }}>
              <h2 style={{ fontSize: 14, fontWeight: 900, color: 'var(--dc-text)', margin: '0 0 12px' }}>Latest Sprint</h2>
              <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--dc-brand)', margin: '0 0 10px' }}>{lastSprint.name}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--dc-text-2)', fontWeight: 600 }}>Issues done</span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--dc-text)' }}>{lastSprint.completedIssues} / {lastSprint.issues}</span>
                </div>
                {lastSprint.committedPoints > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--dc-text-2)', fontWeight: 600 }}>Points</span>
                    <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--dc-text)' }}>{lastSprint.completedPoints} / {lastSprint.committedPoints}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--dc-text-2)', fontWeight: 600 }}>Completion</span>
                  <span style={{
                    fontSize: 13, fontWeight: 900,
                    color: (lastSprint.completionRate ?? 0) >= 80 ? 'var(--dc-success)' : (lastSprint.completionRate ?? 0) >= 50 ? 'var(--dc-warning)' : 'var(--dc-critical)',
                  }}>
                    {lastSprint.completionRate ?? 0}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
