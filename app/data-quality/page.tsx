'use client';
import { useEffect, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import AppShell from '@/components/layout/AppShell';
import DCKpiCard from '@/components/dc-shell/DCKpiCard';
import DCStatusChip from '@/components/dc-shell/DCStatusChip';
import LoadingState from '@/components/ui/LoadingState';
import MetricConfidenceBadge from '@/components/ui/MetricConfidenceBadge';
import type { DashboardMetrics } from '@/types/metrics';
import type { MetricConfidence } from '@/types/metricConfidence';
import type { DataQualityResult, FieldImpactReport, FieldImpact, CheckSeverity } from '@/types/dataQuality';
import { loadMetricsWithSource } from '@/lib/storage';
import { redirectWithLoadError } from '@/lib/loadErrorSignal';
import styles from './page.module.scss';

type CSSVars = CSSProperties & Record<`--${string}`, string | number>;

type BandTone = 'success' | 'info' | 'warning' | 'critical' | 'neutral';

const BAND_TONE: Record<string, BandTone> = {
  Excellent: 'success', Good: 'success', Fair: 'info', Weak: 'warning', Critical: 'critical',
};

const BAND_COLOR: Record<string, string> = {
  Excellent: 'var(--dc-success)', Good: 'var(--dc-success)', Fair: 'var(--dc-info)',
  Weak: 'var(--dc-warning)', Critical: 'var(--dc-critical)',
};

const SEV_TONE: Record<CheckSeverity, BandTone> = {
  critical: 'critical', high: 'warning', medium: 'info', low: 'neutral',
};

const SEV_COLOR: Record<CheckSeverity, string> = {
  critical: 'var(--dc-critical)', high: 'var(--dc-warning)', medium: 'var(--dc-info)', low: 'var(--dc-text-3)',
};

function ScoreRing({ score, band }: { score: number; band: string }) {
  const color  = BAND_COLOR[band] ?? 'var(--dc-text-3)';
  const r      = 44;
  const circ   = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  return (
    <div className={styles.scoreRingWrap}>
      <svg width="108" height="108" viewBox="0 0 108 108" className={styles.scoreRingSvg} aria-hidden="true">
        <circle cx="54" cy="54" r={r} fill="none" stroke="var(--color-border, #e2e8f0)" strokeWidth="10" />
        <circle cx="54" cy="54" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" className={styles.scoreRingProgress} />
      </svg>
      <div className={styles.scoreRingCenter}>
        <span className={styles.scoreRingValue}>{score}</span>
        <span className={styles.scoreRingMax}>/ 100</span>
      </div>
    </div>
  );
}

function FieldImpactRow({ fi }: { fi: FieldImpact }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.impactRow} data-severity={fi.severity}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={styles.impactHeader}
        aria-expanded={open}
      >
        <DCStatusChip label={fi.severity} tone={SEV_TONE[fi.severity]} />
        <div className={styles.impactLabelWrap}>
          <p className={styles.impactLabel}>{fi.label}</p>
          {fi.isColumnAbsent && (
            <p className={styles.impactAbsentNote}>Column absent from export</p>
          )}
        </div>
        <div className={styles.impactPctWrap}>
          <p className={styles.impactPct}>{fi.missingPct}%</p>
          <p className={styles.impactCount}>{fi.missingCount} / {fi.totalApplicable}</p>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--dc-text-3)" strokeWidth="2" className={styles.impactCaret} data-open={open} aria-hidden="true">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className={styles.impactBody}>
          <div className={styles.impactGrid}>
            <div className={styles.impactNowCard}>
              <p className={clsx(styles.impactCardLabel, styles['impactCardLabel--now'])}>What you see now</p>
              <p className={clsx(styles.impactCardText, styles['impactCardText--now'])}>{fi.whatYouSeeNow}</p>
            </div>
            <div className={styles.impactGainCard}>
              <p className={clsx(styles.impactCardLabel, styles['impactCardLabel--gain'])}>What you will gain</p>
              <p className={clsx(styles.impactCardText, styles['impactCardText--gain'])}>{fi.whatYoullGain}</p>
            </div>
          </div>
          {fi.fallbackUsed && (
            <div className={styles.impactFallback}>
              <strong>Fallback used:</strong> {fi.fallbackUsed}
            </div>
          )}
          <div className={styles.impactFix}>
            <strong>Fix:</strong> {fi.suggestedFix}
          </div>
          {fi.dashboardLocations.length > 0 && (
            <div className={styles.impactLocations}>
              {fi.dashboardLocations.map((loc, i) => (
                <span key={i} className={styles.impactLocationChip}>{loc}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DataQualityPage() {
  const router = useRouter();
  const [dq, setDq] = useState<DataQualityResult | null>(null);
  const [fi, setFi] = useState<FieldImpactReport | null>(null);
  const [sampleConfidence, setSampleConfidence] = useState<MetricConfidence | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadMetricsWithSource().then(r => {
      if (cancelled) return;
      const data = r.metrics as DashboardMetrics | null;
      if (!data) { router.replace('/'); return; }
      setDq(data.dataQuality ?? null);
      setFi(data.fieldImpacts ?? null);
      setSampleConfidence(data.confidence?.dataQuality ?? null);
    }).catch(() => redirectWithLoadError(router)).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [router]);

  if (loading) return <AppShell showNav><LoadingState message="Analysing data quality…" /></AppShell>;
  if (!dq) return null;

  const missDate     = dq.checks.filter(c => c.field.toLowerCase().includes('date') && c.missingPct > 0).reduce((s, c) => s + c.missing, 0);
  const missParent   = dq.checks.filter(c => (c.field.toLowerCase().includes('epic') || c.field.toLowerCase().includes('parent')) && c.missingPct > 0).reduce((s, c) => s + c.missing, 0);
  const missStatus   = dq.checks.filter(c => c.field.toLowerCase().includes('status') && c.missingPct > 0).reduce((s, c) => s + c.missing, 0);
  const missEst      = dq.checks.filter(c => (c.field.toLowerCase().includes('point') || c.field.toLowerCase().includes('estimate')) && c.missingPct > 0).reduce((s, c) => s + c.missing, 0);

  const allImpacts = fi?.all ?? [];
  const criticalImpacts = fi?.critical ?? [];
  const highImpacts     = fi?.high ?? [];

  return (
    <AppShell showNav>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderKicker}>
          <span className={styles.kickerBar} />
          <span className={styles.kickerLabel}>Data</span>
        </div>
        <h1 id="tour-header-data-quality" className={styles.pageTitle}>Data Quality</h1>
        <p className={styles.pageDesc}>{dq.summary}</p>
        <div className={styles.scoreRow}>
          <ScoreRing score={dq.score} band={dq.band} />
          <div className={styles.scoreChips}>
            <DCStatusChip label={dq.band} tone={BAND_TONE[dq.band] ?? 'neutral'} size="md" />
            {dq.criticalCount > 0 && <DCStatusChip label={`${dq.criticalCount} critical issues`} tone="critical" size="md" />}
            {dq.highCount > 0 && <DCStatusChip label={`${dq.highCount} high impact`} tone="warning" size="md" />}
            {/* CP3-017: sample-size reliability, distinct from the field-completeness score itself. */}
            {sampleConfidence && <MetricConfidenceBadge confidence={sampleConfidence} size="sm" showLabel />}
          </div>
        </div>
      </div>

      {/* Critical banner */}
      {dq.criticalCount > 0 && (
        <div className={styles.criticalBanner} role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--dc-critical)" strokeWidth="2" className={styles.criticalIcon} aria-hidden="true">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div>
            <p className={styles.criticalTitle}>{dq.criticalCount} critical field{dq.criticalCount !== 1 ? 's' : ''} affecting dashboard accuracy</p>
            <p className={styles.criticalBody}>Metrics in bold are degraded: {dq.affectedMetrics.slice(0, 6).join(', ')}{dq.affectedMetrics.length > 6 ? `, +${dq.affectedMetrics.length - 6} more` : ''}.</p>
          </div>
        </div>
      )}

      {/* KPI strip */}
      <section id="tour-section-data-quality-1" className={styles.kpiGrid} aria-label="Data quality metrics">
        <DCKpiCard label="Missing Dates" value={missDate} subtitle="In-progress / done dates" tone={missDate > 0 ? 'warning' : 'success'} />
        <DCKpiCard label="Missing Parents" value={missParent} subtitle="Epic / parent links" tone={missParent > 0 ? 'warning' : 'success'} />
        <DCKpiCard label="Missing Statuses" value={missStatus} subtitle="Status field gaps" tone={missStatus > 0 ? 'critical' : 'success'} />
        <DCKpiCard label="Missing Estimates" value={missEst} subtitle="Story points / estimates" tone={missEst > 0 ? 'info' : 'success'} />
      </section>

      {/* Two-column */}
      <div className={styles.columns}>

        {/* Left: Completeness checklist */}
        <div className={styles.leftCol}>
          <div className={clsx('dc-card', styles.cardPad)}>
            <h2 className={styles.cardTitle}>Completeness Checks</h2>

            {/* Score bar */}
            <div className={styles.scoreBarWrap}>
              <div className={styles.scoreBarHead}>
                <span className={styles.scoreBarLabel}>Data Quality Score</span>
                <span className={styles.scoreBarValue} data-band={dq.band}>{dq.score}%</span>
              </div>
              <div className={styles.scoreBarTrack}>
                {/* DYNAMIC CSS VARIABLE: width is the computed data quality score, cannot be predefined. */}
                <div
                  className={styles.scoreBarFill}
                  data-band={dq.band}
                  style={{ '--score-width': `${dq.score}%` } as CSSVars}
                />
              </div>
            </div>

            <div className={styles.checksList}>
              {dq.checks.map(check => {
                const passed = check.missingPct < 5;
                const tone: BandTone = passed ? 'success' : check.severity === 'critical' ? 'critical' : check.severity === 'high' ? 'warning' : 'neutral';
                return (
                  <div key={check.field} className={styles.checkItem} data-tone={tone}>
                    <div className={styles.checkIconBox} data-tone={tone}>
                      {passed && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                    <div className={styles.checkBody}>
                      <div className={styles.checkRow}>
                        <span className={styles.checkLabel}>{check.label}</span>
                        {!passed && <DCStatusChip label={`${check.missingPct}% missing`} tone={tone} />}
                      </div>
                      {!passed && check.affectsMetrics.length > 0 && (
                        <p className={styles.checkAffects}>
                          Affects: {check.affectsMetrics.slice(0, 3).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Field impact report */}
        <div>
          <div id="tour-section-data-quality-2" className={styles.rightHeader}>
            <h2 className={styles.rightTitle}>Field Impact Details</h2>
            <div className={styles.rightChips}>
              {criticalImpacts.length > 0 && <DCStatusChip label={`${criticalImpacts.length} critical`} tone="critical" />}
              {highImpacts.length > 0 && <DCStatusChip label={`${highImpacts.length} high`} tone="warning" />}
            </div>
          </div>

          {fi?.topSummary && (
            <div className={styles.topSummaryBox}>
              <p className={styles.topSummaryText}>{fi.topSummary}</p>
            </div>
          )}

          {allImpacts.length === 0 ? (
            <div className={clsx('dc-card', styles.emptyStatePad)}>
              <p className={styles.emptyIcon}>✅</p>
              <p className={styles.emptyTitle}>No missing field impacts</p>
              <p className={styles.emptyBody}>All key fields are present in this export.</p>
            </div>
          ) : (
            <div>
              {allImpacts.map(impact => (
                <FieldImpactRow key={impact.field} fi={impact} />
              ))}
            </div>
          )}

          {/* Fix recommendations summary */}
          {dq.criticalCount > 0 && (
            <div className={clsx('dc-card', styles.cardPad, styles.recsCard)}>
              <h3 className={styles.recsTitle}>Recommended Actions</h3>
              <ol className={styles.recsList}>
                {dq.checks
                  .filter(c => c.missingPct > 5)
                  .sort((a, b) => { const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }; return (order[a.severity] ?? 3) - (order[b.severity] ?? 3); })
                  .slice(0, 6)
                  .map(c => (
                    <li key={c.field} className={styles.recItem}>
                      <strong className={styles.recItemLabel}>{c.label}:</strong> {c.suggestedFix}
                    </li>
                  ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
