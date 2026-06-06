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
import { ASSIGNABLE_ROLES, roleLabel, type AppRole } from '@/lib/roles';
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

// ── DB Health Status ──────────────────────────────────────────────────────────

function DbHealthBadge() {
  const [health, setHealth] = useState<any>(null);
  useEffect(() => {
    fetch('/api/admin/storage/auto-restore').then(r => r.json()).then(setHealth).catch(() => {});
  }, []);
  if (!health) return null;
  return (
    <div className={`flex items-center gap-2 text-[10px] font-bold px-3 py-1.5 rounded-full border ${
      health.healthy ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'
    }`}>
      <span>{health.healthy ? '✓' : '⚠'}</span>
      <span>
        {health.dbExists
          ? `Local DB: ${health.users} user${health.users !== 1 ? 's' : ''} · ${health.imports} import${health.imports !== 1 ? 's' : ''} · ${health.dbSizeKb}KB`
          : 'Local DB: not found — restore from cloud needed'}
      </span>
    </div>
  );
}

// ── Auto-Restore Section ──────────────────────────────────────────────────────

function AutoRestoreSection({ setMsg }: {
  setMsg: (m: { text: string; ok: boolean; cause?: string; fix?: string } | null) => void;
}) {
  const [restoring, setRestoring] = useState(false);
  const [health,    setHealth]    = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/storage/auto-restore').then(r => r.json()).then(setHealth).catch(() => {});
  }, []);

  async function handleAutoRestore(force: boolean) {
    if (!confirm(
      force
        ? 'This will overwrite your current local database with the LATEST backup from the cloud bucket.\n\nAre you sure? This cannot be undone.'
        : 'Restore latest cloud backup to local database?\n\nOnly runs if local database is missing or empty.'
    )) return;

    setRestoring(true);
    setMsg(null);
    try {
      const url = `/api/admin/storage/auto-restore${force ? '?force=true' : ''}`;
      const r   = await fetch(url, { method: 'POST' });
      const d   = await r.json();

      if (d.ok || d.action === 'restored') {
        setMsg({ text: `✓ Restored from cloud: ${d.key ?? ''}. Files: ${d.restored?.join(', ') ?? ''}`, ok: true });
        // Refresh health badge
        fetch('/api/admin/storage/auto-restore').then(r => r.json()).then(setHealth).catch(() => {});
      } else if (d.action === 'skipped') {
        setMsg({ text: `ℹ ${d.reason}`, ok: true });
      } else {
        setMsg({ text: `✗ Auto-restore: ${d.reason ?? d.error}`, ok: false });
      }
    } catch {
      setMsg({ text: 'Auto-restore failed. Check server logs.', ok: false });
    } finally {
      setRestoring(false);
    }
  }

  const dbMissing = health && (!health.dbExists || !health.healthy);

  return (
    <div className={`rounded-xl border p-4 ${dbMissing ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black text-slate-800 mb-1">
            {dbMissing ? '⚠ Local database missing or empty — restore from cloud' : '↺ Disaster Recovery / Auto-restore'}
          </p>
          <p className="text-[10px] text-slate-600 leading-relaxed">
            {dbMissing
              ? 'The local database is empty or missing. Click "Restore from cloud" to download the latest backup from the cloud bucket and restore it automatically.'
              : 'On a fresh server deployment with no database, the app automatically checks the cloud bucket at startup and restores the latest backup. You can also trigger this manually.'
            }
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            <strong>Startup behaviour:</strong> When the server starts with an empty database, it reads the latest backup from your cloud bucket and restores it automatically — no manual action needed.
          </p>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          {dbMissing ? (
            <button type="button" onClick={() => handleAutoRestore(true)} disabled={restoring}
              className="btn-warning px-4 py-2 text-xs font-bold">
              {restoring ? 'Restoring…' : '↺ Restore from cloud'}
            </button>
          ) : (
            <>
              <button type="button" onClick={() => handleAutoRestore(false)} disabled={restoring}
                className="btn-secondary px-4 py-2 text-xs">
                {restoring ? 'Checking…' : '↺ Auto-restore (if empty DB)'}
              </button>
              <button type="button" onClick={() => handleAutoRestore(true)} disabled={restoring}
                className="btn-outline-danger px-4 py-2 text-xs">
                {restoring ? 'Restoring…' : '↺ Force restore (overwrite)'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Cloud Backup List — reads from the active bucket ─────────────────────────

function CloudBackupList({ savedProvider, setMsg }: {
  savedProvider: StorageProviderType;
  setMsg: (m: { text: string; ok: boolean; cause?: string; fix?: string } | null) => void;
}) {
  const [backups,   setBackups]   = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [fetchErr,  setFetchErr]  = useState('');
  const [restoring, setRestoring] = useState<string | null>(null);

  async function loadBackups() {
    setLoading(true); setFetchErr('');
    try {
      const r = await fetch('/api/admin/storage');
      const d = await r.json();
      setBackups(d.backups ?? []);
    } catch {
      setFetchErr('Could not load backup list from the cloud bucket.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadBackups(); }, [savedProvider]);

  async function handleDownload(key: string) {
    try {
      const r = await fetch(`/api/admin/storage/download?key=${encodeURIComponent(key)}`);
      if (!r.ok) {
        const d = await r.json();
        setMsg({ text: `Download failed: ${d.error}`, ok: false });
        return;
      }
      const blob = await r.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = key.split('/').pop() ?? 'backup.json';
      a.click();
      URL.revokeObjectURL(url);
      setMsg({ text: `✓ Downloaded: ${a.download}`, ok: true });
    } catch {
      setMsg({ text: 'Download failed. Check server logs.', ok: false });
    }
  }

  async function handleRestore(key: string) {
    if (!confirm(`Restore from "${key.split('/').pop()}"?\n\nThis will overwrite current database and config files. Make a backup first if needed.`)) return;
    setRestoring(key);
    setMsg(null);
    try {
      const r = await fetch(`/api/admin/storage/download?key=${encodeURIComponent(key)}&restore=true`);
      const d = await r.json();
      if (d.ok) {
        setMsg({ text: `✓ Restored from cloud: ${d.restored?.join(', ')}`, ok: true });
      } else {
        setMsg({ text: `✗ Restore failed: ${d.error ?? 'Unknown error'}`, ok: false });
      }
    } catch {
      setMsg({ text: 'Restore failed. Check server logs.', ok: false });
    } finally {
      setRestoring(null);
    }
  }

  const label = { s3: 'S3', azure: 'Azure', gcp: 'GCP', local: 'Local' }[savedProvider] ?? savedProvider;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-black text-slate-700">
          Cloud Backups in {label} {loading ? '…' : `(${backups.length})`}
        </p>
        <button type="button" onClick={loadBackups} disabled={loading}
          className="text-[10px] font-bold text-blue-600 hover:underline disabled:text-slate-400">
          {loading ? 'Loading…' : '↻ Refresh'}
        </button>
      </div>

      {fetchErr && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-semibold">{fetchErr}</div>
      )}

      {!loading && !fetchErr && backups.length === 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500 text-center">
          No backups found in the {label} bucket yet. Click "Upload backup now" to create the first one.
        </div>
      )}

      {backups.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Filename', 'Size', 'Date', 'Actions'].map(h => (
                  <th key={h} className="py-2.5 px-3 text-[10px] font-black uppercase tracking-wider text-slate-500 text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...backups].sort((a, b) => b.lastModified.localeCompare(a.lastModified)).map((b: any) => {
                const filename = b.key.split('/').pop() ?? b.key;
                const isRestoring = restoring === b.key;
                return (
                  <tr key={b.key} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono text-slate-700 max-w-[220px] truncate" title={b.key}>
                      {filename}
                    </td>
                    <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                      {(b.size / 1024).toFixed(1)} KB
                    </td>
                    <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                      {b.lastModified ? new Date(b.lastModified).toLocaleString() : '—'}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => handleDownload(b.key)}
                          className="text-[10px] font-bold text-blue-600 hover:underline whitespace-nowrap">
                          ↓ Download
                        </button>
                        <span className="text-slate-200">|</span>
                        <button type="button" onClick={() => handleRestore(b.key)} disabled={isRestoring}
                          className="text-[10px] font-bold text-amber-600 hover:underline disabled:opacity-40 whitespace-nowrap">
                          {isRestoring ? 'Restoring…' : '↺ Restore'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Field validation ──────────────────────────────────────────────────────────

function validateFields(provider: StorageProviderType, s3: any, az: any, gcp: any): string | null {
  // Only bucket/container names are required — credentials can come from env vars
  if (provider === 's3'    && !s3.bucket?.trim())            return 'S3: Bucket name is required.';
  if (provider === 'azure' && !az.containerName?.trim())     return 'Azure: Container name is required.';
  if (provider === 'gcp'   && !gcp.bucket?.trim())           return 'GCP: Bucket name is required.';
  if (provider === 'gcp'   && !gcp.projectId?.trim())        return 'GCP: Project ID is required.';
  // Credentials (Connection String, Access Key, Service Account JSON) are optional — env vars work too
  return null;
}

function CloudStorageSettings() {
  const [data,       setData]       = useState<any>(null);
  const [saving,     setSaving]     = useState(false);
  const [testing,    setTesting]    = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [msg,        setMsg]        = useState<{ text: string; ok: boolean; cause?: string; fix?: string; credDiag?: any } | null>(null);
  const [active,     setActive]     = useState<StorageProviderType>('local');
  // editMode = false means provider is locked (saved); true = user is changing
  const [editMode,   setEditMode]   = useState(false);
  const [s3Form,   setS3Form]   = useState({ bucket: '', region: 'us-east-1', prefix: '', endpoint: '', accessKeyId: '', secretAccessKey: '' });
  const [azForm,   setAzForm]   = useState({ containerName: '', connectionString: '', prefix: '' });
  const [gcpForm,  setGcpForm]  = useState({ bucket: '', projectId: '', prefix: '', keyJson: '' });

  // The provider that is actually saved server-side
  const savedProvider: StorageProviderType = data?.settings?.active ?? 'local';
  const savedS3CredentialSources = data?.settings?.s3?.credentialSources;
  const savedS3HasCredentialSource = !!(
    savedS3CredentialSources?.hasFormCredentials ||
    savedS3CredentialSources?.hasEnvCredentials ||
    savedS3CredentialSources?.hasAwsProfile ||
    savedS3CredentialSources?.hasSharedCredentialsFile
  );
  const savedProviderHasCredentialSource = savedProvider !== 's3' || savedS3HasCredentialSource;
  const isLocked = !editMode && savedProvider !== 'local' && savedProviderHasCredentialSource;

  useEffect(() => {
    fetch('/api/admin/storage').then(r => r.json()).then(d => {
      setData(d);
      const svd = d.settings?.active ?? 'local';
      setActive(svd);
      const s3Sources = d.settings?.s3?.credentialSources;
      const s3HasCredentialSource = !!(
        s3Sources?.hasFormCredentials ||
        s3Sources?.hasEnvCredentials ||
        s3Sources?.hasAwsProfile ||
        s3Sources?.hasSharedCredentialsFile
      );
      // Lock only when the saved provider has a visible server-side credential source.
      setEditMode(svd === 'local' || (svd === 's3' && !s3HasCredentialSource));
      if (d.settings?.s3) {
        setS3Form(f => ({
          ...f,
          bucket: d.settings.s3.bucket ?? '',
          region: d.settings.s3.region ?? 'us-east-1',
          prefix: d.settings.s3.prefix ?? '',
          endpoint: d.settings.s3.endpoint ?? '',
        }));
      }
      if (d.settings?.azure) {
        setAzForm(f => ({
          ...f,
          containerName: d.settings.azure.containerName ?? '',
          prefix: d.settings.azure.prefix ?? '',
        }));
      }
      if (d.settings?.gcp) {
        setGcpForm(f => ({
          ...f,
          bucket: d.settings.gcp.bucket ?? '',
          projectId: d.settings.gcp.projectId ?? '',
          prefix: d.settings.gcp.prefix ?? '',
        }));
      }
    }).catch(() => setMsg({ text: 'Failed to load storage settings.', ok: false }));
  }, []);

  // ── Save and lock ───────────────────────────────────────────────────────────

  async function handleSave(): Promise<boolean> {
    const validErr = validateFields(active, s3Form, azForm, gcpForm);
    if (validErr) { setMsg({ text: `⚠ ${validErr}`, ok: false }); return false; }

    setSaving(true); setMsg(null);
    const body: any = { active };
    if (active === 's3') {
      body.s3 = {
        bucket: s3Form.bucket,
        region: s3Form.region,
        prefix: s3Form.prefix,
        endpoint: s3Form.endpoint,
        accessKeyId: s3Form.accessKeyId,
        secretAccessKey: s3Form.secretAccessKey,
      };
    }
    if (active === 'azure') body.azure = azForm;
    if (active === 'gcp')   body.gcp   = gcpForm;
    try {
      const r = await fetch('/api/admin/storage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await r.json();
      if (d.ok) {
        setMsg({ text: '✓ Settings saved.', ok: true });
        const s3HasTypedCredentials = active === 's3' && !!(s3Form.accessKeyId.trim() && s3Form.secretAccessKey.trim());
        setData((prev: any) => ({
          ...prev,
          settings: {
            ...prev?.settings,
            active,
            ...body,
            s3: active === 's3'
              ? {
                bucket: s3Form.bucket,
                region: s3Form.region,
                prefix: s3Form.prefix,
                endpoint: s3Form.endpoint,
                hasCredentials: s3HasTypedCredentials || !!prev?.settings?.s3?.hasCredentials,
                credentialSources: {
                  ...(prev?.settings?.s3?.credentialSources ?? {}),
                  hasFormCredentials: s3HasTypedCredentials || !!prev?.settings?.s3?.credentialSources?.hasFormCredentials,
                },
              }
              : prev?.settings?.s3,
          },
        }));
        setEditMode(active === 's3' && !s3HasTypedCredentials && !savedS3HasCredentialSource);
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
      const saved = isLocked ? true : await handleSave();
      if (!saved) { setTesting(false); return; }
      const r = await fetch('/api/admin/storage?action=test', { method: 'POST' });
      const d = await r.json();
      setMsg(d.ok
        ? { text: '✓ Connection successful!', ok: true }
        : { text: `✗ Connection failed: ${d.error}`, ok: false, cause: d.cause, fix: d.fix, credDiag: d.credDiag });
      if (!d.ok && d.credDiag && !d.credDiag.hasFormCredentials && !d.credDiag.hasEnvCredentials && !d.credDiag.hasAwsProfile && !d.credDiag.hasSharedCredentialsFile) {
        setEditMode(true);
      }
    } catch { setMsg({ text: 'Test failed. Check server logs.', ok: false }); }
    finally { setTesting(false); }
  }

  // ── Upload — saves first, then uploads ────────────────────────────────────

  async function handleUpload() {
    setUploading(true); setMsg(null);
    try {
      const saved = isLocked ? true : await handleSave();
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
      {/* Step header + DB health + Change provider */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-sm font-black text-slate-800 mb-1">Cloud Storage Provider</h3>
          <p className="text-xs text-slate-500">Credentials are stored server-side and never sent to the browser.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <DbHealthBadge />
          {isLocked && (
            <button type="button" onClick={() => { setEditMode(true); setMsg(null); }}
              className="btn-secondary btn-sm shrink-0">
              Change provider
            </button>
          )}
        </div>
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
          {[['Container name *', 'containerName'], ['Folder prefix (optional)', 'prefix']].map(([label, key]) => (
            <div key={key}>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
              <input type="text" value={(azForm as any)[key]} onChange={e => setAzForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
            </div>
          ))}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Connection String (optional)</label>
            <input type="password" value={azForm.connectionString} onChange={e => setAzForm(f => ({ ...f, connectionString: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-[10px] font-bold text-blue-800 mb-1">Connection string is optional</p>
            <p className="text-[10px] text-blue-700 leading-relaxed">
              Leave empty to use the <strong className="font-mono">AZURE_STORAGE_CONNECTION_STRING</strong> environment variable on your server.
              Find it: Azure Portal → Storage account → Access keys → key1 → Connection string.
            </p>
          </div>
        </div>
      )}

      {(!isLocked) && active === 'gcp' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <p className="text-xs font-black text-slate-700 mb-3">Google Cloud Storage Configuration</p>
          {[['Bucket name *', 'bucket'], ['Project ID *', 'projectId'], ['Folder prefix (optional)', 'prefix']].map(([label, key]) => (
            <div key={key}>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
              <input type="text" value={(gcpForm as any)[key]} onChange={e => setGcpForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
            </div>
          ))}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Service Account JSON (optional)</label>
            <textarea value={gcpForm.keyJson} onChange={e => setGcpForm(f => ({ ...f, keyJson: e.target.value }))} rows={4}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-400" placeholder='{"type":"service_account",...}' />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-[10px] font-bold text-blue-800 mb-1">Service Account JSON is optional</p>
            <p className="text-[10px] text-blue-700 leading-relaxed">
              Leave empty to use the <strong className="font-mono">GOOGLE_APPLICATION_CREDENTIALS</strong> environment variable (path to your service account JSON file),
              or Application Default Credentials (gcloud auth, GCE/Cloud Run metadata server).
            </p>
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

      {/* Status message — structured for errors */}
      {msg && (
        <div className={`rounded-xl border text-sm ${msg.ok ? 'bg-green-50 border-green-200 text-green-700 px-4 py-3' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {msg.ok ? (
            <div className="flex items-center gap-2 font-semibold">
              <span>✓</span><span>{msg.text}</span>
            </div>
          ) : (
            <div className="divide-y divide-red-200">
              {/* Error headline */}
              <div className="flex items-start gap-2 px-4 py-3 font-bold">
                <span className="shrink-0 text-red-600">✗</span>
                <span className="text-red-700">{msg.text}</span>
              </div>
              {/* Cause + Fix explanation */}
              {(msg.cause || msg.fix) && (
                <div className="px-4 py-3 space-y-2">
                  {msg.cause && (
                    <div>
                      <p className="text-[11px] font-black text-red-700 uppercase tracking-wider mb-1">Why this happened</p>
                      <pre className="text-xs text-red-600 leading-relaxed whitespace-pre-wrap font-sans">{msg.cause}</pre>
                    </div>
                  )}
                  {msg.fix && (
                    <div>
                      <p className="text-[11px] font-black text-red-700 uppercase tracking-wider mb-1">How to fix it</p>
                      <pre className="text-xs text-red-600 leading-relaxed whitespace-pre-wrap font-sans">{msg.fix}</pre>
                    </div>
                  )}
                  {/* S3 credential source diagnostic */}
                  {msg.credDiag && (
                    <div className="mt-2 pt-2 border-t border-red-200">
                      <p className="text-[11px] font-black text-red-700 uppercase tracking-wider mb-2">AWS credential source check (server-side)</p>
                      <div className="space-y-1">
                        {[
                          { label: 'Credentials in form (accessKeyId + secretAccessKey)', ok: msg.credDiag.hasFormCredentials },
                          { label: 'AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY env vars', ok: msg.credDiag.hasEnvCredentials },
                          { label: 'AWS_PROFILE set', ok: msg.credDiag.hasAwsProfile },
                          { label: '~/.aws/credentials file found', ok: msg.credDiag.hasSharedCredentialsFile },
                        ].map(row => (
                          <div key={row.label} className="flex items-center gap-2">
                            <span className={`text-sm font-black shrink-0 ${row.ok ? 'text-green-600' : 'text-red-500'}`}>
                              {row.ok ? '✓' : '✗'}
                            </span>
                            <span className={`text-[10px] font-mono ${row.ok ? 'text-green-700' : 'text-red-500'}`}>{row.label}</span>
                          </div>
                        ))}
                        {msg.credDiag.awsRegionFromEnv && (
                          <p className="text-[10px] text-slate-500 mt-1">Region from env: {msg.credDiag.awsRegionFromEnv}</p>
                        )}
                      </div>
                      <p className="text-[10px] text-red-500 mt-2 font-semibold">
                        No server-side credential source was found. Set at least one option above, then save and test again.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Step N: Auto-restore from cloud (for disaster recovery) ── */}
      {(savedProvider as string) !== 'local' && (
        <AutoRestoreSection setMsg={setMsg} />
      )}

      {/* ── Cloud backup list — read directly from bucket ── */}
      {(savedProvider as string) !== 'local' && (
        <CloudBackupList savedProvider={savedProvider} setMsg={setMsg} />
      )}
    </div>
  );
}

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  roleLabel: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  importCount: number;
  snapshotCount: number;
}

function UserManagementSettings() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'scrum_master' as AppRole });

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not load users.');
      setUsers(data.users ?? []);
    } catch (error) {
      setMsg({ ok: false, text: error instanceof Error ? error.message : 'Could not load users.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadUsers(); }, []);

  async function createUser() {
    setSaving(true); setMsg(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not create user.');
      setUsers(prev => [data.user, ...prev]);
      setForm({ name: '', email: '', password: '', role: 'scrum_master' });
      setMsg({ ok: true, text: 'User created.' });
    } catch (error) {
      setMsg({ ok: false, text: error instanceof Error ? error.message : 'Could not create user.' });
    } finally {
      setSaving(false);
    }
  }

  async function updateUser(id: string, patch: Partial<Pick<ManagedUser, 'name' | 'role' | 'isActive'>>) {
    setMsg(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...patch }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not update user.');
      setUsers(prev => prev.map(user => user.id === id ? data.user : user));
      setMsg({ ok: true, text: 'User updated.' });
    } catch (error) {
      setMsg({ ok: false, text: error instanceof Error ? error.message : 'Could not update user.' });
    }
  }

  function roleOptionsFor(user?: ManagedUser): AppRole[] {
    return user?.role === 'user' ? ['user', ...ASSIGNABLE_ROLES] : ASSIGNABLE_ROLES;
  }

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div>
          <h3 className="text-sm font-black text-slate-800">Add User</h3>
          <p className="text-xs text-slate-500 mt-1">Admins create accounts and assign the role that controls default views and data scope.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Name"
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
          <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email"
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
          <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Temporary password"
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
          <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as AppRole }))}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400">
            {ASSIGNABLE_ROLES.map(role => <option key={role} value={role}>{roleLabel(role)}</option>)}
          </select>
        </div>
        <button type="button" onClick={createUser} disabled={saving}
          className="btn-primary px-5 py-2 text-sm">{saving ? 'Creating...' : 'Create user'}</button>
      </div>

      {msg && (
        <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${msg.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {msg.text}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-800">Manage Users</h3>
          <button type="button" onClick={loadUsers} disabled={loading}
            className="text-xs font-bold text-blue-600 hover:underline disabled:text-slate-400">{loading ? 'Loading...' : 'Refresh'}</button>
        </div>
        {loading ? (
          <div className="p-5 text-sm text-slate-400 animate-pulse">Loading users...</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {users.map(user => (
              <div key={user.id} className="p-4 grid gap-3 md:grid-cols-[1.2fr_0.9fr_0.8fr_auto] md:items-center">
                <div className="min-w-0">
                  <input value={user.name} onChange={e => setUsers(prev => prev.map(u => u.id === user.id ? { ...u, name: e.target.value } : u))}
                    onBlur={e => updateUser(user.id, { name: e.target.value })}
                    className="w-full text-sm font-black text-slate-800 border border-transparent rounded px-2 py-1 focus:border-blue-300 focus:outline-none" />
                  <p className="text-xs text-slate-500 truncate px-2">{user.email}</p>
                </div>
                <select value={user.role} onChange={e => updateUser(user.id, { role: e.target.value as AppRole })}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400">
                  {roleOptionsFor(user).map(role => <option key={role} value={role}>{roleLabel(role)}</option>)}
                </select>
                <div className="text-xs text-slate-500">
                  <p>{user.importCount} imports</p>
                  <p>{user.snapshotCount} snapshots</p>
                </div>
                <button type="button" onClick={() => updateUser(user.id, { isActive: !user.isActive })}
                  className={`btn-sm px-3 py-1.5 text-xs font-bold rounded-full border ${user.isActive ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                  {user.isActive ? 'Active' : 'Disabled'}
                </button>
              </div>
            ))}
            {users.length === 0 && <div className="p-5 text-sm text-slate-400">No users found.</div>}
          </div>
        )}
      </div>
    </div>
  );
}

type Tab = 'users' | 'retention' | 'thresholds' | 'orphan' | 'backup' | 'cloud' | 'browser';

const ADMIN_TABS: Array<{ id: Tab; label: string; icon: string; description: string }> = [
  { id: 'users',      label: 'User Management',     icon: '👥', description: 'Accounts, roles, access state' },
  { id: 'retention',  label: 'Privacy & Retention', icon: '🔒', description: 'Data windows and cleanup' },
  { id: 'thresholds', label: 'Health Thresholds',   icon: '⚡', description: 'Delivery health rules' },
  { id: 'orphan',     label: 'Orphan Rules',        icon: '👻', description: 'Hierarchy detection rules' },
  { id: 'backup',     label: 'Backup & Restore',    icon: '🗄️', description: 'Local backup bundles' },
  { id: 'cloud',      label: 'Cloud Storage',       icon: '☁️', description: 'S3, Azure, GCP, restore' },
  { id: 'browser',    label: 'Browser Data',        icon: '🗑️', description: 'Client-side cached data' },
];

function activeTabMeta(tab: Tab) {
  return ADMIN_TABS.find(item => item.id === tab) ?? ADMIN_TABS[0];
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [tab, setTab]                 = useState<Tab>('users');
  const [settings, setSettings]       = useState<RetentionSettings | null>(null);
  const [stats, setStats]             = useState<RetentionStats | null>(null);
  const [thresholds, setThresholds]   = useState<HealthThresholds | null>(null);
  const [orphanRules, setOrphanRules]  = useState<OrphanRules | null>(null);
  const [backupFiles, setBackupFiles]  = useState<any[]>([]);
  const [userSummary, setUserSummary]  = useState({ total: 0, active: 0, admins: 0 });
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
          fetch('/api/admin/users').then(r => r.json()),
        ]);
      })
      .then(results => {
        if (!results) return;
        const [retData, thrData, orphData, backData, userData] = results;
        if (retData?.settings)  setSettings(retData.settings);
        if (retData?.stats)     setStats(retData.stats);
        if (thrData?.thresholds) setThresholds(thrData.thresholds);
        if (orphData?.rules) setOrphanRules(orphData.rules);
        if (backData?.files) setBackupFiles(backData.files);
        if (Array.isArray(userData?.users)) {
          setUserSummary({
            total: userData.users.length,
            active: userData.users.filter((user: ManagedUser) => user.isActive).length,
            admins: userData.users.filter((user: ManagedUser) => user.role === 'admin').length,
          });
        }
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

  const activeUsers = userSummary.active;
  const totalUsers = userSummary.total;
  const latestBackup = backupFiles?.some(file => file.included) ? 'Available' : 'Not yet';
  const selectedTab = activeTabMeta(tab);

  return (
    <AppShell showNav>
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-20 self-start rounded-[22px] border border-slate-200 bg-white/90 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="px-2 py-3">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Settings</p>
            </div>
            <nav className="grid gap-2" aria-label="Admin settings navigation">
              {ADMIN_TABS.map(item => {
                const selected = tab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors ${
                      selected ? 'bg-blue-50 text-blue-700 shadow-[inset_4px_0_0_#2563eb]' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-lg shadow-sm">{item.icon}</span>
                    <span className="min-w-0">
                      <span className="block text-sm font-black">{item.label}</span>
                      <span className="block truncate text-[11px] font-semibold text-slate-400">{item.description}</span>
                    </span>
                  </button>
                );
              })}
            </nav>
            <div className="mt-6 grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-green-50 text-sm font-black text-green-600">✓</span>
              <span>
                <strong className="block text-xs text-slate-800">System secure</strong>
                <span className="text-[11px] font-bold text-green-600">Operational</span>
              </span>
              <span className="text-xl text-slate-400">›</span>
            </div>
          </aside>

          <div className="min-w-0">
            <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-700 px-6 py-8 text-white shadow-[0_16px_40px_rgba(15,23,42,0.14)] sm:px-10 sm:py-10">
              <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="mb-3 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-blue-50">Admin Console</p>
                  <h1 className="text-3xl font-black tracking-tight sm:text-5xl">Admin Settings</h1>
                  <p className="mt-3 max-w-2xl text-sm text-blue-50/85 sm:text-base">Manage users, security, data retention, storage, and system behaviour.</p>
                </div>
                <div className="flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold backdrop-blur">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400 shadow-[0_0_0_7px_rgba(34,197,94,0.16)]" />
                  All systems operational
                </div>
              </div>
              <div className="pointer-events-none absolute -right-20 -top-16 h-64 w-64 rounded-full bg-cyan-300/20" />
              <div className="pointer-events-none absolute -bottom-24 right-24 h-72 w-72 rounded-full bg-pink-300/20" />
            </section>

            <section className="relative z-10 mt-[-34px] grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Admin summary">
              {[
                { icon: '👥', label: 'Total Users', value: String(totalUsers), note: 'All accounts', color: 'bg-blue-50 text-blue-700' },
                { icon: '🟢', label: 'Active Users', value: String(activeUsers), note: totalUsers ? `${Math.round((activeUsers / totalUsers) * 100)}% of total` : 'No users yet', color: 'bg-green-50 text-green-700' },
                { icon: '🛡️', label: 'Admins', value: String(userSummary.admins), note: totalUsers ? `${Math.round((userSummary.admins / totalUsers) * 100)}% of total` : 'No users yet', color: 'bg-violet-50 text-violet-700' },
                { icon: '☁️', label: 'Last Backup', value: latestBackup, note: backupFiles?.length ? 'Backup available' : 'No backup found', color: 'bg-orange-50 text-orange-700' },
              ].map(card => (
                <article key={card.label} className="min-h-[132px] rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
                  <div className="flex items-center gap-4">
                    <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-full text-xl ${card.color}`}>{card.icon}</span>
                    <span className="min-w-0">
                      <span className="block text-xs font-black uppercase tracking-wide text-slate-400">{card.label}</span>
                      <strong className="mt-1 block truncate text-xl font-black text-slate-900">{card.value}</strong>
                      <span className="mt-1 block truncate text-xs font-bold text-slate-500">{card.note}</span>
                    </span>
                  </div>
                </article>
              ))}
            </section>

            {error && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}

            <section className="mt-6 rounded-[22px] border border-slate-200 bg-white/90 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur sm:p-6">
              <div className="mb-5 flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl border border-blue-100 bg-blue-50 text-xl text-blue-700">{selectedTab.icon}</span>
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-slate-900">{selectedTab.label}</h2>
                    <p className="mt-1 text-sm text-slate-500">{selectedTab.description}</p>
                  </div>
                </div>
              </div>

              {tab === 'users' && <UserManagementSettings />}
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
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
