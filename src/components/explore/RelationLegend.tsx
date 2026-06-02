// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
'use client';
import { useState } from 'react';

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
            { icon: '🗺️', label: 'Epic', color: '#7c3aed' },
            { icon: '📖', label: 'Story', color: '#2563eb' },
            { icon: '✅', label: 'Task', color: '#475569' },
            { icon: '⤷',  label: 'Sub-task', color: '#64748b' },
            { icon: '🐛', label: 'Bug', color: '#dc2626' },
            { icon: '🔬', label: 'Spike', color: '#d97706' },
          ].map(({ icon, label, color }) => (
            <div key={label} className="flex items-center gap-2 mb-1">
              <span>{icon}</span>
              <span style={{ color }} className="font-semibold">{label}</span>
            </div>
          ))}

          <div className="border-t border-slate-100 my-2" />
          <p className="font-bold text-slate-500 uppercase tracking-wider mb-1.5">Connections</p>
          {[
            { style: 'solid', color: '#64748b', label: 'Parent → Child' },
            { style: 'solid', color: '#7c3aed', label: 'Epic → Story' },
            { style: 'solid', color: '#dc2626', label: 'Blocks' },
            { style: 'dashed', color: '#f97316', label: 'Orphan link' },
          ].map(({ style, color, label }) => (
            <div key={label} className="flex items-center gap-2 mb-1">
              <svg width="28" height="6">
                <line x1="0" y1="3" x2="28" y2="3"
                  stroke={color} strokeWidth="2"
                  strokeDasharray={style === 'dashed' ? '5,3' : '0'}
                />
              </svg>
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
            { color: 'bg-red-50 border-red-600 border-2', label: '⚠ Risk Path — chain to root' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2 mb-1">
              <span className={`w-4 h-4 rounded border ${color} shrink-0`} />
              <span className="text-slate-600">{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
