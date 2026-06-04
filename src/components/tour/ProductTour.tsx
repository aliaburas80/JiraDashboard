// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Product tour — pulsing highlight ring + fixed popover, no external library.
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  TOUR_STEPS,
  isTourDismissed,
  dismissTour,
  completeTour,
  type TourStep,
} from '@/lib/tour';

// ── Highlight ring ────────────────────────────────────────────────────────────

interface Rect { top: number; left: number; width: number; height: number }

function HighlightRing({ rect }: { rect: Rect }) {
  const PAD = 8;
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top:    rect.top    - PAD,
        left:   rect.left   - PAD,
        width:  rect.width  + PAD * 2,
        height: rect.height + PAD * 2,
        borderRadius: 12,
        border: '2px solid #2563eb',
        boxShadow: '0 0 0 4px rgba(37,99,235,0.18)',
        pointerEvents: 'none',
        zIndex: 9998,
        animation: 'dc-tour-pulse 1.6s ease-in-out infinite',
      }}
    />
  );
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
  let style: React.CSSProperties = {};
  if (isCentre) {
    style = {
      position: 'fixed',
      top: '50%', left: '50%',
      transform: 'translate(-50%,-50%)',
    };
  } else if (targetRect) {
    const GAP = 16;
    const W   = 300;
    if (step.placement === 'bottom' || (step.placement !== 'top' && targetRect.top < window.innerHeight / 2)) {
      style = {
        position: 'fixed',
        top:  targetRect.top + targetRect.height + GAP,
        left: Math.min(Math.max(targetRect.left + targetRect.width / 2 - W / 2, 12), window.innerWidth - W - 12),
      };
    } else {
      style = {
        position: 'fixed',
        bottom: window.innerHeight - targetRect.top + GAP,
        left: Math.min(Math.max(targetRect.left + targetRect.width / 2 - W / 2, 12), window.innerWidth - W - 12),
      };
    }
  }

  return (
    <div
      role="dialog"
      aria-label={`Tour step ${stepIndex + 1} of ${totalSteps}: ${step.title}`}
      style={{
        ...style,
        width: 300,
        background: '#0f172a',
        borderRadius: 16,
        padding: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        zIndex: 9999,
        animation: 'dc-tour-fadein 0.22s ease both',
        color: '#f1f5f9',
      }}
    >
      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
        {TOUR_STEPS.map((_, i) => (
          <div key={i} style={{
            width: i === stepIndex ? 16 : 6,
            height: 6,
            borderRadius: 999,
            background: i === stepIndex ? '#2563eb' : i < stepIndex ? '#3b82f6' : '#334155',
            transition: 'width 0.2s ease, background 0.2s ease',
          }} />
        ))}
      </div>

      {/* Content */}
      <p style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9', marginBottom: 6, lineHeight: 1.3 }}>
        {step.title}
      </p>
      <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, marginBottom: 18 }}>
        {step.description}
      </p>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {!isFirst && (
          <button
            type="button" onClick={onBack}
            style={{ fontSize: 11, fontWeight: 700, color: '#64748b', background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px 8px' }}
          >
            ← Back
          </button>
        )}
        <div style={{ flex: 1 }} />
        <button
          type="button" onClick={onSkip}
          style={{ fontSize: 11, fontWeight: 700, color: '#475569', background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px 8px' }}
        >
          Skip tour
        </button>
        <button
          type="button" onClick={onNext}
          style={{
            fontSize: 12, fontWeight: 800, color: '#fff',
            background: 'linear-gradient(135deg,#1455f5,#2563eb)',
            border: 'none', borderRadius: 10, cursor: 'pointer',
            padding: '8px 16px',
            boxShadow: '0 4px 12px rgba(37,99,235,0.35)',
          }}
        >
          {step.ctaLabel ?? (isLast ? 'Finish' : 'Next →')}
        </button>
      </div>

      {/* Step counter */}
      <p style={{ fontSize: 10, color: '#334155', textAlign: 'center', marginTop: 10, fontWeight: 600 }}>
        {stepIndex + 1} / {totalSteps}
      </p>
    </div>
  );
}

// ── Backdrop (semi-transparent) ───────────────────────────────────────────────

function Backdrop({ onClick }: { onClick: () => void }) {
  return (
    <div
      aria-hidden="true"
      onClick={onClick}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 9997,
        animation: 'dc-tour-fadein 0.2s ease both',
      }}
    />
  );
}

// ── Global keyframes injected once ────────────────────────────────────────────

function InjectStyles() {
  useEffect(() => {
    const id = 'dc-tour-styles';
    if (document.getElementById(id)) return;
    const s = document.createElement('style');
    s.id = id;
    s.textContent = `
      @keyframes dc-tour-pulse {
        0%,100%{box-shadow:0 0 0 4px rgba(37,99,235,0.18);}
        50%{box-shadow:0 0 0 10px rgba(37,99,235,0.0);}
      }
      @keyframes dc-tour-fadein {
        from{opacity:0;transform:translateY(6px) scale(0.97);}
        to{opacity:1;transform:none;}
      }
      @media(prefers-reduced-motion:reduce){
        *{animation-duration:0.01ms!important;}
      }
    `;
    document.head.appendChild(s);
  }, []);
  return null;
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  autoStart?: boolean;   // start immediately (e.g. on first visit)
}

export default function ProductTour({ autoStart = false }: Props) {
  const router  = useRouter();
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
  useEffect(() => {
    function handleStart() { setStepIndex(0); setActive(true); }
    window.addEventListener('dc:start-tour', handleStart);
    return () => window.removeEventListener('dc:start-tour', handleStart);
  }, []);

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

  if (!active) return <InjectStyles />;

  const step = TOUR_STEPS[stepIndex];

  return (
    <>
      <InjectStyles />
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
