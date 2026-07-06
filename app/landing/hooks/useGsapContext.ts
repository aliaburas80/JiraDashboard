// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
'use client';

import { useEffect, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let pluginsRegistered = false;

function ensureGsapPlugins() {
  if (pluginsRegistered) return;
  gsap.registerPlugin(ScrollTrigger);
  pluginsRegistered = true;
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Runs `setup` inside a gsap.context() scoped to `scopeRef`, and reverts it
// (killing every tween/ScrollTrigger created inside) on unmount. Skips
// entirely for visitors who prefer reduced motion (CLAUDE.md §26.6) — those
// visitors see the section's static, non-animated resting state.
//
// Intentionally runs once per mount: `setup` closes over the section's own
// refs/data, which don't change after mount, and re-running it on every
// parent re-render would create duplicate ScrollTriggers.
export function useGsapContext(scopeRef: RefObject<HTMLElement>, setup: (context: gsap.Context) => void) {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    ensureGsapPlugins();
    const ctx = gsap.context(setup, scopeRef);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per mount, see comment above
  }, []);
}
