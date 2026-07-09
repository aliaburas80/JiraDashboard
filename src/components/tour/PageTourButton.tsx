// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Floating trigger for the current page's tour — mounted once in
// app/layout.tsx, renders nothing on pages without a registered tour
// (see PAGE_TOURS in src/lib/tour.ts). This is the single, consistent way
// to start a tour anywhere in the app — pages never render their own
// bespoke "take a tour" button.
'use client';

import { usePathname } from 'next/navigation';
import { getPageTour } from '@/lib/tour';
import { SvgIcon } from '@/components/ui/SvgIcon';
import styles from './PageTourButton.module.scss';

export default function PageTourButton() {
  const pathname = usePathname();
  const steps = getPageTour(pathname);

  if (!steps || steps.length === 0) return null;

  return (
    <button
      type="button"
      className={styles.trigger}
      onClick={() => window.dispatchEvent(new CustomEvent('dc:start-tour'))}
      aria-label="Show a guided tour of this page"
      title="Show a guided tour of this page"
    >
      <SvgIcon name="target" size={13} />
      Page tour
    </button>
  );
}
