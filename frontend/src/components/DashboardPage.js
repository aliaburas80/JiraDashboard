// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
import { useMemo, useState, useRef, useEffect } from 'react';
import KpiCard from './KpiCard';

function ProgressBar({ value }) {
  return (
    <div className="progress-track" aria-label={`${value}%`}>
      <div className="progress-fill" style={{ width: `${Math.max(0, Math.min(value, 100))}%` }} />
    </div>
  );
}

function MetricTable({ columns, rows, emptyMessage, rowClassName }) {
  if (!rows || !rows.length) {
    return <p className="muted">{emptyMessage}</p>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id || row.key || row.name || row.assignee || row.epic || index} className={rowClassName ? rowClassName(row) : undefined}>
              {columns.map((column) => (
                <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HealthBadge({ value }) {
  return <span className={`health-badge ${value || 'unknown'}`}>{value || 'unknown'}</span>;
}

function formatDays(value) {
  return value === null || value === undefined ? '-' : `${value}d`;
}

function HelpButton({ topic, label, onOpenHelp }) {
  if (!onOpenHelp) return null;

  return (
    <button className="context-help-button" type="button" onClick={() => onOpenHelp(topic)} aria-label={label || `Help for ${topic}`}>
      ?
    </button>
  );
}

function SectionHeader({ icon, kicker, title, detail, helpTopic, onOpenHelp }) {
  return (
    <div className="section-heading">
      <div className="section-heading-left">
        {icon && <span className="section-heading-icon" aria-hidden="true">{icon}</span>}
        <div>
          <span>{kicker}</span>
          <div className="heading-title-row">
            <h3>{title}</h3>
            <HelpButton topic={helpTopic} label={`Help for ${title}`} onOpenHelp={onOpenHelp} />
          </div>
        </div>
      </div>
      {detail && <p>{detail}</p>}
    </div>
  );
}

function PanelTitle({ children, helpTopic, onOpenHelp }) {
  return (
    <div className="panel-title-row">
      <h3>{children}</h3>
      <HelpButton topic={helpTopic} label={`Help for ${children}`} onOpenHelp={onOpenHelp} />
    </div>
  );
}

function getUniqueValues(items, key) {
  return [...new Set((items || []).map((item) => item[key]).filter(Boolean))].sort();
}

function normalizeText(value) {
  return String(value ?? '').trim().toLowerCase();
}

function matchesText(value, query) {
  const terms = normalizeText(query).split(/\s+/).filter(Boolean);
  const text = normalizeText(value);
  return !terms.length || terms.every((term) => text.includes(term));
}

function matchesSelect(value, selected) {
  return selected === 'all' || normalizeText(value) === normalizeText(selected);
}

function isWithinMaxDays(value, maxDays) {
  if (maxDays === '') return true;
  const parsedMax = Number(maxDays);
  if (!Number.isFinite(parsedMax)) return false;
  if (value === null || value === undefined) return false;
  return Number(value) <= parsedMax;
}

function csvFromRows(rows, columns) {
  const csv = [columns.map((col) => `"${col.label}"`).join(',')];
  rows.forEach((row) => {
    const line = columns.map((col) => {
      const value = col.render ? col.render(row) : row[col.key];
      const text = typeof value === 'string' ? value : String(value ?? '');
      return `"${text.replace(/"/g, '""')}"`;
    });
    csv.push(line.join(','));
  });
  return csv.join('\n');
}

function CompactBarChart({ rows, labelKey = 'name', valueKey = 'count', emptyMessage = 'No data available.' }) {
  const chartRows = (rows || [])
    .map((row) => ({ label: row[labelKey], value: Number(row[valueKey]) || 0 }))
    .filter((row) => row.label && row.value >= 0);
  const maxValue = Math.max(...chartRows.map((row) => row.value), 1);

  if (!chartRows.length) {
    return <p className="muted">{emptyMessage}</p>;
  }

  return (
    <div className="status-graph">
      {chartRows.map((item) => (
        <div className="status-bar-row" key={item.label}>
          <span>{item.label}</span>
          <div className="status-bar-track">
            <div className="status-bar-fill" style={{ width: `${(item.value / maxValue) * 100}%` }} />
          </div>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

function StatusGraph({ rows }) {
  const statusCounts = Object.entries(
    (rows || []).reduce((counts, item) => {
      counts[item.status] = (counts[item.status] || 0) + 1;
      return counts;
    }, {})
  )
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  if (!statusCounts.length) {
    return <p className="muted">No items match the selected filters.</p>;
  }

  return <CompactBarChart rows={statusCounts} labelKey="status" valueKey="count" />;
}

function HealthDonut({ flow }) {
  const good = flow.good || 0;
  const warning = flow.warning || 0;
  const critical = flow.critical || 0;
  const total = Math.max(good + warning + critical, 1);
  const goodEnd = (good / total) * 100;
  const warningEnd = goodEnd + (warning / total) * 100;
  const background = `conic-gradient(#16a34a 0 ${goodEnd}%, #f59e0b ${goodEnd}% ${warningEnd}%, #dc2626 ${warningEnd}% 100%)`;

  return (
    <section className="dashboard-panel chart-panel">
      <h3>Health Mix</h3>
      <div className="donut-layout">
        <div className="donut-chart" style={{ background }}>
          <span>{total}</span>
          <small>items</small>
        </div>
        <div className="legend-list">
          <div><span className="legend-dot good" />Good <strong>{good}</strong></div>
          <div><span className="legend-dot warning" />Warning <strong>{warning}</strong></div>
          <div><span className="legend-dot critical" />Critical <strong>{critical}</strong></div>
        </div>
      </div>
    </section>
  );
}

function DistributionDonut({ title, rows, labelKey = 'name', valueKey = 'count', emptyMessage = 'No data available.' }) {
  const palette = ['#1d4ed8', '#14b8a6', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2'];
  const items = (rows || [])
    .map((row, index) => ({
      label: row[labelKey],
      value: Number(row[valueKey]) || 0,
      color: palette[index % palette.length],
    }))
    .filter((item) => item.label && item.value > 0)
    .slice(0, 6);
  const total = items.reduce((sum, item) => sum + item.value, 0);
  let cursor = 0;
  const segments = items.map((item) => {
    const start = cursor;
    const end = cursor + (item.value / Math.max(total, 1)) * 100;
    cursor = end;
    return `${item.color} ${start}% ${end}%`;
  });
  const background = segments.length ? `conic-gradient(${segments.join(', ')})` : '#e2e8f0';

  return (
    <div className="distribution-donut-card">
      <h4>{title}</h4>
      {items.length ? (
        <div className="donut-layout compact">
          <div className="donut-chart small" style={{ background }}>
            <span>{total}</span>
            <small>items</small>
          </div>
          <div className="legend-list compact">
            {items.map((item) => (
              <div key={item.label}>
                <span className="legend-dot" style={{ background: item.color }} />
                {item.label}
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="muted">{emptyMessage}</p>
      )}
    </div>
  );
}

function CircleMetric({ title, value, total, label, color = '#1d4ed8' }) {
  const safeTotal = Math.max(Number(total) || 0, 1);
  const safeValue = Math.max(Number(value) || 0, 0);
  const percent = Math.min((safeValue / safeTotal) * 100, 100);
  const background = `conic-gradient(${color} 0 ${percent}%, #e2e8f0 ${percent}% 100%)`;

  return (
    <section className="dashboard-panel mini-circle-panel">
      <h3>{title}</h3>
      <div className="mini-circle-layout">
        <div className="mini-circle" style={{ background }}>
          <span>{Math.round(percent)}%</span>
        </div>
        <div>
          <strong>{safeValue}</strong>
          <span>{label}</span>
          <small>of {total || 0}</small>
        </div>
      </div>
    </section>
  );
}

function QuarterChart({ quarters }) {
  const maxIssues = Math.max(...(quarters || []).map((quarter) => quarter.issues || 0), 1);

  return (
    <section className="dashboard-panel chart-panel">
      <h3>Quarter Progress</h3>
      <div className="quarter-chart">
        {(quarters || []).map((quarter) => (
          <div className="quarter-column" key={quarter.quarter}>
            <div className="quarter-bars">
              <span className="quarter-total" style={{ height: `${Math.max((quarter.issues / maxIssues) * 100, 8)}%` }} />
              <span className="quarter-done" style={{ height: `${Math.max((quarter.doneIssues / maxIssues) * 100, quarter.doneIssues ? 8 : 0)}%` }} />
            </div>
            <strong>{quarter.quarter}</strong>
            <small>{quarter.completionRate}% complete</small>
          </div>
        ))}
      </div>
      {!quarters?.length && <p className="muted">No quarter data available.</p>}
    </section>
  );
}

function ProgressCell({ value }) {
  return (
    <div className="table-progress">
      <ProgressBar value={value || 0} />
      <span>{value || 0}%</span>
    </div>
  );
}

function WorkStateChart({ rows }) {
  const buckets = [
    { name: 'To Do', value: rows?.filter((item) => ['backlog', 'selected for development', 'to do', 'todo'].includes(normalizeText(item.status))).length || 0 },
    { name: 'In Progress', value: rows?.filter((item) => ['in progress', 'code review', 'qa', 'testing', 'uat'].includes(normalizeText(item.status))).length || 0 },
    { name: 'Done', value: rows?.filter((item) => ['done', 'closed', 'resolved'].includes(normalizeText(item.status))).length || 0 },
    { name: 'Other', value: rows?.filter((item) => !['backlog', 'selected for development', 'to do', 'todo', 'in progress', 'code review', 'qa', 'testing', 'uat', 'done', 'closed', 'resolved'].includes(normalizeText(item.status))).length || 0 },
  ].filter((bucket) => bucket.value > 0);

  return <CompactBarChart rows={buckets} valueKey="value" emptyMessage="No work state data available." />;
}

function SprintCompareChart({ sprints }) {
  const rows = (sprints || []).map((item) => ({
    name: item.name,
    count: item.issues,
  }));

  return <CompactBarChart rows={rows} emptyMessage="No sprint data available." />;
}

const DONE_STATUSES = ['done', 'closed', 'resolved'];

function healthScoreMeta(score) {
  if (score >= 90) return { band: 'excellent', label: 'Excellent' };
  if (score >= 75) return { band: 'good',      label: 'Good' };
  if (score >= 60) return { band: 'moderate',  label: 'Moderate' };
  if (score >= 40) return { band: 'at-risk',   label: 'At Risk' };
  return               { band: 'critical',  label: 'Critical' };
}

function HealthScoreGauge({ score, onClick }) {
  const { band, label } = healthScoreMeta(score);
  return (
    <button type="button" className="health-score-gauge" onClick={onClick} title="Open Quick Overview">
      <div className={`health-score-circle score-${band}`}>
        <span>{score}</span>
        <small>/ 100</small>
      </div>
      <div className="health-score-info">
        <strong>Health Score</strong>
        <span>{label}</span>
      </div>
    </button>
  );
}

function SmartActions({ actions, onAction }) {
  if (!actions.length) return null;
  return (
    <section className="smart-actions" aria-label="Smart recommendations">
      <div className="smart-actions-header">
        <span className="smart-actions-title">⚡ Smart Recommendations</span>
        <span className="smart-actions-count">{actions.length} action{actions.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="smart-actions-grid">
        {actions.map((action, i) => (
          <button
            key={i}
            type="button"
            className={`smart-action-card smart-action-${action.type}`}
            onClick={() => onAction(action)}
          >
            <div className="smart-action-top">
              <span className="smart-action-num">{i + 1}</span>
              <span className="smart-action-icon" aria-hidden="true">{action.icon}</span>
              <span className={`smart-action-badge ${action.type}`}>{action.type}</span>
            </div>
            <div className="smart-action-title">{action.title}</div>
            <div className="smart-action-detail">{action.detail}</div>
            <div className="smart-action-cta">Go to details →</div>
          </button>
        ))}
      </div>
    </section>
  );
}

function ManagerReport({ data, flowItems, epicReadiness, healthStatus, riskItems, onClose, onNavigate }) {
  const flow = data.flow || {};
  const sp = data.storyPoints || {};
  const sprint = data.sprint || {};

  const healthClass = riskItems === 0 ? 'healthy' : riskItems < 4 ? 'at-risk' : 'urgent-attention';
  const topRisks = (flowItems || []).filter((i) => i.health === 'critical').slice(0, 3);
  const latestSprint = sprint.sprints?.slice().sort((a, b) => b.issues - a.issues)[0];
  const atRisk = (epicReadiness || []).filter((e) => e.risk === 'critical' || e.completion < 60);
  const topLabels = (data.labels?.labelStats || []).filter((l) => l.label !== '(unlabeled)').slice(0, 3);
  const insights = (data.insights || []).slice(0, 3);
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="report-backdrop" role="dialog" aria-modal="true" aria-labelledby="report-title" onClick={onClose}>
      <div className="report-panel" onClick={(e) => e.stopPropagation()}>

        <header className="report-header">
          <div>
            <span className="report-eyebrow">Delivery Clarity — Executive Summary</span>
            <h2 className="report-title" id="report-title">Delivery Health Report</h2>
            <p className="report-date">Generated {today}</p>
          </div>
          <button type="button" className="report-close-btn" onClick={onClose} aria-label="Close report">Close ✕</button>
        </header>

        <div className="report-scroll">
          <div className={`report-health-banner ${healthClass}`}>
            <div className="report-health-left">
              <span className="report-health-indicator">
                <span className="report-health-dot" />
                {healthStatus}
              </span>
              <span className="report-health-sub">
                {riskItems === 0 ? 'No items require attention' : `${riskItems} item${riskItems !== 1 ? 's' : ''} require attention`}
              </span>
            </div>
            <div className="report-health-right">
              <span className="report-completion">{data.completionRate || 0}%</span>
              <span className="report-completion-label">complete</span>
            </div>
          </div>

          <div className="report-snapshot-grid">
            {[
              { label: 'Total',      value: data.totalIssues || 0,              cls: '' },
              { label: 'Done',       value: data.doneIssues || 0,               cls: 'green' },
              { label: 'Active',     value: data.activeIssues || 0,             cls: 'blue' },
              { label: 'Critical',   value: flow.critical || 0,                 cls: 'red' },
              { label: 'Warning',    value: flow.warning || 0,                  cls: 'amber' },
              { label: 'Lead Time',  value: `${flow.averageLeadTimeDays || 0}d`, cls: '' },
              { label: 'Cycle Time', value: `${flow.averageCycleTimeDays || 0}d`, cls: '' },
              ...(sp.totalStoryPoints > 0 ? [{
                label: 'Points',
                value: `${sp.pointCompletionRate || 0}%`,
                cls: '',
                sub: `${sp.completedStoryPoints} / ${sp.totalStoryPoints}`,
              }] : []),
            ].map(({ label, value, cls, sub }) => (
              <div key={label} className="report-snapshot-cell">
                <span className="report-snapshot-label">{label}</span>
                <span className={`report-snapshot-value ${cls}`}>{value}</span>
                {sub && <span className="report-snapshot-sub">{sub}</span>}
              </div>
            ))}
          </div>

          <div className="report-rows">

            <div className="report-row">
              <div className="report-row-body">
                <div className="report-row-header">
                  <span className="report-row-icon" aria-hidden="true">🔴</span>
                  <span className="report-row-title">Risk Indicators</span>
                  <span className={`report-row-badge ${topRisks.length > 0 ? 'critical' : 'good'}`}>
                    {topRisks.length > 0 ? `${topRisks.length} critical` : 'All clear'}
                  </span>
                </div>
                {topRisks.length > 0 ? (
                  <ul className="report-risk-list">
                    {topRisks.map((item) => (
                      <li key={item.key} className="report-risk-item">
                        <span className="report-risk-key">{item.key}</span>
                        <span className="report-risk-reason">{item.summary || item.reason}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="report-row-content">No critical items detected. Delivery is on track.</p>
                )}
              </div>
              <button type="button" className="report-details-btn" onClick={() => onNavigate('flow-health-panel', 'openFlow')}>Details →</button>
            </div>

            {latestSprint && (
              <div className="report-row">
                <div className="report-row-body">
                  <div className="report-row-header">
                    <span className="report-row-icon" aria-hidden="true">🏃</span>
                    <span className="report-row-title">Sprint Status</span>
                    <span className={`report-row-badge ${latestSprint.completionRate >= 80 ? 'good' : latestSprint.completionRate >= 60 ? 'warning' : 'critical'}`}>
                      {latestSprint.completionRate}% done
                    </span>
                  </div>
                  <p className="report-row-content">
                    <strong>{latestSprint.name}</strong> — {latestSprint.completedIssues} of {latestSprint.issues} issues done
                    {latestSprint.critical > 0 && ` · ${latestSprint.critical} critical`}
                    {latestSprint.completedPoints > 0 && ` · ${latestSprint.completedPoints} pts delivered`}
                  </p>
                </div>
                <button type="button" className="report-details-btn" onClick={() => onNavigate('section-sprint')}>Details →</button>
              </div>
            )}

            <div className="report-row">
              <div className="report-row-body">
                <div className="report-row-header">
                  <span className="report-row-icon" aria-hidden="true">🎯</span>
                  <span className="report-row-title">Epic Readiness</span>
                  <span className={`report-row-badge ${atRisk.length > 0 ? (atRisk.some((e) => e.risk === 'critical') ? 'critical' : 'warning') : 'good'}`}>
                    {atRisk.length > 0 ? `${atRisk.length} at-risk` : 'All healthy'}
                  </span>
                </div>
                {atRisk.length > 0 ? (
                  <p className="report-row-content">
                    {atRisk.filter((e) => e.risk === 'critical').length > 0 && (
                      <><strong>{atRisk.filter((e) => e.risk === 'critical').length} critical epic{atRisk.filter((e) => e.risk === 'critical').length !== 1 ? 's' : ''}</strong> · </>
                    )}
                    Top: <strong>{atRisk[0]?.epic || '—'}</strong> at {atRisk[0]?.completion || 0}% complete
                  </p>
                ) : (
                  <p className="report-row-content">All epics are progressing well toward completion.</p>
                )}
              </div>
              <button type="button" className="report-details-btn" onClick={() => onNavigate('section-readiness')}>Details →</button>
            </div>

            {data.capacity?.length > 0 && (
              <div className="report-row">
                <div className="report-row-body">
                  <div className="report-row-header">
                    <span className="report-row-icon" aria-hidden="true">👥</span>
                    <span className="report-row-title">Capacity</span>
                    <span className="report-row-badge info">{data.capacity.length} assignees</span>
                  </div>
                  <p className="report-row-content">
                    Top load: <strong>{data.capacity[0]?.assignee}</strong> {data.capacity[0]?.loadShare}%
                    ({data.capacity[0]?.issues} issues{data.capacity[0]?.activeIssues > 0 ? `, ${data.capacity[0].activeIssues} active` : ''})
                    {data.capacity[1] && ` · ${data.capacity[1].assignee} ${data.capacity[1].loadShare}%`}
                  </p>
                </div>
                <button type="button" className="report-details-btn" onClick={() => onNavigate('capacity-section')}>Details →</button>
              </div>
            )}

            {topLabels.length > 0 && (
              <div className="report-row">
                <div className="report-row-body">
                  <div className="report-row-header">
                    <span className="report-row-icon" aria-hidden="true">🏷️</span>
                    <span className="report-row-title">Labels & Classification</span>
                    <span className="report-row-badge info">{data.labels.uniqueLabels} labels</span>
                  </div>
                  <p className="report-row-content">
                    Top: {topLabels.map((l) => `${l.label} (${l.count})`).join(' · ')}
                    {data.labels.totalUnlabeled > 0 && ` · ${data.labels.totalUnlabeled} unlabeled`}
                  </p>
                </div>
                <button type="button" className="report-details-btn" onClick={() => onNavigate('section-labels')}>Details →</button>
              </div>
            )}

            {data.relations?.hasLinks && (
              <div className="report-row">
                <div className="report-row-body">
                  <div className="report-row-header">
                    <span className="report-row-icon" aria-hidden="true">🔗</span>
                    <span className="report-row-title">Issue Relations</span>
                    <span className={`report-row-badge ${data.relations.blockedItems?.length > 0 ? 'warning' : 'info'}`}>
                      {data.relations.totalLinks} links
                    </span>
                  </div>
                  <p className="report-row-content">
                    {data.relations.itemsWithLinks} item{data.relations.itemsWithLinks !== 1 ? 's' : ''} with relationships
                    {data.relations.blockedItems?.length > 0 && <> · <strong>{data.relations.blockedItems.length} explicitly blocked</strong></>}
                    {` · ${data.relations.linkTypes} link type${data.relations.linkTypes !== 1 ? 's' : ''}`}
                  </p>
                </div>
                <button type="button" className="report-details-btn" onClick={() => onNavigate('section-relations')}>Details →</button>
              </div>
            )}

            {insights.length > 0 && (
              <div className="report-row">
                <div className="report-row-body">
                  <div className="report-row-header">
                    <span className="report-row-icon" aria-hidden="true">💡</span>
                    <span className="report-row-title">Key Insights</span>
                  </div>
                  <ul className="report-insights">
                    {insights.map((insight, i) => (
                      <li key={i} className="report-insight-item">
                        <span className="report-insight-dot" aria-hidden="true" />
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
                <button type="button" className="report-details-btn" onClick={() => onNavigate('section-overview')}>Details →</button>
              </div>
            )}

          </div>
        </div>

        <footer className="report-footer">
          <button type="button" className="report-print-btn" onClick={() => window.print()}>🖨 Print report</button>
          <button type="button" className="report-back-btn" onClick={onClose}>Back to dashboard</button>
        </footer>
      </div>
    </div>
  );
}
const ACTIVE_STATUSES = ['in progress', 'code review', 'qa', 'testing', 'uat'];

function DeliveryCircle({ flowItems, data, flow, storyPoints, orphanItems, totalIssues, onOpenHelp, helpTopic }) {
  const total = Math.max(totalIssues, 1);

  const doneBucket = flowItems.filter((i) => DONE_STATUSES.includes(normalizeText(i.status))).length;
  const criticalBucket = flowItems.filter((i) => !DONE_STATUSES.includes(normalizeText(i.status)) && normalizeText(i.health) === 'critical').length;
  const warningBucket = flowItems.filter((i) => !DONE_STATUSES.includes(normalizeText(i.status)) && normalizeText(i.health) === 'warning').length;
  const activeBucket = flowItems.filter((i) =>
    ACTIVE_STATUSES.includes(normalizeText(i.status)) &&
    !DONE_STATUSES.includes(normalizeText(i.status)) &&
    normalizeText(i.health) !== 'critical' &&
    normalizeText(i.health) !== 'warning'
  ).length;
  const otherBucket = Math.max(total - doneBucket - criticalBucket - warningBucket - activeBucket, 0);

  const segments = [
    { key: 'done',     label: 'Done',            value: doneBucket,     color: '#16a34a' },
    { key: 'active',   label: 'In Progress',      value: activeBucket,   color: '#2563eb' },
    { key: 'warning',  label: 'At Risk',           value: warningBucket,  color: '#f59e0b' },
    { key: 'critical', label: 'Critical',          value: criticalBucket, color: '#dc2626' },
    { key: 'other',    label: 'Backlog / Other',   value: otherBucket,    color: '#cbd5e1' },
  ].filter((s) => s.value > 0);

  const segTotal = Math.max(segments.reduce((acc, s) => acc + s.value, 0), 1);
  let cursor = 0;
  const background = `conic-gradient(${segments.map((seg) => {
    const start = cursor;
    cursor += (seg.value / segTotal) * 100;
    return `${seg.color} ${start}% ${cursor}%`;
  }).join(', ')})`;

  return (
    <div className="dashboard-panel delivery-circle-panel">
      <div className="panel-title-row">
        <h3>Delivery Composition</h3>
        <HelpButton topic={helpTopic} label="Help for delivery ratios" onOpenHelp={onOpenHelp} />
      </div>
      <div className="delivery-circle-layout">
        <div className="delivery-circle-wrap">
          <div className="delivery-circle" style={{ background }}>
            <div className="delivery-circle-inner">
              <span className="delivery-circle-value">{data.completionRate || 0}%</span>
              <small>complete</small>
              <span className="delivery-circle-issues">{data.doneIssues || 0} of {total}</span>
            </div>
          </div>
        </div>

        <div className="delivery-circle-legend">
          {segments.map((seg) => (
            <div key={seg.key} className={`delivery-legend-row${seg.key === 'other' ? ' delivery-legend-muted' : ''}`}>
              <span className="legend-swatch" style={{ background: seg.color }} />
              <span className="legend-label">{seg.label}</span>
              <strong className="legend-count">{seg.value}</strong>
              <span className="legend-pct">{Math.round((seg.value / total) * 100)}%</span>
            </div>
          ))}

          <div className="delivery-legend-divider" />

          <div className="delivery-legend-totals">
            <div><span>Total</span><strong>{total} issues</strong></div>
            {orphanItems > 0 && <div><span>Orphans</span><strong>{orphanItems}</strong></div>}
            {storyPoints.totalStoryPoints > 0 && (
              <div>
                <span>Points</span>
                <strong>{storyPoints.completedStoryPoints || 0} / {storyPoints.totalStoryPoints}</strong>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const DASHBOARD_SECTIONS = [
  { id: 'dashboard-summary',          label: 'Summary',     color: '#2563eb' },
  { id: 'section-attention',          label: 'Alerts',      color: '#f59e0b' },
  { id: 'section-overview',           label: 'KPIs',        color: '#16a34a' },
  { id: 'section-visuals',            label: 'Charts',      color: '#0891b2' },
  { id: 'section-ratios',             label: 'Composition', color: '#7c3aed' },
  { id: 'section-delivery-controls',  label: 'Delivery',    color: '#f97316' },
  { id: 'section-quarters',           label: 'Quarters',    color: '#f97316' },
  { id: 'section-kanban',             label: 'Kanban',      color: '#0f766e' },
  { id: 'section-sprint',             label: 'Sprint',      color: '#7c3aed' },
  { id: 'section-ownership',          label: 'Ownership',   color: '#0f766e' },
  { id: 'section-labels',             label: 'Labels',      color: '#7c3aed' },
  { id: 'section-relations',          label: 'Relations',   color: '#dc2626' },
  { id: 'section-readiness',          label: 'Readiness',   color: '#dc2626' },
  { id: 'flow-health-panel',          label: 'Flow Table',  color: '#2563eb' },
];

function SectionNav() {
  const [active, setActive] = useState(DASHBOARD_SECTIONS[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
    );
    DASHBOARD_SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <nav className="section-nav" aria-label="Page sections">
      {DASHBOARD_SECTIONS.map(({ id, label, color }) => (
        <button
          key={id}
          type="button"
          className={`section-nav-item${active === id ? ' active' : ''}`}
          onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          aria-label={`Go to ${label}`}
        >
          <span
            className="section-nav-dot"
            style={active === id ? { background: color, boxShadow: `0 0 0 3px ${color}33` } : {}}
          />
          <span className="section-nav-label" style={active === id ? { color, fontWeight: 900 } : {}}>
            {label}
          </span>
        </button>
      ))}
    </nav>
  );
}

function ScrollToTopFab() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  if (!visible) return null;
  return (
    <button
      type="button"
      className="scroll-top-fab"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Scroll to top"
    >
      ↑
    </button>
  );
}

export default function DashboardPage({ data, onReset, onOpenHelp }) {
  const flow = data.flow || {};
  const sprint = data.sprint || {};
  const kanban = data.kanban || {};
  const storyPoints = data.storyPoints || {};
  const risk = data.risk || {};
  const quarters = data.quarters || [];
  const flowItems = flow.items || [];
  const orphanItems = flowItems.filter((item) => item.isOrphan).length;
  const totalIssues = data.totalIssues || flowItems.length || 0;
  const riskItems = (flow.critical || 0) + (flow.warning || 0);
  const flowFiltersRef = useRef(null);
  const [keyFilter, setKeyFilter] = useState('');
  const [summaryFilter, setSummaryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sprintFilter, setSprintFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [leadMaxFilter, setLeadMaxFilter] = useState('');
  const [cycleMaxFilter, setCycleMaxFilter] = useState('');
  const [openAgeMaxFilter, setOpenAgeMaxFilter] = useState('');
  const [healthFilter, setHealthFilter] = useState('all');
  const [reasonFilter, setReasonFilter] = useState('');
  const [isFlowPanelOpen, setIsFlowPanelOpen] = useState(false);
  const [detailPanel, setDetailPanel] = useState(null);
  const [layoutSaved, setLayoutSaved] = useState(false);
  const [reportMessage, setReportMessage] = useState('');
  const [activeQuickFilter, setActiveQuickFilter] = useState('all');
  const [hideStickyFilter, setHideStickyFilter] = useState(false);
  const [stickyTop, setStickyTop] = useState(0);
  const [showManagerReport, setShowManagerReport] = useState(false);
  const [labelFilter, setLabelFilter] = useState('');
  const [flowItemVisibleCount, setFlowItemVisibleCount] = useState(100);

  const statusOptions = useMemo(() => getUniqueValues(flowItems, 'status'), [flowItems]);
  const sprintOptions = useMemo(() => getUniqueValues(flowItems, 'sprint'), [flowItems]);
  const assigneeOptions = useMemo(() => getUniqueValues(flowItems, 'assignee'), [flowItems]);
  const healthOptions = useMemo(() => getUniqueValues(flowItems, 'health'), [flowItems]);

  const healthStatus = riskItems === 0 ? 'Healthy' : riskItems < 4 ? 'At Risk' : 'Urgent Attention';
  const healthMessage = riskItems === 0 ? 'Delivery is stable' : `${riskItems} items require attention`;
  const summaryDelta = data.summaryDelta || {
    completion: '+0%',
    risk: '0',
    cycleTime: '0d',
  };

  const topBlockers = flowItems.filter((item) => normalizeText(item.reason).includes('block')).slice(0, 5);
  const topOverdue = flowItems
    .filter((item) => Number(item.ageDays) > 10 && !['done', 'closed', 'resolved'].includes(normalizeText(item.status)))
    .slice(0, 5);
  const topOrphans = flowItems.filter((item) => item.isOrphan).slice(0, 5);

  const confidenceBadges = [];
  if (!sprint.sprints?.length) confidenceBadges.push('Missing sprint fields');
  if (!storyPoints.totalStoryPoints) confidenceBadges.push('No story points');
  if (!confidenceBadges.length) confidenceBadges.push('Data complete');

  const handleKpiNavigation = (targetId) => {
    setIsFlowPanelOpen(true);
    setTimeout(() => {
      const target = document.getElementById(targetId);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const openFlowFilters = () => {
    setIsFlowPanelOpen(true);
    window.setTimeout(() => {
      const target = flowFiltersRef.current || document.getElementById('flow-health-panel');
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  };

  useEffect(() => {
    const header = document.querySelector('.app-header');
    const updateStickyTop = () => {
      if (!header) return;
      const headerStyle = window.getComputedStyle(header);
      const marginBottom = Number(headerStyle.marginBottom.replace('px', '')) || 0;
      const nextTop = header.offsetHeight + marginBottom + 4;
      setStickyTop(nextTop);
    };

    updateStickyTop();

    const resizeObserver = new ResizeObserver(updateStickyTop);
    if (header) resizeObserver.observe(header);
    window.addEventListener('resize', updateStickyTop);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateStickyTop);
    };
  }, []);

  useEffect(() => {
    if (!isFlowPanelOpen) {
      setHideStickyFilter(false);
      return undefined;
    }

    const target = flowFiltersRef.current;
    if (!target) {
      setHideStickyFilter(false);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setHideStickyFilter(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: `-${stickyTop || 120}px 0px 0px 0px`,
        threshold: 0.05,
      }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [isFlowPanelOpen, stickyTop]);

  useEffect(() => {
    setFlowItemVisibleCount(100);
  }, [keyFilter, summaryFilter, statusFilter, sprintFilter, assigneeFilter, leadMaxFilter, cycleMaxFilter, openAgeMaxFilter, healthFilter, reasonFilter, labelFilter]);

  const openDetailPanel = (title, description, items = []) => {
    setDetailPanel({ title, description, items });
  };

  const detailPanelRef = useRef(null);

  useEffect(() => {
    if (!detailPanel) return;

    const node = detailPanelRef.current;
    node?.focus();

    // Simple focus trap within the modal
    const focusableSelector = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
    const focusables = node ? Array.from(node.querySelectorAll(focusableSelector)).filter((n) => n.offsetParent !== null) : [];

    const onKey = (e) => {
      if (e.key === 'Escape') {
        setDetailPanel(null);
        return;
      }
      if (e.key === 'Tab' && focusables && focusables.length) {
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [detailPanel]);

  const copyToClipboard = async (text) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setReportMessage('Copied to clipboard');
      setTimeout(() => setReportMessage(''), 1800);
    } catch (err) {
      setReportMessage('Copy failed');
      setTimeout(() => setReportMessage(''), 1800);
    }
  };

  const saveLayout = () => {
    const layoutState = {
      statusFilter,
      sprintFilter,
      assigneeFilter,
      healthFilter,
      reasonFilter,
      keyFilter,
      summaryFilter,
      labelFilter,
    };
    window.localStorage.setItem('dashboardLayout', JSON.stringify(layoutState));
    setLayoutSaved(true);
    window.setTimeout(() => setLayoutSaved(false), 2500);
  };

  const exportRiskReport = () => {
    const reportRows = flowItems.filter((item) => ['critical', 'warning'].includes(normalizeText(item.health)));
    const columns = [
      { key: 'key', label: 'Issue' },
      { key: 'summary', label: 'Summary' },
      { key: 'status', label: 'Status' },
      { key: 'assignee', label: 'Assignee' },
      { key: 'health', label: 'Health' },
      { key: 'reason', label: 'Reason' },
    ];
    const csv = csvFromRows(reportRows, columns);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'jira-risk-report.csv';
    link.click();
    URL.revokeObjectURL(url);
    setReportMessage(`Exported ${reportRows.length} high-risk items`);
    window.setTimeout(() => setReportMessage(''), 3000);
  };

  const applyQuickFilter = (type) => {
    setActiveQuickFilter(type);
    setKeyFilter('');
    setSummaryFilter('');
    setStatusFilter('all');
    setSprintFilter('all');
    setAssigneeFilter('all');
    setLeadMaxFilter('');
    setCycleMaxFilter('');
    setOpenAgeMaxFilter('');
    setHealthFilter('all');
    setReasonFilter('');
    setLabelFilter('');

    if (type === 'high-risk') {
      setHealthFilter('critical');
    }
    if (type === 'needs-review') {
      setStatusFilter('in progress');
    }
    if (type === 'blocked') {
      setReasonFilter('block');
    }
    if (type === 'sprint-today') {
      setReasonFilter('today');
    }

    openFlowFilters();
  };

  const [targetCompletion, actualCompletion] = [data.sprintTargetCompletion || '82%', `${data.completionRate || 0}%`];

  const filteredFlowItems = useMemo(() => {
    return flowItems.filter((item) => {
      const matchesKey = matchesText(item.key, keyFilter);
      const matchesSummary = matchesText(item.summary, summaryFilter);
      const matchesStatus = matchesSelect(item.status, statusFilter);
      const matchesSprint = matchesSelect(item.sprint, sprintFilter);
      const matchesAssignee = matchesSelect(item.assignee, assigneeFilter);
      const matchesLead = isWithinMaxDays(item.leadTimeDays, leadMaxFilter);
      const matchesCycle = isWithinMaxDays(item.cycleTimeDays, cycleMaxFilter);
      const matchesOpenAge = isWithinMaxDays(item.ageDays, openAgeMaxFilter);
      const matchesHealth = matchesSelect(item.health, healthFilter);
      const matchesReason = matchesText(item.reason, reasonFilter);
      const matchesLabel = !labelFilter || (item.labels || '').toLowerCase().includes(labelFilter.toLowerCase());

      return (
        matchesKey &&
        matchesSummary &&
        matchesStatus &&
        matchesSprint &&
        matchesAssignee &&
        matchesLead &&
        matchesCycle &&
        matchesOpenAge &&
        matchesHealth &&
        matchesReason &&
        matchesLabel
      );
    });
  }, [
    assigneeFilter,
    cycleMaxFilter,
    flowItems,
    healthFilter,
    keyFilter,
    labelFilter,
    leadMaxFilter,
    openAgeMaxFilter,
    reasonFilter,
    sprintFilter,
    statusFilter,
    summaryFilter,
  ]);

  const epicReadiness = useMemo(() => {
    const epics = data.epics || [];
    return (epics || [])
      .map((e) => {
        const issues = Number(e.issues || 0);
        const done = Number(e.completedIssues || 0);
        const completion = issues ? Math.round((done / issues) * 100) : 0;
        const critical = Number(e.critical || 0);
        const warning = Number(e.warning || 0);
        const risk = critical > 0 ? 'critical' : warning > 0 ? 'warning' : completion >= 80 ? 'good' : 'warning';
        return { ...e, completion, risk };
      })
      .sort((a, b) => {
        const rank = { critical: 0, warning: 1, good: 2 };
        return (rank[a.risk] - rank[b.risk]) || (a.completion - b.completion);
      });
  }, [data.epics, flowItems]);

  const smartActions = useMemo(() => {
    const acts = [];

    const criticalBlockers = flowItems.filter(
      (i) => i.health === 'critical' && normalizeText(i.reason).includes('block')
    );
    if (criticalBlockers.length)
      acts.push({ type: 'critical', icon: '🚫', navTarget: 'flow-health-panel', filterAction: 'blockers',
        title: `Unblock ${criticalBlockers.length} critical item${criticalBlockers.length > 1 ? 's' : ''}`,
        detail: `${criticalBlockers[0].key}: ${(criticalBlockers[0].summary || criticalBlockers[0].reason).slice(0, 70)}` });

    const staleActive = flowItems.filter(
      (i) => i.health === 'critical' && normalizeText(i.reason).includes('in progress over 14')
    );
    if (staleActive.length)
      acts.push({ type: 'critical', icon: '⏳', navTarget: 'flow-health-panel', filterAction: 'stale',
        title: `${staleActive.length} item${staleActive.length > 1 ? 's' : ''} stalled in progress`,
        detail: `${staleActive[0].key} has been active for ${Math.round(staleActive[0].activeAgeDays || 0)} days without resolution` });

    const capacity = data.capacity || [];
    const overloaded = capacity.filter((c) => c.loadShare > 35);
    if (overloaded.length && capacity.length > 2)
      acts.push({ type: 'warning', icon: '⚖️', navTarget: 'section-ownership', filterAction: null,
        title: 'Team capacity imbalance detected',
        detail: `${overloaded[0].assignee} carries ${overloaded[0].loadShare}% of all work — consider redistributing` });

    const orphanCount = flowItems.filter((i) => i.isOrphan).length;
    if (orphanCount > 0)
      acts.push({ type: 'info', icon: '👻', navTarget: 'section-attention', filterAction: null,
        title: `Link ${orphanCount} orphan item${orphanCount > 1 ? 's' : ''} to epics`,
        detail: 'Items without parent/epic reduce scope traceability and epic completion accuracy' });

    const criticalEpics = epicReadiness.filter((e) => e.risk === 'critical');
    if (criticalEpics.length)
      acts.push({ type: 'warning', icon: '🚨', navTarget: 'section-readiness', filterAction: null,
        title: `${criticalEpics.length} epic${criticalEpics.length > 1 ? 's' : ''} in critical state`,
        detail: `${criticalEpics[0].epic || 'Top epic'}: ${criticalEpics[0].completion}% complete — needs immediate attention` });

    if (data.relations?.blockedItems?.length)
      acts.push({ type: 'critical', icon: '🔗', navTarget: 'section-relations', filterAction: null,
        title: `${data.relations.blockedItems.length} item${data.relations.blockedItems.length > 1 ? 's' : ''} explicitly blocked`,
        detail: `${data.relations.blockedItems[0].key} is blocked by ${data.relations.blockedItems[0].blockedBy}` });

    return acts.slice(0, 5);
  }, [flowItems, data.capacity, data.relations, epicReadiness]);

  const handleSmartAction = (action) => {
    if (action.filterAction === 'blockers') {
      setIsFlowPanelOpen(true);
      setHealthFilter('critical');
      setReasonFilter('block');
      setActiveQuickFilter('blocked');
    } else if (action.filterAction === 'stale') {
      setIsFlowPanelOpen(true);
      setHealthFilter('critical');
    }
    setTimeout(() => {
      document.getElementById(action.navTarget)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
  };

  const activeFilterCount =
    [keyFilter, summaryFilter, reasonFilter, labelFilter].filter((s) => s !== '').length +
    [statusFilter, sprintFilter, assigneeFilter, healthFilter].filter((s) => s !== 'all').length +
    [leadMaxFilter, cycleMaxFilter, openAgeMaxFilter].filter((s) => s !== '').length;

  const visibleFlowItems = filteredFlowItems.slice(0, flowItemVisibleCount);

  return (
  <main className="dashboard-page" aria-hidden={detailPanel ? true : undefined}>
      <div className="dashboard-top">
        <div>
          <h2>Delivery Health Analysis</h2>
          <p>Flow, sprint, kanban, capacity, story point, and epic performance from the uploaded Jira export.</p>
        </div>
        <div className="dashboard-top-right">
          {data.healthScore !== undefined && (
            <HealthScoreGauge score={data.healthScore} onClick={() => setShowManagerReport(true)} />
          )}
          <button className="secondary" onClick={onReset}>Upload new file</button>
        </div>
      </div>

      <section id="dashboard-summary" className="dashboard-summary-bar">
        <div className="floating-help">
          <HelpButton topic="summary" label="Help for summary bar" onOpenHelp={onOpenHelp} />
        </div>
        <div className="summary-pill-row">
          <div className={`summary-pill summary-pill-${healthStatus.replace(/\s+/g, '-').toLowerCase()}`}>
            <strong>{healthStatus}</strong>
            <span>{healthMessage}</span>
          </div>
          <div className="summary-compare">
            <strong>Target vs Actual</strong>
            <span>{targetCompletion} target / {actualCompletion} actual</span>
          </div>
        </div>
        <div className="summary-change-grid">
          <div className="summary-change-card">
            <span>Completion</span>
            <strong>{summaryDelta.completion}</strong>
          </div>
          <div className="summary-change-card">
            <span>Risk</span>
            <strong>{summaryDelta.risk}</strong>
          </div>
          <div className="summary-change-card">
            <span>Cycle time</span>
            <strong>{summaryDelta.cycleTime}</strong>
          </div>
          {data.prediction && !data.prediction.complete && data.prediction.daysRemaining !== null && (
            <div className="summary-change-card prediction-card">
              <span>Est. completion</span>
              <strong>~{data.prediction.daysRemaining}d</strong>
              <small>{data.prediction.predictedDate}</small>
            </div>
          )}
          {data.prediction?.complete && (
            <div className="summary-change-card prediction-card complete">
              <span>Completion</span>
              <strong>Done ✅</strong>
              <small>100% complete</small>
            </div>
          )}
        </div>
        <div className="summary-actions">
          <button type="button" className="secondary report-trigger-btn" onClick={() => setShowManagerReport(true)}>
            📋 Quick Overview
          </button>
          <button type="button" className="secondary" onClick={() => openDetailPanel('High-risk review', 'Review the highest-risk items and assign mitigation tasks.', topBlockers)}>
            Review high-risk items
          </button>
          <button type="button" className="secondary" onClick={exportRiskReport}>
            Export risk report
          </button>
          <button type="button" className="secondary" onClick={saveLayout}>
            Save layout view
          </button>
          <div className="summary-status-message">{reportMessage || (layoutSaved ? 'Layout saved' : '')}</div>
        </div>
        <div className="summary-badges">
          {confidenceBadges.map((badge) => (
            <span key={badge} className="confidence-badge">{badge}</span>
          ))}
        </div>
      </section>

      <section
        className={`sticky-filter-bar ${hideStickyFilter ? 'hidden' : ''}`}
        aria-label="Quick filters"
        style={stickyTop ? { top: `${stickyTop}px` } : undefined}
      >
        <HelpButton topic="quickFilters" label="Help for quick filters" onOpenHelp={onOpenHelp} />
        <div className="filter-left">
          <button type="button" className={`quick-filter-button ${activeQuickFilter === 'all' ? 'active' : ''}`} onClick={() => applyQuickFilter('all')}>All</button>
          <button type="button" className={`quick-filter-button ${activeQuickFilter === 'high-risk' ? 'active' : ''}`} onClick={() => applyQuickFilter('high-risk')}>High risk</button>
          <button type="button" className={`quick-filter-button ${activeQuickFilter === 'blocked' ? 'active' : ''}`} onClick={() => applyQuickFilter('blocked')}>Blocked</button>
          <button type="button" className={`quick-filter-button ${activeQuickFilter === 'needs-review' ? 'active' : ''}`} onClick={() => applyQuickFilter('needs-review')}>Needs review</button>
          <button type="button" className={`quick-filter-button ${activeQuickFilter === 'sprint-today' ? 'active' : ''}`} onClick={() => applyQuickFilter('sprint-today')}>Sprint today</button>
        </div>
        <div className="filter-right">
          {activeFilterCount > 0 && (
            <span className="filter-count-badge">{activeFilterCount} active</span>
          )}
          <button
            type="button"
            className="quick-filter-button ghost"
            onClick={() => {
              applyQuickFilter('all');
              setReportMessage('Filters cleared');
              setTimeout(() => setReportMessage(''), 1400);
            }}
          >
            Clear
          </button>
          <button type="button" className="quick-filter-button active" onClick={openFlowFilters}>Show filters</button>
        </div>
      </section>

      <SmartActions actions={smartActions} onAction={handleSmartAction} />

      <section className="dashboard-splash">
        <div className="splash-copy">
          <span>Explore in color</span>
          <h3>Discover the story behind every Jira export</h3>
          <p>Fast insight cards, vivid charts, and ordered panels guide you from <span className="keyword">completion</span> and <span className="keyword">risk</span> to a confident delivery narrative.</p>
        </div>
        <div className="splash-pill-grid">
          <div className="splash-pill accent-red">High-risk work hot spots</div>
          <div className="splash-pill accent-teal">Cycle time pressure</div>
          <div className="splash-pill accent-amber">Open age and orphans</div>
        </div>
      </section>

      <section id="section-attention" className="issue-highlight-strip">
        <div className="issue-highlight-card card-blockers">
          <div className="floating-help">
            <HelpButton topic="attention" label="Help for blockers" onOpenHelp={onOpenHelp} />
          </div>
          <div className="issue-highlight-heading">
            <span>Blockers</span>
            <strong>{topBlockers.length}</strong>
          </div>
          <h3>Top blockers</h3>
          {topBlockers.length ? (
            <ul>
              {topBlockers.map((item) => (
                <li key={item.key}>
                  <span className="issue-key">{item.key}</span>
                  <span className="issue-title">{item.summary || item.reason}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-highlight">No blockers found.</p>
          )}
        </div>
        <div className="issue-highlight-card card-overdue">
          <div className="floating-help">
            <HelpButton topic="attention" label="Help for overdue items" onOpenHelp={onOpenHelp} />
          </div>
          <div className="issue-highlight-heading">
            <span>Schedule</span>
            <strong>{topOverdue.length}</strong>
          </div>
          <h3>Top overdue</h3>
          {topOverdue.length ? (
            <ul>
              {topOverdue.map((item) => (
                <li key={item.key}>
                  <span className="issue-key">{item.key}</span>
                  <span className="issue-title">{item.summary || item.status}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-highlight">No overdue work detected.</p>
          )}
        </div>
        <div className="issue-highlight-card card-orphans">
          <div className="floating-help">
            <HelpButton topic="ownership" label="Help for orphan items" onOpenHelp={onOpenHelp} />
          </div>
          <div className="issue-highlight-heading">
            <span>Ownership</span>
            <strong>{topOrphans.length}</strong>
          </div>
          <h3>Top orphans</h3>
          {topOrphans.length ? (
            <ul>
              {topOrphans.map((item) => (
                <li key={item.key}>
                  <span className="issue-key">{item.key}</span>
                  <span className="issue-title">{item.summary || item.epic || 'No epic'}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-highlight">No orphan items.</p>
          )}
        </div>
      </section>

      <section id="section-overview" className="dashboard-section section-overview">
        <SectionHeader
          icon="🎯"
          kicker="Overview"
          title="Executive delivery snapshot"
          detail="The cards summarize delivery completion, timing, scope, active load, and current health pressure."
          helpTopic="kpis"
          onOpenHelp={onOpenHelp}
        />
        <div className="kpi-grid">
          <KpiCard
            label="Completion"
            value={`${data.completionRate}%`}
            detail={`${data.doneIssues} of ${data.totalIssues} issues done`}
            accent="green"
            onClick={() => handleKpiNavigation('flow-health-panel')}
            tooltip="Percent of issues moved to Done. Target bands show healthy vs at-risk ranges."
            thresholds={{ good: 80, warning: 60, critical: 0, max: 100, unit: '%' }}
          />
          <KpiCard
            label="Health Alerts"
            value={(flow.critical || 0) + (flow.warning || 0)}
            detail={`${flow.critical || 0} critical, ${flow.warning || 0} warning`}
            accent="red"
            onClick={() => handleKpiNavigation('flow-health-panel')}
          />
          <KpiCard
            label="Active Work"
            value={data.activeIssues || 0}
            detail="Items in progress, review, QA, or UAT"
            accent="amber"
            onClick={() => handleKpiNavigation('capacity-section')}
          />
          <KpiCard
            label="Lead Time"
            value={`${flow.averageLeadTimeDays || 0}d`}
            detail={`${flow.leadTimeSampleSize || 0} completed items`}
            accent="blue"
            onClick={() => handleKpiNavigation('flow-health-panel')}
            tooltip="Average time from first touch to completion. Shorter is better."
            thresholds={{ good: 3, warning: 7, critical: 21, max: 30, unit: 'd' }}
          />
          <KpiCard
            label="Cycle Time"
            value={`${flow.averageCycleTimeDays || 0}d`}
            detail={`${flow.cycleTimeSampleSize || 0} items with start dates`}
            accent="teal"
            onClick={() => handleKpiNavigation('flow-health-panel')}
            tooltip="Average active cycle time — from start to done. Watch for outliers."
            thresholds={{ good: 2, warning: 5, critical: 14, max: 20, unit: 'd' }}
          />
          <KpiCard
            label="Story Points"
            value={storyPoints.totalStoryPoints || 0}
            detail={`${storyPoints.pointCompletionRate || 0}% complete`}
            accent="violet"
            onClick={() => handleKpiNavigation('capacity-section')}
          />
        </div>
      </section>

      <section id="section-visuals" className="dashboard-section section-visuals">
        <SectionHeader
          icon="📊"
          kicker="Visual intelligence"
          title="Charts that explain the result"
          detail="Use these charts to see health mix, quarter movement, sprint comparison, kanban distribution, and orphan scope."
          helpTopic="visuals"
          onOpenHelp={onOpenHelp}
        />
        <div className="visual-grid hero-visual-grid">
          <HealthDonut flow={flow} />
          <QuarterChart quarters={quarters} />
          <section className="dashboard-panel chart-panel panel-work-state">
            <PanelTitle helpTopic="visuals" onOpenHelp={onOpenHelp}>Work State Distribution</PanelTitle>
            <WorkStateChart rows={flowItems} />
          </section>
        </div>

        <div className="visual-grid">
          <section className="dashboard-panel chart-panel panel-kanban">
            <PanelTitle helpTopic="kanban" onOpenHelp={onOpenHelp}>Kanban Distribution</PanelTitle>
            <CompactBarChart rows={kanban.byStatus?.slice(0, 6)} emptyMessage="No status data available." />
          </section>
          <section className="dashboard-panel chart-panel panel-sprint">
            <PanelTitle helpTopic="sprint" onOpenHelp={onOpenHelp}>Sprint Comparison</PanelTitle>
            <SprintCompareChart sprints={sprint.sprints} />
          </section>
          <section className="dashboard-panel chart-panel panel-orphans">
            <PanelTitle helpTopic="ownership" onOpenHelp={onOpenHelp}>Orphan Items</PanelTitle>
            <div className="orphan-summary">
              <strong>{flowItems.filter((item) => item.isOrphan).length}</strong>
              <span>items without epic or parent</span>
            </div>
          </section>
        </div>
      </section>

      <section id="section-ratios" className="dashboard-section section-ratios">
        <SectionHeader
          icon="💠"
          kicker="Ratios"
          title="Delivery composition at a glance"
          detail="One ring — every issue accounted for: done, in-progress, at-risk, critical, and backlog."
          helpTopic="ratios"
          onOpenHelp={onOpenHelp}
        />
        <DeliveryCircle
          flowItems={flowItems}
          data={data}
          flow={flow}
          storyPoints={storyPoints}
          orphanItems={orphanItems}
          totalIssues={totalIssues}
          onOpenHelp={onOpenHelp}
          helpTopic="ratios"
        />
      </section>

      <section id="section-delivery-controls" className="dashboard-section section-delivery">
        <SectionHeader
          icon="🌊"
          kicker="Delivery controls"
          title="Flow, scope, and risk readout"
          detail="These panels explain whether delivery speed, points, and risk conditions support the project result."
          helpTopic="delivery"
          onOpenHelp={onOpenHelp}
        />
        <div className="analysis-grid">
          <section className="dashboard-panel panel-flow">
            <PanelTitle helpTopic="delivery" onOpenHelp={onOpenHelp}>Flow Efficiency</PanelTitle>
            <div className="metric-list">
              <div>
                <span>Average lead time</span>
                <strong>{flow.averageLeadTimeDays || 0} days</strong>
              </div>
              <div>
                <span>Average cycle time</span>
                <strong>{flow.averageCycleTimeDays || 0} days</strong>
              </div>
              <div>
                <span>Completed sample</span>
                <strong>{flow.leadTimeSampleSize || 0} issues</strong>
              </div>
              <div>
                <span>Critical items</span>
                <strong>{flow.critical || 0}</strong>
              </div>
            </div>
          </section>

          <section className="dashboard-panel panel-points">
            <PanelTitle helpTopic="delivery" onOpenHelp={onOpenHelp}>Story Point Delivery</PanelTitle>
            <div className="metric-list">
              <div>
                <span>Completed points</span>
                <strong>{storyPoints.completedStoryPoints || 0}</strong>
              </div>
              <div>
                <span>Remaining points</span>
                <strong>{storyPoints.remainingStoryPoints || 0}</strong>
              </div>
              <div>
                <span>Point completion</span>
                <strong>{storyPoints.pointCompletionRate || 0}%</strong>
              </div>
            </div>
            <ProgressBar value={storyPoints.pointCompletionRate || 0} />
          </section>

          <section className="dashboard-panel panel-risk">
            <PanelTitle helpTopic="attention" onOpenHelp={onOpenHelp}>Risk Readout</PanelTitle>
            <div className="metric-list">
              <div>
                <span>Blocked</span>
                <strong>{risk.blockedIssues || 0}</strong>
              </div>
              <div>
                <span>Overdue</span>
                <strong>{risk.overdueIssues || 0}</strong>
              </div>
              <div>
                <span>High priority open</span>
                <strong>{risk.highPriorityOpenIssues || 0}</strong>
              </div>
            </div>
          </section>
        </div>
      </section>

      <section id="section-quarters" className="dashboard-panel table-section panel-quarter">
        <PanelTitle helpTopic="quarters" onOpenHelp={onOpenHelp}>Quarter Statistics</PanelTitle>
        <MetricTable
          columns={[
            { key: 'quarter', label: 'Quarter' },
            { key: 'issues', label: 'Issues' },
            { key: 'doneIssues', label: 'Done' },
            { key: 'activeIssues', label: 'Active' },
            { key: 'completionRate', label: 'Completion', render: (row) => `${row.completionRate}%` },
            { key: 'averageLeadTimeDays', label: 'Lead', render: (row) => formatDays(row.averageLeadTimeDays) },
            { key: 'averageCycleTimeDays', label: 'Cycle', render: (row) => formatDays(row.averageCycleTimeDays) },
            { key: 'critical', label: 'Critical' },
            { key: 'warning', label: 'Warning' },
            { key: 'storyPoints', label: 'Points' },
            {
              key: 'statusBreakdown',
              label: 'Top Status',
              render: (row) => (row.statusBreakdown || []).map((status) => `${status.name}: ${status.count}`).join(', '),
            },
          ]}
          rows={quarters}
          emptyMessage="No date data found to split work by quarter."
        />
      </section>

      <section id="section-kanban" className="dashboard-panel table-section panel-kanban-detail">
        <PanelTitle helpTopic="kanban" onOpenHelp={onOpenHelp}>Kanban Status Health</PanelTitle>
        <DistributionDonut title="Kanban Share" rows={kanban.byStatus?.slice(0, 6)} emptyMessage="No status data found." />
        <CompactBarChart rows={kanban.byStatus?.slice(0, 8)} emptyMessage="No status data found." />
        <MetricTable
          columns={[
            { key: 'name', label: 'Status' },
            { key: 'count', label: 'Issues' },
            { key: 'done', label: 'Done' },
            { key: 'averageLeadTimeDays', label: 'Lead' , render: (row) => formatDays(row.averageLeadTimeDays) },
            { key: 'averageCycleTimeDays', label: 'Cycle', render: (row) => formatDays(row.averageCycleTimeDays) },
            { key: 'critical', label: 'Critical' },
            { key: 'warning', label: 'Warning' },
            { key: 'good', label: 'Good' },
            { key: 'storyPoints', label: 'Points' },
          ]}
          rows={kanban.byStatus}
          emptyMessage="No status data found."
        />
      </section>

      <section id="section-sprint" className="dashboard-panel table-section panel-sprint-detail">
        <PanelTitle helpTopic="sprint" onOpenHelp={onOpenHelp}>Sprint Status</PanelTitle>
        <DistributionDonut title="Sprint Share" rows={sprint.sprints?.slice(0, 6)} labelKey="name" valueKey="issues" emptyMessage="No sprint data found." />
        <MetricTable
          columns={[
            { key: 'name', label: 'Sprint' },
            { key: 'issues', label: 'Issues' },
            { key: 'completedIssues', label: 'Done' },
            { key: 'completedPoints', label: 'Done Points' },
            { key: 'averageLeadTimeDays', label: 'Lead', render: (row) => formatDays(row.averageLeadTimeDays) },
            { key: 'averageCycleTimeDays', label: 'Cycle', render: (row) => formatDays(row.averageCycleTimeDays) },
            { key: 'critical', label: 'Critical' },
            { key: 'warning', label: 'Warning' },
            { key: 'completionRate', label: 'Completion', render: (row) => `${row.completionRate}%` },
          ]}
          rows={sprint.sprints}
          emptyMessage="No sprint field was found in this Jira export."
        />
      </section>

      <section id="section-ownership" className="dashboard-section section-ownership">
        <SectionHeader
          icon="👥"
          kicker="Ownership"
          title="Capacity and epic performance"
          detail="Understand who carries the work and which epic or parent groups are moving cleanly."
          helpTopic="ownership"
          onOpenHelp={onOpenHelp}
        />
        <div className="split-panels">
        <section id="capacity-section" className="dashboard-panel panel-capacity">
          <PanelTitle helpTopic="ownership" onOpenHelp={onOpenHelp}>Capacity By Assignee</PanelTitle>
          <CompactBarChart rows={data.capacity?.slice(0, 8)} labelKey="assignee" valueKey="issues" emptyMessage="No assignee data found." />
          <MetricTable
            columns={[
              { key: 'assignee', label: 'Assignee' },
              { key: 'issues', label: 'Issues' },
              { key: 'activeIssues', label: 'Active' },
              { key: 'storyPoints', label: 'Points' },
              { key: 'loadShare', label: 'Load', render: (row) => `${row.loadShare}%` },
            ]}
            rows={data.capacity}
            emptyMessage="No assignee data found."
          />
        </section>

        <section className="dashboard-panel panel-epic">
          <PanelTitle helpTopic="ownership" onOpenHelp={onOpenHelp}>Epic / Parent Performance</PanelTitle>
          <MetricTable
            columns={[
              { key: 'epic', label: 'Epic or Parent' },
              { key: 'issues', label: 'Issues' },
              { key: 'completedIssues', label: 'Done' },
              { key: 'averageLeadTimeDays', label: 'Lead', render: (row) => formatDays(row.averageLeadTimeDays) },
              { key: 'averageCycleTimeDays', label: 'Cycle', render: (row) => formatDays(row.averageCycleTimeDays) },
              { key: 'critical', label: 'Critical' },
              { key: 'warning', label: 'Warning' },
              { key: 'progress', label: 'Progress', render: (row) => <ProgressCell value={row.progress} /> },
            ]}
            rows={data.epics}
            emptyMessage="No epic or parent data found."
          />
        </section>
        </div>
      </section>

      <section id="section-labels" className="dashboard-section section-labels">
        <SectionHeader
          icon="🏷️"
          kicker="Classification"
          title="Labels, types & project breakdown"
          detail="How labels, issue types, and projects distribute across your delivery — volume, completion rate, and health per category."
          helpTopic="labels"
          onOpenHelp={onOpenHelp}
        />

        <div className="split-panels">
          <section className="dashboard-panel panel-labels">
            <PanelTitle helpTopic="labels" onOpenHelp={onOpenHelp}>Label Distribution</PanelTitle>
            {data.labels?.labelStats?.filter((l) => l.label !== '(unlabeled)').length ? (
              <>
                <div className="label-coverage-row">
                  <span className="label-pill">{data.labels.uniqueLabels} unique labels</span>
                  <span className="label-pill label-pill-muted">{data.labels.totalUnlabeled} unlabeled</span>
                </div>
                <CompactBarChart
                  rows={data.labels.labelStats.filter((l) => l.label !== '(unlabeled)').slice(0, 8)}
                  labelKey="label"
                  valueKey="count"
                  emptyMessage="No labels found."
                />
              </>
            ) : (
              <p className="muted">No label data found in this export. Add labels to Jira issues to see this breakdown.</p>
            )}
          </section>

          <section className="dashboard-panel panel-type">
            <PanelTitle helpTopic="labels" onOpenHelp={onOpenHelp}>Issue Type Breakdown</PanelTitle>
            {data.types?.length ? (
              <>
                <DistributionDonut title="Type Share" rows={data.types} labelKey="type" valueKey="count" emptyMessage="No type data." />
                <CompactBarChart rows={data.types} labelKey="type" valueKey="count" emptyMessage="No type data." />
              </>
            ) : (
              <p className="muted">No issue type data found.</p>
            )}
          </section>
        </div>

        {data.labels?.labelStats?.filter((l) => l.label !== '(unlabeled)').length > 0 && (
          <section className="dashboard-panel panel-label-health">
            <PanelTitle helpTopic="labels" onOpenHelp={onOpenHelp}>Label Health & Completion</PanelTitle>
            <MetricTable
              columns={[
                { key: 'label', label: 'Label' },
                { key: 'count', label: 'Issues' },
                { key: 'done', label: 'Done' },
                { key: 'completionRate', label: 'Completion', render: (row) => (
                  <div className="table-progress">
                    <ProgressBar value={row.completionRate} />
                    <span>{row.completionRate}%</span>
                  </div>
                )},
                { key: 'critical', label: 'Critical' },
                { key: 'warning', label: 'Warning' },
                { key: 'storyPoints', label: 'Points' },
                { key: 'averageLeadTimeDays', label: 'Avg Lead', render: (row) => formatDays(row.averageLeadTimeDays) },
                { key: 'averageCycleTimeDays', label: 'Avg Cycle', render: (row) => formatDays(row.averageCycleTimeDays) },
              ]}
              rows={data.labels.labelStats.filter((l) => l.label !== '(unlabeled)')}
              emptyMessage="No label data found."
            />
          </section>
        )}

        {(data.parents?.length > 0 || data.projects?.length > 1) && (
          <div className="split-panels">
            {data.parents?.length > 0 && (
              <section className="dashboard-panel panel-parents">
                <PanelTitle helpTopic="labels" onOpenHelp={onOpenHelp}>Parent Key Breakdown</PanelTitle>
                <CompactBarChart rows={data.parents.slice(0, 8)} labelKey="parent" valueKey="count" emptyMessage="No parent data." />
                <MetricTable
                  columns={[
                    { key: 'parent', label: 'Parent' },
                    { key: 'count', label: 'Issues' },
                    { key: 'done', label: 'Done' },
                    { key: 'completionRate', label: 'Completion', render: (row) => `${row.completionRate}%` },
                    { key: 'critical', label: 'Critical' },
                    { key: 'warning', label: 'Warning' },
                    { key: 'storyPoints', label: 'Points' },
                  ]}
                  rows={data.parents}
                  emptyMessage="No parent key data found."
                />
              </section>
            )}
            {data.projects?.length > 1 && (
              <section className="dashboard-panel panel-projects">
                <PanelTitle helpTopic="labels" onOpenHelp={onOpenHelp}>Project Breakdown</PanelTitle>
                <DistributionDonut title="Project Share" rows={data.projects} labelKey="project" valueKey="count" emptyMessage="No project data." />
                <MetricTable
                  columns={[
                    { key: 'project', label: 'Project' },
                    { key: 'count', label: 'Issues' },
                    { key: 'done', label: 'Done' },
                    { key: 'completionRate', label: 'Completion', render: (row) => `${row.completionRate}%` },
                    { key: 'critical', label: 'Critical' },
                    { key: 'warning', label: 'Warning' },
                  ]}
                  rows={data.projects}
                  emptyMessage="No project data found."
                />
              </section>
            )}
          </div>
        )}
      </section>

      <section id="section-relations" className="dashboard-section section-relations">
        <SectionHeader
          icon="🔗"
          kicker="Relations"
          title="Linked issues & dependency map"
          detail={data.relations?.hasLinks
            ? `${data.relations.totalLinks} link relationship${data.relations.totalLinks !== 1 ? 's' : ''} across ${data.relations.itemsWithLinks} item${data.relations.itemsWithLinks !== 1 ? 's' : ''} — ${data.relations.linkTypes} link type${data.relations.linkTypes !== 1 ? 's' : ''} detected.`
            : 'Linked issue columns were not found in this export. Re-export from Jira with linked issue columns to see dependency data here.'
          }
          helpTopic="relations"
          onOpenHelp={onOpenHelp}
        />

        {data.relations?.hasLinks ? (
          <>
            <div className="split-panels">
              <section className="dashboard-panel panel-link-types">
                <PanelTitle helpTopic="relations" onOpenHelp={onOpenHelp}>Link Type Distribution</PanelTitle>
                <DistributionDonut title="Link Types" rows={data.relations.linkStats} labelKey="type" valueKey="count" emptyMessage="No link types found." />
                <CompactBarChart rows={data.relations.linkStats} labelKey="type" valueKey="count" emptyMessage="No link types found." />
              </section>

              <section className="dashboard-panel panel-most-linked">
                <PanelTitle helpTopic="relations" onOpenHelp={onOpenHelp}>Most Connected Items</PanelTitle>
                <MetricTable
                  columns={[
                    { key: 'key', label: 'Key' },
                    { key: 'summary', label: 'Summary' },
                    { key: 'linkCount', label: 'Links' },
                    { key: 'linkTypes', label: 'Types' },
                    { key: 'status', label: 'Status' },
                  ]}
                  rows={data.relations.mostLinked}
                  emptyMessage="No linked items found."
                />
              </section>
            </div>

            {data.relations.blockedItems?.length > 0 && (
              <section className="dashboard-panel panel-blocked-links">
                <PanelTitle helpTopic="relations" onOpenHelp={onOpenHelp}>Items Explicitly Blocked by Others</PanelTitle>
                <MetricTable
                  columns={[
                    { key: 'key', label: 'Blocked Item' },
                    { key: 'summary', label: 'Summary' },
                    { key: 'status', label: 'Status' },
                    { key: 'blockedBy', label: 'Blocked By' },
                    { key: 'blockCount', label: 'Blockers' },
                  ]}
                  rows={data.relations.blockedItems}
                  emptyMessage="No explicitly blocked items."
                />
              </section>
            )}
          </>
        ) : (
          <div className="relations-empty">
            <span className="relations-empty-icon" aria-hidden="true">🔗</span>
            <h3 className="relations-empty-title">No linked issues found in this export</h3>
            <p className="relations-empty-body">
              Jira linked-issue columns were not detected. To see blockers, dependencies, and related items here, re-export from Jira with link columns included.
            </p>
            <ol className="relations-empty-steps">
              <li>In Jira, open your board or project and go to <strong>Export → Excel / CSV</strong></li>
              <li>In the export dialog, select <strong>all columns</strong> — or manually check <strong>Linked Issues</strong></li>
              <li>Re-upload the new file to this dashboard</li>
            </ol>
            <p className="relations-empty-note">
              Expected column names: <code>Inward issue link (Blocks)</code> · <code>Outward issue link (Blocks)</code> · <code>Inward issue link (Relates)</code>
            </p>
          </div>
        )}
      </section>

      <section className="dashboard-panel panel-justification">
        <PanelTitle helpTopic="justification" onOpenHelp={onOpenHelp}>Justification</PanelTitle>
        <ul className="insight-list">
          {(data.insights || []).map((insight) => (
            <li key={insight}>{insight}</li>
          ))}
        </ul>
      </section>

      <section id="section-readiness" className="dashboard-section section-delivery">
        <SectionHeader
          icon="🚀"
          kicker="Readiness"
          title="Epic health &amp; release readiness"
          detail="Top at-risk epics and dependency callouts to surface blockers before release."
          helpTopic="readiness"
          onOpenHelp={onOpenHelp}
        />

        <div className="split-panels">
          <section className="dashboard-panel panel-epic-readiness">
            <PanelTitle helpTopic="readiness" onOpenHelp={onOpenHelp}>Top at-risk epics</PanelTitle>
            {(epicReadiness.filter((e) => e.risk === 'critical' || e.completion < 60).length) ? (
              <ul className="insight-list">
                {epicReadiness.filter((e) => e.risk === 'critical' || e.completion < 60).slice(0, 8).map((e) => (
                  <li key={e.epic || e.id}>
                    <strong>{e.epic || e.id}</strong> — {e.completion}% complete — <span className={`health-badge ${e.risk}`}>{e.risk}</span>
                    <div style={{ marginTop: 8 }}>
                      <button type="button" className="secondary" onClick={() => openDetailPanel(`Epic ${e.epic || e.id}`, 'Issues in this epic', flowItems.filter((i) => (i.epic || i.parent) === (e.epic || e.id)))}>
                        View items
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No at-risk epics detected.</p>
            )}
          </section>

          <section className="dashboard-panel panel-dependency-callouts">
            <PanelTitle helpTopic="readiness" onOpenHelp={onOpenHelp}>Dependency callouts</PanelTitle>
            <p className="muted">Items referencing other epics or external blockers.</p>
            {(flowItems.filter((i) => i.dependsOn || i.externalEpic).length) ? (
              <ul className="insight-list">
                {flowItems.filter((i) => i.dependsOn || i.externalEpic).slice(0, 10).map((it) => (
                  <li key={it.key || it.id}>{it.key || it.id}: {it.summary} {it.dependsOn ? `— depends on ${it.dependsOn}` : ''}{it.externalEpic ? ` — external epic ${it.externalEpic}` : ''}</li>
                ))}
              </ul>
            ) : (
              <p>No dependency callouts detected.</p>
            )}
          </section>
        </div>
      </section>

      {detailPanel && (
        <section className="detail-modal-backdrop" onClick={() => setDetailPanel(null)}>
          <div
            className="detail-panel"
            role="dialog"
            aria-modal="true"
            ref={detailPanelRef}
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="detail-panel-header">
              <div>
                <span className="help-eyebrow">Detail</span>
                <h3>{detailPanel.title}</h3>
                <p>{detailPanel.description}</p>
              </div>
              <button type="button" className="help-close" onClick={() => setDetailPanel(null)}>
                Close
              </button>
            </header>
            <div className="detail-list">
              {detailPanel.items.length ? (
                <ul>
                  {detailPanel.items.map((item) => (
                    <li key={item.key || item.id || item.summary}>
                      <div style={{display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center'}}>
                        <div>
                          <strong>{item.key || item.id}</strong>
                          <div style={{color: '#475569'}}>{item.summary || item.status || item.reason}</div>
                        </div>
                        <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                          {item.url || item.jiraUrl ? (
                            <a href={item.url || item.jiraUrl} target="_blank" rel="noopener noreferrer" className="secondary">
                              Open
                            </a>
                          ) : null}
                          <button type="button" className="secondary" onClick={() => copyToClipboard(item.key || item.id || item.summary)}>
                            Copy
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No items are available for this detail view.</p>
              )}
            </div>
          </div>
        </section>
      )}

      <section id="flow-health-panel" className={`dashboard-panel collapsible-panel panel-flow-health ${isFlowPanelOpen ? 'open' : ''}`}>
        <div className="flow-panel-help">
          <HelpButton topic="flow" label="Help for Story / Task Flow Health" onOpenHelp={onOpenHelp} />
        </div>
        <button
          className="collapsible-trigger"
          type="button"
          onClick={() => setIsFlowPanelOpen((isOpen) => !isOpen)}
          aria-expanded={isFlowPanelOpen}
        >
          <span className="trigger-copy">
            <span className="trigger-title">Story / Task Flow Health</span>
            <span className="trigger-hint">
              {isFlowPanelOpen ? 'Close expanded view and return to dashboard' : 'Open filters, health graph, and matching items'}
            </span>
          </span>
          <span className="trigger-meta">
            <strong>{filteredFlowItems.length} of {flowItems.length} items</strong>
            <span className="trigger-icon" aria-hidden="true">{isFlowPanelOpen ? 'Close' : 'Open'}</span>
          </span>
        </button>

        {isFlowPanelOpen && (
          <>
            <p className="muted flow-filter-note">
              The graph and table below show only items that match the selected filters.
            </p>

            <div className="flow-filters" ref={flowFiltersRef}>
          <label>
            Key
            <input
              type="search"
              value={keyFilter}
              onChange={(event) => setKeyFilter(event.target.value)}
              placeholder="AJ-24"
            />
          </label>
          <label>
            Story / Task
            <input
              type="search"
              value={summaryFilter}
              onChange={(event) => setSummaryFilter(event.target.value)}
              placeholder="Summary text"
            />
          </label>
          <label>
            Status
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </label>
          <label>
            Sprint
            <select value={sprintFilter} onChange={(event) => setSprintFilter(event.target.value)}>
              <option value="all">All sprints</option>
              {sprintOptions.map((sprintName) => (
                <option key={sprintName} value={sprintName}>{sprintName}</option>
              ))}
            </select>
          </label>
          <label>
            Assignee
            <select value={assigneeFilter} onChange={(event) => setAssigneeFilter(event.target.value)}>
              <option value="all">All assignees</option>
              {assigneeOptions.map((assignee) => (
                <option key={assignee} value={assignee}>{assignee}</option>
              ))}
            </select>
          </label>
          <label>
            {'Lead <='}
            <input
              type="number"
              min="0"
              value={leadMaxFilter}
              onChange={(event) => setLeadMaxFilter(event.target.value)}
              placeholder="Days"
            />
          </label>
          <label>
            {'Cycle <='}
            <input
              type="number"
              min="0"
              value={cycleMaxFilter}
              onChange={(event) => setCycleMaxFilter(event.target.value)}
              placeholder="Days"
            />
          </label>
          <label>
            {'Open Age <='}
            <input
              type="number"
              min="0"
              value={openAgeMaxFilter}
              onChange={(event) => setOpenAgeMaxFilter(event.target.value)}
              placeholder="Days"
            />
          </label>
          <label>
            Health
            <select value={healthFilter} onChange={(event) => setHealthFilter(event.target.value)}>
              <option value="all">All health</option>
              {healthOptions.map((health) => (
                <option key={health} value={health}>{health}</option>
              ))}
            </select>
          </label>
          <label>
            Reason
            <input
              type="search"
              value={reasonFilter}
              onChange={(event) => setReasonFilter(event.target.value)}
              placeholder="Blocked, overdue, cycle"
            />
          </label>
          <label>
            Labels
            <input
              type="search"
              value={labelFilter}
              onChange={(event) => setLabelFilter(event.target.value)}
              placeholder="bug-fix, mobile…"
            />
          </label>
          <button
            className="secondary ghost"
            type="button"
            onClick={() => {
              setKeyFilter('');
              setSummaryFilter('');
              setStatusFilter('all');
              setSprintFilter('all');
              setAssigneeFilter('all');
              setLeadMaxFilter('');
              setCycleMaxFilter('');
              setOpenAgeMaxFilter('');
              setHealthFilter('all');
              setReasonFilter('');
              setLabelFilter('');
              setActiveQuickFilter('all');
            }}
          >
            Reset
          </button>
            </div>

            <StatusGraph rows={filteredFlowItems} />

            <div className="filtered-summary">
              Showing <strong>{visibleFlowItems.length}</strong> of <strong>{filteredFlowItems.length}</strong> matching items from <strong>{flowItems.length}</strong> total.
              {filteredFlowItems.some((item) => item.isOrphan) && <span>{filteredFlowItems.filter((item) => item.isOrphan).length} orphan items highlighted</span>}
            </div>

            <MetricTable
          columns={[
            { key: 'key', label: 'Key' },
            { key: 'summary', label: 'Story / Task' },
            { key: 'status', label: 'Status' },
            { key: 'sprint', label: 'Sprint' },
            { key: 'epic', label: 'Epic / Parent', render: (row) => row.epic || 'Orphan' },
            { key: 'assignee', label: 'Assignee' },
            { key: 'labels', label: 'Labels' },
            { key: 'linkedTo', label: 'Linked To' },
            { key: 'leadTimeDays', label: 'Lead', render: (row) => formatDays(row.leadTimeDays) },
            { key: 'cycleTimeDays', label: 'Cycle', render: (row) => formatDays(row.cycleTimeDays) },
            { key: 'ageDays', label: 'Open Age', render: (row) => formatDays(row.ageDays) },
            { key: 'health', label: 'Health', render: (row) => <HealthBadge value={row.health} /> },
            { key: 'reason', label: 'Reason' },
          ]}
          rows={visibleFlowItems}
          emptyMessage="No story or task data found."
          rowClassName={(row) => (row.isOrphan ? 'orphan-row' : '')}
            />
            {filteredFlowItems.length > flowItemVisibleCount && (
              <button
                type="button"
                className="secondary load-more-button"
                onClick={() => setFlowItemVisibleCount((c) => c + 100)}
              >
                Show {Math.min(100, filteredFlowItems.length - flowItemVisibleCount)} more
                <span className="muted"> — {filteredFlowItems.length - flowItemVisibleCount} remaining</span>
              </button>
            )}
          </>
        )}
      </section>

      {showManagerReport && (
        <ManagerReport
          data={data}
          flowItems={flowItems}
          epicReadiness={epicReadiness}
          healthStatus={healthStatus}
          riskItems={riskItems}
          onClose={() => setShowManagerReport(false)}
          onNavigate={(sectionId, extra) => {
            setShowManagerReport(false);
            if (extra === 'openFlow') {
              setIsFlowPanelOpen(true);
              setHealthFilter('critical');
              setActiveQuickFilter('high-risk');
            }
            setTimeout(() => {
              document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 200);
          }}
        />
      )}

      <SectionNav />
      <ScrollToTopFab />
    </main>
  );
}
