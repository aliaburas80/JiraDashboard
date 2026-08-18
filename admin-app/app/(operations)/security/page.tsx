'use client';

import { useEffect, useState } from 'react';

type SecurityCheck = {
  id: string;
  category: string;
  label: string;
  description: string;
  status: 'pass' | 'fail' | 'warn' | 'manual';
  severity: 'critical' | 'high' | 'medium' | 'low';
  detail: string;
  fix?: string;
};

type SecurityReport = {
  checks: SecurityCheck[];
  passCount: number;
  failCount: number;
  warnCount: number;
  manualCount: number;
  criticalFails: number;
  overallScore: number;
  isProductionReady: boolean;
};

export default function SecurityPage() {
  const [report, setReport] = useState<SecurityReport | null>(null);
  const [error, setError] = useState('');

  async function load() {
    setError('');
    const response = await fetch('/api/ops/security', { cache: 'no-store' });
    const body = await response.json();
    if (!response.ok) { setError(body.error ?? 'Unable to run security checks.'); return; }
    setReport(body);
  }

  useEffect(() => { void load(); }, []);

  return (
    <section className="ops-page">
      <div className="ops-page-header">
        <div><p className="eyebrow">Owner operations</p><h2>Security</h2><p className="muted">Production security checklist from inside the MFA-protected Admin runtime.</p></div>
        <button className="secondary-button" onClick={() => void load()}>Run checks</button>
      </div>

      {error ? <div className="error">{error}</div> : null}
      {!report ? <div className="ops-panel">Running security checks…</div> : (
        <>
          <div className="ops-stat-grid">
            <article className="ops-stat"><span>Security score</span><strong>{report.overallScore}/100</strong><small>{report.isProductionReady ? 'No automatic blocking failures' : 'Needs attention'}</small></article>
            <article className="ops-stat"><span>Passed</span><strong>{report.passCount}</strong><small>automatic checks</small></article>
            <article className="ops-stat"><span>Failed</span><strong>{report.failCount}</strong><small>{report.criticalFails} critical</small></article>
            <article className="ops-stat"><span>Manual</span><strong>{report.manualCount}</strong><small>require human verification</small></article>
          </div>

          <div className="ops-card-list">
            {report.checks.map(check => (
              <article className="ops-panel" key={check.id}>
                <div className="ops-page-header compact">
                  <div><strong>{check.label}</strong><p className="muted">{check.category} · {check.severity}</p></div>
                  <span className={`status-pill status-${check.status}`}>{check.status}</span>
                </div>
                <p>{check.description}</p>
                <p className="muted">{check.detail}</p>
                {check.fix ? <p><strong>Action:</strong> {check.fix}</p> : null}
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
