// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// DataSourceBadge — shows where the current data is coming from.
// CloudLoadingBanner — shows a loading indicator when fetching from cloud.
'use client';

import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';
import { getMetricsSource } from '@/lib/storage';
import { SvgIcon } from '@/components/ui/SvgIcon';

// ── Types ─────────────────────────────────────────────────────────────────────

export type DataSource =
  | 'cloud-s3'
  | 'cloud-azure'
  | 'cloud-gcp'
  | 'cache'        // served from local cache (cloud was not re-fetched)
  | 'upload'       // fresh Jira CSV upload
  | 'local'        // local storage mode / no cloud
  | 'loading'      // actively loading from cloud
  | 'fallback'     // cloud failed, using local backup
  | 'localstorage' // browser localStorage fallback
  | 'jira-api'     // live Jira connection sync (ARCH-05 JIRA-08)
  | 'unknown';

interface DataSourceCtx {
  source:         DataSource;
  provider:       string;
  key:            string;
  connectionName: string;
  lastSyncAt:     string;
  fallbackReason: string;
  loading:        boolean;
  setSource: (s: DataSource, provider?: string, key?: string, connectionName?: string, lastSyncAt?: string, fallbackReason?: string) => void;
  setLoading:(loading: boolean, provider?: string) => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const Ctx = createContext<DataSourceCtx>({
  source: 'unknown', provider: '', key: '', connectionName: '', lastSyncAt: '', fallbackReason: '', loading: false,
  setSource:  () => {},
  setLoading: () => {},
});

export function DataSourceProvider({ children }: { children: ReactNode }) {
  const [source,         setSourceState]     = useState<DataSource>('unknown');
  const [provider,       setProvider]        = useState('');
  const [key,            setKey]             = useState('');
  const [connectionName, setConnectionName]  = useState('');
  const [lastSyncAt,     setLastSyncAt]      = useState('');
  const [fallbackReason, setFallbackReason]  = useState('');
  const [loading,        setLoadingState]    = useState(false);

  function setSource(s: DataSource, prov?: string, k?: string, connName?: string, syncedAt?: string, reason?: string) {
    setSourceState(s);
    if (prov     !== undefined) setProvider(prov);
    if (k        !== undefined) setKey(k);
    if (connName !== undefined) setConnectionName(connName);
    if (syncedAt !== undefined) setLastSyncAt(syncedAt);
    if (reason   !== undefined) setFallbackReason(reason);
  }

  function setLoading(l: boolean, prov?: string) {
    setLoadingState(l);
    if (prov !== undefined) setProvider(prov);
    if (l) setSourceState('loading');
  }

  // Detect data source from the shared metrics source record.
  useEffect(() => {
    function applyStoredSource() {
      const info = getMetricsSource();
      if (!info) return;

      if (info.source === 'jira-api') {
        setSource('jira-api', info.provider, info.key, info.connectionName, info.savedAt);
        return;
      }

      if (info.source === 'bucket') {
        const cloudSource: DataSource = info.provider === 's3' ? 'cloud-s3'
          : info.provider === 'azure' ? 'cloud-azure'
          : info.provider === 'gcp' ? 'cloud-gcp'
          : 'cache';
        setSource(cloudSource, info.provider, info.key, undefined, info.savedAt);
        return;
      }

      if (info.source === 'localstorage') {
        setSource('localstorage', info.provider, info.key, undefined, info.savedAt, info.error || info.message);
      } else if (info.source === 'server-local') {
        setSource('local', info.provider, info.key, undefined, info.savedAt);
      } else if (info.source === 'snapshot') {
        setSource('cache', info.provider, info.key, undefined, info.savedAt);
      } else if (info.source === 'cache') {
        setSource('cache', info.provider, info.key, undefined, info.savedAt);
      } else if (info.source === 'upload') {
        setSource('upload', info.provider, info.key, undefined, info.savedAt);
      } else if (info.source === 'none') {
        setSource('fallback', info.provider, info.key, undefined, info.savedAt, info.error || info.message);
      }
    }

    applyStoredSource();
    window.addEventListener('dc-metrics-source-change', applyStoredSource);
    window.addEventListener('storage', applyStoredSource);
    return () => {
      window.removeEventListener('dc-metrics-source-change', applyStoredSource);
      window.removeEventListener('storage', applyStoredSource);
    };
  }, []);

  return (
    <Ctx.Provider value={{ source, provider, key, connectionName, lastSyncAt, fallbackReason, loading, setSource, setLoading }}>
      {children}
    </Ctx.Provider>
  );
}

export function useDataSource() { return useContext(Ctx); }

// ── Relative time ─────────────────────────────────────────────────────────────

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return 'recently';
  const minutes = Math.max(0, Math.round((Date.now() - then) / 60_000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

// ── Badge component ───────────────────────────────────────────────────────────

const SOURCE_CONFIG: Record<DataSource, { icon: string; label: string; color: string; bg: string; border: string }> = {
  'cloud-s3':    { icon: '☁️',  label: 'S3',          color: '#f97316', bg: '#fff7ed', border: '#fed7aa' },
  'cloud-azure': { icon: '🔷',  label: 'Azure',       color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  'cloud-gcp':   { icon: '🌐',  label: 'GCP',         color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  'cache':       { icon: '💾',  label: 'Local cache', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
  'upload':      { icon: '📤',  label: 'Jira upload', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  'local':       { icon: '🗄️', label: 'Local',        color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
  'loading':     { icon: '⟳',   label: 'Loading…',   color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  'fallback':    { icon: '⚠️',  label: 'No data source', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  'localstorage':{ icon: '⚠️',  label: 'localStorage fallback', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  'jira-api':    { icon: '🔄',  label: 'Jira',        color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd' },
  'unknown':     { icon: '?',   label: 'Unknown',     color: '#94a3b8', bg: '#f8fafc', border: '#e2e8f0' },
};

const SOURCE_SHORT_LABEL: Record<DataSource, string> = {
  'cloud-s3': 'S3',
  'cloud-azure': 'Azure',
  'cloud-gcp': 'GCP',
  'cache': 'Cache',
  'upload': 'Upload',
  'local': 'Local',
  'loading': 'Loading',
  'fallback': 'No data',
  'localstorage': 'localStorage',
  'jira-api': 'Jira',
  'unknown': 'Unknown',
};

export function DataSourceBadge({ className = '', compact = false }: { className?: string; compact?: boolean }) {
  const { source, provider, key, connectionName, lastSyncAt, fallbackReason, loading } = useDataSource();
  if (source === 'unknown') return null;

  const cfg = SOURCE_CONFIG[source] ?? SOURCE_CONFIG.unknown;
  const providerLabel = provider && provider !== 'local'
    ? provider.toUpperCase()
    : cfg.label;

  const syncedAgo = lastSyncAt ? formatRelativeTime(lastSyncAt) : 'recently';
  const jiraLabel = `Jira${connectionName ? ` (${connectionName})` : ''} — last synced ${syncedAgo}`;
  const jiraCompactLabel = `Jira · ${syncedAgo}`;

  const displayLabel = source === 'jira-api'
    ? (compact ? jiraCompactLabel : jiraLabel)
    : (compact ? SOURCE_SHORT_LABEL[source] : `Data: ${providerLabel}`);

  const fetchedSuffix = lastSyncAt ? ` · Last fetched ${syncedAgo}` : '';
  const reasonSuffix  = (source === 'localstorage' || source === 'fallback') && fallbackReason ? ` · ${fallbackReason}` : '';

  const titleText = source === 'jira-api'
    ? jiraLabel
    : `Data source: ${providerLabel}${key ? ` · Key: ${key}` : ''}${fetchedSuffix}${reasonSuffix}`;

  return (
    <div
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border font-bold print:hidden ${
        compact ? 'h-9 shrink-0 px-2.5 text-xs' : 'px-2.5 py-1 text-[10px]'
      } ${className}`}
      style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
      title={titleText}
    >
      {loading ? (
        <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40" strokeDashoffset="15" />
        </svg>
      ) : (
        <SvgIcon name={cfg.icon} size={12} />
      )}
      <span>{displayLabel}</span>
    </div>
  );
}

// ── Cloud loading banner ──────────────────────────────────────────────────────

const PROVIDER_NAMES: Record<string, string> = {
  s3: 'Amazon S3', azure: 'Azure Blob Storage', gcp: 'Google Cloud Storage',
};

export function CloudLoadingBanner() {
  const { loading, provider } = useDataSource();
  if (!loading) return null;

  const name = PROVIDER_NAMES[provider] ?? provider ?? 'cloud storage';

  return (
    <div
      style={{
        position: 'fixed', top: 56, left: 0, right: 0, zIndex: 9990,
        background: 'linear-gradient(90deg, #1e3a5f, #2563eb)',
        color: '#fff', display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 10, padding: '8px 16px',
        fontSize: 12, fontWeight: 700,
      }}
      role="status"
      aria-live="polite"
    >
      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeDasharray="40" strokeDashoffset="15" />
      </svg>
      Loading data from {name}…
    </div>
  );
}
