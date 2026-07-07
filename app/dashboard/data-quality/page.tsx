// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadMetricsWithSource } from '@/lib/storage';
import { buildSafeCsv } from '@/lib/exportSafety';
import type { DashboardMetrics } from '@/types/metrics';
import {
  StickyToolbar, FilterChip, ToolbarSpacer, ToolbarButton,
  PageHeader, SectionCard, PageLoading,
} from '@/components/dashboard/DashboardPageShell';

export default function DataQualityPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium'>('all');
  const [circleReady, setCircleReady] = useState(false);

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

  useEffect(() => {
    if (!metrics) return;
    const raf = requestAnimationFrame(() => setCircleReady(true));
    return () => cancelAnimationFrame(raf);
  }, [metrics]);

  if (loading) return <PageLoading />;
  if (!metrics) return null;

  const dq = (metrics as any).dataQuality ?? {};
  const score: number = dq.score ?? 80;
  const issues: any[] = dq.issues ?? [];
  const missingFields: any[] = dq.missingFields ?? [];

  const classification =
    score >= 90 ? { label: 'Excellent', color: '#059669', bg: '#F0FDF4', border: '#BBF7D0' }
    : score >= 75 ? { label: 'Good', color: '#0891B2', bg: '#F0F9FF', border: '#BAE6FD' }
    : score >= 60 ? { label: 'Moderate', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' }
    : { label: 'Poor', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' };

  const CIRC = 40.84;
  const filled = (score / 100) * CIRC;
  const gap = CIRC - filled;
  const dash = `${filled.toFixed(1)} ${gap.toFixed(1)}`;

  const builtInIssues = [
    {
      severity: 'critical', field: 'Done Date / Resolution Date',
      count: (metrics as any).missingDoneDate ?? 0,
      total: metrics.totalIssues ?? 0,
      impact: 'Lead Time is unavailable for completed items.',
    },
    {
      severity: 'high', field: 'Story Points',
      count: (metrics as any).missingStoryPoints ?? 0,
      total: metrics.totalIssues ?? 0,
      impact: 'Story Points KPI undercounts effort.',
    },
    {
      severity: 'high', field: 'In Progress Date',
      count: (metrics as any).missingInProgressDate ?? 0,
      total: metrics.totalIssues ?? 0,
      impact: 'Cycle Time is approximated for affected items.',
    },
    {
      severity: 'high', field: 'Epic Link / Parent Key',
      count: (metrics.flow?.items ?? []).filter((i: any) => i.isOrphan).length,
      total: metrics.totalIssues ?? 0,
      impact: 'Items appear as orphans — scope traceability reduced.',
    },
    {
      severity: 'medium', field: 'Assignee',
      count: (metrics as any).missingAssignee ?? 0,
      total: metrics.totalIssues ?? 0,
      impact: 'Workload distribution appears skewed.',
    },
  ].filter(i => i.count > 0);

  const displayIssues = builtInIssues.length > 0 ? builtInIssues : issues;
  const filteredIssues = severityFilter === 'all' ? displayIssues : displayIssues.filter(i => i.severity === severityFilter);

  const SEVERITY_COLORS: Record<string, { bg: string; border: string; dot: string; label: string }> = {
    critical: { bg: '#FEF2F2', border: '#FECACA', dot: '#DC2626', label: 'Critical' },
    high: { bg: '#FFFBEB', border: '#FDE68A', dot: '#D97706', label: 'High' },
    medium: { bg: '#EFF6FF', border: '#BFDBFE', dot: '#2563EB', label: 'Medium' },
    low: { bg: '#F0FDF4', border: '#BBF7D0', dot: '#059669', label: 'Low' },
  };

  const exportCSV = () => {
    const cols = ['Field', 'Severity', 'Count', 'Impact'];
    const csv = buildSafeCsv([cols, ...filteredIssues.map(i => [i.field, i.severity, i.count, i.impact])], { alwaysQuote: true });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'data-quality.csv'; a.click();
  };

  return (
    <>
      <StickyToolbar>
        <FilterChip label="All" active={severityFilter === 'all'} onClick={() => setSeverityFilter('all')} />
        <FilterChip label="Critical" active={severityFilter === 'critical'} onClick={() => setSeverityFilter('critical')} dot={displayIssues.some(i => i.severity === 'critical')} />
        <FilterChip label="High" active={severityFilter === 'high'} onClick={() => setSeverityFilter('high')} />
        <FilterChip label="Medium" active={severityFilter === 'medium'} onClick={() => setSeverityFilter('medium')} />
        <FilterChip label="Clear" active={false} onClick={() => setSeverityFilter('all')} />
        <ToolbarSpacer />
        <ToolbarButton label="Export" onClick={exportCSV} />

      </StickyToolbar>

      <PageHeader
        title="Data Quality"
        badge={`${displayIssues.length} issues found`}
        subtitle="Field confidence, missing data impact, and remediation guidance."
      />

      <div style={{ padding: '0 28px 48px' }}>

        {/* ── Score block ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 24px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, marginBottom: 20 }}>
          {/* Circular score */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <svg width={72} height={72} viewBox="0 0 18 18">
              <circle cx="9" cy="9" r="6.5" fill="none" stroke={classification.border} strokeWidth="2.5" />
              <circle cx="9" cy="9" r="6.5" fill="none" stroke={classification.color} strokeWidth="2.5"
                strokeDasharray={dash} strokeDashoffset={circleReady ? 10 : dash} strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(0.4,0,0.2,1)', transformOrigin: 'center', transform: 'rotate(-90deg)' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 800, color: classification.color, lineHeight: 1 }}>{score}</span>
              <span style={{ fontSize: 9, color: '#94A3B8' }}>/100</span>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>Data Quality</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 5, background: classification.bg, color: classification.color, border: `1px solid ${classification.border}` }}>
                {classification.label}
              </span>
            </div>
            <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>
              Your file quality score is {score}%. Metrics are {score >= 75 ? 'highly reliable' : score >= 60 ? 'moderately reliable' : 'less reliable'}.
              {displayIssues.length > 0 && ` ${displayIssues.length} field issue${displayIssues.length > 1 ? 's' : ''} detected.`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {[
              { sev: 'critical', count: displayIssues.filter(i => i.severity === 'critical').length },
              { sev: 'high',     count: displayIssues.filter(i => i.severity === 'high').length },
              { sev: 'medium',   count: displayIssues.filter(i => i.severity === 'medium').length },
            ].filter(s => s.count > 0).map(({ sev, count }) => {
              const c = SEVERITY_COLORS[sev];
              return (
                <div key={sev} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 6, padding: '6px 10px', textAlign: 'center' }}>
                  <p style={{ fontSize: 16, fontWeight: 800, fontFamily: 'monospace', color: c.dot, margin: 0 }}>{count}</p>
                  <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: c.dot, margin: 0 }}>{c.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Missing column impact ── */}
        {filteredIssues.length > 0 && (
          <SectionCard title="Missing Column Impact">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {filteredIssues.map((issue, i) => {
                const sev = SEVERITY_COLORS[issue.severity] ?? SEVERITY_COLORS.low;
                const pct = issue.total > 0 ? Math.round((issue.count / issue.total) * 100) : 0;
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 0',
                    borderBottom: i < filteredIssues.length - 1 ? '1px solid #F1F5F9' : 'none',
                  }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: sev.dot, flexShrink: 0, marginTop: 3 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{issue.field}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: sev.bg, color: sev.dot, border: `1px solid ${sev.border}` }}>
                          {issue.severity}
                        </span>
                        {issue.count > 0 && (
                          <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 'auto' }}>
                            {issue.count.toLocaleString()} of {(issue.total ?? 0).toLocaleString()} items ({pct}%)
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: '#DC2626', margin: 0 }}>{issue.impact}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        )}

        {filteredIssues.length === 0 && (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
            No {severityFilter !== 'all' ? severityFilter + ' ' : ''}data quality issues found.
          </div>
        )}
      </div>
    </>
  );
}
