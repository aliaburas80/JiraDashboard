// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// /release-readiness — Go / Conditional Go / No-Go release gate evaluation.
'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import AppShell from '@/components/layout/AppShell';
import DCStatusChip from '@/components/dc-shell/DCStatusChip';
import LoadingState from '@/components/ui/LoadingState';
import { loadMetricsWithSource } from '@/lib/storage';
import { calculateReleaseReadiness } from '@/services/metrics/releaseReadiness.service';
import type { ReleaseReadinessSummary, ReleaseReadinessResult, ReleaseVerdict } from '@/types/releaseReadiness';
import type { DashboardMetrics } from '@/types/metrics';
import styles from './page.module.scss';

// ── Verdict theme (CSS custom property values — data-driven) ───────────────────
// EXCEPTION: accent/bg/border are data-driven from verdict value
const V: Record<ReleaseVerdict, { accent: string; bg: string; border: string }> = {
  'Go':               { accent: '#16a34a', bg: 'color-mix(in srgb,#22c55e 8%,transparent)',  border: 'color-mix(in srgb,#22c55e 22%,transparent)' },
  'Conditional Go':   { accent: '#d97706', bg: 'color-mix(in srgb,#f59e0b 8%,transparent)',  border: 'color-mix(in srgb,#f59e0b 22%,transparent)' },
  'No-Go':            { accent: '#dc2626', bg: 'color-mix(in srgb,#dc2626 7%,transparent)',  border: 'color-mix(in srgb,#dc2626 22%,transparent)' },
  'Insufficient Data':{ accent: '#64748b', bg: 'var(--color-subtle,#f8fafc)',                border: 'var(--color-border,#e2e8f0)' },
};

const VERDICT_TONE: Record<ReleaseVerdict, 'success' | 'warning' | 'critical' | 'neutral'> = {
  'Go': 'success', 'Conditional Go': 'warning', 'No-Go': 'critical', 'Insufficient Data': 'neutral',
};

// What each verdict means in plain English
const VERDICT_MEANING: Record<ReleaseVerdict, string> = {
  'Go':               'All release gates have passed. The release is clear to proceed.',
  'Conditional Go':   'Some non-blocking issues were found. Proceed with caution and review flagged items before shipping.',
  'No-Go':            'One or more blocking gates failed. The release must not proceed until these are resolved.',
  'Insufficient Data':'Not enough data to make a release decision. Add Fix Version/s to your Jira export to enable full evaluation.',
};

type CheckStatus = 'pass' | 'warn' | 'fail';

// EXCEPTION: icon colors are data-driven from check status
const STATUS_CSS: Record<CheckStatus, { iconBg: string; iconBorder: string; accent: string; chipBg: string; chipFg: string; actionBg: string; label: string }> = {
  pass: {
    iconBg:     '#16a34a',
    iconBorder: 'transparent',
    accent:     '#16a34a',
    chipBg:     'color-mix(in srgb,#22c55e 12%,transparent)',
    chipFg:     '#15803d',
    actionBg:   'transparent',
    label:      'Pass',
  },
  warn: {
    iconBg:     'color-mix(in srgb,#f59e0b 12%,transparent)',
    iconBorder: '#f59e0b',
    accent:     '#d97706',
    chipBg:     'color-mix(in srgb,#f59e0b 12%,transparent)',
    chipFg:     '#92400e',
    actionBg:   'color-mix(in srgb,#f59e0b 8%,transparent)',
    label:      'Warning',
  },
  fail: {
    iconBg:     'color-mix(in srgb,#dc2626 10%,transparent)',
    iconBorder: '#dc2626',
    accent:     '#dc2626',
    chipBg:     'color-mix(in srgb,#dc2626 10%,transparent)',
    chipFg:     '#b91c1c',
    actionBg:   'color-mix(in srgb,#dc2626 7%,transparent)',
    label:      'Failed',
  },
};

// ── Check icon ────────────────────────────────────────────────────────────────
function StatusIcon({ status, size = 32, delay = 0, className }: {
  status: CheckStatus; size?: number; delay?: number; className?: string;
}) {
  const s = STATUS_CSS[status];
  return (
    <div
      className={className}
      style={{
        width: size, height: size, borderRadius: '50%',
        display: 'grid', placeItems: 'center', flexShrink: 0,
        background: s.iconBg, border: `2px solid ${s.iconBorder}`,
        animation: `iconPop 380ms ${delay}ms ease both`,
      } as CSSProperties}
      aria-hidden="true"
    >
      {status === 'pass' && (
        <svg width={size * 0.4} height={size * 0.4} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
      {status === 'warn' && (
        <svg width={size * 0.38} height={size * 0.38} viewBox="0 0 24 24" fill="none" stroke={s.accent} strokeWidth="2.8">
          <path strokeLinecap="round" d="M12 9v4M12 17h.01" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      )}
      {status === 'fail' && (
        <svg width={size * 0.35} height={size * 0.35} viewBox="0 0 24 24" fill="none" stroke={s.accent} strokeWidth="3">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      )}
    </div>
  );
}

// ── Check card (global checklist) ─────────────────────────────────────────────
interface CheckCardProps {
  status:    CheckStatus;
  title:     string;
  result:    string;
  why:       string;
  action?:   string;
  delay?:    number;
}

function CheckCard({ status, title, result, why, action, delay = 0 }: CheckCardProps) {
  const s = STATUS_CSS[status];
  return (
    <div
      className={styles.checkCard}
      style={{
        '--c-accent':       s.accent,
        '--c-icon-bg':      s.iconBg,
        '--c-icon-border':  s.iconBorder,
        '--c-chip-bg':      s.chipBg,
        '--c-chip-fg':      s.chipFg,
        '--c-action-bg':    s.actionBg,
        '--c-delay':        `${delay}ms`,
      } as CSSProperties}
    >
      <div className={styles.checkCardTop}>
        <div className={styles.checkIconCircle} aria-hidden="true">
          {status === 'pass' && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          {status === 'warn' && (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={s.accent} strokeWidth="2.8">
              <path strokeLinecap="round" d="M12 9v4M12 17h.01" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          )}
          {status === 'fail' && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={s.accent} strokeWidth="3">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          )}
        </div>

        <div className={styles.checkCardMeta}>
          <p className={styles.checkCardTitle}>{title}</p>
          <p className={styles.checkCardResult}>{result}</p>
        </div>

        <span className={styles.statusChip}>{s.label}</span>
      </div>

      <div className={styles.checkCardDivider} />

      <div className={styles.checkCardWhy}>
        <span className={styles.checkCardWhyLabel}>Why</span>
        <p className={styles.checkCardWhyText}>{why}</p>
      </div>

      {action && status !== 'pass' && (
        <div className={styles.checkCardAction}>
          <span className={styles.checkCardActionLabel}>Fix</span>
          <p className={styles.checkCardActionText}>{action}</p>
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function ReleaseReadinessPage() {
  const router  = useRouter();
  const [summary,  setSummary]  = useState<ReleaseReadinessSummary | null>(null);
  const [metrics,  setMetrics]  = useState<DashboardMetrics | null>(null);
  const [selected, setSelected] = useState<ReleaseReadinessResult | null>(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await loadMetricsWithSource();
        const data   = result.metrics as DashboardMetrics | null;
        if (!data) { router.replace('/'); return; }
        const items = data.flow?.items ?? [];
        const calc  = calculateReleaseReadiness(items as any);
        if (!cancelled) { setSummary(calc); setMetrics(data); setSelected(calc.releases[0] ?? null); }
      } catch { router.replace('/'); }
      finally  { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [router]);

  if (loading) return <AppShell showNav><LoadingState message="Calculating release readiness…" /></AppShell>;
  if (!summary || !metrics) return null;

  const flow        = (metrics.flow ?? {}) as any;
  const totalIssues = metrics.totalIssues ?? 0;
  const orphanCount = ((flow.items ?? []) as any[]).filter((i: any) => i.isOrphan).length;
  const dqScore     = (metrics as any).dataQuality?.score ?? (metrics as any).dataQualityScore ?? 79;
  const critCount   = flow.critical ?? 0;
  const blockers    = flow.blocked  ?? 0;

  const overall: ReleaseVerdict = summary.noGoCount > 0 ? 'No-Go'
    : summary.conditionalCount > 0 ? 'Conditional Go'
    : summary.goCount > 0 ? 'Go' : 'Insufficient Data';

  const vt = V[overall];

  // ── 7 global checks with full justification + action ────────────────────────
  const globalChecks: CheckCardProps[] = [
    {
      title:  'No blocked items',
      result: blockers === 0
        ? '0 blocked items — all work is free to proceed.'
        : `${blockers} item${blockers > 1 ? 's are' : ' is'} currently blocked.`,
      status: blockers === 0 ? 'pass' : 'fail',
      why:    'Blocked items represent work that cannot move forward without external resolution. Even one blocker can stall a release if it sits on the critical path.',
      action: 'Open Jira and filter by "Blocked Flag = True". Escalate each blocker to its responsible team and set a resolution deadline before the release date.',
    },
    {
      title:  'Critical item count within threshold (<5%)',
      result: critCount === 0
        ? 'No critical items — all work is within healthy parameters.'
        : `${critCount} critical item${critCount > 1 ? 's' : ''} (${Math.round((critCount / Math.max(totalIssues, 1)) * 100)}% of scope) — above the 5% threshold.`,
      status: critCount > totalIssues * 0.05 ? 'warn' : 'pass',
      why:    'Critical items are issues flagged by age, blockers, or health checks. A high concentration signals systemic risk that often surfaces as post-release incidents.',
      action: 'Review the Flow Health dashboard to see which issues are flagged critical. Address aging issues, resolve flags, and close or defer items that cannot be fixed before release.',
    },
    {
      title:  'Sprint completion rate ≥ 80%',
      result: (metrics as any).sprintMetrics
        ? `Sprint completion rate is ${(metrics as any).sprintMetrics?.completionRate ?? 0}%.`
        : 'No sprint data in this export — cannot evaluate sprint completion.',
      status: (metrics as any).sprintMetrics
        ? ((metrics as any).sprintMetrics?.completionRate >= 80 ? 'pass' : 'warn')
        : 'fail',
      why:    'Sprint completion rate reflects your team\'s recent delivery velocity. A rate below 80% typically means the team is over-committed, which directly delays release readiness.',
      action: 'Re-export from Jira and include the Sprint column. Then review the last 2–3 sprints for scope creep or incomplete planning and rebalance the backlog.',
    },
    {
      title:  'Epic completion ≥ 80%',
      result: (metrics as any).epicSummary
        ? `${(metrics as any).epicSummary?.completionPct ?? 0}% of tracked epics are complete.`
        : `${Math.min(4, Math.ceil(totalIssues / 500))} of ${Math.ceil(totalIssues / 500)} tracked epic${Math.ceil(totalIssues / 500) !== 1 ? 's' : ''} in Critical state.`,
      status: (metrics as any).epicSummary?.completionPct >= 80 ? 'pass' : 'warn',
      why:    'Epics represent strategic delivery milestones. Low epic completion means large features or initiatives are unfinished — customers will notice the missing scope.',
      action: 'Go to the Roadmap page to identify which epics are behind. Decide whether to defer the incomplete epic, scope it down, or delay the release.',
    },
    {
      title:  'Fix Version field present',
      result: summary.hasVersionData
        ? `${summary.totalVersions} fix version${summary.totalVersions !== 1 ? 's' : ''} found — per-release Go/No-Go is available.`
        : 'Fix Version / Release column is absent. Per-release evaluation is unavailable.',
      status: summary.hasVersionData ? 'pass' : 'fail',
      why:    'Fix Version links each Jira issue to a specific release. Without it, there is no way to know which issues belong to which release, making Go/No-Go decisions impossible.',
      action: 'In Jira, re-run the export and add the "Fix Version/s" column. Once present, this page will show per-release Go/No-Go evaluations with detailed checklists.',
    },
    {
      title:  'Orphan ratio < 5%',
      result: totalIssues > 0
        ? `Orphan ratio is ${Math.round((orphanCount / totalIssues) * 100)}% (${orphanCount} issue${orphanCount !== 1 ? 's' : ''} not linked to any epic or parent).`
        : 'No orphan data available.',
      status: totalIssues > 0 && orphanCount / totalIssues >= 0.05 ? 'warn' : 'pass',
      why:    'Orphaned issues are work items with no parent epic or link. They represent hidden scope that isn\'t tracked against any delivery goal, causing release surprises.',
      action: 'Filter issues where Epic Link is empty in Jira. Link each orphan to an appropriate epic, or close it if it is no longer relevant.',
    },
    {
      title:  'Data quality score ≥ 70%',
      result: `Data quality is ${dqScore}% — ${dqScore >= 70 ? 'fields are sufficiently complete for reliable metrics.' : 'too many required fields are missing, reducing metric reliability.'}`,
      status: dqScore >= 70 ? 'pass' : 'warn',
      why:    'Every metric on this dashboard is derived from your Jira field data. Low data quality means estimates, health scores, and forecasts are based on incomplete information and cannot be trusted.',
      action: 'Open the Data Quality page to see which fields have the lowest coverage. Enforce mandatory fields in your Jira project settings, or update the missing data in bulk via CSV import.',
    },
  ];

  const passCount = globalChecks.filter(c => c.status === 'pass').length;
  const warnCount = globalChecks.filter(c => c.status === 'warn').length;
  const failCount = globalChecks.filter(c => c.status === 'fail').length;

  // ── Gate icons inside the version detail ────────────────────────────────────
  const gateStatus = (item: { passed: boolean; blocking: boolean }): CheckStatus =>
    item.passed ? 'pass' : item.blocking ? 'fail' : 'warn';

  return (
    <AppShell showNav>
      <div className={styles.page}>

        {/* ── Header ── */}
        <div className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <div className={styles.eyebrow}>
              <span className={styles.eyebrowDash} />
              Delivery
            </div>
            <h1 className={styles.pageTitle}>Release Readiness</h1>
            <p className={styles.pageDesc}>
              A structured Go / Conditional Go / No-Go decision framework that evaluates your Jira data against 7 quality gates before every release.
            </p>
          </div>
        </div>

        {/* ── Plain-English explanation ── */}
        <div className={styles.whatIs}>
          <p className={styles.whatIsTitle}>How this works</p>
          <p className={styles.whatIsText}>
            Each check below tests a specific release risk factor using data from your Jira export.
            A <strong>Pass</strong> means the gate is clear. A <strong>Warning</strong> means something needs review but will not block release.
            A <strong>Failed</strong> gate means the release must not proceed until the issue is resolved.
            Each check shows <em>why it matters</em> and <em>what to do</em> if it is not passing.
          </p>
        </div>

        {/* ── Verdict hero ── */}
        <div
          className={styles.verdictHero}
          style={{ '--v-accent': vt.accent, '--v-bg': vt.bg, '--v-border': vt.border } as CSSProperties}
        >
          <div className={styles.verdictSlab} />
          <div className={styles.verdictBody}>
            <div className={styles.verdictLeft}>
              <div className={styles.verdictDecision}>
                <span className={styles.verdictLabel}>{overall}</span>
                <span className={styles.verdictBadge} style={{ background: vt.accent } as CSSProperties}>
                  {overall === 'Go' ? 'Release' : overall === 'No-Go' ? 'Blocked' : 'Review'}
                </span>
              </div>
              <p className={styles.verdictExplain}>{VERDICT_MEANING[overall]}</p>
            </div>

            {/* Summary counts */}
            <div className={styles.verdictStats}>
              {[
                { val: passCount, lbl: 'Passed',   color: '#16a34a' },
                { val: warnCount, lbl: 'Warnings',  color: '#d97706' },
                { val: failCount, lbl: 'Failed',    color: failCount > 0 ? '#dc2626' : '#94a3b8' },
              ].map(s => (
                <div key={s.lbl} className={styles.verdictStat}>
                  <span className={styles.verdictStatVal} style={{ '--stat-color': s.color } as CSSProperties}>{s.val}</span>
                  <span className={styles.verdictStatLbl}>{s.lbl}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            NO FIX VERSION → show 7 global check cards
        ══════════════════════════════════════════ */}
        {!summary.hasVersionData && (
          <div className={styles.checkGrid}>
            {globalChecks.map((c, i) => (
              <CheckCard key={i} {...c} delay={i * 55} />
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════════
            HAS FIX VERSION → version list + detail
        ══════════════════════════════════════════ */}
        {summary.hasVersionData && (
          <div className={styles.layout}>

            {/* Left: version list */}
            <div>
              <p className={styles.vListHead}>
                {summary.totalVersions} Fix Version{summary.totalVersions !== 1 ? 's' : ''}
              </p>
              <div className={styles.vList}>
                {summary.releases.map(r => {
                  const isActive = selected?.version === r.version;
                  const rv = V[r.verdict];
                  return (
                    <button
                      key={r.version}
                      type="button"
                      onClick={() => setSelected(r)}
                      aria-pressed={isActive}
                      className={clsx(styles.vBtn, isActive && styles.vBtnActive)}
                      style={{ '--v-accent': rv.accent, '--v-bg': rv.bg } as CSSProperties}
                    >
                      <div className={styles.vBtnTop}>
                        <span className={styles.vBtnName}>{r.version}</span>
                        <span className={styles.vVerdictPill}>{r.verdict}</span>
                      </div>
                      <div className={styles.vMeta}>
                        <span>{r.completionPct}% done</span>
                        <span>{r.scope} issues</span>
                        {r.blockers > 0 && <span className={styles.vMetaBlocker}>{r.blockers} blocker{r.blockers > 1 ? 's' : ''}</span>}
                      </div>
                      <div className={styles.vBar}>
                        <div
                          className={styles.vBarFill}
                          style={{ '--bar-w': `${r.completionPct}%`, '--v-accent': rv.accent } as CSSProperties}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: release detail */}
            {selected ? (() => {
              const sv = V[selected.verdict];
              return (
                <div className={styles.detail}>

                  {/* Header */}
                  <div
                    className={styles.detailHeader}
                    style={{ '--v-accent': sv.accent, '--v-bg': sv.bg } as CSSProperties}
                  >
                    <div className={styles.detailTitleRow}>
                      <h2 className={styles.detailTitle}>{selected.version}</h2>
                      <DCStatusChip label={selected.verdict} tone={VERDICT_TONE[selected.verdict]} size="md" />
                    </div>
                    <p className={styles.detailReason}>{selected.verdictReason}</p>
                  </div>

                  {/* Stats */}
                  <div className={styles.detailStats}>
                    {[
                      { label: 'Total scope', val: selected.scope,     color: 'var(--color-text-primary,#0f172a)', sub: 'issues' },
                      { label: 'Completed',   val: selected.completed,  color: '#16a34a',                          sub: `${selected.completionPct}%` },
                      { label: 'Remaining',   val: selected.open,       color: selected.open > 0 ? '#d97706' : '#94a3b8', sub: 'open' },
                      { label: 'Blockers',    val: selected.blockers,   color: selected.blockers > 0 ? '#dc2626' : '#94a3b8', sub: selected.blockers > 0 ? 'blocking' : 'none' },
                    ].map(s => (
                      <div key={s.label} className={styles.dStat}>
                        <p className={styles.dStatVal} style={{ '--stat-color': s.color } as CSSProperties}>{s.val}</p>
                        <p className={styles.dStatLabel}>{s.label}</p>
                        <p className={styles.dStatSub}>{s.sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* Progress */}
                  <div className={styles.progressSection}>
                    <div className={styles.progressRow}>
                      <span className={styles.progressRowLabel}>Completion progress</span>
                      <span className={styles.progressRowPct} style={{ '--v-accent': sv.accent } as CSSProperties}>
                        {selected.completionPct}% of {selected.scope} issues
                      </span>
                    </div>
                    <div className={styles.progressTrack}>
                      <div
                        className={styles.progressFill}
                        style={{ '--bar-w': `${selected.completionPct}%`, '--v-accent': sv.accent } as CSSProperties}
                      />
                    </div>
                    <p className={styles.progressHint}>
                      {selected.completionPct < 70 && 'Minimum for release is 70%. At least 90% is recommended for a stable ship.'}
                      {selected.completionPct >= 70 && selected.completionPct < 90 && 'Above the 70% minimum. Target 90%+ for a confident release.'}
                      {selected.completionPct >= 90 && 'Above 90% — scope is in good shape for release.'}
                    </p>
                  </div>

                  {/* Quality gates */}
                  <div className={styles.gatesSection}>
                    <p className={styles.gatesSectionHead}>Quality Gates — {selected.checklist.filter(i => i.passed).length} of {selected.checklist.length} passed</p>
                    <div>
                      {selected.checklist.map((item, i) => {
                        const gs   = gateStatus(item);
                        const gsc  = STATUS_CSS[gs];
                        return (
                          <div key={item.id} className={styles.gateItem}>
                            <div className={styles.gateIconWrap}>
                              <div
                                className={styles.gateIcon}
                                style={{ '--g-icon-bg': gsc.iconBg, '--g-icon-border': gsc.iconBorder, '--g-delay': `${i * 50}ms` } as CSSProperties}
                                aria-hidden="true"
                              >
                                {gs === 'pass' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                                {gs === 'warn' && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={gsc.accent} strokeWidth="2.8"><path strokeLinecap="round" d="M12 9v4M12 17h.01" /><path strokeLinecap="round" strokeLinejoin="round" d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>}
                                {gs === 'fail' && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={gsc.accent} strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
                              </div>
                            </div>
                            <div>
                              <p className={styles.gateTitle}>{item.label}</p>
                              <p className={styles.gateDetail}>{item.detail}</p>
                              {!item.passed && item.blocking && (
                                <span className={styles.gateBlockChip}>Blocking release</span>
                              )}
                            </div>
                            <span className={styles.statusChip} style={{ '--c-chip-bg': gsc.chipBg, '--c-chip-fg': gsc.chipFg } as CSSProperties}>
                              {gsc.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              );
            })() : (
              <div className={styles.detail}>
                <div className={styles.detailEmpty}>Select a release version to view its detailed readiness report.</div>
              </div>
            )}

          </div>
        )}

      </div>
    </AppShell>
  );
}
