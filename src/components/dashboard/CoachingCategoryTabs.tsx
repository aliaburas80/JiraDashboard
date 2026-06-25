'use client';

import clsx from 'clsx';
import { SvgIcon } from '@/components/ui/SvgIcon';
import type { CoachingCategory } from '@/types/roleBasedCoaching';
import { CATEGORY_LABELS } from '@/types/roleBasedCoaching';
import type { CheckSeverity } from '@/types/dataQuality';
import styles from './CoachingCategoryTabs.module.scss';

interface Props {
  categories: CoachingCategory[];
  active: CoachingCategory;
  onChange: (category: CoachingCategory) => void;
  severityByCategory?: Partial<Record<CoachingCategory, CheckSeverity>>;
}

// Only the most urgent tabs get a nudge dot — flagging every tab would defeat the point.
function needsNudge(severity: CheckSeverity | undefined, isActive: boolean): boolean {
  return !isActive && (severity === 'critical' || severity === 'high');
}

const CATEGORY_ICONS: Record<CoachingCategory, string> = {
  scrum_master: 'sprint',
  product_owner: 'goal',
  engineering_manager: 'workflow',
  delivery_manager: 'roadmap',
  team_lead: 'people',
  c_level: 'chartTrendUp',
  admin: 'shield',
};

export default function CoachingCategoryTabs({ categories, active, onChange, severityByCategory }: Props) {
  return (
    <div className={styles.tabRow} role="tablist" aria-label="Coaching categories">
      {categories.map((category) => {
        const isActive = category === active;
        const severity = severityByCategory?.[category];
        return (
          <button
            key={category}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={clsx(styles.tab, { [styles.tabActive]: isActive })}
            onClick={() => onChange(category)}
          >
            <SvgIcon name={CATEGORY_ICONS[category]} size={14} />
            {CATEGORY_LABELS[category]}
            {needsNudge(severity, isActive) && (
              <span
                className={clsx(styles.nudgeDot, { [styles.nudgeDotCritical]: severity === 'critical' })}
                title={severity === 'critical' ? 'Needs attention' : 'Needs focus'}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
