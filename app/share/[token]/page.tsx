// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
import type { Metadata } from 'next';
import { resolveReportShare } from '@/server/sharing/reportShare.service';
import styles from './page.module.scss';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Shared Delivery Report | Delivery Clarity',
  robots: { index: false, follow: false },
};

function formatNumber(value: number, digits = 0): string {
  return new Intl.NumberFormat('en', { maximumFractionDigits: digits }).format(value);
}

export default async function SharedReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await resolveReportShare(token);

  if (result.state !== 'active') {
    const copy = result.state === 'expired'
      ? 'This report link has expired.'
      : result.state === 'revoked'
        ? 'This report link was revoked by its owner.'
        : 'This report link is invalid or no longer available.';
    return (
      <main className={styles.statePage}>
        <div className={styles.stateCard}>
          <p className={styles.eyebrow}>Delivery Clarity</p>
          <h1>Shared report unavailable</h1>
          <p>{copy}</p>
        </div>
      </main>
    );
  }

  const { report } = result;
  const kpis = [
    ['Delivery health', `${formatNumber(report.healthScore)} / 100`],
    ['Completion', `${formatNumber(report.completionRate, 1)}%`],
    ['Total issues', formatNumber(report.totalIssues)],
    ['Done', formatNumber(report.doneIssues)],
    ['Blocked', formatNumber(report.blockedIssues)],
    ['Open defects', formatNumber(report.openDefects)],
    ['Avg lead time', `${formatNumber(report.averageLeadTimeDays, 1)} d`],
    ['Avg cycle time', `${formatNumber(report.averageCycleTimeDays, 1)} d`],
  ] as const;

  return (
    <main className={styles.page}>
      <article className={styles.report}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Delivery Clarity · Shared stakeholder report</p>
            <h1>{report.title}</h1>
            <p className={styles.meta}>Generated {new Date(report.generatedAt).toLocaleString()}</p>
          </div>
          <div className={styles.healthScore} aria-label={`Delivery health ${formatNumber(report.healthScore)} out of 100`}>
            <strong>{formatNumber(report.healthScore)}</strong><span>/100</span>
          </div>
        </header>

        <section aria-labelledby="summary-heading">
          <h2 id="summary-heading">Delivery summary</h2>
          <div className={styles.kpiGrid}>
            {kpis.map(([label, value]) => <div className={styles.kpi} key={label}><span>{label}</span><strong>{value}</strong></div>)}
          </div>
        </section>

        <section aria-labelledby="risk-heading">
          <div className={styles.sectionHeading}>
            <h2 id="risk-heading">Priority risks & attention</h2>
            <span>{report.risks.length} item{report.risks.length === 1 ? '' : 's'}</span>
          </div>
          {report.risks.length ? (
            <div className={styles.tableWrap}>
              <table>
                <thead><tr><th>Key</th><th>Summary</th><th>Status</th><th>Assignee</th><th>Reason</th></tr></thead>
                <tbody>{report.risks.map((risk, index) => (
                  <tr key={`${risk.key}-${index}`}><td>{risk.key}</td><td>{risk.summary}</td><td>{risk.status}</td><td>{risk.assignee ?? '—'}</td><td>{risk.reason ?? '—'}</td></tr>
                ))}</tbody>
              </table>
            </div>
          ) : <p className={styles.empty}>No priority risk items were included in this shared report.</p>}
        </section>

        <footer className={styles.footer}>
          <span>Read-only report · No Delivery Clarity account required</span>
          {result.expiresAt && <span>Link expires {new Date(result.expiresAt).toLocaleString()}</span>}
        </footer>
      </article>
    </main>
  );
}
