'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardTopbar from '@/components/dashboard/DashboardTopbar';
import DashboardNavSidebar from '@/components/dashboard/DashboardNavSidebar';
import { loadMetricsWithSource } from '@/lib/storage';
import type { DashboardMetrics } from '@/types/metrics';

export default function SummaryLayout({ children }: { children: React.ReactNode }) {
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
        if (data) { setMetrics(data); setHealthScore(data.healthScore ?? 0); }
      } catch { /* page.tsx handles redirect on missing data */ }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-surface-page">
      <DashboardTopbar healthScore={healthScore} onNewUpload={() => router.push('/')} />
      <div className="flex mt-header" style={{ minHeight: 'calc(100vh - var(--header-height, 52px))' }}>
        <DashboardNavSidebar metrics={metrics} />
        <main className="flex-1 min-h-0 ml-sidebar" id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
