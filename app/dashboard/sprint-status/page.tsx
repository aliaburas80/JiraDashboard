// @ts-nocheck
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadMetricsWithSource } from '@/lib/storage';
import type { DashboardMetrics, FlowItem } from '@/types/metrics';
import {
  StickyToolbar, ToolbarSpacer,
  PageHeader, SectionCard, PageLoading,
} from '@/components/dashboard/DashboardPageShell';

const DONE_STATUSES = ['done', 'closed', 'resolved'];
const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();

export default function SprintStatusPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await loadMetricsWithSource();
        if (cancelled) return;
        const data = result.metrics as DashboardMetrics | null;
        if (!data) { router.replace('/'); return; }
        setMetrics(data);
      } catch { if (!cancelled) router.replace('/'); }
      finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [router]);

  const flowItems: FlowItem[] = useMemo(() => {
    const raw = metrics?.flow?.items ?? [];
    const seen = new Set<string>();
    return raw.filter(i => { if (seen.has(i.key)) return false; seen.add(i.key); return true; });
  }, [metrics?.flow?.items]);

  const sprintDist = useMemo(() => {
    const map = new Map<string, { total: number; done: number; blocked: number }>();
    flowItems.forEach(i => {
      const s = String(i.sprint ?? 'No Sprint');
      if (!map.has(s)) map.set(s, { total: 0, done: 0, blocked: 0 });
      const entry = map.get(s)!;
      entry.total++;
      if (DONE_STATUSES.includes(norm(i.status))) entry.done++;
      if (norm(i.reason).includes('block')) entry.blocked++;
    });
    return [...map.entries()].map(([name, data]) => ({ name, ...data, completion: data.total > 0 ? Math.round((data.done / data.total) * 100) : 0 }))
      .filter(s => s.name !== 'No Sprint')
      .sort((a, b) => b.name.localeCompare(a.name))
      .slice(0, 10);
  }, [flowItems]);

  if (loading) return <PageLoading />;
  if (!metrics) return null;

  const sprint = metrics.sprint as any;

  if (!sprint) {
    return (
      <>
        <StickyToolbar>
          <ToolbarSpacer />

        </StickyToolbar>
        <PageHeader id="tour-header-sprint-status" title="Sprint Status" subtitle="Sprint health, progress, and delivery patterns." />
        <div style={{ padding: '60px 28px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🏃</div>
          No sprint data detected. Upload a file with Sprint field data to see sprint metrics.
        </div>
      </>
    );
  }

  const sprintItems = flowItems.filter(i => i.sprint);
  const currentSprint = sprint?.current ?? sprintDist[0];
  const blockedInSprint = sprintItems.filter(i => norm(i.reason).includes('block'));

  return (
    <>
      <StickyToolbar>
        <ToolbarSpacer />

      </StickyToolbar>

      <PageHeader
        id="tour-header-sprint-status"
        title="Sprint Status"
        badge={sprint ? 'Active' : 'No Sprint'}
        subtitle="Sprint goal, progress, commitment vs completion, blockers, and risks."
      />

      <div style={{ padding: '0 28px 48px' }}>

        {/* ── Sprint gauges ── */}
        <div id="tour-section-sprint-status-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Sprint Items', value: sprintItems.length, color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
            { label: 'Completed', value: sprintItems.filter(i => DONE_STATUSES.includes(norm(i.status))).length, color: '#059669', bg: '#F0FDF4', border: '#BBF7D0' },
            { label: 'In Progress', value: sprintItems.filter(i => norm(i.status) === 'in progress').length, color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
            { label: 'Blocked', value: blockedInSprint.length, color: blockedInSprint.length > 0 ? '#DC2626' : '#059669', bg: '#FEF2F2', border: '#FECACA' },
          ].map(({ label, value, color, bg, border }) => (
            <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: '14px 16px' }}>
              <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#94A3B8', marginBottom: 4 }}>{label}</p>
              <p style={{ fontSize: 22, fontWeight: 800, fontFamily: 'monospace', color, margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── Sprint velocity ── */}
        {typeof sprint.velocity !== 'undefined' && (
          <SectionCard title="Sprint Velocity">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {[
                { label: 'Velocity', value: sprint.velocity ?? '—' },
                { label: 'Avg Velocity', value: sprint.averageVelocity ?? '—' },
                { label: 'Predictability', value: sprint.predictability ? `${sprint.predictability}%` : '—' },
              ].map(({ label, value }) => (
                <div key={label} style={{ padding: '12px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#94A3B8', marginBottom: 4 }}>{label}</p>
                  <p style={{ fontSize: 20, fontWeight: 800, fontFamily: 'monospace', color: '#0F172A', margin: 0 }}>{value}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* ── Sprint history ── */}
        {sprintDist.length > 0 && (
          <SectionCard title="Sprint Completion History">
            <div id="tour-section-sprint-status-2" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sprintDist.map((s, i) => (
                <div key={s.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                    <span style={{ color: '#334155', fontWeight: i === 0 ? 700 : 400 }}>{s.name}</span>
                    <div style={{ display: 'flex', gap: 12, color: '#64748B' }}>
                      <span>{s.done}/{s.total} done</span>
                      {s.blocked > 0 && <span style={{ color: '#DC2626' }}>{s.blocked} blocked</span>}
                      <strong style={{ color: s.completion >= 70 ? '#059669' : '#D97706', fontFamily: 'monospace' }}>{s.completion}%</strong>
                    </div>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: '#F1F5F9', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 4, background: s.completion >= 70 ? '#059669' : '#D97706', width: `${s.completion}%`, animation: 'barFill 800ms ease-out both', transformOrigin: 'left center', animationDelay: `${i * 70}ms` }} />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* ── Blocked in sprint ── */}
        {blockedInSprint.length > 0 && (
          <SectionCard title={`Sprint Blockers  ·  ${blockedInSprint.length} items`}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    {['Key', 'Summary', 'Sprint', 'Assignee'].map(h => (
                      <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#94A3B8' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {blockedInSprint.slice(0, 20).map((item, i) => (
                    <tr key={item.key ?? i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: 11, color: '#DC2626', fontWeight: 700 }}>{item.key}</td>
                      <td style={{ padding: '7px 10px', color: '#334155', maxWidth: 280 }}>
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.summary}</span>
                      </td>
                      <td style={{ padding: '7px 10px', color: '#64748B', whiteSpace: 'nowrap' }}>{item.sprint ?? '—'}</td>
                      <td style={{ padding: '7px 10px', color: '#64748B' }}>{item.assignee ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}
      </div>
    </>
  );
}
