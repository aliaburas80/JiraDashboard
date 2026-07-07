// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Soft-launch feature: lets any signed-in user preview which dashboard pages
// best answer a given professional persona's questions. Entirely client-side
// and presentational — it never changes real data access or authorization,
// it only highlights a short list of existing dashboard links. Visibility is
// controlled by the super-admin via GET/POST /api/admin/persona-preview.

'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { PERSONAS, type Persona } from '@/lib/personas';
import { PERSONA_FOCUS } from '@/config/personaFocus.config';
import { SvgIcon } from '@/components/ui/SvgIcon';
import styles from './PersonaPreviewSwitcher.module.scss';

type Selection = Persona | 'all';

const STORAGE_KEY = 'dc_persona_preview';

function readStoredSelection(): Selection {
  if (typeof window === 'undefined') return 'all';
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw && (PERSONAS as readonly string[]).includes(raw) ? (raw as Persona) : 'all';
}

export function PersonaPreviewSwitcher() {
  const [enabled, setEnabled]     = useState(false);
  const [checked, setChecked]     = useState(false);
  const [open, setOpen]           = useState(false);
  const [selected, setSelected]   = useState<Selection>('all');
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/admin/persona-preview')
      .then(r => r.ok ? r.json() : null)
      .then(data => setEnabled(data?.settings?.enabled === true))
      .catch(() => setEnabled(false))
      .finally(() => setChecked(true));
    setSelected(readStoredSelection());
  }, []);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function selectOption(next: Selection) {
    setSelected(next);
    if (next === 'all') window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, next);
    setOpen(false);
  }

  if (!checked || !enabled) return null;

  const focus = selected !== 'all' ? PERSONA_FOCUS[selected] : null;

  return (
    <div ref={wrapRef} className={styles.wrap}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={clsx(styles.trigger, { [styles.active]: selected !== 'all' })}
      >
        <SvgIcon name="eye" size={12} />
        {selected === 'all' ? 'Preview as…' : `Previewing: ${selected}`}
        <SvgIcon name={open ? 'chevronUp' : 'chevronDown'} size={10} />
      </button>

      {open && (
        <div role="menu" className={styles.panel}>
          <p className={styles.panelIntro}>
            Preview soft-launch: highlight the dashboard pages a given role usually checks first.
            This never changes what data you can see.
          </p>

          <button
            type="button"
            role="menuitemradio"
            aria-checked={selected === 'all'}
            onClick={() => selectOption('all')}
            className={clsx(styles.option, { [styles.optionSelected]: selected === 'all' })}
          >
            All (show everything)
          </button>

          {PERSONAS.map(p => (
            <button
              key={p}
              type="button"
              role="menuitemradio"
              aria-checked={selected === p}
              onClick={() => selectOption(p)}
              className={clsx(styles.option, { [styles.optionSelected]: selected === p })}
            >
              {p}
            </button>
          ))}

          {focus && (
            <div className={styles.focusBlock}>
              <p className={styles.focusSummary}>{focus.summary}</p>
              <ul className={styles.focusList}>
                {focus.focusAreas.map(area => (
                  <li key={area.href}>
                    <Link href={area.href} onClick={() => setOpen(false)} className={styles.focusLink}>
                      {area.title} →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
