'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadMetricsWithSource } from '@/lib/storage';
import type { DashboardMetrics } from '@/types/metrics';
import { PageHeader, SectionCard, PageLoading, EmptyPage } from '@/components/dashboard/DashboardPageShell';
import CoachingCategoryTabs from '@/components/dashboard/CoachingCategoryTabs';
import CoachingInsightCard from '@/components/dashboard/CoachingInsightCard';
import { generateAllCoachingInsights } from '@/services/coaching/coachingOrchestrator.service';
import type { AdminCoachingSignals } from '@/services/coaching/adminSignals.service';
import type { CoachingCategory } from '@/types/roleBasedCoaching';
import { CATEGORY_LABELS } from '@/types/roleBasedCoaching';
import styles from './page.module.scss';

export default function CoachingPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [role, setRole] = useState<string>('user');
  const [adminSignals, setAdminSignals] = useState<AdminCoachingSignals | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<CoachingCategory | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const meResponse = await fetch('/api/auth/me');
        const me = meResponse.ok ? await meResponse.json() : null;
        const resolvedRole: string = me?.role ?? 'user';
        if (cancelled) return;
        setRole(resolvedRole);

        if (resolvedRole === 'admin') {
          try {
            const signalsResponse = await fetch('/api/coaching/admin-signals');
            if (signalsResponse.ok && !cancelled) {
              setAdminSignals(await signalsResponse.json());
            }
          } catch {
            // Admin signals are supplementary — coaching still works without them.
          }
        }

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

  const bundle = useMemo(() => {
    if (!metrics) return null;
    return generateAllCoachingInsights(metrics, role, adminSignals);
  }, [metrics, role, adminSignals]);

  useEffect(() => {
    if (bundle && bundle.categories.length > 0 && !activeCategory) {
      setActiveCategory(bundle.categories[0].category);
    }
  }, [bundle, activeCategory]);

  if (loading) return <PageLoading />;
  if (!metrics || !bundle || bundle.categories.length === 0) {
    return <EmptyPage message="No coaching insights available — upload delivery data to get role-based guidance." />;
  }

  const categories = bundle.categories.map((c) => c.category);
  const active = activeCategory ?? categories[0];
  const activeInsight = bundle.categories.find((c) => c.category === active) ?? bundle.categories[0];

  return (
    <div className={styles.page}>
      <PageHeader
        title="Role-Based Coaching Insights"
        subtitle={`Evidence-based delivery coaching for the ${CATEGORY_LABELS[active]} view.`}
      />
      <SectionCard>
        {categories.length > 1 && (
          <CoachingCategoryTabs categories={categories} active={active} onChange={setActiveCategory} />
        )}
        <CoachingInsightCard insight={activeInsight} />
      </SectionCard>
    </div>
  );
}
