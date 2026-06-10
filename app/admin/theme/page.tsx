// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
'use client';

import { useState, useEffect, useRef } from 'react';
import AppShell from '@/components/layout/AppShell';
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

  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        width: '100%',
        background: isDark ? p.bg : '#ffffff',
        border: active ? `2px solid ${p.acc}` : `1px solid ${isDark ? p.bdr2 : '#e2e8f0'}`,
        borderRadius: 14,
        padding: 0,
        cursor: 'pointer',
        transition: 'all 200ms',
        boxShadow: active ? `0 0 0 3px ${p.acc}33, 0 8px 24px rgba(0,0,0,0.3)` : '0 2px 8px rgba(0,0,0,0.1)',
        textAlign: 'left',
        overflow: 'hidden',
        position: 'relative',
      }}
      aria-pressed={active}
    >
      {/* Color stripe */}
      <div style={{ display: 'flex', height: 6 }}>
        {p.swatches.map((sw, i) => (
          <div key={i} style={{ flex: 1, background: sw }} />
        ))}
      </div>

      <div style={{ padding: '14px 16px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: isDark ? p.p1 : '#0f172a', marginBottom: 2 }}>
              {p.label}
            </div>
            <div style={{ fontSize: 10, color: isDark ? p.p2 : '#64748b', lineHeight: 1.5 }}>
              {p.tagline}
            </div>
          </div>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
            textTransform: 'uppercase' as const,
            background: `${p.acc}1a`, color: p.acc,
            padding: '2px 8px', borderRadius: 3, flexShrink: 0, marginLeft: 8,
          }}>
            {p.badge}
          </span>
        </div>

        {/* Mini KPI preview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 10 }}>
          {[
            { label: 'Health', val: '73', color: p.acc },
            { label: 'Blocked', val: '4',  color: '#E85D12' },
            { label: 'Flow',    val: '68%', color: isDark ? p.p1 : '#0f172a' },
          ].map(kpi => (
            <div key={kpi.label} style={{
              background: isDark ? p.s2 : '#f8fafc',
              border: `1px solid ${isDark ? p.bdr : '#e2e8f0'}`,
              borderRadius: 8, padding: '7px 8px',
            }}>
              <div style={{ fontSize: 8, color: isDark ? p.p2 : '#64748b', marginBottom: 2 }}>{kpi.label}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 500, color: kpi.color, lineHeight: 1 }}>{kpi.val}</div>
            </div>
          ))}
        </div>

        {/* Nav preview strip */}
        <div style={{
          background: isDark ? p.s1 : '#ffffff',
          border: `1px solid ${isDark ? p.bdr : '#e2e8f0'}`,
          borderRadius: 100, padding: '5px 10px',
          display: 'flex', alignItems: 'center', gap: 4, fontSize: 10,
        }}>
          <svg width="14" height="14" viewBox="0 0 32 32" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="16" cy="16" r="13" stroke={p.acc} strokeWidth="1.5" opacity=".5" />
            <path d="M11 16.5l3.5 3.5 6.5-7" stroke={p.acc} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          <span style={{ fontWeight: 700, color: isDark ? p.p1 : '#0f172a', fontSize: 10 }}>DC</span>
          <span style={{ marginLeft: 4, background: `${p.acc}1a`, color: p.acc, padding: '2px 8px', borderRadius: 100, fontWeight: 600 }}>Dashboard</span>
          <span style={{ color: isDark ? p.p3 : '#94a3b8', marginLeft: 2 }}>Reports</span>
          <div style={{ marginLeft: 'auto', background: '#E85D12', color: '#fff', padding: '3px 10px', borderRadius: 100, fontWeight: 700, fontSize: 9 }}>Upload</div>
        </div>
      </div>

      {/* Active checkmark */}
      {active && (
        <div style={{
          position: 'absolute', top: 10, right: 10,
          width: 20, height: 20, borderRadius: '50%',
          background: p.acc, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
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
      <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
        {label}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          onClick={() => inputRef.current?.click()}
          style={{
            width: 120, height: 48, borderRadius: 10,
            border: '1.5px dashed #cbd5e1',
            background: value ? 'transparent' : '#f8fafc',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', overflow: 'hidden', transition: 'border-color 200ms',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--dc-accent, #2563eb)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = '#cbd5e1')}
        >
          {value ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={value} alt={label} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
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
            style={{
              fontSize: 12, fontWeight: 700, color: 'var(--dc-accent, #2563eb)',
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: 0, display: 'block', marginBottom: 4,
            }}
          >
            {value ? 'Replace image' : 'Upload image'}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              style={{ fontSize: 11, color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Remove
            </button>
          )}
          <p style={{ fontSize: 10, color: '#94a3b8', marginTop: value ? 0 : 4 }}>{hint}</p>
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
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
    { icon: '🎨', label: 'Active palette',  value: activePal?.badge ?? '—',      note: activePal?.label ?? 'None',  tone: 'bg-indigo-50 text-indigo-700' },
    { icon: '🔤', label: 'Font size',        value: FONT_SIZE_PRESETS[settings.fontSize]?.label ?? '—', note: FONT_SIZE_PRESETS[settings.fontSize]?.px ?? '—', tone: 'bg-blue-50 text-blue-700' },
    { icon: '⬛', label: 'Corner radius',    value: RADIUS_PRESETS[settings.radius]?.label ?? '—', note: `md: ${RADIUS_PRESETS[settings.radius]?.md ?? '—'}`, tone: 'bg-slate-50 text-slate-700' },
    { icon: '🏷️', label: 'App name',         value: branding.appName || '—',       note: branding.logoUrl ? 'Custom logo set' : 'Default logo', tone: 'bg-amber-50 text-amber-700' },
  ];

  return (
    <AppShell showNav>
      <AdminConsoleLayout
        title="Theme & Branding"
        description="Choose a colour palette, upload your logo, and customise the app name. Changes apply instantly and persist for all sessions on this device."
        stats={stats}
        statusLabel="Live preview"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={handleReset}
              style={{
                height: 42, padding: '0 16px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                border: '1px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer',
              }}
            >
              Reset defaults
            </button>
            <button
              type="button"
              onClick={handleSave}
              style={{
                height: 42, padding: '0 20px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                background: saved ? '#22c55e' : 'var(--dc-accent, #2563eb)',
                color: '#fff', border: 'none', cursor: 'pointer', transition: 'background 300ms',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
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
        <section style={{
          background: '#fff', border: '1px solid #e2e8f0',
          borderRadius: 14, padding: '24px 24px 28px',
          boxShadow: '0 3px 12px rgba(15,23,42,0.035)', marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
                Colour Palette
              </h2>
              <p style={{ fontSize: 13, color: '#64748b' }}>
                Four themes from the UIUXTemplate design system. All dark except Default (Light).
              </p>
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
              textTransform: 'uppercase' as const,
              background: `${activePal?.acc ?? '#2563eb'}1a`,
              color: activePal?.acc ?? '#2563eb',
              padding: '4px 12px', borderRadius: 100,
            }}>
              Active: {activePal?.badge ?? '—'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
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
        <section style={{
          background: '#fff', border: '1px solid #e2e8f0',
          borderRadius: 14, padding: '24px 24px 28px',
          boxShadow: '0 3px 12px rgba(15,23,42,0.035)', marginBottom: 16,
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>
            Typography &amp; Shape
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Font size */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 10, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
                Base font size
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                {(Object.entries(FONT_SIZE_PRESETS) as [ThemeCustom['fontSize'], typeof FONT_SIZE_PRESETS[ThemeCustom['fontSize']]][]).map(([id, p]) => {
                  const active = settings.fontSize === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => updateFontSize(id)}
                      style={{
                        flex: 1, padding: '10px 8px', fontWeight: 700,
                        fontSize: id === 'sm' ? 11 : id === 'lg' ? 14 : 12,
                        borderRadius: 10,
                        border: active ? `2px solid var(--dc-accent, #2563eb)` : '1px solid #e2e8f0',
                        background: active ? `color-mix(in srgb, var(--dc-accent, #2563eb) 10%, transparent)` : '#f8fafc',
                        color: active ? 'var(--dc-accent, #2563eb)' : '#64748b',
                        cursor: 'pointer', transition: 'all 150ms',
                      }}
                    >
                      {p.label}
                      <span style={{ display: 'block', fontSize: 9, fontWeight: 500, marginTop: 2, opacity: 0.7 }}>{p.px}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Border radius */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 10, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
                Corner radius
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                {(Object.entries(RADIUS_PRESETS) as [ThemeCustom['radius'], typeof RADIUS_PRESETS[ThemeCustom['radius']]][]).map(([id, p]) => {
                  const active = settings.radius === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => updateRadius(id)}
                      style={{
                        flex: 1, padding: '10px 8px', fontSize: 12, fontWeight: 700,
                        borderRadius: id === 'sharp' ? 4 : id === 'rounded' ? 14 : 8,
                        border: active ? `2px solid var(--dc-accent, #2563eb)` : '1px solid #e2e8f0',
                        background: active ? `color-mix(in srgb, var(--dc-accent, #2563eb) 10%, transparent)` : '#f8fafc',
                        color: active ? 'var(--dc-accent, #2563eb)' : '#64748b',
                        cursor: 'pointer', transition: 'all 150ms',
                      }}
                    >
                      {p.label}
                      <span style={{ display: 'block', fontSize: 9, fontWeight: 500, marginTop: 2, opacity: 0.7 }}>{p.md}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Typography spec reference */}
          <div style={{
            marginTop: 20, padding: '14px 16px', borderRadius: 10,
            background: '#f8fafc', border: '1px solid #e2e8f0',
          }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 10 }}>
              Font stack (UIUXTemplate spec)
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>Plus Jakarta Sans</p>
                <p style={{ fontSize: 10, color: '#64748b' }}>UI text · headings · labels</p>
              </div>
              <div>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 500, color: '#0f172a', marginBottom: 2 }}>JetBrains Mono</p>
                <p style={{ fontSize: 10, color: '#64748b' }}>Metric numbers · evidence tags</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 3: Branding ─────────────────────────────────────────── */}
        <section style={{
          background: '#fff', border: '1px solid #e2e8f0',
          borderRadius: 14, padding: '24px 24px 28px',
          boxShadow: '0 3px 12px rgba(15,23,42,0.035)', marginBottom: 16,
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
            Branding
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
            Customise the app name and logo shown in the navigation bar. Logos are stored locally in your browser.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 20 }}>
            {/* App name */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
                App name
              </p>
              <input
                type="text"
                value={branding.appName}
                onChange={e => updateBranding({ appName: e.target.value })}
                placeholder="Delivery Clarity"
                style={{
                  width: '100%', height: 42, padding: '0 14px', borderRadius: 10,
                  border: '1px solid #e2e8f0', background: '#f8fafc',
                  fontSize: 13, fontWeight: 600, color: '#0f172a',
                  outline: 'none', transition: 'border-color 200ms',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--dc-accent, #2563eb)')}
                onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
              />
              <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 6 }}>Shown in the nav bar and page title</p>
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
        <section style={{
          background: '#fff', border: '1px solid #e2e8f0',
          borderRadius: 14, padding: '24px 24px 28px',
          boxShadow: '0 3px 12px rgba(15,23,42,0.035)',
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
            Active Token Reference
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
            CSS custom properties currently applied to <code style={{ fontSize: 11, background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>{'<html>'}</code>. These drive all themed components.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
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
              <div key={tok.name} style={{
                background: '#f8fafc', border: '1px solid #e2e8f0',
                borderRadius: 8, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 5, flexShrink: 0,
                  background: tok.val, border: '1px solid rgba(0,0,0,0.08)',
                }} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#64748b', marginBottom: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tok.name}</p>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#0f172a', marginBottom: 1 }}>{tok.val}</p>
                  <p style={{ fontSize: 9, color: '#94a3b8' }}>{tok.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </AdminConsoleLayout>
    </AppShell>
  );
}
