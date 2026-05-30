// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
import { useNavigate } from 'react-router-dom';

// ─── Shared chart primitives ──────────────────────────────────────────────────
const norm = (v) => String(v ?? '').trim().toLowerCase();
const DONE_ST   = ['done', 'closed', 'resolved'];
const ACTIVE_ST = ['in progress', 'code review', 'qa', 'testing', 'uat'];
const PALETTE   = ['#2563eb','#14b8a6','#f59e0b','#dc2626','#7c3aed','#0891b2','#f97316','#16a34a'];

function DonutChart({ segments, size = 180, centerLabel, centerSub }) {
  let cursor = 0;
  const total = Math.max(segments.reduce((s, seg) => s + (seg.value || 0), 0), 1);
  const bg = segments.length
    ? `conic-gradient(${segments.map(seg => {
        const start = cursor;
        cursor += (seg.value / total) * 100;
        return `${seg.color} ${start}% ${cursor}%`;
      }).join(', ')})`
    : '#e2e8f0';

  return (
    <div className="cp-donut" style={{ width: size, height: size, background: bg }}>
      <div className="cp-donut-hole">
        {centerLabel && <span className="cp-donut-val">{centerLabel}</span>}
        {centerSub   && <small className="cp-donut-sub">{centerSub}</small>}
      </div>
    </div>
  );
}

function HorizBar({ label, value, maxValue, color, pct, subLabel }) {
  const width = pct !== undefined ? pct : (maxValue ? Math.max(0, Math.min(100, (value / maxValue) * 100)) : 0);
  return (
    <div className="cp-hbar-row">
      <span className="cp-hbar-label" title={label}>{label}</span>
      <div className="cp-hbar-track">
        <div className="cp-hbar-fill" style={{ width: `${width}%`, background: color }} />
      </div>
      <span className="cp-hbar-val">{subLabel || value}</span>
    </div>
  );
}

function VertBar({ label, value, maxValue, color, pct }) {
  const h = pct !== undefined ? pct : (maxValue ? Math.max(3, Math.min(100, (value / maxValue) * 100)) : 3);
  return (
    <div className="cp-vbar-col">
      <div className="cp-vbar-track">
        <div className="cp-vbar-fill" style={{ height: `${h}%`, background: color }} />
        <span className="cp-vbar-num">{value}</span>
      </div>
      <span className="cp-vbar-label">{label}</span>
    </div>
  );
}

function LegendRow({ color, label, value, pct }) {
  return (
    <div className="cp-legend-row">
      <span className="cp-legend-swatch" style={{ background: color }} />
      <span className="cp-legend-label">{label}</span>
      <strong className="cp-legend-val">{value}</strong>
      {pct !== undefined && <span className="cp-legend-pct">{pct}%</span>}
    </div>
  );
}

function ChartWidget({ title, icon, children, span = 1, className = '' }) {
  return (
    <article className={`chart-widget widget-span-${span} ${className}`}>
      <header className="cw-header">
        <span className="cw-icon" aria-hidden="true">{icon}</span>
        <h3 className="cw-title">{title}</h3>
      </header>
      <div className="cw-body">{children}</div>
    </article>
  );
}

// ─── ChartsPage ───────────────────────────────────────────────────────────────
export default function ChartsPage({ data, onReset }) {
  const navigate = useNavigate();
  const flow     = data.flow        || {};
  const sp       = data.storyPoints || {};
  const items    = flow.items       || [];
  const total    = Math.max(items.length, 1);

  /* ── Delivery composition buckets ─────────────────────────── */
  const doneBucket     = items.filter(i => DONE_ST.includes(norm(i.status))).length;
  const criticalBucket = items.filter(i => !DONE_ST.includes(norm(i.status)) && norm(i.health) === 'critical').length;
  const warningBucket  = items.filter(i => !DONE_ST.includes(norm(i.status)) && norm(i.health) === 'warning').length;
  const activeBucket   = items.filter(i =>
    ACTIVE_ST.includes(norm(i.status)) && !DONE_ST.includes(norm(i.status)) &&
    norm(i.health) !== 'critical' && norm(i.health) !== 'warning'
  ).length;
  const otherBucket    = Math.max(total - doneBucket - criticalBucket - warningBucket - activeBucket, 0);

  const deliverySegs = [
    { label: 'Done',        value: doneBucket,     color: '#16a34a' },
    { label: 'In Progress', value: activeBucket,   color: '#2563eb' },
    { label: 'At Risk',     value: warningBucket,  color: '#f59e0b' },
    { label: 'Critical',    value: criticalBucket, color: '#dc2626' },
    { label: 'Backlog',     value: otherBucket,    color: '#cbd5e1' },
  ].filter(s => s.value > 0);

  const healthSegs = [
    { label: 'Good',     value: flow.good     || 0, color: '#16a34a' },
    { label: 'Warning',  value: flow.warning  || 0, color: '#f59e0b' },
    { label: 'Critical', value: flow.critical || 0, color: '#dc2626' },
  ].filter(s => s.value > 0);

  /* ── Derived lists ─────────────────────────────────────────── */
  const typeList     = (data.types    || []).slice(0, 6);
  const typeTotal    = Math.max(typeList.reduce((s, t) => s + t.count, 0), 1);
  const typeSegs     = typeList.map((t, i) => ({ label: t.type, value: t.count, color: PALETTE[i % PALETTE.length] }));

  const sprints      = (data.sprint?.sprints || []).slice(0, 7).reverse();
  const maxSprint    = Math.max(...sprints.map(s => s.issues || 0), 1);

  const quarters     = (data.quarters || []).filter(q => q.quarter !== 'No date').slice(0, 5).reverse();
  const maxQ         = Math.max(...quarters.map(q => q.issues || 0), 1);

  const capacity     = (data.capacity || []).slice(0, 7);
  const maxLoad      = Math.max(...capacity.map(c => c.loadShare || 0), 1);

  const kanban       = (data.kanban?.byStatus || []).slice(0, 8);
  const maxKanban    = Math.max(...kanban.map(k => k.count || 0), 1);

  const labelStats   = (data.labels?.labelStats || []).filter(l => l.label !== '(unlabeled)').slice(0, 7);
  const maxLabel     = Math.max(...labelStats.map(l => l.count || 0), 1);

  const epics        = (data.epics || []).slice(0, 6);

  const linkSegs     = data.relations?.hasLinks
    ? (data.relations.linkStats || []).slice(0, 5).map((l, i) => ({ label: l.type, value: l.count, color: PALETTE[i % PALETTE.length] }))
    : [];
  const linkTotal    = Math.max(linkSegs.reduce((s, l) => s + l.value, 0), 1);

  const spPct        = sp.pointCompletionRate || 0;
  const spSegs       = sp.totalStoryPoints > 0
    ? [{ label: 'Completed', value: sp.completedStoryPoints || 0, color: '#16a34a' },
       { label: 'Remaining', value: sp.remainingStoryPoints || 0, color: '#e2e8f0' }]
    : [];

  return (
    <main className="charts-page">

      {/* Page header */}
      <div className="charts-page-head">
        <div>
          <button type="button" className="back-to-summary" onClick={() => navigate('/summary')}>← Overview</button>
          <h2 className="charts-page-title">Visual Analytics</h2>
          <p className="charts-page-sub">Charts and diagrams summarising delivery health, flow, team, and progress across all dimensions.</p>
        </div>
        <div className="charts-page-kpis">
          <div className="charts-kpi-pill" style={{ background: 'linear-gradient(135deg,#16a34a,#14b8a6)' }}>
            <span>{data.completionRate || 0}%</span><small>Complete</small>
          </div>
          <div className="charts-kpi-pill" style={{ background: 'linear-gradient(135deg,#dc2626,#f97316)' }}>
            <span>{flow.critical || 0}</span><small>Critical</small>
          </div>
          <div className="charts-kpi-pill" style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}>
            <span>{data.healthScore || 0}</span><small>Health Score</small>
          </div>
          {data.prediction && !data.prediction.complete && data.prediction.daysRemaining !== null && (
            <div className="charts-kpi-pill" style={{ background: 'linear-gradient(135deg,#0891b2,#2563eb)' }}>
              <span>~{data.prediction.daysRemaining}d</span><small>Est. Done</small>
            </div>
          )}
        </div>
      </div>

      {/* Charts grid */}
      <div className="charts-grid">

        {/* ── 1. Delivery Composition ──────────────────── */}
        <ChartWidget title="Delivery Composition" icon="💠" span={2}>
          <div className="cw-donut-layout">
            <DonutChart segments={deliverySegs} size={220}
              centerLabel={`${data.completionRate || 0}%`} centerSub="complete" />
            <div className="cw-legend">
              {deliverySegs.map(s => (
                <LegendRow key={s.label} color={s.color} label={s.label}
                  value={s.value} pct={Math.round((s.value / total) * 100)} />
              ))}
              <div className="cw-legend-total">
                <span>Total</span><strong>{total} issues</strong>
              </div>
            </div>
          </div>
        </ChartWidget>

        {/* ── 2. Health Mix ────────────────────────────── */}
        <ChartWidget title="Health Mix" icon="🏥" span={1}>
          <div className="cw-donut-layout cw-donut-compact">
            <DonutChart segments={healthSegs} size={140}
              centerLabel={total} centerSub="items" />
            <div className="cw-legend">
              {healthSegs.map(s => (
                <LegendRow key={s.label} color={s.color} label={s.label}
                  value={s.value} pct={Math.round((s.value / total) * 100)} />
              ))}
            </div>
          </div>
        </ChartWidget>

        {/* ── 3. Issue Type Breakdown ──────────────────── */}
        <ChartWidget title="Issue Types" icon="📁" span={1}>
          {typeList.length ? (
            <div className="cw-donut-layout cw-donut-compact">
              <DonutChart segments={typeSegs} size={130}
                centerLabel={typeTotal} centerSub="total" />
              <div className="cw-legend">
                {typeSegs.map(s => (
                  <LegendRow key={s.label} color={s.color} label={s.label}
                    value={s.value} pct={Math.round((s.value / typeTotal) * 100)} />
                ))}
              </div>
            </div>
          ) : <p className="cp-empty">No issue type data</p>}
        </ChartWidget>

        {/* ── 4. Story Points ──────────────────────────── */}
        <ChartWidget title="Story Points" icon="💎" span={1}>
          {sp.totalStoryPoints > 0 ? (
            <div className="cw-donut-layout cw-donut-compact">
              <DonutChart segments={spSegs} size={130}
                centerLabel={`${spPct}%`} centerSub="done" />
              <div className="cw-legend">
                <LegendRow color="#16a34a" label="Completed" value={sp.completedStoryPoints || 0} />
                <LegendRow color="#e2e8f0" label="Remaining" value={sp.remainingStoryPoints || 0} />
                <div className="cw-legend-total">
                  <span>Total</span><strong>{sp.totalStoryPoints} pts</strong>
                </div>
              </div>
            </div>
          ) : <p className="cp-empty">No story point data</p>}
        </ChartWidget>

        {/* ── 5. Sprint Velocity ───────────────────────── */}
        <ChartWidget title="Sprint Velocity" icon="🏃" span={2}>
          {sprints.length ? (
            <div className="cw-vbar-chart">
              {sprints.map(s => (
                <VertBar key={s.name}
                  label={s.name?.length > 10 ? s.name.slice(0, 10) + '…' : s.name}
                  value={s.issues}
                  maxValue={maxSprint}
                  color={s.completionRate >= 80 ? '#16a34a' : s.completionRate >= 60 ? '#f59e0b' : '#dc2626'}
                />
              ))}
            </div>
          ) : <p className="cp-empty">No sprint data — include Sprint column in export</p>}
          {sprints.length > 0 && (
            <div className="cw-bar-legend">
              <span style={{ color: '#16a34a' }}>■ ≥80%</span>
              <span style={{ color: '#f59e0b' }}>■ ≥60%</span>
              <span style={{ color: '#dc2626' }}>■ &lt;60%</span>
              <span className="muted">completion rate</span>
            </div>
          )}
        </ChartWidget>

        {/* ── 6. Team Load Distribution ────────────────── */}
        <ChartWidget title="Team Load" icon="👥" span={1}>
          {capacity.length ? (
            <div className="cw-hbar-list">
              {capacity.map(c => (
                <HorizBar key={c.assignee}
                  label={c.assignee?.length > 14 ? c.assignee.slice(0, 14) + '…' : c.assignee}
                  value={c.loadShare}
                  maxValue={maxLoad}
                  color={c.loadShare > 35 ? '#dc2626' : c.loadShare > 20 ? '#f59e0b' : '#16a34a'}
                  subLabel={`${c.loadShare}%`}
                />
              ))}
            </div>
          ) : <p className="cp-empty">No assignee data</p>}
        </ChartWidget>

        {/* ── 7. Quarter Throughput ────────────────────── */}
        <ChartWidget title="Quarter Throughput" icon="📅" span={2}>
          {quarters.length ? (
            <>
              <div className="cw-vbar-chart cw-vbar-grouped">
                {quarters.map(q => (
                  <div key={q.quarter} className="cp-grouped-bar">
                    <div className="cp-grouped-inner">
                      <div className="cp-bar-total" style={{ height: `${(q.issues / maxQ) * 100}%` }} />
                      <div className="cp-bar-done"  style={{ height: `${(q.doneIssues / maxQ) * 100}%` }} />
                    </div>
                    <span className="cp-grouped-num">{q.issues}</span>
                    <span className="cp-grouped-label">{q.quarter.replace(' ', '\n')}</span>
                  </div>
                ))}
              </div>
              <div className="cw-bar-legend">
                <span style={{ color: '#bfdbfe' }}>■ Total issues</span>
                <span style={{ color: '#2563eb' }}>■ Done</span>
              </div>
            </>
          ) : <p className="cp-empty">No date data — include Created Date and Resolution Date in export</p>}
        </ChartWidget>

        {/* ── 8. Kanban Status Flow ────────────────────── */}
        <ChartWidget title="Kanban Status Flow" icon="🗃️" span={1}>
          {kanban.length ? (
            <div className="cw-hbar-list">
              {kanban.map(k => (
                <HorizBar key={k.name}
                  label={k.name?.length > 16 ? k.name.slice(0, 16) + '…' : k.name}
                  value={k.count}
                  maxValue={maxKanban}
                  color={k.critical > 0 ? '#dc2626' : k.warning > 0 ? '#f59e0b' : '#2563eb'}
                />
              ))}
            </div>
          ) : <p className="cp-empty">No status data</p>}
        </ChartWidget>

        {/* ── 9. Label Landscape ───────────────────────── */}
        {labelStats.length > 0 && (
          <ChartWidget title="Label Distribution" icon="🏷️" span={2}>
            <div className="cw-hbar-list cw-hbar-wide">
              {labelStats.map((l, i) => (
                <HorizBar key={l.label}
                  label={l.label}
                  value={l.count}
                  maxValue={maxLabel}
                  color={PALETTE[i % PALETTE.length]}
                />
              ))}
            </div>
          </ChartWidget>
        )}

        {/* ── 10. Epic Progress ────────────────────────── */}
        {epics.length > 0 && (
          <ChartWidget title="Epic Progress" icon="🎯" span={labelStats.length > 0 ? 1 : 3}>
            <div className="cw-epic-list">
              {epics.map(e => (
                <div key={e.epic || e.id} className="cw-epic-row">
                  <div className="cw-epic-top">
                    <span className="cw-epic-name" title={e.epic}>{(e.epic || 'No epic')?.slice(0, 24)}</span>
                    <span className={`cw-epic-pct ${e.critical > 0 ? 'pct-critical' : e.warning > 0 ? 'pct-warning' : 'pct-good'}`}>{e.progress || 0}%</span>
                  </div>
                  <div className="cw-epic-track">
                    <div className="cw-epic-fill"
                      style={{
                        width: `${e.progress || 0}%`,
                        background: e.critical > 0 ? '#dc2626' : e.warning > 0 ? '#f59e0b' : '#16a34a',
                      }} />
                  </div>
                  <small className="cw-epic-sub">{e.completedIssues || 0} / {e.issues || 0} issues</small>
                </div>
              ))}
            </div>
          </ChartWidget>
        )}

        {/* ── 11. Relations (if links exist) ───────────── */}
        {linkSegs.length > 0 && (
          <ChartWidget title="Issue Relations" icon="🔗" span={1}>
            <div className="cw-donut-layout cw-donut-compact">
              <DonutChart segments={linkSegs} size={130}
                centerLabel={data.relations.totalLinks} centerSub="links" />
              <div className="cw-legend">
                {linkSegs.map(s => (
                  <LegendRow key={s.label} color={s.color}
                    label={s.label.length > 14 ? s.label.slice(0, 14) + '…' : s.label}
                    value={s.value} pct={Math.round((s.value / linkTotal) * 100)} />
                ))}
              </div>
            </div>
          </ChartWidget>
        )}

      </div>

      {/* CTA */}
      <div className="charts-page-cta">
        <button type="button" className="secondary" onClick={onReset}>Upload new file</button>
        <button type="button" className="secondary" onClick={() => navigate('/summary')}>← Overview</button>
        <button type="button" className="btn-view-report" onClick={() => navigate('/dashboard')}>
          View Full Report →
        </button>
      </div>
    </main>
  );
}
