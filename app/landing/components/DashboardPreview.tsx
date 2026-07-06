// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
'use client';

import { useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGsapContext } from '../hooks/useGsapContext';
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
  const sectionRef  = useRef<HTMLElement>(null);
  const kpiGridRef  = useRef<HTMLDivElement>(null);
  const lineRef     = useRef<SVGPathElement>(null);
  const riskLineRef = useRef<SVGPathElement>(null);
  const areaLineRef = useRef<SVGPathElement>(null);
  const areaFillRef = useRef<SVGPathElement>(null);
  const barsRef     = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useGsapContext(sectionRef, () => {
    // Replays every time this section is scrolled into view, in either
    // direction, rather than only ever once.
    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top 75%',
      end: 'bottom top',
      onEnter: () => setActive(true),
      onEnterBack: () => setActive(true),
      onLeave: () => setActive(false),
      onLeaveBack: () => setActive(false),
    });

    gsap.from(kpiGridRef.current?.children ?? [], {
      opacity: 0,
      y: 20,
      duration: 0.5,
      stagger: 0.06,
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 75%',
        toggleActions: 'restart none restart none',
      },
    });

    const lineLength     = lineRef.current?.getTotalLength() ?? 0;
    const riskLineLength = riskLineRef.current?.getTotalLength() ?? 0;
    const areaLineLength = areaLineRef.current?.getTotalLength() ?? 0;

    // strokeDasharray only needs to be set once — it defines the single
    // continuous dash the offset animation reveals; it never changes.
    gsap.set(lineRef.current, { strokeDasharray: lineLength });
    gsap.set(riskLineRef.current, { strokeDasharray: riskLineLength });
    gsap.set(areaLineRef.current, { strokeDasharray: areaLineLength });

    const chartsTl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 60%',
        toggleActions: 'restart none restart none',
      },
    });
    // Each tween restates its own starting dash offset/opacity explicitly
    // (fromTo, not to) so replaying the timeline redraws from scratch
    // instead of animating from wherever the previous play left off.
    chartsTl
      .set(areaFillRef.current, { opacity: 0 })
      .fromTo(lineRef.current, { strokeDashoffset: lineLength }, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' }, 0)
      .fromTo(barsRef.current?.children ?? [], { scaleY: 0 }, { scaleY: 1, duration: 0.6, stagger: 0.06, ease: 'power2.out' }, 0.1)
      .fromTo(areaLineRef.current, { strokeDashoffset: areaLineLength }, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' }, 0.2)
      .to(areaFillRef.current, { opacity: 1, duration: 0.6 }, 0.6)
      .fromTo(riskLineRef.current, { strokeDashoffset: riskLineLength }, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' }, 0.3);
  });

  return (
    <section ref={sectionRef} id="dashboard-preview" className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>A preview of what your export becomes</h2>
        <p className={styles.subtitle}>Real metrics. Real insights. Ready before your standup.</p>
      </div>

      <div className={styles.panel}>
        <div ref={kpiGridRef} className={styles.kpiGrid}>
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
              <path ref={lineRef} d={LINE_POINTS} className={styles.linePath} />
            </svg>
          </div>

          <div className={styles.chartCard}>
            <p className={styles.chartLabel}>Work Item Flow</p>
            <div ref={barsRef} className={styles.barsRow}>
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
              <path ref={areaFillRef} d={`${AREA_LINE_POINTS} L210,64 L0,64 Z`} className={styles.areaFill} />
              <path ref={areaLineRef} d={AREA_LINE_POINTS} className={styles.areaLine} />
            </svg>
          </div>

          <div className={styles.chartCard}>
            <p className={styles.chartLabel}>Risks Over Time</p>
            <svg viewBox="0 0 210 64" className={styles.chartSvg} preserveAspectRatio="none">
              <path ref={riskLineRef} d={RISK_LINE_POINTS} className={styles.riskLinePath} />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
