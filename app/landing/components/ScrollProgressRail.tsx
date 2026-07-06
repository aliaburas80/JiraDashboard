// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion, ensureGsapPlugins } from '../hooks/useGsapContext';
import styles from './ScrollProgressRail.module.scss';

// Order matches the page's actual visual order (app/landing/page.tsx) —
// keep these two in sync when either changes.
export const LANDING_SECTIONS = [
  { id: 'landing-hero',      label: '01 Hero' },
  { id: 'product-flow',      label: '02 Product Flow' },
  { id: 'how-it-works',      label: '03 How It Works' },
  { id: 'feature-universe',  label: '04 Feature Universe' },
  { id: 'business-value',    label: '05 Business Value' },
  { id: 'metrics-strip',     label: '06 Metrics Strip' },
  { id: 'dashboard-preview', label: '07 Dashboard Preview' },
  { id: 'final-cta',         label: '08 Final CTA' },
] as const;

export default function ScrollProgressRail() {
  const [activeId, setActiveId] = useState<string>(LANDING_SECTIONS[0].id);
  const triggersRef = useRef<ScrollTrigger[]>([]);

  useEffect(() => {
    ensureGsapPlugins();
    const triggers = LANDING_SECTIONS.map(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return null;
      return ScrollTrigger.create({
        trigger: el,
        start: 'top center',
        end: 'bottom center',
        onToggle: self => { if (self.isActive) setActiveId(id); },
      });
    }).filter((t): t is ScrollTrigger => t !== null);
    triggersRef.current = triggers;

    return () => triggers.forEach(t => t.kill());
  }, []);

  function scrollToSection(id: string) {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  }

  // Hidden while the hero is active — its dark, full-bleed floating cards and
  // headline live in the same top-left/top-right space the rail occupies, so
  // showing the rail there causes a visual collision.
  const overHero = activeId === LANDING_SECTIONS[0].id;

  return (
    <nav className={clsx(styles.rail, { [styles.railHidden]: overHero })} aria-label="Landing page section progress">
      {LANDING_SECTIONS.map(section => (
        <button
          key={section.id}
          type="button"
          onClick={() => scrollToSection(section.id)}
          className={clsx(styles.item, { [styles.itemActive]: activeId === section.id })}
          aria-current={activeId === section.id ? 'true' : undefined}
        >
          <span className={styles.dot} aria-hidden="true" />
          <span className={styles.label}>{section.label}</span>
        </button>
      ))}
    </nav>
  );
}
