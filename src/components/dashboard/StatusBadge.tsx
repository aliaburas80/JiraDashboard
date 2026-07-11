import type { Status } from '@/types/roleGridCoaching';
import styles from './StatusBadge.module.scss';

const STATUS_LABEL: Record<Status, string> = {
  critical: 'Critical',
  risk:     'At risk',
  review:   'Review',
  healthy:  'Healthy',
};

// Status is communicated through text (the label) as well as color, per
// CLAUDE.md §26.4 — never color alone.
export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={styles.badge} data-status={status}>
      {STATUS_LABEL[status]}
    </span>
  );
}
