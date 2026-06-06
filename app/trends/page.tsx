// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// Upload-to-upload trend analysis — tracks how delivery metrics change over time.
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import TrendChart, { type TrendDataPoint } from '@/components/trends/TrendChart';
import type { TrendPoint } from '@/types/trends';

// ── Helpers ───────────────────────────────────────────────────────────────────

function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function fullDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

function toChartData(points: TrendPoint[], key: keyof TrendPoint): TrendDataPoint[] {
  return points.map(p => ({
    label: shortDate(p.uploadedAt),
    value: Math.round((Number(p[key]) ?? 0) * 10) / 10,
    date:  fullDate(p.uploadedAt),
    file:  p.fileName,
  }));
}

// ── Summary stat card ─────────────────────────────────────────────────────────

function StatCard({ label, first, last, unit, higherIsBetter = true }: {
  label: string; first: number; last: number; unit: string; higherIsBetter?: boolean;
}) {
  const delta   = Math.round((last - first) * 10) / 10;
  const dir     = Math.abs(delta) < 0.5 ? 'stable'
    : ((delta > 0 && higherIsBetter) || (delta < 0 && !higherIsBetter)) ? 'positive' : 'negative';
  const clr     = dir === 'positive' ? '#16a34a' : dir === 'negative' ? '#dc2626' : '#94a3b8';
  const icon    = dir === 'positive' ? '↑' : dir === 'negative' ? '↓' : '→';

  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{label}</p>
      <p className="text-xl font-black text-slate-900">{last}{unit}</p>
      <p className="text-xs font-bold mt-0.5" style={{ color: clr }}>
        {icon} {delta > 0 ? '+' : ''}{delta}{unit} vs first upload
      </p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TrendsPage() {
  const router = useRouter();
  const [points, setPoints]   = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(me => {
        if (!me) { router.replace('/login'); return; }
        return fetch('/api/trends').then(r => r.json());
      })
      .then(data => { if (data?.points) setPoints(data.points); })
      .catch(() => setError('Failed to load trend data.'))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <AppShell showNav><div className="flex items-center justify-center h-64 text-slate-400 animate-pulse">Loading trends…</div></AppShell>;

  const hasData = points.length >= 2;
  const first   = points[0];
  const last    = points[points.length - 1];

  return (
    <AppShell showNav>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-900">Upload-to-Upload Trends</h1>
          <p className="text-sm text-slate-500 mt-1">
            {hasData
              ? `Tracking ${points.length} uploads — showing how delivery metrics changed over time.`
              : 'Upload your Jira export multiple times over different sprints to see trends here.'}
          </p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 mb-4">{error}</div>}

        {/* No data state */}
        {!hasData && !error && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-12 text-center">
            <span className="text-5xl mb-4 block">📈</span>
            <p className="text-base font-black text-slate-700 mb-2">No trend data yet</p>
            <p className="text-sm text-slate-500 mb-2 max-w-md mx-auto">
              Trends appear after you upload Jira exports <strong>at least twice</strong> — for example at the end of Sprint 14 and Sprint 15.
            </p>
            <p className="text-xs text-slate-400 mb-6">Each upload is automatically recorded with its metrics.</p>
            <button type="button" onClick={() => router.push('/')}
              className="btn-primary px-5 py-2.5">
              Upload Jira Export →
            </button>
          </div>
        )}

        {hasData && (
          <>
            {/* Summary row */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
              <StatCard label="Health Score"        first={first.healthScore}             last={last.healthScore}             unit="/100" />
              <StatCard label="Completion"          first={first.completionRate}          last={last.completionRate}          unit="%"    />
              <StatCard label="Blocked Items"       first={first.blockedIssues}           last={last.blockedIssues}           unit=""     higherIsBetter={false} />
              <StatCard label="Avg Lead Time"       first={first.avgLeadTimeDays}         last={last.avgLeadTimeDays}         unit="d"    higherIsBetter={false} />
              {first.releaseConfidenceScore != null && last.releaseConfidenceScore != null && (
                <StatCard label="Release Confidence" first={first.releaseConfidenceScore} last={last.releaseConfidenceScore} unit="%"    />
              )}
            </div>

            {/* Upload timeline */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Upload Timeline ({points.length} uploads)</p>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {points.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-2 shrink-0">
                    <div className="text-center">
                      <div
                        className="w-3 h-3 rounded-full mx-auto mb-1"
                        style={{ background: p.healthScore >= 75 ? '#16a34a' : p.healthScore >= 50 ? '#f59e0b' : '#dc2626' }}
                      />
                      <p className="text-[9px] text-slate-500 font-semibold">{shortDate(p.uploadedAt)}</p>
                      <p className="text-[9px] font-black" style={{ color: p.healthScore >= 75 ? '#16a34a' : p.healthScore >= 50 ? '#f59e0b' : '#dc2626' }}>
                        {p.healthScore}
                      </p>
                    </div>
                    {i < points.length - 1 && (
                      <div className="w-8 h-px bg-slate-300 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Charts grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <TrendChart
                title="Health Score"
                unit="/100"
                color="#2563eb"
                data={toChartData(points, 'healthScore')}
                yMin={0} yMax={100}
              />
              <TrendChart
                title="Completion %"
                unit="%"
                color="#16a34a"
                data={toChartData(points, 'completionRate')}
                yMin={0} yMax={100}
              />
              <TrendChart
                title="Blocked Items"
                unit=""
                color="#dc2626"
                data={toChartData(points, 'blockedIssues')}
                higherIsBetter={false}
              />
              <TrendChart
                title="Critical Items"
                unit=""
                color="#ea580c"
                data={toChartData(points, 'criticalCount')}
                higherIsBetter={false}
              />
              <TrendChart
                title="Avg Lead Time"
                unit="d"
                color="#7c3aed"
                data={toChartData(points, 'avgLeadTimeDays')}
                higherIsBetter={false}
              />
              <TrendChart
                title="Avg Cycle Time"
                unit="d"
                color="#0891b2"
                data={toChartData(points, 'avgCycleTimeDays')}
                higherIsBetter={false}
              />
              {points.some(p => p.avgSprintThroughput !== null) && (
                <TrendChart
                  title="Sprint Throughput"
                  unit=" issues/sprint"
                  color="#14b8a6"
                  data={toChartData(points, 'avgSprintThroughput')}
                />
              )}
              {points.some(p => p.dataQualityScore !== null) && (
                <TrendChart
                  title="Data Quality Score"
                  unit="%"
                  color="#f97316"
                  data={toChartData(points, 'dataQualityScore')}
                  yMin={0} yMax={100}
                />
              )}
              {points.some(p => p.releaseConfidenceScore !== null) && (
                <TrendChart
                  title="Release Confidence"
                  unit="%"
                  color="#7c3aed"
                  data={toChartData(points, 'releaseConfidenceScore')}
                  yMin={0} yMax={100}
                />
              )}
            </div>

            {/* Raw upload log table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <p className="text-sm font-black text-slate-700">Upload Log</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-left">
                      {['Date', 'File', 'Health', 'Completion', 'Done/Total', 'Blocked', 'Lead Time', 'Cycle Time', 'Data Quality', 'Rel. Confidence'].map(h => (
                        <th key={h} className="py-2.5 px-3 text-[10px] font-black uppercase tracking-wider text-slate-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[...points].reverse().map(p => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{new Date(p.uploadedAt).toLocaleDateString()}</td>
                        <td className="py-2 px-3 text-slate-700 max-w-[160px] truncate font-semibold" title={p.fileName}>{p.fileName}</td>
                        <td className="py-2 px-3 font-bold" style={{ color: p.healthScore >= 75 ? '#16a34a' : p.healthScore >= 50 ? '#f59e0b' : '#dc2626' }}>{p.healthScore}</td>
                        <td className="py-2 px-3 text-slate-700 font-semibold">{p.completionRate}%</td>
                        <td className="py-2 px-3 text-slate-600">{p.doneIssues}/{p.totalIssues}</td>
                        <td className="py-2 px-3 font-semibold" style={{ color: p.blockedIssues > 0 ? '#dc2626' : '#16a34a' }}>{p.blockedIssues}</td>
                        <td className="py-2 px-3 text-slate-600">{p.avgLeadTimeDays > 0 ? `${p.avgLeadTimeDays}d` : '—'}</td>
                        <td className="py-2 px-3 text-slate-600">{p.avgCycleTimeDays > 0 ? `${p.avgCycleTimeDays}d` : '—'}</td>
                        <td className="py-2 px-3 text-slate-600">{p.dataQualityScore != null ? `${p.dataQualityScore}%` : '—'}</td>
                        <td className="py-2 px-3 font-semibold" style={{ color: p.releaseConfidenceScore == null ? '#94a3b8' : p.releaseConfidenceScore >= 80 ? '#16a34a' : p.releaseConfidenceScore >= 60 ? '#f59e0b' : '#dc2626' }}>
                          {p.releaseConfidenceScore != null ? `${p.releaseConfidenceScore}%` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
