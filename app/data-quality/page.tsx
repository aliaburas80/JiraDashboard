'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import DCKpiCard from '@/components/dc-shell/DCKpiCard';
import DCStatusChip from '@/components/dc-shell/DCStatusChip';
import LoadingState from '@/components/ui/LoadingState';
import type { DashboardMetrics } from '@/types/metrics';
import type { DataQualityResult, FieldImpactReport, FieldImpact, CheckSeverity } from '@/types/dataQuality';
import { loadMetricsWithSource } from '@/lib/storage';
import { redirectWithLoadError } from '@/lib/loadErrorSignal';

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
    <div style={{ position: 'relative', width: 108, height: 108, flexShrink: 0 }}>
      <svg width="108" height="108" viewBox="0 0 108 108" style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
        <circle cx="54" cy="54" r={r} fill="none" stroke="var(--color-border, #e2e8f0)" strokeWidth="10" />
        <circle cx="54" cy="54" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 800ms ease-out' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 26, fontWeight: 900, color: 'var(--n900)', lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--n500)', letterSpacing: '0.04em' }}>/ 100</span>
      </div>
    </div>
  );
}

function FieldImpactRow({ fi, idx }: { fi: FieldImpact; idx: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderRadius: 12, border: `1px solid ${fi.severity === 'critical' ? 'rgba(244,63,94,0.3)' : fi.severity === 'high' ? 'rgba(245,158,11,0.25)' : 'var(--dc-line)'}`, overflow: 'hidden', marginBottom: 8 }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
          padding: '12px 14px', background: idx % 2 === 1 ? 'var(--dc-surface-soft)' : 'white', border: 'none', cursor: 'pointer',
        }}
        aria-expanded={open}
      >
        <DCStatusChip label={fi.severity} tone={SEV_TONE[fi.severity]} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 900, color: 'var(--dc-text)', margin: 0 }}>{fi.label}</p>
          {fi.isColumnAbsent && (
            <p style={{ fontSize: 11, color: 'var(--dc-critical)', fontWeight: 800, margin: '2px 0 0' }}>Column absent from export</p>
          )}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 900, color: SEV_COLOR[fi.severity], margin: 0 }}>{fi.missingPct}%</p>
          <p style={{ fontSize: 10, color: 'var(--dc-text-3)', fontWeight: 600, margin: '1px 0 0' }}>{fi.missingCount} / {fi.totalApplicable}</p>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--dc-text-3)" strokeWidth="2" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 200ms', flexShrink: 0 }} aria-hidden="true">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div style={{ padding: '0 14px 14px', background: idx % 2 === 1 ? 'var(--dc-surface-soft)' : 'white', borderTop: '1px solid var(--dc-line)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, paddingTop: 12, marginBottom: 12 }}>
            <div style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--dc-critical-soft)', border: '1px solid rgba(244,63,94,0.15)' }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: '#9B1C1C', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>What you see now</p>
              <p style={{ fontSize: 12, color: '#B91C1C', margin: 0 }}>{fi.whatYouSeeNow}</p>
            </div>
            <div style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--dc-success-soft)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: '#14532D', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>What you will gain</p>
              <p style={{ fontSize: 12, color: '#15803D', margin: 0 }}>{fi.whatYoullGain}</p>
            </div>
          </div>
          {fi.fallbackUsed && (
            <div style={{ fontSize: 11, color: 'var(--dc-text-2)', fontWeight: 700, marginBottom: 8 }}>
              <strong>Fallback used:</strong> {fi.fallbackUsed}
            </div>
          )}
          <div style={{ fontSize: 11, color: 'var(--dc-text-2)', fontWeight: 700, marginBottom: 6 }}>
            <strong>Fix:</strong> {fi.suggestedFix}
          </div>
          {fi.dashboardLocations.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {fi.dashboardLocations.map((loc, i) => (
                <span key={i} style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'var(--dc-surface-blue)', color: 'var(--dc-brand)' }}>{loc}</span>
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadMetricsWithSource().then(r => {
      if (cancelled) return;
      const data = r.metrics as DashboardMetrics | null;
      if (!data) { router.replace('/'); return; }
      setDq(data.dataQuality ?? null);
      setFi(data.fieldImpacts ?? null);
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
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ width: 20, height: 2, background: 'var(--blue)', display: 'inline-block' }} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--blue)', textTransform: 'uppercase' }}>Data</span>
        </div>
        <h1 id="tour-header-data-quality" style={{ fontSize: 26, fontWeight: 700, color: 'var(--n900)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Data Quality</h1>
        <p style={{ fontSize: 13, color: 'var(--n500)', margin: '0 0 16px', maxWidth: 560 }}>{dq.summary}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <ScoreRing score={dq.score} band={dq.band} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <DCStatusChip label={dq.band} tone={BAND_TONE[dq.band] ?? 'neutral'} size="md" />
            {dq.criticalCount > 0 && <DCStatusChip label={`${dq.criticalCount} critical issues`} tone="critical" size="md" />}
            {dq.highCount > 0 && <DCStatusChip label={`${dq.highCount} high impact`} tone="warning" size="md" />}
          </div>
        </div>
      </div>

      {/* Critical banner */}
      {dq.criticalCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20, background: 'var(--dc-critical-soft)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 14, padding: '14px 18px' }} role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--dc-critical)" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#9B1C1C', margin: '0 0 4px' }}>{dq.criticalCount} critical field{dq.criticalCount !== 1 ? 's' : ''} affecting dashboard accuracy</p>
            <p style={{ fontSize: 12, color: '#B91C1C', margin: 0 }}>Metrics in bold are degraded: {dq.affectedMetrics.slice(0, 6).join(', ')}{dq.affectedMetrics.length > 6 ? `, +${dq.affectedMetrics.length - 6} more` : ''}.</p>
          </div>
        </div>
      )}

      {/* KPI strip */}
      <section id="tour-section-data-quality-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }} aria-label="Data quality metrics">
        <DCKpiCard label="Missing Dates" value={missDate} subtitle="In-progress / done dates" tone={missDate > 0 ? 'warning' : 'success'} />
        <DCKpiCard label="Missing Parents" value={missParent} subtitle="Epic / parent links" tone={missParent > 0 ? 'warning' : 'success'} />
        <DCKpiCard label="Missing Statuses" value={missStatus} subtitle="Status field gaps" tone={missStatus > 0 ? 'critical' : 'success'} />
        <DCKpiCard label="Missing Estimates" value={missEst} subtitle="Story points / estimates" tone={missEst > 0 ? 'info' : 'success'} />
      </section>

      {/* Two-column */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px minmax(0,1fr)', gap: 20 }}>

        {/* Left: Completeness checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="dc-card" style={{ padding: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 900, color: 'var(--dc-text)', margin: '0 0 16px' }}>Completeness Checks</h2>

            {/* Score bar */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--dc-text)' }}>Data confidence</span>
                <span style={{ fontSize: 14, fontWeight: 900, color: BAND_COLOR[dq.band] ?? 'var(--dc-text)' }}>{dq.score}%</span>
              </div>
              <div style={{ height: 10, background: 'var(--dc-line)', borderRadius: 5 }}>
                <div style={{ width: `${dq.score}%`, height: '100%', background: BAND_COLOR[dq.band] ?? 'var(--dc-text-3)', borderRadius: 5, transition: 'width 800ms ease-out' }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {dq.checks.map(check => {
                const passed = check.missingPct < 5;
                const tone: BandTone = passed ? 'success' : check.severity === 'critical' ? 'critical' : check.severity === 'high' ? 'warning' : 'neutral';
                return (
                  <div key={check.field} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 10,
                    background: passed ? 'var(--dc-success-soft)' : check.severity === 'critical' ? 'var(--dc-critical-soft)' : check.severity === 'high' ? 'var(--dc-warning-soft)' : 'var(--dc-surface-soft)',
                    border: `1px solid ${passed ? 'rgba(34,197,94,0.2)' : check.severity === 'critical' ? 'rgba(244,63,94,0.2)' : check.severity === 'high' ? 'rgba(245,158,11,0.2)' : 'var(--dc-line)'}`,
                  }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1, display: 'grid', placeItems: 'center',
                      background: passed ? 'var(--dc-success)' : 'transparent',
                      border: passed ? 'none' : `2px solid ${check.severity === 'critical' ? 'var(--dc-critical)' : check.severity === 'high' ? 'var(--dc-warning)' : 'var(--dc-text-3)'}`,
                    }}>
                      {passed && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--dc-text)' }}>{check.label}</span>
                        {!passed && <DCStatusChip label={`${check.missingPct}% missing`} tone={tone} />}
                      </div>
                      {!passed && check.affectsMetrics.length > 0 && (
                        <p style={{ fontSize: 11, color: 'var(--dc-text-2)', margin: '3px 0 0', lineHeight: 1.4 }}>
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
          <div id="tour-section-data-quality-2" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: 15, fontWeight: 900, color: 'var(--dc-text)', margin: 0 }}>Field Impact Details</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              {criticalImpacts.length > 0 && <DCStatusChip label={`${criticalImpacts.length} critical`} tone="critical" />}
              {highImpacts.length > 0 && <DCStatusChip label={`${highImpacts.length} high`} tone="warning" />}
            </div>
          </div>

          {fi?.topSummary && (
            <div style={{ padding: '12px 16px', borderRadius: 12, background: 'var(--dc-surface-blue)', border: '1px solid rgba(37,99,235,0.15)', marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: 'var(--dc-text-2)', margin: 0, lineHeight: 1.5 }}>{fi.topSummary}</p>
            </div>
          )}

          {allImpacts.length === 0 ? (
            <div className="dc-card" style={{ padding: 32, textAlign: 'center' }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>✅</p>
              <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--dc-success)', margin: '0 0 4px' }}>No missing field impacts</p>
              <p style={{ fontSize: 13, color: 'var(--dc-text-2)', margin: 0 }}>All key fields are present in this export.</p>
            </div>
          ) : (
            <div>
              {allImpacts.map((impact, i) => (
                <FieldImpactRow key={impact.field} fi={impact} idx={i} />
              ))}
            </div>
          )}

          {/* Fix recommendations summary */}
          {dq.criticalCount > 0 && (
            <div className="dc-card" style={{ padding: 20, marginTop: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 900, color: 'var(--dc-text)', margin: '0 0 12px' }}>Recommended Actions</h3>
              <ol style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dq.checks
                  .filter(c => c.missingPct > 5)
                  .sort((a, b) => { const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }; return (order[a.severity] ?? 3) - (order[b.severity] ?? 3); })
                  .slice(0, 6)
                  .map(c => (
                    <li key={c.field} style={{ fontSize: 12, color: 'var(--dc-text-2)', lineHeight: 1.5 }}>
                      <strong style={{ color: 'var(--dc-text)' }}>{c.label}:</strong> {c.suggestedFix}
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
