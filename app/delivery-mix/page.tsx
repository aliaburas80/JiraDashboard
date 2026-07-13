// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// /delivery-mix — Issue type breakdown: distribution, completion, health, cycle times.
'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import AppShell from '@/components/layout/AppShell';
import { loadMetricsWithSource } from '@/lib/storage';
import { redirectWithLoadError } from '@/lib/loadErrorSignal';
import type { DashboardMetrics } from '@/types/metrics';
import styles from './page.module.scss';

// ── Donut geometry (r = 40, viewBox 0 0 100 100, cx/cy = 50) ─────────────────
const DONUT_R    = 40;
const DONUT_CIRC = 2 * Math.PI * DONUT_R; // ≈ 251.3

// ── Semantic type categorisation ──────────────────────────────────────────────
type Category = 'feature' | 'bug' | 'test' | 'task' | 'epic' | 'spike' | 'other';

function typeCategory(name: string): Category {
  const n = name.toLowerCase();
  if (['story', 'feature', 'improvement', 'user story', 'enhancement'].some(k => n.includes(k))) return 'feature';
  if (['bug', 'defect', 'incident', 'problem'].some(k => n.includes(k))) return 'bug';
  if (['test', 'qa', 'quality', 'verification'].some(k => n.includes(k))) return 'test';
  if (['task', 'sub-task', 'subtask', 'chore', 'work item'].some(k => n.includes(k))) return 'task';
  if (n.trim() === 'epic') return 'epic';
  if (['spike', 'research', 'discovery', 'investigation'].some(k => n.includes(k))) return 'spike';
  return 'other';
}

// EXCEPTION: colors are data-driven from semantic category
const CAT: Record<Category, { color: string; bg: string; fg: string; label: string; desc: string }> = {
  feature: { color: '#2563eb', bg: '#dbeafe', fg: '#1e40af', label: 'Feature',  desc: 'Value-adding work shipped to users — stories, features, and improvements.' },
  bug:     { color: '#dc2626', bg: '#fee2e2', fg: '#991b1b', label: 'Bug',      desc: 'Reactive fixes — bugs and defects that reduce quality and slow delivery.' },
  test:    { color: '#7c3aed', bg: '#ede9fe', fg: '#5b21b6', label: 'Test',     desc: 'Quality investment — test cases and QA tasks that protect future velocity.' },
  task:    { color: '#16a34a', bg: '#dcfce7', fg: '#15803d', label: 'Task',     desc: 'Operational and delivery tasks — the backbone of day-to-day sprint work.' },
  epic:    { color: '#d97706', bg: '#fef9c3', fg: '#92400e', label: 'Epic',     desc: 'High-level initiative trackers grouping related work under a shared goal.' },
  spike:   { color: '#0891b2', bg: '#cffafe', fg: '#0e7490', label: 'Spike',    desc: 'Research and investigation — time-boxed discovery to reduce uncertainty.' },
  other:   { color: '#94a3b8', bg: '#f1f5f9', fg: '#475569', label: 'Other',    desc: 'Unclassified issue types — consider normalising for better reporting.' },
};

function pctColor(pct: number): string {
  if (pct >= 70) return '#16a34a';
  if (pct >= 40) return '#d97706';
  return '#dc2626';
}

// ── TypeEntry shape (from metrics.service.ts) ─────────────────────────────────
interface TypeEntry {
  type:                string;
  count:               number;
  done:                number;
  completionRate:      number;
  storyPoints:         number;
  good:                number;
  warning:             number;
  critical:            number;
  averageCycleTimeDays: number;
  averageLeadTimeDays:  number;
  cycleTimeSampleSize:  number;
  leadTimeSampleSize:   number;
}

// ── Animated donut arc ────────────────────────────────────────────────────────
function DonutArc({
  segLen, offset, color, delay,
}: { segLen: number; offset: number; color: string; delay: number }) {
  return (
    <circle
      className={styles.donutArc}
      cx="50" cy="50"
      r={DONUT_R}
      style={{
        '--arc-len':    segLen.toFixed(2),
        '--arc-circ':   DONUT_CIRC.toFixed(2),
        // EXCEPTION: negative offset positions each arc segment clockwise after previous
        '--arc-offset': (-offset).toFixed(2),
        '--arc-color':   color,
        '--arc-delay':  `${delay}ms`,
      } as CSSProperties}
    />
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function DeliveryMixPage() {
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

  if (!metrics) return null;

  // ── Data ──────────────────────────────────────────────────────────────────
  const typeEntries = ((metrics.types ?? []) as TypeEntry[])
    .filter(t => t.count > 0)
    .sort((a, b) => b.count - a.count);

  const total       = typeEntries.reduce((s, t) => s + t.count, 0) || 1;
  const totalDone   = typeEntries.reduce((s, t) => s + t.done, 0);
  const totalSP     = typeEntries.reduce((s, t) => s + (t.storyPoints ?? 0), 0);
  const totalGood   = typeEntries.reduce((s, t) => s + (t.good ?? 0), 0);
  const totalWarn   = typeEntries.reduce((s, t) => s + (t.warning ?? 0), 0);
  const totalCrit   = typeEntries.reduce((s, t) => s + (t.critical ?? 0), 0);
  const overallComp = Math.round((totalDone / total) * 100);

  // ── Categorise types ──────────────────────────────────────────────────────
  type EnrichedType = TypeEntry & { cat: Category; pct: number };
  const enriched: EnrichedType[] = typeEntries.map(t => ({
    ...t,
    cat: typeCategory(t.type),
    pct: Math.round((t.count / total) * 100),
  }));

  // Category totals
  const catCount = (cat: Category) => enriched.filter(t => t.cat === cat).reduce((s, t) => s + t.count, 0);
  const featureCount = catCount('feature');
  const bugCount     = catCount('bug');
  const testCount    = catCount('test');
  const taskCount    = catCount('task');
  const spikeCount   = catCount('spike');
  const bugRatio     = Math.round((bugCount / total) * 100);
  const featurePct   = Math.round((featureCount / total) * 100);

  // ── Donut arcs ────────────────────────────────────────────────────────────
  let cumLen = 0;
  const arcs = enriched.map((t, i) => {
    const segLen = (t.count / total) * DONUT_CIRC;
    const arc    = { ...t, segLen, offset: cumLen, delay: i * 70 };
    cumLen += segLen;
    return arc;
  });

  // ── Work mix signal ───────────────────────────────────────────────────────
  const mixLabel  = bugRatio > 30 ? 'High Bug Ratio' : featurePct < 20 && featureCount > 0 ? 'Low Feature Work' : 'Balanced Mix';
  const mixTone   = bugRatio > 30 ? { bg: '#fee2e2', fg: '#b91c1c' } : featurePct < 20 && featureCount > 0 ? { bg: '#fef9c3', fg: '#92400e' } : { bg: '#dcfce7', fg: '#15803d' };
  const mixSubtitle = bugRatio > 30
    ? `${bugRatio}% of work is bugs or defects. High maintenance load — consider investing in quality to reduce reactive work.`
    : featureCount === 0
    ? `No feature work (stories/improvements) found. All ${total} issues are tasks, bugs, or other types.`
    : `${featurePct}% feature work, ${bugRatio}% bugs. ${totalSP > 0 ? `${totalSP} story points tracked across ${typeEntries.length} types.` : `${typeEntries.length} issue types in scope.`}`;

  // Most critical type
  const mostCritType = [...enriched].sort((a, b) => (b.critical ?? 0) - (a.critical ?? 0))[0];

  // ── KPI strip ─────────────────────────────────────────────────────────────
  const kpis = [
    { label: 'Total Issues',   val: total,          sub: `${typeEntries.length} types`,          color: 'var(--color-text-primary,#0f172a)', delay: 0   },
    { label: 'Overall Done',   val: `${overallComp}%`, sub: `${totalDone} of ${total} done`,     color: pctColor(overallComp),              delay: 40  },
    { label: 'Feature Work',   val: `${featurePct}%`, sub: `${featureCount} stories/features`,   color: featurePct > 0 ? CAT.feature.color : '#94a3b8', delay: 80  },
    { label: 'Bug Ratio',      val: `${bugRatio}%`,  sub: `${bugCount} bugs/defects`,            color: bugRatio > 30 ? '#dc2626' : bugRatio > 0 ? '#d97706' : '#94a3b8', delay: 120 },
    { label: 'Test Work',      val: `${Math.round((testCount / total) * 100)}%`, sub: `${testCount} test cases`, color: testCount > 0 ? CAT.test.color : '#94a3b8', delay: 160 },
    { label: 'Story Points',   val: totalSP > 0 ? totalSP : '—', sub: 'total SP in scope',      color: 'var(--color-text-primary,#0f172a)', delay: 200 },
    { label: 'Critical Items', val: totalCrit,       sub: 'need immediate action',               color: totalCrit > 0 ? '#dc2626' : '#94a3b8', delay: 240 },
    { label: 'Healthy Items',  val: `${Math.round((totalGood / Math.max(totalGood + totalWarn + totalCrit, 1)) * 100)}%`, sub: 'good health signal', color: '#16a34a', delay: 280 },
  ];

  // ── Analysis items (right card) ───────────────────────────────────────────
  const analysisCats: { cat: Category; count: number; pct: number }[] = (
    ['feature', 'bug', 'task', 'test', 'epic', 'spike', 'other'] as Category[]
  ).map(cat => ({ cat, count: catCount(cat), pct: Math.round((catCount(cat) / total) * 100) }))
   .filter(x => x.count > 0);

  function catSignal(cat: Category, count: number): { text: string; color: string } {
    if (cat === 'bug' && bugRatio > 30) return { text: `${bugRatio}% is above the 30% threshold — quality may be suffering.`, color: '#dc2626' };
    if (cat === 'bug' && bugRatio > 0)  return { text: `Bug ratio is manageable. Monitor for upward trends.`, color: '#d97706' };
    if (cat === 'feature' && featurePct < 20) return { text: 'Low feature throughput — more capacity going to maintenance.', color: '#d97706' };
    if (cat === 'feature' && featurePct >= 50) return { text: 'Strong feature delivery focus — good for product velocity.', color: '#16a34a' };
    if (cat === 'test' && count === 0)  return { text: 'No test work tracked — consider adding QA tasks.', color: '#d97706' };
    if (cat === 'test' && count > 0)    return { text: 'Test coverage is being tracked. Keep it growing.', color: '#16a34a' };
    if (cat === 'spike' && count > 0)   return { text: 'Investigation work suggests uncertainty in scope. Time-box spikes.', color: '#d97706' };
    if (cat === 'other' && count > 0)   return { text: 'Normalise these types for accurate reporting.', color: '#d97706' };
    return { text: 'No additional signals.', color: '#94a3b8' };
  }

  return (
    <AppShell showNav>
      <div className={styles.page}>

        {/* ── Header ── */}
        <div className={styles.header}>
          <div className={styles.eyebrow}>
            <span className={styles.eyebrowLine} />
            Delivery
          </div>
          <h1 id="tour-header-delivery-mix" className={styles.title}>Delivery Mix</h1>
          <p className={styles.subtitle}>{mixSubtitle}</p>
          <div className={styles.chips}>
            <span
              className={styles.chip}
              style={{ '--chip-bg': mixTone.bg, '--chip-fg': mixTone.fg } as CSSProperties}
            >
              {mixLabel}
            </span>
            <span
              className={styles.chip}
              style={{ '--chip-bg': '#f1f5f9', '--chip-fg': '#475569' } as CSSProperties}
            >
              {typeEntries.length} issue types
            </span>
            {totalSP > 0 && (
              <span
                className={styles.chip}
                style={{ '--chip-bg': '#dbeafe', '--chip-fg': '#1e40af' } as CSSProperties}
              >
                {totalSP} story points
              </span>
            )}
          </div>
        </div>

        {/* ── Why this page ── */}
        <div className={styles.purposeBanner}>
          {[
            {
              icon: '📊',
              title: 'What is delivery mix?',
              desc:  'The proportion of different work types — features, bugs, tasks, tests — currently in your backlog. It shows how your team is spending its capacity.',
              delay: 0,
            },
            {
              icon: '🎯',
              title: 'Why does it matter?',
              desc:  'A healthy mix means you are shipping value (features), controlling quality debt (bugs), and investing in long-term stability (tests). An imbalanced mix signals a delivery risk.',
              delay: 60,
            },
            {
              icon: '✅',
              title: 'What decisions does it drive?',
              desc:  'High bug ratio → investigate quality. No features → team stuck in maintenance mode. No tests → quality risk building. Use this page to rebalance sprint planning.',
              delay: 120,
            },
          ].map(b => (
            <div key={b.title} className={styles.purposeBlock} style={{ '--block-delay': `${b.delay}ms` } as CSSProperties}>
              <span className={styles.purposeBlockIcon} aria-hidden="true">{b.icon}</span>
              <p className={styles.purposeBlockTitle}>{b.title}</p>
              <p className={styles.purposeBlockDesc}>{b.desc}</p>
            </div>
          ))}
        </div>

        {/* ── KPI strip ── */}
        <div className={styles.kpiStrip}>
          {kpis.map(k => (
            <div key={k.label} className={styles.kpiCard} style={{ '--kpi-delay': `${k.delay}ms` } as CSSProperties}>
              <p className={styles.kpiLabel}>{k.label}</p>
              <p className={styles.kpiVal} style={{ '--kpi-color': k.color } as CSSProperties}>{k.val}</p>
              <p className={styles.kpiSub}>{k.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Body: donut + analysis ── */}
        <div className={styles.body}>

          {/* LEFT: animated donut + rich legend */}
          <div className={styles.card} style={{ '--card-delay': '60ms' } as CSSProperties}>
            <div id="tour-section-delivery-mix-1" className={styles.cardHead}>
              <span className={styles.cardTitle}>Issue Type Distribution</span>
              <span className={styles.cardBadge}>{total} issues · {typeEntries.length} types</span>
            </div>

            <div className={styles.donutSection}>
              {/* SVG donut */}
              <div className={styles.donutWrap}>
                <svg className={styles.donutSvg} viewBox="0 0 100 100" aria-label="Issue type distribution">
                  <circle className={styles.donutTrack} cx="50" cy="50" r={DONUT_R} />
                  {arcs.map(arc => (
                    <DonutArc
                      key={arc.type}
                      segLen={arc.segLen}
                      offset={arc.offset}
                      color={CAT[arc.cat].color}
                      delay={arc.delay}
                    />
                  ))}
                </svg>
                <div className={styles.donutCenter}>
                  <span className={styles.donutTotal}>{total}</span>
                  <span className={styles.donutSub}>issues</span>
                </div>
              </div>

              {/* Rich legend */}
              <div className={styles.donutLegend}>
                {enriched.map((t, i) => {
                  const c = CAT[t.cat];
                  return (
                    <div
                      key={t.type}
                      className={styles.legendRow}
                      style={{
                        '--swatch-color': c.color,
                        '--row-delay':    `${i * 60 + 200}ms`,
                      } as CSSProperties}
                    >
                      <span className={styles.legendSwatch} />
                      <div className={styles.legendBody}>
                        <p className={styles.legendName}>{t.type}</p>
                        <span
                          className={styles.legendCatChip}
                          style={{ '--cat-bg': c.bg, '--cat-fg': c.fg } as CSSProperties}
                        >
                          {c.label}
                        </span>
                        <div className={styles.legendCompRow}>
                          <div className={styles.legendCompTrack}>
                            <div
                              className={styles.legendCompFill}
                              style={{
                                '--bar-w':    `${t.completionRate}%`,
                                '--row-delay': `${i * 60 + 200}ms`,
                              } as CSSProperties}
                            />
                          </div>
                          <span
                            className={styles.legendCompPct}
                            style={{ '--pct-color': pctColor(t.completionRate) } as CSSProperties}
                          >
                            {t.completionRate}%
                          </span>
                        </div>
                      </div>
                      <div className={styles.legendRight}>
                        <p className={styles.legendCount} style={{ '--row-delay': `${i * 60 + 200}ms` } as CSSProperties}>
                          {t.count}
                        </p>
                        <p className={styles.legendPct}>{t.pct}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: Work mix analysis */}
          <div className={styles.card} style={{ '--card-delay': '80ms' } as CSSProperties}>
            <div id="tour-section-delivery-mix-2" className={styles.cardHead}>
              <span className={styles.cardTitle}>Work Mix Analysis</span>
              <span className={styles.cardBadge}>what your mix says</span>
            </div>
            <div className={styles.analysisBody}>
              {analysisCats.map((x, i) => {
                const c      = CAT[x.cat];
                const signal = catSignal(x.cat, x.count);
                const typeRow = enriched.filter(t => t.cat === x.cat);
                const catGood = typeRow.reduce((s, t) => s + (t.good ?? 0), 0);
                const catWarn = typeRow.reduce((s, t) => s + (t.warning ?? 0), 0);
                const catCrit = typeRow.reduce((s, t) => s + (t.critical ?? 0), 0);

                return (
                  <div
                    key={x.cat}
                    className={styles.analysisItem}
                    style={{
                      '--cat-color':  c.color,
                      '--item-delay': `${i * 60}ms`,
                    } as CSSProperties}
                  >
                    <div className={styles.analysisItemHead}>
                      <span className={styles.analysisItemLabel}>{c.label} Work</span>
                      <span
                        className={styles.analysisItemCount}
                        style={{ '--cat-color': c.color } as CSSProperties}
                      >
                        {x.count} · {x.pct}%
                      </span>
                    </div>
                    <p className={styles.analysisItemDesc}>{c.desc}</p>
                    <p
                      className={styles.analysisItemSignal}
                      style={{ '--signal-color': signal.color } as CSSProperties}
                    >
                      {signal.text}
                    </p>
                    {(catGood + catWarn + catCrit) > 0 && (
                      <div className={styles.healthDots}>
                        {catGood > 0  && <span className={styles.healthDot} data-h="good">{catGood} on track</span>}
                        {catWarn > 0  && <span className={styles.healthDot} data-h="warning">{catWarn} at risk</span>}
                        {catCrit > 0  && <span className={styles.healthDot} data-h="critical">{catCrit} critical</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Type health table ── */}
        <div className={clsx(styles.card, styles.tableCard)}>
          <div className={styles.cardHead}>
            <span className={styles.cardTitle}>Type Detail Table</span>
            <span className={styles.cardBadge}>completion · health · cycle time per type</span>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {['Issue Type', 'Count', 'Done', 'Completion', 'Health split', 'Story Pts', 'Avg Cycle', 'Avg Lead'].map(h => (
                    <th key={h} className={styles.tableTh}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {enriched.map((t, i) => {
                  const c      = CAT[t.cat];
                  const cycleOk = (t.cycleTimeSampleSize ?? 0) > 0;
                  const leadOk  = (t.leadTimeSampleSize  ?? 0) > 0;
                  const cycleColor = t.averageCycleTimeDays > 14 ? '#dc2626' : t.averageCycleTimeDays > 7 ? '#d97706' : '#16a34a';

                  return (
                    <tr
                      key={t.type}
                      className={styles.tableTr}
                      style={{ '--row-color': c.color, '--row-delay': `${i * 40}ms` } as CSSProperties}
                    >
                      {/* Type name + category chip */}
                      <td className={styles.tableTd}>
                        <p className={styles.tableTypeName}>{t.type}</p>
                        <span
                          className={styles.tableCatChip}
                          style={{ '--cat-bg': c.bg, '--cat-fg': c.fg } as CSSProperties}
                        >
                          {c.label}
                        </span>
                      </td>

                      {/* Count */}
                      <td className={styles.tableTd}>
                        <p className={styles.tableCount}>{t.count}</p>
                        <p className={styles.tableDone}>{t.pct}% of total</p>
                      </td>

                      {/* Done */}
                      <td className={styles.tableTd}>
                        <p className={styles.tableDoneVal}>{t.done}</p>
                        <p className={styles.tableDone}>{t.count - t.done} open</p>
                      </td>

                      {/* Completion bar */}
                      <td className={styles.tableTd}>
                        <div className={styles.tableCompCell}>
                          <div className={styles.tableCompTrack}>
                            <div
                              className={styles.tableCompFill}
                              style={{
                                '--bar-w':    `${t.completionRate}%`,
                                '--row-delay': `${i * 40}ms`,
                              } as CSSProperties}
                            />
                          </div>
                          <span
                            className={styles.tableCompPct}
                            style={{ '--pct-color': pctColor(t.completionRate) } as CSSProperties}
                          >
                            {t.completionRate}%
                          </span>
                        </div>
                      </td>

                      {/* Health split */}
                      <td className={styles.tableTd}>
                        <div className={styles.tableHealthSplit}>
                          {(t.good ?? 0) > 0    && <span className={styles.tableHealthDot} data-h="good">{t.good}</span>}
                          {(t.warning ?? 0) > 0  && <span className={styles.tableHealthDot} data-h="warning">{t.warning}</span>}
                          {(t.critical ?? 0) > 0 && <span className={styles.tableHealthDot} data-h="critical">{t.critical}</span>}
                          {(t.good ?? 0) === 0 && (t.warning ?? 0) === 0 && (t.critical ?? 0) === 0 && (
                            <span className={styles.tableEmpty}>—</span>
                          )}
                        </div>
                      </td>

                      {/* Story points */}
                      <td className={styles.tableTd}>
                        {(t.storyPoints ?? 0) > 0
                          ? <span className={styles.tableSP}>{t.storyPoints} SP</span>
                          : <span className={styles.tableEmpty}>—</span>}
                      </td>

                      {/* Avg cycle time */}
                      <td className={styles.tableTd}>
                        {cycleOk
                          ? <span className={styles.tableCycleTime} style={{ '--cycle-color': cycleColor } as CSSProperties}>{t.averageCycleTimeDays.toFixed(1)}d</span>
                          : <span className={styles.tableEmpty}>—</span>}
                      </td>

                      {/* Avg lead time */}
                      <td className={styles.tableTd}>
                        {leadOk
                          ? <span
                              className={styles.tableCycleTime}
                              style={{ '--cycle-color': t.averageLeadTimeDays > 21 ? '#dc2626' : t.averageLeadTimeDays > 10 ? '#d97706' : '#16a34a' } as CSSProperties}
                            >
                              {t.averageLeadTimeDays.toFixed(1)}d
                            </span>
                          : <span className={styles.tableEmpty}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
