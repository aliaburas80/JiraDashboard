// @ts-nocheck
// ─── Tailwind config ──────────────────────────────────────────────────────────
// Colours reference CSS custom properties defined in src/styles/_tokens.scss
// so Tailwind utilities and SCSS modules share a single token system.
// Never add raw hex colours here — add a token to _tokens.scss first.
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ── Semantic colour aliases → CSS token variables ────────────────────
      colors: {
        // Primary / brand
        primary:   { DEFAULT: 'var(--color-primary, #2563eb)', hover: 'var(--color-primary-hover, #1d4ed8)', soft: 'var(--color-primary-soft, #eff6ff)' },
        // Surface layers
        surface:   { DEFAULT: 'var(--color-surface, #ffffff)', page: 'var(--color-page, #f8fafc)', subtle: 'var(--color-subtle, #f1f5f9)', muted: 'var(--color-muted, #e2e8f0)' },
        // Text
        ink:       { primary: 'var(--color-text-primary, #0f172a)', secondary: 'var(--color-text-secondary, #64748b)', muted: 'var(--color-text-muted, #94a3b8)' },
        // Borders
        border:    { DEFAULT: 'var(--color-border, rgba(203,213,225,0.7))', strong: 'var(--color-border-strong)' },
        // Status
        ok:        { DEFAULT: 'var(--color-success, #22c55e)', soft: 'var(--color-success-soft)' },
        warn:      { DEFAULT: 'var(--color-warning, #f59e0b)', soft: 'var(--color-warning-soft)' },
        danger:    { DEFAULT: 'var(--color-danger, #f87171)', strong: 'var(--color-danger-strong, #dc2626)', soft: 'var(--color-danger-soft)' },
        // Legacy brand aliases kept for backward compatibility
        brand:   { '50': '#eff6ff', '100': '#dbeafe', '500': '#3b82f6', '600': '#2563eb', '700': '#1d4ed8' },
        success: { '50': '#f0fdf4', '500': '#22c55e', '700': '#15803d' },
        warning: { '50': '#fffbeb', '500': '#f59e0b', '700': '#b45309' },
      },
      // ── Border radii → CSS tokens ─────────────────────────────────────────
      borderRadius: {
        chip: 'var(--radius-chip, 20px)',
        card: 'var(--radius-xl, 12px)',
        sm:   'var(--radius-sm, 6px)',
        md:   'var(--radius-md, 8px)',
        lg:   'var(--radius-lg, 10px)',
      },
      // ── Font families → CSS tokens ────────────────────────────────────────
      fontFamily: {
        sans:  ['var(--font-jakarta)', 'var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono:  ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      // ── Spacing tokens ────────────────────────────────────────────────────
      spacing: {
        'header': 'var(--header-height, 52px)',
        'sidebar': 'var(--sidebar-width, 228px)',
      },
      // ── Box shadows → CSS tokens ──────────────────────────────────────────
      boxShadow: {
        card:     'var(--shadow-card)',
        toolbar:  'var(--shadow-toolbar)',
        dropdown: 'var(--shadow-dropdown)',
      },
      // ── Keyframes ─────────────────────────────────────────────────────────
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '20%':      { transform: 'rotate(-15deg)' },
          '40%':      { transform: 'rotate(15deg)' },
          '60%':      { transform: 'rotate(-10deg)' },
          '80%':      { transform: 'rotate(10deg)' },
        },
      },
      animation: {
        wiggle: 'wiggle 0.6s ease-in-out',
      },
    },
  },
  plugins: [],
};
export default config;
