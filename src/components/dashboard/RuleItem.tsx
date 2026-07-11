import type { RoleRule } from '@/types/roleGridCoaching';
import StatusBadge from './StatusBadge';
import styles from './RuleItem.module.scss';

export default function RuleItem({ rule }: { rule: RoleRule }) {
  return (
    <div className={styles.row}>
      <div className={styles.top}>
        <p className={styles.title}>{rule.title}</p>
        <StatusBadge status={rule.status} />
      </div>
      <p className={styles.description}>{rule.description}</p>
    </div>
  );
}
