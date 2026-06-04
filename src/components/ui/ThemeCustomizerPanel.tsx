// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Advanced theme customization panel — accent colour, radius, font size.
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  ACCENT_PRESETS,
  RADIUS_PRESETS,
  FONT_SIZE_PRESETS,
  loadThemeCustom,
  saveThemeCustom,
  applyThemeCustom,
  resetThemeCustom,
  DEFAULT_THEME,
  type ThemeCustom,
  type AccentId,
  type RadiusId,
  type FontSizeId,
} from '@/lib/themeCustomizer';

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
    <div ref={panelRef} style={{ position: 'relative' }}>
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
          style={{
            position: 'absolute', right: 0, top: 'calc(100% + 8px)',
            width: 260, background: '#fff', border: '1px solid #e2e8f0',
            borderRadius: 16, boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
            zIndex: 9999, padding: 16,
          }}
          className="dark:bg-slate-800 dark:border-slate-700"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Theme</p>
            <button type="button" onClick={handleReset}
              className="text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors">
              Reset
            </button>
          </div>

          {/* Accent colour */}
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Accent colour</p>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(ACCENT_PRESETS) as [AccentId, typeof ACCENT_PRESETS[AccentId]][]).map(([id, preset]) => (
                <button
                  key={id}
                  type="button"
                  title={preset.label}
                  onClick={() => update({ accent: id })}
                  style={{
                    width: 28, height: 28,
                    borderRadius: '50%',
                    background: preset.hex,
                    border: settings.accent === id ? '3px solid #fff' : '2px solid transparent',
                    boxShadow: settings.accent === id
                      ? `0 0 0 2px ${preset.hex}`
                      : '0 1px 3px rgba(0,0,0,0.15)',
                    cursor: 'pointer',
                    transition: 'box-shadow 150ms, border 150ms',
                  }}
                  aria-label={`Set accent to ${preset.label}`}
                  aria-pressed={settings.accent === id}
                />
              ))}
            </div>
          </div>

          {/* Border radius */}
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Corner radius</p>
            <div className="flex gap-2">
              {(Object.entries(RADIUS_PRESETS) as [RadiusId, typeof RADIUS_PRESETS[RadiusId]][]).map(([id, preset]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => update({ radius: id })}
                  style={{
                    flex: 1, padding: '8px 4px', fontSize: 11, fontWeight: 700,
                    borderRadius: id === 'sharp' ? 4 : id === 'rounded' ? 14 : 8,
                    border: settings.radius === id
                      ? '2px solid var(--dc-accent, #2563eb)'
                      : '1px solid #e2e8f0',
                    background: settings.radius === id ? 'var(--dc-accent, #2563eb)14' : 'transparent',
                    color: settings.radius === id ? 'var(--dc-accent, #2563eb)' : '#64748b',
                    cursor: 'pointer',
                    transition: 'all 150ms',
                  }}
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
                  style={{
                    flex: 1, padding: '8px 4px', fontWeight: 700,
                    fontSize: id === 'sm' ? 11 : id === 'lg' ? 14 : 12,
                    borderRadius: 8,
                    border: settings.fontSize === id
                      ? '2px solid var(--dc-accent, #2563eb)'
                      : '1px solid #e2e8f0',
                    background: settings.fontSize === id ? 'var(--dc-accent, #2563eb)14' : 'transparent',
                    color: settings.fontSize === id ? 'var(--dc-accent, #2563eb)' : '#64748b',
                    cursor: 'pointer',
                    transition: 'all 150ms',
                  }}
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
