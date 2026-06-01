// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import DataRetentionSettings from '@/components/admin/DataRetentionSettings';
import HealthThresholdSettings from '@/components/admin/HealthThresholdSettings';
import type { RetentionSettings, RetentionStats } from '@/types/settings';
import type { HealthThresholds } from '@/types/thresholds';

type Tab = 'retention' | 'thresholds';

export default function AdminSettingsPage() {
  const router = useRouter();
  const [tab, setTab]                 = useState<Tab>('retention');
  const [settings, setSettings]       = useState<RetentionSettings | null>(null);
  const [stats, setStats]             = useState<RetentionStats | null>(null);
  const [thresholds, setThresholds]   = useState<HealthThresholds | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(me => {
        if (!me || me.role !== 'admin') { router.replace('/dashboard'); return; }
        return Promise.all([
          fetch('/api/admin/settings').then(r => r.json()),
          fetch('/api/admin/thresholds').then(r => r.json()),
        ]);
      })
      .then(results => {
        if (!results) return;
        const [retData, thrData] = results;
        if (retData?.settings)  setSettings(retData.settings);
        if (retData?.stats)     setStats(retData.stats);
        if (thrData?.thresholds) setThresholds(thrData.thresholds);
      })
      .catch(() => setError('Failed to load settings.'))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleSaveRetention(updated: RetentionSettings) {
    const res  = await fetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
    const data = await res.json();
    if (data.settings) setSettings(data.settings);
  }

  async function handleSaveThresholds(updated: HealthThresholds) {
    const res  = await fetch('/api/admin/thresholds', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    if (data.thresholds) setThresholds(data.thresholds);
  }

  async function handleCleanup() {
    const res  = await fetch('/api/admin/cleanup', { method: 'POST' });
    const data = await res.json();
    fetch('/api/admin/settings').then(r => r.json()).then(d => { if (d.stats) setStats(d.stats); });
    return data;
  }

  async function handleClearAll() {
    const res  = await fetch('/api/admin/cleanup?action=clear_all', { method: 'POST' });
    const data = await res.json();
    fetch('/api/admin/settings').then(r => r.json()).then(d => { if (d.stats) setStats(d.stats); });
    return data;
  }

  if (loading) return <AppShell showNav><div className="flex items-center justify-center h-64 text-slate-400 animate-pulse">Loading settings…</div></AppShell>;

  return (
    <AppShell showNav>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-900">Admin Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Configure data retention, health thresholds, and system behaviour.</p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 mb-6">{error}</div>}

        {/* Tab bar */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-6">
          {([['retention', '🔒 Privacy & Retention'], ['thresholds', '⚡ Health Thresholds']] as [Tab, string][]).map(([t, label]) => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'retention' && settings && (
          <DataRetentionSettings settings={settings} stats={stats} onSave={handleSaveRetention} onCleanup={handleCleanup} onClearAll={handleClearAll} />
        )}
        {tab === 'thresholds' && thresholds && (
          <HealthThresholdSettings thresholds={thresholds} onSave={handleSaveThresholds} />
        )}
      </div>
    </AppShell>
  );
}
