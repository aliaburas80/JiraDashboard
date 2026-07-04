// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Role-based view selector — lets users switch between curated dashboard presets.
'use client';
import { useRef, useState, useEffect } from 'react';
import { DASHBOARD_VIEWS, type ViewId } from '@/types/dashboardView';

interface Props {
  activeViewId: ViewId;
  onChange: (id: ViewId) => void;
  allowedViewIds?: ViewId[];
  locked?: boolean;
}

export default function DashboardViewSelector({ activeViewId, onChange, allowedViewIds, locked = false }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const views = allowedViewIds?.length
    ? DASHBOARD_VIEWS.filter(view => allowedViewIds.includes(view.id))
    : DASHBOARD_VIEWS;
  const active = DASHBOARD_VIEWS.find(v => v.id === activeViewId) ?? DASHBOARD_VIEWS[0];

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { if (!locked && views.length > 1) setOpen(o => !o); }}
        className="btn-secondary text-xs px-3 py-1.5 gap-2"
        style={{ borderLeftColor: active.accentColor, borderLeftWidth: 3 }}
        title={locked ? 'Dashboard view is locked by your assigned role.' : 'Change dashboard view'}
      >
        <span>{active.icon}</span>
        <span>{active.label}</span>
        {locked ? (
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Locked</span>
        ) : (
          <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {/* Dropdown */}
      {open && !locked && views.length > 1 && (
        <div className="absolute left-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 min-w-[280px]">
          <p className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400">Dashboard view</p>
          {views.map(view => {
            const isActive = view.id === activeViewId;
            return (
              <button
                key={view.id}
                type="button"
                onClick={() => { onChange(view.id); setOpen(false); }}
                className={`w-full flex items-start gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors ${isActive ? 'bg-slate-50' : ''}`}
              >
                <span className="text-base mt-0.5 shrink-0">{view.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-800">{view.label}</span>
                    <span className="text-[9px] font-bold text-slate-400">{view.audience}</span>
                    {isActive && (
                      <span className="ml-auto text-[9px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Active</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{view.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
