'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { loadMetricsWithSource } from '@/lib/storage';
import type { DashboardMetrics } from '@/types/metrics';

const EXPECTED_COLUMNS = [
  { key: 'issueKey',     label: 'Issue Key',       example: 'PROJ-123',       required: true  },
  { key: 'summary',      label: 'Summary',          example: 'Fix login bug',  required: true  },
  { key: 'status',       label: 'Status',           example: 'In Progress',    required: true  },
  { key: 'issueType',    label: 'Issue Type',       example: 'Story',          required: true  },
  { key: 'priority',     label: 'Priority',         example: 'High',           required: false },
  { key: 'assignee',     label: 'Assignee',         example: 'Jane Smith',     required: false },
  { key: 'team',         label: 'Team',             example: 'Platform',       required: false },
  { key: 'epic',         label: 'Epic Link',        example: 'PROJ-10',        required: false },
  { key: 'sprint',       label: 'Sprint',           example: 'Sprint 42',      required: false },
  { key: 'storyPoints',  label: 'Story Points',     example: '5',              required: false },
  { key: 'created',      label: 'Created Date',     example: '2024-01-15',     required: false },
  { key: 'updated',      label: 'Updated Date',     example: '2024-03-01',     required: false },
  { key: 'resolved',     label: 'Resolved Date',    example: '2024-03-05',     required: false },
  { key: 'dueDate',      label: 'Due Date',         example: '2024-04-01',     required: false },
  { key: 'labels',       label: 'Labels',           example: 'backend,api',    required: false },
  { key: 'fixVersion',   label: 'Fix Version',      example: 'v2.1.0',         required: false },
];

export default function ColumnMappingPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetricsWithSource()
      .then(r => { setMetrics(r.metrics as DashboardMetrics | null); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const detectedColumns: string[] = (metrics as any)?._rawColumns ?? [];
  const hasUpload = metrics !== null;

  return (
    <AppShell showNav>
      <div className="max-w-4xl mx-auto">

        {/* Page header */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">Data</p>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Column Mapping</h1>
          <p className="text-sm text-slate-500">
            Maps your CSV or Jira export columns to Delivery Clarity&apos;s expected fields.
          </p>
        </div>

        {!hasUpload && !loading && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center mb-6">
            <p className="text-4xl mb-3">📂</p>
            <p className="text-sm font-bold text-slate-700 mb-1">No data uploaded yet</p>
            <p className="text-xs text-slate-500 mb-4">Upload a Jira CSV or JSON export to see how your columns are mapped.</p>
            <a href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors">
              Upload now
            </a>
          </div>
        )}

        {/* Column mapping table */}
        <div className="rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Expected Fields</h2>
            <span className="text-xs text-slate-400">{EXPECTED_COLUMNS.length} fields</span>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Field</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Required</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Example value</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {EXPECTED_COLUMNS.map((col, i) => {
                const detected = detectedColumns.includes(col.key);
                return (
                  <tr key={col.key} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="px-5 py-3 font-semibold text-slate-800">{col.label}</td>
                    <td className="px-5 py-3">
                      {col.required ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">Required</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500">Optional</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-400 font-mono text-xs">{col.example}</td>
                    <td className="px-5 py-3">
                      {!hasUpload ? (
                        <span className="text-slate-300 text-xs">—</span>
                      ) : detected ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                          Mapped
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                          Not detected
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-slate-400 mt-4 text-center">
          Column names are matched automatically using fuzzy matching. Manual overrides coming in v5.
        </p>
      </div>
    </AppShell>
  );
}
