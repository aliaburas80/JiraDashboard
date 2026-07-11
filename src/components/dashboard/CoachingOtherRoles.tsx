'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { SvgIcon } from '@/components/ui/SvgIcon';
import type { CoachingCategory, RoleBasedCoachingInsight } from '@/types/roleBasedCoaching';
import { CATEGORY_LABELS } from '@/types/roleBasedCoaching';
import type { CheckSeverity } from '@/types/dataQuality';
import styles from './CoachingOtherRoles.module.scss';

interface Props {
  insights: RoleBasedCoachingInsight[];
  onSelect: (category: CoachingCategory) => void;
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

const SEVERITY_ICON: Record<CheckSeverity, string> = {
  low: 'party',
  medium: 'target',
  high: 'warning',
  critical: 'priorityBlocker',
};

// Collapsed by default: most viewers only ever need their own role's insight,
// so the other categories stay out of the way until asked for.
export default function CoachingOtherRoles({ insights, onSelect }: Props) {
  const [open, setOpen] = useState(false);

  if (insights.length === 0) return null;

  return (
    <section className={styles.wrapper}>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <SvgIcon name="chevronRight" size={13} className={clsx(styles.chevron, { [styles.chevronOpen]: open })} />
        View other roles ({insights.length})
      </button>
      {open && (
        <div className={styles.list}>
          {insights.map((insight) => (
            <button
              key={insight.category}
              type="button"
              className={styles.row}
              onClick={() => onSelect(insight.category)}
            >
              <span className={styles.rowIcon}>
                <SvgIcon name={CATEGORY_ICONS[insight.category]} size={14} />
              </span>
              <span className={styles.rowLabel}>{CATEGORY_LABELS[insight.category]}</span>
              <span className={clsx(styles.rowMood, styles[`rowMood--${insight.severity}`])}>
                <SvgIcon name={SEVERITY_ICON[insight.severity]} size={12} />
              </span>
              <span className={styles.rowSummary}>{insight.healthSummary}</span>
              <SvgIcon name="arrowRight" size={12} className={styles.rowArrow} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
