import type { RoleMetric } from '@/types/roleGridCoaching';
import styles from './MetricItem.module.scss';

export default function MetricItem({ metric }: { metric: RoleMetric }) {
  return (
    <div className={styles.item}>
      <p className={styles.label}>{metric.label}</p>
      <p className={styles.value}>
        {metric.value}
        {/* CP3-012: a fixed placeholder constant (no real data behind it yet)
            must not render identically to a genuinely calculated metric. */}
        {metric.isEstimate && (
          <span
            className={styles.estimateTag}
            title="Placeholder value — this isn't tracked in the app yet, so it doesn't change between uploads."
          >
            (estimated)
          </span>
        )}
      </p>
    </div>
  );
}
