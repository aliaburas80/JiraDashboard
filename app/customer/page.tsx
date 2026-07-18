// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// /customer — External stakeholder delivery report. No jargon. Print-ready.
'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loadMetricsWithSource } from '@/lib/storage';
import { redirectWithLoadError } from '@/lib/loadErrorSignal';
import { getHealthBand, type HealthBand } from '@/lib/utils';
import type { DashboardMetrics } from '@/types/metrics';
import styles from './page.module.scss';

// ── Health band metadata ───────────────────────────────────────────────────────
// EXCEPTION: all colors are data-driven from the health band enum
const BAND_META: Record<HealthBand, {
  label:        string;
  headline:     string;
  gradient:     string;
  accentColor:  string;
  printBg:      string;
  printBorder:  string;
}> = {
  excellent: {
    label:       'On Track',
    headline:    'Delivery is on track and performing excellently.',
    gradient:    'linear-gradient(135deg, #052e16 0%, #065f46 65%, #0d9488 100%)',
    accentColor: '#34d399',
    printBg:     '#f0fdf4',
    printBorder: '#86efac',
  },
  good: {
    label:       'Progressing',
    headline:    'Delivery is progressing well with minor risks to monitor.',
    gradient:    'linear-gradient(135deg, #0f2547 0%, #1e40af 75%, #2563eb 100%)',
    accentColor: '#60a5fa',
    printBg:     '#eff6ff',
    printBorder: '#93c5fd',
  },
  moderate: {
    label:       'Needs Attention',
    headline:    'Delivery is progressing but has areas that need attention.',
    gradient:    'linear-gradient(135deg, #3f1c00 0%, #92400e 70%, #b45309 100%)',
    accentColor: '#fbbf24',
    printBg:     '#fffbeb',
    printBorder: '#fde68a',
  },
  'at-risk': {
    label:       'At Risk',
    headline:    'Delivery has risks that require prompt action to stay on track.',
    gradient:    'linear-gradient(135deg, #3b0f00 0%, #9a3412 70%, #c2410c 100%)',
    accentColor: '#fb923c',
    printBg:     '#fff7ed',
    printBorder: '#fed7aa',
  },
  critical: {
    label:       'Critical',
    headline:    'Delivery requires immediate attention and leadership escalation.',
    gradient:    'linear-gradient(135deg, #450a0a 0%, #991b1b 65%, #b91c1c 100%)',
    accentColor: '#f87171',
    printBg:     '#fff1f2',
    printBorder: '#fecdd3',
  },
};

// Status distribution colour map
const STATUS_COLORS: Record<string, string> = {
  'To Do':       '#cbd5e1',
  'In Progress': '#7c3aed',
  'Blocked':     '#dc2626',
  'Done':        '#16a34a',
};
const STATUS_ORDER: Record<string, number> = {
  'To Do': 0, 'In Progress': 1, 'Blocked': 2, 'Done': 3,
};

// Ring: r=44, viewBox 0 0 110 110
const RING_R    = 44;
const RING_CIRC = 2 * Math.PI * RING_R; // ≈ 276.46

function pctColor(pct: number): string {
  if (pct >= 70) return '#16a34a';
  if (pct >= 40) return '#d97706';
  return '#dc2626';
}

function speedColor(days: number, goodMax: number, warnMax: number): string {
  if (days <= goodMax) return '#16a34a';
  if (days <= warnMax) return '#d97706';
  return '#dc2626';
}

function confLabel(conf: number): string {
  if (conf >= 80) return 'High Delivery Confidence';
  if (conf >= 50) return 'Medium Delivery Confidence';
  return 'Low Delivery Confidence';
}

function epicHealthColors(critical: number, warning: number): {
  color: string; bg: string; fg: string; label: string;
} {
  if (critical > 0) return { color: '#dc2626', bg: '#fee2e2', fg: '#b91c1c', label: 'At Risk' };
  if (warning  > 0) return { color: '#d97706', bg: '#fef9c3', fg: '#92400e', label: 'Needs Attention' };
  return                  { color: '#16a34a', bg: '#dcfce7', fg: '#15803d', label: 'On Track' };
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CustomerPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadMetricsWithSource().then(r => {
      if (cancelled) return;
      const data = r.metrics as DashboardMetrics | null;
      if (!data) { router.replace('/'); return; }
      setMetrics(data);
    }).catch(() => redirectWithLoadError(router));
    return () => { cancelled = true; };
  }, [router]);

  if (!metrics) return (
    <div className={styles.loadingPage}>
      <div className="w-8 h-8 border-4 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
    </div>
  );

  // ── Data derivations ──────────────────────────────────────────────────────
  const band       = getHealthBand(metrics.healthScore ?? 0);
  const bandMeta   = BAND_META[band];
  const sp         = metrics.storyPoints;
  const prediction = metrics.prediction;
  const flow       = metrics.flow as any;
  const risk       = metrics.risk;
  const items      = (flow?.items ?? []) as any[];

  const completionRate = metrics.completionRate ?? 0;
  const cvProgress     = metrics.customerVisibleProgress ?? 0;
  const totalCv        = metrics.totalCustomerVisible    ?? 0;
  const confidence     = metrics.overallDeliveryConfidence ?? 0;

  const ringOffset = RING_CIRC * (1 - completionRate / 100);

  // Status distribution (from flow items high-level status)
  const distData = (() => {
    const groups: Record<string, number> = {};
    items.forEach((i: any) => {
      const k = String(i.highLevelStatus ?? '').trim() || 'To Do';
      groups[k] = (groups[k] ?? 0) + 1;
    });
    const total = Math.max(items.length, 1);
    return Object.entries(groups)
      .sort((a, b) => (STATUS_ORDER[a[0]] ?? 10) - (STATUS_ORDER[b[0]] ?? 10))
      .map(([label, count]) => ({
        label,
        count,
        color: STATUS_COLORS[label] ?? '#94a3b8',
        pct:   Math.round((count / total) * 100),
      }));
  })();

  // Delivery speed metrics
  const cycleTime     = flow?.averageCycleTimeDays  ?? 0;
  const leadTime      = flow?.averageLeadTimeDays   ?? 0;
  const ctSampleSize  = flow?.cycleTimeSampleSize   ?? 0;
  const velocity      = (prediction as any)?.velocityPerDay ?? 0;

  const speedCards = [
    cycleTime > 0 && {
      label: 'Avg Cycle Time',
      val:   `${cycleTime.toFixed(1)}d`,
      sub:   'from start to done',
      note:  ctSampleSize > 0 ? `${ctSampleSize} items sampled` : undefined,
      color: speedColor(cycleTime, 7, 14),
      delay: 0,
    },
    leadTime > 0 && {
      label: 'Avg Lead Time',
      val:   `${leadTime.toFixed(1)}d`,
      sub:   'from request to done',
      note:  undefined,
      color: speedColor(leadTime, 14, 28),
      delay: 60,
    },
    velocity > 0 && {
      label: 'Daily Velocity',
      val:   `${velocity.toFixed(1)}`,
      sub:   'items completed/day',
      note:  undefined,
      color: '#7c3aed',
      delay: 120,
    },
  ].filter(Boolean) as { label: string; val: string; sub: string; note?: string; color: string; delay: number }[];

  // Risks — all risk sources
  const riskList: { text: string; level: 'high' | 'medium' | 'low'; icon: string }[] = [];

  if (metrics.blockedIssues > 0) riskList.push({
    text:  `${metrics.blockedIssues} work item${metrics.blockedIssues > 1 ? 's are' : ' is'} currently blocked and cannot move forward without action.`,
    level: metrics.blockedIssues >= 3 ? 'high' : 'medium',
    icon:  '🔒',
  });
  if (risk?.overdueIssues > 0) riskList.push({
    text:  `${risk.overdueIssues} item${risk.overdueIssues > 1 ? 's are' : ' is'} past their due date and may impact the delivery timeline.`,
    level: risk.overdueIssues >= 5 ? 'high' : 'medium',
    icon:  '📅',
  });
  if (risk?.highPriorityOpenIssues > 0) riskList.push({
    text:  `${risk.highPriorityOpenIssues} high-priority item${risk.highPriorityOpenIssues > 1 ? 's are' : ' is'} still open and could delay critical deliverables.`,
    level: risk.highPriorityOpenIssues >= 3 ? 'high' : 'medium',
    icon:  '🎯',
  });
  if (metrics.openDefects > 0) riskList.push({
    text:  `${metrics.openDefects} open quality issue${metrics.openDefects > 1 ? 's' : ''} may affect delivery quality or readiness for release.`,
    level: metrics.openDefects >= 5 ? 'high' : 'medium',
    icon:  '⚠️',
  });
  if ((flow?.critical ?? 0) >= 5) riskList.push({
    text:  `${flow.critical} items are in a critical state and need immediate attention to prevent delivery impact.`,
    level: 'high',
    icon:  '🚨',
  });
  const orphans = items.filter((i: any) => i.isOrphan).length;
  if (orphans >= 10) riskList.push({
    text:  `${orphans} items are not linked to a tracked delivery area and may be missing from progress reporting.`,
    level: 'low',
    icon:  '🔗',
  });

  const activeCount = items.filter((i: any) =>
    ['in progress', 'code review', 'qa', 'testing', 'uat']
      .includes(String(i.status ?? '').trim().toLowerCase())
  ).length;

  const epicList = ((metrics.epics ?? []) as any[])
    .filter(e => e.epic && e.epic !== 'No epic / parent' && e.epic !== 'No Parent')
    .slice(0, 6);

  const today = new Date().toLocaleDateString('en-US', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const kpis = [
    {
      label: 'Overall Done',
      val:   `${completionRate}%`,
      sub:   `${metrics.doneIssues} of ${metrics.totalIssues} items`,
      color: pctColor(completionRate),
      delay: 0,
    },
    {
      label: 'In Progress',
      val:   activeCount,
      sub:   'items being worked on now',
      color: '#7c3aed',
      delay: 60,
    },
    {
      label: 'Blocked',
      val:   metrics.blockedIssues ?? 0,
      sub:   metrics.blockedIssues > 0 ? 'require immediate action' : 'none blocked',
      color: metrics.blockedIssues > 0 ? '#dc2626' : '#16a34a',
      delay: 120,
    },
    {
      label: sp && sp.totalStoryPoints > 0 ? 'Story Points' : 'Quality Issues',
      val:   sp && sp.totalStoryPoints > 0
        ? `${sp.pointCompletionRate ?? 0}%`
        : (metrics.openDefects ?? 0),
      sub:   sp && sp.totalStoryPoints > 0
        ? `${sp.completedStoryPoints}/${sp.totalStoryPoints} pts`
        : (metrics.openDefects > 0 ? 'open defects' : 'no open defects'),
      color: sp && sp.totalStoryPoints > 0
        ? pctColor(sp.pointCompletionRate ?? 0)
        : (metrics.openDefects > 0 ? '#dc2626' : '#16a34a'),
      delay: 180,
    },
  ];

  return (
    <div className={styles.page}>

      {/* ── Toolbar — dark glass, screen only ── */}
      <nav className={styles.toolbar}>
        <Link href="/summary" className={styles.toolbarBack}>
          ← Back to Overview
        </Link>
        <div className={styles.toolbarRight}>
          <span className={styles.toolbarTag}>Stakeholder Report · External</span>
          <button
            type="button"
            className={styles.printBtn}
            onClick={() => window.print()}
          >
            Print / Save PDF
          </button>
        </div>
      </nav>

      {/* ── Dark canvas with floating paper card ── */}
      <div className={styles.outer}>
        <article className={styles.paper}>

          {/* ── Hero — full-bleed gradient, color-matched to health band ── */}
          <div
            className={styles.hero}
            style={{
              '--hero-gradient':     bandMeta.gradient,
              '--hero-print-bg':     bandMeta.printBg,
              '--hero-print-border': bandMeta.printBorder,
            } as CSSProperties}
          >
            <div className={styles.heroLeft}>
              <p className={styles.heroEyebrow}>Delivery Status Report</p>
              <h1 id="tour-header-customer" className={styles.heroTitle}>Project Delivery Summary</h1>
              <p className={styles.heroDate}>{today}</p>
              <div
                className={styles.heroStatusPill}
                style={{ '--pill-color': bandMeta.accentColor } as CSSProperties}
              >
                {bandMeta.label}
              </div>
              <p className={styles.heroHeadline}>{bandMeta.headline}</p>
              <p className={styles.heroBody}>
                {metrics.doneIssues ?? 0} of {metrics.totalIssues ?? 0} work items complete ({completionRate}% done).
                {prediction && !prediction.complete && prediction.daysRemaining != null && (
                  ` Estimated ${prediction.daysRemaining} day${prediction.daysRemaining !== 1 ? 's' : ''} to completion.`
                )}
                {prediction?.complete && ' All planned work items are complete.'}
                {confidence > 0 && ` ${confLabel(confidence)}.`}
              </p>
            </div>

            <div className={styles.heroRight}>
              <div className={styles.ringWrap}>
                <svg className={styles.ringSvg} viewBox="0 0 110 110">
                  <circle className={styles.ringBg} cx="55" cy="55" r={RING_R} />
                  <circle
                    className={styles.ringFill}
                    cx="55" cy="55"
                    r={RING_R}
                    style={{
                      '--ring-color':  bandMeta.accentColor,
                      '--ring-full':   `${RING_CIRC.toFixed(2)}`,
                      '--ring-offset': `${ringOffset.toFixed(2)}`,
                    } as CSSProperties}
                  />
                </svg>
                <div className={styles.ringCenter}>
                  <span className={styles.ringPct}>{completionRate}%</span>
                  <span className={styles.ringLabel}>complete</span>
                </div>
              </div>

              {confidence > 0 && (
                <div className={styles.confidenceWrap}>
                  <p className={styles.confidenceVal}>{Math.round(confidence)}%</p>
                  <p className={styles.confidenceLabel}>Delivery Confidence</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Paper body ── */}
          <div className={styles.body}>

            {/* Purpose note — screen only */}
            <div className={styles.purposeNote}>
              <span className={styles.purposeIcon} aria-hidden="true">ℹ️</span>
              <span>
                This report summarises current delivery status for stakeholder review — overall progress,
                customer-facing work, active risks, and delivery speed. No internal technical detail included.
              </span>
            </div>

            {/* ── Key metrics strip ── */}
            <div id="tour-section-customer-1" className={styles.metricsStrip}>
              {kpis.map(k => (
                <div
                  key={k.label}
                  className={styles.metricCard}
                  style={{ '--card-delay': `${k.delay}ms` } as CSSProperties}
                >
                  <p className={styles.metricLabel}>{k.label}</p>
                  <p
                    className={styles.metricVal}
                    style={{ '--metric-color': k.color } as CSSProperties}
                  >
                    {k.val}
                  </p>
                  <p className={styles.metricSub}>{k.sub}</p>
                </div>
              ))}
            </div>

            {/* ── Status distribution ── */}
            {distData.length > 0 && items.length > 0 && (
              <div className={styles.distCard}>
                <p className={styles.sectionHead} style={{ marginBottom: '14px' }}>Work Status Breakdown</p>
                <div className={styles.distBar}>
                  {distData.map(d => (
                    <div
                      key={d.label}
                      className={styles.distSeg}
                      style={{
                        '--seg-flex':  d.count,
                        '--seg-color': d.color,
                      } as CSSProperties}
                      title={`${d.label}: ${d.count} items (${d.pct}%)`}
                    />
                  ))}
                </div>
                <div className={styles.distLegend}>
                  {distData.map(d => (
                    <div key={d.label} className={styles.distLegendItem}>
                      <span
                        className={styles.distSwatch}
                        style={{ '--swatch-color': d.color } as CSSProperties}
                      />
                      <span className={styles.distLabel}>{d.label}</span>
                      <span className={styles.distCount}>{d.count} items · {d.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Customer-facing progress ── */}
            {totalCv > 0 && (
              <div className={styles.customerVisibleCard}>
                <div className={styles.cvHead}>
                  <span className={styles.cvLabel}>Customer-Facing Progress</span>
                  <span
                    className={styles.cvPct}
                    style={{ '--cv-color': pctColor(cvProgress) } as CSSProperties}
                  >
                    {Math.round(cvProgress)}%
                  </span>
                </div>
                <div className={styles.cvBarTrack}>
                  <div
                    className={styles.cvBarFill}
                    style={{
                      '--bar-w':    `${Math.min(cvProgress, 100)}%`,
                      '--cv-color':  pctColor(cvProgress),
                    } as CSSProperties}
                  />
                </div>
                <p className={styles.cvMeta}>
                  Work directly visible to customers — features and improvements users will experience when delivered.
                  {totalCv > 0 && ` ${totalCv} customer-facing item${totalCv !== 1 ? 's' : ''} tracked.`}
                </p>
              </div>
            )}

            {/* ── Estimated completion ── */}
            {prediction && !prediction.complete &&
              (prediction.predictedDate || prediction.daysRemaining != null) && (
              <div className={styles.section} style={{ '--section-delay': '90ms' } as CSSProperties}>
                <p className={styles.sectionHead}>Estimated Completion</p>
                <div className={styles.predictionCard}>
                  <div className={styles.predictionMain}>
                    {prediction.predictedDate && (
                      <p className={styles.predictionDate}>{prediction.predictedDate}</p>
                    )}
                    <p className={styles.predictionLabel}>
                      Estimated delivery date based on current velocity
                    </p>
                  </div>
                  {prediction.daysRemaining != null && (
                    <div className={styles.predictionStat}>
                      <p className={styles.predictionStatVal}>{prediction.daysRemaining}</p>
                      <p className={styles.predictionStatLabel}>Days remaining</p>
                    </div>
                  )}
                  {velocity > 0 && (
                    <div className={styles.predictionStat}>
                      <p className={styles.predictionStatVal}>{velocity.toFixed(1)}</p>
                      <p className={styles.predictionStatLabel}>Items/day</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Delivery speed ── */}
            {speedCards.length > 0 && (
              <div className={styles.section} style={{ '--section-delay': '95ms' } as CSSProperties}>
                <p className={styles.sectionHead}>Delivery Speed</p>
                <div className={styles.speedGrid}>
                  {speedCards.map((s, i) => (
                    <div
                      key={s.label}
                      className={styles.speedCard}
                      style={{ '--card-delay': `${i * 60}ms` } as CSSProperties}
                    >
                      <p className={styles.speedLabel}>{s.label}</p>
                      <p
                        className={styles.speedVal}
                        style={{ '--speed-color': s.color } as CSSProperties}
                      >
                        {s.val}
                      </p>
                      <p className={styles.speedSub}>{s.sub}</p>
                      {s.note && <p className={styles.speedNote}>{s.note}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Delivery areas ── */}
            {epicList.length > 0 && (
              <div className={styles.section} style={{ '--section-delay': '100ms' } as CSSProperties}>
                <p className={styles.sectionHead}>Delivery Areas</p>
                <div className={styles.epicList}>
                  {epicList.map((epic: any, i: number) => {
                    const pct = Math.max(0, Math.min(100, epic.progress ?? 0));
                    const hc  = epicHealthColors(epic.critical ?? 0, epic.warning ?? 0);
                    return (
                      <div
                        key={epic.epic}
                        className={styles.epicCard}
                        style={{
                          '--epic-color': hc.color,
                          '--epic-delay': `${i * 60}ms`,
                        } as CSSProperties}
                      >
                        <div className={styles.epicTop}>
                          <span className={styles.epicName}>{epic.epic}</span>
                          <span
                            className={styles.epicHealthChip}
                            style={{ '--chip-bg': hc.bg, '--chip-fg': hc.fg } as CSSProperties}
                          >
                            {hc.label}
                          </span>
                          <span className={styles.epicPct}>{pct}%</span>
                        </div>
                        <div className={styles.epicBarTrack}>
                          <div
                            className={styles.epicBarFill}
                            style={{
                              '--bar-w':      `${pct}%`,
                              '--epic-color': hc.color,
                              '--epic-delay': `${i * 60}ms`,
                            } as CSSProperties}
                          />
                        </div>
                        <div className={styles.epicMeta}>
                          <span>{epic.completedIssues ?? 0} of {epic.issues ?? 0} items complete</span>
                          {(epic.critical ?? 0) > 0 && (
                            <span className={styles.epicMetaAlert}>
                              {epic.critical} item{epic.critical > 1 ? 's' : ''} at risk
                            </span>
                          )}
                          {(epic.storyPoints ?? 0) > 0 && (
                            <span>{epic.doneStoryPoints ?? 0}/{epic.storyPoints} pts</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Current risks ── */}
            <div className={styles.section} style={{ '--section-delay': '120ms' } as CSSProperties}>
              <p id="tour-section-customer-2" className={styles.sectionHead}>Current Risks</p>
              {riskList.length === 0 ? (
                <div className={styles.noRiskCard}>
                  ✓ No significant delivery risks identified at this time.
                </div>
              ) : (
                <div className={styles.riskList}>
                  {riskList.map((r, i) => (
                    <div key={i} className={styles.riskCard} data-level={r.level}>
                      <span className={styles.riskIcon} aria-hidden="true">{r.icon}</span>
                      <div className={styles.riskBody}>
                        <p className={styles.riskLevel}>
                          {r.level === 'high'
                            ? 'High Priority'
                            : r.level === 'medium' ? 'Medium Priority' : 'Low Priority'}
                        </p>
                        <p className={styles.riskText}>{r.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Key highlights ── */}
            {(metrics.insights ?? []).length > 0 && (
              <div className={styles.section} style={{ '--section-delay': '140ms' } as CSSProperties}>
                <p className={styles.sectionHead}>Key Highlights</p>
                <div className={styles.insightCard}>
                  {(metrics.insights ?? []).slice(0, 5).map((ins: string, i: number) => (
                    <div key={i} className={styles.insightItem}>
                      <span className={styles.insightDot} aria-hidden="true" />
                      {ins}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>{/* end .body */}

          {/* ── Footer — dark band closing the paper ── */}
          <footer className={styles.footer}>
            <p className={styles.footerText}>
              Generated by <strong>Delivery Clarity</strong> · {today}
            </p>
            <p className={styles.footerNote}>
              Delivery summary for stakeholder review. Internal issue details are not included.
            </p>
          </footer>

        </article>
      </div>

    </div>
  );
}
