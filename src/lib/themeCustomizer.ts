// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Advanced theme customization — accent colour, border radius, font size, palette.
// All settings are applied via CSS custom properties on <html> and
// persisted to localStorage under dc_theme_custom.
// Branding (logo dataURL, app name) stored under dc_branding.

const STORAGE_KEY  = 'dc_theme_custom';
const BRANDING_KEY = 'dc_branding';

// ── Type definitions ──────────────────────────────────────────────────────────

export type AccentId   = 'blue' | 'purple' | 'teal' | 'orange' | 'indigo' | 'rose' | 'slate';
export type RadiusId   = 'sharp' | 'default' | 'rounded';
export type FontSizeId = 'sm' | 'md' | 'lg';
export type PaletteId  = 'none' | 'gold' | 'copper' | 'sage' | 'orange' | 'mediterranean';

export interface ThemeCustom {
  accent:   AccentId;
  radius:   RadiusId;
  fontSize: FontSizeId;
  palette:  PaletteId;
}

export interface BrandingConfig {
  appName:   string;
  logoUrl:   string;   // base64 dataURL or empty string
  faviconUrl: string;  // base64 dataURL or empty string
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

export interface PaletteTokens {
  label:      string;
  tagline:    string;
  badge:      string;
  // Whether this preset renders as a light or dark UI — drives whether
  // applyThemeCustom() adds the `.dark` class to <html>. Single source of
  // truth (replaces a separately-maintained dark-palette id list, which
  // could drift from the actual preset data).
  mode:       'light' | 'dark';
  acc:        string;
  acc2:       string;
  bg:         string;
  s1:         string;
  s2:         string;
  s3:         string;
  s4:         string;
  cta:        string;
  p1:         string;
  p2:         string;
  p3:         string;
  bdr:        string;
  bdr2:       string;
  accHover:   string;
  accShadow:  string;
  swatches:   string[];
}

export const PALETTE_PRESETS: Record<PaletteId, PaletteTokens> = {
  none: {
    label:     'Default (Light)',
    tagline:   'Tailwind white base · Blue accent · Standard SaaS look',
    badge:     'Current default',
    mode:      'light',
    acc:       '#2563eb', acc2:      '#3b82f6',
    bg:        '#f8fafc', s1:        '#ffffff',
    s2:        '#f1f5f9', s3:        '#e2e8f0',
    s4:        '#cbd5e1', cta:       '#2563eb',
    p1:        '#0f172a', p2:        '#64748b',
    p3:        '#94a3b8', bdr:       'rgba(203,213,225,0.7)',
    bdr2:      'rgba(148,163,184,0.5)',
    accHover:  '#1d4ed8', accShadow: 'rgba(37,99,235,0.25)',
    swatches:  ['#f8fafc','#ffffff','#f1f5f9','#2563eb','#0f172a','#64748b'],
  },
  gold: {
    label:     'A — Charcoal + Warm Gold',
    tagline:   'Pure charcoal base · Gold accent · Bloomberg-meets-delivery',
    badge:     'Most premium',
    mode:      'dark',
    acc:       '#D4AC39', acc2:      '#EDD87A',
    bg:        '#080808', s1:        '#111111',
    s2:        '#1C1C1C', s3:        '#262626',
    s4:        '#303030', cta:       '#E85D12',
    p1:        '#F0EDD8', p2:        '#888888',
    p3:        '#555555', bdr:       'rgba(255,255,255,0.07)',
    bdr2:      'rgba(255,255,255,0.13)',
    accHover:  '#c49a30', accShadow: 'rgba(212,172,57,0.25)',
    swatches:  ['#080808','#111111','#1C1C1C','#D4AC39','#F0EDD8','#E85D12'],
  },
  copper: {
    label:     'B — Graphite + Rose Copper',
    tagline:   'Warm graphite base · Copper accent · Mediterranean clay',
    badge:     'Most distinctive',
    mode:      'dark',
    acc:       '#C4845A', acc2:      '#E8B898',
    bg:        '#0D0B0A', s1:        '#171412',
    s2:        '#211D1A', s3:        '#2C2622',
    s4:        '#38302B', cta:       '#E85D12',
    p1:        '#F5EDE8', p2:        '#7A6A60',
    p3:        '#4A3F38', bdr:       'rgba(255,255,255,0.07)',
    bdr2:      'rgba(255,255,255,0.13)',
    accHover:  '#b07348', accShadow: 'rgba(196,132,90,0.25)',
    swatches:  ['#0D0B0A','#171412','#211D1A','#C4845A','#F5EDE8','#E85D12'],
  },
  sage: {
    label:     'C — Dark Slate + Sage Green',
    tagline:   'Green-tinted slate base · Sage accent · Calm and grounded',
    badge:     'Most grounded',
    mode:      'dark',
    acc:       '#6FAE7A', acc2:      '#B8D4BC',
    bg:        '#090C0A', s1:        '#131715',
    s2:        '#1C221E', s3:        '#252D27',
    s4:        '#2F3830', cta:       '#E85D12',
    p1:        '#EAF2EC', p2:        '#4A6050',
    p3:        '#3A4A3C', bdr:       'rgba(255,255,255,0.07)',
    bdr2:      'rgba(255,255,255,0.13)',
    accHover:  '#5e9b69', accShadow: 'rgba(111,174,122,0.25)',
    swatches:  ['#090C0A','#131715','#1C221E','#6FAE7A','#EAF2EC','#E85D12'],
  },
  orange: {
    label:     'D — Pure Grey + Orange Only',
    tagline:   'Neutral grey base · Orange the only accent · Max clarity',
    badge:     'Most confident',
    mode:      'dark',
    acc:       '#E85D12', acc2:      '#FF8A4C',
    bg:        '#0A0A0A', s1:        '#151515',
    s2:        '#202020', s3:        '#2A2A2A',
    s4:        '#353535', cta:       '#E85D12',
    p1:        '#F0F0F0', p2:        '#666666',
    p3:        '#444444', bdr:       'rgba(255,255,255,0.07)',
    bdr2:      'rgba(255,255,255,0.13)',
    accHover:  '#c94e0d', accShadow: 'rgba(232,93,18,0.25)',
    swatches:  ['#0A0A0A','#151515','#202020','#E85D12','#F0F0F0','#FF8A4C'],
  },
  mediterranean: {
    label:     'Mediterranean Intelligence',
    tagline:   'Warm sand base · Deep teal accent · Light, distinctive',
    badge:     'New',
    mode:      'light',
    acc:       '#087F8C', acc2:      '#2C7BE5',
    bg:        '#F5F6F4', s1:        '#FFFFFF',
    s2:        '#EEF5F4', s3:        '#FAFCFC',
    s4:        '#E5F5F5', cta:       '#087F8C',
    p1:        '#203038', p2:        '#65747A',
    p3:        '#8A9FA5', bdr:       'rgba(223,229,227,0.7)',
    bdr2:      'rgba(192,206,204,0.5)',
    accHover:  '#066B76', accShadow: 'rgba(8,127,140,0.25)',
    swatches:  ['#F5F6F4','#FFFFFF','#EEF5F4','#087F8C','#203038','#2C7BE5'],
  },
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
  palette:  'none',
};

export const DEFAULT_BRANDING: BrandingConfig = {
  appName:    'Delivery Clarity',
  logoUrl:    '',
  faviconUrl: '',
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
      palette:  (parsed.palette != null && parsed.palette in PALETTE_PRESETS) ? parsed.palette! : DEFAULT_THEME.palette,
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

export function loadBranding(): BrandingConfig {
  try {
    const raw = localStorage.getItem(BRANDING_KEY);
    if (!raw) return { ...DEFAULT_BRANDING };
    return { ...DEFAULT_BRANDING, ...(JSON.parse(raw) as Partial<BrandingConfig>) };
  } catch {
    return { ...DEFAULT_BRANDING };
  }
}

export function saveBranding(b: BrandingConfig): void {
  try { localStorage.setItem(BRANDING_KEY, JSON.stringify(b)); } catch {}
}

// ── Apply to DOM ──────────────────────────────────────────────────────────────

export function applyThemeCustom(settings: ThemeCustom): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const r = RADIUS_PRESETS[settings.radius]  ?? RADIUS_PRESETS.default;
  const f = FONT_SIZE_PRESETS[settings.fontSize] ?? FONT_SIZE_PRESETS.md;

  const pal = settings.palette && settings.palette !== 'none'
    ? PALETTE_PRESETS[settings.palette] ?? null
    : null;

  if (pal) {
    root.setAttribute('data-palette', settings.palette);
    root.style.setProperty('--dc-accent',        pal.acc);
    root.style.setProperty('--dc-accent-hover',  pal.accHover);
    root.style.setProperty('--dc-accent-shadow', pal.accShadow);
    root.style.setProperty('--dc-acc2',          pal.acc2);
    root.style.setProperty('--dc-cta',           pal.cta);
    root.style.setProperty('--dc-bg',            pal.bg);
    root.style.setProperty('--dc-s1',            pal.s1);
    root.style.setProperty('--dc-s2',            pal.s2);
    root.style.setProperty('--dc-s3',            pal.s3);
    root.style.setProperty('--dc-s4',            pal.s4);
    root.style.setProperty('--dc-p1',            pal.p1);
    root.style.setProperty('--dc-p2',            pal.p2);
    root.style.setProperty('--dc-p3',            pal.p3);
    root.style.setProperty('--dc-bdr',           pal.bdr);
    root.style.setProperty('--dc-bdr2',          pal.bdr2);
    // mode drives the `.dark` class, not "any preset besides none" — a
    // light preset (e.g. mediterranean) must not force dark mode.
    if (pal.mode === 'dark') {
      root.classList.add('dark');
      try { localStorage.setItem('dc-theme', 'dark'); } catch {}
    } else {
      root.classList.remove('dark');
      try { localStorage.setItem('dc-theme', 'light'); } catch {}
    }
  } else {
    root.removeAttribute('data-palette');
    const a = ACCENT_PRESETS[settings.accent] ?? ACCENT_PRESETS.blue;
    root.style.setProperty('--dc-accent',        a.hex);
    root.style.setProperty('--dc-accent-hover',  a.hover);
    root.style.setProperty('--dc-accent-shadow', a.shadow);
    root.style.setProperty('--dc-bg',            '#f8fafc');
    root.style.setProperty('--dc-s1',            '#ffffff');
    root.style.setProperty('--dc-s2',            '#f1f5f9');
    root.style.setProperty('--dc-s3',            '#e2e8f0');
    root.style.setProperty('--dc-s4',            '#cbd5e1');
    root.style.setProperty('--dc-p1',            '#0f172a');
    root.style.setProperty('--dc-p2',            '#64748b');
    root.style.setProperty('--dc-p3',            '#94a3b8');
    root.style.setProperty('--dc-bdr',           'rgba(203,213,225,0.7)');
    root.style.setProperty('--dc-bdr2',          'rgba(148,163,184,0.5)');
    // Fixes a latent bug: previously neither branch ever removed `.dark`,
    // so switching live from a dark palette back to 'none' (now reachable
    // once ThemeCustomizerPanel is mounted) would leave it stuck applied.
    root.classList.remove('dark');
    try { localStorage.setItem('dc-theme', 'light'); } catch {}
  }

  root.style.setProperty('--radius-md',   r.md);
  root.style.setProperty('--radius-lg',   r.lg);
  root.style.setProperty('--radius-full', r.full);
  root.style.fontSize = f.px;
}

export function initThemeCustom(): ThemeCustom {
  const settings = loadThemeCustom();
  // Enforce light mode: migrate any stored dark-mode palette to 'none'.
  // Derived from each preset's own `mode` field (single source of truth —
  // previously a separately-maintained id list that could drift from the
  // actual preset data as new presets were added).
  const isDarkPalette = settings.palette !== 'none' && PALETTE_PRESETS[settings.palette]?.mode === 'dark';
  const enforced: ThemeCustom = isDarkPalette
    ? { ...settings, palette: 'none' }
    : settings;
  if (enforced.palette !== settings.palette) saveThemeCustom(enforced);
  applyThemeCustom(enforced);
  return enforced;
}
