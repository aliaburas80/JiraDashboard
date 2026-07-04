'use client';
// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// EP-I18N-01: PDF download — opens browser print dialog (zero dependencies).

import styles from './DownloadPdfButton.module.scss';

interface Props {
  label?: string;
}

export function DownloadPdfButton({ label = 'Download PDF' }: Props) {
  return (
    <button
      type="button"
      className={styles.btn}
      onClick={() => window.print()}
      aria-label={label}
    >
      <span className={styles.icon} aria-hidden="true">⬇</span>
      {label}
    </button>
  );
}
