// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
'use client';

import { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { AdminConsoleLayout } from '@/components/admin/AdminConsoleLayout';
import {
  loadBranding,
  saveBranding,
  DEFAULT_BRANDING,
  type BrandingConfig,
} from '@/lib/themeCustomizer';
import styles from './page.module.scss';

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
// Scope, 2026-07-09: this page previously also offered a 4-preset colour
// palette gallery, font-size/corner-radius presets, a font-stack reference,
// and a technical CSS-token swatch table — all decorative/demo material from
// the UIUXTemplate design system with no real admin/business value. Cut down
// to branding only (app name, favicon, logo) per explicit product decision:
// keep what an admin can actually use for real app benefit (white-labeling),
// remove the rest. The underlying theme-customizer engine (palette/font/
// radius apply logic in src/lib/themeCustomizer.ts) is untouched — any
// browser that had previously saved a custom palette keeps rendering it via
// AppShell's initThemeCustom(); there is just no longer an admin UI to
// change it, since nothing here ever wrote anything other than the default.

export default function AdminThemePage() {
  const [branding, setBranding] = useState<BrandingConfig>({ ...DEFAULT_BRANDING });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setBranding(loadBranding());
  }, []);

  function updateBranding(patch: Partial<BrandingConfig>) {
    setBranding(prev => ({ ...prev, ...patch }));
  }

  function handleSave() {
    saveBranding(branding);
    // Notify AppShell of branding change via storage event
    window.dispatchEvent(new Event('storage'));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleReset() {
    setBranding({ ...DEFAULT_BRANDING });
    saveBranding({ ...DEFAULT_BRANDING });
    window.dispatchEvent(new Event('storage'));
  }

  const stats = [
    { icon: 'tag', label: 'App name', value: branding.appName || '—', note: 'Shown in the nav bar', tone: 'bg-amber-50 text-amber-700' },
    { icon: 'image', label: 'Logo', value: branding.logoUrl ? 'Custom' : 'Default', note: branding.logoUrl ? 'Custom logo set' : 'Delivery Clarity logo', tone: 'bg-blue-50 text-blue-700' },
    { icon: 'image', label: 'Favicon', value: branding.faviconUrl ? 'Custom' : 'Default', note: branding.faviconUrl ? 'Custom icon set' : 'Default icon', tone: 'bg-slate-50 text-slate-700' },
  ];

  return (
    <AdminConsoleLayout
      title="Branding"
        description="Customise the app name, logo, and favicon shown across the app. Changes apply instantly and persist for all sessions on this device."
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
        <section className={clsx(styles.section, 'mb-0')}>
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
    </AdminConsoleLayout>
  );
}
