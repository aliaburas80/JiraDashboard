// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
'use client';
import { useState } from 'react';
import type { RetentionSettings, RetentionStats, RetentionPeriod } from '@/types/settings';

const PERIODS: { value: RetentionPeriod; label: string }[] = [
  { value: 7,   label: '7 days'      },
  { value: 30,  label: '30 days'     },
  { value: 90,  label: '90 days'     },
  { value: 365, label: '1 year'      },
  { value: -1,  label: 'Keep forever' },
];

interface Props {
  settings:   RetentionSettings;
  stats:      RetentionStats | null;
  onSave:     (s: RetentionSettings) => Promise<void>;
  onCleanup:  () => Promise<{ logsDeleted: number; snapshotsDeleted: number }>;
  onClearAll: () => Promise<{ logsDeleted: number; snapshotsDeleted: number }>;
}

function Toggle({ label, description, checked, onChange }: {
  label: string; description: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 last:border-0"
      style={{ borderBottom: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>
      <div>
        <p className="text-sm font-semibold" style={{ color: 'var(--dc-p1, #F2F2F2)' }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--dc-p2, #909090)' }}>{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="relative shrink-0 rounded-full transition-colors"
        style={{
          width: 34,
          height: 18,
          background: checked ? 'var(--dc-acc, #E85D12)' : 'var(--dc-s4, #323232)',
          border: checked ? 'none' : '1px solid var(--dc-bdr2, rgba(255,255,255,0.13))',
        }}
      >
        <span
          className="absolute top-0.5 rounded-full transition-transform"
          style={{
            width: 14,
            height: 14,
            background: checked ? '#fff' : 'var(--dc-p3, #505050)',
            left: 2,
            transform: checked ? 'translateX(16px)' : 'translateX(0)',
          }}
        />
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

      {/* Stat cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Import Logs',    value: stats.totalLogs,         color: 'var(--dc-p1, #F2F2F2)' },
            { label: 'Eligible for Deletion', value: stats.logsEligible,      color: stats.logsEligible > 0 ? 'var(--dc-red, #F87171)' : '#22C55E' },
            { label: 'Total Snapshots',       value: stats.totalSnapshots,    color: 'var(--dc-p1, #F2F2F2)' },
            { label: 'Snapshots Eligible',    value: stats.snapshotsEligible, color: stats.snapshotsEligible > 0 ? 'var(--dc-red, #F87171)' : '#22C55E' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-4"
              style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--dc-p3, #505050)' }}>{s.label}</p>
              <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
          {stats.oldestLogDate && (
            <div className="col-span-2 sm:col-span-4 text-xs text-right" style={{ color: 'var(--dc-p3, #505050)' }}>
              Oldest log: {new Date(stats.oldestLogDate).toLocaleDateString()} ·
              Newest: {stats.newestLogDate ? new Date(stats.newestLogDate).toLocaleDateString() : '—'}
            </div>
          )}
        </div>
      )}

      {/* Storage settings card */}
      <div className="rounded-2xl p-6"
        style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>
        <h3 className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: 'var(--dc-p3, #505050)' }}>Storage Settings</h3>

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
        <div className="mt-5">
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--dc-p1, #F2F2F2)' }}>Retention period</p>
          <div className="flex flex-wrap gap-2">
            {PERIODS.map(p => {
              const active = form.retentionDays === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, retentionDays: p.value }))}
                  className="text-xs font-bold transition-colors"
                  style={active
                    ? { padding: '5px 14px', borderRadius: 100, background: 'rgba(232,93,18,0.12)', border: '1.5px solid rgba(232,93,18,0.3)', color: 'var(--dc-acc2, #FF8A4C)' }
                    : { padding: '5px 14px', borderRadius: 100, background: 'transparent', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))', color: 'var(--dc-p2, #909090)' }
                  }
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          {form.retentionDays !== -1 && (
            <p className="text-xs mt-2 italic" style={{ color: 'var(--dc-p3, #505050)' }}>
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
            className="inline-flex h-[38px] items-center rounded-[9px] px-5 text-sm font-extrabold text-white transition disabled:opacity-50"
            style={{ background: 'var(--dc-acc, #E85D12)' }}
          >
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
          {msg && (
            <span className="text-xs font-semibold" style={{ color: msg.startsWith('✓') ? '#4ade80' : '#fca5a5' }}>{msg}</span>
          )}
        </div>
      </div>

      {/* Cleanup actions */}
      <div className="rounded-2xl p-6"
        style={{ background: 'rgba(232,93,18,0.04)', border: '1px solid rgba(232,93,18,0.12)' }}>
        <h3 className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: 'var(--dc-p3, #505050)' }}>Cleanup Actions</h3>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleCleanup}
            disabled={cleaning || form.retentionDays === -1}
            className="inline-flex h-[38px] items-center rounded-[100px] px-4 text-sm font-extrabold transition disabled:opacity-40"
            style={{ background: 'transparent', border: '1px solid var(--dc-bdr2, rgba(255,255,255,0.13))', color: 'var(--dc-p1, #F2F2F2)' }}
          >
            {cleaning ? 'Running…' : `Apply Retention Policy (${period.label})`}
          </button>

          <button
            type="button"
            onClick={handleClearAll}
            disabled={clearing}
            className="inline-flex h-[38px] items-center gap-1.5 rounded-[100px] px-4 text-sm font-extrabold transition disabled:opacity-50"
            style={confirmClear
              ? { background: 'rgba(248,113,113,0.20)', border: '1px solid rgba(248,113,113,0.40)', color: '#fca5a5' }
              : { background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.20)', color: '#fca5a5' }
            }
          >
            {clearing ? 'Clearing…' : confirmClear ? '⚠ Confirm — Delete ALL data' : 'Clear All Data'}
          </button>

          {confirmClear && (
            <button type="button" onClick={() => setConfirmClear(false)}
              className="inline-flex h-[38px] items-center rounded-[100px] px-4 text-sm font-extrabold transition"
              style={{ background: 'transparent', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))', color: 'var(--dc-p2, #909090)' }}>
              Cancel
            </button>
          )}
        </div>

        <p className="text-xs mt-3 italic" style={{ color: 'var(--dc-p3, #505050)' }}>
          &quot;Clear All Data&quot; permanently deletes all import logs and snapshots for all users. This cannot be undone.
        </p>
      </div>

      {/* Last updated */}
      {settings.updatedAt && (
        <p className="text-xs text-right" style={{ color: 'var(--dc-p3, #505050)' }}>
          Last updated {new Date(settings.updatedAt).toLocaleString()} by {settings.updatedBy}
        </p>
      )}
    </div>
  );
}
