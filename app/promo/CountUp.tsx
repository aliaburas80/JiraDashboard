// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// CountUp — animates a number from 0 to `value` the first time it scrolls into
// view. Renders the final value immediately when JS is off or reduced-motion
// is requested, so the real figure is never hidden. Presentation (size/colour)
// is owned by the parent; this component renders only the text node.
'use client';

import { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  value: number;
  /** Rendered before the number, e.g. "<". */
  prefix?: string;
  /** Rendered after the number, e.g. "+" or "s". */
  suffix?: string;
  durationMs?: number;
}

export default function CountUp({ value, prefix = '', suffix = '', durationMs = 1600 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState(value);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !('IntersectionObserver' in window)) {
      setDisplay(value);
      return;
    }

    setDisplay(0);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !started.current) {
            started.current = true;
            const start = performance.now();
            const tick = (now: number) => {
              const t = Math.min(1, (now - start) / durationMs);
              // easeOutCubic — fast then settling, matches the page's --ease feel.
              const eased = 1 - Math.pow(1 - t, 3);
              setDisplay(Math.round(eased * value));
              if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, durationMs]);

  return (
    <span ref={ref}>
      {prefix}
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}
