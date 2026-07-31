// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
'use client';
import { useEffect, useState } from 'react';
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
import PersonaPreviewPanel from '@/components/admin/PersonaPreviewPanel';
import { AdminConsoleLayout } from '@/components/admin/AdminConsoleLayout';
import LoadingState from '@/components/ui/LoadingState';
import ConfirmDeleteDialog from '@/components/ui/ConfirmDeleteDialog';
import { SvgIcon } from '@/components/ui/SvgIcon';
import { PasswordInput } from '@/components/ui/PasswordInput';
import {
  type Tab,
  activeTabMeta, buildSettingsStats,
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
        {health.dbConnected
          ? `Database: ${health.users} user${health.users !== 1 ? 's' : ''} · ${health.imports} import${health.imports !== 1 ? 's' : ''}`
          : 'Database unreachable'}
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
  const [confirmForce, setConfirmForce] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/admin/storage/auto-restore').then(r => r.json()).then(setHealth).catch(() => {});
  }, []);

  async function handleAutoRestore(force: boolean) {
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

  const dbUnreachable = health && !health.dbConnected;
  const dbEmpty        = health && health.dbConnected && !health.healthy;
  const needsAttention = dbUnreachable || dbEmpty;

  return (
    <div className={`rounded-xl border p-4 ${needsAttention ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black text-slate-800 mb-1">
            <span className="inline-flex items-center gap-1.5">
              <SvgIcon name={needsAttention ? 'warning' : 'refresh'} size={12} />
              {dbUnreachable ? 'Database unreachable' : dbEmpty ? 'No user data found — restore from cloud needed' : 'Configuration Recovery / Restore'}
            </span>
          </p>
          <p className="text-[10px] text-slate-600 leading-relaxed">
            {dbUnreachable
              ? 'The app could not connect to the database. Check DATABASE_URL and database connectivity — restoring configuration will not fix this.'
              : dbEmpty
              ? 'The database has no user data yet. Click "Restore from cloud" to download the latest configuration backup from the cloud bucket — this restores local settings only, not the database itself. See product/DATABASE_BACKUP_RESTORE.md for actual database recovery.'
              : 'Manually restore local configuration/diagnostic settings from your cloud bucket. This does not restore the database — see product/DATABASE_BACKUP_RESTORE.md for that.'
            }
          </p>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          {needsAttention ? (
            <button type="button" onClick={() => setConfirmForce(true)} disabled={restoring}
              className="btn-warning px-4 py-2 text-xs font-bold">
              {restoring ? 'Restoring…' : <><SvgIcon name="refresh" size={12} /> Restore from cloud</>}
            </button>
          ) : (
            <>
              <button type="button" onClick={() => setConfirmForce(false)} disabled={restoring}
                className="btn-secondary px-4 py-2 text-xs">
                {restoring ? 'Checking…' : <><SvgIcon name="refresh" size={12} /> Restore config (if no users)</>}
              </button>
              <button type="button" onClick={() => setConfirmForce(true)} disabled={restoring}
                className="btn-outline-danger px-4 py-2 text-xs">
                {restoring ? 'Restoring…' : <><SvgIcon name="refresh" size={12} /> Force restore (overwrite)</>}
              </button>
            </>
          )}
        </div>
      </div>
      {confirmForce !== null && (
        <ConfirmDeleteDialog
          title={confirmForce ? 'Force restore from cloud?' : 'Restore configuration from cloud?'}
          message={confirmForce
            ? 'This will overwrite your current configuration/settings files with the LATEST backup from the cloud bucket. This cannot be undone. This does not affect the database.'
            : 'Restore the latest cloud configuration backup? Only runs if the database currently has no user data. This does not affect the database itself.'}
          confirmLabel={confirmForce ? 'Force restore' : 'Restore'}
          danger={confirmForce}
          onConfirm={() => { const force = confirmForce; setConfirmForce(null); handleAutoRestore(force); }}
          onCancel={() => setConfirmForce(null)}
        />
      )}
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
  const [confirmRestoreKey, setConfirmRestoreKey] = useState<string | null>(null);

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
                        <button type="button" onClick={() => setConfirmRestoreKey(b.key)} disabled={isRestoring}
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
      {confirmRestoreKey && (
        <ConfirmDeleteDialog
          title="Restore from backup?"
          message={`Restore from "${confirmRestoreKey.split('/').pop()}"? This will overwrite the current database and config files. Make a backup first if needed.`}
          confirmLabel="Restore"
          onConfirm={() => { const key = confirmRestoreKey; setConfirmRestoreKey(null); handleRestore(key); }}
          onCancel={() => setConfirmRestoreKey(null)}
        />
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
  // EP-022: last-known-good state to revert to on Cancel — captured on initial
  // load and refreshed after every successful save, never on every keystroke.
  const [formSnapshot, setFormSnapshot] = useState<{
    active: StorageProviderType;
    s3Form: typeof s3Form;
    azForm: typeof azForm;
    gcpForm: typeof gcpForm;
  } | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

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
      // EP-022: snapshot built directly from the fetched settings (not from
      // state, which wouldn't be updated yet) so Cancel has something correct
      // to revert to from the very first render.
      setFormSnapshot({
        active: svd,
        s3Form: {
          bucket: d.settings?.s3?.bucket ?? '', region: d.settings?.s3?.region ?? 'us-east-1',
          prefix: d.settings?.s3?.prefix ?? '', endpoint: d.settings?.s3?.endpoint ?? '',
          accessKeyId: '', secretAccessKey: '',
        },
        azForm: {
          containerName: d.settings?.azure?.containerName ?? '', connectionString: '',
          prefix: d.settings?.azure?.prefix ?? '',
        },
        gcpForm: {
          bucket: d.settings?.gcp?.bucket ?? '', projectId: d.settings?.gcp?.projectId ?? '',
          prefix: d.settings?.gcp?.prefix ?? '', keyJson: '',
        },
      });
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
        // EP-022: a successful save becomes the new "last known good" state —
        // Cancel after this point reverts to what was just saved, not the
        // page's original load state.
        setFormSnapshot({ active, s3Form, azForm, gcpForm });
        return true;
      }
      setMsg({ text: `Save failed: ${d.error}`, ok: false });
      return false;
    } catch { setMsg({ text: 'Save failed. Please try again.', ok: false }); return false; }
    finally { setSaving(false); }
  }

  // ── Cancel — discard in-progress edits, revert to the last-saved state ─────

  const hasUnsavedChanges = !!formSnapshot && (
    active !== formSnapshot.active ||
    JSON.stringify(s3Form)  !== JSON.stringify(formSnapshot.s3Form) ||
    JSON.stringify(azForm)  !== JSON.stringify(formSnapshot.azForm) ||
    JSON.stringify(gcpForm) !== JSON.stringify(formSnapshot.gcpForm)
  );

  function revertToSnapshot() {
    if (formSnapshot) {
      setActive(formSnapshot.active);
      setS3Form(formSnapshot.s3Form);
      setAzForm(formSnapshot.azForm);
      setGcpForm(formSnapshot.gcpForm);
    }
    setMsg(null);
    setEditMode(false);
    setShowCancelConfirm(false);
  }

  function handleCancel() {
    if (hasUnsavedChanges) { setShowCancelConfirm(true); return; }
    revertToSnapshot();
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

  // STORAGE-DEC-11: block provider cards/forms/actions until settings have
  // loaded — otherwise the form briefly renders with the 'local' default
  // before the real saved provider arrives.
  if (!data) {
    return <LoadingState message="Loading storage settings…" />;
  }

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
              <PasswordInput value={(s3Form as any)[key]} onChange={e => setS3Form(f => ({ ...f, [key]: e.target.value }))}
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
            <PasswordInput value={azForm.connectionString} onChange={e => setAzForm(f => ({ ...f, connectionString: e.target.value }))}
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
          {/* EP-022: exits the change-provider flow without saving anything —
              reverts every field to the last-saved state. */}
          <button type="button" onClick={handleCancel} disabled={saving}
            className="btn-secondary px-5 py-2 text-sm">Cancel</button>
        </div>
      )}
      {showCancelConfirm && (
        <ConfirmDeleteDialog
          title="Discard unsaved changes?"
          message="Your provider selection and any credentials you've typed will be discarded and reverted to the last saved settings. This does not affect what's currently saved or synced."
          confirmLabel="Discard changes"
          danger={false}
          onConfirm={revertToSnapshot}
          onCancel={() => setShowCancelConfirm(false)}
        />
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

const VALID_TABS: Tab[] = ['requests','config','retention','thresholds','orphan','issueTypes','backup','cloud','jira','browser','personaPreview'];
// User Management lives only at /admin/users (no Settings tab for it at
// all — removed, not just hidden, to eliminate the duplicate implementation).
const DEFAULT_TAB: Tab = 'requests';

export default function AdminSettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as Tab | null);
  const [tab, setTab] = useState<Tab>(
    initialTab && VALID_TABS.includes(initialTab) ? initialTab : DEFAULT_TAB
  );

  // Sync tab state when the URL ?tab= param changes (e.g. sidebar link clicks).
  useEffect(() => {
    const urlTab = searchParams.get('tab') as Tab | null;
    const resolved = urlTab && VALID_TABS.includes(urlTab) ? urlTab : DEFAULT_TAB;
    setTab(resolved);
  }, [searchParams]);
  const [settings, setSettings]       = useState<RetentionSettings | null>(null);
  const [stats, setStats]             = useState<RetentionStats | null>(null);
  const [thresholds, setThresholds]   = useState<HealthThresholds | null>(null);
  const [orphanRules, setOrphanRules]  = useState<OrphanRules | null>(null);
  const [issueTypeHierarchy, setIssueTypeHierarchy] = useState<IssueTypeHierarchyConfig | null>(null);
  const [backupFiles, setBackupFiles]  = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(me => {
        if (!me || me.role !== 'admin') { router.replace('/dashboard'); return; }
        setIsSuperAdmin(me.isSuperAdmin === true);
        return Promise.all([
          fetch('/api/admin/settings').then(r => r.json()),
          fetch('/api/admin/thresholds').then(r => r.json()),
          fetch('/api/admin/orphan-rules').then(r => r.json()),
          fetch('/api/admin/issue-type-hierarchy').then(r => r.json()),
          fetch('/api/admin/backup?info=true').then(r => r.json()),
        ]);
      })
      .then(results => {
        if (!results) return;
        const [retData, thrData, orphData, issueTypeData, backData] = results;
        if (retData?.settings)  setSettings(retData.settings);
        if (retData?.stats)     setStats(retData.stats);
        if (thrData?.thresholds) setThresholds(thrData.thresholds);
        if (orphData?.rules) setOrphanRules(orphData.rules);
        if (issueTypeData?.config) setIssueTypeHierarchy(issueTypeData.config);
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

  if (loading) return <LoadingState message="Loading settings…" />;

  const selectedTab = activeTabMeta(tab);
  const statsCards = buildSettingsStats({ tab, settings, stats, thresholds, orphanRules, issueTypeHierarchy, backupFiles });

  return (
    <AdminConsoleLayout
        title={selectedTab.label}
        description={selectedTab.description}
        headerId="tour-header-admin-settings"
        stats={statsCards}
        statusLabel="Operational"
      >
        {error && <div className="mb-6 rounded-[14px] border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}

        <section id="tour-section-admin-settings-1">
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
          {tab === 'personaPreview' && (
            isSuperAdmin
              ? <PersonaPreviewPanel />
              : <p className="text-sm text-slate-500">Only the super-admin can access this setting.</p>
          )}
        </section>
    </AdminConsoleLayout>
  );
}
