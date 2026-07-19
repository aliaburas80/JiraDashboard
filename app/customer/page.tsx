// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// /customer — External stakeholder delivery report. No jargon. Print-ready.
'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loadMetricsWithSource } from '@/lib/storage';
import { redirectWithLoadError } from '@/lib/loadErrorSignal';
import { getHealthBand, type HealthBand } from '@/lib/utils';
import { exportCustomerReportToCsv } from '@/services/export/customerReportExport.service';
import type { DashboardMetrics } from '@/types/metrics';
import styles from './page.module.scss';

// Colors for each health band (gradient, accent, print bg/border) are
// resolved in SCSS from data-band (CLAUDE.md §28); this only supplies text.
const BAND_META: Record<HealthBand, { label: string; headline: string }> = {
  excellent: { label: 'On Track',        headline: 'Delivery is on track and performing excellently.' },
  good:      { label: 'Progressing',     headline: 'Delivery is progressing well with minor risks to monitor.' },
  moderate:  { label: 'Needs Attention', headline: 'Delivery is progressing but has areas that need attention.' },
  'at-risk': { label: 'At Risk',         headline: 'Delivery has risks that require prompt action to stay on track.' },
  critical:  { label: 'Critical',        headline: 'Delivery requires immediate attention and leadership escalation.' },
};

// Status distribution — color resolved in SCSS from data-status.
const STATUS_ORDER: Record<string, number> = {
  'To Do': 0, 'In Progress': 1, 'Blocked': 2, 'Done': 3,
};

// Ring: r=44, viewBox 0 0 110 110
const RING_R    = 44;
const RING_CIRC = 2 * Math.PI * RING_R; // ≈ 276.46

type Tier = 'good' | 'warning' | 'critical';

function pctTier(pct: number): Tier {
  if (pct >= 70) return 'good';
  if (pct >= 40) return 'warning';
  return 'critical';
}

function speedTier(days: number, goodMax: number, warnMax: number): Tier {
  if (days <= goodMax) return 'good';
  if (days <= warnMax) return 'warning';
  return 'critical';
}

function confLabel(conf: number): string {
  if (conf >= 80) return 'High Delivery Confidence';
  if (conf >= 50) return 'Medium Delivery Confidence';
  return 'Low Delivery Confidence';
}

function epicHealth(critical: number, warning: number): { tier: Tier; label: string } {
  if (critical > 0) return { tier: 'critical', label: 'At Risk' };
  if (warning  > 0) return { tier: 'warning',  label: 'Needs Attention' };
  return                  { tier: 'good',     label: 'On Track' };
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
        pct: Math.round((count / total) * 100),
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
      tier:  speedTier(cycleTime, 7, 14),
      delay: 0,
    },
    leadTime > 0 && {
      label: 'Avg Lead Time',
      val:   `${leadTime.toFixed(1)}d`,
      sub:   'from request to done',
      note:  undefined,
      tier:  speedTier(leadTime, 14, 28),
      delay: 60,
    },
    velocity > 0 && {
      label: 'Daily Velocity',
      val:   `${velocity.toFixed(1)}`,
      sub:   'items completed/day',
      note:  undefined,
      tier:  'info' as const,
      delay: 120,
    },
  ].filter(Boolean) as { label: string; val: string; sub: string; note?: string; tier: Tier | 'info'; delay: number }[];

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

  const kpis: { label: string; val: string | number; sub: string; tier: Tier | 'info'; delay: number }[] = [
    {
      label: 'Overall Done',
      val:   `${completionRate}%`,
      sub:   `${metrics.doneIssues} of ${metrics.totalIssues} items`,
      tier:  pctTier(completionRate),
      delay: 0,
    },
    {
      label: 'In Progress',
      val:   activeCount,
      sub:   'items being worked on now',
      tier:  'info',
      delay: 60,
    },
    {
      label: 'Blocked',
      val:   metrics.blockedIssues ?? 0,
      sub:   metrics.blockedIssues > 0 ? 'require immediate action' : 'none blocked',
      tier:  metrics.blockedIssues > 0 ? 'critical' : 'good',
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
      tier: sp && sp.totalStoryPoints > 0
        ? pctTier(sp.pointCompletionRate ?? 0)
        : (metrics.openDefects > 0 ? 'critical' : 'good'),
      delay: 180,
    },
  ];

  const exportData = {
    kpis: kpis.map(k => ({ label: k.label, val: k.val, sub: k.sub })),
    statusDistribution: distData,
    epics: epicList.map((epic: any) => ({
      epic: epic.epic,
      healthLabel: epicHealth(epic.critical ?? 0, epic.warning ?? 0).label,
      progress: Math.max(0, Math.min(100, epic.progress ?? 0)),
      completedIssues: epic.completedIssues ?? 0,
      issues: epic.issues ?? 0,
      critical: epic.critical ?? 0,
    })),
    risks: riskList.map(r => ({ level: r.level, text: r.text })),
  };

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
            className={styles.exportBtn}
            onClick={() => exportCustomerReportToCsv(exportData)}
          >
            Export CSV
          </button>
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
          <div className={styles.hero} data-band={band}>
            <div className={styles.heroLeft}>
              <p className={styles.heroEyebrow}>Delivery Status Report</p>
              <h1 id="tour-header-customer" className={styles.heroTitle}>Project Delivery Summary</h1>
              <p className={styles.heroDate}>{today}</p>
              <div className={styles.heroStatusPill} data-band={band}>
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
                    data-band={band}
                    cx="55" cy="55"
                    r={RING_R}
                    style={{
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
                  <p className={styles.metricVal} data-tier={k.tier}>
                    {k.val}
                  </p>
                  <p className={styles.metricSub}>{k.sub}</p>
                </div>
              ))}
            </div>

            {/* ── Status distribution ── */}
            {distData.length > 0 && items.length > 0 && (
              <div className={styles.distCard}>
                <p className={styles.sectionHead}>Work Status Breakdown</p>
                <div className={styles.distBar}>
                  {distData.map(d => (
                    <div
                      key={d.label}
                      className={styles.distSeg}
                      data-status={d.label}
                      style={{ '--seg-flex': d.count } as CSSProperties}
                      title={`${d.label}: ${d.count} items (${d.pct}%)`}
                    />
                  ))}
                </div>
                <div className={styles.distLegend}>
                  {distData.map(d => (
                    <div key={d.label} className={styles.distLegendItem}>
                      <span className={styles.distSwatch} data-status={d.label} />
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
                  <span className={styles.cvPct} data-tier={pctTier(cvProgress)}>
                    {Math.round(cvProgress)}%
                  </span>
                </div>
                <div className={styles.cvBarTrack}>
                  <div
                    className={styles.cvBarFill}
                    data-tier={pctTier(cvProgress)}
                    style={{ '--bar-w': `${Math.min(cvProgress, 100)}%` } as CSSProperties}
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
                      <p className={styles.speedVal} data-tier={s.tier}>
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
                    const hc  = epicHealth(epic.critical ?? 0, epic.warning ?? 0);
                    return (
                      <div
                        key={epic.epic}
                        className={styles.epicCard}
                        data-tier={hc.tier}
                        style={{ '--epic-delay': `${i * 60}ms` } as CSSProperties}
                      >
                        <div className={styles.epicTop}>
                          <span className={styles.epicName}>{epic.epic}</span>
                          <span className={styles.epicHealthChip} data-tier={hc.tier}>
                            {hc.label}
                          </span>
                          <span className={styles.epicPct} data-tier={hc.tier}>{pct}%</span>
                        </div>
                        <div className={styles.epicBarTrack}>
                          <div
                            className={styles.epicBarFill}
                            data-tier={hc.tier}
                            style={{
                              '--bar-w':      `${pct}%`,
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
