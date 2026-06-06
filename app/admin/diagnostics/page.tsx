// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// System Health & Admin Diagnostics — 9.36
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { AdminConsoleLayout } from '@/components/admin/AdminConsoleLayout';

// ── Types ─────────────────────────────────────────────────────────────────────

interface DiagnosticsData {
  generatedAt:   string;
  opsScore:      number;
  users:         { total: number; active: number; admins: number; lastLoginAt: string | null; lastLoginBy: string | null };
  sessions:      { total: number; active: number };
  imports:       { total: number; successful: number; failed: number; successRate: number; avgHealthScore: number; avgProcessingMs: number; lastAt: string | null; lastFileName: string | null; lastHealthScore: number | null; lastStatus: string | null };
  snapshots:     { total: number };
  auditEvents:   { total: number; recent: { id: string; type: string; description: string; at: string; ip: string | null }[] };
  env:           { sessionSecretSet: boolean; nodeEnvProduction: boolean; dbUrlSet: boolean; registrationLocked: boolean; publicUrlSet: boolean };
  system:        { nodeVersion: string; platform: string; uptimeSeconds: number };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function ago(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function uptime(s: number): string {
  if (s < 60)   return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400)return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
  return `${Math.floor(s / 86400)}d ${Math.floor((s % 86400) / 3600)}h`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color = '#2563eb' }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{label}</p>
      <p className="text-2xl font-black leading-none" style={{ color }}>{value}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-1 font-semibold">{sub}</p>}
    </div>
  );
}

function EnvRow({ label, ok, note }: { label: string; ok: boolean; note?: string }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
      <span className={`w-2 h-2 rounded-full shrink-0 ${ok ? 'bg-green-500' : 'bg-red-500'}`} />
      <span className="text-xs font-semibold text-slate-700 flex-1">{label}</span>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
        {ok ? 'OK' : 'Missing'}
      </span>
      {note && <span className="text-[10px] text-slate-400 hidden sm:inline">{note}</span>}
    </div>
  );
}

function EventTypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    login:             'bg-blue-50 text-blue-700',
    logout:            'bg-slate-100 text-slate-600',
    upload:            'bg-green-50 text-green-700',
    export:            'bg-violet-50 text-violet-700',
    register:          'bg-teal-50 text-teal-700',
    backup_created:    'bg-amber-50 text-amber-700',
    retention_cleanup: 'bg-orange-50 text-orange-700',
    delete_import_log: 'bg-red-50 text-red-700',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${map[type] ?? 'bg-slate-100 text-slate-600'}`}>
      {type.replace(/_/g, ' ')}
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DiagnosticsPage() {
  const router = useRouter();
  const [data,    setData]    = useState<DiagnosticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(me => {
        if (!me)              { router.replace('/login');     return null; }
        if (me.role !== 'admin') { router.replace('/dashboard'); return null; }
        return fetch('/api/admin/diagnostics').then(r => r.json());
      })
      .then(d => { if (d) setData(d); })
      .catch(() => setError('Failed to load diagnostics.'))
      .finally(() => setLoading(false));
  }, [router, refresh]);

  if (loading) return (
    <AppShell showNav>
      <div className="flex items-center justify-center h-64 text-slate-400 animate-pulse text-sm">Loading diagnostics…</div>
    </AppShell>
  );

  if (error || !data) return (
    <AppShell showNav>
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-sm text-red-700">{error || 'No data available.'}</div>
      </div>
    </AppShell>
  );

  const opsColor = data.opsScore >= 80 ? '#16a34a' : data.opsScore >= 60 ? '#f59e0b' : '#dc2626';
  const opsBand  = data.opsScore >= 80 ? 'Healthy'  : data.opsScore >= 60 ? 'Degraded' : 'At Risk';
  const envOkCount = Object.values(data.env).filter(Boolean).length;
  const envTotal   = Object.keys(data.env).length;
  const diagnosticsStats = [
    { icon: '🩺', label: 'Ops Score', value: String(data.opsScore), note: opsBand, tone: data.opsScore >= 80 ? 'bg-green-50 text-green-700' : data.opsScore >= 60 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700' },
    { icon: '✓', label: 'Env Checks', value: `${envOkCount}/${envTotal}`, note: 'Configuration checks' },
    { icon: '↥', label: 'Imports', value: String(data.imports.total), note: `${data.imports.successRate}% success` },
    { icon: '▣', label: 'Audit Events', value: String(data.auditEvents.total), note: 'Recorded actions' },
  ];

  return (
    <AppShell showNav>
      <AdminConsoleLayout
        title="System Diagnostics"
        description={`Live system health snapshot. Generated ${ago(data.generatedAt)}.`}
        stats={diagnosticsStats}
        statusLabel={opsBand}
        actions={
          <>
            <button type="button" onClick={() => setRefresh(r => r + 1)}
              className="inline-flex h-[38px] items-center justify-center gap-1.5 rounded-[9px] border border-slate-300 bg-white px-4 text-xs font-extrabold text-slate-700 transition hover:bg-slate-50">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M17.6 6.4A8 8 0 0 0 4 12H2a10 10 0 0 1 17-7.1V3h2v6h-6V7h2.6ZM20 12h2a10 10 0 0 1-17 7.1V21H3v-6h6v2H6.4A8 8 0 0 0 20 12Z" /></svg>
              Refresh
            </button>
            <a href="/admin/security" className="inline-flex h-[38px] items-center justify-center rounded-[9px] bg-blue-600 px-4 text-xs font-extrabold text-white transition hover:bg-blue-700">
              Security Report →
            </a>
          </>
        }
      >

        {/* Ops score banner */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 mb-6 flex items-center gap-5 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full border-4 flex flex-col items-center justify-center shrink-0"
              style={{ borderColor: opsColor }}>
              <span className="text-xl font-black leading-none" style={{ color: opsColor }}>{data.opsScore}</span>
              <span className="text-[9px] text-slate-400 font-semibold">/100</span>
            </div>
            <div>
              <p className="text-lg font-black" style={{ color: opsColor }}>{opsBand}</p>
              <p className="text-xs text-slate-500">Operational health · {envOkCount}/{envTotal} env checks passed</p>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 min-w-0">
            <div className="text-center">
              <p className="text-xl font-black text-slate-900">{data.users.total}</p>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Users</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black text-slate-900">{data.sessions.active}</p>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Active Sessions</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black text-slate-900">{data.imports.total}</p>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Imports</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black text-slate-900">{data.auditEvents.total}</p>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Audit Events</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* Database section */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Database Overview</h2>
            <div className="grid grid-cols-2 gap-3">
              <KpiCard label="Total Users"    value={data.users.total}    sub={`${data.users.admins} admin${data.users.admins !== 1 ? 's' : ''}`} />
              <KpiCard label="Active Users"   value={data.users.active}   sub="isActive = true"    color="#16a34a" />
              <KpiCard label="Sessions"       value={data.sessions.total} sub={`${data.sessions.active} active`}   color="#7c3aed" />
              <KpiCard label="Snapshots"      value={data.snapshots.total} sub="saved reports"     color="#0891b2" />
            </div>
            <div className="mt-4 border-t border-slate-100 pt-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-semibold">Last login</span>
                <span className="text-slate-700 font-bold">{ago(data.users.lastLoginAt)} {data.users.lastLoginBy ? `(${data.users.lastLoginBy})` : ''}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-semibold">Audit events</span>
                <span className="text-slate-700 font-bold">{data.auditEvents.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Import health */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Import Health</h2>
            <div className="grid grid-cols-2 gap-3">
              <KpiCard label="Success Rate"    value={`${data.imports.successRate}%`}   sub={`${data.imports.successful} of ${data.imports.total}`} color={data.imports.successRate >= 90 ? '#16a34a' : data.imports.successRate >= 70 ? '#f59e0b' : '#dc2626'} />
              <KpiCard label="Failed Imports"  value={data.imports.failed}               sub="errors + validation" color={data.imports.failed > 0 ? '#dc2626' : '#94a3b8'} />
              <KpiCard label="Avg Health Score" value={`${data.imports.avgHealthScore}`} sub="on successful imports" color="#2563eb" />
              <KpiCard label="Avg Processing"  value={`${data.imports.avgProcessingMs}ms`} sub="per upload" color="#f59e0b" />
            </div>
            {data.imports.lastAt && (
              <div className="mt-4 border-t border-slate-100 pt-3 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-semibold">Last import</span>
                  <span className="text-slate-700 font-bold">{ago(data.imports.lastAt)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-semibold">Last file</span>
                  <span className="text-slate-700 font-bold max-w-[180px] truncate" title={data.imports.lastFileName ?? ''}>{data.imports.lastFileName ?? '—'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-semibold">Last status</span>
                  <span className={`font-bold ${data.imports.lastStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}>{data.imports.lastStatus ?? '—'}</span>
                </div>
              </div>
            )}
          </div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* Environment checks */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Environment ({envOkCount}/{envTotal} OK)</h2>
            <EnvRow label="SESSION_SECRET set (≥ 32 chars)" ok={data.env.sessionSecretSet}  note="Required for secure cookies" />
            <EnvRow label="NODE_ENV = production"            ok={data.env.nodeEnvProduction} note="Enables Next.js production mode" />
            <EnvRow label="DATABASE_URL configured"          ok={data.env.dbUrlSet}          note="SQLite file path" />
            <EnvRow label="Open registration locked"         ok={data.env.registrationLocked} note="ALLOW_OPEN_REGISTRATION=false" />
            <EnvRow label="NEXT_PUBLIC_APP_URL set"          ok={data.env.publicUrlSet}      note="For generated links" />
            <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-semibold">Node.js</span>
                <span className="text-slate-700 font-mono font-bold">{data.system.nodeVersion}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-semibold">Platform</span>
                <span className="text-slate-700 font-mono font-bold">{data.system.platform}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-semibold">Process uptime</span>
                <span className="text-slate-700 font-bold">{uptime(data.system.uptimeSeconds)}</span>
              </div>
            </div>
          </div>

          {/* Recent audit events */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Recent Audit Events</h2>
              <a href="/admin/logs" className="text-[10px] font-bold text-blue-600 hover:underline">View all →</a>
            </div>
            {data.auditEvents.recent.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No audit events recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {data.auditEvents.recent.map(e => (
                  <div key={e.id} className="flex items-start gap-2">
                    <EventTypeBadge type={e.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-slate-600 truncate" title={e.description}>{e.description}</p>
                      <p className="text-[9px] text-slate-400">{ago(e.at)}{e.ip ? ` · ${e.ip}` : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Quick links */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-wrap gap-3">
          <span className="text-xs font-bold text-slate-500 self-center">Admin links:</span>
          {[
            { href: '/admin/security',          label: 'Security Checklist' },
            { href: '/admin/settings',          label: 'Settings & Retention' },
            { href: '/admin/logs',              label: 'Import Logs' },
            { href: '/backend',                 label: 'Backend Status' },
          ].map(l => (
            <a key={l.href} href={l.href}
              className="text-xs font-bold text-blue-600 hover:underline bg-white border border-slate-200 rounded-lg px-3 py-1.5">
              {l.label}
            </a>
          ))}
        </div>

      </AdminConsoleLayout>
    </AppShell>
  );
}
