// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Global page/feature search — Phase 1 (see product/SRS.md). Opens a popup
// (⌘K / Ctrl+K or the trigger button) and shows results as a visual grid of
// cards, each carrying the page's semantic icon from the approved registry.
// Searches only the page/feature nav registry (DC_NAV_GROUPS) — searching
// uploaded Jira issue data is an intentionally separate, later phase and is
// out of scope here (see SRS Addendum for the phase split).
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { getNavGroupsForRole } from '@/components/dc-shell/navigation';
import { searchPages, type PageSearchResult } from '@/lib/pageSearch';
import { SvgIcon } from '@/components/ui/SvgIcon';
import styles from './GlobalSearch.module.scss';

interface Props {
  role: string | null;
  isSuperAdmin: boolean;
  className?: string;
}

export default function GlobalSearch({ role, isSuperAdmin, className }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef  = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const groups  = useMemo(() => getNavGroupsForRole(role, isSuperAdmin), [role, isSuperAdmin]);
  const results = useMemo(() => searchPages(query, groups), [query, groups]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setActiveIndex(0);
    triggerRef.current?.focus();
  }, []);

  const navigateTo = useCallback((result: PageSearchResult) => {
    setOpen(false);
    setQuery('');
    setActiveIndex(0);
    router.push(result.href);
  }, [router]);

  // Global shortcut — ⌘K (Mac) / Ctrl+K (Windows/Linux) opens search from
  // anywhere; Escape closes it. Attached once, independent of `open`, so the
  // shortcut works even before the modal has ever been opened.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
        return;
      }
      if (e.key === 'Escape' && open) {
        e.preventDefault();
        close();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, close]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function onResultsKeyDown(e: React.KeyboardEvent) {
    if (results.length === 0) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = results[activeIndex];
      if (target) navigateTo(target);
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className={clsx(styles.trigger, className)}
        aria-label="Search pages and features"
        title="Search pages and features (⌘K)"
      >
        <SvgIcon name="search" size={14} />
        <span className={styles.triggerLabel}>Search</span>
        <span className={styles.triggerKbd} aria-hidden="true">⌘K</span>
      </button>

      {open && (
        <div className={styles.overlay} onMouseDown={close}>
          <div
            className={styles.panel}
            role="dialog"
            aria-modal="true"
            aria-label="Search pages and features"
            onMouseDown={e => e.stopPropagation()}
          >
            <div className={styles.inputRow}>
              <SvgIcon name="search" size={16} className={styles.inputIcon} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={onResultsKeyDown}
                placeholder="Search pages & features…"
                aria-label="Search query"
                className={styles.input}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={close}
                className={styles.closeBtn}
                aria-label="Close search"
              >
                <SvgIcon name="cross" size={12} />
              </button>
            </div>

            {results.length === 0 ? (
              <p className={styles.emptyState}>
                No pages or features match &ldquo;{query}&rdquo;.
              </p>
            ) : (
              <div className={styles.resultsGrid} role="listbox" aria-label="Search results">
                {results.map((result, index) => (
                  <button
                    key={result.id}
                    type="button"
                    role="option"
                    aria-selected={index === activeIndex}
                    onClick={() => navigateTo(result)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={clsx(styles.resultCard, { [styles.resultCardActive]: index === activeIndex })}
                  >
                    <span className={styles.resultIcon} aria-hidden="true">
                      <SvgIcon name={result.icon ?? 'page'} size={18} />
                    </span>
                    <span className={styles.resultText}>
                      <span className={styles.resultTitle}>{result.title}</span>
                      <span className={styles.resultDesc}>{result.desc}</span>
                    </span>
                    <span className={styles.resultGroup}>{result.groupLabel}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
