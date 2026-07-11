import type { ReactNode } from 'react';
import styles from './RoleSection.module.scss';

export default function RoleSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <h3 className={styles.title}>{title}</h3>
      {children}
    </section>
  );
}
