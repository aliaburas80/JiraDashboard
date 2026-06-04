// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Advanced theme customization — accent colour, border radius, font size.
// All settings are applied via CSS custom properties on <html> and
// persisted to localStorage under dc_theme_custom.

const STORAGE_KEY = 'dc_theme_custom';

// ── Type definitions ──────────────────────────────────────────────────────────

export type AccentId  = 'blue' | 'purple' | 'teal' | 'orange' | 'indigo' | 'rose' | 'slate';
export type RadiusId  = 'sharp' | 'default' | 'rounded';
export type FontSizeId = 'sm' | 'md' | 'lg';

export interface ThemeCustom {
  accent:   AccentId;
  radius:   RadiusId;
  fontSize: FontSizeId;
}

// ── Preset maps ───────────────────────────────────────────────────────────────

export const ACCENT_PRESETS: Record<AccentId, { label: string; hex: string; hover: string; shadow: string }> = {
  blue:    { label: 'Blue',   hex: '#2563eb', hover: '#1d4ed8', shadow: 'rgba(37,99,235,0.25)' },
  purple:  { label: 'Purple', hex: '#7c3aed', hover: '#6d28d9', shadow: 'rgba(124,58,237,0.25)' },
  teal:    { label: 'Teal',   hex: '#0d9488', hover: '#0f766e', shadow: 'rgba(13,148,136,0.25)' },
  orange:  { label: 'Orange', hex: '#ea580c', hover: '#c2410c', shadow: 'rgba(234,88,12,0.25)' },
  indigo:  { label: 'Indigo', hex: '#4f46e5', hover: '#4338ca', shadow: 'rgba(79,70,229,0.25)' },
  rose:    { label: 'Rose',   hex: '#e11d48', hover: '#be123c', shadow: 'rgba(225,29,72,0.25)' },
  slate:   { label: 'Slate',  hex: '#475569', hover: '#334155', shadow: 'rgba(71,85,105,0.25)' },
};

export const RADIUS_PRESETS: Record<RadiusId, { label: string; md: string; lg: string; full: string }> = {
  sharp:   { label: 'Sharp',   md: '6px',  lg: '10px', full: '8px'    },
  default: { label: 'Default', md: '12px', lg: '18px', full: '9999px' },
  rounded: { label: 'Rounded', md: '18px', lg: '24px', full: '9999px' },
};

export const FONT_SIZE_PRESETS: Record<FontSizeId, { label: string; px: string }> = {
  sm: { label: 'Small',  px: '13px' },
  md: { label: 'Medium', px: '14px' },
  lg: { label: 'Large',  px: '16px' },
};

// ── Default settings ──────────────────────────────────────────────────────────

export const DEFAULT_THEME: ThemeCustom = {
  accent:   'blue',
  radius:   'default',
  fontSize: 'md',
};

// ── Persistence ───────────────────────────────────────────────────────────────

export function loadThemeCustom(): ThemeCustom {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_THEME };
    const parsed = JSON.parse(raw) as Partial<ThemeCustom>;
    return {
      accent:   parsed.accent   in ACCENT_PRESETS    ? parsed.accent!   : DEFAULT_THEME.accent,
      radius:   parsed.radius   in RADIUS_PRESETS    ? parsed.radius!   : DEFAULT_THEME.radius,
      fontSize: parsed.fontSize in FONT_SIZE_PRESETS ? parsed.fontSize! : DEFAULT_THEME.fontSize,
    };
  } catch {
    return { ...DEFAULT_THEME };
  }
}

export function saveThemeCustom(settings: ThemeCustom): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch {}
}

export function resetThemeCustom(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

// ── Apply to DOM ──────────────────────────────────────────────────────────────

export function applyThemeCustom(settings: ThemeCustom): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const a = ACCENT_PRESETS[settings.accent]  ?? ACCENT_PRESETS.blue;
  const r = RADIUS_PRESETS[settings.radius]  ?? RADIUS_PRESETS.default;
  const f = FONT_SIZE_PRESETS[settings.fontSize] ?? FONT_SIZE_PRESETS.md;

  root.style.setProperty('--dc-accent',        a.hex);
  root.style.setProperty('--dc-accent-hover',  a.hover);
  root.style.setProperty('--dc-accent-shadow', a.shadow);
  root.style.setProperty('--radius-md',        r.md);
  root.style.setProperty('--radius-lg',        r.lg);
  root.style.setProperty('--radius-full',      r.full);
  root.style.fontSize = f.px;
}

export function initThemeCustom(): ThemeCustom {
  const settings = loadThemeCustom();
  applyThemeCustom(settings);
  return settings;
}
