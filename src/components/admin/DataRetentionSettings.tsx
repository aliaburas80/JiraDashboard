// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
'use client';
import { useState } from 'react';
import type { RetentionSettings, RetentionStats, RetentionPeriod } from '@/types/settings';

const PERIODS: { value: RetentionPeriod; label: string }[] = [
  { value: 7,   label: '7 days'     },
  { value: 30,  label: '30 days'    },
  { value: 90,  label: '90 days'    },
  { value: 365, label: '1 year'     },
  { value: -1,  label: 'Keep forever' },
];

interface Props {
  settings:   RetentionSettings;
  stats:      RetentionStats | null;
  onSave:     (s: RetentionSettings) => Promise<void>;
  onCleanup:  () => Promise<{ logsDeleted: number; snapshotsDeleted: number }>;
  onClearAll: () => Promise<{ logsDeleted: number; snapshotsDeleted: number }>;
}

function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-slate-100 last:border-0">
      <div>
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 w-10 h-5 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-300'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}

export default function DataRetentionSettings({ settings, stats, onSave, onCleanup, onClearAll }: Props) {
  const [form, setForm]       = useState<RetentionSettings>({ ...settings });
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');
  const [cleaning, setCleaning]   = useState(false);
  const [clearing, setClearing]   = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  async function handleSave() {
    setSaving(true); setMsg('');
    try {
      await onSave(form);
      setMsg('✓ Settings saved.');
    } catch { setMsg('Failed to save.'); }
    finally { setSaving(false); setTimeout(() => setMsg(''), 3000); }
  }

  async function handleCleanup() {
    setCleaning(true); setMsg('');
    try {
      const r = await onCleanup();
      setMsg(`✓ Deleted ${r.logsDeleted} logs and ${r.snapshotsDeleted} snapshots.`);
    } catch { setMsg('Cleanup failed.'); }
    finally { setCleaning(false); setTimeout(() => setMsg(''), 4000); }
  }

  async function handleClearAll() {
    if (!confirmClear) { setConfirmClear(true); return; }
    setClearing(true); setMsg(''); setConfirmClear(false);
    try {
      const r = await onClearAll();
      setMsg(`✓ Cleared all data: ${r.logsDeleted} logs + ${r.snapshotsDeleted} snapshots deleted.`);
    } catch { setMsg('Clear failed.'); }
    finally { setClearing(false); setTimeout(() => setMsg(''), 5000); }
  }

  const period = PERIODS.find(p => p.value === form.retentionDays) ?? PERIODS[4];

  return (
    <div className="space-y-6">

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Import Logs', value: stats.totalLogs, color: '#2563eb' },
            { label: 'Eligible for Deletion', value: stats.logsEligible, color: stats.logsEligible > 0 ? '#dc2626' : '#16a34a' },
            { label: 'Total Snapshots', value: stats.totalSnapshots, color: '#7c3aed' },
            { label: 'Snapshots Eligible', value: stats.snapshotsEligible, color: stats.snapshotsEligible > 0 ? '#dc2626' : '#16a34a' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{s.label}</p>
              <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
          {stats.oldestLogDate && (
            <div className="col-span-2 sm:col-span-4 text-xs text-slate-400 text-right">
              Oldest log: {new Date(stats.oldestLogDate).toLocaleDateString()} ·
              Newest: {stats.newestLogDate ? new Date(stats.newestLogDate).toLocaleDateString() : '—'}
            </div>
          )}
        </div>
      )}

      {/* Settings card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-4">Storage Settings</h3>

        <Toggle
          label="Store upload logs"
          description="Save import log entries to the database when a file is uploaded."
          checked={form.storeUploadLogs}
          onChange={v => setForm(f => ({ ...f, storeUploadLogs: v }))}
        />
        <Toggle
          label="Store dashboard snapshots"
          description="Allow saving and retrieving named dashboard snapshots."
          checked={form.storeDashboardSnapshots}
          onChange={v => setForm(f => ({ ...f, storeDashboardSnapshots: v }))}
        />
        <Toggle
          label="Auto-delete old logs"
          description="Automatically remove import logs older than the retention period."
          checked={form.autoDeleteOldLogs}
          onChange={v => setForm(f => ({ ...f, autoDeleteOldLogs: v }))}
        />
        <Toggle
          label="Auto-delete old snapshots"
          description="Automatically remove dashboard snapshots older than the retention period."
          checked={form.autoDeleteOldSnapshots}
          onChange={v => setForm(f => ({ ...f, autoDeleteOldSnapshots: v }))}
        />

        {/* Retention period */}
        <div className="mt-4">
          <p className="text-sm font-semibold text-slate-800 mb-2">Retention period</p>
          <div className="flex flex-wrap gap-2">
            {PERIODS.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, retentionDays: p.value }))}
                className={`text-xs font-bold transition-colors ${
                  form.retentionDays === p.value
                    ? 'btn-primary px-4 py-2'
                    : 'btn-secondary px-4 py-2'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {form.retentionDays !== -1 && (
            <p className="text-xs text-slate-400 mt-2">
              Logs and snapshots older than {period.label} will be eligible for deletion.
            </p>
          )}
        </div>

        {/* Save */}
        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary px-5 py-2 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
          {msg && <span className={`text-xs font-semibold ${msg.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>{msg}</span>}
        </div>
      </div>

      {/* Cleanup actions */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-4">Cleanup Actions</h3>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleCleanup}
            disabled={cleaning || form.retentionDays === -1}
            className="btn-warning disabled:opacity-40"
          >
            {cleaning ? 'Running…' : `Apply Retention Policy (${period.label})`}
          </button>

          <button
            type="button"
            onClick={handleClearAll}
            disabled={clearing}
            className={confirmClear ? 'btn-danger' : 'btn-outline-danger'}
          >
            {clearing ? 'Clearing…' : confirmClear ? '⚠ Confirm — Delete ALL data' : 'Clear All Data'}
          </button>
          {confirmClear && (
            <button type="button" onClick={() => setConfirmClear(false)}
              className="btn-ghost text-xs">
              Cancel
            </button>
          )}
        </div>

        <p className="text-xs text-slate-400 mt-3">
          "Clear All Data" permanently deletes all import logs and snapshots for all users. This cannot be undone.
        </p>
      </div>

      {/* Last updated */}
      {settings.updatedAt && (
        <p className="text-xs text-slate-400 text-right">
          Last updated {new Date(settings.updatedAt).toLocaleString()} by {settings.updatedBy}
        </p>
      )}
    </div>
  );
}
