// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SvgIcon } from '@/components/ui/SvgIcon';
import { useGsapContext } from '../hooks/useGsapContext';
import type { CSSVariableProperties } from '../lib/cssVars';
import styles from './FeatureUniverse.module.scss';

const FEATURES = [
  { icon: 'chartBar',       title: 'Sprint Throughput',       description: 'Committed vs completed, carryover, goal outcomes, and mid-sprint patterns.',                href: '/dashboard',         color: '#e85d12' },
  { icon: 'link',           title: 'Work Item Explorer',      description: 'Visualise hierarchy, risk path, orphan detection, parent and child relationships.',        href: '/explore',           color: '#7c3aed' },
  { icon: 'chartTrendUp',   title: 'Upload-to-Upload Trends', description: 'Track health, completion rate, cycle time, lead time, and release confidence.',            href: '/trends',            color: '#0891b2' },
  { icon: 'people',         title: 'Team Health Comparison',  description: 'Compare completion, cycle time, blocker rate, and workload share.',                       href: '/teams',             color: '#22c55e' },
  { icon: 'folder',         title: 'Portfolio Summary',       description: 'Cross-project metrics, release coverage, performance, and risk rollups.',                 href: '/portfolio',         color: '#f59e0b' },
  { icon: 'release',        title: 'Release Readiness',       description: 'Risk view, Go / No-Go indicator, and blocker visibility.',                               href: '/readiness',         color: '#22c55e' },
  { icon: 'chartTrendDown', title: 'Visual Analytics',        description: 'Delivery projections, velocity trends, cycle time forecasts, and what-if scenarios.',     href: '/charts',            color: '#ff8a4c' },
  { icon: 'person',         title: 'Customer View',           description: 'Customizable executive view with stakeholder-ready reports.',                            href: '/customer',          color: '#0d9488' },
  { icon: 'download',       title: 'Smart Export Suite',      description: 'Excel workbook, executive PDF, HTML report, and scheduled exports.',                      href: '/summary',           color: '#059669' },
  { icon: 'camera',         title: 'Dashboard Snapshots',      description: 'Save named metric snapshots and compare trends side by side.',                          href: '/snapshots',         color: '#6366f1' },
  { icon: 'search',         title: 'Data Quality Score',       description: 'Detect missing fields, broken links, duplicates, and data accuracy issues.',             href: '/dashboard',         color: '#f59e0b' },
  { icon: 'statusInfo',     title: 'Admin Diagnostics',        description: 'Operational health, import diagnostics, and environment checks.',                       href: '/admin/diagnostics', color: '#f87171' },
] as const;

function FeatureCard({ icon, title, description, href, color }: typeof FEATURES[number]) {
  // DYNAMIC CSS VARIABLE: each feature has its own brand color from data.
  const variables: CSSVariableProperties = { '--feature-color': color };
  return (
    <a href={href} className={styles.card} style={variables}>
      <div className={styles.iconWrap}>
        <SvgIcon name={icon} size={20} />
      </div>
      <h3 className={styles.cardTitle}>{title}</h3>
      <p className={styles.cardDesc}>{description}</p>
      <SvgIcon name="arrowRight" size={14} className={styles.arrow} />
    </a>
  );
}

export default function FeatureUniverse() {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef     = useRef<HTMLDivElement>(null);

  useGsapContext(sectionRef, () => {
    const cards = gridRef.current ? Array.from(gridRef.current.children) : [];
    ScrollTrigger.batch(cards, {
      start: 'top 85%',
      onEnter: batch => gsap.from(batch, { opacity: 0, y: 24, duration: 0.5, stagger: 0.08 }),
      once: true,
    });
  });

  return (
    <section ref={sectionRef} id="feature-universe" className={styles.section}>
      <div className={styles.layout}>
        <div className={styles.sticky}>
          <h2 className={styles.title}>Everything in one place</h2>
          <p className={styles.subtitle}>Every insight starts from one Jira export.</p>
        </div>

        <div ref={gridRef} className={styles.grid}>
          {FEATURES.map(f => <FeatureCard key={f.title} {...f} />)}
        </div>
      </div>
    </section>
  );
}
