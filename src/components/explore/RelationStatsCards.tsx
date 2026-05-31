// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
'use client';
import type { RelationStats } from '@/types/relations';

interface Props { stats: RelationStats }

function StatCard({ label, value, color, sub }: { label: string; value: string | number; color: string; sub?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
      <p className="text-2xl font-black leading-none" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function RelationStatsCards({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      <StatCard label="Total Items"      value={stats.totalRelated}        color="#2563eb" />
      <StatCard label="Done"             value={stats.completedCount}      color="#16a34a" sub={`${stats.completionPct}%`} />
      <StatCard label="Open"             value={stats.openCount}           color="#d97706" />
      <StatCard label="Blocked"          value={stats.blockedCount}        color="#dc2626" sub={`${stats.blockedRatio}%`} />
      <StatCard label="Bugs"             value={stats.bugCount}            color="#dc2626" />
      <StatCard label="Story Points"     value={stats.totalStoryPoints}    color="#7c3aed" sub={`${stats.completedStoryPoints} done`} />
      <StatCard label="Orphans"          value={stats.orphanCount}         color={stats.orphanCount > 0 ? '#f97316' : '#16a34a'} sub="broken links" />
    </div>
  );
}
