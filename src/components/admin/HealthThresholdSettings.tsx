// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Admin UI for configuring health score thresholds.
'use client';
import { useState } from 'react';
import type { HealthThresholds } from '@/types/thresholds';
import { DEFAULT_THRESHOLDS, THRESHOLD_LABELS } from '@/types/thresholds';
import { SvgIcon } from '@/components/ui/SvgIcon';

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
  const [msg, setMsg]     = useState<{ text: string; ok: boolean } | null>(null);

  function setField(key: keyof HealthThresholds, value: number) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    setSaving(true); setMsg(null);
    try {
      await onSave(form);
      setMsg({ text: 'Thresholds saved. Next upload will use the new thresholds.', ok: true });
    } catch { setMsg({ text: 'Failed to save.', ok: false }); }
    finally { setSaving(false); setTimeout(() => setMsg(null), 5000); }
  }

  function handleReset() {
    setForm({ ...DEFAULT_THRESHOLDS, updatedAt: '', updatedBy: '' });
  }

  const groups = [
    {
      title: 'Cycle Time',
      icon: 'refresh',
      fields: ['cycleTimeWarningDays', 'cycleTimeCriticalDays'] as (keyof typeof THRESHOLD_LABELS)[],
    },
    {
      title: 'Lead Time',
      icon: 'calendar',
      fields: ['leadTimeWarningDays', 'leadTimeCriticalDays'] as (keyof typeof THRESHOLD_LABELS)[],
    },
    {
      title: 'Active Item Age',
      icon: 'clock',
      fields: ['activeAgeWarningDays', 'activeAgeCriticalDays'] as (keyof typeof THRESHOLD_LABELS)[],
    },
    {
      title: 'Open Item Age',
      icon: 'archive',
      fields: ['openAgeWarningDays'] as (keyof typeof THRESHOLD_LABELS)[],
    },
    {
      title: 'Blocked Ratio',
      icon: 'priorityBlocker',
      fields: ['blockedRatioWarningPct', 'blockedRatioCriticalPct'] as (keyof typeof THRESHOLD_LABELS)[],
    },
    {
      title: 'Health Score Bands',
      icon: 'activity',
      fields: ['healthScoreExcellentPct', 'healthScoreGoodPct', 'healthScoreFairPct', 'healthScoreWeakPct'] as (keyof typeof THRESHOLD_LABELS)[],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Preview */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600">
        <p className="font-bold text-slate-700 mb-1">Current thresholds preview</p>
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-200 rounded px-2 py-0.5 font-semibold">
            <SvgIcon name="warning" size={12} />
            Warning: cycle &gt;{form.cycleTimeWarningDays}d · active &gt;{form.activeAgeWarningDays}d
          </span>
          <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 border border-red-200 rounded px-2 py-0.5 font-semibold">
            <SvgIcon name="statusError" size={12} />
            Critical: cycle &gt;{form.cycleTimeCriticalDays}d · active &gt;{form.activeAgeCriticalDays}d · blocked &gt;{form.blockedRatioCriticalPct}%
          </span>
        </div>
        <p className="text-slate-400 mt-2">Changes take effect on the next Jira export upload.</p>
      </div>

      {/* Threshold groups */}
      {groups.map(group => (
        <div key={group.title} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-3">
            <SvgIcon name={group.icon} size={16} className="text-slate-500" />
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
          <span className={`inline-flex items-center gap-1 text-xs font-semibold ${msg.ok ? 'text-green-600' : 'text-red-600'}`}>
            <SvgIcon name={msg.ok ? 'checkCircle' : 'warning'} size={12} />
            {msg.text}
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
