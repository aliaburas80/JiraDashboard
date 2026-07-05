// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
'use client';

import { useRef } from 'react';
import clsx from 'clsx';
import gsap from 'gsap';
import { SvgIcon } from '@/components/ui/SvgIcon';
import { useGsapContext } from '../hooks/useGsapContext';
import type { CSSVariableProperties } from '../lib/cssVars';
import styles from './BusinessValueSection.module.scss';

const VALUE_PROPS = [
  { icon: 'chartTrendUp', title: 'See delivery confidence before sprint reviews',         description: 'Walk into reviews with facts, not guesswork.',             color: '#2563eb', bg: '#eff6ff' },
  { icon: 'people',       title: 'Compare teams without manual Excel work',               description: 'One export. All teams. Instant comparison.',               color: '#22c55e', bg: '#f0fdf4' },
  { icon: 'search',       title: 'Detect blockers, orphan work, and data-quality issues', description: 'Fix problems early and improve your metrics.',             color: '#f97316', bg: '#fff7ed' },
  { icon: 'share',        title: 'Share clean executive views with stakeholders',         description: 'Make data easy to understand for everyone.',               color: '#8b5cf6', bg: '#f5f3ff' },
] as const;

export default function BusinessValueSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef     = useRef<HTMLDivElement>(null);

  useGsapContext(sectionRef, () => {
    const cards = gridRef.current ? Array.from(gridRef.current.children) : [];
    gsap.from(cards, {
      opacity: 0,
      y: 24,
      duration: 0.5,
      stagger: 0.1,
      scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' },
    });
    cards.forEach(card => {
      const icon = card.querySelector(`.${styles.iconWrap}`);
      if (!icon) return;
      gsap.from(icon, {
        scale: 0.6,
        duration: 0.4,
        ease: 'back.out(2)',
        scrollTrigger: { trigger: card, start: 'top 85%' },
      });
    });
  });

  return (
    <section ref={sectionRef} id="business-value" className={styles.section}>
      <h2 className={clsx(styles.title, 'text-2xl sm:text-3xl font-black')}>Turn Jira exports into delivery decisions</h2>

      <div ref={gridRef} className={styles.grid}>
        {VALUE_PROPS.map(v => {
          // DYNAMIC CSS VARIABLE: each card's accent color/background come from data.
          const variables: CSSVariableProperties = { '--value-color': v.color, '--value-bg': v.bg };
          return (
            <div key={v.title} className={styles.card} style={variables}>
              <div className={styles.iconWrap}>
                <SvgIcon name={v.icon} size={20} />
              </div>
              <div className={styles.body}>
                <h3 className={styles.cardTitle}>{v.title}</h3>
                <p className={styles.cardDesc}>{v.description}</p>
              </div>
              <SvgIcon name="arrowRight" size={14} className={styles.arrow} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
