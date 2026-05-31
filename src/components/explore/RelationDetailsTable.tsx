// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
'use client';
import { useState, useMemo } from 'react';
import type { RelationNode } from '@/types/relations';
import { NODE_TYPE_CONFIG } from './nodeStyles';

interface Props {
  nodes: RelationNode[];
  orphanNodes: RelationNode[];
  onFocusNode?: (key: string) => void;
}

function HealthBadge({ health }: { health: RelationNode['health'] }) {
  const map: Record<string, string> = {
    done:     'bg-green-100 text-green-800',
    good:     'bg-teal-100 text-teal-800',
    warning:  'bg-amber-100 text-amber-800',
    critical: 'bg-red-100 text-red-800',
    orphan:   'bg-orange-100 text-orange-800',
  };
  return (
    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${map[health] ?? 'bg-slate-100 text-slate-600'}`}>
      {health}
    </span>
  );
}

export default function RelationDetailsTable({ nodes, orphanNodes, onFocusNode }: Props) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [healthFilter, setHealthFilter] = useState('all');

  const allNodes = useMemo(() => [...nodes, ...orphanNodes], [nodes, orphanNodes]);

  const types = useMemo(() =>
    ['all', ...new Set(allNodes.map(n => n.type))],
    [allNodes],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allNodes.filter(n =>
      (typeFilter === 'all' || n.type === typeFilter) &&
      (healthFilter === 'all' || n.health === healthFilter) &&
      (!q || n.issueKey.toLowerCase().includes(q) || n.summary.toLowerCase().includes(q) || n.assignee.toLowerCase().includes(q)),
    );
  }, [allNodes, search, typeFilter, healthFilter]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 border-b border-slate-100 bg-slate-50">
        <input
          type="text"
          placeholder="Search key, summary, assignee…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none">
          {types.map(t => <option key={t} value={t}>{t === 'all' ? 'All Types' : t}</option>)}
        </select>
        <select value={healthFilter} onChange={e => setHealthFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none">
          {['all','done','good','warning','critical','orphan'].map(h => (
            <option key={h} value={h}>{h === 'all' ? 'All Health' : h}</option>
          ))}
        </select>
        <span className="text-xs text-slate-400 ml-auto">{filtered.length} items</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-left">
              {['Key', 'Summary', 'Type', 'Status', 'Assignee', 'Sprint', 'SP', 'Health', 'Orphan', ''].map(h => (
                <th key={h} className="py-2 px-3 first:pl-4 text-[10px] font-black uppercase tracking-wider text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(node => {
              const cfg = NODE_TYPE_CONFIG[node.type] ?? NODE_TYPE_CONFIG['Unknown'];
              return (
                <tr key={node.id}
                  className={`border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${node.isFocusNode ? 'bg-blue-50' : ''}`}
                  onClick={() => onFocusNode?.(node.issueKey)}>
                  <td className="py-2 pl-4 pr-2">
                    <span className="font-mono text-xs font-bold" style={{ color: cfg.color }}>{node.issueKey}</span>
                    {node.isFocusNode && <span className="ml-1 text-[9px] bg-blue-600 text-white px-1 rounded">focus</span>}
                  </td>
                  <td className="py-2 px-2 max-w-[280px]">
                    <span className="block truncate text-xs text-slate-700" title={node.summary}>{node.summary}</span>
                  </td>
                  <td className="py-2 px-2">
                    <span className="text-xs font-semibold" style={{ color: cfg.color }}>{cfg.icon} {node.type}</span>
                  </td>
                  <td className="py-2 px-2 text-xs text-slate-600 whitespace-nowrap">{node.status}</td>
                  <td className="py-2 px-2 text-xs text-slate-600 whitespace-nowrap">{node.assignee}</td>
                  <td className="py-2 px-2 text-xs text-slate-500 max-w-[120px]">
                    <span className="block truncate" title={node.sprint}>{node.sprint || '—'}</span>
                  </td>
                  <td className="py-2 px-2 text-xs text-center text-slate-700">{node.storyPoints ?? '—'}</td>
                  <td className="py-2 px-2"><HealthBadge health={node.health} /></td>
                  <td className="py-2 px-2 text-center">
                    {node.isOrphan && <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">Orphan</span>}
                  </td>
                  <td className="py-2 px-2 pr-4 text-right">
                    <button className="text-xs text-blue-600 hover:underline font-semibold"
                      onClick={e => { e.stopPropagation(); onFocusNode?.(node.issueKey); }}>
                      Focus
                    </button>
                  </td>
                </tr>
              );
            })}
            {!filtered.length && (
              <tr><td colSpan={10} className="py-8 text-center text-sm text-slate-400 italic">No items match the current filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
