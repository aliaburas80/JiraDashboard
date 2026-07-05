// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
'use client';

import { useCountUp } from '../hooks/useCountUp';
import type { CSSVariableProperties } from '../lib/cssVars';
import styles from './DashboardPreview.module.scss';

const RING_KPIS = [
  { label: 'Completion Rate',    target: 86, color: '#22c55e' },
  { label: 'Data Quality Score', target: 92, color: '#8b5cf6' },
  { label: 'Team Health Score',  target: 86, color: '#f97316' },
] as const;

const VALUE_KPIS = [
  { label: 'Cycle Time',           value: '4.2 days' },
  { label: 'Blocked Items',        value: '23' },
  { label: 'Release Confidence',   value: '78%' },
] as const;

const LINE_POINTS = 'M0,60 L30,50 L60,54 L90,34 L120,38 L150,18 L180,24 L210,6';
const RISK_LINE_POINTS = 'M0,60 L30,54 L60,58 L90,40 L120,44 L150,28 L180,20 L210,10';
const AREA_LINE_POINTS = 'M0,50 L30,42 L60,44 L90,26 L120,30 L150,16 L180,20 L210,8';
const BARS = [45, 70, 55, 85, 65, 95, 75, 60];

function RingTile({ kpi, active }: { kpi: typeof RING_KPIS[number]; active: boolean }) {
  const value = useCountUp(kpi.target, active, 1.3);
  // DYNAMIC CSS VARIABLE: each ring's fill percentage and color are data-driven.
  const variables: CSSVariableProperties = { '--ring-percent': `${value}%`, '--ring-color': kpi.color };
  return (
    <div className={styles.kpiTile}>
      <div className={styles.ring} style={variables}>
        <span className={styles.ringInner}>{Math.round(value)}%</span>
      </div>
      <p className={styles.kpiLabel}>{kpi.label}</p>
    </div>
  );
}

export default function DashboardPreview() {
  const active = true;

  return (
    <section id="dashboard-preview" className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>A preview of what your export becomes</h2>
        <p className={styles.subtitle}>Real metrics. Real insights. Ready before your standup.</p>
      </div>

      <div className={styles.panel}>
        <div className={styles.kpiGrid}>
          <RingTile kpi={RING_KPIS[0]} active={active} />
          {VALUE_KPIS.map(k => (
            <div key={k.label} className={styles.kpiTile}>
              <p className={styles.kpiValue}>{k.value}</p>
              <p className={styles.kpiLabel}>{k.label}</p>
            </div>
          ))}
          <RingTile kpi={RING_KPIS[1]} active={active} />
          <RingTile kpi={RING_KPIS[2]} active={active} />
        </div>

        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <p className={styles.chartLabel}>Sprint Progress</p>
            <svg viewBox="0 0 210 64" className={styles.chartSvg} preserveAspectRatio="none">
              <path d={LINE_POINTS} className={styles.linePath} />
            </svg>
          </div>

          <div className={styles.chartCard}>
            <p className={styles.chartLabel}>Work Item Flow</p>
            <div className={styles.barsRow}>
              {BARS.map((h, i) => {
                // DYNAMIC CSS VARIABLE: each bar's height is a data value.
                const variables: CSSVariableProperties = { '--bar-height': `${h}%` };
                return <span key={i} className={styles.bar} style={variables} />;
              })}
            </div>
          </div>

          <div className={styles.chartCard}>
            <p className={styles.chartLabel}>Cumulative Flow</p>
            <svg viewBox="0 0 210 64" className={styles.chartSvg} preserveAspectRatio="none">
              <defs>
                <linearGradient id="dcAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={`${AREA_LINE_POINTS} L210,64 L0,64 Z`} className={styles.areaFill} />
              <path d={AREA_LINE_POINTS} className={styles.areaLine} />
            </svg>
          </div>

          <div className={styles.chartCard}>
            <p className={styles.chartLabel}>Risks Over Time</p>
            <svg viewBox="0 0 210 64" className={styles.chartSvg} preserveAspectRatio="none">
              <path d={RISK_LINE_POINTS} className={styles.riskLinePath} />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
