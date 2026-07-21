// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
'use client';
import { useState } from 'react';
import clsx from 'clsx';
import { SvgIcon } from '@/components/ui/SvgIcon';
import type { RetentionSettings, RetentionStats, RetentionPeriod } from '@/types/settings';
import styles from './DataRetentionSettings.module.scss';

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
    <div className={clsx('flex items-start justify-between', styles.toggleRow)}>
      <div>
        <p className={styles.toggleLabel}>{label}</p>
        <p className={clsx('mt-0.5', styles.toggleDesc)}>{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={styles.toggleSwitch}
        data-checked={checked}
      >
        <span className={styles.toggleKnob} data-checked={checked} />
      </button>
    </div>
  );
}

export default function DataRetentionSettings({ settings, stats, onSave, onCleanup, onClearAll }: Props) {
  const [form, setForm]       = useState<RetentionSettings>({ ...settings });
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState<{ text: string; ok: boolean } | null>(null);
  const [cleaning, setCleaning]   = useState(false);
  const [clearing, setClearing]   = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  async function handleSave() {
    setSaving(true); setMsg(null);
    try {
      await onSave(form);
      setMsg({ text: 'Settings saved.', ok: true });
    } catch { setMsg({ text: 'Failed to save.', ok: false }); }
    finally { setSaving(false); setTimeout(() => setMsg(null), 3000); }
  }

  async function handleCleanup() {
    setCleaning(true); setMsg(null);
    try {
      const r = await onCleanup();
      setMsg({ text: `Deleted ${r.logsDeleted} logs and ${r.snapshotsDeleted} snapshots.`, ok: true });
    } catch { setMsg({ text: 'Cleanup failed.', ok: false }); }
    finally { setCleaning(false); setTimeout(() => setMsg(null), 4000); }
  }

  async function handleClearAll() {
    if (!confirmClear) { setConfirmClear(true); return; }
    setClearing(true); setMsg(null); setConfirmClear(false);
    try {
      const r = await onClearAll();
      setMsg({ text: `Cleared all data: ${r.logsDeleted} logs + ${r.snapshotsDeleted} snapshots deleted.`, ok: true });
    } catch { setMsg({ text: 'Clear failed.', ok: false }); }
    finally { setClearing(false); setTimeout(() => setMsg(null), 5000); }
  }

  const period = PERIODS.find(p => p.value === form.retentionDays) ?? PERIODS[4];

  return (
    <div className="space-y-6">

      {/* Stat cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Import Logs',    value: stats.totalLogs,         tone: 'neutral' as const },
            { label: 'Eligible for Deletion', value: stats.logsEligible,      tone: stats.logsEligible > 0 ? 'alert' as const : 'ok' as const },
            { label: 'Total Snapshots',       value: stats.totalSnapshots,    tone: 'neutral' as const },
            { label: 'Snapshots Eligible',    value: stats.snapshotsEligible, tone: stats.snapshotsEligible > 0 ? 'alert' as const : 'ok' as const },
          ].map(s => (
            <div key={s.label} className={styles.statCard}>
              <p className={styles.statLabel}>{s.label}</p>
              <p className={styles.statValue} data-tone={s.tone}>{s.value}</p>
            </div>
          ))}
          {stats.oldestLogDate && (
            <div className={clsx('col-span-2 sm:col-span-4 text-xs text-right', styles.oldestLogNote)}>
              Oldest log: {new Date(stats.oldestLogDate).toLocaleDateString()} ·
              Newest: {stats.newestLogDate ? new Date(stats.newestLogDate).toLocaleDateString() : '—'}
            </div>
          )}
        </div>
      )}

      {/* Storage settings card */}
      <div className={styles.settingsCard}>
        <h3 className={styles.sectionLabel}>Storage Settings</h3>

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
          <p className={styles.retentionLabel}>Retention period</p>
          <div className="flex flex-wrap gap-2">
            {PERIODS.map(p => {
              const active = form.retentionDays === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, retentionDays: p.value }))}
                  className={clsx('text-xs font-bold transition-colors', styles.periodPill)}
                  data-active={active}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          {form.retentionDays !== -1 && (
            <p className={styles.periodNote}>
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
            className={clsx(
              'inline-flex h-[38px] items-center rounded-[9px] px-5 text-sm font-extrabold text-white transition disabled:opacity-50',
              styles.saveBtn,
            )}
          >
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
          {msg && (
            <span className={clsx('inline-flex items-center gap-1 text-xs font-semibold', styles.saveMsg)} data-ok={msg.ok}>
              <SvgIcon name={msg.ok ? 'checkCircle' : 'warning'} size={12} />
              {msg.text}
            </span>
          )}
        </div>
      </div>

      {/* Cleanup actions */}
      <div className={styles.cleanupCard}>
        <h3 className={styles.sectionLabel}>Cleanup Actions</h3>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleCleanup}
            disabled={cleaning || form.retentionDays === -1}
            className={clsx(
              'inline-flex h-[38px] items-center rounded-[100px] px-4 text-sm font-extrabold transition disabled:opacity-40',
              styles.cleanupBtn,
            )}
          >
            {cleaning ? 'Running…' : `Apply Retention Policy (${period.label})`}
          </button>

          <button
            type="button"
            onClick={handleClearAll}
            disabled={clearing}
            className={clsx(
              'inline-flex h-[38px] items-center gap-1.5 rounded-[100px] px-4 text-sm font-extrabold transition disabled:opacity-50',
              styles.clearBtn,
            )}
            data-confirm={confirmClear}
          >
            {clearing ? 'Clearing…' : confirmClear ? <><SvgIcon name="warning" size={14} /> Confirm — Delete ALL data</> : 'Clear All Data'}
          </button>

          {confirmClear && (
            <button type="button" onClick={() => setConfirmClear(false)}
              className={clsx('inline-flex h-[38px] items-center rounded-[100px] px-4 text-sm font-extrabold transition', styles.cancelBtn)}>
              Cancel
            </button>
          )}
        </div>

        <p className={styles.cleanupNote}>
          &quot;Clear All Data&quot; permanently deletes all import logs and snapshots for all users. This cannot be undone.
        </p>
      </div>

      {/* Last updated */}
      {settings.updatedAt && (
        <p className={clsx('text-xs text-right', styles.lastUpdated)}>
          Last updated {new Date(settings.updatedAt).toLocaleString()} by {settings.updatedBy}
        </p>
      )}
    </div>
  );
}
