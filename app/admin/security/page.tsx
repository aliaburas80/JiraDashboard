// © 2025 Ali Abu Ras — aburasali Abu Ras — aburasali80@gmail.com. All rights reserved.
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import type { SecurityReport, SecurityCheck, CheckStatus, CheckSeverity } from '@/services/settings/securityCheck.service';

const STATUS_CONFIG: Record<CheckStatus, { icon: string; label: string; cls: string }> = {
  pass:   { icon: '✓', label: 'Pass',   cls: 'text-green-700 bg-green-100 border-green-300' },
  fail:   { icon: '✗', label: 'Fail',   cls: 'text-red-700 bg-red-100 border-red-300'       },
  warn:   { icon: '△', label: 'Warn',   cls: 'text-amber-700 bg-amber-100 border-amber-300' },
  manual: { icon: '?', label: 'Manual', cls: 'text-slate-600 bg-slate-100 border-slate-300' },
};

const SEV_COLOR: Record<CheckSeverity, string> = {
  critical: 'text-red-600',
  high:     'text-orange-600',
  medium:   'text-amber-600',
  low:      'text-slate-500',
};

const CATEGORIES = ['Authentication', 'Access Control', 'Secrets', 'Environment', 'Database', 'Transport', 'Network', 'Privacy', 'Backup', 'Operations'];

function CheckRow({ c }: { c: SecurityCheck }) {
  const [expanded, setExpanded] = useState(c.status === 'fail');
  const s = STATUS_CONFIG[c.status];
  return (
    <div className={`border rounded-xl overflow-hidden ${c.status === 'fail' ? 'border-red-200' : c.status === 'warn' ? 'border-amber-200' : 'border-slate-100'}`}>
      <button type="button" onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors">
        <span className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[11px] font-black ${s.cls}`}>
          {s.icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black text-slate-800">{c.label}</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase">{c.category}</span>
            <span className={`text-[9px] font-bold ${SEV_COLOR[c.severity]}`}>{c.severity}</span>
            {!c.isAuto && <span className="text-[9px] font-bold bg-slate-200 text-slate-600 rounded px-1">manual review</span>}
          </div>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{c.detail}</p>
        </div>
        <span className={`text-slate-400 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50/50 pt-3 space-y-2">
          <p className="text-xs text-slate-600 leading-snug">{c.description}</p>
          {c.fix && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              <p className="text-[10px] font-black text-blue-700 mb-0.5">Fix / Action</p>
              <p className="text-xs text-blue-800">{c.fix}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SecurityPage() {
  const router = useRouter();
  const [report, setReport]   = useState<SecurityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(me => {
        if (!me || me.role !== 'admin') { router.replace('/dashboard'); return; }
        return fetch('/api/admin/security').then(r => r.json());
      })
      .then(data => { if (data?.checks) setReport(data); })
      .catch(() => setError('Failed to run security checks.'))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <AppShell showNav><div className="flex items-center justify-center h-64 text-slate-400 animate-pulse">Running security checks…</div></AppShell>;

  const filtered = report?.checks.filter(c =>
    (catFilter === 'all' || c.category === catFilter) &&
    (statusFilter === 'all' || c.status === statusFilter)
  ) ?? [];

  return (
    <AppShell showNav>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-900">Security Checklist</h1>
          <p className="text-sm text-slate-500 mt-1">
            Production security assessment — automated checks + manual review items.
          </p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 mb-4">{error}</div>}

        {report && (
          <>
            {/* Score banner */}
            <div className={`rounded-2xl border-2 px-6 py-4 mb-6 flex items-center gap-5 ${
              report.criticalFails > 0 ? 'bg-red-50 border-red-300' :
              report.failCount > 0     ? 'bg-orange-50 border-orange-300' :
              report.warnCount > 0     ? 'bg-amber-50 border-amber-300' :
              'bg-green-50 border-green-300'}`}>
              <div className="text-center shrink-0">
                <p className={`text-4xl font-black leading-none ${
                  report.overallScore >= 80 ? 'text-green-700' :
                  report.overallScore >= 60 ? 'text-amber-700' : 'text-red-700'}`}>
                  {report.overallScore}
                </p>
                <p className="text-xs text-slate-500 mt-1">/ 100</p>
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-slate-800">
                  {report.isProductionReady ? '✅ Ready for production' : report.criticalFails > 0 ? '🚫 Not production ready' : '⚠️ Review required before production'}
                </p>
                <div className="flex flex-wrap gap-3 mt-2 text-xs">
                  <span className="text-green-700 font-bold">✓ {report.passCount} pass</span>
                  {report.failCount > 0 && <span className="text-red-700 font-bold">✗ {report.failCount} fail</span>}
                  {report.warnCount > 0 && <span className="text-amber-700 font-bold">△ {report.warnCount} warn</span>}
                  <span className="text-slate-500">? {report.manualCount} manual review</span>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
              <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none">
                <option value="all">All categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none">
                {['all','pass','fail','warn','manual'].map(s => (
                  <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>
                ))}
              </select>
              <span className="text-xs text-slate-400 self-center">{filtered.length} check{filtered.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Checks grouped by fail/warn/pass/manual */}
            {(['fail','warn','pass','manual'] as const).map(status => {
              const group = filtered.filter(c => c.status === status);
              if (!group.length) return null;
              const labels = { fail: '✗ Failing', warn: '△ Warnings', pass: '✓ Passing', manual: '? Manual Review' };
              return (
                <div key={status} className="mb-5">
                  <p className={`text-xs font-black uppercase tracking-widest mb-2 ${
                    status === 'fail' ? 'text-red-600' : status === 'warn' ? 'text-amber-600' :
                    status === 'pass' ? 'text-green-600' : 'text-slate-500'}`}>
                    {labels[status]} ({group.length})
                  </p>
                  <div className="space-y-2">
                    {group.map(c => <CheckRow key={c.id} c={c} />)}
                  </div>
                </div>
              );
            })}

            <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500">
              <p className="font-bold text-slate-700 mb-1">About this checklist</p>
              <p>Automated checks are evaluated server-side. Manual review items cannot be automatically verified — mark them as confirmed in your deployment runbook.</p>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
