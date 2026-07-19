// @ts-nocheck
'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboardMetrics } from '@/components/dashboard/DashboardMetricsContext';
import { buildSafeCsv } from '@/lib/exportSafety';
import type { FlowItem } from '@/types/metrics';
import MetricConfidenceBadge from '@/components/ui/MetricConfidenceBadge';
import {
  StickyToolbar, FilterChip, ToolbarSpacer, ToolbarButton,
  PageHeader, SectionCard, PageLoading,
} from '@/components/dashboard/DashboardPageShell';
import styles from './page.module.scss';

// STYLE-03 (2026-07-19): converted from inline styles to SCSS Module — see
// page.module.scss for the token mapping notes. No behavior change.

type CSSVariableProperties = CSSProperties & Record<`--${string}`, string | number>;

const DONE_STATUSES = ['done', 'closed', 'resolved'];
const ACTIVE_STATUSES = ['in progress', 'code review', 'qa', 'testing', 'uat'];
const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();

function bandFor(score: number): 'excellent' | 'good' | 'moderate' | 'poor' {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'moderate';
  return 'poor';
}

const BAND_LABEL: Record<string, string> = {
  excellent: 'Excellent', good: 'Good', moderate: 'Moderate', poor: 'Poor',
};

// Segment color tokens keyed by semantic bucket — used both for the legend
// dots (via data-segment, in CSS) and the donut's conic-gradient (built here
// since the gradient itself must be one runtime-computed CSS value).
const SEGMENT_TOKENS: Record<string, string> = {
  done: 'var(--color-success)',
  active: 'var(--color-info)',
  warning: 'var(--color-warning)',
  critical: 'var(--color-danger)',
  other: 'var(--dc-s4)',
};

export default function DataQualityPage() {
  const router = useRouter();
  const { metrics, loading } = useDashboardMetrics();
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium'>('all');
  const [circleReady, setCircleReady] = useState(false);

  useEffect(() => {
    if (!loading && !metrics) router.replace('/');
  }, [loading, metrics, router]);

  useEffect(() => {
    if (!metrics) return;
    const raf = requestAnimationFrame(() => setCircleReady(true));
    return () => cancelAnimationFrame(raf);
  }, [metrics]);

  const flowItems: FlowItem[] = useMemo(() => {
    const raw = metrics?.flow?.items ?? [];
    const seen = new Set<string>();
    return raw.filter(i => { if (seen.has(i.key)) return false; seen.add(i.key); return true; });
  }, [metrics?.flow?.items]);

  if (loading) return <PageLoading />;
  if (!metrics) return null;

  const dq = (metrics as any).dataQuality ?? {};
  const score: number = dq.score ?? 80;
  const issues: any[] = dq.issues ?? [];

  const band = bandFor(score);

  const CIRC = 40.84;
  const filled = (score / 100) * CIRC;
  const gap = CIRC - filled;
  const dash = `${filled.toFixed(1)} ${gap.toFixed(1)}`;

  const totalIssues = Math.max(metrics.totalIssues, 1);
  const storyPoints = metrics.storyPoints;
  const doneBucket   = flowItems.filter(i => DONE_STATUSES.includes(norm(i.status))).length;
  const critBucket   = flowItems.filter(i => !DONE_STATUSES.includes(norm(i.status)) && norm(i.health) === 'critical').length;
  const warnBucket   = flowItems.filter(i => !DONE_STATUSES.includes(norm(i.status)) && norm(i.health) === 'warning').length;
  const activeBucket = flowItems.filter(i => ACTIVE_STATUSES.includes(norm(i.status)) && !DONE_STATUSES.includes(norm(i.status)) && norm(i.health) !== 'critical' && norm(i.health) !== 'warning').length;
  const otherBucket  = Math.max(totalIssues - doneBucket - critBucket - warnBucket - activeBucket, 0);
  const orphanCount  = flowItems.filter(i => i.isOrphan).length;

  const segments = [
    { key: 'done',     label: 'Done',           value: doneBucket },
    { key: 'active',   label: 'In Progress',    value: activeBucket },
    { key: 'warning',  label: 'At Risk',        value: warnBucket },
    { key: 'critical', label: 'Critical',       value: critBucket },
    { key: 'other',    label: 'Backlog / Other', value: otherBucket },
  ].filter(s => s.value > 0);

  const segTotal = Math.max(segments.reduce((a, s) => a + s.value, 0), 1);
  let cursor = 0;
  const donutBg = `conic-gradient(${segments.map(s => {
    const st = cursor;
    cursor += (s.value / segTotal) * 100;
    return `${SEGMENT_TOKENS[s.key]} ${st}% ${cursor}%`;
  }).join(', ')})`;
  // EXCEPTION (CLAUDE.md Rule 1): the gradient is composed from a
  // data-dependent number of segments with runtime stop percentages — see
  // page.module.scss's .donutRing comment. All color stops above are
  // var(--token) references, not raw hex.
  const donutVars: CSSVariableProperties = { '--donut-bg': donutBg };

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

  const exportCSV = () => {
    const cols = ['Field', 'Severity', 'Count', 'Impact'];
    const csv = buildSafeCsv([cols, ...filteredIssues.map(i => [i.field, i.severity, i.count, i.impact])], { alwaysQuote: true });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'data-quality.csv'; a.click();
  };

  const severityStats = [
    { sev: 'critical', count: displayIssues.filter(i => i.severity === 'critical').length },
    { sev: 'high',     count: displayIssues.filter(i => i.severity === 'high').length },
    { sev: 'medium',   count: displayIssues.filter(i => i.severity === 'medium').length },
  ].filter(s => s.count > 0);

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
        id="tour-header-dashboard-data-quality"
        title="Data Quality & Composition"
        badge={`${displayIssues.length} issues found`}
        subtitle="Field confidence, missing data impact, and how the current work breaks down."
      />

      <div className={styles.page}>

        {/* ── Score block ── */}
        <div id="tour-section-dashboard-data-quality-1" className={styles.scoreBlock}>
          {/* Circular score */}
          <div className={styles.scoreRingWrap}>
            <svg width={72} height={72} viewBox="0 0 18 18">
              <circle cx="9" cy="9" r="6.5" className={styles.scoreRingTrack} />
              <circle
                cx="9" cy="9" r="6.5" className={styles.scoreRingArc} data-band={band}
                strokeDasharray={dash} strokeDashoffset={circleReady ? 10 : dash}
              />
            </svg>
            <div className={styles.scoreRingLabel}>
              <span className={styles.scoreValue} data-band={band}>{score}</span>
              <span className={styles.scoreMax}>/100</span>
            </div>
          </div>
          <div className={styles.scoreDetail}>
            <div className={styles.scoreHeaderRow}>
              <span className={styles.scoreTitle}>Data Quality Score</span>
              <span className={styles.bandChip} data-band={band}>
                {BAND_LABEL[band]}
              </span>
              {/* CP3-017: sample-size reliability, distinct from the field-completeness score itself. */}
              {metrics.confidence?.dataQuality && (
                <MetricConfidenceBadge confidence={metrics.confidence.dataQuality} size="sm" showLabel />
              )}
            </div>
            <p className={styles.scoreSummary}>
              Your file quality score is {score}%. Metrics are {score >= 75 ? 'highly reliable' : score >= 60 ? 'moderately reliable' : 'less reliable'}.
              {displayIssues.length > 0 && ` ${displayIssues.length} field issue${displayIssues.length > 1 ? 's' : ''} detected.`}
            </p>
          </div>
          <div className={styles.severityStats}>
            {severityStats.map(({ sev, count }) => (
              <div key={sev} className={styles.severityStat} data-severity={sev}>
                <p className={styles.severityStatCount}>{count}</p>
                <p className={styles.severityStatLabel}>{sev}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Missing column impact ── */}
        {filteredIssues.length > 0 && (
          <SectionCard title="Missing Column Impact">
            <div className={styles.issueList}>
              {filteredIssues.map((issue, i) => {
                const pct = issue.total > 0 ? Math.round((issue.count / issue.total) * 100) : 0;
                return (
                  <div key={i} id={i === 0 ? 'tour-section-dashboard-data-quality-2' : undefined} className={styles.issueRow}>
                    <div className={styles.issueDot} data-severity={issue.severity} />
                    <div className={styles.issueBody}>
                      <div className={styles.issueHeadRow}>
                        <span className={styles.issueField}>{issue.field}</span>
                        <span className={styles.severityBadge} data-severity={issue.severity}>
                          {issue.severity}
                        </span>
                        {issue.count > 0 && (
                          <span className={styles.issueCount}>
                            {issue.count.toLocaleString()} of {(issue.total ?? 0).toLocaleString()} items ({pct}%)
                          </span>
                        )}
                      </div>
                      <p className={styles.issueImpact}>{issue.impact}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        )}

        {filteredIssues.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>✅</div>
            No {severityFilter !== 'all' ? severityFilter + ' ' : ''}data quality issues found.
          </div>
        )}

        {/* ── Delivery composition ── */}
        <SectionCard title="Delivery Composition">
          <div id="tour-section-dashboard-data-quality-3" className={styles.compositionRow}>
            {/* Donut */}
            <div className={styles.donutWrap}>
              <div className={styles.donutRing} style={donutVars} role="img" aria-label="Delivery composition ring" />
              <div className={styles.donutHole}>
                <span className={styles.donutValue}>{metrics.completionRate || 0}%</span>
                <span className={styles.donutLabel}>complete</span>
                <span className={styles.donutSub}>{metrics.doneIssues || 0} of {totalIssues}</span>
              </div>
            </div>

            {/* Legend */}
            <div className={styles.legend}>
              <div className={styles.legendGrid}>
                {segments.map(s => (
                  <div key={s.key} className={styles.legendItem}>
                    <span className={styles.legendDot} data-segment={s.key} />
                    <span className={styles.legendLabel}>{s.label}</span>
                    <strong className={styles.legendValue}>{s.value}</strong>
                    <span className={styles.legendPct}>{Math.round((s.value / segTotal) * 100)}%</span>
                  </div>
                ))}
              </div>
              <div className={styles.legendFooter}>
                <span>Total <strong className={styles.legendFooterStrong}>{totalIssues.toLocaleString()}</strong> issues</span>
                {orphanCount > 0 && <span>Orphans <strong className={styles.legendFooterStrong}>{orphanCount}</strong></span>}
                {storyPoints.totalStoryPoints > 0 && <span>Points <strong className={styles.legendFooterStrong}>{storyPoints.completedStoryPoints || 0} / {storyPoints.totalStoryPoints}</strong></span>}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </>
  );
}
