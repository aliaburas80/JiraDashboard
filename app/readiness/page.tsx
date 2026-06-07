// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import ReleaseReadinessCard from '@/components/readiness/ReleaseReadinessCard';
import { loadMetricsWithSource } from '@/lib/storage';
import { calculateReleaseReadiness } from '@/services/metrics/releaseReadiness.service';
import type { ReleaseReadinessSummary } from '@/types/releaseReadiness';
import type { DashboardMetrics } from '@/types/metrics';

export default function ReadinessPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<ReleaseReadinessSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const result = await loadMetricsWithSource();
      if (cancelled) return;
      const metrics = result.metrics as DashboardMetrics | null;
      if (!metrics) { router.replace('/'); return; }
      const items = (metrics.flow?.items ?? []) as any[];
      setSummary(calculateReleaseReadiness(items));
      setLoading(false);
    }
    load().catch(() => { if (!cancelled) router.replace('/'); });
    return () => { cancelled = true; };
  }, [router]);

  if (loading) return <AppShell showNav><div className="flex items-center justify-center h-64 text-slate-400 animate-pulse">Calculating release readiness…</div></AppShell>;

  return (
    <AppShell showNav>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-900">Release Readiness</h1>
          <p className="text-sm text-slate-500 mt-1">
            Go / Conditional Go / No-Go assessment per Fix Version — based on completion, blockers, and quality signals.
          </p>
        </div>

        {!summary?.hasVersionData ? (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-12 text-center">
            <span className="text-5xl mb-4 block">🚀</span>
            <p className="text-base font-black text-slate-700 mb-2">No Fix Version data found</p>
            <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
              Release readiness requires the <strong>Fix Version/s</strong> column in your Jira export.
              In Jira: Columns → add &quot;Fix Version&quot; then re-export.
            </p>
            <button type="button" onClick={() => router.push('/')}
              className="btn-primary px-5 py-2.5">
              Upload New Export →
            </button>
          </div>
        ) : (
          <>
            {/* Summary chips */}
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Releases</p>
                <p className="text-xl font-black text-slate-900">{summary.totalVersions}</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 shadow-sm text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-green-600">✅ Go</p>
                <p className="text-xl font-black text-green-700">{summary.goCount}</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 shadow-sm text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">⚠️ Conditional</p>
                <p className="text-xl font-black text-amber-700">{summary.conditionalCount}</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 shadow-sm text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-red-600">🚫 No-Go</p>
                <p className="text-xl font-black text-red-700">{summary.noGoCount}</p>
              </div>
            </div>

            {/* Release cards */}
            <div className="space-y-4">
              {summary.releases.map(r => (
                <ReleaseReadinessCard key={r.version} result={r} />
              ))}
            </div>

            {/* Legend */}
            <div className="mt-6 bg-white border border-slate-200 rounded-xl p-4 text-xs text-slate-500">
              <p className="font-bold text-slate-700 mb-2">Verdict Criteria</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div><span className="font-bold text-green-700">✅ Go:</span> ≥90% complete, no blockers, no open bugs</div>
                <div><span className="font-bold text-amber-700">⚠️ Conditional Go:</span> ≥70% complete, no blockers, some open bugs or critical items</div>
                <div><span className="font-bold text-red-700">🚫 No-Go:</span> Blockers present, or completion &lt;70%</div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
