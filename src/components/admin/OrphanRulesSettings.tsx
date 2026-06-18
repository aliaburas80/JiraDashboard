// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
'use client';
import { useState } from 'react';
import { SvgIcon } from '@/components/ui/SvgIcon';
import type { OrphanRules } from '@/types/orphanRules';
import { DEFAULT_ORPHAN_RULES, OPTIONAL_PARENT_FIELDS, COMMON_ISSUE_TYPES } from '@/types/orphanRules';

interface Props {
  rules:   OrphanRules;
  onSave:  (r: OrphanRules) => Promise<void>;
}

function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-slate-100 last:border-0">
      <div>
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative shrink-0 w-10 h-5 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-300'}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}

function ChipSelect({ label, description, all, selected, onChange }: {
  label: string; description: string; all: string[]; selected: string[]; onChange: (v: string[]) => void;
}) {
  function toggle(val: string) {
    onChange(selected.includes(val) ? selected.filter(s => s !== val) : [...selected, val]);
  }
  return (
    <div className="py-3 border-b border-slate-100 last:border-0">
      <p className="text-sm font-semibold text-slate-800 mb-1">{label}</p>
      <p className="text-xs text-slate-500 mb-2">{description}</p>
      <div className="flex flex-wrap gap-2">
        {all.map(val => (
          <button key={val} type="button" onClick={() => toggle(val)}
            className={`text-xs font-semibold px-3 py-1 transition-colors ${
              selected.includes(val) ? 'btn-primary' : 'btn-secondary'
            }`}>
            {val}
          </button>
        ))}
      </div>
      {selected.length === 0 && (
        <p className="text-xs text-red-500 mt-1">At least one must be selected.</p>
      )}
    </div>
  );
}

export default function OrphanRulesSettings({ rules, onSave }: Props) {
  const [form, setForm]   = useState<OrphanRules>({ ...rules });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]     = useState<{ text: string; ok: boolean } | null>(null);

  async function handleSave() {
    if (form.parentLinkFields.length === 0) {
      setMsg({ text: 'Select at least one parent link field.', ok: false });
      return;
    }
    setSaving(true); setMsg(null);
    try {
      await onSave(form);
      setMsg({ text: 'Orphan rules saved. Next upload will use the new rules.', ok: true });
    } catch (e: any) { setMsg({ text: e?.message ?? 'Failed to save.', ok: false }); }
    finally { setSaving(false); setTimeout(() => setMsg(null), 5000); }
  }

  function handleReset() {
    setForm({ ...DEFAULT_ORPHAN_RULES, updatedAt: '', updatedBy: '' });
  }

  return (
    <div className="space-y-6">
      {/* Preview */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600">
        <p className="font-bold text-slate-700 mb-1">Current detection rules</p>
        <p className="mt-1">
          An item is an orphan if <strong>none of these fields have a value:</strong>{' '}
          <span className="font-mono text-blue-700">{form.parentLinkFields.join(', ')}</span>
        </p>
        <p className="mt-1">
          <strong>Exempt types</strong> (never orphans):{' '}
          <span className="font-mono text-green-700">{form.exemptIssueTypes.join(', ') || 'none'}</span>
        </p>
        <p className="mt-1">
          Sub-tasks flagged as orphans: <strong>{form.flagSubTasksWithoutParent ? 'Yes' : 'No'}</strong>
        </p>
        <p className="text-slate-400 mt-2">Changes take effect on the next Jira export upload.</p>
      </div>

      {/* Settings card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-4">Detection Rules</h3>

        <ChipSelect
          label="Parent link fields"
          description="An item must have at least one of these fields set to NOT be an orphan."
          all={OPTIONAL_PARENT_FIELDS}
          selected={form.parentLinkFields}
          onChange={v => setForm(f => ({ ...f, parentLinkFields: v }))}
        />

        <ChipSelect
          label="Exempt issue types"
          description="Items of these types are never flagged as orphans (they are hierarchy roots)."
          all={COMMON_ISSUE_TYPES}
          selected={form.exemptIssueTypes}
          onChange={v => setForm(f => ({ ...f, exemptIssueTypes: v }))}
        />

        <Toggle
          label="Flag Sub-tasks without Parent Key as orphans"
          description="When enabled, Sub-tasks with no Parent Key are treated as orphans even if they have an Epic Link."
          checked={form.flagSubTasksWithoutParent}
          onChange={v => setForm(f => ({ ...f, flagSubTasksWithoutParent: v }))}
        />

        {/* Risk thresholds */}
        <div className="py-3 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1">Risk threshold count</label>
            <p className="text-xs text-slate-500 mb-2">Min orphan count to show as a risk signal.</p>
            <input type="number" min={1} max={100} value={form.riskThresholdCount}
              onChange={e => setForm(f => ({ ...f, riskThresholdCount: Math.max(1, Number(e.target.value)) }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1">Risk threshold %</label>
            <p className="text-xs text-slate-500 mb-2">Orphan ratio above which health score is reduced.</p>
            <div className="flex items-center gap-2">
              <input type="number" min={1} max={100} value={form.riskThresholdPct}
                onChange={e => setForm(f => ({ ...f, riskThresholdPct: Math.max(1, Math.min(100, Number(e.target.value))) }))}
                className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              <span className="text-xs text-slate-400">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={handleSave} disabled={saving || form.parentLinkFields.length === 0}
          className="btn-primary px-5 py-2.5 disabled:opacity-50">
          {saving ? 'Saving…' : 'Save Rules'}
        </button>
        <button type="button" onClick={handleReset}
          className="btn-secondary px-4 py-2.5">
          Reset to defaults
        </button>
        {msg && (
          <span className={`inline-flex items-center gap-1 text-xs font-semibold ${msg.ok ? 'text-green-600' : 'text-red-600'}`}>
            <SvgIcon name={msg.ok ? 'checkCircle' : 'warning'} size={12} />
            {msg.text}
          </span>
        )}
      </div>

      {rules.updatedAt && (
        <p className="text-xs text-slate-400">Last updated {new Date(rules.updatedAt).toLocaleString()} by {rules.updatedBy}</p>
      )}
    </div>
  );
}
