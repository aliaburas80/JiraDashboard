'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import AppShell from '@/components/layout/AppShell';
import { AnimatedDataBackground } from '@/components/ui/AnimatedDataBackground';
import { saveMetrics, clearMetrics } from '@/lib/storage';
import { hasLocalData, clearLocalData } from '@/lib/clearLocalData';
import { addLocalImport } from '@/lib/localImportHistory';
import { processFileLocally, getFileExtension } from '@/lib/localUpload';
import ConfirmDeleteDialog from '@/components/ui/ConfirmDeleteDialog';
import { SvgIcon } from '@/components/ui/SvgIcon';
import DataQualitySummary from '@/components/upload/DataQualitySummary';
import MissingFieldImpactPanel from '@/components/upload/MissingFieldImpactPanel';
import ColumnMappingPreview from '@/components/upload/ColumnMappingPreview';
import type { DataQualityResult, FieldImpactReport } from '@/types/dataQuality';
import type { ColumnMappingResult } from '@/types/columnMapping';
import styles from './page.module.scss';

interface MergeStats { fileCount: number; totalBeforeMerge: number; duplicatesRemoved: number; uniqueIssues: number }

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [mergeFiles, setMergeFiles]     = useState<File[]>([]);
  const [mergeOpen, setMergeOpen]       = useState(false);
  const [mergeStats, setMergeStats]     = useState<MergeStats | null>(null);
  const [dataQuality, setDataQuality]     = useState<DataQualityResult | null>(null);
  const [fieldImpacts, setFieldImpacts]   = useState<FieldImpactReport | null>(null);
  const [columnMapping, setColumnMapping]   = useState<ColumnMappingResult | null>(null);
  const [pendingMetrics, setPendingMetrics] = useState<any>(null);
  const [loadingSample, setLoadingSample]   = useState(false);
  const [storedDataFound, setStoredDataFound] = useState(false);
  const [confirmClear, setConfirmClear]       = useState(false);
  const [clearSuccess, setClearSuccess]       = useState(false);
  const [dataStorageMode, setDataStorageMode] = useState<'cloud' | 'local'>('cloud');
  const inputRef  = useRef<HTMLInputElement>(null);
  const mergeRef  = useRef<HTMLInputElement>(null);
  const autoSampleStartedRef = useRef(false);

  useEffect(() => { setStoredDataFound(hasLocalData()); }, []);

  // EP-017: local-mode users never POST the file to /api/upload at all.
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.dataStorageMode === 'local') setDataStorageMode('local'); })
      .catch(() => {}); // default "cloud" — never silently skip the server on a failed check
  }, []);

  // ── Single file upload (existing golden path) ─────────────────────────────
  const handleFile = useCallback(async function handleFile(file: File) {
    setLoading(true); setError(null); setMergeStats(null);
    setDataQuality(null); setFieldImpacts(null); setColumnMapping(null); setPendingMetrics(null);
    try {
      let data: { metrics: any; warnings: string[]; columnMapping?: ColumnMappingResult; error?: string; details?: string[] };

      if (dataStorageMode === 'local') {
        const result = await processFileLocally(file);
        if ('error' in result) { setError(result.error); return; }
        data = result;
        addLocalImport({
          fileName:      file.name,
          fileType:      getFileExtension(file.name).replace('.', ''),
          totalIssues:   result.metrics.totalIssues ?? 0,
          healthScore:   result.metrics.healthScore ?? 0,
          status:        'success',
          warningsCount: result.warnings.length,
        });
      } else {
        const form = new FormData();
        form.append('file', file);
        const res  = await fetch('/api/upload', { method: 'POST', body: form });
        data = await res.json();
        if (!res.ok) { setError(data.error || 'Upload failed'); return; }
      }

      // Show column mapping preview — user confirms before proceeding
      if (data.columnMapping) {
        setPendingMetrics(data.metrics);
        setColumnMapping(data.columnMapping);
        setDataQuality(data.metrics?.dataQuality ?? null);
        setFieldImpacts(data.metrics?.fieldImpacts ?? null);
        // Don't auto-redirect — wait for user to click Proceed
      } else {
        saveMetrics(data.metrics);
        router.push('/dashboard');
      }
    } catch { setError('Upload failed. Please check the file and try again.'); }
    finally { setLoading(false); }
  }, [dataStorageMode, router]);

  // ── Multi-file merge ──────────────────────────────────────────────────────
  const handleSampleData = useCallback(async function handleSampleData() {
    setLoadingSample(true); setError(null);
    try {
      const res  = await fetch('/samples/sample-jira-export.csv');
      const blob = await res.blob();
      const file = new File([blob], 'sample-jira-export.csv', { type: 'text/csv' });
      // Track onboarding
      try { const { markStepDone } = await import('@/lib/onboarding'); markStepDone('upload_file'); } catch {}
      await handleFile(file);
    } catch {
      setError('Failed to load sample data. Please try uploading your own file.');
    } finally {
      setLoadingSample(false);
    }
  }, [handleFile]);

  // Landing page's "Try Sample Dataset" CTA links here with ?sample=1 so the
  // sample loads immediately instead of requiring an extra click.
  useEffect(() => {
    if (searchParams.get('sample') !== '1' || autoSampleStartedRef.current) return;
    autoSampleStartedRef.current = true;
    handleSampleData();
  }, [searchParams, handleSampleData]);

  function handleProceed() {
    if (pendingMetrics) {
      clearMetrics(); // ensure old data is fully removed before saving new
      saveMetrics(pendingMetrics);
      router.push('/dashboard?fresh=1');
    }
  }

  function handleReupload() {
    setColumnMapping(null); setPendingMetrics(null);
    setDataQuality(null);   setFieldImpacts(null);
  }

  function handleClearConfirm() {
    clearLocalData();
    setConfirmClear(false);
    setStoredDataFound(false);
    setClearSuccess(true);
  }

  function addMergeFile(file: File) {
    setMergeFiles(prev => prev.find(f => f.name === file.name) ? prev : [...prev, file]);
    setError(null);
  }

  function removeMergeFile(name: string) {
    setMergeFiles(prev => prev.filter(f => f.name !== name));
    setMergeStats(null);
  }

  async function handleMerge() {
    if (mergeFiles.length < 2) { setError('Add at least 2 files to merge.'); return; }
    setLoading(true); setError(null); setMergeStats(null);
    try {
      const form = new FormData();
      mergeFiles.forEach(f => form.append('file', f));
      const res  = await fetch('/api/upload/merge', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Merge failed'); return; }
      setMergeStats(data.mergeStats);
      saveMetrics(data.metrics);
      // Small delay so user sees the merge summary before redirecting
      await new Promise(r => setTimeout(r, 1400));
      router.push('/dashboard');
    } catch { setError('Merge failed. Please check all files and try again.'); }
    finally { setLoading(false); }
  }

  return (
    <AppShell showNav={false}>
      <div className={styles.page}>
        <AnimatedDataBackground />
        <div className={styles.vignette} aria-hidden="true" />
        <div className={clsx(styles.content, 'flex flex-col items-center justify-center gap-7 px-4')}>

        {/* Hero */}
        <div className="text-center max-w-xl animate-fade-in">
          <div className={clsx(styles.badge, 'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold mb-4')}>
            <SvgIcon name="release" size={14} />
            Jira Delivery Intelligence
          </div>
          <h1 className={clsx(styles.heading, 'text-4xl font-black tracking-tight leading-tight mb-3')}>
            Your Jira export,<br />turned into instant clarity
          </h1>
          <p className={clsx(styles.subhead, 'text-base leading-relaxed')}>
            Drop in a Jira CSV or Excel export. Sprint health, risk signals, and delivery confidence — ready in seconds.
          </p>
          <a href="/landing" className={clsx(styles.link, 'inline-block mt-3 text-xs font-bold')}>
            See everything it does →
          </a>
        </div>

        {/* ── Single file drop zone ── */}
        <div
          className={clsx(styles.dropzone, 'w-full max-w-md rounded-2xl p-10 text-center cursor-pointer animate-fade-in')}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
          onDragOver={e => e.preventDefault()}
          onClick={() => !loading && inputRef.current?.click()}
        >
          <input ref={inputRef} type="file" className="hidden" accept=".csv,.xlsx,.xls"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

          {loading && !mergeFiles.length ? (
            <div className="flex flex-col items-center gap-3">
              <div className={clsx(styles.spinnerTrack, 'w-10 h-10 rounded-full animate-spin')} />
              <p className={clsx(styles.dropzoneTitle, 'text-sm font-medium')}>Analysing your export…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <SvgIcon name="download" size={40} className={styles.dropIcon} />
              <p className={clsx(styles.dropzoneTitle, 'font-bold')}>Drag it in, we&apos;ll take it from here</p>
              <p className={clsx(styles.dropzoneHint, 'text-sm')}>or click to browse — CSV, XLSX, XLS · Max 20 MB</p>
              <span className="btn-primary px-6 py-2 mt-1">
                Choose file
              </span>
            </div>
          )}
        </div>

        {/* ── Secondary actions: merge files / try sample ── */}
        {!columnMapping && (
          <div className="w-full max-w-md grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMergeOpen(o => !o)}
              className={clsx(styles.secondaryBtn, 'rounded-xl px-4 py-3 text-left')}
            >
              <SvgIcon name="folder" size={18} className={styles.secondaryBtnIcon} />
              <p className="text-sm font-bold mt-1.5">Merge multiple files</p>
              <p className={clsx(styles.secondaryBtnHint, 'text-[11px] mt-0.5')}>
                {mergeFiles.length > 0 ? `${mergeFiles.length} file${mergeFiles.length !== 1 ? 's' : ''} added` : 'Combine several exports'}
              </p>
            </button>
            <button
              type="button"
              onClick={handleSampleData}
              disabled={loading || loadingSample}
              className={clsx(styles.secondaryBtn, 'rounded-xl px-4 py-3 text-left disabled:opacity-50')}
            >
              {loadingSample ? (
                <div className={clsx(styles.spinnerTrackSm, 'w-[18px] h-[18px] rounded-full animate-spin')} />
              ) : (
                <SvgIcon name="target" size={18} className={styles.secondaryBtnIcon} />
              )}
              <p className="text-sm font-bold mt-1.5">Try a sample first</p>
              <p className={clsx(styles.secondaryBtnHint, 'text-[11px] mt-0.5')}>35-issue demo, no upload needed</p>
            </button>
          </div>
        )}

        {/* ── Merge panel (opens below the secondary row) ── */}
        {mergeOpen && !columnMapping && (
          <div className={clsx(styles.mergePanel, 'w-full max-w-md rounded-xl p-4 space-y-4 animate-fade-in')}>
            <p className={clsx(styles.dropzoneHint, 'text-xs')}>
              Combine data from multiple Jira exports into one unified report. Duplicate issues (same Issue Key) are automatically merged.
            </p>

            {/* File list */}
            {mergeFiles.length > 0 && (
              <ul className="space-y-1.5">
                {mergeFiles.map(f => (
                  <li key={f.name} className={clsx(styles.fileChip, 'flex items-center gap-2 rounded-lg px-3 py-2')}>
                    <SvgIcon name="file" size={14} />
                    <span className="text-xs font-semibold flex-1 truncate" title={f.name}>{f.name}</span>
                    <span className={clsx(styles.fileChipSize, 'text-xs shrink-0')}>{(f.size / 1024).toFixed(0)} KB</span>
                    <button type="button" onClick={() => removeMergeFile(f.name)}
                      className={clsx(styles.fileChipRemove, 'font-black text-base leading-none ml-1')}>×</button>
                  </li>
                ))}
              </ul>
            )}

            {/* Add file button */}
            <div
              className={clsx(styles.mergeAddFile, 'rounded-xl p-4 text-center cursor-pointer transition-colors')}
              onDrop={e => { e.preventDefault(); Array.from(e.dataTransfer.files).forEach(addMergeFile); }}
              onDragOver={e => e.preventDefault()}
              onClick={() => mergeRef.current?.click()}
            >
              <input ref={mergeRef} type="file" className="hidden" accept=".csv,.xlsx,.xls" multiple
                onChange={e => Array.from(e.target.files ?? []).forEach(addMergeFile)} />
              <p className={clsx(styles.dropzoneTitle, 'text-xs font-semibold')}>
                {mergeFiles.length === 0 ? '+ Add first file' : '+ Add another file'}
              </p>
              <p className={clsx(styles.secondaryBtnHint, 'text-[10px] mt-0.5')}>Drop here or click · max 10 files</p>
            </div>

            {/* Merge stats summary */}
            {mergeStats && (
              <div className={clsx(styles.successBanner, 'rounded-lg px-4 py-3 text-xs')}>
                <p className="flex items-center gap-1.5 font-black mb-1">
                  <SvgIcon name="checkCircle" size={13} />
                  Merge complete — redirecting…
                </p>
                <p>{mergeStats.fileCount} files · {mergeStats.totalBeforeMerge} total rows · {mergeStats.duplicatesRemoved} duplicates removed · <strong>{mergeStats.uniqueIssues} unique issues</strong></p>
              </div>
            )}

            {/* Merge button */}
            <button
              type="button"
              disabled={mergeFiles.length < 2 || loading}
              onClick={handleMerge}
              className="w-full btn-primary py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Merging {mergeFiles.length} files…
                </span>
              ) : `Merge & Analyse ${mergeFiles.length} file${mergeFiles.length !== 1 ? 's' : ''}`}
            </button>
            {mergeFiles.length < 2 && (
              <p className={clsx(styles.secondaryBtnHint, 'text-[10px] text-center')}>Add at least 2 files to enable merging</p>
            )}
          </div>
        )}

        {/* Column Mapping Preview — user confirms before going to dashboard. These
            shared components keep their own light-card styling, so they sit in a
            plain white card floating on this page's dark background. */}
        {columnMapping && !mergeStats && (
          <div className="w-full max-w-lg space-y-3 rounded-2xl bg-white p-1">
            <ColumnMappingPreview
              mapping={columnMapping}
              onProceed={handleProceed}
              onReupload={handleReupload}
              autoRedirectSecs={columnMapping.missingEssential.length > 0 ? 0 : 10}
            />
            {dataQuality && <DataQualitySummary quality={dataQuality} compact />}
            {fieldImpacts?.hasIssues && (
              <MissingFieldImpactPanel report={fieldImpacts} compact />
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <p className={clsx(styles.errorBanner, 'text-sm font-medium rounded-xl px-4 py-3 max-w-md w-full text-center')}>
            {error}
          </p>
        )}

        {/* Short trust line — full feature list lives on /landing */}
        <p className={clsx(styles.tagline, 'text-xs text-center max-w-md')}>
          Sprint health · flow efficiency · risk signals · capacity · epic readiness — and more.
        </p>

        {/* Stored data detection banner — placed last, just above the footer */}
        {clearSuccess && (
          <div className={clsx(styles.successBanner, 'w-full max-w-md flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold animate-fade-in')}>
            <SvgIcon name="checkCircle" size={18} />
            Local data cleared. Upload a new file to start fresh.
          </div>
        )}
        {storedDataFound && !clearSuccess && (
          <div className={clsx(styles.warningBanner, 'w-full max-w-md flex items-center justify-between gap-3 rounded-xl px-4 py-3 animate-fade-in')}>
            <p className={clsx(styles.warningText, 'flex items-center gap-2 text-xs leading-snug')}>
              <SvgIcon name="warning" size={14} className="shrink-0" />
              Stored data was found in this browser — upload a new file or clear it.
            </p>
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="btn-outline-danger btn-sm shrink-0"
            >
              Clear Local Data
            </button>
          </div>
        )}

        </div>
      </div>

      {confirmClear && (
        <ConfirmDeleteDialog
          title="Clear Local Data?"
          message="This will remove local data and may end your current session. You may need to log in again."
          confirmLabel="Yes, clear it"
          onConfirm={handleClearConfirm}
          onCancel={() => setConfirmClear(false)}
        />
      )}
    </AppShell>
  );
}
