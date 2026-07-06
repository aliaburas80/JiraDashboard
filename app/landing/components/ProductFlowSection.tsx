// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
'use client';

import { useRef } from 'react';
import clsx from 'clsx';
import gsap from 'gsap';
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
  const sectionRef    = useRef<HTMLElement>(null);
  const jiraCardRef   = useRef<HTMLDivElement>(null);
  const gearStageRef  = useRef<HTMLDivElement>(null);
  const decisionsRef  = useRef<HTMLDivElement>(null);

  useGsapContext(sectionRef, () => {
    // Plays once when the section scrolls into view — no pin/scrub, matching
    // /promo's simpler one-shot reveal pattern rather than a scroll-scrubbed
    // pinned sequence. The gears/data dots themselves animate continuously
    // via CSS regardless of this reveal (see ProductFlowSection.module.scss).
    gsap.timeline({
      defaults: { ease: 'power2.out' },
      scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' },
    })
      .from(jiraCardRef.current?.querySelectorAll(`.${styles.fileIcon}`) ?? [], { opacity: 0, y: 12, duration: 0.4, stagger: 0.1 })
      .from(gearStageRef.current, { opacity: 0, scale: 0.9, duration: 0.5 }, '-=0.1')
      .from(decisionsRef.current?.querySelectorAll(`.${styles.decisionItem}`) ?? [], { opacity: 0, x: 16, duration: 0.35, stagger: 0.1 }, '-=0.2');
  });

  return (
    <section ref={sectionRef} id="product-flow" className={styles.section}>
      <h2 className={clsx(styles.title, 'text-2xl sm:text-3xl font-black')}>From export to decision</h2>

      <div className={styles.flow}>
        <div ref={jiraCardRef} className={styles.card}>
          <p className={styles.cardTitle}>Jira Export</p>
          <p className={styles.cardSubtitle}>CSV / Excel</p>
          <div className={styles.fileIcons}>
            <span className={styles.fileIcon}><SvgIcon name="file" size={14} />CSV</span>
            <span className={styles.fileIcon}><SvgIcon name="file" size={14} />XLSX</span>
          </div>
        </div>

        <div>
          <div ref={gearStageRef} className={styles.gearStageOuter}>
            <div className={styles.gearStage} aria-hidden="true">
              <div className={clsx(styles.gear, styles.gearLeft)} />
              <div className={clsx(styles.gear, styles.gearCenter)} />
              <div className={clsx(styles.gear, styles.gearRight)} />

              <span className={clsx(styles.gearContact, styles.gearContactOne)} />
              <span className={clsx(styles.gearContact, styles.gearContactTwo)} />

              {/* Data flows from the Jira Export card, through the gears,
                  to the Delivery Decisions card — one continuous path. */}
              <span className={styles.gearDataDot} />
              <span className={clsx(styles.gearDataDot, styles.gearDataDot2)} />
              <span className={clsx(styles.gearDataDot, styles.gearDataDot3)} />
            </div>
          </div>
          <div className={styles.gearLabel}>
            <p className={styles.gearLabelTitle}>Delivery Clarity Intelligence Engine</p>
            <p className={styles.gearLabelSubtitle}>VALIDATE · CALCULATE · EXPLAIN</p>
          </div>
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
