'use client';
// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Font size control for legal pages — persists in localStorage.

import { useState, useEffect } from 'react';
import styles from './FontSizeControl.module.scss';

const SIZES  = [13, 14, 15, 16, 18, 20] as const;
const DEFAULT = 14;
const KEY     = 'dc_legal_font_size';

export function FontSizeControl({ targetId }: { targetId: string }) {
  const [size, setSize] = useState<number>(DEFAULT);

  // Load persisted size on mount
  useEffect(() => {
    const stored = localStorage.getItem(KEY);
    if (stored) {
      const n = Number(stored);
      if (SIZES.includes(n as typeof SIZES[number])) setSize(n);
    }
  }, []);

  // Set CSS custom property on the container; .body in SCSS reads --legal-font-size
  useEffect(() => {
    const el = document.getElementById(targetId);
    if (el) el.style.setProperty('--legal-font-size', `${size}px`);
    localStorage.setItem(KEY, String(size));
  }, [size, targetId]);

  const canDecrease = size > SIZES[0];
  const canIncrease = size < SIZES[SIZES.length - 1];

  function decrease() { if (canDecrease) setSize(SIZES[SIZES.indexOf(size as typeof SIZES[number]) - 1]); }
  function increase() { if (canIncrease) setSize(SIZES[SIZES.indexOf(size as typeof SIZES[number]) + 1]); }

  return (
    <div className={styles.wrap} aria-label="Adjust font size">
      <button
        type="button"
        className={styles.btn}
        onClick={decrease}
        disabled={!canDecrease}
        aria-label="Decrease font size"
      >
        A−
      </button>
      <span className={styles.label}>{size}px</span>
      <button
        type="button"
        className={styles.btn}
        onClick={increase}
        disabled={!canIncrease}
        aria-label="Increase font size"
      >
        A+
      </button>
    </div>
  );
}
