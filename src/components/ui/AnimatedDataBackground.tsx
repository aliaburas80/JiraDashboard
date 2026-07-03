'use client';
// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Static deep-navy background with dot grid and ambient colour glows.
// No floating elements, no animation, no Canvas.

import clsx from 'clsx';
import styles from './AnimatedDataBackground.module.scss';

interface Props {
  className?: string;
}

export function AnimatedDataBackground({ className }: Props) {
  return (
    <div className={clsx(styles.root, className)} aria-hidden="true">
      <div className={styles.grid} />
      <div className={styles.glowOrange} />
      <div className={styles.glowBlue} />
    </div>
  );
}
