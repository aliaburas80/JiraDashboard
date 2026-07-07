// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// /retro — Sprint retrospective: fill in-app, download template, or upload file.
'use client';
import { useRef, useState } from 'react';
import clsx from 'clsx';
import AppShell from '@/components/layout/AppShell';
import { SvgIcon } from '@/components/ui/SvgIcon';
import { buildSafeCsv } from '@/lib/exportSafety';
import { downloadRetroExcelTemplate } from '@/services/retro/retroTemplate.service';
import { generateRetrospectiveInsight, THEME_LABEL } from '@/services/retro/retroInsights.service';
import type { RetroRecord, RetrospectiveInsight, RetroDataCorrection } from '@/types/retrospective';
import styles from './page.module.scss';

// ── Types ──────────────────────────────────────────────────────────────────────

interface RetroEntry { text: string; }
interface ActionItem { text: string; owner: string; dueDate: string; priority: 'high' | 'medium' | 'low'; }

interface RetroForm {
  sprintName:  string;
  teamName:    string;
  retroDate:   string;
  goalMet:     'yes' | 'no' | 'partial' | '';
  sprintGoal:  string;
  wentWell:    RetroEntry[];
  didntGoWell: RetroEntry[];
  blockers:    RetroEntry[];
  actions:     ActionItem[];
}

interface UploadPreview {
  records:     RetroRecord[];
  insights:    RetrospectiveInsight[];
  warnings:    string[];
  corrections: RetroDataCorrection[];
}

function formToRecord(form: RetroForm): RetroRecord {
  return {
    sprintName: form.sprintName, teamName: form.teamName, retroDate: form.retroDate,
    goalMet: form.goalMet, sprintGoal: form.sprintGoal,
    wentWell: form.wentWell.map(e => e.text).filter(t => t.trim()),
    didntGoWell: form.didntGoWell.map(e => e.text).filter(t => t.trim()),
    blockers: form.blockers.map(e => e.text).filter(t => t.trim()),
    actions: form.actions.filter(a => a.text.trim()),
  };
}

const EMPTY_FORM: RetroForm = {
  sprintName: '', teamName: '', retroDate: new Date().toISOString().split('T')[0],
  goalMet: '', sprintGoal: '',
  wentWell:    [{ text: '' }],
  didntGoWell: [{ text: '' }],
  blockers:    [{ text: '' }],
  actions:     [{ text: '', owner: '', dueDate: '', priority: 'medium' }],
};

// ── Template download ──────────────────────────────────────────────────────────

function downloadTemplate() {
  const rows = [
    ['Sprint Name','Team Name','Retro Date','Sprint Goal Met (yes/no/partial)','Sprint Goal','What Went Well','What Did Not Go Well','Blocker/Impediment','Action Item','Action Owner','Action Due Date','Action Priority (high/medium/low)'],
    ['Sprint 42','Backend Team','2026-06-10','partial','Ship login redesign','Good team collaboration','Sprint planning was too long','Dependency on infra team blocked 3 stories','Schedule shorter planning sessions','Scrum Master','2026-06-17','high'],
    ['','','','','','Automated tests caught regressions','Story points were underestimated','','Add complexity review to refinement','Tech Lead','2026-06-24','medium'],
  ];
  const csv = buildSafeCsv(rows, { alwaysQuote: true });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'Retrospective_Template.csv'; a.click();
  URL.revokeObjectURL(url);
}

// Insight generation (themes, ownership gaps, next-sprint suggestions, etc.)
// lives in src/services/retro/retroInsights.service.ts — shared by the
// in-app form (one record) and the uploaded-file flow (one or more records).

// Clipboard write can silently fail (insecure context, missing permission,
// older browsers) — navigator.clipboard.writeText() alone has no fallback
// and no way for the caller to know it didn't work. This tries the modern
// API first, then falls back to a hidden-textarea + execCommand approach,
// and reports success/failure so the UI can give real feedback.
async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to the legacy fallback below
    }
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.className = styles.clipboardFallback;
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function EntryList({
  label, icon, items, onChange, placeholder,
}: { label: string; icon: string; items: RetroEntry[]; onChange: (v: RetroEntry[]) => void; placeholder: string }) {
  return (
    <div>
      <h3 className={styles.entryLabel}>{icon} {label}</h3>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text" value={item.text} placeholder={placeholder}
              onChange={e => { const next = [...items]; next[i] = { text: e.target.value }; onChange(next); }}
              className={clsx(styles.input, 'flex-1')}
            />
            {items.length > 1 && (
              <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))}
                className={styles.removeBtn}>×</button>
            )}
          </div>
        ))}
        <button type="button" onClick={() => onChange([...items, { text: '' }])}
          className={styles.addBtn}>+ Add another</button>
      </div>
    </div>
  );
}

// ── Insight panel (shared by the in-app form and the upload flow) ──────────────

function InsightPanel({ insight }: { insight: RetrospectiveInsight }) {
  const watch = [...insight.painPoints, ...insight.blockers];
  const doNext = [...insight.nextSprintSuggestions, ...insight.ceremonyRecommendations, ...insight.ownershipGaps];
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copyFailedIndex, setCopyFailedIndex] = useState<number | null>(null);

  async function handleCopy(item: { title: string; description: string; evidence: string }, i: number) {
    const ok = await copyToClipboard(`${item.title}\n\n${item.description}\n\nEvidence: ${item.evidence}`);
    setCopiedIndex(ok ? i : null);
    setCopyFailedIndex(ok ? null : i);
    setTimeout(() => { setCopiedIndex(null); setCopyFailedIndex(null); }, 1800);
  }

  return (
    <div className={clsx(styles.card, styles.cardMb)}>
      <div className="flex items-center justify-between mb-3">
        <h2 className={styles.insightTitle}>{insight.sprintName || 'Retrospective'}</h2>
        <span className={clsx('chip', styles.confidenceChip)}>
          Confidence: {insight.confidence}
        </span>
      </div>

      {insight.themes.length > 0 && (
        <div className={styles.themePills}>
          {insight.themes.map((t) => (
            <span key={t.category} className={styles.themePill}>
              {THEME_LABEL[t.category] ?? t.category} ({t.count})
            </span>
          ))}
        </div>
      )}

      <div className={styles.watchSection}>
        <h3 className={styles.sectionSubtitle}>👀 What to Watch</h3>
        {watch.length > 0 ? (
          <ul className={styles.bulletList}>
            {watch.map((w, i) => <li key={i} className={styles.bulletItem}>• {w}</li>)}
          </ul>
        ) : <p className={styles.emptyNote}>All clear — no pain points or blockers recorded.</p>}
      </div>

      <div className={styles.watchSection}>
        <h3 className={styles.sectionSubtitle}>✅ Do This Next</h3>
        {doNext.length > 0 ? (
          <ul className={styles.bulletList}>
            {doNext.map((s, i) => <li key={i} className={styles.bulletItem}>→ {s}</li>)}
          </ul>
        ) : <p className={styles.emptyNote}>No specific suggestions — good job, keep it up!</p>}
      </div>

      {insight.suggestedBacklogItems.length > 0 && (
        <div className={styles.watchSection}>
          <h3 className={styles.sectionSubtitle}>📝 Suggested Stories &amp; Tasks for Next Sprint</h3>
          <div className={styles.backlogItems}>
            {insight.suggestedBacklogItems.map((item, i) => (
              <div key={i} className={styles.backlogItem}>
                <div className={styles.backlogItemHeader}>
                  <span className={styles.priorityDot} data-priority={item.priority} />
                  <span className={styles.backlogItemType}>{item.type}</span>
                  <span className={styles.backlogItemTitle}>{item.title}</span>
                </div>
                {item.description.split('\n').map((line, li) => (
                  <p key={li} className={styles.backlogItemDesc}>{line}</p>
                ))}
                <p className={styles.backlogItemEvidence}>Evidence: {item.evidence}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(item, i)}
                    className={clsx('btn-xs flex-1', copyFailedIndex === i ? 'btn-outline-danger' : 'btn-primary')}
                  >
                    {copiedIndex === i ? 'Copied!' : copyFailedIndex === i ? 'Copy failed — select manually' : 'Copy'}
                  </button>
                  <button
                    type="button"
                    disabled
                    title="Coming soon — requires Jira write access, which this app does not yet have (see FUT-JIRA-02 roadmap item)."
                    className={clsx('btn-secondary btn-xs flex-1 disabled:opacity-50 disabled:cursor-not-allowed', styles.jiraBtn)}
                  >
                    Create in Jira<br />
                    <span className={styles.jiraBtnNote}>coming soon</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {insight.repeatedBlockers.length > 0 && (
        <p className={styles.amberNote}>
          ⚠ Repeated across sprints: {insight.repeatedBlockers.join(', ')}
        </p>
      )}
      {insight.duplicateActionItems.length > 0 && (
        <p className={styles.amberNote}>
          ⚠ Duplicate action items: {insight.duplicateActionItems.join(', ')}
        </p>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

type View = 'menu' | 'form' | 'insights' | 'upload' | 'upload-insights';

export default function RetroPage() {
  const [view,     setView]     = useState<View>('menu');
  const [form,     setForm]     = useState<RetroForm>(EMPTY_FORM);
  const [insight,  setInsight]  = useState<RetrospectiveInsight | null>(null);
  const [uploadPreview, setUploadPreview] = useState<UploadPreview | null>(null);
  const [uploadError,   setUploadError]   = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSubmit() {
    setInsight(generateRetrospectiveInsight(formToRecord(form), 'form'));
    setView('insights');
  }

  function patchForm(partial: Partial<RetroForm>) {
    setForm(f => ({ ...f, ...partial }));
  }

  async function handleFileSelected(file: File) {
    setUploadLoading(true);
    setUploadError(null);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/retro/parse', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error ?? 'Could not parse the uploaded file.');
        return;
      }
      setUploadPreview(data);
      setView('upload-insights');
    } catch {
      setUploadError('Network error while uploading. Check your connection and try again.');
    } finally {
      setUploadLoading(false);
    }
  }

  // ── Menu ──────────────────────────────────────────────────────────────────

  if (view === 'menu') return (
    <AppShell showNav>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <span className={clsx('chip c-acc', styles.deliveryChip)}>
            🔄 Delivery
          </span>
          <h1 className={styles.pageTitle}>Retrospective</h1>
          <p className={styles.pageSubtitle}>Capture what happened, what to improve, and generate next-action suggestions.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Fill in App — primary */}
          <button type="button" onClick={() => setView('form')} className={clsx(styles.menuCard, styles.menuCardPrimary)}>
            <div className={styles.menuCardIcon} aria-hidden="true">✍️</div>
            <h2 className={styles.menuCardTitle}>Fill in App</h2>
            <p className={styles.menuCardDesc}>Complete the retrospective form directly here. Get instant suggestions and action items on submit.</p>
            <p className={styles.menuCardCta}>Start →</p>
          </button>

          {/* Download Template — secondary */}
          <div className={clsx(styles.menuCard, styles.menuCardSecondary)}>
            <SvgIcon name="download" size={22} className={styles.menuCardIcon} />
            <h2 className={styles.menuCardTitle}>Download Template</h2>
            <p className={styles.menuCardDesc}>Download an Excel template (with an Instructions sheet and examples) to fill offline, then upload it here.</p>
            <button
              type="button"
              onClick={downloadRetroExcelTemplate}
              className={styles.menuCardCtaButton}
            >
              Download .xlsx →
            </button>
            <button
              type="button"
              onClick={downloadTemplate}
              className={styles.menuCardCsv}
            >
              or download as .csv instead
            </button>
          </div>

          {/* Upload File */}
          <button type="button" onClick={() => { setUploadError(null); setView('upload'); }} className={styles.menuCard}>
            <SvgIcon name="upload" size={22} className={styles.menuCardIconMuted} />
            <h2 className={styles.menuCardTitle}>Upload Retro File</h2>
            <p className={styles.menuCardDesc}>Upload a completed CSV, Excel, Markdown, or plain text retrospective for automated analysis.</p>
            <p className={styles.menuCardCta}>Upload →</p>
          </button>
        </div>

        {/* Info panel */}
        <div className={styles.infoPanel}>
          <p className={styles.infoPanelTitle}>What the retrospective tool does</p>
          <ul className={styles.infoPanelList}>
            {[
              'Captures what went well, what did not, and blockers',
              'Records action items with owners and due dates',
              'Generates insights and next-sprint recommendations',
              'Flags missing owners, due dates, and unresolved blockers',
            ].map((item, i) => (
              <li key={i} className={styles.infoPanelItem}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </AppShell>
  );

  // ── Form ──────────────────────────────────────────────────────────────────

  if (view === 'form') return (
    <AppShell showNav>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button type="button" onClick={() => setView('menu')} className={styles.backBtn}>← Back</button>
          <div>
            <h1 className={styles.formTitle}>Sprint Retrospective</h1>
            <p className={styles.formSubtitle}>Fill in all sections then click Submit to get suggestions.</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Context */}
          <div className={styles.card}>
            <h2 className={clsx(styles.sectionTitle, 'mb-4')}>📋 Sprint Context</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={styles.label}>Sprint Name *</label>
                <input type="text" value={form.sprintName} placeholder="e.g. Sprint 42"
                  onChange={e => patchForm({ sprintName: e.target.value })} className={styles.input} />
              </div>
              <div>
                <label className={styles.label}>Team Name</label>
                <input type="text" value={form.teamName} placeholder="e.g. Backend Team"
                  onChange={e => patchForm({ teamName: e.target.value })} className={styles.input} />
              </div>
              <div>
                <label className={styles.label}>Retro Date</label>
                <input type="date" value={form.retroDate} onChange={e => patchForm({ retroDate: e.target.value })} className={styles.input} />
              </div>
              <div>
                <label className={styles.label}>Sprint Goal Met?</label>
                <select value={form.goalMet} onChange={e => patchForm({ goalMet: e.target.value as RetroForm['goalMet'] })}
                  className={styles.input}>
                  <option value="">Select…</option>
                  <option value="yes">Yes</option>
                  <option value="partial">Partially</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className={styles.label}>Sprint Goal</label>
              <input type="text" value={form.sprintGoal} placeholder="What were you trying to achieve?"
                onChange={e => patchForm({ sprintGoal: e.target.value })} className={styles.input} />
            </div>
          </div>

          {/* Observations */}
          <div className={clsx(styles.card, 'flex flex-col gap-5')}>
            <h2 className={styles.sectionTitle}>🗣️ Team Observations</h2>
            <EntryList label="What Went Well" icon="✅" items={form.wentWell} onChange={v => patchForm({ wentWell: v })} placeholder="Something that worked well…" />
            <EntryList label="What Did Not Go Well" icon="❌" items={form.didntGoWell} onChange={v => patchForm({ didntGoWell: v })} placeholder="Something that caused friction or slippage…" />
            <EntryList label="Blockers & Impediments" icon="🚧" items={form.blockers} onChange={v => patchForm({ blockers: v })} placeholder="Something that blocked the team…" />
          </div>

          {/* Action Items */}
          <div className={styles.card}>
            <h2 className={clsx(styles.sectionTitle, 'mb-3')}>✅ Action Items</h2>
            <div className="space-y-3">
              {form.actions.map((a, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-start">
                  <input type="text" value={a.text} placeholder="Action…"
                    onChange={e => { const next = [...form.actions]; next[i] = { ...next[i], text: e.target.value }; patchForm({ actions: next }); }}
                    className={clsx(styles.input, 'col-span-4')} />
                  <input type="text" value={a.owner} placeholder="Owner"
                    onChange={e => { const next = [...form.actions]; next[i] = { ...next[i], owner: e.target.value }; patchForm({ actions: next }); }}
                    className={clsx(styles.input, 'col-span-3')} />
                  <input type="date" value={a.dueDate}
                    onChange={e => { const next = [...form.actions]; next[i] = { ...next[i], dueDate: e.target.value }; patchForm({ actions: next }); }}
                    className={clsx(styles.input, 'col-span-3')} />
                  <select value={a.priority}
                    onChange={e => { const next = [...form.actions]; next[i] = { ...next[i], priority: e.target.value as ActionItem['priority'] }; patchForm({ actions: next }); }}
                    className={clsx(styles.input, styles.prioritySelect, 'col-span-1')}>
                    <option value="high">H</option><option value="medium">M</option><option value="low">L</option>
                  </select>
                  {form.actions.length > 1 && (
                    <button type="button" onClick={() => patchForm({ actions: form.actions.filter((_, j) => j !== i) })}
                      className={styles.removeBtn}>×</button>
                  )}
                </div>
              ))}
              <button type="button"
                onClick={() => patchForm({ actions: [...form.actions, { text: '', owner: '', dueDate: '', priority: 'medium' }] })}
                className={styles.addBtn}>
                + Add action item
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button type="button" onClick={handleSubmit} disabled={!form.sprintName.trim()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
              Submit & Get Suggestions
            </button>
            <button type="button" onClick={() => { setForm(EMPTY_FORM); setView('menu'); }} className="btn-secondary">Cancel</button>
          </div>
        </div>
      </div>
    </AppShell>
  );

  // ── Insights ──────────────────────────────────────────────────────────────

  if (view === 'insights') {
  const filledActions = form.actions.filter(a => a.text.trim());

  return (
    <AppShell showNav>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button type="button" onClick={() => setView('form')} className={styles.backBtn}>← Edit</button>
          <div>
            <h1 className={styles.formTitle}>Retrospective: {form.sprintName}</h1>
            <p className={styles.formSubtitle}>{form.teamName || 'Team'} · {form.retroDate}</p>
          </div>
        </div>

        {/* Goal status — semantic data-attribute drives all color via SCSS */}
        {form.goalMet && (
          <div className={styles.goalBanner} data-goal={form.goalMet}>
            <span className={styles.goalBannerEmoji}>
              {form.goalMet === 'yes' ? '✅' : form.goalMet === 'partial' ? '⚠️' : '❌'}
            </span>
            <p className={styles.goalBannerText}>
              Sprint goal {form.goalMet === 'yes' ? 'achieved' : form.goalMet === 'partial' ? 'partially achieved' : 'not achieved'}{form.sprintGoal ? `: "${form.sprintGoal}"` : ''}
            </p>
          </div>
        )}

        {/* Insights */}
        {insight && <InsightPanel insight={insight} />}

        {/* Action items summary */}
        {filledActions.length > 0 && (
          <div className={clsx(styles.card, styles.cardMb)}>
            <h2 className={clsx(styles.sectionTitle, 'mb-3')}>✅ Next Actions ({filledActions.length})</h2>
            <div className={styles.actionItems}>
              {filledActions.map((a, i) => (
                <div key={i} className={styles.actionItem}>
                  <span className={styles.priorityDot} data-priority={a.priority} />
                  <span className={styles.actionText}>{a.text}</span>
                  {a.owner   && <span className={styles.actionMeta}>{a.owner}</span>}
                  {a.dueDate && <span className={styles.actionMeta}>{a.dueDate}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={() => { setForm(EMPTY_FORM); setView('menu'); }} className="btn-primary">New Retrospective</button>
          <button type="button" onClick={() => setView('form')} className="btn-secondary">Edit</button>
        </div>
      </div>
    </AppShell>
  );
  }

  // ── Upload ────────────────────────────────────────────────────────────────

  if (view === 'upload') return (
    <AppShell showNav>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button type="button" onClick={() => setView('menu')} className={styles.backBtn}>← Back</button>
          <div>
            <h1 className={styles.formTitle}>Upload Retrospective</h1>
            <p className={styles.formSubtitle}>CSV, Excel, Markdown, or plain text — up to 5 MB.</p>
          </div>
        </div>

        <input
          ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls,.md,.txt" className={styles.hiddenInput}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelected(f); }}
        />

        <button
          type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadLoading}
          className={styles.dropZone}
        >
          <SvgIcon name="upload" size={28} className={styles.dropZoneIcon} />
          <p className={styles.dropZoneTitle}>
            {uploadLoading ? 'Parsing file…' : 'Click to choose a file'}
          </p>
          <p className={styles.dropZoneHint}>.csv, .xlsx, .xls, .md, .txt</p>
        </button>

        {uploadError && (
          <div className={styles.errorBanner}>
            <p className={styles.errorText}>{uploadError}</p>
          </div>
        )}
      </div>
    </AppShell>
  );

  // ── Upload preview + insights ───────────────────────────────────────────────

  if (view === 'upload-insights' && uploadPreview) return (
    <AppShell showNav>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button type="button" onClick={() => { setUploadPreview(null); setView('upload'); }}
            className={styles.backBtn}>← Upload another</button>
          <div>
            <h1 className={styles.formTitle}>
              {uploadPreview.records.length} Retrospective{uploadPreview.records.length > 1 ? 's' : ''} Imported
            </h1>
            <p className={styles.formSubtitle}>Review the preview below before relying on it.</p>
          </div>
        </div>

        {(uploadPreview.warnings.length > 0 || uploadPreview.corrections.length > 0) && (
          <div className={styles.warningBanner}>
            <p className={styles.warningTitle}>Import notes</p>
            <ul className={styles.bulletList}>
              {uploadPreview.warnings.map((w, i) => <li key={`w-${i}`} className={styles.bulletItem}>• {w}</li>)}
              {uploadPreview.corrections.map((c, i) => <li key={`c-${i}`} className={styles.bulletItem}>• {c.reason}</li>)}
            </ul>
          </div>
        )}

        {uploadPreview.insights.map((ins) => <InsightPanel key={ins.id} insight={ins} />)}

        <div className="flex gap-3">
          <button type="button" onClick={() => { setUploadPreview(null); setView('menu'); }} className="btn-primary">Done</button>
          <button type="button" onClick={() => { setUploadPreview(null); setView('upload'); }} className="btn-secondary">Upload another</button>
        </div>
      </div>
    </AppShell>
  );

  return null;
}
