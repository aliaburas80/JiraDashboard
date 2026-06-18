// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { AdminConsoleLayout } from '@/components/admin/AdminConsoleLayout';
import { SvgIcon } from '@/components/ui/SvgIcon';
import type { SecurityReport, SecurityCheck, CheckStatus, CheckSeverity } from '@/services/settings/securityCheck.service';
import styles from './page.module.scss';

const STATUS_DOT_ICON: Record<CheckStatus, string> = {
  pass:   'check',
  fail:   'cross',
  warn:   'warning',
  manual: 'question',
};

function sevChipClass(sev: CheckSeverity): string {
  if (sev === 'critical') return 'chip c-rd';
  if (sev === 'high')     return 'chip c-or';
  if (sev === 'medium')   return 'chip c-am';
  return 'chip c-nt';
}

const SECTION_HEADER: Record<'fail' | 'warn' | 'pass' | 'manual', string> = {
  fail:   'Failing',
  warn:   'Warnings',
  pass:   'Passing',
  manual: 'Manual Review',
};

const CATEGORIES = ['Authentication', 'Access Control', 'Secrets', 'Environment', 'Database', 'Transport', 'Network', 'Privacy', 'Backup', 'Operations'];

function CheckRow({ c }: { c: SecurityCheck }) {
  const [expanded, setExpanded] = useState(c.status === 'fail');

  return (
    <div className={styles.checkRowCard}>
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className={styles.checkRowBtn}
      >
        {/* Status dot — appearance driven by data-status; no inline styles needed */}
        <span data-status={c.status} className={styles.statusDot}>
          <SvgIcon name={STATUS_DOT_ICON[c.status]} size={10} />
        </span>

        <div className={styles.checkMeta}>
          <div className="flex items-center gap-1 flex-wrap">
            <span className={styles.checkTitle}>{c.label}</span>
            <span className={clsx('chip c-nt', styles.checkChip)}>{c.category}</span>
            <span className={clsx(sevChipClass(c.severity), styles.checkChip)}>{c.severity}</span>
            {!c.isAuto && <span className={clsx('chip c-nt', styles.checkChip)}>manual review</span>}
          </div>
          <p className={styles.checkDetail}>{c.detail}</p>
        </div>

        {/* Chevron — rotation driven by data-expanded; no inline styles needed */}
        <span data-expanded={String(expanded)} className={styles.expandIcon}>▾</span>
      </button>

      {expanded && (
        <div className={styles.expandedPanel}>
          <p className={styles.expandedDescription}>{c.description}</p>
          {c.fix && (
            <div className={styles.fixBox}>
              <p className={styles.fixLabel}>Fix / Action</p>
              <p className={styles.fixText}>{c.fix}</p>
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

  if (loading) return (
    <div className={clsx('flex items-center justify-center h-64 animate-pulse', styles.loadingState)}>
      Running security checks…
    </div>
  );

  const filtered = report?.checks.filter(c =>
    (catFilter === 'all' || c.category === catFilter) &&
    (statusFilter === 'all' || c.status === statusFilter)
  ) ?? [];

  const scoreTone = report
    ? report.overallScore >= 80 ? styles.scoreGood : report.overallScore >= 60 ? styles.scoreWarn : styles.scoreBad
    : styles.scoreNeutral;
  const scoreColor = report
    ? report.overallScore >= 80 ? 'var(--dc-green, #22C55E)' : report.overallScore >= 60 ? 'var(--dc-amber, #F59E0B)' : 'var(--dc-red, #F87171)'
    : 'var(--dc-p2, #909090)';

  const securityStats = report ? [
    { icon: 'shield', label: 'Security Score', value: String(report.overallScore), note: report.isProductionReady ? 'Production ready' : 'Review required', color: scoreColor, toneStyle: { background: report.overallScore >= 80 ? 'rgba(34,197,94,0.1)' : report.overallScore >= 60 ? 'rgba(245,158,11,0.1)' : 'rgba(248,113,113,0.1)', color: scoreColor } },
    { icon: 'checkCircle', label: 'Passing',        value: String(report.passCount),   note: 'Automated checks', color: 'var(--dc-green, #22C55E)',   toneStyle: { background: 'rgba(34,197,94,0.1)',   color: 'var(--dc-green, #22C55E)' } },
    { icon: 'warning', label: 'Warnings',       value: String(report.warnCount),   note: 'Needs attention',  color: 'var(--dc-amber, #F59E0B)',   toneStyle: { background: 'rgba(245,158,11,0.1)',  color: 'var(--dc-amber, #F59E0B)' } },
    { icon: 'question', label: 'Manual Review',  value: String(report.manualCount), note: 'Runbook checks',   color: 'var(--dc-p2, #909090)',      toneStyle: { background: 'var(--dc-s3, #282828)', color: 'var(--dc-p2, #909090)' } },
  ] : [];

  return (
    <AdminConsoleLayout
      title="Security Checklist"
      description="Production security assessment — automated checks and manual review items."
      stats={securityStats}
      statusLabel={report?.isProductionReady ? 'Production ready' : 'Review required'}
    >
      {error && <div className={styles.errorBanner}>{error}</div>}

      {report && (() => {
        // Banner state determined by fail/warn/pass; drives data-state on scoreBanner
        const bannerState =
          (report.criticalFails > 0 || report.failCount > 0) ? 'fail' :
          report.warnCount > 0 ? 'warn' : 'pass';

        const statusText = report.isProductionReady
          ? '✅ Ready for production' : report.criticalFails > 0
          ? '🚫 Not production ready' : '⚠️ Review required before production';

        const bannerChipCls = report.isProductionReady ? 'chip c-gr' : report.warnCount > 0 && !report.failCount ? 'chip c-am' : 'chip c-rd';

        return (
          <>
            {/* Score banner — bg/border via data-state; score color via score tone class */}
            <div
              data-state={bannerState}
              className={clsx(styles.scoreBanner, scoreTone)}
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 text-center">
                  <div className={styles.scoreNumber}>{report.overallScore}</div>
                  <div className={styles.scoreDivider}>/100</div>
                </div>
                <div className="flex-1">
                  <div className={styles.scoreStatus}>{statusText}</div>
                  <div className={clsx(styles.scoreMeta, 'flex flex-wrap gap-2')}>
                    <span>✓ {report.passCount} pass</span>
                    {report.failCount > 0 && <span>✗ {report.failCount} fail</span>}
                    {report.warnCount > 0 && <span>△ {report.warnCount} warn</span>}
                    <span>? {report.manualCount} manual review</span>
                  </div>
                </div>
                <span className={clsx(bannerChipCls, styles.bannerChip)}>
                  {report.isProductionReady ? 'Production ready' : report.failCount > 0 ? 'Not ready' : 'Review needed'}
                </span>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4 items-center">
              <select
                value={catFilter}
                onChange={e => setCatFilter(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">All categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className={styles.filterSelect}
              >
                {['all', 'pass', 'fail', 'warn', 'manual'].map(s => (
                  <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>
                ))}
              </select>
              <span className={styles.filterCount}>
                {filtered.length} check{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Checks grouped by status */}
            {(['fail', 'warn', 'pass', 'manual'] as const).map(status => {
              const group = filtered.filter(c => c.status === status);
              if (!group.length) return null;
              const label = SECTION_HEADER[status];
              return (
                <div key={status} className={styles.sectionGroup}>
                  <p
                    data-status={status}
                    className={styles.sectionLabel}
                  >
                    {label} ({group.length})
                  </p>
                  <div className={styles.checkList}>
                    {group.map(c => <CheckRow key={c.id} c={c} />)}
                  </div>
                </div>
              );
            })}

            <div className={styles.aboutBox}>
              <p className={styles.aboutTitle}>About this checklist</p>
              <p className={styles.aboutText}>
                Automated checks are evaluated server-side. Manual review items cannot be automatically verified — mark them as confirmed in your deployment runbook.
              </p>
            </div>
          </>
        );
      })()}
    </AdminConsoleLayout>
  );
}
