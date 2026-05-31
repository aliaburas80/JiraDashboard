// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
'use client';
import type { RelationNode } from '@/types/relations';
import { NODE_TYPE_CONFIG } from './nodeStyles';

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
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: gradient, position: 'relative', flexShrink: 0 }}>
      <div style={{
        position: 'absolute', width: hole, height: hole, top: off, left: off,
        borderRadius: '50%', background: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {center && <span style={{ fontSize: 11, fontWeight: 900, color: '#1e293b' }}>{center}</span>}
      </div>
    </div>
  );
}

// ── Horizontal bar ────────────────────────────────────────────────────────────

function HBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const w = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
      <span style={{ fontSize: 12, color: '#475569', width: 110, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 8, borderRadius: 999, background: '#f1f5f9', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${w}%`, background: color, borderRadius: 999 }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', width: 28, textAlign: 'right', flexShrink: 0 }}>{value}</span>
    </div>
  );
}

// ── Chart card ────────────────────────────────────────────────────────────────

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">{title}</p>
      {children}
    </div>
  );
}

function Legend({ segs, total }: { segs: { label: string; value: number; color: string }[]; total: number }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      {segs.filter(s => s.value > 0).map(s => (
        <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: '#475569', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#1e293b' }}>{s.value}</span>
          <span style={{ fontSize: 10, color: '#94a3b8', width: 30, textAlign: 'right' }}>{total > 0 ? Math.round(s.value / total * 100) : 0}%</span>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props { nodes: RelationNode[]; orphanNodes: RelationNode[] }

export default function RelationCharts({ nodes, orphanNodes }: Props) {
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
      label, value, color: NODE_TYPE_CONFIG[label as keyof typeof NODE_TYPE_CONFIG]?.color ?? PALETTE[i % PALETTE.length],
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Donut segs={completionSegs} center={`${Math.round(done / total * 100)}%`} />
            <Legend segs={completionSegs} total={total} />
          </div>
        </ChartCard>

        {/* Health distribution donut */}
        <ChartCard title="Health Distribution">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Donut segs={healthSegs} center={`${all.length}`} />
            <Legend segs={healthSegs} total={total} />
          </div>
        </ChartCard>

        {/* Issue types donut */}
        <ChartCard title="Issue Types">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Donut
                segs={[
                  { label: 'Linked', value: nodes.length, color: '#16a34a' },
                  { label: 'Orphan', value: orphanNodes.length, color: '#f97316' },
                ]}
                center={`${orphanNodes.length}`}
              />
              <div>
                <p style={{ fontSize: 11, color: '#f97316', fontWeight: 700 }}>{orphanNodes.length} orphan item{orphanNodes.length !== 1 ? 's' : ''}</p>
                <p style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>Not connected to Epic or Parent</p>
              </div>
            </div>
          </ChartCard>
        )}

      </div>
    </section>
  );
}
