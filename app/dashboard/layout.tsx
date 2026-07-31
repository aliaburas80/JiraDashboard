'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import DashboardTopbar from '@/components/dashboard/DashboardTopbar';
import DashboardNavSidebar from '@/components/dashboard/DashboardNavSidebar';
import { DashboardMetricsProvider } from '@/components/dashboard/DashboardMetricsContext';
import { loadMetricsWithSource } from '@/lib/storage';
import { redirectWithLoadError } from '@/lib/loadErrorSignal';
import type { DashboardMetrics } from '@/types/metrics';
import styles from './layout.module.scss';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // P0A-09: dev-visibility timing for metrics-loaded→committed-paint — see
  // product/PERFORMANCE.md. Not a Web Vitals substitute, just a cheap
  // approximation logged after this component's next commit.
  const loadStartRef = useRef<number | null>(null);

  // Close mobile sidebar whenever the route changes.
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await loadMetricsWithSource();
        if (cancelled) return;
        const data = result.metrics as DashboardMetrics | null;
        if (!data) { router.replace('/'); return; }
        loadStartRef.current = performance.now();
        setMetrics(data);
      } catch {
        if (!cancelled) redirectWithLoadError(router);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [router]);

  useEffect(() => {
    if (metrics && loadStartRef.current !== null) {
      console.log(`[dashboard] metrics-loaded→paint: ${Math.round(performance.now() - loadStartRef.current)}ms`);
      loadStartRef.current = null;
    }
  }, [metrics]);

  return (
    <div className={styles.shell}>
      <a href="#main-content" className={styles.skipLink}>Skip to main content</a>
      <DashboardTopbar
        onNewUpload={() => router.push('/')}
        onToggleSidebar={() => setSidebarOpen(v => !v)}
      />

      <div className={styles.body}>
        {/* Backdrop — visible only at mobile when sidebar drawer is open */}
        {sidebarOpen && (
          <div
            className={styles.sidebarBackdrop}
            aria-hidden="true"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <DashboardNavSidebar
          metrics={metrics}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className={styles.main} id="main-content">
          <DashboardMetricsProvider value={{ metrics, loading }}>
            {children}
          </DashboardMetricsProvider>
        </main>
      </div>
    </div>
  );
}
