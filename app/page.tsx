'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { saveMetrics } from '@/lib/storage';
import DataQualitySummary from '@/components/upload/DataQualitySummary';
import MissingFieldImpactPanel from '@/components/upload/MissingFieldImpactPanel';
import ColumnMappingPreview from '@/components/upload/ColumnMappingPreview';
import type { DataQualityResult, FieldImpactReport } from '@/types/dataQuality';
import type { ColumnMappingResult } from '@/types/columnMapping';

interface MergeStats { fileCount: number; totalBeforeMerge: number; duplicatesRemoved: number; uniqueIssues: number }

export default function HomePage() {
  const router = useRouter();
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
  const inputRef  = useRef<HTMLInputElement>(null);
  const mergeRef  = useRef<HTMLInputElement>(null);

  // ── Single file upload (existing golden path) ─────────────────────────────
  async function handleFile(file: File) {
    setLoading(true); setError(null); setMergeStats(null);
    setDataQuality(null); setFieldImpacts(null); setColumnMapping(null); setPendingMetrics(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res  = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Upload failed'); return; }

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
  }

  // ── Multi-file merge ──────────────────────────────────────────────────────
  async function handleSampleData() {
    setLoadingSample(true); setError(null);
    try {
      const res  = await fetch('/samples/sample-jira-export.csv');
      const blob = await res.blob();
      const file = new File([blob], 'sample-jira-export.csv', { type: 'text/csv' });
      await handleFile(file);
    } catch {
      setError('Failed to load sample data. Please try uploading your own file.');
    } finally {
      setLoadingSample(false);
    }
  }

  function handleProceed() {
    if (pendingMetrics) {
      saveMetrics(pendingMetrics);
      router.push('/dashboard');
    }
  }

  function handleReupload() {
    setColumnMapping(null); setPendingMetrics(null);
    setDataQuality(null);   setFieldImpacts(null);
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
      <div className="min-h-[calc(100vh-10rem)] flex flex-col items-center justify-center gap-8 py-12">

        {/* Hero */}
        <div className="text-center max-w-2xl animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 text-xs font-bold text-blue-700 mb-4">
            🚀 Jira Delivery Intelligence
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight mb-3">
            Turn your Jira export into<br/>instant delivery insight
          </h1>
          <p className="text-slate-500 text-base leading-relaxed">
            Upload any Jira CSV or Excel export and get sprint health, flow efficiency, risk signals, capacity, and epic readiness in seconds.
          </p>
        </div>

        {/* ── Single file drop zone ── */}
        <div
          className="w-full max-w-md border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all animate-fade-in"
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
          onDragOver={e => e.preventDefault()}
          onClick={() => !loading && inputRef.current?.click()}
        >
          <input ref={inputRef} type="file" className="hidden" accept=".csv,.xlsx,.xls"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

          {loading && !mergeFiles.length ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-sm font-medium text-slate-600">Analysing your export…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <span className="text-4xl">📥</span>
              <p className="font-bold text-slate-700">Drop your Jira export here</p>
              <p className="text-sm text-slate-500">or click to browse — CSV, XLSX, XLS · Max 20 MB</p>
              <span className="mt-2 inline-block bg-blue-600 text-white text-sm font-bold px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Choose file
              </span>
            </div>
          )}
        </div>

        {/* ── Merge multiple files ── */}
        <div className="w-full max-w-md">
          <button
            type="button"
            onClick={() => setMergeOpen(o => !o)}
            className="w-full flex items-center justify-between px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm font-semibold text-slate-600 hover:border-purple-400 hover:text-purple-700 transition-colors shadow-sm"
          >
            <span className="flex items-center gap-2">
              <span className="text-base">🗂️</span>
              Merge multiple Jira exports
              {mergeFiles.length > 0 && (
                <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {mergeFiles.length} file{mergeFiles.length !== 1 ? 's' : ''}
                </span>
              )}
            </span>
            <span className={`text-slate-400 transition-transform duration-200 ${mergeOpen ? 'rotate-180' : ''}`}>▾</span>
          </button>

          {mergeOpen && (
            <div className="mt-2 border border-slate-200 rounded-xl bg-white shadow-sm p-4 space-y-4">
              <p className="text-xs text-slate-500">
                Combine data from multiple Jira exports into one unified report. Duplicate issues (same Issue Key) are automatically merged.
              </p>

              {/* File list */}
              {mergeFiles.length > 0 && (
                <ul className="space-y-1.5">
                  {mergeFiles.map(f => (
                    <li key={f.name} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                      <span className="text-sm">📄</span>
                      <span className="text-xs font-semibold text-slate-700 flex-1 truncate" title={f.name}>{f.name}</span>
                      <span className="text-xs text-slate-400 shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                      <button type="button" onClick={() => removeMergeFile(f.name)}
                        className="text-slate-400 hover:text-red-500 font-black text-base leading-none ml-1">×</button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Add file button */}
              <div
                className="border border-dashed border-slate-300 rounded-xl p-4 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/40 transition-all"
                onDrop={e => { e.preventDefault(); Array.from(e.dataTransfer.files).forEach(addMergeFile); }}
                onDragOver={e => e.preventDefault()}
                onClick={() => mergeRef.current?.click()}
              >
                <input ref={mergeRef} type="file" className="hidden" accept=".csv,.xlsx,.xls" multiple
                  onChange={e => Array.from(e.target.files ?? []).forEach(addMergeFile)} />
                <p className="text-xs font-semibold text-slate-500">
                  {mergeFiles.length === 0 ? '+ Add first file' : '+ Add another file'}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Drop here or click · max 10 files</p>
              </div>

              {/* Merge stats summary */}
              {mergeStats && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-xs text-green-800">
                  <p className="font-black mb-1">✅ Merge complete — redirecting…</p>
                  <p>{mergeStats.fileCount} files · {mergeStats.totalBeforeMerge} total rows · {mergeStats.duplicatesRemoved} duplicates removed · <strong>{mergeStats.uniqueIssues} unique issues</strong></p>
                </div>
              )}

              {/* Merge button */}
              <button
                type="button"
                disabled={mergeFiles.length < 2 || loading}
                onClick={handleMerge}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Merging {mergeFiles.length} files…
                  </span>
                ) : `Merge & Analyse ${mergeFiles.length} file${mergeFiles.length !== 1 ? 's' : ''}`}
              </button>
              {mergeFiles.length < 2 && (
                <p className="text-[10px] text-center text-slate-400">Add at least 2 files to enable merging</p>
              )}
            </div>
          )}
        </div>

        {/* Column Mapping Preview — user confirms before going to dashboard */}
        {columnMapping && !mergeStats && (
          <div className="w-full max-w-lg space-y-3">
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
          <p className="text-sm text-red-600 font-medium bg-red-50 border border-red-200 rounded-xl px-4 py-3 max-w-md w-full text-center">
            {error}
          </p>
        )}

        {/* ── Try with sample data ── */}
        {!columnMapping && (
          <div className="flex flex-col items-center gap-2 w-full max-w-md">
            <div className="flex items-center gap-3 w-full">
              <div className="flex-1 border-t border-slate-200" />
              <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">or try a demo first</span>
              <div className="flex-1 border-t border-slate-200" />
            </div>
            <button
              type="button"
              onClick={handleSampleData}
              disabled={loading || loadingSample}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-purple-300 text-sm font-bold text-purple-700 hover:bg-purple-50 hover:border-purple-400 transition-colors disabled:opacity-50"
            >
              {loadingSample ? (
                <>
                  <span className="w-4 h-4 border-2 border-purple-300 border-t-purple-700 rounded-full animate-spin" />
                  Loading sample data…
                </>
              ) : (
                <>
                  <span className="text-base">🎯</span>
                  Try with 35-issue sample Jira export
                </>
              )}
            </button>
            <p className="text-[10px] text-slate-400 text-center">
              A realistic demo dataset with 4 sprints, 3 epics, and multiple issue types — no real Jira account needed.
            </p>
          </div>
        )}

        {/* Feature chips */}
        <div className="flex flex-wrap justify-center gap-2 max-w-lg">
          {['Sprint health', 'Flow efficiency', 'Risk signals', 'Capacity', 'Epic readiness', 'Quarter trends', 'Linked issues', 'Label analytics'].map(f => (
            <span key={f} className="text-xs font-semibold bg-white border border-slate-200 rounded-full px-3 py-1 text-slate-600 shadow-sm">{f}</span>
          ))}
        </div>

      </div>
    </AppShell>
  );
}
