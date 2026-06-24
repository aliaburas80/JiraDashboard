'use client';

import clsx from 'clsx';
import type { CoachingCategory } from '@/types/roleBasedCoaching';
import { CATEGORY_LABELS } from '@/types/roleBasedCoaching';
import styles from './CoachingCategoryTabs.module.scss';

interface Props {
  categories: CoachingCategory[];
  active: CoachingCategory;
  onChange: (category: CoachingCategory) => void;
}

export default function CoachingCategoryTabs({ categories, active, onChange }: Props) {
  return (
    <div className={styles.tabRow} role="tablist" aria-label="Coaching categories">
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          role="tab"
          aria-selected={category === active}
          className={clsx(styles.tab, { [styles.tabActive]: category === active })}
          onClick={() => onChange(category)}
        >
          {CATEGORY_LABELS[category]}
        </button>
      ))}
    </div>
  );
}
