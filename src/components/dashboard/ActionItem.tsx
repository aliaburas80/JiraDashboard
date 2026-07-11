import type { RoleAction } from '@/types/roleGridCoaching';
import styles from './ActionItem.module.scss';

export default function ActionItem({ action }: { action: RoleAction }) {
  return (
    <div className={styles.row}>
      <p className={styles.title}>{action.title}</p>
      <p className={styles.detail}>{action.detail}</p>
    </div>
  );
}
