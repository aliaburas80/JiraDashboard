// @ts-nocheck
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadMetricsWithSource } from '@/lib/storage';
import type { DashboardMetrics, FlowItem } from '@/types/metrics';
import {
  StickyToolbar, FilterChip, ToolbarSpacer, ToolbarButton, LayoutControl,
  PageHeader, SectionCard, PageLoading,
} from '@/components/dashboard/DashboardPageShell';

const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();

type ActionType = { type: string; icon: string; title: string; detail: string; suggestedOwner: string; status: 'open' | 'resolved' };

export default function SmartActionsPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

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

  const actions: ActionType[] = useMemo(() => {
    if (!metrics) return [];
    const acts: ActionType[] = [];
    const orphans = flowItems.filter(i => i.isOrphan).length;
    const critBlockers = flowItems.filter(i => i.health === 'critical' && norm(i.reason).includes('block'));
    if (critBlockers.length)
      acts.push({ type: 'critical', icon: '🚫', status: 'open',
        title: `Unblock ${critBlockers.length} critical item${critBlockers.length > 1 ? 's' : ''}`,
        detail: `${critBlockers[0].key}: ${(critBlockers[0].summary || (critBlockers[0].reason ?? '')).slice(0, 80)}`,
        suggestedOwner: 'Scrum Master / Delivery Manager' });
    const staleActive = flowItems.filter(i => i.health === 'critical' && norm(i.reason).includes('in progress over 14'));
    if (staleActive.length)
      acts.push({ type: 'critical', icon: '⏳', status: 'open',
        title: `${staleActive.length} item${staleActive.length > 1 ? 's' : ''} stalled in progress`,
        detail: `${staleActive[0].key} has been active for ${Math.round((staleActive[0] as any).activeAgeDays || 0)} days`,
        suggestedOwner: 'Engineering Manager' });
    const capacity = ((metrics?.capacity || []) as any[]);
    const overloaded = capacity.filter((c: any) => c.loadShare > 35);
    if (overloaded.length && capacity.length > 2)
      acts.push({ type: 'warning', icon: '⚖️', status: 'open',
        title: 'Team capacity imbalance detected',
        detail: `${overloaded[0].assignee} carries ${overloaded[0].loadShare}% — consider redistributing`,
        suggestedOwner: 'Engineering Manager' });
    if (orphans > 0)
      acts.push({ type: 'info', icon: '👻', status: 'open',
        title: `Link ${orphans} orphan item${orphans > 1 ? 's' : ''} to epics`,
        detail: 'Items without epic reduce scope traceability and epic completion accuracy',
        suggestedOwner: 'Product Owner' });
    const epics = (metrics?.epics as any[]) ?? [];
    const critEpics = epics.filter((e: any) => (e.critical ?? 0) > 0);
    if (critEpics.length)
      acts.push({ type: 'warning', icon: '🚨', status: 'open',
        title: `${critEpics.length} epic${critEpics.length > 1 ? 's' : ''} in critical state`,
        detail: `${critEpics[0].epic || 'Top epic'}: ${critEpics[0].completion ?? 0}% complete — needs attention`,
        suggestedOwner: 'Engineering Manager' });
    const rels = metrics?.relations as any;
    if (rels?.blockedItems?.length)
      acts.push({ type: 'critical', icon: '🔗', status: 'open',
        title: `${rels.blockedItems.length} item${rels.blockedItems.length > 1 ? 's' : ''} explicitly blocked`,
        detail: `${rels.blockedItems[0].key} is blocked by ${rels.blockedItems[0].blockedBy}`,
        suggestedOwner: 'Scrum Master / Delivery Manager' });
    return acts;
  }, [flowItems, metrics]);

  const filtered = useMemo(() =>
    priorityFilter === 'all' ? actions : actions.filter(a => a.type === priorityFilter),
    [actions, priorityFilter]);

  if (loading) return <PageLoading />;
  if (!metrics) return null;

  const PRIORITY_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
    critical: { bg: '#FEF2F2', border: '#FECACA', text: '#DC2626', badge: '#FEF2F2' },
    warning:  { bg: '#FFFBEB', border: '#FDE68A', text: '#D97706', badge: '#FFFBEB' },
    info:     { bg: '#EFF6FF', border: '#BFDBFE', text: '#2563EB', badge: '#EFF6FF' },
  };

  return (
    <>
      <StickyToolbar>
        <FilterChip label="All" active={priorityFilter === 'all'} onClick={() => setPriorityFilter('all')} />
        <FilterChip label="Critical" active={priorityFilter === 'critical'} onClick={() => setPriorityFilter('critical')} dot={actions.some(a => a.type === 'critical')} />
        <FilterChip label="Warning" active={priorityFilter === 'warning'} onClick={() => setPriorityFilter('warning')} />
        <FilterChip label="Info" active={priorityFilter === 'info'} onClick={() => setPriorityFilter('info')} />
        <FilterChip label="Clear" active={false} onClick={() => setPriorityFilter('all')} />
        <ToolbarSpacer />
        <LayoutControl />
      </StickyToolbar>

      <PageHeader
        title="Smart Actions"
        badge={`${actions.length} recommendations`}
        subtitle="Actionable recommendations to improve delivery health."
      />

      <div style={{ padding: '0 28px 48px' }}>

        {/* ── Summary counts ── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {(['critical', 'warning', 'info'] as const).map(type => {
            const count = actions.filter(a => a.type === type).length;
            if (!count) return null;
            const { bg, border, text } = PRIORITY_COLORS[type];
            return (
              <div key={type} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: '10px 16px', minWidth: 90 }}>
                <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#94A3B8', marginBottom: 4 }}>{type}</p>
                <p style={{ fontSize: 20, fontWeight: 800, fontFamily: 'monospace', color: text, margin: 0 }}>{count}</p>
              </div>
            );
          })}
        </div>

        {/* ── Action list ── */}
        {filtered.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map((action, i) => {
              const colors = PRIORITY_COLORS[action.type] ?? PRIORITY_COLORS.info;
              return (
                <div key={i} style={{
                  background: '#fff', border: `1px solid #E2E8F0`,
                  borderLeft: `4px solid ${colors.text}`,
                  borderRadius: 10, padding: '16px 20px',
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{action.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase',
                        background: colors.badge, color: colors.text,
                      }}>
                        {action.type}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{action.title}</span>
                    </div>
                    <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 10px' }}>{action.detail}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#94A3B8' }}>Suggested owner:</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>{action.suggestedOwner}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
            No {priorityFilter !== 'all' ? priorityFilter + ' ' : ''}actions at this time.
          </div>
        )}
      </div>
    </>
  );
}
