// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
'use client';
import { useState } from 'react';
import clsx from 'clsx';
import { SvgIcon } from '@/components/ui/SvgIcon';
import styles from './RelationLegend.module.scss';

export default function RelationLegend() {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute bottom-4 right-4 z-10">
      <button
        onClick={() => setOpen(o => !o)}
        className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm hover:shadow-md transition-shadow"
      >
        {open ? 'Hide Legend' : 'Legend'}
      </button>

      {open && (
        <div className="absolute bottom-10 right-0 bg-white border border-slate-200 rounded-xl shadow-lg p-4 w-64 text-xs">
          <p className="font-black text-slate-700 mb-3 uppercase tracking-wider">Legend</p>

          <p className="font-bold text-slate-500 uppercase tracking-wider mb-1.5">Issue Types</p>
          {[
            { icon: 'roadmap', label: 'Epic', color: '#7c3aed', key: 'epic' },
            { icon: 'story', label: 'Story', color: '#2563eb', key: 'story' },
            { icon: 'checkCircle', label: 'Task', color: '#475569', key: 'task' },
            { icon: 'subtasks',  label: 'Sub-task', color: '#64748b', key: 'subtask' },
            { icon: 'bug', label: 'Bug', color: '#dc2626', key: 'bug' },
            { icon: 'flask', label: 'Spike', color: '#d97706', key: 'spike' },
          ].map(({ icon, label, color, key }) => (
            <div key={label} className="flex items-center gap-2 mb-1">
              <SvgIcon name={icon} size={12} style={{ color }} />
              <span className={clsx('font-semibold', styles.typeLabel)} data-legend={key}>{label}</span>
            </div>
          ))}

          <div className="border-t border-slate-100 my-2" />
          <p className="font-bold text-slate-500 uppercase tracking-wider mb-1.5">Connections</p>
          {[
            { dashed: false, label: 'Parent → Child', key: 'parentChild' },
            { dashed: false, label: 'Epic → Story', key: 'epicStory' },
            { dashed: false, label: 'Blocks', key: 'blocks' },
            { dashed: true, label: 'Orphan link', key: 'orphan' },
          ].map(({ dashed, label, key }) => (
            <div key={label} className="flex items-center gap-2 mb-1">
              <span
                aria-hidden
                className={styles.connLine}
                data-conn={key}
                data-dashed={dashed}
              />
              <span className="text-slate-600">{label}</span>
            </div>
          ))}

          <div className="border-t border-slate-100 my-2" />
          <p className="font-bold text-slate-500 uppercase tracking-wider mb-1.5">Status</p>
          {[
            { color: 'bg-green-100 border-green-300', label: 'Done' },
            { color: 'bg-red-100 border-red-300', label: 'Critical / Blocked' },
            { color: 'bg-amber-100 border-amber-300', label: 'Warning / At Risk' },
            { color: 'border-orange-400 border-dashed', label: 'Orphan Issue' },
            { color: 'bg-red-50 border-red-600 border-2', label: 'Risk Path — chain to root', icon: 'warning' },
          ].map(({ color, label, icon }) => (
            <div key={label} className="flex items-center gap-2 mb-1">
              <span className={`w-4 h-4 rounded border ${color} shrink-0`} />
              {icon && <SvgIcon name={icon} size={12} className="text-red-600" />}
              <span className="text-slate-600">{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
