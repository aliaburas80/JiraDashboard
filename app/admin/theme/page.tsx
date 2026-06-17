// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
'use client';

import { useState, useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import clsx from 'clsx';
import {
  AdminConsoleLayout,
  ADMINISTRATION_NAV,
} from '@/components/admin/AdminConsoleLayout';
import {
  PALETTE_PRESETS,
  FONT_SIZE_PRESETS,
  RADIUS_PRESETS,
  loadThemeCustom,
  saveThemeCustom,
  applyThemeCustom,
  loadBranding,
  saveBranding,
  DEFAULT_THEME,
  DEFAULT_BRANDING,
  type PaletteId,
  type ThemeCustom,
  type BrandingConfig,
} from '@/lib/themeCustomizer';
import styles from './page.module.scss';

// ── Palette card ──────────────────────────────────────────────────────────────

function PaletteCard({
  id,
  p,
  active,
  onSelect,
}: {
  id: PaletteId;
  p: (typeof PALETTE_PRESETS)[PaletteId];
  active: boolean;
  onSelect: () => void;
}) {
  const isDark = id !== 'none';

  // Dynamic per-card values from palette data — cannot be expressed as static SCSS
  const cardDynamic: CSSProperties = {
    '--card-bg': isDark ? p.bg : '#ffffff',
    '--card-border': active
      ? `2px solid ${p.acc}`
      : `1px solid ${isDark ? p.bdr2 : '#e2e8f0'}`,
    '--card-shadow': active
      ? `0 0 0 3px ${p.acc}33, 0 8px 24px rgba(0,0,0,0.3)`
      : '0 2px 8px rgba(0,0,0,0.1)',
  } as CSSProperties;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={styles.paletteCard}
      // eslint-disable-next-line react/forbid-dom-props
      style={cardDynamic}
      aria-pressed={active}
    >
      {/* Color stripe — each swatch color comes from palette runtime data */}
      <div className={styles.colorStripe}>
        {p.swatches.map((sw, i) => (
          <div
            key={i}
            className={styles.stripeSwatch}
            // Dynamic: each swatch has its own color from palette data
            // eslint-disable-next-line react/forbid-dom-props
            style={{ '--swatch-color': sw } as CSSProperties}
          />
        ))}
      </div>

      <div className={styles.cardBody}>
        {/* Header row */}
        <div className={styles.cardHeaderRow}>
          <div>
            <div
              className={styles.cardName}
              // Dynamic: text color from palette data (dark vs light theme)
              // eslint-disable-next-line react/forbid-dom-props
              style={{ '--card-name-color': isDark ? p.p1 : '#0f172a' } as CSSProperties}
            >
              {p.label}
            </div>
            <div
              className={styles.cardTagline}
              // Dynamic: muted text color from palette data
              // eslint-disable-next-line react/forbid-dom-props
              style={{ '--card-tagline-color': isDark ? p.p2 : '#64748b' } as CSSProperties}
            >
              {p.tagline}
            </div>
          </div>
          <span
            className={styles.cardBadge}
            // Dynamic: badge bg/color are palette-specific accent values
            // eslint-disable-next-line react/forbid-dom-props
            style={{
              '--card-badge-bg': `${p.acc}1a`,
              '--card-badge-color': p.acc,
            } as CSSProperties}
          >
            {p.badge}
          </span>
        </div>

        {/* Mini KPI preview */}
        <div className={styles.kpiGrid}>
          {[
            { label: 'Health', val: '73', color: p.acc },
            { label: 'Blocked', val: '4',  color: '#E85D12' },
            { label: 'Flow',    val: '68%', color: isDark ? p.p1 : '#0f172a' },
          ].map(kpi => (
            <div
              key={kpi.label}
              className={styles.kpiCell}
              // Dynamic: KPI cell bg/border come from palette data
              // eslint-disable-next-line react/forbid-dom-props
              style={{
                '--kpi-bg': isDark ? p.s2 : '#f8fafc',
                '--kpi-border': isDark ? p.bdr : '#e2e8f0',
              } as CSSProperties}
            >
              <div
                className={styles.kpiLabel}
                // Dynamic: label color from palette data
                // eslint-disable-next-line react/forbid-dom-props
                style={{ '--kpi-label-color': isDark ? p.p2 : '#64748b' } as CSSProperties}
              >
                {kpi.label}
              </div>
              <div
                className={styles.kpiValue}
                // Dynamic: value color is per-KPI and palette-derived
                // eslint-disable-next-line react/forbid-dom-props
                style={{ '--kpi-value-color': kpi.color } as CSSProperties}
              >
                {kpi.val}
              </div>
            </div>
          ))}
        </div>

        {/* Nav preview strip */}
        <div
          className={styles.navStrip}
          // Dynamic: nav strip bg/border from palette data
          // eslint-disable-next-line react/forbid-dom-props
          style={{
            '--nav-bg': isDark ? p.s1 : '#ffffff',
            '--nav-border': isDark ? p.bdr : '#e2e8f0',
          } as CSSProperties}
        >
          <svg width="14" height="14" viewBox="0 0 32 32" fill="none" className="shrink-0">
            <circle cx="16" cy="16" r="13" stroke={p.acc} strokeWidth="1.5" opacity=".5" />
            <path d="M11 16.5l3.5 3.5 6.5-7" stroke={p.acc} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          <span
            className={styles.navLogo}
            // Dynamic: logo text color from palette data
            // eslint-disable-next-line react/forbid-dom-props
            style={{ '--nav-logo-color': isDark ? p.p1 : '#0f172a' } as CSSProperties}
          >
            DC
          </span>
          <span
            className={styles.navActive}
            // Dynamic: active nav item uses palette accent
            // eslint-disable-next-line react/forbid-dom-props
            style={{
              '--nav-active-bg': `${p.acc}1a`,
              '--nav-active-color': p.acc,
            } as CSSProperties}
          >
            Dashboard
          </span>
          <span
            className={styles.navMuted}
            // Dynamic: muted nav item color from palette data
            // eslint-disable-next-line react/forbid-dom-props
            style={{ '--nav-muted-color': isDark ? p.p3 : '#94a3b8' } as CSSProperties}
          >
            Reports
          </span>
          <div className={styles.navCta}>Upload</div>
        </div>
      </div>

      {/* Active checkmark */}
      {active && (
        <div
          className={styles.activeCheck}
          // Dynamic: checkmark bg uses palette accent color
          // eslint-disable-next-line react/forbid-dom-props
          style={{ '--check-bg': p.acc } as CSSProperties}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </button>
  );
}

// ── Logo upload ───────────────────────────────────────────────────────────────

function LogoUpload({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (dataUrl: string) => void;
  hint: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onChange(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <p className={styles.logoLabel}>{label}</p>
      <div className={styles.logoRow}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
          className={clsx(styles.logoDropzone, { [styles['logoDropzone--hasImage']]: !!value })}
        >
          {value ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={value} alt={label} className={styles.logoPreview} />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 12V4m0 0L8 8m4-4l4 4" />
            </svg>
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={styles.logoUploadBtn}
          >
            {value ? 'Replace image' : 'Upload image'}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className={styles.logoRemoveBtn}
            >
              Remove
            </button>
          )}
          <p className={styles.logoHint}>{hint}</p>
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className={styles.hiddenInput} />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminThemePage() {
  const [settings, setSettings] = useState<ThemeCustom>({ ...DEFAULT_THEME });
  const [branding, setBranding] = useState<BrandingConfig>({ ...DEFAULT_BRANDING });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(loadThemeCustom());
    setBranding(loadBranding());
  }, []);

  function updatePalette(palette: PaletteId) {
    const next = { ...settings, palette };
    setSettings(next);
    applyThemeCustom(next);
  }

  function updateRadius(radius: ThemeCustom['radius']) {
    const next = { ...settings, radius };
    setSettings(next);
    applyThemeCustom(next);
  }

  function updateFontSize(fontSize: ThemeCustom['fontSize']) {
    const next = { ...settings, fontSize };
    setSettings(next);
    applyThemeCustom(next);
  }

  function updateBranding(patch: Partial<BrandingConfig>) {
    setBranding(prev => ({ ...prev, ...patch }));
  }

  function handleSave() {
    saveThemeCustom(settings);
    saveBranding(branding);
    applyThemeCustom(settings);
    // Notify AppShell of branding change via storage event
    window.dispatchEvent(new Event('storage'));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleReset() {
    const defaults = { ...DEFAULT_THEME };
    setSettings(defaults);
    setBranding({ ...DEFAULT_BRANDING });
    saveThemeCustom(defaults);
    saveBranding({ ...DEFAULT_BRANDING });
    applyThemeCustom(defaults);
  }

  const activePal = PALETTE_PRESETS[settings.palette];

  const stats = [
    { icon: 'palette', label: 'Active palette',  value: activePal?.badge ?? '—',      note: activePal?.label ?? 'None',  tone: 'bg-indigo-50 text-indigo-700' },
    { icon: 'text', label: 'Font size',        value: FONT_SIZE_PRESETS[settings.fontSize]?.label ?? '—', note: FONT_SIZE_PRESETS[settings.fontSize]?.px ?? '—', tone: 'bg-blue-50 text-blue-700' },
    { icon: 'customize', label: 'Corner radius',    value: RADIUS_PRESETS[settings.radius]?.label ?? '—', note: `md: ${RADIUS_PRESETS[settings.radius]?.md ?? '—'}`, tone: 'bg-slate-50 text-slate-700' },
    { icon: 'tag', label: 'App name',         value: branding.appName || '—',       note: branding.logoUrl ? 'Custom logo set' : 'Default logo', tone: 'bg-amber-50 text-amber-700' },
  ];

  return (
    <AdminConsoleLayout
      title="Theme & Branding"
        description="Choose a colour palette, upload your logo, and customise the app name. Changes apply instantly and persist for all sessions on this device."
        stats={stats}
        statusLabel="Live preview"
        actions={
          <div className={styles.actionRow}>
            <button
              type="button"
              onClick={handleReset}
              className={styles.btnReset}
            >
              Reset defaults
            </button>
            <button
              type="button"
              onClick={handleSave}
              className={clsx(styles.btnSave, { [styles['btnSave--saved']]: saved })}
            >
              {saved ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Saved
                </>
              ) : 'Save changes'}
            </button>
          </div>
        }
      >
        {/* ── Section 1: Colour palettes ──────────────────────────────────── */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Colour Palette</h2>
              <p className={styles.sectionDesc}>
                Four themes from the UIUXTemplate design system. All dark except Default (Light).
              </p>
            </div>
            <span
              className={styles.activeBadge}
              // Dynamic: badge uses active palette accent color from runtime palette data
              // eslint-disable-next-line react/forbid-dom-props
              style={{
                '--badge-bg': `${activePal?.acc ?? '#2563eb'}1a`,
                '--badge-color': activePal?.acc ?? '#2563eb',
              } as CSSProperties}
            >
              Active: {activePal?.badge ?? '—'}
            </span>
          </div>

          <div className={styles.paletteGrid}>
            {(Object.entries(PALETTE_PRESETS) as [PaletteId, (typeof PALETTE_PRESETS)[PaletteId]][]).map(([id, p]) => (
              <PaletteCard
                key={id}
                id={id}
                p={p}
                active={settings.palette === id}
                onSelect={() => updatePalette(id)}
              />
            ))}
          </div>
        </section>

        {/* ── Section 2: Typography & Radius ─────────────────────────────── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Typography &amp; Shape</h2>

          <div className="grid grid-cols-2 gap-6">
            {/* Font size */}
            <div>
              <p className={styles.controlLabel}>Base font size</p>
              <div className={styles.presetRow}>
                {(Object.entries(FONT_SIZE_PRESETS) as [ThemeCustom['fontSize'], typeof FONT_SIZE_PRESETS[ThemeCustom['fontSize']]][]).map(([id, p]) => {
                  const active = settings.fontSize === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => updateFontSize(id)}
                      className={clsx(
                        styles.presetBtn,
                        id === 'sm' ? styles.presetBtnSm : id === 'lg' ? styles.presetBtnLg : styles.presetBtnMd,
                        { [styles['presetBtn--active']]: active }
                      )}
                    >
                      {p.label}
                      <span className={styles.presetHint}>{p.px}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Border radius */}
            <div>
              <p className={styles.controlLabel}>Corner radius</p>
              <div className={styles.presetRow}>
                {(Object.entries(RADIUS_PRESETS) as [ThemeCustom['radius'], typeof RADIUS_PRESETS[ThemeCustom['radius']]][]).map(([id, p]) => {
                  const active = settings.radius === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => updateRadius(id)}
                      className={clsx(
                        styles.presetBtn,
                        styles.presetBtnMd,
                        id === 'sharp' ? styles.radiusBtnSharp : id === 'rounded' ? styles.radiusBtnRounded : styles.radiusBtnDefault,
                        { [styles['presetBtn--active']]: active }
                      )}
                    >
                      {p.label}
                      <span className={styles.presetHint}>{p.md}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Typography spec reference */}
          <div className={styles.fontRef}>
            <p className={styles.fontRefLabel}>Font stack (UIUXTemplate spec)</p>
            <div className={styles.fontRefGrid}>
              <div>
                <p className={clsx(styles.fontSample, styles['fontSample--jakarta'])}>Plus Jakarta Sans</p>
                <p className={styles.fontSampleDesc}>UI text · headings · labels</p>
              </div>
              <div>
                <p className={clsx(styles.fontSample, styles['fontSample--mono'])}>JetBrains Mono</p>
                <p className={styles.fontSampleDesc}>Metric numbers · evidence tags</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 3: Branding ─────────────────────────────────────────── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Branding</h2>
          <p className={clsx(styles.sectionDesc, 'mb-5')}>
            Customise the app name and logo shown in the navigation bar. Logos are stored locally in your browser.
          </p>

          <div className={styles.brandingGrid}>
            {/* App name */}
            <div>
              <p className={styles.fieldLabel}>App name</p>
              <input
                type="text"
                value={branding.appName}
                onChange={e => updateBranding({ appName: e.target.value })}
                placeholder="Delivery Clarity"
                className={styles.textInput}
              />
              <p className={styles.inputHint}>Shown in the nav bar and page title</p>
            </div>

            {/* Favicon upload */}
            <LogoUpload
              label="Favicon / app icon"
              value={branding.faviconUrl}
              onChange={faviconUrl => updateBranding({ faviconUrl })}
              hint="SVG or PNG · 32×32 or 64×64 px"
            />
          </div>

          <LogoUpload
            label="Navigation logo (horizontal)"
            value={branding.logoUrl}
            onChange={logoUrl => updateBranding({ logoUrl })}
            hint="SVG, PNG or WebP · max 160×40 px recommended · replaces the default Delivery Clarity logo"
          />
        </section>

        {/* ── Section 4: Token reference ──────────────────────────────────── */}
        <section className={clsx(styles.section, 'mb-0')}>
          <h2 className={styles.sectionTitle}>Active Token Reference</h2>
          <p className={clsx(styles.sectionDesc, 'mb-4')}>
            CSS custom properties currently applied to <code className={styles.code}>{'<html>'}</code>. These drive all themed components.
          </p>

          <div className={styles.tokenGrid}>
            {[
              { name: '--dc-bg',      val: activePal?.bg      ?? '#f8fafc', role: 'Page background'  },
              { name: '--dc-s1',      val: activePal?.s1      ?? '#ffffff', role: 'Surface / nav'    },
              { name: '--dc-s2',      val: activePal?.s2      ?? '#f1f5f9', role: 'Card background'  },
              { name: '--dc-s3',      val: activePal?.s3      ?? '#e2e8f0', role: 'Hover / elevated' },
              { name: '--dc-accent',  val: activePal?.acc     ?? '#2563eb', role: 'Primary accent'   },
              { name: '--dc-acc2',    val: activePal?.acc2    ?? '#3b82f6', role: 'Accent light'     },
              { name: '--dc-cta',     val: activePal?.cta     ?? '#2563eb', role: 'CTA button'       },
              { name: '--dc-p1',      val: activePal?.p1      ?? '#0f172a', role: 'Primary text'     },
              { name: '--dc-p2',      val: activePal?.p2      ?? '#64748b', role: 'Muted text'       },
              { name: '--dc-p3',      val: activePal?.p3      ?? '#94a3b8', role: 'Label / subtle'   },
              { name: '--dc-green',   val: '#22C55E',                       role: 'Excellent status' },
              { name: '--dc-amber',   val: '#F59E0B',                       role: 'Moderate status'  },
              { name: '--dc-red',     val: '#F87171',                       role: 'Critical status'  },
            ].map(tok => (
              <div key={tok.name} className={styles.tokenCard}>
                <div
                  className={styles.tokenSwatch}
                  // Dynamic: swatch color is the resolved token value (from runtime palette data)
                  // eslint-disable-next-line react/forbid-dom-props
                  style={{ '--swatch-color': tok.val } as CSSProperties}
                />
                <div className={styles.tokenInfo}>
                  <p className={styles.tokenName}>{tok.name}</p>
                  <p className={styles.tokenVal}>{tok.val}</p>
                  <p className={styles.tokenRole}>{tok.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
    </AdminConsoleLayout>
  );
}
