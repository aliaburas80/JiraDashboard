// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
'use client';
import { SvgIcon } from '@/components/ui/SvgIcon';
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
  const branch = stats.largestUnfinishedBranch;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatCard label="Total Items"  value={stats.totalRelated}     color="#2563eb" />
        <StatCard label="Done"         value={stats.completedCount}   color="#16a34a" sub={`${stats.completionPct}%`} />
        <StatCard label="Open"         value={stats.openCount}        color="#d97706" />
        <StatCard label="Blocked"      value={stats.blockedCount}     color="#dc2626" sub={`${stats.blockedRatio}%`} />
        <StatCard label="Bugs"         value={stats.bugCount}         color="#dc2626" />
        <StatCard label="Story Points" value={stats.totalStoryPoints} color="#7c3aed" sub={`${stats.completedStoryPoints} done`} />
        <StatCard label="Orphans"      value={stats.orphanCount}      color={stats.orphanCount > 0 ? '#f97316' : '#16a34a'} sub="broken links" />
      </div>

      {/* Largest unfinished branch card */}
      {branch && branch.openCount >= 2 && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl px-5 py-3 flex items-center gap-4">
          <SvgIcon name="chartBar" size={24} className="shrink-0 text-purple-700" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-purple-800 mb-0.5">Largest Unfinished Branch</p>
            <p className="text-sm font-bold text-purple-900 truncate" title={branch.rootLabel}>{branch.rootLabel}</p>
            <p className="text-xs text-purple-600 mt-0.5">
              {branch.openCount} open item{branch.openCount !== 1 ? 's' : ''} · {branch.totalCount} total · {branch.completionPct}% complete
            </p>
          </div>
          <div className="text-center shrink-0">
            <p className="text-2xl font-black text-purple-700">{branch.openCount}</p>
            <p className="text-[10px] text-purple-500 font-bold">open items</p>
          </div>
        </div>
      )}
    </div>
  );
}
