// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
'use client';
import { useEffect, useState } from 'react';
import ConfirmDeleteDialog from '@/components/ui/ConfirmDeleteDialog';
import UserCloudProviderForm from '@/components/settings/UserCloudProviderForm';
import { listLocalImports, removeLocalImport, clearLocalImportHistory } from '@/lib/localImportHistory';

interface Log {
  id: string;
  fileName: string;
  fileType: string;
  totalIssues: number;
  healthScore: number;
  status: string;
  uploadedAt: string;
}

interface StorageTabProps {
  dataStorageMode: 'cloud' | 'local';
  savingStorageMode: boolean;
  onUpdateStorageMode: (mode: 'cloud' | 'local') => void;
  onToast: (msg: string) => void;
}

export default function StorageTab({ dataStorageMode, savingStorageMode, onUpdateStorageMode, onToast }: StorageTabProps) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    // EP-017: local-mode history lives in this browser only — never fetched from the server.
    if (dataStorageMode === 'local') {
      setLogs(listLocalImports());
    } else {
      fetch('/api/imports').then(r => r.ok ? r.json() : null).catch(() => null)
        .then(importData => { if (importData?.logs) setLogs(importData.logs.slice(0, 10)); });
    }
  }, [dataStorageMode]);

  async function handleDeleteOne() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (dataStorageMode === 'local') {
        removeLocalImport(deleteTarget.id);
      } else {
        const res = await fetch(`/api/imports/${deleteTarget.id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
      }
      setLogs(prev => prev.filter(l => l.id !== deleteTarget.id));
      onToast(`Deleted "${deleteTarget.name}"`);
    } catch { onToast('Failed to delete.'); }
    finally { setDeleting(false); setDeleteTarget(null); }
  }

  async function handleDeleteAll() {
    setDeleting(true);
    try {
      if (dataStorageMode === 'local') {
        const count = logs.length;
        clearLocalImportHistory();
        setLogs([]);
        onToast(`Deleted ${count} import log${count !== 1 ? 's' : ''}`);
      } else {
        const res = await fetch('/api/imports/all', { method: 'DELETE' });
        const json = await res.json();
        if (!res.ok) throw new Error();
        setLogs([]);
        onToast(`Deleted ${json.deleted} import log${json.deleted !== 1 ? 's' : ''}`);
      }
    } catch { onToast('Failed to delete.'); }
    finally { setDeleting(false); setDeleteAllConfirm(false); }
  }

  return (
    <>
      {deleteTarget && (
        <ConfirmDeleteDialog
          title="Delete import log?"
          message={`Permanently remove the log for "${deleteTarget.name}". Your current dashboard data will not be affected.`}
          onConfirm={handleDeleteOne}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
      {deleteAllConfirm && (
        <ConfirmDeleteDialog
          title="Delete all import history?"
          message="This removes all your stored import logs. Your current dashboard data will not be affected. This cannot be undone."
          confirmLabel="Delete all history"
          onConfirm={handleDeleteAll}
          onCancel={() => setDeleteAllConfirm(false)}
          loading={deleting}
        />
      )}

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-sm font-black uppercase tracking-wider text-slate-700">Data & Privacy</h2>
        <p className="mb-4 text-xs text-slate-500">
          Choose where new Jira uploads and their computed metrics are stored. Switching only affects uploads from now on — existing data stays where it already is.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={savingStorageMode}
            onClick={() => onUpdateStorageMode('cloud')}
            className={`rounded-xl border-2 p-4 text-left transition-colors disabled:opacity-50 ${
              dataStorageMode === 'cloud' ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <p className="text-sm font-black text-slate-900">App storage</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
              Uploads and metrics are stored in Delivery Clarity's own server database. Not a third-party cloud service — works across devices, and admins can support you with your data.
            </p>
          </button>
          <button
            type="button"
            disabled={savingStorageMode}
            onClick={() => onUpdateStorageMode('local')}
            className={`rounded-xl border-2 p-4 text-left transition-colors disabled:opacity-50 ${
              dataStorageMode === 'local' ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <p className="text-sm font-black text-slate-900">This device only</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
              Uploads are processed entirely in your browser and never sent to the server. No cross-device sync, no admin visibility, and the data is lost if you clear your browser storage.
            </p>
          </button>
        </div>
      </section>

      {dataStorageMode === 'cloud' && (
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <UserCloudProviderForm onToast={onToast} />
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-700">Import History</h2>
          {logs.length > 0 && (
            <button type="button" onClick={() => setDeleteAllConfirm(true)} className="btn-outline-danger btn-sm">
              Delete all history
            </button>
          )}
        </div>

        {logs.length === 0 ? (
          <p className="py-10 text-center text-sm italic text-slate-400">
            No import history yet. Upload a Jira export to get started.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {logs.map(log => (
              <li key={log.id} className="group flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-800">{log.fileName}</p>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {new Date(log.uploadedAt).toLocaleString()} · {log.totalIssues} issues ·{' '}
                    <span className={`font-bold ${log.healthScore >= 75 ? 'text-green-600' : log.healthScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                      {log.healthScore}/100
                    </span>
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>{log.status}</span>
                <button type="button" title="Delete this log" onClick={() => setDeleteTarget({ id: log.id, name: log.fileName })}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-black text-slate-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100">
                  x
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
