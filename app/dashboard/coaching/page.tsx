'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboardMetrics } from '@/components/dashboard/DashboardMetricsContext';
import { PageLoading, EmptyPage } from '@/components/dashboard/DashboardPageShell';
import RoleColumn from '@/components/dashboard/RoleColumn';
import { buildRoleGridView } from '@/services/coaching/roleGridView.mapper';
import styles from './page.module.scss';

export default function CoachingPage() {
  const router = useRouter();
  const { metrics, loading } = useDashboardMetrics();

  useEffect(() => {
    if (!loading && !metrics) router.replace('/');
  }, [loading, metrics, router]);

  const roleViews = useMemo(() => (metrics ? buildRoleGridView(metrics) : []), [metrics]);

  if (loading) return <PageLoading />;
  if (!metrics || roleViews.length === 0) {
    return <EmptyPage message="No role data available — upload delivery data to see the team role view." />;
  }

  return (
    <>
      <div id="tour-header-coaching" className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.headerTitle}>Team Role View</h1>
          <p className={styles.headerDescription}>Each role sees only the delivery rules, actions, and measures relevant to their work.</p>
        </div>
        <p className={styles.headerMeta}>Updated from Jira export</p>
      </div>
      <div id="tour-section-coaching-grid" className={styles.grid}>
        {roleViews.map((role) => <RoleColumn key={role.id} role={role} />)}
      </div>
    </>
  );
}
