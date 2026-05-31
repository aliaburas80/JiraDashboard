// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
import { useNavigate } from 'react-router-dom';
import KpiCard from './KpiCard';

const DONE_ST = ['done', 'closed', 'resolved'];
const norm = (v) => String(v ?? '').trim().toLowerCase();

function scoreMeta(score) {
  if (score >= 90) return { band: 'excellent', label: 'Excellent', color: '#16a34a' };
  if (score >= 75) return { band: 'good',      label: 'Good',      color: '#0f766e' };
  if (score >= 60) return { band: 'moderate',  label: 'Moderate',  color: '#d97706' };
  if (score >= 40) return { band: 'at-risk',   label: 'At Risk',   color: '#ea580c' };
  return               { band: 'critical',  label: 'Critical',  color: '#dc2626' };
}

export default function SummaryPage({ data, onReset, openHelp }) {
  const navigate = useNavigate();
  const flow       = data.flow        || {};
  const sp         = data.storyPoints || {};
  const items      = flow.items       || [];
  const riskItems  = (flow.critical || 0) + (flow.warning || 0);
  const { band, label: scoreLabel } = scoreMeta(data.healthScore || 0);

  const topBlockers = items.filter((i) => i.health === 'critical' && norm(i.reason).includes('block')).slice(0, 3);
  const topOverdue  = items.filter((i) => Number(i.ageDays) > 10 && !DONE_ST.includes(norm(i.status))).slice(0, 3);
  const orphanCount = items.filter((i) => i.isOrphan).length;

  const hasAttention = topBlockers.length > 0 || topOverdue.length > 0 || orphanCount > 0;

  return (
    <main className="summary-page" aria-label="Delivery summary">

      {/* ── Health banner ── */}
      <div className={`summary-health-banner ${band}`}>
        <div className={`summary-score-circle score-${band}`}>
          <span>{data.healthScore || 0}</span>
          <small>/ 100</small>
        </div>

        <div className="summary-health-text">
          <strong className="summary-health-label">{scoreLabel} — {
            riskItems === 0 ? 'Delivery is on track' : `${riskItems} item${riskItems !== 1 ? 's' : ''} need attention`
          }</strong>
          <span className="summary-health-sub">
            {data.completionRate || 0}% complete &nbsp;·&nbsp;
            {data.doneIssues || 0} of {data.totalIssues || 0} issues done
          </span>
        </div>

        {data.prediction && !data.prediction.complete && data.prediction.daysRemaining !== null && (
          <div className="summary-prediction-chip">
            <span className="summary-prediction-days">~{data.prediction.daysRemaining}d</span>
            <span className="summary-prediction-label">Est. completion · {data.prediction.predictedDate}</span>
          </div>
        )}
        {data.prediction?.complete && (
          <div className="summary-prediction-chip complete">
            <span className="summary-prediction-days">100%</span>
            <span className="summary-prediction-label">All issues complete ✅</span>
          </div>
        )}
      </div>

      {/* ── KPI cards ── */}
      <section className="summary-section">
        <h2 className="summary-section-title">Key Metrics</h2>
        <div className="kpi-grid">
          <KpiCard
            label="Completion" value={`${data.completionRate || 0}%`}
            detail={`${data.doneIssues || 0} of ${data.totalIssues || 0} issues`}
            accent="green" tooltip="Percent of issues in Done, Closed, or Resolved."
            thresholds={{ good: 80, warning: 60, critical: 0, max: 100, unit: '%' }}
          />
          <KpiCard
            label="Health Alerts" value={riskItems}
            detail={`${flow.critical || 0} critical · ${flow.warning || 0} warning`}
            accent="red"
          />
          <KpiCard
            label="Active Work" value={data.activeIssues || 0}
            detail="In Progress, Code Review, QA, UAT"
            accent="amber"
          />
          <KpiCard
            label="Lead Time" value={`${flow.averageLeadTimeDays || 0}d`}
            detail={`${flow.leadTimeSampleSize || 0} completed items`}
            accent="blue" tooltip="Created Date → Done Date. Includes backlog waiting time."
            thresholds={{ good: 3, warning: 7, critical: 21, max: 30, unit: 'd' }}
          />
          <KpiCard
            label="Cycle Time" value={`${flow.averageCycleTimeDays || 0}d`}
            detail={`${flow.cycleTimeSampleSize || 0} items with start dates`}
            accent="teal" tooltip="In Progress Date → Done. Pure active delivery time."
            thresholds={{ good: 2, warning: 5, critical: 14, max: 20, unit: 'd' }}
          />
          {sp.totalStoryPoints > 0 && (
            <KpiCard
              label="Story Points" value={`${sp.pointCompletionRate || 0}%`}
              detail={`${sp.completedStoryPoints || 0} / ${sp.totalStoryPoints} pts`}
              accent="violet"
            />
          )}
        </div>
      </section>

      {/* ── Attention ── */}
      {hasAttention && (
        <section className="summary-section">
          <h2 className="summary-section-title">Attention Required</h2>
          <div className="summary-attention-grid">
            {topBlockers.length > 0 && (
              <div className="summary-attention-card card-blockers">
                <span className="summary-attention-icon">🚫</span>
                <strong className="summary-attention-count">{topBlockers.length}</strong>
                <span className="summary-attention-label">Blocker{topBlockers.length !== 1 ? 's' : ''}</span>
                <span className="summary-attention-detail">
                  {topBlockers[0].key}: {(topBlockers[0].summary || topBlockers[0].reason || '').slice(0, 55)}
                </span>
              </div>
            )}
            {topOverdue.length > 0 && (
              <div className="summary-attention-card card-overdue">
                <span className="summary-attention-icon">⏰</span>
                <strong className="summary-attention-count">{topOverdue.length}</strong>
                <span className="summary-attention-label">Overdue</span>
                <span className="summary-attention-detail">
                  {topOverdue[0].key}: open {Math.round(Number(topOverdue[0].ageDays) || 0)} days
                </span>
              </div>
            )}
            {orphanCount > 0 && (
              <div className="summary-attention-card card-orphans">
                <span className="summary-attention-icon">👻</span>
                <strong className="summary-attention-count">{orphanCount}</strong>
                <span className="summary-attention-label">Orphan{orphanCount !== 1 ? 's' : ''}</span>
                <span className="summary-attention-detail">Items without epic or parent</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Insights ── */}
      {data.insights?.length > 0 && (
        <section className="summary-section">
          <h2 className="summary-section-title">Key Insights</h2>
          <ul className="summary-insights-list">
            {data.insights.slice(0, 4).map((insight, i) => (
              <li key={i}>{insight}</li>
            ))}
          </ul>
        </section>
      )}

      {/* ── CTA ── */}
      <div className="summary-cta">
        <button type="button" className="secondary" onClick={onReset}>
          Upload new file
        </button>
        <button type="button" className="btn-view-report" onClick={() => navigate('/charts')}>
          View Charts →
        </button>
      </div>
    </main>
  );
}
