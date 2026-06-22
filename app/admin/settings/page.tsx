// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import DataRetentionSettings from '@/components/admin/DataRetentionSettings';
import HealthThresholdSettings from '@/components/admin/HealthThresholdSettings';
import OrphanRulesSettings from '@/components/admin/OrphanRulesSettings';
import IssueTypeHierarchySettings from '@/components/admin/IssueTypeHierarchySettings';
import BackupRestoreSettings from '@/components/admin/BackupRestoreSettings';
import ClearLocalDataPanel from '@/components/admin/ClearLocalDataPanel';
import UserAddRequestsPanel from '@/components/admin/UserAddRequestsPanel';
import JiraConnectionsPanel from '@/components/admin/JiraConnectionsPanel';
import AppConfigPanel from '@/components/admin/AppConfigPanel';
import { AdminConsoleLayout } from '@/components/admin/AdminConsoleLayout';
import ConfirmDeleteDialog from '@/components/ui/ConfirmDeleteDialog';
import { SvgIcon } from '@/components/ui/SvgIcon';
import { ASSIGNABLE_ROLES, roleLabel, type AppRole } from '@/lib/roles';
import {
  type Tab, type ManagedUser,
  ADMIN_TABS, activeTabMeta, buildSettingsStats,
  roleOptionsFor, matchesUserFilter,
} from '@/lib/adminConsole';
import type { RetentionSettings, RetentionStats } from '@/types/settings';
import type { HealthThresholds } from '@/types/thresholds';
import type { OrphanRules } from '@/types/orphanRules';
import type { IssueTypeDefinition, IssueTypeHierarchyConfig } from '@/types/issueTypeHierarchy';
import type { StorageProviderType } from '@/types/storage';
import styles from './page.module.scss';

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
          <SvgIcon name="clipboard" size={16} />
          <span className="text-xs font-black text-blue-800">{guide.title}</span>
        </div>
        <SvgIcon name="chevronDown" size={16} className={`text-blue-600 transition-transform ${open ? 'rotate-180' : ''}`} />
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
      <SvgIcon name={health.healthy ? 'check' : 'warning'} size={11} />
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
        setMsg({ text: `Restored from cloud: ${d.key ?? ''}. Files: ${d.restored?.join(', ') ?? ''}`, ok: true });
        // Refresh health badge
        fetch('/api/admin/storage/auto-restore').then(r => r.json()).then(setHealth).catch(() => {});
      } else if (d.action === 'skipped') {
        setMsg({ text: d.reason, ok: true });
      } else {
        setMsg({ text: `Auto-restore: ${d.reason ?? d.error}`, ok: false });
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
            <span className="inline-flex items-center gap-1.5">
              <SvgIcon name={dbMissing ? 'warning' : 'refresh'} size={12} />
              {dbMissing ? 'Local database missing or empty — restore from cloud' : 'Disaster Recovery / Auto-restore'}
            </span>
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
              {restoring ? 'Restoring…' : <><SvgIcon name="refresh" size={12} /> Restore from cloud</>}
            </button>
          ) : (
            <>
              <button type="button" onClick={() => handleAutoRestore(false)} disabled={restoring}
                className="btn-secondary px-4 py-2 text-xs">
                {restoring ? 'Checking…' : <><SvgIcon name="refresh" size={12} /> Auto-restore (if empty DB)</>}
              </button>
              <button type="button" onClick={() => handleAutoRestore(true)} disabled={restoring}
                className="btn-outline-danger px-4 py-2 text-xs">
                {restoring ? 'Restoring…' : <><SvgIcon name="refresh" size={12} /> Force restore (overwrite)</>}
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
      setMsg({ text: `Downloaded: ${a.download}`, ok: true });
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
        setMsg({ text: `Restored from cloud: ${d.restored?.join(', ')}`, ok: true });
      } else {
        setMsg({ text: `Restore failed: ${d.error ?? 'Unknown error'}`, ok: false });
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
          No backups found in the {label} bucket yet. Click &quot;Upload backup now&quot; to create the first one.
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
                          {isRestoring ? 'Restoring…' : <><SvgIcon name="refresh" size={12} /> Restore</>}
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
    if (validErr) { setMsg({ text: validErr, ok: false }); return false; }

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
        setMsg({ text: 'Settings saved.', ok: true });
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
        ? { text: 'Connection successful!', ok: true }
        : { text: `Connection failed: ${d.error}`, ok: false, cause: d.cause, fix: d.fix, credDiag: d.credDiag });
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
      setMsg(d.ok ? { text: `Backup uploaded to ${active}: ${d.key}`, ok: true } : { text: `Upload failed: ${d.error}`, ok: false });
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
          <SvgIcon name={providers[savedProvider]?.icon ?? 'cloud'} size={18} />
          <div>
            <p className="text-xs font-black text-green-800">Active: {providers[savedProvider]?.label ?? savedProvider}</p>
            <p className="text-[10px] text-green-600 font-semibold">Click &quot;Change provider&quot; above to switch to a different provider.</p>
          </div>
        </div>
      )}

      {/* Provider selector — disabled when locked */}
      {(!isLocked) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TABS.map(p => {
            const info = providers[p] ?? { label: p, icon: 'database', description: '' };
            return (
              <button key={p} type="button" onClick={() => { setActive(p); setMsg(null); }}
                className={`p-3 rounded-xl border text-left transition-colors ${active === p ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-300'}`}>
                <SvgIcon name={info.icon} size={20} className="mb-1 text-slate-600" />
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
              <SvgIcon name="checkCircle" size={14} /><span>{msg.text}</span>
            </div>
          ) : (
            <div className="divide-y divide-red-200">
              {/* Error headline */}
              <div className="flex items-start gap-2 px-4 py-3 font-bold">
                <SvgIcon name="cross" size={14} className="shrink-0 text-red-600" />
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
                              <SvgIcon name={row.ok ? 'check' : 'cross'} size={13} />
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

function UserManagementSettings({ onUsersChange }: { onUsersChange: (users: ManagedUser[]) => void }) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<AppRole | 'all'>('all');
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'scrum_master' as AppRole });

  // ── Multi-select state ──────────────────────────────────────────────────────
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkRole, setBulkRole] = useState<AppRole>('scrum_master');
  const [bulkApplying, setBulkApplying] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);

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
  useEffect(() => { onUsersChange(users); }, [onUsersChange, users]); // keep parent stat cards in sync

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

  async function deleteUser() {
    if (!deleteTarget) return;
    setDeleting(true); setMsg(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not delete user.');
      setUsers(prev => prev.filter(user => user.id !== deleteTarget.id));
      setDeleteTarget(null);
      setMsg({ ok: true, text: 'User deleted.' });
    } catch (error) {
      setMsg({ ok: false, text: error instanceof Error ? error.message : 'Could not delete user.' });
    } finally {
      setDeleting(false);
    }
  }

  const filteredUsers = users.filter(user => matchesUserFilter(user, query, roleFilter));

  // Clear selection when filters change
  useEffect(() => { setSelected(new Set()); }, [query, roleFilter]);

  // Drive the select-all checkbox indeterminate state
  useEffect(() => {
    if (!selectAllRef.current || filteredUsers.length === 0) return;
    const anySelected = filteredUsers.some(u => selected.has(u.id));
    const allSelected = filteredUsers.every(u => selected.has(u.id));
    selectAllRef.current.indeterminate = anySelected && !allSelected;
  }, [selected, filteredUsers]);

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    const allSelected = filteredUsers.every(u => selected.has(u.id));
    setSelected(allSelected ? new Set() : new Set(filteredUsers.map(u => u.id)));
  }

  async function bulkUpdateRole() {
    const ids = filteredUsers.filter(u => selected.has(u.id)).map(u => u.id);
    if (ids.length === 0) return;
    setBulkApplying(true); setMsg(null);
    let failed = 0;
    for (const id of ids) {
      try {
        const res = await fetch('/api/admin/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, role: bulkRole }),
        });
        const data = await res.json();
        if (res.ok) {
          setUsers(prev => prev.map(u => u.id === id ? data.user : u));
        } else {
          failed++;
        }
      } catch { failed++; }
    }
    setBulkApplying(false);
    setSelected(new Set());
    setMsg(failed === 0
      ? { ok: true,  text: `Role updated for ${ids.length} user${ids.length !== 1 ? 's' : ''}.` }
      : { ok: false, text: `${failed} update${failed !== 1 ? 's' : ''} failed.` });
  }

  async function bulkDeleteUsers() {
    const ids = filteredUsers.filter(u => selected.has(u.id)).map(u => u.id);
    if (ids.length === 0) return;
    setBulkDeleting(true); setMsg(null);
    let failed = 0;
    for (const id of ids) {
      try {
        const res = await fetch('/api/admin/users', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });
        if (res.ok) {
          setUsers(prev => prev.filter(u => u.id !== id));
        } else {
          failed++;
        }
      } catch { failed++; }
    }
    setBulkDeleting(false);
    setShowBulkDeleteConfirm(false);
    setSelected(new Set());
    setMsg(failed === 0
      ? { ok: true,  text: `${ids.length} user${ids.length !== 1 ? 's' : ''} deleted.` }
      : { ok: false, text: `${failed} deletion${failed !== 1 ? 's' : ''} failed.` });
  }

  return (
    <div className="space-y-6">
      {deleteTarget && (
        <ConfirmDeleteDialog
          title="Delete user?"
          message={`This removes ${deleteTarget.name} from the account and their access will stop immediately.`}
          confirmLabel="Delete user"
          onConfirm={deleteUser}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}

      {showBulkDeleteConfirm && (
        <ConfirmDeleteDialog
          title={`Delete ${selected.size} user${selected.size !== 1 ? 's' : ''}?`}
          message={`This permanently removes ${selected.size} user${selected.size !== 1 ? 's' : ''} from the account. All their access will stop immediately. This cannot be undone.`}
          confirmLabel={`Delete ${selected.size} user${selected.size !== 1 ? 's' : ''}`}
          onConfirm={bulkDeleteUsers}
          onCancel={() => setShowBulkDeleteConfirm(false)}
          loading={bulkDeleting}
        />
      )}

      {/* ── Add User form ── */}
      <section className={styles.formSection}>
        <div className={styles.formSectionHeader}>
          <span className={styles.formIconWrap}><SvgIcon name="person" size={16} /></span>
          <div>
            <h3 className={styles.formTitle}>Add User</h3>
            <p className={styles.formSubtitle}>Create a new user account and assign a role.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className={styles.fieldLabel}>
            Full Name
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Enter full name"
              className={styles.formInput} />
          </label>
          <label className={styles.fieldLabel}>
            Email Address
            <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Enter email address"
              className={styles.formInput} />
          </label>
          <label className={styles.fieldLabel}>
            Temporary Password
            <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Enter temporary password"
              className={styles.formInput} />
          </label>
          <label className={styles.fieldLabel}>
            Role
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as AppRole }))}
              className={styles.formInput}>
              {ASSIGNABLE_ROLES.map(role => <option key={role} value={role}>{roleLabel(role)}</option>)}
            </select>
          </label>
        </div>

        <div className={styles.formFooter}>
          <button type="button" onClick={createUser} disabled={saving} className={styles.createBtn}>
            {saving ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </section>

      {/* ── Status message ── */}
      {msg && (
        <div className={clsx(styles.statusMsg, msg.ok ? styles['statusMsg--ok'] : styles['statusMsg--err'])}>
          {msg.text}
        </div>
      )}

      {/* ── User table ── */}
      <section className={styles.tableSection}>
        <div className={styles.tableSectionHeader}>
          <div>
            <h3 className={styles.tableTitle}>User Management</h3>
            <p className={styles.tableSubtitle}>View and manage all users in your account.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative block">
              <span className={styles.searchIconWrap}>⌕</span>
              <input value={query} onChange={e => setQuery(e.target.value)} type="search" placeholder="Search users"
                className={styles.searchInput} />
            </label>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as AppRole | 'all')}
              className={styles.roleSelect}>
              <option value="all">All roles</option>
              {roleOptionsFor().map(role => <option key={role} value={role}>{roleLabel(role)}</option>)}
            </select>
            <button type="button" onClick={loadUsers} disabled={loading} className={styles.refreshBtn}>
              {loading ? 'Loading...' : '↻ Refresh'}
            </button>
          </div>
        </div>

        {/* Bulk action bar — visible only when rows are selected */}
        {selected.size > 0 && (
          <div className={styles.bulkBar}>
            <span className={styles.bulkCount}>
              {selected.size} user{selected.size !== 1 ? 's' : ''} selected
            </span>
            <div className={styles.bulkActions}>
              <select
                value={bulkRole}
                onChange={e => setBulkRole(e.target.value as AppRole)}
                className={styles.bulkRoleSelect}
              >
                {ASSIGNABLE_ROLES.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
              </select>
              <button
                type="button"
                onClick={bulkUpdateRole}
                disabled={bulkApplying}
                className={styles.bulkRoleBtn}
              >
                {bulkApplying ? '...' : '✎'} Change role
              </button>
              <button
                type="button"
                onClick={() => setShowBulkDeleteConfirm(true)}
                disabled={bulkDeleting}
                className={styles.bulkDeleteBtn}
              >
                <SvgIcon name="delete" size={14} /> Delete {selected.size}
              </button>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className={styles.bulkClearBtn}
              >
                ✕ Clear
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className={clsx(styles.loadingRow, 'animate-pulse')}>Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className={styles.tableHead}>
                  <th className="w-10 px-4 py-3">
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      checked={filteredUsers.length > 0 && filteredUsers.every(u => selected.has(u.id))}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded cursor-pointer accent-[#E85D12]"
                      aria-label="Select all users"
                    />
                  </th>
                  <th className={clsx(styles.th, 'px-5 py-3 text-left')}>User</th>
                  <th className={clsx(styles.th, 'w-44 px-5 py-3 text-left')}>Role</th>
                  <th className={clsx(styles.th, 'w-20 px-5 py-3 text-left')}>Imports</th>
                  <th className={clsx(styles.th, 'w-24 px-5 py-3 text-left')}>Snapshots</th>
                  <th className={clsx(styles.th, 'w-48 px-5 py-3 text-left')}>Status &amp; Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const initials = user.name
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map(part => part[0]?.toUpperCase())
                    .join('') || user.email.slice(0, 2).toUpperCase();

                  return (
                    <tr
                      key={user.id}
                      className={styles.tableRow}
                      data-selected={selected.has(user.id) ? 'true' : 'false'}
                    >
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selected.has(user.id)}
                          onChange={() => toggleSelect(user.id)}
                          className="h-4 w-4 rounded cursor-pointer accent-[#E85D12]"
                          aria-label={`Select ${user.name}`}
                        />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className={styles.avatar}>{initials}</span>
                          <div className="min-w-0">
                            <input value={user.name} onChange={e => setUsers(prev => prev.map(u => u.id === user.id ? { ...u, name: e.target.value } : u))}
                              onBlur={e => updateUser(user.id, { name: e.target.value })}
                              className={styles.nameInput}
                              aria-label={`Edit name for ${user.name}`}
                            />
                            <p className={styles.userEmail}>{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <select value={user.role} onChange={e => updateUser(user.id, { role: e.target.value as AppRole })}
                          className={styles.inlineSelect}
                          aria-label={`Change role for ${user.name}`}>
                          {roleOptionsFor(user).map(role => <option key={role} value={role}>{roleLabel(role)}</option>)}
                        </select>
                      </td>
                      <td className={clsx(styles.cellText, 'px-5 py-4')}>{user.importCount}</td>
                      <td className={clsx(styles.cellText, 'px-5 py-4')}>{user.snapshotCount}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className={clsx(user.isActive ? 'chip c-gr' : 'chip c-nt', styles.chipPill)}>
                            <span className={styles.statusDot} data-active={String(user.isActive)} />
                            {user.isActive ? 'Active' : 'Disabled'}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateUser(user.id, { isActive: !user.isActive })}
                            title={user.isActive ? `Disable ${user.name}` : `Activate ${user.name}`}
                            className={styles.toggleBtn}
                            aria-label={user.isActive ? `Disable ${user.name}` : `Activate ${user.name}`}
                          >
                            <SvgIcon name={user.isActive ? 'videoPause' : 'videoPlay'} size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(user)}
                            title={`Delete ${user.name}`}
                            className={styles.deleteBtn}
                            aria-label={`Delete ${user.name}`}
                          >
                            <SvgIcon name="delete" size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredUsers.length === 0 && <div className={styles.emptyMsg}>No users match the current filters.</div>}
            <div className={styles.tableFooter}>
              <span>Showing {filteredUsers.length} of {users.length} users</span>
              <span className={styles.pageBadge}>1</span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

const VALID_TABS: Tab[] = ['users','requests','config','retention','thresholds','orphan','issueTypes','backup','cloud','jira','browser'];

export default function AdminSettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as Tab | null);
  const [tab, setTab] = useState<Tab>(
    initialTab && VALID_TABS.includes(initialTab) ? initialTab : 'users'
  );

  // Sync tab state when the URL ?tab= param changes (e.g. sidebar link clicks).
  useEffect(() => {
    const urlTab = searchParams.get('tab') as Tab | null;
    const resolved = urlTab && VALID_TABS.includes(urlTab) ? urlTab : 'users';
    setTab(resolved);
  }, [searchParams]);
  const [settings, setSettings]       = useState<RetentionSettings | null>(null);
  const [stats, setStats]             = useState<RetentionStats | null>(null);
  const [thresholds, setThresholds]   = useState<HealthThresholds | null>(null);
  const [orphanRules, setOrphanRules]  = useState<OrphanRules | null>(null);
  const [issueTypeHierarchy, setIssueTypeHierarchy] = useState<IssueTypeHierarchyConfig | null>(null);
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
          fetch('/api/admin/issue-type-hierarchy').then(r => r.json()),
          fetch('/api/admin/backup?info=true').then(r => r.json()),
          fetch('/api/admin/users').then(r => r.json()),
        ]);
      })
      .then(results => {
        if (!results) return;
        const [retData, thrData, orphData, issueTypeData, backData, userData] = results;
        if (retData?.settings)  setSettings(retData.settings);
        if (retData?.stats)     setStats(retData.stats);
        if (thrData?.thresholds) setThresholds(thrData.thresholds);
        if (orphData?.rules) setOrphanRules(orphData.rules);
        if (issueTypeData?.config) setIssueTypeHierarchy(issueTypeData.config);
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

  async function handleSaveIssueTypeHierarchy(types: IssueTypeDefinition[]) {
    const res  = await fetch('/api/admin/issue-type-hierarchy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ types }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    if (data.config) setIssueTypeHierarchy(data.config);
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

  const handleUsersChange = useCallback((users: ManagedUser[]) => {
    setUserSummary({
      total:  users.length,
      active: users.filter(u => u.isActive).length,
      admins: users.filter(u => u.role === 'admin').length,
    });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400 animate-pulse">Loading settings…</div>;

  const selectedTab = activeTabMeta(tab);
  const statsCards = buildSettingsStats({ tab, userSummary, settings, stats, thresholds, orphanRules, issueTypeHierarchy, backupFiles });
  const settingsNavItems = ADMIN_TABS.map(item => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
    selected: tab === item.id,
    onClick: () => setTab(item.id),
  }));

  return (
    <AdminConsoleLayout
        title={selectedTab.label}
        description={selectedTab.description}
        navItems={settingsNavItems}
        stats={statsCards}
        statusLabel="Operational"
      >
        {error && <div className="mb-6 rounded-[14px] border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}

        <section>
          {tab === 'users' && (
            <UserManagementSettings
              onUsersChange={handleUsersChange}
            />
          )}
          {tab === 'requests' && <UserAddRequestsPanel />}
          {tab === 'jira'     && <JiraConnectionsPanel />}
          {tab === 'config'   && <AppConfigPanel />}
          {tab === 'retention' && settings && (
            <DataRetentionSettings settings={settings} stats={stats} onSave={handleSaveRetention} onCleanup={handleCleanup} onClearAll={handleClearAll} />
          )}
          {tab === 'thresholds' && thresholds && (
            <HealthThresholdSettings thresholds={thresholds} onSave={handleSaveThresholds} />
          )}
          {tab === 'orphan' && orphanRules && (
            <OrphanRulesSettings rules={orphanRules} onSave={handleSaveOrphanRules} />
          )}
          {tab === 'issueTypes' && issueTypeHierarchy && (
            <IssueTypeHierarchySettings config={issueTypeHierarchy} onSave={handleSaveIssueTypeHierarchy} />
          )}
          {tab === 'backup' && (
            <BackupRestoreSettings files={backupFiles} />
          )}
          {tab === 'cloud' && <CloudStorageSettings />}
          {tab === 'browser' && (
            <ClearLocalDataPanel />
          )}
        </section>
    </AdminConsoleLayout>
  );
}
