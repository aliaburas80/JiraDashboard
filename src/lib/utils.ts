import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { HealthThresholds } from '@/types/thresholds';
import { DEFAULT_THRESHOLDS } from '@/types/thresholds';

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function formatDays(d: number | null | undefined): string { return d == null ? '—' : d + 'd'; }
export function formatPct(n: number | null | undefined): string { return n == null ? '—' : n + '%'; }

export type HealthBand = 'excellent' | 'good' | 'moderate' | 'at-risk' | 'critical';

// CP3-018: single source of truth for Health Score band cutoffs. The four
// cutoffs come from HealthThresholds (thresholds.service.ts), so an admin's
// configured values apply anywhere this is called with a live `thresholds`
// argument; callers with no live thresholds fall back to DEFAULT_THRESHOLDS.
export function getHealthBand(score: number, thresholds: HealthThresholds = DEFAULT_THRESHOLDS): HealthBand {
  if (score >= thresholds.healthScoreExcellentPct) return 'excellent';
  if (score >= thresholds.healthScoreGoodPct)      return 'good';
  if (score >= thresholds.healthScoreFairPct)      return 'moderate';
  if (score >= thresholds.healthScoreWeakPct)      return 'at-risk';
  return 'critical';
}

export const HEALTH_COLORS: Record<HealthBand, string> = {
  excellent: '#16a34a', good: '#0f766e', moderate: '#d97706',
  'at-risk': '#ea580c', critical: '#dc2626',
};

export function scrollToSection(id: string): void {
  const el = document.getElementById(id);
  if (!el) return;
  const header     = document.querySelector('header') as HTMLElement | null;
  const stickyBar  = document.getElementById('dashboard-sticky-bar') as HTMLElement | null;
  const offset = (header?.offsetHeight ?? 0) + (stickyBar?.offsetHeight ?? 0) + 16;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
}
