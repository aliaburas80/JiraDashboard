// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
'use client';

import { useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SvgIcon } from '@/components/ui/SvgIcon';
import { useGsapContext } from '../hooks/useGsapContext';
import { useCountUp } from '../hooks/useCountUp';
import type { CSSVariableProperties } from '../lib/cssVars';
import styles from './MetricsStrip.module.scss';

const STATS = [
  { icon: 'chartTrendUp', target: 28,  suffix: '+', label: 'Metrics Calculated',  subtext: 'Across delivery lifecycle', color: '#f97316' },
  { icon: 'table',        target: 17,  suffix: '',  label: 'Excel Export Sheets', subtext: 'Ready to download',         color: '#22c55e' },
  { icon: 'dashboard',    target: 14,  suffix: '',  label: 'Dashboard Sections',  subtext: 'Insights at every level',   color: '#2563eb' },
  { icon: 'shield',       target: 469, suffix: '+', label: 'Automated Tests',     subtext: 'Quality you can trust',     color: '#8b5cf6' },
] as const;

function StatCard({ stat, active }: { stat: typeof STATS[number]; active: boolean }) {
  const value = useCountUp(stat.target, active, 1.3);
  // DYNAMIC CSS VARIABLE: each stat has its own accent color from data.
  const variables: CSSVariableProperties = { '--metric-color': stat.color };

  return (
    <div className={styles.card} style={variables}>
      <div className={styles.iconWrap}>
        <SvgIcon name={stat.icon} size={18} />
      </div>
      <p className={styles.value}>{Math.round(value)}{stat.suffix}</p>
      <p className={styles.label}>{stat.label}</p>
      <p className={styles.subtext}>{stat.subtext}</p>
    </div>
  );
}

export default function MetricsStrip() {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef     = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useGsapContext(sectionRef, () => {
    // Replays every time this section is scrolled into view, either
    // direction, rather than only counting up once.
    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top 80%',
      end: 'bottom top',
      onEnter: () => setActive(true),
      onEnterBack: () => setActive(true),
      onLeave: () => setActive(false),
      onLeaveBack: () => setActive(false),
    });

    gsap.from(gridRef.current?.children ?? [], {
      opacity: 0,
      y: 24,
      duration: 0.5,
      stagger: 0.1,
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 80%',
        toggleActions: 'restart none restart none',
      },
    });
  });

  return (
    <section ref={sectionRef} id="metrics-strip" className={styles.section}>
      <div ref={gridRef} className={styles.grid}>
        {STATS.map(s => <StatCard key={s.label} stat={s} active={active} />)}
      </div>
    </section>
  );
}
