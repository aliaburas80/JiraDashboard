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

// ── Connection guide — step-by-step per provider ─────────────────────────────

const CONNECTION_GUIDES: Record<string, { title: string; steps: { heading: string; body: string; code?: string }[] }> = {
  s3: {
    title: 'How to connect to AWS S3',
    steps: [
      {
        heading: '1. Create an S3 Bucket',
        body: 'Log in to the AWS Console → S3 → Create bucket. Choose a unique name and region closest to your server. Keep "Block all public access" enabled.',
      },
      {
        heading: '2. Create an IAM User',
        body: 'Go to IAM → Users → Create user. Attach the policy below (or AmazonS3FullAccess for quick setup). Generate an Access Key — copy both the Key ID and Secret.',
        code: `{
  "Effect": "Allow",
  "Action": ["s3:PutObject","s3:GetObject","s3:ListBucket","s3:DeleteObject"],
  "Resource": ["arn:aws:s3:::YOUR-BUCKET","arn:aws:s3:::YOUR-BUCKET/*"]
}`,
      },
      {
        heading: '3. Enter credentials — or skip them entirely',
        body: 'Paste the Bucket name and Region (e.g. us-east-1). For the Access Key ID and Secret: you can leave them EMPTY if your server already has AWS credentials configured via environment variables (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY), a shared credentials file (~/.aws/credentials), or an IAM instance role (EC2/ECS). The SDK will find them automatically. Only enter keys here if you want to use a specific IAM user.',
      },
      {
        heading: '4. S3-compatible providers (MinIO / Backblaze / Cloudflare R2)',
        body: 'Fill in the same fields. Set the Custom Endpoint to your provider\'s S3-compatible URL (e.g. https://s3.eu-central-003.backblazeb2.com or https://<account>.r2.cloudflarestorage.com).',
      },
      {
        heading: '5. Test and save',
        body: 'Click Save settings → Test connection. A green "Connection successful" confirms the credentials are correct. Then click Upload backup now to push the first backup.',
      },
    ],
  },
  azure: {
    title: 'How to connect to Azure Blob Storage',
    steps: [
      {
        heading: '1. Create a Storage Account',
        body: 'Azure Portal → Storage accounts → Create. Choose a region, select Standard / LRS. Note the storage account name.',
      },
      {
        heading: '2. Create a Container',
        body: 'Inside the storage account → Containers → + Container. Give it a name (e.g. delivery-clarity-backups). Set access level to Private.',
      },
      {
        heading: '3. Get the Connection String',
        body: 'Storage account → Access keys → key1 → Connection string → Copy. This single string contains all credentials — paste it into the Connection String field above.',
      },
      {
        heading: '4. Install the Azure SDK on your server',
        code: 'npm install @azure/storage-blob',
        body: 'Run this on the server where Delivery Clarity is hosted, then restart the app.',
      },
      {
        heading: '5. Test and save',
        body: 'Enter the Container name and Connection string above → Save settings → Test connection → Upload backup now.',
      },
    ],
  },
  gcp: {
    title: 'How to connect to Google Cloud Storage',
    steps: [
      {
        heading: '1. Create a GCS Bucket',
        body: 'Google Cloud Console → Cloud Storage → Buckets → Create. Choose a name, region, and Standard storage class.',
      },
      {
        heading: '2. Create a Service Account',
        body: 'IAM & Admin → Service Accounts → Create. Give it a name. Grant the role Storage Object Admin (or Storage Object Creator + Viewer for least privilege).',
      },
      {
        heading: '3. Download the Service Account JSON key',
        body: 'Service Account → Keys → Add Key → Create new key → JSON. This downloads a .json file. Open it and paste the entire contents into the Service Account JSON field above.',
      },
      {
        heading: '4. Install the GCP SDK on your server',
        code: 'npm install @google-cloud/storage',
        body: 'Run this on the server where Delivery Clarity is hosted, then restart the app.',
      },
      {
        heading: '5. Test and save',
        body: 'Enter Bucket name, Project ID, paste the Service Account JSON → Save → Test connection → Upload backup now.',
      },
    ],
  },
};

function ConnectionGuide({ provider, installCmd }: { provider: string; installCmd: string }) {
  const [open, setOpen] = useState(false);
  const guide = CONNECTION_GUIDES[provider];
  if (!guide) return null;

  return (
    <div className="border border-blue-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 hover:bg-blue-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">📋</span>
          <span className="text-xs font-black text-blue-800">{guide.title}</span>
        </div>
        <svg viewBox="0 0 24 24" className={`w-4 h-4 fill-current text-blue-600 transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="m7 9 5 5 5-5 1.4 1.4L12 16.8 5.6 10.4 7 9Z"/>
        </svg>
      </button>

      {open && (
        <div className="bg-white border-t border-blue-100 px-5 py-4 space-y-4">
          {installCmd && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-[10px] font-black text-amber-800 uppercase tracking-wider mb-1">SDK required — run on your server first</p>
              <code className="text-xs font-mono text-amber-700 block">{installCmd}</code>
            </div>
          )}
          {guide.steps.map((step, i) => (
            <div key={i}>
              <p className="text-xs font-black text-slate-800 mb-1">{step.heading}</p>
              <p className="text-xs text-slate-600 leading-relaxed">{step.body}</p>
              {step.code && (
                <pre className="mt-2 text-[10px] font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 overflow-x-auto text-slate-700 whitespace-pre-wrap">{step.code}</pre>
              )}
            </div>
          ))}
          <a
            href={provider === 's3' ? 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/GetStartedWithS3.html'
              : provider === 'azure' ? 'https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blobs-introduction'
              : 'https://cloud.google.com/storage/docs/introduction'}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
          >
            Official documentation →
          </a>
        </div>
      )}
    </div>
  );
}

// ── Cloud Storage Settings panel ──────────────────────────────────────────────

// ── Field validation ──────────────────────────────────────────────────────────

function validateFields(provider: StorageProviderType, s3: any, az: any, gcp: any): string | null {
  if (provider === 's3'    && !s3.bucket?.trim())               return 'S3: Bucket name is required.';
  if (provider === 'azure' && !az.containerName?.trim())        return 'Azure: Container name is required.';
  if (provider === 'azure' && !az.connectionString?.trim())     return 'Azure: Connection string is required.';
  if (provider === 'gcp'   && !gcp.bucket?.trim())              return 'GCP: Bucket name is required.';
  if (provider === 'gcp'   && !gcp.projectId?.trim())           return 'GCP: Project ID is required.';
  if (provider === 'gcp'   && !gcp.keyJson?.trim())             return 'GCP: Service Account JSON is required.';
  return null;
}

function CloudStorageSettings() {
  const [data,       setData]       = useState<any>(null);
  const [saving,     setSaving]     = useState(false);
  const [testing,    setTesting]    = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [msg,        setMsg]        = useState<{ text: string; ok: boolean } | null>(null);
  const [active,     setActive]     = useState<StorageProviderType>('local');
  // editMode = false means provider is locked (saved); true = user is changing
  const [editMode,   setEditMode]   = useState(false);
  const [s3Form,   setS3Form]   = useState({ bucket: '', region: 'us-east-1', prefix: '', endpoint: '', accessKeyId: '', secretAccessKey: '' });
  const [azForm,   setAzForm]   = useState({ containerName: '', connectionString: '', prefix: '' });
  const [gcpForm,  setGcpForm]  = useState({ bucket: '', projectId: '', prefix: '', keyJson: '' });

  // The provider that is actually saved server-side
  const savedProvider: StorageProviderType = data?.settings?.active ?? 'local';
  const isLocked = !editMode && savedProvider !== 'local';

  useEffect(() => {
    fetch('/api/admin/storage').then(r => r.json()).then(d => {
      setData(d);
      const svd = d.settings?.active ?? 'local';
      setActive(svd);
      // Lock to saved provider on initial load (unless it's local)
      setEditMode(svd === 'local');
      if (d.settings?.s3)    setS3Form (f => ({ ...f, ...d.settings.s3 }));
      if (d.settings?.azure) setAzForm (f => ({ ...f, ...d.settings.azure }));
      if (d.settings?.gcp)   setGcpForm(f => ({ ...f, ...d.settings.gcp }));
    }).catch(() => setMsg({ text: 'Failed to load storage settings.', ok: false }));
  }, []);

  // ── Save and lock ───────────────────────────────────────────────────────────

  async function handleSave(): Promise<boolean> {
    const validErr = validateFields(active, s3Form, azForm, gcpForm);
    if (validErr) { setMsg({ text: `⚠ ${validErr}`, ok: false }); return false; }

    setSaving(true); setMsg(null);
    const body: any = { active };
    if (active === 's3')    body.s3    = s3Form;
    if (active === 'azure') body.azure = azForm;
    if (active === 'gcp')   body.gcp   = gcpForm;
    try {
      const r = await fetch('/api/admin/storage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await r.json();
      if (d.ok) {
        setMsg({ text: '✓ Settings saved.', ok: true });
        setData((prev: any) => ({ ...prev, settings: { ...prev?.settings, active, ...body } }));
        setEditMode(false); // lock to this provider
        return true;
      }
      setMsg({ text: `Save failed: ${d.error}`, ok: false });
      return false;
    } catch { setMsg({ text: 'Save failed. Please try again.', ok: false }); return false; }
    finally { setSaving(false); }
  }

  // ── Test — saves first, then tests ─────────────────────────────────────────

  async function handleTest() {
    setTesting(true); setMsg(null);
    try {
      const saved = await handleSave();
      if (!saved) { setTesting(false); return; }
      const r = await fetch('/api/admin/storage?action=test', { method: 'POST' });
      const d = await r.json();
      setMsg(d.ok ? { text: '✓ Connection successful!', ok: true } : { text: `✗ Connection failed: ${d.error}`, ok: false });
    } catch { setMsg({ text: 'Test failed. Check server logs.', ok: false }); }
    finally { setTesting(false); }
  }

  // ── Upload — saves first, then uploads ────────────────────────────────────

  async function handleUpload() {
    setUploading(true); setMsg(null);
    try {
      const saved = await handleSave();
      if (!saved) { setUploading(false); return; }
      const r = await fetch('/api/admin/storage?action=upload', { method: 'POST' });
      const d = await r.json();
      setMsg(d.ok ? { text: `✓ Backup uploaded to ${active}: ${d.key}`, ok: true } : { text: `✗ Upload failed: ${d.error}`, ok: false });
    } catch { setMsg({ text: 'Upload failed. Check server logs.', ok: false }); }
    finally { setUploading(false); }
  }

  const providers = data?.providers ?? {};
  const TABS: StorageProviderType[] = ['local', 's3', 'azure', 'gcp'];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-slate-800 mb-1">Cloud Storage Provider</h3>
          <p className="text-xs text-slate-500">Credentials are stored server-side and never sent to the browser.</p>
        </div>
        {isLocked && (
          <button type="button" onClick={() => { setEditMode(true); setMsg(null); }}
            className="btn-secondary btn-sm shrink-0">
            Change provider
          </button>
        )}
      </div>

      {/* Active provider badge when locked */}
      {isLocked && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <span className="text-lg">{providers[savedProvider]?.icon ?? '☁️'}</span>
          <div>
            <p className="text-xs font-black text-green-800">Active: {providers[savedProvider]?.label ?? savedProvider}</p>
            <p className="text-[10px] text-green-600 font-semibold">Click "Change provider" above to switch to a different provider.</p>
          </div>
        </div>
      )}

      {/* Provider selector — disabled when locked */}
      {(!isLocked) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TABS.map(p => {
            const info = providers[p] ?? { label: p, icon: '💾', description: '' };
            return (
              <button key={p} type="button" onClick={() => { setActive(p); setMsg(null); }}
                className={`p-3 rounded-xl border text-left transition-colors ${active === p ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-300'}`}>
                <div className="text-xl mb-1">{info.icon}</div>
                <div className="text-xs font-black text-slate-800">{info.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">{info.description?.slice(0, 60)}</div>
              </button>
            );
          })}
        </div>
      )}

      {/* Provider-specific credential forms — only shown when not locked or editing */}
      {(!isLocked) && active === 's3' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <p className="text-xs font-black text-slate-700 mb-3">AWS S3 / S3-compatible Configuration</p>
          {[
            ['Bucket name *', 'bucket', false],
            ['Region', 'region', false],
            ['Folder prefix (optional)', 'prefix', false],
            ['Custom endpoint (optional)', 'endpoint', false],
          ].map(([label, key]) => (
            <div key={String(key)}>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{String(label)}</label>
              <input type="text" value={(s3Form as any)[String(key)]} onChange={e => setS3Form(f => ({ ...f, [String(key)]: e.target.value }))}
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-[10px] font-bold text-blue-800 mb-1">Credentials are optional for S3</p>
            <p className="text-[10px] text-blue-700 leading-relaxed">
              Leave Access Key ID and Secret empty to use the <strong>AWS default credential chain</strong> (env vars
              <code className="font-mono"> AWS_ACCESS_KEY_ID</code>/<code className="font-mono">AWS_SECRET_ACCESS_KEY</code>,
              <code className="font-mono"> ~/.aws/credentials</code>, or IAM instance role).
            </p>
          </div>
        </div>
      )}

      {(!isLocked) && active === 'azure' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <p className="text-xs font-black text-slate-700 mb-3">Azure Blob Storage Configuration</p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-2">
            <p className="text-[10px] font-bold text-red-700">All fields marked * are required to connect.</p>
          </div>
          {[['Container name *', 'containerName'], ['Folder prefix (optional)', 'prefix']].map(([label, key]) => (
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

      {(!isLocked) && active === 'gcp' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <p className="text-xs font-black text-slate-700 mb-3">Google Cloud Storage Configuration</p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-2">
            <p className="text-[10px] font-bold text-red-700">All fields marked * are required to connect.</p>
          </div>
          {[['Bucket name *', 'bucket'], ['Project ID *', 'projectId'], ['Folder prefix (optional)', 'prefix']].map(([label, key]) => (
            <div key={key}>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
              <input type="text" value={(gcpForm as any)[key]} onChange={e => setGcpForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
            </div>
          ))}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Service Account JSON * (paste contents)</label>
            <textarea value={gcpForm.keyJson} onChange={e => setGcpForm(f => ({ ...f, keyJson: e.target.value }))} rows={4}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-400" placeholder='{"type":"service_account",...}' />
          </div>
        </div>
      )}

      {(!isLocked) && active === 'local' && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-600">Backups are saved to <code className="font-mono text-xs bg-white border border-slate-200 rounded px-1">data/cloud-backups/</code> on the server. No credentials required.</p>
        </div>
      )}

      {/* How-to guide */}
      {(!isLocked) && active !== 'local' && <ConnectionGuide provider={active} installCmd={data?.providers?.[active]?.installCmd ?? ''} />}

      {/* Actions */}
      {(!isLocked) && (
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={handleSave} disabled={saving}
            className="btn-primary px-5 py-2 text-sm">{saving ? 'Saving…' : 'Save settings'}</button>
          {active !== 'local' && (
            <>
              <button type="button" onClick={handleTest} disabled={testing || saving}
                className="btn-secondary px-5 py-2 text-sm">{testing ? 'Testing…' : 'Test connection'}</button>
              <button type="button" onClick={handleUpload} disabled={uploading || saving}
                className="btn-green px-5 py-2 text-sm">{uploading ? 'Uploading…' : 'Upload backup now'}</button>
            </>
          )}
        </div>
      )}
      {isLocked && (savedProvider as string) !== 'local' && (
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={handleTest} disabled={testing}
            className="btn-secondary px-5 py-2 text-sm">{testing ? 'Testing…' : 'Test connection'}</button>
          <button type="button" onClick={handleUpload} disabled={uploading}
            className="btn-green px-5 py-2 text-sm">{uploading ? 'Uploading…' : 'Upload backup now'}</button>
        </div>
      )}

      {/* Status message */}
      {msg && (
        <div className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${msg.ok ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          <span className="shrink-0">{msg.ok ? '✓' : '✗'}</span>
          <span>{msg.text}</span>
        </div>
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
