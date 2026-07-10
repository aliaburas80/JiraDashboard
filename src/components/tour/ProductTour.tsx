// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Product tour — pulsing highlight ring + fixed popover, no external library.
// Per-page: each route has its own short, self-contained set of steps (see
// src/lib/tour.ts). Started only via the PageTourButton on the current page
// dispatching `dc:start-tour` — never auto-starts, never navigates.
'use client';

import { useState, useEffect, useLayoutEffect, useCallback, useRef, type CSSProperties } from 'react';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { getPageTour, type TourStep } from '@/lib/tour';
import styles from './ProductTour.module.scss';

// ── Highlight ring ────────────────────────────────────────────────────────────

interface Rect { top: number; left: number; width: number; height: number }
type CSSVariableProperties = CSSProperties & Record<`--${string}`, string>;

function HighlightRing({ rect }: { rect: Rect }) {
  const PAD = 8;
  // DYNAMIC CSS VARIABLE: computed from the target element's live bounding
  // rect (re-measured every animation frame to track scroll/resize).
  const vars: CSSVariableProperties = {
    '--tour-top':    `${rect.top - PAD}px`,
    '--tour-left':   `${rect.left - PAD}px`,
    '--tour-width':  `${rect.width + PAD * 2}px`,
    '--tour-height': `${rect.height + PAD * 2}px`,
  };
  return <div aria-hidden="true" className={styles.highlightRing} style={vars} />;
}

// ── Popover card ──────────────────────────────────────────────────────────────

interface PopoverProps {
  step:       TourStep;
  stepIndex:  number;
  totalSteps: number;
  targetRect: Rect | null;
  onNext:     () => void;
  onBack:     () => void;
  onSkip:     () => void;
}

function TourPopover({ step, stepIndex, totalSteps, targetRect, onNext, onBack, onSkip }: PopoverProps) {
  const isFirst  = stepIndex === 0;
  const isLast   = stepIndex === totalSteps - 1;
  const isCentre = step.placement === 'center' || !targetRect;
  const popoverRef = useRef<HTMLDivElement>(null);
  const [vars, setVars] = useState<CSSVariableProperties>({});

  // Positioned via a measure-then-clamp pass (not pure CSS) because the
  // popover's real height depends on how long this step's description is,
  // and both "below" and "above" placement must stay fully inside the
  // viewport regardless of where the target sits — a target near the top of
  // the page previously pushed an "above"-placed popover off-screen entirely
  // (bottom: window.innerHeight - target.top could exceed the viewport).
  // useLayoutEffect runs before paint, so this never visibly flashes.
  useLayoutEffect(() => {
    if (isCentre || !targetRect) { setVars({}); return; }
    const GAP = 16;
    const W   = 300;
    const H   = popoverRef.current?.offsetHeight ?? 220; // fallback for the very first measured render
    const clampedLeft = Math.min(Math.max(targetRect.left + targetRect.width / 2 - W / 2, 12), window.innerWidth - W - 12);

    const preferBelow = step.placement === 'bottom' || (step.placement !== 'top' && targetRect.top < window.innerHeight / 2);
    const desiredTop  = preferBelow
      ? targetRect.top + targetRect.height + GAP
      : targetRect.top - GAP - H;
    const clampedTop = Math.min(Math.max(desiredTop, 12), window.innerHeight - H - 12);

    setVars({
      '--tour-popover-top':  `${clampedTop}px`,
      '--tour-popover-left': `${clampedLeft}px`,
    });
  }, [targetRect, step.placement, isCentre]);

  return (
    <div
      ref={popoverRef}
      role="dialog"
      aria-label={`Tour step ${stepIndex + 1} of ${totalSteps}: ${step.title}`}
      className={clsx(styles.popover, isCentre ? styles.popoverCenter : styles.popoverPositioned)}
      style={vars}
    >
      {/* Progress dots */}
      <div className={styles.progressDots}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={clsx(styles.progressDot, {
              [styles['progressDot--current']]: i === stepIndex,
              [styles['progressDot--done']]:    i < stepIndex,
            })}
          />
        ))}
      </div>

      {/* Content */}
      <p className={styles.popoverTitle}>{step.title}</p>
      <p className={styles.popoverDesc}>{step.description}</p>

      {/* Actions */}
      <div className={styles.actionsRow}>
        {!isFirst && (
          <button type="button" onClick={onBack} className={styles.backBtn}>
            ← Back
          </button>
        )}
        <div className={styles.actionsSpacer} />
        <button type="button" onClick={onSkip} className={styles.skipBtn}>
          Close
        </button>
        <button type="button" onClick={onNext} className={styles.nextBtn}>
          {isLast ? 'Done' : 'Next →'}
        </button>
      </div>

      {/* Step counter */}
      <p className={styles.stepCounter}>
        {stepIndex + 1} / {totalSteps}
      </p>
    </div>
  );
}

// ── Backdrop (semi-transparent) ───────────────────────────────────────────────

function Backdrop({ onClick }: { onClick: () => void }) {
  return <div aria-hidden="true" onClick={onClick} className={styles.backdrop} />;
}

// ── Main component ────────────────────────────────────────────────────────────
// Mounted once at the root layout. Renders nothing until `dc:start-tour` is
// dispatched (by PageTourButton, or anything else on the current page).

export default function ProductTour() {
  const pathname = usePathname();
  const [active,     setActive]     = useState(false);
  const [stepIndex,  setStepIndex]  = useState(0);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const rafRef = useRef<number | null>(null);

  const steps = getPageTour(pathname) ?? [];

  // ── Expose start via custom event ─────────────────────────────────────────
  useEffect(() => {
    function handleStart() {
      if (getPageTour(pathname) === null) return; // nothing to show on this page
      setStepIndex(0);
      setActive(true);
    }
    window.addEventListener('dc:start-tour', handleStart);
    return () => window.removeEventListener('dc:start-tour', handleStart);
  }, [pathname]);

  // ── Close the tour on navigation — a new page has its own, separate tour ──
  useEffect(() => {
    setActive(false);
  }, [pathname]);

  // ── Track target element position ─────────────────────────────────────────
  const trackTarget = useCallback(() => {
    const step = steps[stepIndex];
    if (!step?.targetId) { setTargetRect(null); return; }
    const el = document.getElementById(step.targetId);
    if (!el) { setTargetRect(null); return; }
    const r = el.getBoundingClientRect();
    setTargetRect({ top: r.top, left: r.left, width: r.width, height: r.height });

    // Scroll target into view
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- steps is derived fresh from pathname each render; stepIndex is the real dependency
  }, [stepIndex, pathname]);

  useEffect(() => {
    if (!active) { setTargetRect(null); return; }
    trackTarget();
    // Continuously re-track (handles scroll, resize)
    function tick() { trackTarget(); rafRef.current = requestAnimationFrame(tick); }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [active, stepIndex, trackTarget]);

  // ── Key handler ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!active) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape')     { handleSkip(); }
      if (e.key === 'ArrowRight') { handleNext(); }
      if (e.key === 'ArrowLeft')  { handleBack(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // ── Actions ───────────────────────────────────────────────────────────────
  function handleNext() {
    if (stepIndex === steps.length - 1) { setActive(false); return; }
    setStepIndex(i => i + 1);
  }
  function handleBack() { setStepIndex(i => Math.max(0, i - 1)); }
  function handleSkip()  { setActive(false); }

  if (!active || steps.length === 0) return null;

  const step = steps[stepIndex];

  return (
    <>
      <Backdrop onClick={handleSkip} />
      {targetRect && <HighlightRing rect={targetRect} />}
      <TourPopover
        step={step}
        stepIndex={stepIndex}
        totalSteps={steps.length}
        targetRect={targetRect}
        onNext={handleNext}
        onBack={handleBack}
        onSkip={handleSkip}
      />
    </>
  );
}
