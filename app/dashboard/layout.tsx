'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardTopbar from '@/components/dashboard/DashboardTopbar';
import DashboardNavSidebar from '@/components/dashboard/DashboardNavSidebar';
import { loadMetricsWithSource } from '@/lib/storage';
import type { DashboardMetrics } from '@/types/metrics';
import styles from './layout.module.scss';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [healthScore, setHealthScore] = useState(0);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await loadMetricsWithSource();
        if (cancelled) return;
        const data = result.metrics as DashboardMetrics | null;
        if (!data) { router.replace('/'); return; }
        setMetrics(data);
        setHealthScore(data.healthScore ?? 0);
      } catch {
        if (!cancelled) router.replace('/');
      }
    }
    load();
    return () => { cancelled = true; };
  }, [router]);

  return (
    <div className={styles.shell}>
      <DashboardTopbar
        healthScore={healthScore}
        onNewUpload={() => router.push('/')}
      />

      <div className={styles.body}>
        <DashboardNavSidebar metrics={metrics} />
        <main className={styles.main} id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
