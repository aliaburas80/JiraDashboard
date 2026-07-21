// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Advanced theme customization panel — accent colour, radius, font size.
'use client';

import { useState, useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import styles from './ThemeCustomizerPanel.module.scss';
import {
  ACCENT_PRESETS,
  RADIUS_PRESETS,
  FONT_SIZE_PRESETS,
  PALETTE_PRESETS,
  loadThemeCustom,
  saveThemeCustom,
  applyThemeCustom,
  resetThemeCustom,
  DEFAULT_THEME,
  type ThemeCustom,
  type AccentId,
  type RadiusId,
  type FontSizeId,
  type PaletteId,
} from '@/lib/themeCustomizer';

type CSSVars = CSSProperties & Record<`--${string}`, string | number>;

export default function ThemeCustomizerPanel() {
  const [open,     setOpen]     = useState(false);
  const [settings, setSettings] = useState<ThemeCustom>(DEFAULT_THEME);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSettings(loadThemeCustom());
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  function update(patch: Partial<ThemeCustom>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveThemeCustom(next);
    applyThemeCustom(next);
  }

  function handleReset() {
    resetThemeCustom();
    setSettings({ ...DEFAULT_THEME });
    applyThemeCustom({ ...DEFAULT_THEME });
  }

  return (
    <div ref={panelRef} className={styles.wrapper}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        title="Customise theme"
        className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="Open theme customizer"
        aria-expanded={open}
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
          <path d="M12 3a9 9 0 0 0 0 18c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8Zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12Zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8Zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8Zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5Z"/>
        </svg>
      </button>

      {/* Panel */}
      {open && (
        <div
          className={clsx(styles.panel, 'dark:bg-slate-800 dark:border-slate-700')}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Theme</p>
            <button type="button" onClick={handleReset}
              className="text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors">
              Reset
            </button>
          </div>

          {/* Palette — UIUXTemplate themes */}
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Palette</p>
            <div className="grid grid-cols-5 gap-1.5 mb-1">
              {(Object.entries(PALETTE_PRESETS) as [PaletteId, typeof PALETTE_PRESETS[PaletteId]][]).map(([id, p]) => {
                const active = settings.palette === id;
                // DYNAMIC CSS VARIABLE:
                // Palette colors are per-preset (open-ended, admin-configurable
                // set) and cannot be expressed as a fixed class.
                const swatchVars: CSSVars = {
                  '--swatch-gradient': `linear-gradient(135deg, ${p.swatches[0]} 50%, ${p.acc} 50%)`,
                  '--swatch-active-color': p.acc,
                };
                return (
                  <button
                    key={id}
                    type="button"
                    title={p.label}
                    onClick={() => update({ palette: id })}
                    className={styles.swatch}
                    data-active={active}
                    style={swatchVars}
                    aria-label={`Set palette to ${p.label}`}
                    aria-pressed={active}
                  />
                );
              })}
            </div>
            <p className={styles.paletteHint}>
              {PALETTE_PRESETS[settings.palette]?.label ?? 'Default'}
            </p>
            <Link href="/admin/theme" onClick={() => setOpen(false)}
              className={styles.paletteLink}>
              Full theme configurator →
            </Link>
          </div>

          {/* Accent colour (only shown when palette = none) */}
          {settings.palette === 'none' && (
            <div className="mb-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Accent colour</p>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(ACCENT_PRESETS) as [AccentId, typeof ACCENT_PRESETS[AccentId]][]).map(([id, preset]) => {
                  // DYNAMIC CSS VARIABLE:
                  // Accent color is per-preset and cannot be a fixed class.
                  const accentVars: CSSVars = { '--accent-color': preset.hex };
                  return (
                    <button
                      key={id}
                      type="button"
                      title={preset.label}
                      onClick={() => update({ accent: id })}
                      className={styles.accentDot}
                      data-active={settings.accent === id}
                      style={accentVars}
                      aria-label={`Set accent to ${preset.label}`}
                      aria-pressed={settings.accent === id}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Border radius */}
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Corner radius</p>
            <div className="flex gap-2">
              {(Object.entries(RADIUS_PRESETS) as [RadiusId, typeof RADIUS_PRESETS[RadiusId]][]).map(([id, preset]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => update({ radius: id })}
                  className={styles.presetBtn}
                  data-radius={id}
                  data-active={settings.radius === id}
                  aria-pressed={settings.radius === id}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Font size */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Text size</p>
            <div className="flex gap-2">
              {(Object.entries(FONT_SIZE_PRESETS) as [FontSizeId, typeof FONT_SIZE_PRESETS[FontSizeId]][]).map(([id, preset]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => update({ fontSize: id })}
                  className={styles.presetBtn}
                  data-size={id}
                  data-active={settings.fontSize === id}
                  aria-pressed={settings.fontSize === id}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
