'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadMetricsWithSource } from '@/lib/storage';
import type { DashboardMetrics } from '@/types/metrics';
import { PageLoading, EmptyPage } from '@/components/dashboard/DashboardPageShell';
import RoleColumn from '@/components/dashboard/RoleColumn';
import { buildRoleGridView } from '@/services/coaching/roleGridView.mapper';
import styles from './page.module.scss';

export default function CoachingPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await loadMetricsWithSource();
        if (cancelled) return;
        const data = result.metrics as DashboardMetrics | null;
        if (!data) { router.replace('/'); return; }
        setMetrics(data);
      } catch {
        if (!cancelled) router.replace('/');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [router]);

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
