import type { RoleView } from '@/types/roleGridCoaching';
import RoleSection from './RoleSection';
import RuleItem from './RuleItem';
import ActionItem from './ActionItem';
import MetricItem from './MetricItem';
import styles from './RoleColumn.module.scss';

export default function RoleColumn({ role }: { role: RoleView }) {
  return (
    <div className={styles.column}>
      <header className={styles.header} data-tone={role.tone}>
        <span className={styles.initials} aria-hidden="true">{role.initials}</span>
        <div>
          <h2 className={styles.title}>{role.title}</h2>
          <p className={styles.subtitle}>{role.subtitle}</p>
        </div>
      </header>

      <RoleSection title="Rules to monitor">
        {role.rules.map((rule) => <RuleItem key={rule.title} rule={rule} />)}
      </RoleSection>

      <RoleSection title="Current actions">
        {role.actions.map((action) => <ActionItem key={action.title} action={action} />)}
      </RoleSection>

      <RoleSection title="Key measures">
        <div className={styles.metricsGrid}>
          {role.metrics.map((metric) => <MetricItem key={metric.label} metric={metric} />)}
        </div>
      </RoleSection>
    </div>
  );
}
