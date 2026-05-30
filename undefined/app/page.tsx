// @ts-nocheck
'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setLoading(true); setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Upload failed'); return; }
      sessionStorage.setItem('dc_metrics', JSON.stringify(data.metrics));
      router.push('/dashboard');
    } catch { setError('Upload failed. Please check the file and try again.'); }
    finally { setLoading(false); }
  }

  return (
    <AppShell showNav={false}>
      <div className="min-h-[calc(100vh-10rem)] flex flex-col items-center justify-center gap-8 py-12">
        <div className="text-center max-w-2xl animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 text-xs font-bold text-blue-700 mb-4">🚀 Jira Delivery Intelligence</div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight mb-3">Turn your Jira export into<br/>instant delivery insight</h1>
          <p className="text-slate-500 text-base leading-relaxed">Upload any Jira CSV or Excel export and get sprint health, flow efficiency, risk signals, capacity, and epic readiness in seconds.</p>
        </div>

        <div className="w-full max-w-md border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all animate-fade-in"
          onDrop={(e) => { e.preventDefault(); const f=e.dataTransfer.files?.[0]; if(f) handleFile(f); }}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
        >
          <input ref={inputRef} type="file" className="hidden" accept=".csv,.xlsx,.xls" onChange={e => { const f=e.target.files?.[0]; if(f) handleFile(f); }} />
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"/>
              <p className="text-sm font-medium text-slate-600">Analysing your export…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <span className="text-4xl">📥</span>
              <p className="font-bold text-slate-700">Drop your Jira export here</p>
              <p className="text-sm text-slate-500">or click to browse — CSV, XLSX, XLS · Max 20 MB</p>
              <span className="mt-2 inline-block bg-blue-600 text-white text-sm font-bold px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">Choose file</span>
            </div>
          )}
          {error && <p className="mt-4 text-sm text-red-600 font-medium">{error}</p>}
        </div>

        <div className="flex flex-wrap justify-center gap-2 max-w-lg">
          {['Sprint health','Flow efficiency','Risk signals','Capacity','Epic readiness','Quarter trends','Linked issues','Label analytics'].map(f=>(
            <span key={f} className="text-xs font-semibold bg-white border border-slate-200 rounded-full px-3 py-1 text-slate-600 shadow-sm">{f}</span>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
