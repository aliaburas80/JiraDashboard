// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// Admin UI for configuring health score thresholds.
'use client';
import { useState } from 'react';
import type { HealthThresholds } from '@/types/thresholds';
import { DEFAULT_THRESHOLDS, THRESHOLD_LABELS } from '@/types/thresholds';

interface Props {
  thresholds: HealthThresholds;
  onSave: (t: HealthThresholds) => Promise<void>;
}

function ThresholdField({
  fieldKey, value, onChange, config,
}: {
  fieldKey: string;
  value: number;
  onChange: (v: number) => void;
  config: { label: string; unit: string; description: string; min: number; max: number };
}) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800">{config.label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{config.description}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <input
          type="number"
          value={value}
          min={config.min}
          max={config.max}
          onChange={e => onChange(Math.max(config.min, Math.min(config.max, Number(e.target.value))))}
          className="w-20 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-center font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <span className="text-xs text-slate-400 w-8">{config.unit}</span>
      </div>
    </div>
  );
}

export default function HealthThresholdSettings({ thresholds, onSave }: Props) {
  const [form, setForm]   = useState<HealthThresholds>({ ...thresholds });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]     = useState('');

  function setField(key: keyof HealthThresholds, value: number) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    setSaving(true); setMsg('');
    try {
      await onSave(form);
      setMsg('✓ Thresholds saved. Next upload will use the new thresholds.');
    } catch { setMsg('Failed to save.'); }
    finally { setSaving(false); setTimeout(() => setMsg(''), 5000); }
  }

  function handleReset() {
    setForm({ ...DEFAULT_THRESHOLDS, updatedAt: '', updatedBy: '' });
  }

  const groups = [
    {
      title: 'Cycle Time',
      icon: '🔄',
      fields: ['cycleTimeWarningDays', 'cycleTimeCriticalDays'] as (keyof typeof THRESHOLD_LABELS)[],
    },
    {
      title: 'Lead Time',
      icon: '📅',
      fields: ['leadTimeWarningDays', 'leadTimeCriticalDays'] as (keyof typeof THRESHOLD_LABELS)[],
    },
    {
      title: 'Active Item Age',
      icon: '⏳',
      fields: ['activeAgeWarningDays', 'activeAgeCriticalDays'] as (keyof typeof THRESHOLD_LABELS)[],
    },
    {
      title: 'Open Item Age',
      icon: '📦',
      fields: ['openAgeWarningDays'] as (keyof typeof THRESHOLD_LABELS)[],
    },
    {
      title: 'Blocked Ratio',
      icon: '🚫',
      fields: ['blockedRatioWarningPct', 'blockedRatioCriticalPct'] as (keyof typeof THRESHOLD_LABELS)[],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Preview */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600">
        <p className="font-bold text-slate-700 mb-1">Current thresholds preview</p>
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="bg-amber-100 text-amber-800 border border-amber-200 rounded px-2 py-0.5 font-semibold">
            ⚠ Warning: cycle &gt;{form.cycleTimeWarningDays}d · active &gt;{form.activeAgeWarningDays}d
          </span>
          <span className="bg-red-100 text-red-800 border border-red-200 rounded px-2 py-0.5 font-semibold">
            🔴 Critical: cycle &gt;{form.cycleTimeCriticalDays}d · active &gt;{form.activeAgeCriticalDays}d · blocked &gt;{form.blockedRatioCriticalPct}%
          </span>
        </div>
        <p className="text-slate-400 mt-2">Changes take effect on the next Jira export upload.</p>
      </div>

      {/* Threshold groups */}
      {groups.map(group => (
        <div key={group.title} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-3">
            <span className="text-base">{group.icon}</span>
            <h3 className="text-sm font-black text-slate-700">{group.title}</h3>
          </div>
          {group.fields.map(key => (
            <ThresholdField
              key={key}
              fieldKey={key}
              value={form[key] as number}
              onChange={v => setField(key, v)}
              config={THRESHOLD_LABELS[key]}
            />
          ))}
        </div>
      ))}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn-primary px-5 py-2.5 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Thresholds'}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="btn-secondary px-4 py-2.5"
        >
          Reset to defaults
        </button>
        {msg && (
          <span className={`text-xs font-semibold ${msg.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>
            {msg}
          </span>
        )}
      </div>

      {thresholds.updatedAt && (
        <p className="text-xs text-slate-400">
          Last updated {new Date(thresholds.updatedAt).toLocaleString()} by {thresholds.updatedBy}
        </p>
      )}
    </div>
  );
}
