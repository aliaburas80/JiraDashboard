// @ts-nocheck
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function formatDays(d: number | null | undefined): string { return d == null ? '—' : d + 'd'; }
export function formatPct(n: number | null | undefined): string { return n == null ? '—' : n + '%'; }

export type HealthBand = 'excellent' | 'good' | 'moderate' | 'at-risk' | 'critical';
export function getHealthBand(score: number): HealthBand {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'moderate';
  if (score >= 40) return 'at-risk';
  return 'critical';
}

export const HEALTH_COLORS: Record<HealthBand, string> = {
  excellent: '#16a34a', good: '#0f766e', moderate: '#d97706',
  'at-risk': '#ea580c', critical: '#dc2626',
};

export function scrollToSection(id: string): void {
  const el = document.getElementById(id);
  if (!el) return;
  const header = document.querySelector('header') as HTMLElement | null;
  const offset = (header ? header.offsetHeight : 0) + 16;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
}
