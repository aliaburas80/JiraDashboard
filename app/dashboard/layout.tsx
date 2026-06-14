'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardTopbar from '@/components/dashboard/DashboardTopbar';
import DashboardNavSidebar from '@/components/dashboard/DashboardNavSidebar';
import { loadMetricsWithSource } from '@/lib/storage';
import type { DashboardMetrics } from '@/types/metrics';

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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      background: '#F7F8FA',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <DashboardTopbar
        healthScore={healthScore}
        onNewUpload={() => router.push('/')}
      />

      <div style={{ display: 'flex', marginTop: 52, minHeight: 'calc(100vh - 52px)' }}>
        <DashboardNavSidebar metrics={metrics} />
        <main
          style={{ marginLeft: 228, flex: 1, minHeight: 0 }}
          id="main-content"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
