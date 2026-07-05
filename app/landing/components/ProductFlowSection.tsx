// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
'use client';

import { useRef } from 'react';
import clsx from 'clsx';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SvgIcon } from '@/components/ui/SvgIcon';
import { useGsapContext } from '../hooks/useGsapContext';
import type { CSSVariableProperties } from '../lib/cssVars';
import styles from './ProductFlowSection.module.scss';

const DECISIONS = [
  { label: 'Sprint Health',      color: '#22c55e' },
  { label: 'Release Confidence', color: '#2563eb' },
  { label: 'Team Risk',          color: '#f97316' },
  { label: 'Executive View',     color: '#8b5cf6' },
] as const;

export default function ProductFlowSection() {
  const sectionRef   = useRef<HTMLElement>(null);
  const jiraCardRef  = useRef<HTMLDivElement>(null);
  const engineRef    = useRef<HTMLDivElement>(null);
  const decisionsRef = useRef<HTMLDivElement>(null);
  const lineBlueRef  = useRef<SVGPathElement>(null);
  const lineOrangeRef = useRef<SVGPathElement>(null);

  useGsapContext(sectionRef, () => {
    [lineBlueRef.current, lineOrangeRef.current].forEach(path => {
      if (!path) return;
      const length = path.getTotalLength();
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
    });

    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })
      .from(jiraCardRef.current?.querySelectorAll(`.${styles.fileIcon}`) ?? [], { opacity: 0, y: 12, duration: 0.4, stagger: 0.1 })
      .to(lineBlueRef.current, { strokeDashoffset: 0, duration: 0.6 }, '-=0.1')
      .to(engineRef.current, { boxShadow: '0 0 0 14px rgba(37,99,235,0.08)', duration: 0.5, yoyo: true, repeat: 1 }, '-=0.2')
      .to(lineOrangeRef.current, { strokeDashoffset: 0, duration: 0.6 })
      .from(decisionsRef.current?.querySelectorAll(`.${styles.decisionItem}`) ?? [], { opacity: 0, x: 16, duration: 0.35, stagger: 0.1 }, '-=0.3');

    gsap.matchMedia().add('(min-width: 1024px)', () => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top+=80',
        end: '+=80%',
        pin: true,
        scrub: 1,
        animation: tl,
      });
    });

    gsap.matchMedia().add('(max-width: 1023px)', () => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top 75%',
        animation: tl,
      });
    });
  });

  return (
    <section ref={sectionRef} id="product-flow" className={styles.section}>
      <h2 className={clsx(styles.title, 'text-2xl sm:text-3xl font-black')}>From export to decision</h2>

      <div className={styles.flow}>
        <svg className={styles.lines} viewBox="0 0 800 100" preserveAspectRatio="none" aria-hidden="true">
          <path ref={lineBlueRef} d="M40,50 C 160,20 240,20 380,50" className={clsx(styles.linePath, styles.linePathBlue)} />
          <path ref={lineOrangeRef} d="M420,50 C 560,80 640,80 760,50" className={clsx(styles.linePath, styles.linePathOrange)} />
        </svg>

        <div ref={jiraCardRef} className={styles.card}>
          <p className={styles.cardTitle}>Jira Export</p>
          <p className={styles.cardSubtitle}>CSV / Excel</p>
          <div className={styles.fileIcons}>
            <span className={styles.fileIcon}><SvgIcon name="file" size={14} />CSV</span>
            <span className={styles.fileIcon}><SvgIcon name="file" size={14} />XLSX</span>
          </div>
        </div>

        <div ref={engineRef} className={styles.engine}>
          <p className={styles.engineTitle}>Delivery Clarity Intelligence Engine</p>
          <p className={styles.engineSubtitle}>VALIDATE · CALCULATE · EXPLAIN</p>
        </div>

        <div className={styles.card}>
          <p className={styles.cardTitle}>Delivery Decisions</p>
          <div ref={decisionsRef} className={clsx(styles.decisionList, 'mt-4')}>
            {DECISIONS.map(d => {
              // DYNAMIC CSS VARIABLE: each decision's icon color comes from data.
              const variables: CSSVariableProperties = { '--decision-color': d.color };
              return (
                <span key={d.label} className={styles.decisionItem} style={variables}>
                  <SvgIcon name="checkCircle" size={15} className={styles.decisionIcon} />
                  {d.label}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
