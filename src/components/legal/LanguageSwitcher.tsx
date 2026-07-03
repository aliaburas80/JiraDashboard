'use client';
// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// EP-I18N-01: Language switcher for legal pages.

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import { LANGUAGES, type LangCode } from '@/lib/legal-i18n';
import styles from './LanguageSwitcher.module.scss';

interface Props {
  current:      LangCode;
  selectLabel?: string;
}

export function LanguageSwitcher({ current, selectLabel = 'Select language' }: Props) {
  const [open,   setOpen]   = useState(false);
  const ref                 = useRef<HTMLDivElement>(null);
  const router              = useRouter();
  const pathname            = usePathname();
  const searchParams        = useSearchParams();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  function selectLang(code: LangCode) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('lang', code);
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  }

  const lang = LANGUAGES[current];

  return (
    <div className={styles.wrap} ref={ref}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen(v => !v)}
        aria-label={selectLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className={styles.flag} aria-hidden="true">{lang.flag}</span>
        <span>{lang.name}</span>
        <span className={styles.caret} aria-hidden="true">▼</span>
      </button>

      {open && (
        <div className={styles.dropdown} role="listbox" aria-label={selectLabel}>
          {(Object.entries(LANGUAGES) as [LangCode, typeof LANGUAGES[LangCode]][]).map(([code, info]) => (
            <button
              key={code}
              type="button"
              role="option"
              aria-selected={code === current}
              className={clsx(styles.option, { [styles.optionActive]: code === current })}
              onClick={() => selectLang(code)}
            >
              <span className={styles.flag} aria-hidden="true">{info.flag}</span>
              <span>{info.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
