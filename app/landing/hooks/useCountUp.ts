// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { prefersReducedMotion } from './useGsapContext';

// Animates a numeric value from 0 to `target` every time `active` becomes
// true, and resets back to 0 when it becomes false — so scrolling away and
// back replays the count-up instead of it only ever running once. Returns
// the raw (possibly fractional) current value — callers format it with
// their own suffix/decimals (e.g. `${Math.round(value)}+`, `${value.toFixed(1)}d`).
// Jumps straight to `target`/`0` for reduced-motion visitors (no tween).
export function useCountUp(target: number, active: boolean, duration = 1.4): number {
  const [value, setValue] = useState(0);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    tweenRef.current?.kill();
    if (!active) { setValue(0); return; }
    if (prefersReducedMotion()) { setValue(target); return; }
    const obj = { n: 0 };
    tweenRef.current = gsap.to(obj, { n: target, duration, ease: 'power2.out', onUpdate: () => setValue(obj.n) });
    return () => { tweenRef.current?.kill(); };
  }, [active, target, duration]);

  return value;
}
