// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Product tour — pulsing highlight ring + fixed popover, no external library.
'use client';

import { useState, useEffect, useCallback, useRef, type CSSProperties } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import clsx from 'clsx';
import {
  TOUR_STEPS,
  isTourDismissed,
  dismissTour,
  completeTour,
  type TourStep,
} from '@/lib/tour';
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

  // Position relative to target
  let positionClass = styles.popoverCenter;
  let vars: CSSVariableProperties = {};
  if (!isCentre && targetRect) {
    const GAP = 16;
    const W   = 300;
    const clampedLeft = Math.min(Math.max(targetRect.left + targetRect.width / 2 - W / 2, 12), window.innerWidth - W - 12);
    if (step.placement === 'bottom' || (step.placement !== 'top' && targetRect.top < window.innerHeight / 2)) {
      positionClass = styles.popoverBelow;
      // DYNAMIC CSS VARIABLE: computed from the live target rect, clamped to
      // stay within the viewport — cannot be expressed as static CSS.
      vars = {
        '--tour-popover-top':  `${targetRect.top + targetRect.height + GAP}px`,
        '--tour-popover-left': `${clampedLeft}px`,
      };
    } else {
      positionClass = styles.popoverAbove;
      vars = {
        '--tour-popover-bottom': `${window.innerHeight - targetRect.top + GAP}px`,
        '--tour-popover-left':   `${clampedLeft}px`,
      };
    }
  }

  return (
    <div
      role="dialog"
      aria-label={`Tour step ${stepIndex + 1} of ${totalSteps}: ${step.title}`}
      className={clsx(styles.popover, positionClass)}
      style={vars}
    >
      {/* Progress dots */}
      <div className={styles.progressDots}>
        {TOUR_STEPS.map((_, i) => (
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
          Skip tour
        </button>
        <button type="button" onClick={onNext} className={styles.nextBtn}>
          {step.ctaLabel ?? (isLast ? 'Finish' : 'Next →')}
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

interface Props {
  autoStart?: boolean;   // start immediately (e.g. on first visit)
}

export default function ProductTour({ autoStart = false }: Props) {
  const router   = useRouter();
  const pathname = usePathname();
  const [active,      setActive]      = useState(false);
  const [stepIndex,   setStepIndex]   = useState(0);
  const [targetRect,  setTargetRect]  = useState<Rect | null>(null);
  const rafRef = useRef<number | null>(null);

  // ── Auto-start on first visit ──────────────────────────────────────────────
  useEffect(() => {
    if (autoStart && !isTourDismissed()) {
      const t = setTimeout(() => setActive(true), 800);
      return () => clearTimeout(t);
    }
  }, [autoStart]);

  // ── Expose start via custom event ─────────────────────────────────────────
  // ProductTour is mounted once at the root layout (survives navigation
  // between pages, even across different route layouts) so tour state
  // (active step) isn't lost when a step needs to move to a different page.
  useEffect(() => {
    function handleStart() { setStepIndex(0); setActive(true); }
    window.addEventListener('dc:start-tour', handleStart);
    return () => window.removeEventListener('dc:start-tour', handleStart);
  }, []);

  // ── Navigate to the current step's page, if it's not the current one ──────
  // The steps below (target tracking) keep polling every frame regardless of
  // navigation, so once the destination page mounts and renders its target
  // element, the highlight ring picks it up automatically — no extra "wait
  // for navigation to finish" handshake needed.
  useEffect(() => {
    if (!active) return;
    const step = TOUR_STEPS[stepIndex];
    if (step.route && step.route !== pathname) {
      router.push(step.route);
    }
  }, [active, stepIndex, pathname, router]);

  // ── Track target element position ─────────────────────────────────────────
  const trackTarget = useCallback(() => {
    const step = TOUR_STEPS[stepIndex];
    if (!step?.targetId) { setTargetRect(null); return; }
    const el = document.getElementById(step.targetId);
    if (!el) { setTargetRect(null); return; }
    const r = el.getBoundingClientRect();
    setTargetRect({ top: r.top, left: r.left, width: r.width, height: r.height });

    // Scroll target into view
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [stepIndex]);

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
      if (e.key === 'Escape')         { handleSkip(); }
      if (e.key === 'ArrowRight')     { handleNext(); }
      if (e.key === 'ArrowLeft')      { handleBack(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // ── Actions ───────────────────────────────────────────────────────────────
  function handleNext() {
    const step = TOUR_STEPS[stepIndex];
    if (step.href) { router.push(step.href); handleSkip(); return; }
    if (stepIndex === TOUR_STEPS.length - 1) { completeTour(); setActive(false); return; }
    setStepIndex(i => i + 1);
  }
  function handleBack()  { setStepIndex(i => Math.max(0, i - 1)); }
  function handleSkip()  { dismissTour(); setActive(false); }

  if (!active) return null;

  const step = TOUR_STEPS[stepIndex];

  return (
    <>
      <Backdrop onClick={handleSkip} />
      {targetRect && <HighlightRing rect={targetRect} />}
      <TourPopover
        step={step}
        stepIndex={stepIndex}
        totalSteps={TOUR_STEPS.length}
        targetRect={targetRect}
        onNext={handleNext}
        onBack={handleBack}
        onSkip={handleSkip}
      />
    </>
  );
}
