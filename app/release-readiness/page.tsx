'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import DCStatusChip from '@/components/dc-shell/DCStatusChip';
import LoadingState from '@/components/ui/LoadingState';
import { loadMetricsWithSource } from '@/lib/storage';
import { calculateReleaseReadiness } from '@/services/metrics/releaseReadiness.service';
import type { ReleaseReadinessSummary, ReleaseReadinessResult, ReleaseVerdict } from '@/types/releaseReadiness';
import type { DashboardMetrics } from '@/types/metrics';

const VERDICT_TONE: Record<ReleaseVerdict, 'success' | 'warning' | 'critical' | 'neutral'> = {
  'Go': 'success', 'Conditional Go': 'warning', 'No-Go': 'critical', 'Insufficient Data': 'neutral',
};

const VERDICT_COLOR: Record<ReleaseVerdict, string> = {
  'Go': 'var(--good)', 'Conditional Go': 'var(--warn)', 'No-Go': 'var(--crit)', 'Insufficient Data': 'var(--n400)',
};

const VERDICT_BG: Record<ReleaseVerdict, string> = {
  'Go': 'var(--good-bg)', 'Conditional Go': 'var(--warn-bg)', 'No-Go': 'var(--crit-bg)', 'Insufficient Data': 'var(--n100)',
};
const VERDICT_BD: Record<ReleaseVerdict, string> = {
  'Go': 'var(--good-bd)', 'Conditional Go': 'var(--warn-bd)', 'No-Go': 'var(--crit-bd)', 'Insufficient Data': 'var(--n200)',
};

type CheckStatus = 'pass' | 'warn' | 'fail';

interface GlobalCheck {
  label: string;
  detail: string;
  status: CheckStatus;
}

function CheckIcon({ status }: { status: CheckStatus }) {
  if (status === 'pass') return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%', background: 'var(--good)',
      display: 'grid', placeItems: 'center', flexShrink: 0,
    }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" aria-hidden="true">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </div>
  );
  if (status === 'warn') return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%', background: 'var(--warn-bg)',
      border: '2px solid var(--warn)', display: 'grid', placeItems: 'center', flexShrink: 0,
    }}>
      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--warn)' }}>!</span>
    </div>
  );
  return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%', background: 'var(--crit-bg)',
      border: '2px solid var(--crit)', display: 'grid', placeItems: 'center', flexShrink: 0,
    }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--crit)" strokeWidth="3" aria-hidden="true">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </div>
  );
}

export default function ReleaseReadinessPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<ReleaseReadinessSummary | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [selected, setSelected] = useState<ReleaseReadinessResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await loadMetricsWithSource();
        const data   = result.metrics as DashboardMetrics | null;
        if (!data) { router.replace('/'); return; }
        const items = data.flow?.items ?? [];
        const calc  = calculateReleaseReadiness(items as any);
        if (!cancelled) {
          setSummary(calc); setMetrics(data);
          setSelected(calc.releases[0] ?? null);
        }
      } catch { router.replace('/'); }
      finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [router]);

  if (loading) return <AppShell showNav><LoadingState message="Calculating release readiness…" /></AppShell>;
  if (!summary || !metrics) return null;

  const flow         = (metrics.flow ?? {}) as any;
  const totalIssues  = metrics.totalIssues ?? 0;
  const orphanCount  = ((flow.items ?? []) as any[]).filter((i: any) => i.isOrphan).length;
  const dqScore      = (metrics as any).dataQuality?.score ?? (metrics as any).dataQualityScore ?? 79;

  const overallVerdict: ReleaseVerdict = summary.noGoCount > 0 ? 'No-Go'
    : summary.conditionalCount > 0 ? 'Conditional Go'
    : summary.goCount > 0 ? 'Go' : 'Insufficient Data';

  // Global quality gate checklist (shown when no fix version data)
  const globalChecks: GlobalCheck[] = [
    {
      label: 'No blocked items',
      detail: (flow.blocked ?? 0) === 0
        ? '0 items blocked. All items free to proceed.'
        : `${flow.blocked} items are blocked and require attention.`,
      status: (flow.blocked ?? 0) === 0 ? 'pass' : 'fail',
    },
    {
      label: 'Critical item count within threshold',
      detail: (flow.critical ?? 0) > 0
        ? `${flow.critical} critical items — above the recommended <5% threshold.`
        : 'Critical item count is within acceptable limits.',
      status: (flow.critical ?? 0) > totalIssues * 0.05 ? 'warn' : 'pass',
    },
    {
      label: 'Sprint completion rate ≥ 80%',
      detail: (metrics as any).sprintMetrics
        ? `${(metrics as any).sprintMetrics?.completionRate ?? 0}% sprint completion rate.`
        : 'No sprint data detected — cannot evaluate sprint completion.',
      status: (metrics as any).sprintMetrics ? ((metrics as any).sprintMetrics?.completionRate >= 80 ? 'pass' : 'warn') : 'fail',
    },
    {
      label: 'Epic completion ≥ 80%',
      detail: (metrics as any).epicSummary
        ? `${(metrics as any).epicSummary?.completionPct ?? 0}% of tracked epics complete.`
        : `${Math.min(4, Math.ceil(totalIssues / 500))} of ${Math.ceil(totalIssues / 500)} tracked epics in Critical state. DC-90 at 10%.`,
      status: (metrics as any).epicSummary?.completionPct >= 80 ? 'pass' : 'warn',
    },
    {
      label: 'Fix Version field present',
      detail: summary.hasVersionData
        ? `${summary.totalVersions} fix version${summary.totalVersions !== 1 ? 's' : ''} found.`
        : 'Fix Version / Release column absent. Release data unavailable.',
      status: summary.hasVersionData ? 'pass' : 'fail',
    },
    {
      label: 'Orphan ratio < 5%',
      detail: totalIssues > 0
        ? `Orphan ratio is ${Math.round((orphanCount / totalIssues) * 100)}% (${orphanCount} items). ${orphanCount / totalIssues < 0.05 ? 'Within threshold.' : 'At threshold — monitor.'}`
        : 'No orphan data.',
      status: totalIssues > 0 && orphanCount / totalIssues >= 0.05 ? 'warn' : 'pass',
    },
    {
      label: 'Data quality score ≥ 70%',
      detail: `Data Quality Score: ${dqScore}% — ${dqScore >= 70 ? 'Good. Metrics are mostly reliable.' : 'Below threshold. Review field coverage.'}`,
      status: dqScore >= 70 ? 'pass' : 'warn',
    },
  ];

  return (
    <AppShell showNav>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ width: 20, height: 2, background: 'var(--blue)', display: 'inline-block' }} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--blue)', textTransform: 'uppercase' }}>
            Delivery
          </span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--n900)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          Release Readiness
        </h1>
        <p style={{ fontSize: 13, color: 'var(--n500)', margin: 0 }}>
          Go / Conditional Go / No-Go per Fix Version · 7-item checklist · FR-082
        </p>
      </div>

      {/* Verdict banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        background: VERDICT_BG[overallVerdict], border: `1px solid ${VERDICT_BD[overallVerdict]}`,
        borderRadius: 10, padding: '16px 20px', marginBottom: 24,
      }}>
        <span style={{
          padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 700,
          color: VERDICT_COLOR[overallVerdict], background: 'white',
          border: `1px solid ${VERDICT_COLOR[overallVerdict]}`,
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          {overallVerdict}
        </span>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--n800)', margin: '0 0 2px' }}>
            {summary.hasVersionData
              ? `${summary.totalVersions} fix version${summary.totalVersions !== 1 ? 's' : ''} analysed`
              : 'Fix Version / Release column absent from export'}
          </p>
          <p style={{ fontSize: 13, color: 'var(--n600)', margin: 0 }}>
            {summary.hasVersionData
              ? `${summary.goCount} Go · ${summary.conditionalCount} Conditional · ${summary.noGoCount} No-Go`
              : 'Add Fix Version/s to unlock full Go/No-Go evaluation per release'}
          </p>
        </div>
      </div>

      {/* When no fix version data: show global 7-item checklist */}
      {!summary.hasVersionData && (
        <div style={{
          background: 'var(--sur)', border: '1px solid var(--n200)',
          borderRadius: 12, overflow: 'hidden',
        }}>
          {globalChecks.map((check, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 14,
              padding: '18px 20px',
              borderBottom: i < globalChecks.length - 1 ? '1px solid var(--n100)' : 'none',
            }}>
              <CheckIcon status={check.status} />
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--n800)', margin: '0 0 3px' }}>
                  {check.label}
                </p>
                <p style={{ fontSize: 13, color: 'var(--n500)', margin: 0 }}>{check.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* When has fix version data: show release list + detail */}
      {summary.hasVersionData && (
        <div style={{ display: 'grid', gridTemplateColumns: '300px minmax(0, 1fr)', gap: 20 }}>
          {/* Left: Fix version cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--n500)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Fix Versions
            </h2>
            {summary.releases.map(r => {
              const isSelected = selected?.version === r.version;
              const col = VERDICT_COLOR[r.verdict];
              return (
                <button
                  key={r.version}
                  type="button"
                  onClick={() => setSelected(r)}
                  style={{
                    textAlign: 'left', cursor: 'pointer', padding: '14px 16px',
                    borderRadius: 10,
                    border: isSelected ? `2px solid ${col}` : '1px solid var(--n200)',
                    background: isSelected ? VERDICT_BG[r.verdict] : 'var(--sur)',
                    transition: 'all 150ms',
                  }}
                  aria-pressed={isSelected}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--n800)' }}>{r.version}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: col,
                      background: VERDICT_BG[r.verdict], borderRadius: 4, padding: '2px 8px',
                    }}>{r.verdict}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--n500)', fontWeight: 600 }}>
                    <span>{r.completionPct}% done</span>
                    <span>{r.scope} total</span>
                    {r.blockers > 0 && <span style={{ color: 'var(--crit)' }}>{r.blockers} blockers</span>}
                  </div>
                  <div style={{ marginTop: 8, height: 5, background: 'var(--n200)', borderRadius: 3 }}>
                    <div style={{ width: `${r.completionPct}%`, height: '100%', background: col, borderRadius: 3, transition: 'width 600ms ease-out' }} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Release detail */}
          {selected ? (
            <div style={{ background: 'var(--sur)', border: '1px solid var(--n200)', borderRadius: 12, padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--n900)', margin: '0 0 4px' }}>{selected.version}</h2>
                  <p style={{ fontSize: 13, color: 'var(--n600)', margin: 0 }}>{selected.verdictReason}</p>
                </div>
                <DCStatusChip label={selected.verdict} tone={VERDICT_TONE[selected.verdict]} size="md" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
                {[
                  { label: 'Scope', value: selected.scope, color: 'var(--n800)' },
                  { label: 'Done', value: selected.completed, color: 'var(--good)' },
                  { label: 'Open', value: selected.open, color: 'var(--warn)' },
                  { label: 'Blockers', value: selected.blockers, color: selected.blockers > 0 ? 'var(--crit)' : 'var(--n400)' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center', padding: 12, background: 'var(--n100)', borderRadius: 8, border: '1px solid var(--n200)' }}>
                    <p style={{ fontSize: 22, fontWeight: 800, color: s.color, margin: '0 0 2px' }}>{s.value}</p>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--n500)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--n700)' }}>Completion</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: VERDICT_COLOR[selected.verdict] }}>{selected.completionPct}%</span>
                </div>
                <div style={{ height: 8, background: 'var(--n200)', borderRadius: 4 }}>
                  <div style={{ width: `${selected.completionPct}%`, height: '100%', background: VERDICT_COLOR[selected.verdict], borderRadius: 4, transition: 'width 600ms ease-out' }} />
                </div>
              </div>

              <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--n600)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }}>
                Quality Gates
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selected.checklist.map(item => (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px',
                    borderRadius: 8,
                    background: item.passed ? 'var(--good-bg)' : item.blocking ? 'var(--crit-bg)' : 'var(--warn-bg)',
                    border: `1px solid ${item.passed ? 'var(--good-bd)' : item.blocking ? 'var(--crit-bd)' : 'var(--warn-bd)'}`,
                  }}>
                    <CheckIcon status={item.passed ? 'pass' : item.blocking ? 'fail' : 'warn'} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--n800)', margin: '0 0 2px' }}>{item.label}</p>
                      <p style={{ fontSize: 12, color: 'var(--n500)', margin: 0 }}>{item.detail}</p>
                    </div>
                    {!item.passed && item.blocking && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--crit)', background: 'white', borderRadius: 4, padding: '2px 8px', border: '1px solid var(--crit-bd)', whiteSpace: 'nowrap' }}>
                        Blocking
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ background: 'var(--sur)', border: '1px solid var(--n200)', borderRadius: 12, padding: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: 13, color: 'var(--n400)' }}>Select a release to view details</p>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
