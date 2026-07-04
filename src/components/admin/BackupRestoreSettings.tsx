// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
'use client';
import { useState, useRef } from 'react';
import { SvgIcon } from '@/components/ui/SvgIcon';

interface FileInfo { name: string; label: string; size: number; included: boolean }

interface Props { files: FileInfo[] }

function bytes(n: number): string {
  if (n === 0) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export default function BackupRestoreSettings({ files }: Props) {
  const [creating,   setCreating]   = useState(false);
  const [restoring,  setRestoring]  = useState(false);
  const [msg,        setMsg]        = useState<{ text: string; ok: boolean } | null>(null);
  const [restoreResult, setRestoreResult] = useState<{ restored: string[]; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function showMsg(text: string, ok: boolean) { setMsg({ text, ok }); setTimeout(() => setMsg(null), 5000); }

  async function handleBackup() {
    setCreating(true); setMsg(null);
    try {
      const res  = await fetch('/api/admin/backup');
      if (!res.ok) { showMsg('Backup failed.', false); return; }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = res.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1]
                   ?? `delivery-clarity-backup-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showMsg('Backup downloaded successfully.', true);
    } catch { showMsg('Backup failed — check console.', false); }
    finally { setCreating(false); }
  }

  async function handleRestore(file: File) {
    setRestoring(true); setMsg(null); setRestoreResult(null);
    try {
      const text   = await file.text();
      const bundle = JSON.parse(text);
      const res    = await fetch('/api/admin/restore', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bundle),
      });
      const data = await res.json();
      setRestoreResult({ restored: data.restored ?? [], errors: data.errors ?? [] });
      if (data.ok) showMsg(`Restore complete. ${data.restored.length} file(s) restored.`, true);
      else showMsg('Restore completed with errors. Check details below.', false);
    } catch { showMsg('Restore failed — invalid backup file.', false); }
    finally { setRestoring(false); if (fileRef.current) fileRef.current.value = ''; }
  }

  const includedFiles = files.filter(f => f.included);
  const totalSize     = includedFiles.reduce((s, f) => s + f.size, 0);

  return (
    <div className="space-y-6">
      {/* What's backed up */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
        <h3 className="text-sm font-black text-slate-700 mb-3">Files Included in Backup</h3>
        <div className="divide-y divide-slate-100">
          {files.map(f => (
            <div key={f.name} className="flex items-center gap-3 py-2.5">
              <span className={`text-base ${f.included ? 'text-green-600' : 'text-slate-300'}`}>
                <SvgIcon name={f.included ? 'checkCircle' : 'question'} size={16} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800">{f.label}</p>
                <code className="text-[10px] text-slate-400 font-mono">{f.name}</code>
              </div>
              <span className="text-xs text-slate-400 shrink-0">{bytes(f.size)}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-3 border-t border-slate-100 pt-3">
          Total backup size: <strong>{bytes(totalSize)}</strong> · {includedFiles.length} of {files.length} files present
        </p>
      </div>

      {/* Create backup */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
        <h3 className="text-sm font-black text-slate-700 mb-1">Create Backup</h3>
        <p className="text-xs text-slate-500 mb-4">
          Downloads a JSON file containing the SQLite database and all configuration files.
          Store it somewhere safe outside the server.
        </p>
        <button type="button" onClick={handleBackup} disabled={creating}
          className="btn-primary px-5 py-2.5 disabled:opacity-50">
          {creating ? <><SvgIcon name="clock" size={14} /> Creating backup…</> : <><SvgIcon name="download" size={14} /> Download Backup</>}
        </button>
      </div>

      {/* Restore */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
        <h3 className="text-sm font-black text-slate-700 mb-1">Restore from Backup</h3>
        <p className="text-xs text-slate-500 mb-1">
          Upload a previously downloaded backup JSON file.
          Current files are saved as <code className="font-mono">.bak</code> before being replaced.
        </p>
        <p className="text-xs text-red-600 font-semibold mb-4">
          <SvgIcon name="warning" size={13} style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 4 }} />
          This will overwrite your current database and settings. Restart the server after restore.
        </p>
        <input ref={fileRef} type="file" accept=".json" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleRestore(f); }} />
        <button type="button" disabled={restoring} onClick={() => fileRef.current?.click()}
          className="btn-warning disabled:opacity-50">
          {restoring ? <><SvgIcon name="clock" size={14} /> Restoring…</> : <><SvgIcon name="upload" size={14} /> Choose Backup File</>}
        </button>

        {/* Restore result */}
        {restoreResult && (
          <div className="mt-4 space-y-2">
            {restoreResult.restored.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <p className="inline-flex items-center gap-1 text-xs font-black text-green-800 mb-1"><SvgIcon name="checkCircle" size={12} /> Restored</p>
                {restoreResult.restored.map(f => (
                  <p key={f} className="text-xs text-green-700 font-mono">• {f}</p>
                ))}
              </div>
            )}
            {restoreResult.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="inline-flex items-center gap-1 text-xs font-black text-red-800 mb-1"><SvgIcon name="cross" size={12} /> Errors</p>
                {restoreResult.errors.map((e, i) => (
                  <p key={i} className="text-xs text-red-700">• {e}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {msg && (
        <p className={`inline-flex items-center gap-1.5 text-sm font-semibold ${msg.ok ? 'text-green-600' : 'text-red-600'}`}>
          <SvgIcon name={msg.ok ? 'checkCircle' : 'warning'} size={14} />
          {msg.text}
        </p>
      )}
    </div>
  );
}
