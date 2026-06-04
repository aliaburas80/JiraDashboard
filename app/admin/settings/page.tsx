// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import DataRetentionSettings from '@/components/admin/DataRetentionSettings';
import HealthThresholdSettings from '@/components/admin/HealthThresholdSettings';
import OrphanRulesSettings from '@/components/admin/OrphanRulesSettings';
import BackupRestoreSettings from '@/components/admin/BackupRestoreSettings';
import ClearLocalDataPanel from '@/components/admin/ClearLocalDataPanel';
import type { RetentionSettings, RetentionStats } from '@/types/settings';
import type { HealthThresholds } from '@/types/thresholds';
import type { OrphanRules } from '@/types/orphanRules';
import type { StorageProviderType } from '@/types/storage';

// ── Cloud Storage Settings panel ──────────────────────────────────────────────

function CloudStorageSettings() {
  const [data,     setData]     = useState<any>(null);
  const [saving,   setSaving]   = useState(false);
  const [testing,  setTesting]  = useState(false);
  const [uploading,setUploading]= useState(false);
  const [msg,      setMsg]      = useState('');
  const [active,   setActive]   = useState<StorageProviderType>('local');
  const [s3Form,   setS3Form]   = useState({ bucket: '', region: 'us-east-1', prefix: '', endpoint: '', accessKeyId: '', secretAccessKey: '' });
  const [azForm,   setAzForm]   = useState({ containerName: '', connectionString: '', prefix: '' });
  const [gcpForm,  setGcpForm]  = useState({ bucket: '', projectId: '', prefix: '', keyJson: '' });

  useEffect(() => {
    fetch('/api/admin/storage').then(r => r.json()).then(d => {
      setData(d);
      setActive(d.settings?.active ?? 'local');
      if (d.settings?.s3)    setS3Form (f => ({ ...f, ...d.settings.s3 }));
      if (d.settings?.azure) setAzForm (f => ({ ...f, ...d.settings.azure }));
      if (d.settings?.gcp)   setGcpForm(f => ({ ...f, ...d.settings.gcp }));
    }).catch(() => setMsg('Failed to load storage settings.'));
  }, []);

  async function handleSave() {
    setSaving(true); setMsg('');
    const body: any = { active };
    if (active === 's3')    body.s3    = s3Form;
    if (active === 'azure') body.azure = azForm;
    if (active === 'gcp')   body.gcp   = gcpForm;
    try {
      const r = await fetch('/api/admin/storage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await r.json();
      setMsg(d.ok ? '✓ Settings saved.' : `Error: ${d.error}`);
    } catch { setMsg('Save failed.'); }
    finally { setSaving(false); }
  }

  async function handleTest() {
    setTesting(true); setMsg('');
    try {
      const r = await fetch('/api/admin/storage?action=test', { method: 'POST' });
      const d = await r.json();
      setMsg(d.ok ? '✓ Connection successful!' : `Connection failed: ${d.error}`);
    } catch { setMsg('Test failed.'); }
    finally { setTesting(false); }
  }

  async function handleUpload() {
    setUploading(true); setMsg('');
    try {
      const r = await fetch('/api/admin/storage?action=upload', { method: 'POST' });
      const d = await r.json();
      setMsg(d.ok ? `✓ Backup uploaded: ${d.key}` : `Upload failed: ${d.error}`);
    } catch { setMsg('Upload failed.'); }
    finally { setUploading(false); }
  }

  const providers = data?.providers ?? {};
  const TABS: StorageProviderType[] = ['local', 's3', 'azure', 'gcp'];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-black text-slate-800 mb-1">Cloud Storage Provider</h3>
        <p className="text-xs text-slate-500">Choose where backup files are stored. Credentials are encrypted server-side — never sent to the browser.</p>
      </div>

      {/* Provider selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {TABS.map(p => {
          const info = providers[p] ?? { label: p, icon: '💾', description: '' };
          return (
            <button key={p} type="button" onClick={() => setActive(p)}
              className={`p-3 rounded-xl border text-left transition-colors ${active === p ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-300'}`}>
              <div className="text-xl mb-1">{info.icon}</div>
              <div className="text-xs font-black text-slate-800">{info.label}</div>
              <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">{info.description?.slice(0, 60)}</div>
            </button>
          );
        })}
      </div>

      {/* Provider-specific fields */}
      {active === 's3' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <p className="text-xs font-black text-slate-700 mb-3">AWS S3 / S3-compatible Configuration</p>
          {[['Bucket name', 'bucket'], ['Region', 'region'], ['Folder prefix (optional)', 'prefix'], ['Custom endpoint (optional)', 'endpoint']].map(([label, key]) => (
            <div key={key}>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
              <input type="text" value={(s3Form as any)[key]} onChange={e => setS3Form(f => ({ ...f, [key]: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
            </div>
          ))}
          {[['Access Key ID', 'accessKeyId'], ['Secret Access Key', 'secretAccessKey']].map(([label, key]) => (
            <div key={key}>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
              <input type="password" value={(s3Form as any)[key]} onChange={e => setS3Form(f => ({ ...f, [key]: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
            </div>
          ))}
          {!data?.settings?.s3?.hasCredentials && <p className="text-[10px] text-amber-600 font-semibold">⚠ No credentials saved yet. Enter Access Key ID and Secret to enable uploads.</p>}
          {data?.settings?.s3?.hasCredentials && <p className="text-[10px] text-green-600 font-semibold">✓ Credentials are saved (masked for security).</p>}
        </div>
      )}

      {active === 'azure' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <p className="text-xs font-black text-slate-700 mb-3">Azure Blob Storage Configuration</p>
          {[['Container name', 'containerName'], ['Folder prefix (optional)', 'prefix']].map(([label, key]) => (
            <div key={key}>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
              <input type="text" value={(azForm as any)[key]} onChange={e => setAzForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
            </div>
          ))}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Connection String</label>
            <input type="password" value={azForm.connectionString} onChange={e => setAzForm(f => ({ ...f, connectionString: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
          </div>
          {data?.settings?.azure?.hasCredentials && <p className="text-[10px] text-green-600 font-semibold">✓ Connection string saved.</p>}
        </div>
      )}

      {active === 'gcp' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <p className="text-xs font-black text-slate-700 mb-3">Google Cloud Storage Configuration</p>
          {[['Bucket name', 'bucket'], ['Project ID', 'projectId'], ['Folder prefix (optional)', 'prefix']].map(([label, key]) => (
            <div key={key}>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
              <input type="text" value={(gcpForm as any)[key]} onChange={e => setGcpForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
            </div>
          ))}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Service Account JSON (paste contents)</label>
            <textarea value={gcpForm.keyJson} onChange={e => setGcpForm(f => ({ ...f, keyJson: e.target.value }))} rows={4}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-400" placeholder='{"type":"service_account",...}' />
          </div>
          {data?.settings?.gcp?.hasCredentials && <p className="text-[10px] text-green-600 font-semibold">✓ Service account credentials saved.</p>}
        </div>
      )}

      {active === 'local' && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-600">Backups are saved to <code className="font-mono text-xs bg-white border border-slate-200 rounded px-1">data/cloud-backups/</code> on the server. No credentials required.</p>
        </div>
      )}

      {/* SDK install hint */}
      {active !== 'local' && data?.providers?.[active]?.installCmd && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs font-bold text-amber-800 mb-1">SDK required</p>
          <p className="text-xs text-amber-700">Install the SDK on your server before using this provider:</p>
          <code className="block mt-1 text-xs font-mono bg-amber-100 rounded px-2 py-1">{data.providers[active].installCmd}</code>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={handleSave} disabled={saving}
          className="btn-primary px-5 py-2 text-sm">{saving ? 'Saving…' : 'Save settings'}</button>
        {active !== 'local' && (
          <>
            <button type="button" onClick={handleTest} disabled={testing}
              className="btn-secondary px-5 py-2 text-sm">{testing ? 'Testing…' : 'Test connection'}</button>
            <button type="button" onClick={handleUpload} disabled={uploading}
              className="btn-green px-5 py-2 text-sm">{uploading ? 'Uploading…' : 'Upload backup now'}</button>
          </>
        )}
      </div>

      {msg && (
        <p className={`text-sm font-semibold ${msg.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>{msg}</p>
      )}

      {/* Cloud backup list */}
      {active !== 'local' && data?.backups?.length > 0 && (
        <div>
          <p className="text-xs font-black text-slate-700 mb-3">Cloud Backups ({data.backups.length})</p>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead><tr className="bg-slate-50 border-b border-slate-200">
                {['Key / Filename', 'Size', 'Last modified'].map(h => (
                  <th key={h} className="py-2.5 px-3 text-[10px] font-black uppercase tracking-wider text-slate-500 text-left">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {data.backups.map((b: any) => (
                  <tr key={b.key} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono text-slate-700 truncate max-w-[200px]" title={b.key}>{b.key}</td>
                    <td className="py-2 px-3 text-slate-500">{(b.size / 1024).toFixed(1)} KB</td>
                    <td className="py-2 px-3 text-slate-500">{new Date(b.lastModified).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

type Tab = 'retention' | 'thresholds' | 'orphan' | 'backup' | 'cloud' | 'browser';

export default function AdminSettingsPage() {
  const router = useRouter();
  const [tab, setTab]                 = useState<Tab>('retention');
  const [settings, setSettings]       = useState<RetentionSettings | null>(null);
  const [stats, setStats]             = useState<RetentionStats | null>(null);
  const [thresholds, setThresholds]   = useState<HealthThresholds | null>(null);
  const [orphanRules, setOrphanRules]  = useState<OrphanRules | null>(null);
  const [backupFiles, setBackupFiles]  = useState<any[]>([]);
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
          fetch('/api/admin/orphan-rules').then(r => r.json()),
          fetch('/api/admin/backup?info=true').then(r => r.json()),
        ]);
      })
      .then(results => {
        if (!results) return;
        const [retData, thrData, orphData, backData] = results;
        if (retData?.settings)  setSettings(retData.settings);
        if (retData?.stats)     setStats(retData.stats);
        if (thrData?.thresholds) setThresholds(thrData.thresholds);
        if (orphData?.rules) setOrphanRules(orphData.rules);
        if (backData?.files) setBackupFiles(backData.files);
      })
      .catch(() => setError('Failed to load settings.'))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleSaveRetention(updated: RetentionSettings) {
    const res  = await fetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
    const data = await res.json();
    if (data.settings) setSettings(data.settings);
  }

  async function handleSaveOrphanRules(updated: OrphanRules) {
    const res  = await fetch('/api/admin/orphan-rules', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    if (data.rules) setOrphanRules(data.rules);
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
        <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-xl mb-6">
          {([['retention', '🔒 Privacy & Retention'], ['thresholds', '⚡ Health Thresholds'], ['orphan', '👻 Orphan Rules'], ['backup', '💾 Backup & Restore'], ['cloud', '☁️ Cloud Storage'], ['browser', '🗑️ Browser Data']] as [Tab, string][]).map(([t, label]) => (
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
        {tab === 'orphan' && orphanRules && (
          <OrphanRulesSettings rules={orphanRules} onSave={handleSaveOrphanRules} />
        )}
        {tab === 'backup' && (
          <BackupRestoreSettings files={backupFiles} />
        )}
        {tab === 'cloud' && <CloudStorageSettings />}
        {tab === 'browser' && (
          <ClearLocalDataPanel />
        )}
      </div>
    </AppShell>
  );
}
