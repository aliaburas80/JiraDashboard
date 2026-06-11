// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { AdminConsoleLayout } from '@/components/admin/AdminConsoleLayout';
import type { SecurityReport, SecurityCheck, CheckStatus, CheckSeverity } from '@/services/settings/securityCheck.service';

const STATUS_DOT: Record<CheckStatus, { bg: string; border: string; color: string; icon: string }> = {
  pass:   { bg: 'rgba(34,197,94,0.12)',   border: '1.5px solid var(--dc-green, #22C55E)', color: '#4ade80',  icon: '✓' },
  fail:   { bg: 'rgba(248,113,113,0.12)', border: '1.5px solid var(--dc-red, #F87171)',   color: '#fca5a5',  icon: '✗' },
  warn:   { bg: 'rgba(245,158,11,0.12)',  border: '1.5px solid var(--dc-amber, #F59E0B)', color: '#fcd34d',  icon: '△' },
  manual: { bg: 'rgba(255,255,255,0.07)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))', color: 'var(--dc-p2, #909090)', icon: '?' },
};

function sevChipClass(sev: CheckSeverity): string {
  if (sev === 'critical') return 'chip c-rd';
  if (sev === 'high')     return 'chip c-or';
  if (sev === 'medium')   return 'chip c-am';
  return 'chip c-nt';
}

const SECTION_HEADER: Record<'fail' | 'warn' | 'pass' | 'manual', { label: string; color: string }> = {
  fail:   { label: '✗ FAILING',       color: 'var(--dc-red, #F87171)' },
  warn:   { label: '△ WARNINGS',      color: 'var(--dc-amber, #F59E0B)' },
  pass:   { label: '✓ PASSING',       color: 'var(--dc-green, #22C55E)' },
  manual: { label: '? MANUAL REVIEW', color: 'var(--dc-p2, #909090)' },
};

const CATEGORIES = ['Authentication', 'Access Control', 'Secrets', 'Environment', 'Database', 'Transport', 'Network', 'Privacy', 'Backup', 'Operations'];

function CheckRow({ c }: { c: SecurityCheck }) {
  const [expanded, setExpanded] = useState(c.status === 'fail');
  const dot = STATUS_DOT[c.status];

  return (
    <div style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))', borderRadius: 9, overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'background 120ms' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--dc-s3, #282828)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <span style={{ width: 18, height: 18, borderRadius: '50%', background: dot.bg, border: dot.border, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, fontSize: 9, color: dot.color, fontWeight: 700 }}>
          {dot.icon}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--dc-p1, #F2F2F2)' }}>{c.label}</span>
            <span className="chip c-nt" style={{ fontSize: 8 }}>{c.category}</span>
            <span className={sevChipClass(c.severity)} style={{ fontSize: 8 }}>{c.severity}</span>
            {!c.isAuto && <span className="chip c-nt" style={{ fontSize: 8 }}>manual review</span>}
          </div>
          <p style={{ fontSize: 10, color: 'var(--dc-p2, #909090)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.detail}</p>
        </div>
        <span style={{ color: expanded ? 'var(--dc-acc2, #FF8A4C)' : 'var(--dc-p2, #909090)', flexShrink: 0, display: 'inline-block', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms', fontSize: 10 }}>▾</span>
      </button>
      {expanded && (
        <div style={{ padding: '8px 12px 12px 12px', borderTop: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>
          <p style={{ fontSize: 11, color: 'var(--dc-p2, #909090)', lineHeight: 1.6 }}>{c.description}</p>
          {c.fix && (
            <div style={{ background: 'rgba(232,93,18,0.04)', border: '1px solid rgba(232,93,18,0.12)', borderLeft: '2px solid var(--dc-acc, #E85D12)', borderRadius: '0 7px 7px 0', padding: '9px 12px', marginTop: 8 }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--dc-acc2, #FF8A4C)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Fix / Action</p>
              <p style={{ fontSize: 11, color: 'var(--dc-p2, #909090)' }}>{c.fix}</p>
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

  if (loading) return <AppShell showNav><div className="flex items-center justify-center h-64 animate-pulse" style={{ color: 'var(--dc-p3, #505050)' }}>Running security checks…</div></AppShell>;

  const filtered = report?.checks.filter(c =>
    (catFilter === 'all' || c.category === catFilter) &&
    (statusFilter === 'all' || c.status === statusFilter)
  ) ?? [];
  const scoreColor = report
    ? report.overallScore >= 80 ? 'var(--dc-green, #22C55E)' : report.overallScore >= 60 ? 'var(--dc-amber, #F59E0B)' : 'var(--dc-red, #F87171)'
    : 'var(--dc-p2, #909090)';
  const securityStats = report ? [
    { icon: '🔐', label: 'Security Score', value: String(report.overallScore), note: report.isProductionReady ? 'Production ready' : 'Review required', color: scoreColor, toneStyle: { background: report.overallScore >= 80 ? 'rgba(34,197,94,0.1)' : report.overallScore >= 60 ? 'rgba(245,158,11,0.1)' : 'rgba(248,113,113,0.1)', color: scoreColor } },
    { icon: '✓', label: 'Passing',        value: String(report.passCount),   note: 'Automated checks', color: 'var(--dc-green, #22C55E)',   toneStyle: { background: 'rgba(34,197,94,0.1)',   color: 'var(--dc-green, #22C55E)' } },
    { icon: '△', label: 'Warnings',       value: String(report.warnCount),   note: 'Needs attention',  color: 'var(--dc-amber, #F59E0B)',   toneStyle: { background: 'rgba(245,158,11,0.1)',  color: 'var(--dc-amber, #F59E0B)' } },
    { icon: '?', label: 'Manual Review',  value: String(report.manualCount), note: 'Runbook checks',   color: 'var(--dc-p2, #909090)',      toneStyle: { background: 'var(--dc-s3, #282828)', color: 'var(--dc-p2, #909090)' } },
  ] : [];

  return (
    <AppShell showNav>
      <AdminConsoleLayout
        title="Security Checklist"
        description="Production security assessment — automated checks and manual review items."
        stats={securityStats}
        statusLabel={report?.isProductionReady ? 'Production ready' : 'Review required'}
      >
        {error && (
          <div style={{ background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.18)', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#fca5a5', marginBottom: 16 }}>{error}</div>
        )}

        {report && (() => {
          const bannerBg = report.criticalFails > 0 || report.failCount > 0
            ? 'rgba(248,113,113,0.06)' : report.warnCount > 0
            ? 'rgba(245,158,11,0.06)' : 'rgba(34,197,94,0.06)';
          const bannerBorder = report.criticalFails > 0 || report.failCount > 0
            ? 'rgba(248,113,113,0.18)' : report.warnCount > 0
            ? 'rgba(245,158,11,0.18)' : 'rgba(34,197,94,0.18)';
          const statusText = report.isProductionReady
            ? '✅ Ready for production' : report.criticalFails > 0
            ? '🚫 Not production ready' : '⚠️ Review required before production';
          const bannerChipCls = report.isProductionReady ? 'chip c-gr' : report.warnCount > 0 && !report.failCount ? 'chip c-am' : 'chip c-rd';

          return (
            <>
              {/* Score banner */}
              <div style={{ background: bannerBg, border: `1px solid ${bannerBorder}`, borderRadius: 10, padding: '13px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ flexShrink: 0, textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 32, fontWeight: 700, color: scoreColor, lineHeight: 1 }}>{report.overallScore}</div>
                  <div style={{ fontSize: 10, color: 'var(--dc-p2, #909090)', marginTop: 2 }}>/100</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: scoreColor, marginBottom: 4 }}>{statusText}</div>
                  <div style={{ fontSize: 10, color: 'var(--dc-p2, #909090)', display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    <span>✓ {report.passCount} pass</span>
                    {report.failCount > 0 && <span>✗ {report.failCount} fail</span>}
                    {report.warnCount > 0 && <span>△ {report.warnCount} warn</span>}
                    <span>? {report.manualCount} manual review</span>
                  </div>
                </div>
                <span className={bannerChipCls} style={{ borderRadius: 100, flexShrink: 0 }}>
                  {report.isProductionReady ? 'Production ready' : report.failCount > 0 ? 'Not ready' : 'Review needed'}
                </span>
              </div>

              {/* Filters */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16, alignItems: 'center' }}>
                <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                  style={{ background: 'var(--dc-s3, #282828)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: 'var(--dc-p2, #909090)', outline: 'none' }}>
                  <option value="all">All categories</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                  style={{ background: 'var(--dc-s3, #282828)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: 'var(--dc-p2, #909090)', outline: 'none' }}>
                  {['all','pass','fail','warn','manual'].map(s => (
                    <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>
                  ))}
                </select>
                <span style={{ fontSize: 11, color: 'var(--dc-p3, #505050)' }}>{filtered.length} check{filtered.length !== 1 ? 's' : ''}</span>
              </div>

              {/* Checks grouped by status */}
              {(['fail','warn','pass','manual'] as const).map(status => {
                const group = filtered.filter(c => c.status === status);
                if (!group.length) return null;
                const hdr = SECTION_HEADER[status];
                return (
                  <div key={status} style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: hdr.color, marginBottom: 8 }}>
                      {hdr.label} ({group.length})
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {group.map(c => <CheckRow key={c.id} c={c} />)}
                    </div>
                  </div>
                );
              })}

              <div style={{ marginTop: 24, background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))', borderRadius: 12, padding: 16 }}>
                <p style={{ fontWeight: 700, color: 'var(--dc-p1, #F2F2F2)', fontSize: 12, marginBottom: 4 }}>About this checklist</p>
                <p style={{ fontSize: 12, color: 'var(--dc-p2, #909090)', lineHeight: 1.6 }}>Automated checks are evaluated server-side. Manual review items cannot be automatically verified — mark them as confirmed in your deployment runbook.</p>
              </div>
            </>
          );
        })()}
      </AdminConsoleLayout>
    </AppShell>
  );
}
