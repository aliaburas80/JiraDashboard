// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
'use client';
import { useState } from 'react';
import { SvgIcon } from '@/components/ui/SvgIcon';
import type { ReleaseReadinessResult, ReleaseVerdict } from '@/types/releaseReadiness';

const VERDICT_CONFIG: Record<ReleaseVerdict, { bg: string; border: string; text: string; icon: string; badge: string }> = {
  'Go':                { bg: 'bg-green-50',  border: 'border-green-300',  text: 'text-green-900', icon: 'checkCircle', badge: 'bg-green-600 text-white' },
  'Conditional Go':    { bg: 'bg-amber-50',  border: 'border-amber-300',  text: 'text-amber-900', icon: 'warning', badge: 'bg-amber-500 text-white' },
  'No-Go':             { bg: 'bg-red-50',    border: 'border-red-300',    text: 'text-red-900',   icon: 'priorityBlocker', badge: 'bg-red-600 text-white' },
  'Insufficient Data': { bg: 'bg-slate-50',  border: 'border-slate-200',  text: 'text-slate-600', icon: 'question', badge: 'bg-slate-400 text-white' },
};

interface Props { result: ReleaseReadinessResult }

export default function ReleaseReadinessCard({ result }: Props) {
  const [expanded, setExpanded] = useState(false);
  const cfg = VERDICT_CONFIG[result.verdict];
  const passedCount  = result.checklist.filter(c => c.passed).length;
  const totalCount   = result.checklist.length;
  const blockingFail = result.checklist.filter(c => !c.passed && c.blocking);

  return (
    <div className={`rounded-2xl border-2 ${cfg.border} ${cfg.bg} shadow-sm overflow-hidden`}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:brightness-95 transition-all"
      >
        {/* Verdict badge */}
        <span className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full shrink-0 ${cfg.badge}`}>
          <SvgIcon name={cfg.icon} size={14} />
          {result.verdict}
        </span>

        {/* Version + summary */}
        <div className="flex-1 min-w-0">
          <p className={`text-base font-black truncate ${cfg.text}`}>{result.version}</p>
          <p className="text-xs text-slate-500 mt-0.5">{result.verdictReason}</p>
        </div>

        {/* Quick stats */}
        <div className="hidden sm:flex items-center gap-4 shrink-0 text-center">
          <div>
            <p className="text-lg font-black text-slate-900">{result.completionPct}%</p>
            <p className="text-[10px] text-slate-400">complete</p>
          </div>
          <div>
            <p className={`text-lg font-black ${result.blockers > 0 ? 'text-red-600' : 'text-slate-900'}`}>{result.blockers}</p>
            <p className="text-[10px] text-slate-400">blockers</p>
          </div>
          <div>
            <p className={`text-lg font-black ${result.openBugs > 0 ? 'text-red-600' : 'text-slate-900'}`}>{result.openBugs}</p>
            <p className="text-[10px] text-slate-400">open bugs</p>
          </div>
          <div>
            <p className="text-sm font-black text-slate-600">{passedCount}/{totalCount}</p>
            <p className="text-[10px] text-slate-400">checks passed</p>
          </div>
        </div>

        <span className={`text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''} shrink-0`}>▾</span>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-100 bg-white/60 space-y-4 pt-4">

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>{result.completed} of {result.scope} items done</span>
              <span className="font-bold">{result.completionPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{ width: `${result.completionPct}%`,
                  background: result.completionPct >= 90 ? '#16a34a' : result.completionPct >= 70 ? '#f59e0b' : '#dc2626' }} />
            </div>
          </div>

          {/* Blocking failures */}
          {blockingFail.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="flex items-center gap-1.5 text-xs font-black text-red-800 mb-1.5">
                <SvgIcon name="priorityBlocker" size={14} />
                Blocking issues — must resolve before release
              </p>
              {blockingFail.map(c => (
                <p key={c.id} className="text-xs text-red-700 mb-0.5">• {c.detail}</p>
              ))}
            </div>
          )}

          {/* Checklist */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              Release Checklist ({passedCount}/{totalCount} passed)
            </p>
            <div className="space-y-1.5">
              {result.checklist.map(item => (
                <div key={item.id} className="flex items-start gap-2.5">
                  <SvgIcon
                    name={item.passed ? 'check' : item.blocking ? 'cross' : 'warning'}
                    size={14}
                    className={`mt-0.5 shrink-0 ${item.passed ? 'text-green-600' : item.blocking ? 'text-red-600' : 'text-amber-500'}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold ${item.passed ? 'text-slate-700' : item.blocking ? 'text-red-800' : 'text-amber-800'}`}>
                      {item.label}
                      {item.blocking && !item.passed && (
                        <span className="ml-1 text-[9px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded border border-red-200">BLOCKING</span>
                      )}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Issue sample */}
          {result.issues.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                Issues in scope ({result.scope} total{result.issues.length < result.scope ? `, showing ${result.issues.length}` : ''})
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      {['Key', 'Summary', 'Type', 'Status', 'Health'].map(h => (
                        <th key={h} className="py-1.5 px-2 text-[10px] font-black uppercase tracking-wider text-slate-500 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.issues.map(i => (
                      <tr key={i.key} className="hover:bg-slate-50">
                        <td className="py-1.5 px-2 font-mono font-bold text-blue-700 whitespace-nowrap">{i.key}</td>
                        <td className="py-1.5 px-2 text-slate-700 max-w-[200px] truncate">{i.summary}</td>
                        <td className="py-1.5 px-2 text-slate-500 whitespace-nowrap">{i.type}</td>
                        <td className="py-1.5 px-2 text-slate-500 whitespace-nowrap">{i.status}</td>
                        <td className="py-1.5 px-2">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            i.health === 'critical' ? 'bg-red-100 text-red-800' :
                            i.health === 'warning'  ? 'bg-amber-100 text-amber-800' :
                            i.health === 'done'     ? 'bg-green-100 text-green-800' :
                            'bg-slate-100 text-slate-600'
                          }`}>{i.health}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
