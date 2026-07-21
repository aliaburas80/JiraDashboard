// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Shown after file upload before redirecting to dashboard.
// Lets users verify column mapping, see aliased columns, and understand
// which important fields are missing before committing to the analysis.
'use client';
import { useEffect, useState } from 'react';
import { SvgIcon } from '@/components/ui/SvgIcon';
import type { ColumnMappingResult, ColumnStatus } from '@/types/columnMapping';
import styles from './ColumnMappingPreview.module.scss';

const STATUS_CONFIG: Record<ColumnStatus, { label: string; chip: string; icon: string }> = {
  mapped:       { label: 'Mapped',        chip: 'bg-green-100 text-green-800 border-green-200', icon: 'check' },
  aliased:      { label: 'Auto-renamed',  chip: 'bg-blue-100 text-blue-800 border-blue-200',   icon: 'changes' },
  unrecognised: { label: 'Unrecognised',  chip: 'bg-slate-100 text-slate-500 border-slate-200', icon: 'question' },
  missing:      { label: 'Missing',       chip: 'bg-red-100 text-red-800 border-red-200',       icon: 'cross' },
};

// CP3-019: this is a column-NAME-matching score (mapping.mappingScore, from
// src/services/jira/parser.ts's essentialScore + importantScore +
// recognitionScore), a different metric from the data-COMPLETENESS score
// shown later on /data-quality (dataQuality.service.ts's band()). The two
// used to share the exact label vocabulary (Excellent/Good/Fair/Weak) at
// different cutoffs (80/60/40 here vs 90/75/60/40 there) — a user could see
// "Good" here and "Fair" on /data-quality for an unrelated score moments
// later. Cutover to a single canonical band() was considered and rejected:
// unlike CP3-018's Health Score (one metric duplicated in many places), these
// are two genuinely different metrics with no reason their tier boundaries
// should match — forcing this score onto dataQuality's cutoffs would be a
// real, unjustified behavior change. Renaming to a distinct "Match" label
// removes the vocabulary collision without touching either score's values.
// See docs/product-audit/08-metric-dictionary.md CP3-019.
function ScoreBadge({ score }: { score: number }) {
  const band = score >= 80 ? 'strong' : score >= 60 ? 'good' : 'weak';
  const label = score >= 80 ? 'Strong Match' : score >= 60 ? 'Good Match' : score >= 40 ? 'Partial Match' : 'Weak Match';
  return (
    <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-full border-4 shrink-0 ${styles.scoreRing}`} data-band={band}>
      <span className={`text-lg font-black leading-none ${styles.scoreValue}`} data-band={band}>{score}</span>
      <span className="text-[9px] font-bold text-slate-400 text-center leading-tight">{label}</span>
    </div>
  );
}

interface Props {
  mapping:    ColumnMappingResult;
  onProceed:  () => void;
  onReupload: () => void;
  autoRedirectSecs?: number; // 0 = no auto-redirect
}

export default function ColumnMappingPreview({ mapping, onProceed, onReupload, autoRedirectSecs = 8 }: Props) {
  const [countdown, setCountdown] = useState(autoRedirectSecs);
  const [showAll,   setShowAll]   = useState(false);

  // Auto-proceed countdown (skip if essentials are missing)
  useEffect(() => {
    if (mapping.missingEssential.length > 0 || autoRedirectSecs === 0) return;
    if (countdown <= 0) { onProceed(); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, mapping.missingEssential.length, autoRedirectSecs, onProceed]);

  const aliased      = mapping.columns.filter(c => c.status === 'aliased');
  const unrecognised = mapping.columns.filter(c => c.status === 'unrecognised');
  const shown        = showAll ? mapping.columns : mapping.columns.slice(0, 12);
  const remaining    = mapping.columns.length - 12;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden w-full max-w-lg">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 py-4 border-b border-slate-100 bg-slate-50">
        <ScoreBadge score={mapping.mappingScore} />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-black text-slate-800">Column Mapping Preview</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {mapping.totalInFile} columns · {mapping.totalMapped} mapped · {mapping.totalAliased} auto-renamed · {mapping.totalUnrecognised} unrecognised
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Sheet: {mapping.sheetName}</p>
        </div>
      </div>

      {/* Missing essentials — blocking */}
      {mapping.missingEssential.length > 0 && (
        <div className="px-5 py-3 bg-red-50 border-b border-red-200">
          <p className="flex items-center gap-1.5 text-xs font-black text-red-800 mb-1">
            <SvgIcon name="warning" size={13} />
            Required columns missing
          </p>
          <div className="flex flex-wrap gap-1.5">
            {mapping.missingEssential.map(f => (
              <span key={f} className="text-[10px] font-bold bg-red-100 text-red-800 border border-red-300 rounded-full px-2 py-0.5">{f}</span>
            ))}
          </div>
          <p className="text-[10px] text-red-600 mt-1.5">Dashboard cannot be generated without these columns. Re-export your Jira file with them included.</p>
        </div>
      )}

      {/* Missing important fields — warning only */}
      {mapping.missingImportant.length > 0 && mapping.missingEssential.length === 0 && (
        <div className="px-5 py-3 bg-amber-50 border-b border-amber-200">
          <p className="text-xs font-black text-amber-800 mb-1">Some metrics will have limited data</p>
          <div className="flex flex-wrap gap-1.5">
            {mapping.missingImportant.map(f => (
              <span key={f} className="text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 rounded-full px-2 py-0.5">{f}</span>
            ))}
          </div>
        </div>
      )}

      {/* Aliased columns */}
      {aliased.length > 0 && (
        <div className="px-5 py-3 bg-blue-50 border-b border-blue-100">
          <p className="text-[10px] font-black uppercase tracking-wider text-blue-600 mb-1.5">Auto-renamed ({aliased.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {aliased.map(c => (
              <span key={c.original} className="text-[10px] bg-white border border-blue-200 rounded px-2 py-0.5 text-blue-800">
                <span className="font-semibold">{c.original}</span>
                <span className="text-blue-400 mx-1">→</span>
                <span className="font-bold">{c.canonical}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Column list */}
      <div className="px-5 py-3 max-h-48 overflow-y-auto">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">All columns</p>
        <div className="flex flex-wrap gap-1.5">
          {shown.map(c => {
            const cfg = STATUS_CONFIG[c.status];
            return (
              <span
                key={c.original}
                title={c.status === 'aliased' ? `${c.original} → ${c.canonical}` : c.original}
                className={`inline-flex items-center gap-1 text-[10px] font-bold border rounded-full px-2 py-0.5 ${cfg.chip}`}
              >
                <SvgIcon name={cfg.icon} size={10} />
                {c.canonical.length > 20 ? c.canonical.slice(0, 20) + '…' : c.canonical}
              </span>
            );
          })}
          {!showAll && remaining > 0 && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="text-[10px] font-bold text-slate-400 hover:text-slate-600 border border-dashed border-slate-200 rounded-full px-2 py-0.5"
            >
              +{remaining} more
            </button>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50">
        {mapping.missingEssential.length === 0 ? (
          <>
            <button
              type="button"
              onClick={onProceed}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors"
            >
              {countdown > 0 ? `Proceed to Dashboard (${countdown}s)` : 'Proceed to Dashboard →'}
            </button>
            <button
              type="button"
              onClick={onReupload}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Re-upload
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onReupload}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors"
          >
            Upload a different file
          </button>
        )}
      </div>

      {/* Legend */}
      <div className="px-5 pb-3 flex flex-wrap gap-3">
        {Object.entries(STATUS_CONFIG).filter(([k]) => k !== 'missing').map(([, cfg]) => (
          <span key={cfg.label} className="flex items-center gap-1 text-[9px] text-slate-400">
            <span className={`inline-flex items-center justify-center border rounded-full px-1.5 py-0 ${cfg.chip}`}>
              <SvgIcon name={cfg.icon} size={9} />
            </span>
            {cfg.label}
          </span>
        ))}
      </div>
    </div>
  );
}
