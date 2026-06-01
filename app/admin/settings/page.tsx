// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import DataRetentionSettings from '@/components/admin/DataRetentionSettings';
import type { RetentionSettings, RetentionStats } from '@/types/settings';

export default function AdminSettingsPage() {
  const router = useRouter();
  const [settings, setSettings]   = useState<RetentionSettings | null>(null);
  const [stats, setStats]         = useState<RetentionStats | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(me => {
        if (!me || me.role !== 'admin') { router.replace('/dashboard'); return; }
        return fetch('/api/admin/settings').then(r => r.json());
      })
      .then(data => {
        if (data?.settings) setSettings(data.settings);
        if (data?.stats)    setStats(data.stats);
      })
      .catch(() => setError('Failed to load settings.'))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleSave(updated: RetentionSettings) {
    const res = await fetch('/api/admin/settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    const data = await res.json();
    if (data.settings) setSettings(data.settings);
  }

  async function handleCleanup() {
    const res  = await fetch('/api/admin/cleanup', { method: 'POST' });
    const data = await res.json();
    // refresh stats
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
          <h1 className="text-2xl font-black text-slate-900">Privacy & Data Retention</h1>
          <p className="text-sm text-slate-500 mt-1">
            Control what data is stored, how long it is kept, and manage deletion of logs and snapshots.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 mb-6">{error}</div>
        )}

        {settings && (
          <DataRetentionSettings
            settings={settings}
            stats={stats}
            onSave={handleSave}
            onCleanup={handleCleanup}
            onClearAll={handleClearAll}
          />
        )}
      </div>
    </AppShell>
  );
}
