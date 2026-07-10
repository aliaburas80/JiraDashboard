// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { markStepDone } from '@/lib/onboarding';
import dynamic from 'next/dynamic';
import AppShell from '@/components/layout/AppShell';
import LoadingState from '@/components/ui/LoadingState';
import { SvgIcon } from '@/components/ui/SvgIcon';
import RelationStatsCards from '@/components/explore/RelationStatsCards';
import RelationInsightPanel from '@/components/explore/RelationInsightPanel';
import RelationDetailsTable from '@/components/explore/RelationDetailsTable';
import RelationCharts from '@/components/explore/RelationCharts';
import { loadMetricsWithSource } from '@/lib/storage';
import { buildRelationGraph } from '@/services/relations/relationExplorer.service';
import { exportExplorerToExcel, exportExplorerToCsv } from '@/services/export/explorerExport.service';
import type { RelationGraph } from '@/types/relations';
import type { DashboardMetrics } from '@/types/metrics';
import type { IssueTypeDefinition } from '@/types/issueTypeHierarchy';
import { DEFAULT_ISSUE_TYPES } from '@/types/issueTypeHierarchy';

// React Flow must be client-side only — no SSR
const WorkItemGraph = dynamic(() => import('@/components/explore/WorkItemGraph'), { ssr: false, loading: () => <div className="h-[520px] flex items-center justify-center text-slate-400 text-sm animate-pulse bg-slate-50 rounded-2xl border border-slate-200">Rendering graph…</div> });

const MAX_RECENT = 5;
const RECENT_KEY = 'dc_explore_recent';

function loadRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]'); } catch { return []; }
}
function saveRecent(key: string): void {
  try {
    const prev = loadRecent().filter(k => k !== key);
    localStorage.setItem(RECENT_KEY, JSON.stringify([key, ...prev].slice(0, MAX_RECENT)));
  } catch {}
}

export default function ExplorePage() {
  const [metrics, setMetrics]     = useState<DashboardMetrics | null>(null);
  const [query, setQuery]         = useState('');
  const [graph, setGraph]           = useState<RelationGraph | null>(null);
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [focusedKey, setFocusedKey] = useState('');
  const [recent, setRecent]         = useState<string[]>([]);
  const [blockedOnly, setBlockedOnly] = useState(false);
  const [exportOpen, setExportOpen]   = useState(false);
  const [issueTypes, setIssueTypes]   = useState<IssueTypeDefinition[]>(DEFAULT_ISSUE_TYPES);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const result = await loadMetricsWithSource();
      if (cancelled) return;
      setMetrics(result.metrics as DashboardMetrics | null);
      setRecent(loadRecent());
      // Track onboarding step
      markStepDone('try_explorer');
      try { localStorage.setItem('dc_visited_explore', '1'); } catch {}
    }
    load().catch(() => { if (!cancelled) setRecent(loadRecent()); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/issue-type-hierarchy')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (cancelled || !data?.config?.types?.length) return;
        setIssueTypes(data.config.types);
      })
      .catch(() => {}); // fall back to DEFAULT_ISSUE_TYPES silently
    return () => { cancelled = true; };
  }, []);

  const explore = useCallback((key: string) => {
    const trimmed = key.trim().toUpperCase();
    if (!trimmed) { setError('Please enter an issue key.'); return; }
    if (!metrics) { setError('No data loaded. Upload a Jira export first.'); return; }

    const issues = (metrics.flow?.items ?? []) as any[];
    if (!issues.length) { setError('No issues found in the loaded data.'); return; }

    setLoading(true);
    setError('');

    // Use requestAnimationFrame to allow the UI to update before the computation
    requestAnimationFrame(() => {
      const result = buildRelationGraph(trimmed, issues, issueTypes);
      setLoading(false);
      if (!result) {
        setError(`Issue key "${trimmed}" was not found in the current dataset. Check the key and try again.`);
        return;
      }
      setGraph(result);
      setFocusedKey(trimmed);
      saveRecent(trimmed);
      setRecent(loadRecent());
    });
  }, [metrics, issueTypes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    explore(query);
  };

  const handleNodeFocus = useCallback((key: string) => {
    setQuery(key);
    explore(key);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [explore]);

  const noData = !metrics;

  return (
    <AppShell showNav>
      <div className="max-w-7xl mx-auto">

        {/* ── Page Header ── */}
        <div className="mb-6">
          <h1 id="tour-header-explore" className="text-2xl font-black text-slate-900 tracking-tight">Explore Delivery Structure</h1>
          <p className="text-sm text-slate-500 mt-1">
            Enter any Jira issue key to visualise its complete work hierarchy, relations, and delivery risk.
          </p>
        </div>

        {/* ── Search Bar ── */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div id="tour-section-explore-1" className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value.toUpperCase())}
                placeholder="Enter Epic, Story, Task, Bug, or Sub-task key…"
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-mono font-semibold text-slate-800 focus:outline-none focus:border-blue-500 bg-white shadow-sm"
                autoFocus
                disabled={noData}
              />
            </div>
            <button
              type="submit"
              disabled={loading || noData || !query.trim()}
              className="btn-primary w-full sm:w-auto px-6 py-3 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Exploring…' : 'Explore Issue'}
            </button>
          </div>

          {/* Recent keys */}
          {recent.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="text-xs text-slate-400 font-semibold">Recent:</span>
              {recent.map(k => (
                <button key={k} type="button"
                  onClick={() => { setQuery(k); explore(k); }}
                  className="text-xs font-mono font-bold bg-white border border-slate-200 rounded-xl px-2.5 py-0.5 text-blue-700 hover:border-blue-400 transition-colors">
                  {k}
                </button>
              ))}
            </div>
          )}
        </form>

        {/* ── No data state ── */}
        {noData && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-sm text-amber-800 mb-6">
            <strong>No data loaded.</strong> Upload a Jira export from the{' '}
            <a href="/" className="underline font-bold">home page</a> first, then return here to explore.
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 mb-6">
            {error}
          </div>
        )}

        {/* ── Loading ── */}
        {loading && <LoadingState message="Building relation graph…" />}

        {/* ── Results ── */}
        {graph && !loading && (
          <div className="space-y-6">

            {/* Focus label + blocked filter toggle */}
            {(() => {
              const blockedCount = graph.nodes.filter(n => n.isBlocked || n.health === 'critical').length;
              const riskPathCount = graph.nodes.filter(n => n.isOnRiskPath).length;
              return (
                <div id="tour-section-explore-2" className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-lg font-black text-blue-700">{graph.focusKey}</span>
                  <span className="text-sm text-slate-500">·</span>
                  <span className="text-sm font-semibold text-slate-600">{graph.focusType}</span>
                  <span className="text-sm text-slate-500">·</span>
                  <span className="text-sm text-slate-500">{graph.nodes.length} connected items</span>
                  {graph.orphanNodes.length > 0 && (
                    <span className="text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200 rounded-full px-3 py-0.5">
                      {graph.orphanNodes.length} orphan{graph.orphanNodes.length > 1 ? 's' : ''} detected
                    </span>
                  )}
                  {/* Blocked branch filter toggle */}
                  {blockedCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setBlockedOnly(v => !v)}
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-xl border transition-colors ${
                        blockedOnly
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                      }`}
                    >
                      🚫 {blockedOnly ? 'Show all' : `Show blocked branches (${blockedCount})`}
                    </button>
                  )}
                  {blockedOnly && riskPathCount > 0 && (
                    <span className="text-xs text-red-600 font-semibold">
                      {riskPathCount} node{riskPathCount !== 1 ? 's' : ''} on risk path
                    </span>
                  )}

                  {/* Export dropdown */}
                  <div className="relative ml-auto">
                    <button
                      type="button"
                      onClick={() => setExportOpen(v => !v)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:text-blue-700 transition-colors shadow-sm"
                    >
                      ↓ Export
                    </button>
                    {exportOpen && (
                      <div className="absolute right-0 top-8 z-30 bg-white border border-slate-200 rounded-xl shadow-lg min-w-[160px] py-1">
                        <button
                          type="button"
                          onClick={() => { exportExplorerToExcel(graph); setExportOpen(false); }}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                          Export to Excel (.xlsx)
                        </button>
                        <button
                          type="button"
                          onClick={() => { exportExplorerToCsv(graph); setExportOpen(false); }}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                          Export to CSV (.csv)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* 1. Visual Map — primary, above the fold */}
            <section aria-label="Work item relationship map">
              <WorkItemGraph
                graph={graph}
                focusNodeId={focusedKey}
                onNodeFocus={handleNodeFocus}
                dimNonRiskPath={blockedOnly}
                issueTypes={issueTypes}
              />
            </section>

            {/* 2. Insight panel */}
            {graph.insights.length > 0 && (
              <RelationInsightPanel insights={graph.insights} />
            )}

            {/* 3. Charts */}
            <RelationCharts nodes={graph.nodes} orphanNodes={graph.orphanNodes} issueTypes={issueTypes} />

            {/* 4. KPI Stats */}
            <section aria-label="Relation statistics">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Key Metrics</h2>
              <RelationStatsCards stats={graph.stats} />
            </section>

            {/* 5. Details Table — filtered when blockedOnly is active */}
            {(() => {
              const filteredNodes  = blockedOnly
                ? graph.nodes.filter(n => n.isOnRiskPath || n.isBlocked)
                : graph.nodes;
              const filteredOrphans = blockedOnly ? [] : graph.orphanNodes;
              const totalShown = filteredNodes.length + filteredOrphans.length;
              const totalAll   = graph.nodes.length + graph.orphanNodes.length;
              return (
                <section aria-label="Issue details">
                  <div className="flex items-center gap-3 mb-3">
                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">
                      Issue Details
                    </h2>
                    <span className="text-xs text-slate-400">
                      {blockedOnly
                        ? `${totalShown} on risk path (of ${totalAll})`
                        : `${totalAll} total`}
                    </span>
                    {blockedOnly && (
                      <span className="text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 rounded-full px-2 py-0.5">
                        🚫 Blocked branches only
                      </span>
                    )}
                  </div>
                  <RelationDetailsTable
                    nodes={filteredNodes}
                    orphanNodes={filteredOrphans}
                    onFocusNode={handleNodeFocus}
                    issueTypes={issueTypes}
                  />
                </section>
              );
            })()}

          </div>
        )}

        {/* ── Empty state ── */}
        {!graph && !loading && !error && metrics && (
          <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
            <SvgIcon name="search" size={48} className="mb-4 text-slate-400" />
            <p className="text-base font-bold text-slate-600 mb-2">Enter an issue key to begin</p>
            <p className="text-sm max-w-sm">Type any Epic, Story, Task, Bug, or Sub-task key from your Jira export. The visual map will show you its complete delivery structure.</p>
          </div>
        )}

      </div>
    </AppShell>
  );
}
