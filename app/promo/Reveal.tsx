// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Reveal — scroll-triggered entrance wrapper for the public /promo page.
//
// Progressive enhancement, by design:
//  • No JS / JS fails        → content renders fully visible (the hidden state
//    in Reveal.module.scss is gated behind `@media (scripting: enabled)`, which
//    is false without JavaScript).
//  • prefers-reduced-motion  → content is shown with no transform/transition
//    (handled in the module's reduced-motion media query); the observer is
//    skipped entirely below.
//  • Otherwise               → element starts offset + faded, then animates in
//    the first time it scrolls into view (one-shot; observer disconnects).
'use client';

import { useEffect, useRef } from 'react';
import clsx from 'clsx';
import styles from './Reveal.module.scss';

type RevealVariant = 'up' | 'left' | 'right' | 'scale';

interface RevealProps {
  children: React.ReactNode;
  /** Rendered element. Defaults to a div. */
  as?: 'div' | 'section' | 'li' | 'span' | 'header' | 'p';
  variant?: RevealVariant;
  /** Stagger offset in milliseconds. Passed to CSS via a custom property. */
  delayMs?: number;
  className?: string;
}

export default function Reveal({
  children,
  as = 'div',
  variant = 'up',
  delayMs = 0,
  className,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  // Polymorphic tag — ElementType relaxes the per-tag ref/props union so a
  // single generic ref works regardless of which element `as` selects.
  const Tag = as as React.ElementType;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !('IntersectionObserver' in window)) {
      el.classList.add(styles.in);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add(styles.in);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.18, rootMargin: '0px 0px -8% 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // DYNAMIC CSS VARIABLE:
  // Stagger delay is data-driven (per-item index from the caller) and cannot
  // be expressed as a predefined class. Only a `--*` custom property is passed.
  const style = delayMs ? ({ '--reveal-delay': `${delayMs}ms` } as React.CSSProperties) : undefined;

  return (
    <Tag ref={ref} className={clsx(styles.reveal, styles[variant], className)} style={style}>
      {children}
    </Tag>
  );
}
