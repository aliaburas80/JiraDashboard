'use client';
import { CSSProperties, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { loadMetricsWithSource } from '@/lib/storage';
import type { DashboardMetrics } from '@/types/metrics';
import styles from './page.module.scss';

// ── Field definitions ─────────────────────────────────────────────────────────

type FieldType = 'text' | 'status' | 'user' | 'link' | 'number' | 'date' | 'tag';

interface FieldDef {
  key:       string;
  label:     string;
  example:   string;
  required:  boolean;
  fieldType: FieldType;
  unlocks:   string;
}

const FIELDS: FieldDef[] = [
  { key: 'issueKey',    label: 'Issue Key',     example: 'PROJ-123',    required: true,  fieldType: 'text',   unlocks: 'Parent-child linking, deduplication, direct URL navigation' },
  { key: 'summary',     label: 'Summary',       example: 'Fix login bug', required: true,  fieldType: 'text',   unlocks: 'Issue display, search, and title rendering across all views' },
  { key: 'status',      label: 'Status',        example: 'In Progress', required: true,  fieldType: 'status', unlocks: 'Completion tracking, health scoring, burn-up and burn-down' },
  { key: 'issueType',   label: 'Issue Type',    example: 'Story',       required: true,  fieldType: 'status', unlocks: 'Type icons, type-level filtering, epic vs story split views' },
  { key: 'priority',    label: 'Priority',      example: 'High',        required: false, fieldType: 'status', unlocks: 'Risk scoring, critical item flags, forecast confidence penalty' },
  { key: 'assignee',    label: 'Assignee',      example: 'Jane Smith',  required: false, fieldType: 'user',   unlocks: 'Ownership heat maps, avatar display, workload distribution' },
  { key: 'team',        label: 'Team',          example: 'Platform',    required: false, fieldType: 'user',   unlocks: 'Team-level velocity, cross-team dependency charts' },
  { key: 'epic',        label: 'Epic Link',     example: 'PROJ-10',     required: false, fieldType: 'link',   unlocks: 'Epic grouping, rollup completion %, same-epic related items' },
  { key: 'sprint',      label: 'Sprint',        example: 'Sprint 42',   required: false, fieldType: 'link',   unlocks: 'Velocity analysis, sprint health, burn-up chart data points' },
  { key: 'storyPoints', label: 'Story Points',  example: '5',           required: false, fieldType: 'number', unlocks: 'Point-based velocity as alternative to issue count velocity' },
  { key: 'created',     label: 'Created Date',  example: '2024-01-15',  required: false, fieldType: 'date',   unlocks: 'Issue age calculation, lead time start, backlog age heatmap' },
  { key: 'updated',     label: 'Updated Date',  example: '2024-03-01',  required: false, fieldType: 'date',   unlocks: 'Staleness detection, idle issue alerts after N days' },
  { key: 'resolved',    label: 'Resolved Date', example: '2024-03-05',  required: false, fieldType: 'date',   unlocks: 'Cycle time tracking, done-date accuracy, SLA measurement' },
  { key: 'dueDate',     label: 'Due Date',      example: '2024-04-01',  required: false, fieldType: 'date',   unlocks: 'Deadline risk alerts, overdue detection, delivery confidence' },
  { key: 'labels',      label: 'Labels',        example: 'backend,api', required: false, fieldType: 'tag',    unlocks: 'Label-based filtering, grouping, cross-cutting concern analysis' },
  { key: 'fixVersion',  label: 'Fix Version',   example: 'v2.1.0',      required: false, fieldType: 'tag',    unlocks: 'Version-based rollup, release readiness tracking' },
];

const REQUIRED = FIELDS.filter(f => f.required);
const OPTIONAL  = FIELDS.filter(f => !f.required);

// ── Field type icon ───────────────────────────────────────────────────────────

const TYPE_CFG: Record<FieldType, { fill: string; letter: string; label: string }> = {
  text:   { fill: '#60A5FA', letter: 'T',  label: 'Text'     },
  status: { fill: '#A78BFA', letter: '≡',  label: 'Category' },
  user:   { fill: '#4ade80', letter: 'U',  label: 'User'     },
  link:   { fill: '#FB923C', letter: '⛓',  label: 'Link'     },
  number: { fill: '#FACC15', letter: '#',  label: 'Number'   },
  date:   { fill: '#22D3EE', letter: 'D',  label: 'Date'     },
  tag:    { fill: '#F472B6', letter: '⊞',  label: 'Multi'    },
};

function FieldTypeIcon({ type }: { type: FieldType }) {
  const c = TYPE_CFG[type];
  return (
    // fill / textAnchor / fontSize / fontWeight are SVG presentation attributes
    <svg width="18" height="18" viewBox="0 0 18 18" aria-label={c.label}>
      <rect width="18" height="18" rx="4" fill={c.fill} opacity="0.18" />
      <text x="9" y="13" textAnchor="middle" fontSize="9" fontWeight="900" fill={c.fill}>
        {c.letter}
      </text>
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ColumnMappingPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetricsWithSource()
      .then(r => { setMetrics(r.metrics as DashboardMetrics | null); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const detectedCols: string[] = (metrics as any)?._rawColumns ?? [];
  const hasUpload = metrics !== null;

  // Map detected column names to known field keys (loose match)
  const knownKeys = new Set(FIELDS.map(f => f.key.toLowerCase()));
  const matchedRaw = new Set(
    detectedCols.map(c => c.toLowerCase()).filter(c => knownKeys.has(c))
  );

  function isMapped(fieldKey: string): boolean {
    if (!hasUpload) return false;
    return detectedCols.some(c => c.toLowerCase() === fieldKey.toLowerCase());
  }

  const requiredMapped  = REQUIRED.filter(f => isMapped(f.key)).length;
  const optionalMapped  = OPTIONAL.filter(f => isMapped(f.key)).length;
  const totalMapped     = requiredMapped + optionalMapped;

  function statusState(field: FieldDef): 'mapped' | 'missing-required' | 'missing-optional' | 'no-upload' {
    if (!hasUpload) return 'no-upload';
    if (isMapped(field.key)) return 'mapped';
    return field.required ? 'missing-required' : 'missing-optional';
  }

  function statusLabel(state: ReturnType<typeof statusState>): string {
    switch (state) {
      case 'mapped':           return '✓ Mapped';
      case 'missing-required': return '✕ Missing';
      case 'missing-optional': return '— Not found';
      case 'no-upload':        return '—';
    }
  }

  return (
    <AppShell showNav>
      <div className={styles.page}>

        {/* ── Header ── */}
        <header className={styles.pageHeader}>
          <div className={styles.breadcrumb}>
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <rect width="18" height="18" rx="4" fill="#FF8A4C" opacity="0.18" />
              <text x="9" y="13" textAnchor="middle" fontSize="10" fontWeight="900" fill="#FF8A4C">J</text>
            </svg>
            <span className={styles.breadcrumbProject}>Project Setup</span>
            <span className={styles.breadcrumbSep}>/</span>
            <span className={styles.breadcrumbCurrent}>Column Mapping</span>
          </div>
          <h1 id="tour-header-column-mapping" className={styles.pageTitle}>Column Mapping</h1>
          <p className={styles.pageDesc}>
            Maps your CSV or Jira export columns to Delivery Clarity&apos;s expected fields.
            Matched automatically via fuzzy matching — the more fields present, the richer the analysis.
          </p>
        </header>

        {/* ── Health summary ── */}
        {!loading && (
          <div id="tour-section-column-mapping-1" className={styles.summaryRow}>
            {[
              {
                val: `${requiredMapped} / ${REQUIRED.length}`,
                label: 'Required fields mapped',
                icon: requiredMapped === REQUIRED.length ? '✅' : '⚠️',
                color: requiredMapped === REQUIRED.length ? '#4ade80' : '#fca5a5',
                barColor: requiredMapped === REQUIRED.length ? '#22C55E' : '#F87171',
                barWidth: `${Math.round(requiredMapped / REQUIRED.length * 100)}%`,
              },
              {
                val: `${optionalMapped} / ${OPTIONAL.length}`,
                label: 'Optional fields detected',
                icon: '🔧',
                color: optionalMapped > 0 ? '#93c5fd' : 'var(--dc-p3, #505050)',
                barColor: '#60A5FA',
                barWidth: `${OPTIONAL.length > 0 ? Math.round(optionalMapped / OPTIONAL.length * 100) : 0}%`,
              },
              {
                val: hasUpload ? `${totalMapped} / ${FIELDS.length}` : '—',
                label: 'Total fields matched',
                icon: '📊',
                color: 'var(--dc-p1, #F2F2F2)',
                barColor: 'var(--dc-acc2, #FF8A4C)',
                barWidth: FIELDS.length > 0 ? `${Math.round(totalMapped / FIELDS.length * 100)}%` : '0%',
              },
            ].map(s => (
              <div key={s.label} className={styles.summaryCard}>
                <div className={styles.summaryCardTop}>
                  <div className={styles.summaryVal} style={{ '--summary-color': s.color } as CSSProperties}>{s.val}</div>
                  <div className={styles.summaryIcon}>{s.icon}</div>
                </div>
                <div className={styles.summaryLabel}>{s.label}</div>
                {hasUpload && (
                  <div className={styles.summaryBar}>
                    <div
                      className={styles.summaryBarFill}
                      style={{ '--bar-color': s.barColor, '--bar-width': s.barWidth } as CSSProperties}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── No upload state ── */}
        {!hasUpload && !loading && (
          <div className={styles.emptyCard}>
            <div className={styles.emptyIcon}>📂</div>
            <p className={styles.emptyTitle}>No data uploaded yet</p>
            <p className={styles.emptyBody}>
              Upload a Jira CSV or JSON export to see live mapping status.<br />
              The table below shows all expected fields and what each one unlocks.
            </p>
            <a href="/" className={styles.emptyUploadBtn}>
              ↑ Upload data
            </a>
          </div>
        )}

        {/* ── Detected CSV columns ── */}
        {hasUpload && detectedCols.length > 0 && (
          <div className={styles.detectedCard}>
            <div className={styles.detectedHead}>
              <span className={styles.detectedTitle}>Your CSV columns</span>
              <span className={styles.detectedCount}>{detectedCols.length} columns detected</span>
            </div>
            <div className={styles.tagCloud}>
              {detectedCols.map(col => (
                <span
                  key={col}
                  className={styles.columnTag}
                  data-matched={matchedRaw.has(col.toLowerCase()) ? 'true' : undefined}
                >
                  {col}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Mapping table ── */}
        <div className={styles.tableCard}>

          {/* Column headers */}
          <div className={styles.colHead}>
            <span>Field</span>
            <span>Required</span>
            <span>Example</span>
            <span>Status</span>
          </div>

          {/* Required fields section */}
          <div id="tour-section-column-mapping-2" className={styles.sectionHead}>
            <span className={styles.sectionTitle}>
              <span className={styles.sectionDot} data-kind="required" />
              Required fields
            </span>
            <span className={styles.sectionCount}>{REQUIRED.length} fields</span>
          </div>

          {REQUIRED.map(field => {
            const state = statusState(field);
            return (
              <div key={field.key} className={styles.fieldRow}>
                <div className={styles.fieldInfo}>
                  <div className={styles.fieldIconWrap}>
                    <FieldTypeIcon type={field.fieldType} />
                  </div>
                  <div className={styles.fieldText}>
                    <div className={styles.fieldName}>{field.label}</div>
                    <div className={styles.fieldUnlocks}>{field.unlocks}</div>
                  </div>
                </div>
                <div>
                  <span className={styles.requiredBadge}>★ Required</span>
                </div>
                <div className={styles.exampleVal}>{field.example}</div>
                <div>
                  <span className={styles.statusBadge} data-state={state}>
                    {state !== 'no-upload' && <span className={styles.statusDot} aria-hidden="true" />}
                    {statusLabel(state)}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Optional fields section */}
          <div className={styles.sectionHead}>
            <span className={styles.sectionTitle}>
              <span className={styles.sectionDot} data-kind="optional" />
              Optional fields
            </span>
            <span className={styles.sectionCount}>{OPTIONAL.length} fields</span>
          </div>

          {OPTIONAL.map(field => {
            const state = statusState(field);
            return (
              <div key={field.key} className={styles.fieldRow}>
                <div className={styles.fieldInfo}>
                  <div className={styles.fieldIconWrap}>
                    <FieldTypeIcon type={field.fieldType} />
                  </div>
                  <div className={styles.fieldText}>
                    <div className={styles.fieldName}>{field.label}</div>
                    <div className={styles.fieldUnlocks}>{field.unlocks}</div>
                  </div>
                </div>
                <div>
                  <span className={styles.optionalBadge}>Optional</span>
                </div>
                <div className={styles.exampleVal}>{field.example}</div>
                <div>
                  <span className={styles.statusBadge} data-state={state}>
                    {state === 'mapped' && <span className={styles.statusDot} aria-hidden="true" />}
                    {statusLabel(state)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Footer ── */}
        <p className={styles.footerNote}>
          Column names are matched automatically using fuzzy matching.
          Green tags above = columns from your CSV that matched a known field.{' '}
          <strong>Manual overrides coming in v5.</strong>
        </p>

      </div>
    </AppShell>
  );
}
