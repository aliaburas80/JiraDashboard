// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// First-time onboarding checklist — shown on summary/dashboard for new users.
// Persists state to localStorage. Auto-detects completed steps on mount.
'use client';
import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import {
  ONBOARDING_STEPS,
  getCompletedSteps,
  markStepDone,
  autoDetectSteps,
  isOnboardingDismissed,
  dismissOnboarding,
  type StepId,
} from '@/lib/onboarding';
import styles from './OnboardingChecklist.module.scss';

type CSSVars = CSSProperties & Record<`--${string}`, string | number>;

interface Props {
  /** If the user is logged in, auto-mark create_account as done */
  isLoggedIn?: boolean;
  /** Compact mode — shows only the progress bar and count, not the full list */
  compact?: boolean;
}

export default function OnboardingChecklist({ isLoggedIn = false, compact = false }: Props) {
  const [completed, setCompleted]   = useState<Set<StepId>>(new Set());
  const [dismissed, setDismissed]   = useState(false);
  const [expanded, setExpanded]     = useState(true);
  const [mounted, setMounted]       = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOnboardingDismissed()) { setDismissed(true); return; }

    // Auto-detect from existing app state
    const auto = autoDetectSteps();
    const stored = getCompletedSteps();

    // Mark logged-in as create_account done
    if (isLoggedIn) {
      stored.add('create_account');
      markStepDone('create_account');
    }

    auto.forEach(id => {
      stored.add(id);
      markStepDone(id);
    });

    setCompleted(new Set(stored));
  }, [isLoggedIn]);

  if (!mounted || dismissed) return null;

  const totalSteps = ONBOARDING_STEPS.length;
  const doneCount  = ONBOARDING_STEPS.filter(s => completed.has(s.id)).length;
  const allDone    = doneCount === totalSteps;
  const progress   = Math.round((doneCount / totalSteps) * 100);

  function handleDismiss() {
    dismissOnboarding();
    setDismissed(true);
  }

  // Compact mode — just a progress chip for the header
  if (compact) {
    if (allDone) return null;
    return (
      <Link
        href="/summary"
        title={`${doneCount} of ${totalSteps} setup steps complete`}
        className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-purple-200 bg-purple-50 px-2.5 text-xs font-black text-purple-700 transition-colors hover:bg-purple-100"
      >
        <span className="h-2.5 w-2.5 flex-shrink-0 overflow-hidden rounded-full bg-purple-200">
          <span className={`block h-full bg-purple-600 rounded-full ${styles.progressFill}`} style={{ '--progress-width': `${progress}%` } as CSSVars} />
        </span>
        <span>{doneCount}/{totalSteps}</span>
        <span className="hidden xl:inline">setup</span>
      </Link>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-2xl shadow-sm overflow-hidden mb-6">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="text-xl">{allDone ? '🎉' : '🚀'}</span>
          <div>
            <h3 className="text-sm font-black text-slate-800">
              {allDone ? 'You\'re all set!' : 'Getting Started with Delivery Clarity'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {allDone
                ? 'You\'ve completed all setup steps. Delivery Clarity is ready to use.'
                : `${doneCount} of ${totalSteps} steps completed`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!allDone && (
            <button
              type="button"
              onClick={() => setExpanded(v => !v)}
              className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
            >
              {expanded ? 'Collapse' : 'Expand'}
            </button>
          )}
          <button
            type="button"
            onClick={handleDismiss}
            title="Dismiss getting started"
            className="text-slate-300 hover:text-slate-500 font-black text-lg leading-none transition-colors"
          >
            ×
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5 pb-3">
        <div className="h-1.5 rounded-full bg-purple-100 overflow-hidden">
          <div
            className={`h-full rounded-full bg-purple-500 transition-all duration-500 ${styles.progressFill}`}
            style={{ '--progress-width': `${progress}%` } as CSSVars}
          />
        </div>
        <p className="text-[10px] text-slate-400 mt-1 text-right">{progress}% complete</p>
      </div>

      {/* Steps list */}
      {(expanded || allDone) && (
        <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ONBOARDING_STEPS.map(step => {
            const done = completed.has(step.id);
            return (
              <div
                key={step.id}
                className={`flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                  done ? 'bg-white/60' : 'bg-white/80 hover:bg-white'
                }`}
              >
                {/* Tick */}
                <span className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 border-2 transition-colors ${
                  done
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-slate-300 text-transparent'
                }`}>
                  ✓
                </span>

                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold leading-snug ${done ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                    {step.title}
                  </p>
                  {!done && (
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{step.description}</p>
                  )}
                </div>

                {/* CTA */}
                {!done && step.href && (
                  <Link
                    href={step.href}
                    className="shrink-0 text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 rounded-full px-2 py-0.5 hover:bg-purple-100 transition-colors whitespace-nowrap"
                  >
                    {step.ctaLabel ?? 'Go →'}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}

      {allDone && (
        <div className="px-5 pb-5">
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full py-2 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 transition-colors"
          >
            Dismiss — I&apos;m ready to go!
          </button>
        </div>
      )}
    </div>
  );
}
