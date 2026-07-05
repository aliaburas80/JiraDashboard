// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { prefersReducedMotion } from './useGsapContext';

// Animates a numeric value from 0 to `target` once `active` becomes true.
// Returns the raw (possibly fractional) current value — callers format it
// with their own suffix/decimals (e.g. `${Math.round(value)}+`, `${value.toFixed(1)}d`).
// Jumps straight to `target` for reduced-motion visitors.
export function useCountUp(target: number, active: boolean, duration = 1.4): number {
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!active || started.current) return;
    started.current = true;
    if (prefersReducedMotion()) { setValue(target); return; }
    const obj = { n: 0 };
    gsap.to(obj, { n: target, duration, ease: 'power2.out', onUpdate: () => setValue(obj.n) });
  }, [active, target, duration]);

  return value;
}
