// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
'use client';
import type { CSSProperties } from 'react';
import type { RelationNode } from '@/types/relations';
import type { IssueTypeDefinition } from '@/types/issueTypeHierarchy';
import { DEFAULT_ISSUE_TYPES } from '@/types/issueTypeHierarchy';
import { buildNodeTypeConfig } from './nodeStyles';
import styles from './RelationCharts.module.scss';

type CSSVars = CSSProperties & Record<`--${string}`, string | number>;

const PALETTE = ['#2563eb','#16a34a','#dc2626','#f59e0b','#7c3aed','#0891b2','#f97316','#14b8a6'];

// ── Tiny donut (CSS conic-gradient) ──────────────────────────────────────────

function Donut({ segs, size = 80, center }: {
  segs: { label: string; value: number; color: string }[];
  size?: number;
  center?: string;
}) {
  const total = Math.max(segs.reduce((s, g) => s + g.value, 0), 1);
  let cursor  = 0;
  const gradient = segs.length
    ? `conic-gradient(${segs.map(g => {
        const start = cursor;
        cursor += (g.value / total) * 100;
        return `${g.color} ${start.toFixed(1)}% ${cursor.toFixed(1)}%`;
      }).join(', ')})`
    : '#e2e8f0';
  const hole = Math.round(size * 0.56);
  const off  = Math.round((size - hole) / 2);
  // DYNAMIC CSS VARIABLE:
  // Donut size and gradient stops are computed from runtime segment data.
  const donutVars: CSSVars = { '--donut-size': `${size}px`, '--donut-gradient': gradient };
  const holeVars: CSSVars = { '--hole-size': `${hole}px`, '--hole-offset': `${off}px` };
  return (
    <div className={styles.donut} style={donutVars}>
      <div className={styles.donutHole} style={holeVars}>
        {center && <span className={styles.donutCenterLabel}>{center}</span>}
      </div>
    </div>
  );
}

// ── Horizontal bar ────────────────────────────────────────────────────────────

function HBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const w = max > 0 ? Math.round((value / max) * 100) : 0;
  // DYNAMIC CSS VARIABLE:
  // Bar width is normalized from runtime data; color is caller-supplied per series.
  const fillVars: CSSVars = { '--bar-width': `${w}%`, '--bar-color': color };
  return (
    <div className={styles.hBarRow}>
      <span className={styles.hBarLabel}>{label}</span>
      <div className={styles.hBarTrack}>
        <div className={styles.hBarFill} style={fillVars} />
      </div>
      <span className={styles.hBarVal}>{value}</span>
    </div>
  );
}

// ── Chart card ────────────────────────────────────────────────────────────────

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={styles.chartCard}>
      <p className={styles.chartCardTitle}>{title}</p>
      {children}
    </div>
  );
}

function Legend({ segs, total }: { segs: { label: string; value: number; color: string }[]; total: number }) {
  return (
    <div className={styles.legend}>
      {segs.filter(s => s.value > 0).map(s => {
        // DYNAMIC CSS VARIABLE:
        // Dot color is caller-supplied per series and cannot be a fixed class.
        const dotVars: CSSVars = { '--dot-color': s.color };
        return (
          <div key={s.label} className={styles.legendRow}>
            <span className={styles.legendDot} style={dotVars} />
            <span className={styles.legendLabel}>{s.label}</span>
            <span className={styles.legendValue}>{s.value}</span>
            <span className={styles.legendPct}>{total > 0 ? Math.round(s.value / total * 100) : 0}%</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  nodes: RelationNode[];
  orphanNodes: RelationNode[];
  issueTypes?: IssueTypeDefinition[]; // admin-configured types; falls back to defaults
}

export default function RelationCharts({ nodes, orphanNodes, issueTypes = DEFAULT_ISSUE_TYPES }: Props) {
  const nodeTypeConfig = buildNodeTypeConfig(issueTypes);
  const all   = [...nodes, ...orphanNodes];
  const total = Math.max(all.length, 1);

  // 1. Completion
  const done    = all.filter(n => n.isDone).length;
  const blocked = all.filter(n => n.isBlocked && !n.isDone).length;
  const open    = all.length - done - blocked;
  const completionSegs = [
    { label: 'Done',    value: done,    color: '#16a34a' },
    { label: 'Blocked', value: blocked, color: '#dc2626' },
    { label: 'Open',    value: open,    color: '#cbd5e1' },
  ];

  // 2. Health distribution
  const healthSegs = [
    { label: 'Done',     value: all.filter(n => n.health === 'done').length,     color: '#16a34a' },
    { label: 'Good',     value: all.filter(n => n.health === 'good').length,     color: '#14b8a6' },
    { label: 'Warning',  value: all.filter(n => n.health === 'warning').length,  color: '#f59e0b' },
    { label: 'Critical', value: all.filter(n => n.health === 'critical').length, color: '#dc2626' },
    { label: 'Orphan',   value: all.filter(n => n.health === 'orphan').length,   color: '#f97316' },
  ].filter(s => s.value > 0);

  // 3. Issue type distribution
  const typeMap = new Map<string, number>();
  all.forEach(n => typeMap.set(n.type, (typeMap.get(n.type) ?? 0) + 1));
  const typeSegs = [...typeMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], i) => ({
      label, value, color: nodeTypeConfig[label]?.color ?? PALETTE[i % PALETTE.length],
    }));

  // 4. Assignee workload
  const assigneeMap = new Map<string, number>();
  all.filter(n => !n.isDone).forEach(n => {
    const a = n.assignee || 'Unassigned';
    assigneeMap.set(a, (assigneeMap.get(a) ?? 0) + 1);
  });
  const assignees = [...assigneeMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxAssignee = Math.max(...assignees.map(([, v]) => v), 1);

  // 5. Sprint distribution
  const sprintMap = new Map<string, number>();
  all.forEach(n => { if (n.sprint) sprintMap.set(n.sprint, (sprintMap.get(n.sprint) ?? 0) + 1); });
  const sprints    = [...sprintMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxSprint  = Math.max(...sprints.map(([, v]) => v), 1);

  return (
    <section>
      <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Charts</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Completion donut */}
        <ChartCard title="Completion Status">
          <div className={styles.donutRow}>
            <Donut segs={completionSegs} center={`${Math.round(done / total * 100)}%`} />
            <Legend segs={completionSegs} total={total} />
          </div>
        </ChartCard>

        {/* Health distribution donut */}
        <ChartCard title="Health Distribution">
          <div className={styles.donutRow}>
            <Donut segs={healthSegs} center={`${all.length}`} />
            <Legend segs={healthSegs} total={total} />
          </div>
        </ChartCard>

        {/* Issue types donut */}
        <ChartCard title="Issue Types">
          <div className={styles.donutRow}>
            <Donut segs={typeSegs} center={`${typeSegs.length}`} />
            <Legend segs={typeSegs} total={total} />
          </div>
        </ChartCard>

        {/* Assignee workload */}
        {assignees.length > 0 && (
          <ChartCard title="Open Work by Assignee">
            {assignees.map(([name, count]) => (
              <HBar key={name} label={name} value={count} max={maxAssignee} color="#2563eb" />
            ))}
          </ChartCard>
        )}

        {/* Sprint distribution */}
        {sprints.length > 0 && (
          <ChartCard title="Items by Sprint">
            {sprints.map(([name, count]) => (
              <HBar key={name} label={name} value={count} max={maxSprint} color="#7c3aed" />
            ))}
          </ChartCard>
        )}

        {/* Orphan/broken hierarchy */}
        {orphanNodes.length > 0 && (
          <ChartCard title="Orphan & Data Quality">
            <div className={styles.donutRow}>
              <Donut
                segs={[
                  { label: 'Linked', value: nodes.length, color: '#16a34a' },
                  { label: 'Orphan', value: orphanNodes.length, color: '#f97316' },
                ]}
                center={`${orphanNodes.length}`}
              />
              <div>
                <p className={styles.orphanNote}>{orphanNodes.length} orphan item{orphanNodes.length !== 1 ? 's' : ''}</p>
                <p className={styles.orphanSubnote}>Not connected to Epic or Parent</p>
              </div>
            </div>
          </ChartCard>
        )}

      </div>
    </section>
  );
}
