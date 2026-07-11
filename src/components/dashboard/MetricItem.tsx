import type { RoleMetric } from '@/types/roleGridCoaching';
import styles from './MetricItem.module.scss';

export default function MetricItem({ metric }: { metric: RoleMetric }) {
  return (
    <div className={styles.item}>
      <p className={styles.label}>{metric.label}</p>
      <p className={styles.value}>{metric.value}</p>
    </div>
  );
}
