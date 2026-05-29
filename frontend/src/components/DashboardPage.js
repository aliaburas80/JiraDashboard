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

function SectionHeader({ kicker, title, detail, helpTopic, onOpenHelp }) {
  return (
    <div className="section-heading">
      <div>
        <span>{kicker}</span>
        <div className="heading-title-row">
          <h3>{title}</h3>
          <HelpButton topic={helpTopic} label={`Help for ${title}`} onOpenHelp={onOpenHelp} />
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
    if (header) {
      const nextTop = header.offsetHeight + 26;
      setStickyTop(nextTop);
    }
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
        rootMargin: `-${stickyTop || 100}px 0px 0px 0px`,
        threshold: 0.05,
      }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [isFlowPanelOpen, stickyTop]);

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
        matchesReason
      );
    });
  }, [
    assigneeFilter,
    cycleMaxFilter,
    flowItems,
    healthFilter,
    keyFilter,
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

  return (
  <main className="dashboard-page" aria-hidden={detailPanel ? true : undefined}>
      <div className="dashboard-top">
        <div>
          <h2>Delivery Health Analysis</h2>
          <p>Flow, sprint, kanban, capacity, story point, and epic performance from the uploaded Jira export.</p>
        </div>
        <button className="secondary" onClick={onReset}>
          Upload new file
        </button>
      </div>

      <section className="dashboard-summary-bar">
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
        </div>
        <div className="summary-actions">
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

      <section className="issue-highlight-strip">
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

      <section className="dashboard-section section-overview">
        <SectionHeader
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

      <section className="dashboard-section section-visuals">
        <SectionHeader
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

      <section className="dashboard-section section-ratios">
        <SectionHeader
          kicker="Ratios"
          title="Circle metrics by delivery theme"
          detail="Each circle gives a fast percentage view for completion, points, risk, ownership gaps, and active work."
          helpTopic="ratios"
          onOpenHelp={onOpenHelp}
        />
        <div className="circle-grid">
          <CircleMetric title="Done Ratio" value={data.doneIssues || 0} total={totalIssues} label="done items" color="#16a34a" />
          <CircleMetric title="Story Points" value={storyPoints.completedStoryPoints || 0} total={storyPoints.totalStoryPoints || 0} label="completed points" color="#14b8a6" />
          <CircleMetric title="Risk Pressure" value={riskItems} total={totalIssues} label="warning or critical" color="#dc2626" />
          <CircleMetric title="Orphan Ratio" value={orphanItems} total={totalIssues} label="without epic/parent" color="#f97316" />
          <CircleMetric title="Active Work" value={data.activeIssues || 0} total={totalIssues} label="active items" color="#7c3aed" />
        </div>
      </section>

      <section className="dashboard-section section-delivery">
        <SectionHeader
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

      <section className="dashboard-panel table-section panel-quarter">
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

      <section className="dashboard-panel table-section panel-kanban-detail">
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

      <section className="dashboard-panel table-section panel-sprint-detail">
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

      <section className="dashboard-section section-ownership">
        <SectionHeader
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

      <section className="dashboard-panel panel-justification">
        <PanelTitle helpTopic="justification" onOpenHelp={onOpenHelp}>Justification</PanelTitle>
        <ul className="insight-list">
          {(data.insights || []).map((insight) => (
            <li key={insight}>{insight}</li>
          ))}
        </ul>
      </section>

      <section className="dashboard-section section-delivery">
        <SectionHeader
          kicker="Readiness"
          title="Epic health & release readiness"
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
              setActiveQuickFilter('all');
            }}
          >
            Reset
          </button>
            </div>

            <StatusGraph rows={filteredFlowItems} />

            <div className="filtered-summary">
              Showing <strong>{filteredFlowItems.length}</strong> matching items from <strong>{flowItems.length}</strong> total.
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
            { key: 'leadTimeDays', label: 'Lead', render: (row) => formatDays(row.leadTimeDays) },
            { key: 'cycleTimeDays', label: 'Cycle', render: (row) => formatDays(row.cycleTimeDays) },
            { key: 'ageDays', label: 'Open Age', render: (row) => formatDays(row.ageDays) },
            { key: 'health', label: 'Health', render: (row) => <HealthBadge value={row.health} /> },
            { key: 'reason', label: 'Reason' },
          ]}
          rows={filteredFlowItems}
          emptyMessage="No story or task data found."
          rowClassName={(row) => (row.isOrphan ? 'orphan-row' : '')}
            />
          </>
        )}
      </section>
    </main>
  );
}
