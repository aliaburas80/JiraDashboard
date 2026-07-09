'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadMetricsWithSource } from '@/lib/storage';
import type { DashboardMetrics } from '@/types/metrics';
import { PageHeader, PageLoading, EmptyPage, shellStyles } from '@/components/dashboard/DashboardPageShell';
import CoachingCategoryTabs from '@/components/dashboard/CoachingCategoryTabs';
import CoachingInsightCard from '@/components/dashboard/CoachingInsightCard';
import { generateAllCoachingInsights } from '@/services/coaching/coachingOrchestrator.service';
import type { AdminCoachingSignals } from '@/services/coaching/adminSignals.service';
import { computeSeverityTrend, type SeverityTrend } from '@/services/coaching/coachingTrend.service';
import { SEVERITY_RANK } from '@/lib/coachingBadge';
import type { CoachingCategory } from '@/types/roleBasedCoaching';
import { CATEGORY_LABELS } from '@/types/roleBasedCoaching';
import type { CheckSeverity } from '@/types/dataQuality';

export default function CoachingPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [role, setRole] = useState<string>('user');
  const [adminSignals, setAdminSignals] = useState<AdminCoachingSignals | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<CoachingCategory | null>(null);
  const [previousSeverityByCategory, setPreviousSeverityByCategory] = useState<Partial<Record<CoachingCategory, CheckSeverity>>>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const meResponse = await fetch('/api/auth/me');
        const me = meResponse.ok ? await meResponse.json() : null;
        const resolvedRole: string = me?.role ?? 'user';
        if (cancelled) return;
        setRole(resolvedRole);

        let resolvedAdminSignals: AdminCoachingSignals | undefined;
        if (resolvedRole === 'admin') {
          try {
            const signalsResponse = await fetch('/api/coaching/admin-signals');
            if (signalsResponse.ok) {
              resolvedAdminSignals = await signalsResponse.json();
              if (!cancelled) setAdminSignals(resolvedAdminSignals);
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

        // Trend is a nice-to-have: diff against the most recently saved snapshot,
        // if the user has saved at least one. Silently skipped otherwise.
        try {
          const snapshotsResponse = await fetch('/api/snapshots');
          if (!snapshotsResponse.ok) return;
          const { snapshots } = await snapshotsResponse.json();
          if (!Array.isArray(snapshots) || snapshots.length < 2) return;
          const previousResponse = await fetch(`/api/snapshots/${snapshots[1].id}`);
          if (!previousResponse.ok || cancelled) return;
          const previousSnapshot = await previousResponse.json();
          const previousMetrics = JSON.parse(previousSnapshot.metricsJson) as DashboardMetrics;
          const previousBundle = generateAllCoachingInsights(previousMetrics, resolvedRole, resolvedAdminSignals);
          const map: Partial<Record<CoachingCategory, CheckSeverity>> = {};
          for (const insight of previousBundle.categories) map[insight.category] = insight.severity;
          if (!cancelled) setPreviousSeverityByCategory(map);
        } catch {
          // Trend is a nice-to-have — coaching still works without it.
        }
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

  // Most urgent category first, so the page leads with what needs attention.
  const sortedCategories = useMemo(() => {
    if (!bundle) return [];
    return [...bundle.categories].sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
  }, [bundle]);

  const trendByCategory = useMemo(() => {
    const map: Partial<Record<CoachingCategory, SeverityTrend>> = {};
    for (const insight of sortedCategories) {
      const previous = previousSeverityByCategory[insight.category];
      if (previous) map[insight.category] = computeSeverityTrend(insight.severity, previous);
    }
    return map;
  }, [sortedCategories, previousSeverityByCategory]);

  useEffect(() => {
    if (sortedCategories.length > 0 && !activeCategory) {
      setActiveCategory(sortedCategories[0].category);
    }
  }, [sortedCategories, activeCategory]);

  if (loading) return <PageLoading />;
  if (!metrics || !bundle || sortedCategories.length === 0) {
    return <EmptyPage message="No coaching insights available — upload delivery data to get role-based guidance." />;
  }

  const categories = sortedCategories.map((c) => c.category);
  const active = activeCategory ?? categories[0];
  const activeInsight = sortedCategories.find((c) => c.category === active) ?? sortedCategories[0];
  const severityByCategory: Partial<Record<CoachingCategory, CheckSeverity>> = {};
  for (const c of sortedCategories) severityByCategory[c.category] = c.severity;

  return (
    <>
      <PageHeader
        id="tour-header-coaching"
        title="Role-Based Coaching Insights"
        subtitle={`Evidence-based delivery coaching for the ${CATEGORY_LABELS[active]} view.`}
      />
      <div className={shellStyles.pageBody}>
        {categories.length > 1 && (
          <CoachingCategoryTabs
            categories={categories}
            active={active}
            onChange={setActiveCategory}
            severityByCategory={severityByCategory}
          />
        )}
        <CoachingInsightCard insight={activeInsight} trend={trendByCategory[active]} />
      </div>
    </>
  );
}
