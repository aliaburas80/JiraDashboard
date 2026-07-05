// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// EP-024: lets a cloud-storage-mode user point their uploads at their own
// S3/Azure/GCP bucket instead of Delivery Clarity's own "App storage".
// A saved config is never trusted until "Test connection" succeeds — the
// upload pipeline (app/api/upload/route.ts) blocks uploads for a
// saved-but-unverified provider rather than silently falling back.
'use client';
import { useEffect, useState } from 'react';
import { SvgIcon } from '@/components/ui/SvgIcon';
import { PasswordInput } from '@/components/ui/PasswordInput';

type ProviderType = 's3' | 'azure' | 'gcp';

const PROVIDER_INFO: Record<ProviderType, { label: string; icon: string; description: string }> = {
  s3:    { label: 'Amazon S3',          icon: 'cloud',  description: 'AWS S3 or any S3-compatible storage (MinIO, Backblaze B2, Cloudflare R2).' },
  azure: { label: 'Azure Blob Storage', icon: 'upload', description: 'Microsoft Azure Blob Storage container.' },
  gcp:   { label: 'Google Cloud Storage', icon: 'globe', description: 'Google Cloud Storage bucket.' },
};

interface SafeConfig {
  provider:   ProviderType;
  config:     Record<string, string>;
  verified:   boolean;
  verifiedAt: string | null;
  lastError:  string | null;
}

interface UserCloudProviderFormProps {
  onToast: (msg: string) => void;
}

const INPUT_CLASS = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400';

export default function UserCloudProviderForm({ onToast }: UserCloudProviderFormProps) {
  const [loading, setLoading]   = useState(true);
  const [saved, setSaved]       = useState<SafeConfig | null>(null);
  const [editing, setEditing]   = useState(false);
  const [provider, setProvider] = useState<ProviderType>('s3');
  const [config, setConfig]     = useState<Record<string, string>>({});
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [saving, setSaving]     = useState(false);
  const [testing, setTesting]   = useState(false);
  const [msg, setMsg]           = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch('/api/profile/storage-provider')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.config) {
          setSaved(data.config);
          setProvider(data.config.provider);
          setConfig(data.config.config ?? {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function updateConfig(key: string, value: string) {
    setConfig(prev => ({ ...prev, [key]: value }));
  }

  function updateCredentials(key: string, value: string) {
    setCredentials(prev => ({ ...prev, [key]: value }));
  }

  function fieldsFor(p: ProviderType): { label: string; key: string; secret?: boolean }[] {
    if (p === 's3') {
      return [
        { label: 'Bucket name *', key: 'bucket' },
        { label: 'Region', key: 'region' },
        { label: 'Folder prefix (optional)', key: 'prefix' },
        { label: 'Custom endpoint (optional)', key: 'endpoint' },
        { label: 'Access Key ID', key: 'accessKeyId', secret: true },
        { label: 'Secret Access Key', key: 'secretAccessKey', secret: true },
      ];
    }
    if (p === 'azure') {
      return [
        { label: 'Container name *', key: 'containerName' },
        { label: 'Folder prefix (optional)', key: 'prefix' },
        { label: 'Connection string', key: 'connectionString', secret: true },
      ];
    }
    return [
      { label: 'Bucket name *', key: 'bucket' },
      { label: 'Project ID *', key: 'projectId' },
      { label: 'Folder prefix (optional)', key: 'prefix' },
      { label: 'Service account JSON', key: 'keyJson', secret: true },
    ];
  }

  async function handleSave() {
    setSaving(true); setMsg(null);
    try {
      const res = await fetch('/api/profile/storage-provider', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, config, credentials }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg({ text: data.error ?? 'Save failed.', ok: false }); return; }
      setMsg({ text: 'Saved. Click "Test connection" to verify before it\'s used.', ok: true });
      onToast('Cloud storage provider saved — test it to activate.');
      setSaved({ provider, config, verified: false, verifiedAt: null, lastError: null });
      setCredentials({});
    } catch { setMsg({ text: 'Save failed. Please try again.', ok: false }); }
    finally { setSaving(false); }
  }

  async function handleTest() {
    setTesting(true); setMsg(null);
    try {
      const res = await fetch('/api/profile/storage-provider/test', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        setMsg({ text: 'Connection successful! Your uploads will now go to this bucket.', ok: true });
        setSaved(prev => prev ? { ...prev, verified: true, verifiedAt: new Date().toISOString(), lastError: null } : prev);
        onToast('Cloud storage verified — uploads now go to your own bucket.');
      } else {
        setMsg({ text: `Connection failed: ${data.error}`, ok: false });
        setSaved(prev => prev ? { ...prev, verified: false, lastError: data.error } : prev);
      }
    } catch { setMsg({ text: 'Test failed. Please try again.', ok: false }); }
    finally { setTesting(false); }
  }

  async function handleRemove() {
    setSaving(true);
    try {
      await fetch('/api/profile/storage-provider', { method: 'DELETE' });
      setSaved(null);
      setConfig({});
      setCredentials({});
      setEditing(false);
      onToast('Removed. Uploads now go to App storage.');
    } finally { setSaving(false); }
  }

  if (loading) {
    return <div className="text-xs text-slate-400 py-4">Loading…</div>;
  }

  const showForm = editing || !saved;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-black text-slate-800 mb-1">Your own cloud bucket (optional)</h3>
        <p className="text-xs text-slate-500">
          Point your uploads at a cloud bucket you own instead of App storage. Your credentials are
          encrypted and only ever used for your own uploads — never shared with any other user.
        </p>
      </div>

      {saved && !editing && (
        <div className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
          saved.verified ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center gap-3">
            <SvgIcon name={PROVIDER_INFO[saved.provider].icon} size={18} />
            <div>
              <p className={`text-xs font-black ${saved.verified ? 'text-green-800' : 'text-amber-800'}`}>
                {PROVIDER_INFO[saved.provider].label}
                {saved.verified ? ' — verified' : ' — not yet verified'}
              </p>
              <p className={`text-[10px] font-semibold ${saved.verified ? 'text-green-600' : 'text-amber-700'}`}>
                {saved.verified
                  ? 'Uploads go to your own bucket.'
                  : (saved.lastError ?? 'Uploads are blocked until this is tested successfully.')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!saved.verified && (
              <button type="button" onClick={handleTest} disabled={testing} className="btn-secondary btn-sm">
                {testing ? 'Testing…' : 'Test connection'}
              </button>
            )}
            <button type="button" onClick={() => setEditing(true)} className="btn-secondary btn-sm">Edit</button>
            <button type="button" onClick={handleRemove} disabled={saving} className="btn-outline-danger btn-sm">Remove</button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {(Object.keys(PROVIDER_INFO) as ProviderType[]).map(p => (
              <button key={p} type="button" onClick={() => { setProvider(p); setMsg(null); }}
                className={`p-3 rounded-xl border text-left transition-colors ${provider === p ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-300'}`}>
                <SvgIcon name={PROVIDER_INFO[p].icon} size={20} className="mb-1 text-slate-600" />
                <div className="text-xs font-black text-slate-800">{PROVIDER_INFO[p].label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">{PROVIDER_INFO[p].description}</div>
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {fieldsFor(provider).map(({ label, key, secret }) => (
              <div key={key}>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
                {secret ? (
                  <PasswordInput
                    value={credentials[key] ?? ''}
                    onChange={e => updateCredentials(key, e.target.value)}
                    placeholder={saved && saved.provider === provider ? 'Leave blank to keep saved value' : ''}
                    className={INPUT_CLASS}
                  />
                ) : (
                  <input type="text" value={config[key] ?? ''} onChange={e => updateConfig(key, e.target.value)} className={INPUT_CLASS} />
                )}
              </div>
            ))}
          </div>

          {msg && (
            <p className={`text-xs font-semibold ${msg.ok ? 'text-green-700' : 'text-red-600'}`}>{msg.text}</p>
          )}

          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={handleSave} disabled={saving} className="btn-primary px-5 py-2 text-sm">
              {saving ? 'Saving…' : 'Save'}
            </button>
            {saved && (
              <button type="button" onClick={() => { setEditing(false); setMsg(null); setConfig(saved.config); setProvider(saved.provider); setCredentials({}); }} className="btn-secondary px-5 py-2 text-sm">
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
