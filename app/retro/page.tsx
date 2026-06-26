// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// /retro — Sprint retrospective: fill in-app, download template, or upload file.
'use client';
import { useRef, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { SvgIcon } from '@/components/ui/SvgIcon';
import { downloadRetroExcelTemplate } from '@/services/retro/retroTemplate.service';
import { generateRetrospectiveInsight } from '@/services/retro/retroInsights.service';
import type { RetroRecord, RetrospectiveInsight, RetroDataCorrection } from '@/types/retrospective';

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
  const csv = [
    ['Sprint Name','Team Name','Retro Date','Sprint Goal Met (yes/no/partial)','Sprint Goal','What Went Well','What Did Not Go Well','Blocker/Impediment','Action Item','Action Owner','Action Due Date','Action Priority (high/medium/low)'],
    ['Sprint 42','Backend Team','2026-06-10','partial','Ship login redesign','Good team collaboration','Sprint planning was too long','Dependency on infra team blocked 3 stories','Schedule shorter planning sessions','Scrum Master','2026-06-17','high'],
    ['','','','','','Automated tests caught regressions','Story points were underestimated','','Add complexity review to refinement','Tech Lead','2026-06-24','medium'],
  ].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'Retrospective_Template.csv'; a.click();
  URL.revokeObjectURL(url);
}

// Insight generation (themes, ownership gaps, next-sprint suggestions, etc.)
// lives in src/services/retro/retroInsights.service.ts — shared by the
// in-app form (one record) and the uploaded-file flow (one or more records).

// ── Shared styles ──────────────────────────────────────────────────────────────

const inputSt: React.CSSProperties = {
  width: '100%',
  background: 'var(--dc-s3)',
  border: '1px solid var(--dc-bdr2)',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 13,
  color: 'var(--dc-p1)',
  outline: 'none',
};

const sectionCard: React.CSSProperties = {
  background: 'var(--dc-s2)',
  border: '1px solid var(--dc-bdr)',
  borderRadius: 12,
  padding: 20,
};

const labelSt: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--dc-p2)',
  marginBottom: 4,
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function EntryList({
  label, icon, items, onChange, placeholder,
}: { label: string; icon: string; items: RetroEntry[]; onChange: (v: RetroEntry[]) => void; placeholder: string }) {
  return (
    <div>
      <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--dc-p1)', marginBottom: 8 }}>{icon} {label}</h3>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text" value={item.text} placeholder={placeholder}
              onChange={e => { const next = [...items]; next[i] = { text: e.target.value }; onChange(next); }}
              style={{ ...inputSt, flex: 1 }}
            />
            {items.length > 1 && (
              <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))}
                style={{ color: 'var(--dc-p3)', fontSize: 18, padding: '0 4px', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
            )}
          </div>
        ))}
        <button type="button" onClick={() => onChange([...items, { text: '' }])}
          style={{ fontSize: 11, fontWeight: 700, color: 'var(--dc-acc2)', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add another</button>
      </div>
    </div>
  );
}

// ── Insight panel (shared by the in-app form and the upload flow) ──────────────

const THEME_LABEL: Record<string, string> = {
  process: 'Process', communication: 'Communication', requirements: 'Requirements',
  'qa-release': 'QA & Release', dependency: 'Dependency', technical: 'Technical', planning: 'Planning',
};

function InsightPanel({ insight }: { insight: RetrospectiveInsight }) {
  const watch = [...insight.painPoints, ...insight.blockers];
  const doNext = [...insight.nextSprintSuggestions, ...insight.ceremonyRecommendations, ...insight.ownershipGaps];

  return (
    <div style={{ ...sectionCard, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ fontSize: 14, fontWeight: 800, color: 'var(--dc-p1)' }}>{insight.sprintName || 'Retrospective'}</h2>
        <span className="chip" style={{ fontSize: 10, fontWeight: 700, borderRadius: 100, padding: '2px 8px' }}>
          Confidence: {insight.confidence}
        </span>
      </div>

      {insight.themes.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {insight.themes.map((t) => (
            <span key={t.category} style={{ fontSize: 10, fontWeight: 700, color: 'var(--dc-acc2)', background: 'rgba(255,138,76,0.1)', border: '1px solid rgba(255,138,76,0.2)', borderRadius: 100, padding: '3px 10px' }}>
              {THEME_LABEL[t.category] ?? t.category} ({t.count})
            </span>
          ))}
        </div>
      )}

      <div style={{ marginBottom: 14 }}>
        <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--dc-p1)', marginBottom: 6 }}>👀 What to Watch</h3>
        {watch.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {watch.map((w, i) => <li key={i} style={{ fontSize: 12, color: 'var(--dc-p2)' }}>• {w}</li>)}
          </ul>
        ) : <p style={{ fontSize: 12, color: 'var(--dc-p3)' }}>All clear — no pain points or blockers recorded.</p>}
      </div>

      <div style={{ marginBottom: insight.repeatedBlockers.length || insight.duplicateActionItems.length ? 14 : 0 }}>
        <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--dc-p1)', marginBottom: 6 }}>✅ Do This Next</h3>
        {doNext.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {doNext.map((s, i) => <li key={i} style={{ fontSize: 12, color: 'var(--dc-p2)' }}>→ {s}</li>)}
          </ul>
        ) : <p style={{ fontSize: 12, color: 'var(--dc-p3)' }}>No specific suggestions — good job, keep it up!</p>}
      </div>

      {insight.repeatedBlockers.length > 0 && (
        <p style={{ fontSize: 11, color: 'var(--dc-amber)', marginBottom: 6 }}>
          ⚠ Repeated across sprints: {insight.repeatedBlockers.join(', ')}
        </p>
      )}
      {insight.duplicateActionItems.length > 0 && (
        <p style={{ fontSize: 11, color: 'var(--dc-amber)' }}>
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
          <span className="chip c-acc" style={{ borderRadius: 100, padding: '4px 12px', marginBottom: 12, display: 'inline-flex' }}>
            🔄 Delivery
          </span>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--dc-p1)', letterSpacing: '-0.02em', marginBottom: 4 }}>Retrospective</h1>
          <p style={{ fontSize: 13, color: 'var(--dc-p2)' }}>Capture what happened, what to improve, and generate next-action suggestions.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Fill in App — primary */}
          <button type="button" onClick={() => setView('form')} style={{
            background: 'rgba(232,93,18,0.08)',
            border: '1px solid rgba(232,93,18,0.2)',
            borderTop: '2px solid var(--dc-accent)',
            borderRadius: 12,
            padding: 20,
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}>
            <div style={{ fontSize: 22, marginBottom: 12 }}>✍️</div>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--dc-p1)', marginBottom: 6 }}>Fill in App</h2>
            <p style={{ fontSize: 11, color: 'var(--dc-p2)', lineHeight: 1.6, marginBottom: 12 }}>Complete the retrospective form directly here. Get instant suggestions and action items on submit.</p>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--dc-acc2)' }}>Start →</p>
          </button>

          {/* Download Template — secondary */}
          <button type="button" onClick={downloadRetroExcelTemplate} style={{
            background: 'rgba(255,138,76,0.06)',
            border: '1px solid rgba(255,138,76,0.15)',
            borderTop: '2px solid var(--dc-acc2)',
            borderRadius: 12,
            padding: 20,
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}>
            <SvgIcon name="download" size={22} style={{ color: 'var(--dc-acc2)', marginBottom: 12 }} />
            <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--dc-p1)', marginBottom: 6 }}>Download Template</h2>
            <p style={{ fontSize: 11, color: 'var(--dc-p2)', lineHeight: 1.6, marginBottom: 12 }}>Download an Excel template (with an Instructions sheet and examples) to fill offline, then upload it here.</p>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--dc-acc2)' }}>Download .xlsx →</p>
            <span
              role="button" tabIndex={0}
              onClick={(e) => { e.stopPropagation(); downloadTemplate(); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); downloadTemplate(); } }}
              style={{ display: 'block', marginTop: 8, fontSize: 10, fontWeight: 600, color: 'var(--dc-p3)', textDecoration: 'underline', cursor: 'pointer' }}
            >
              or download as .csv instead
            </span>
          </button>

          {/* Upload File */}
          <button type="button" onClick={() => { setUploadError(null); setView('upload'); }} style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--dc-bdr)',
            borderRadius: 12,
            padding: 20,
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}>
            <SvgIcon name="upload" size={22} style={{ color: 'var(--dc-p2)', marginBottom: 12 }} />
            <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--dc-p1)', marginBottom: 6 }}>Upload Retro File</h2>
            <p style={{ fontSize: 11, color: 'var(--dc-p2)', lineHeight: 1.6, marginBottom: 12 }}>Upload a completed CSV, Excel, Markdown, or plain text retrospective for automated analysis.</p>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--dc-acc2)' }}>Upload →</p>
          </button>
        </div>

        {/* Info panel */}
        <div style={{ marginTop: 32, background: 'var(--dc-s2)', border: '1px solid var(--dc-bdr)', borderRadius: 10, padding: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--dc-p1)', marginBottom: 8 }}>What the retrospective tool does</p>
          <ul style={{ paddingLeft: 16, margin: 0 }}>
            {[
              'Captures what went well, what did not, and blockers',
              'Records action items with owners and due dates',
              'Generates insights and next-sprint recommendations',
              'Flags missing owners, due dates, and unresolved blockers',
            ].map((item, i) => (
              <li key={i} style={{ fontSize: 12, color: 'var(--dc-p2)', marginBottom: i < 3 ? 4 : 0 }}>{item}</li>
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
          <button type="button" onClick={() => setView('menu')}
            style={{ fontSize: 13, color: 'var(--dc-p2)', background: 'none', border: 'none', cursor: 'pointer' }}>← Back</button>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--dc-p1)' }}>Sprint Retrospective</h1>
            <p style={{ fontSize: 12, color: 'var(--dc-p3)' }}>Fill in all sections then click Submit to get suggestions.</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Context */}
          <div style={sectionCard}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--dc-p1)', marginBottom: 16 }}>📋 Sprint Context</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={labelSt}>Sprint Name *</label>
                <input type="text" value={form.sprintName} placeholder="e.g. Sprint 42"
                  onChange={e => patchForm({ sprintName: e.target.value })} style={inputSt} />
              </div>
              <div>
                <label style={labelSt}>Team Name</label>
                <input type="text" value={form.teamName} placeholder="e.g. Backend Team"
                  onChange={e => patchForm({ teamName: e.target.value })} style={inputSt} />
              </div>
              <div>
                <label style={labelSt}>Retro Date</label>
                <input type="date" value={form.retroDate} onChange={e => patchForm({ retroDate: e.target.value })} style={inputSt} />
              </div>
              <div>
                <label style={labelSt}>Sprint Goal Met?</label>
                <select value={form.goalMet} onChange={e => patchForm({ goalMet: e.target.value as RetroForm['goalMet'] })}
                  style={{ ...inputSt, background: 'var(--dc-s3)' }}>
                  <option value="">Select…</option>
                  <option value="yes">Yes</option>
                  <option value="partial">Partially</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={labelSt}>Sprint Goal</label>
              <input type="text" value={form.sprintGoal} placeholder="What were you trying to achieve?"
                onChange={e => patchForm({ sprintGoal: e.target.value })} style={inputSt} />
            </div>
          </div>

          {/* Observations */}
          <div style={{ ...sectionCard, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--dc-p1)' }}>🗣️ Team Observations</h2>
            <EntryList label="What Went Well" icon="✅" items={form.wentWell} onChange={v => patchForm({ wentWell: v })} placeholder="Something that worked well…" />
            <EntryList label="What Did Not Go Well" icon="❌" items={form.didntGoWell} onChange={v => patchForm({ didntGoWell: v })} placeholder="Something that caused friction or slippage…" />
            <EntryList label="Blockers & Impediments" icon="🚧" items={form.blockers} onChange={v => patchForm({ blockers: v })} placeholder="Something that blocked the team…" />
          </div>

          {/* Action Items */}
          <div style={sectionCard}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--dc-p1)', marginBottom: 12 }}>✅ Action Items</h2>
            <div className="space-y-3">
              {form.actions.map((a, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-start">
                  <input type="text" value={a.text} placeholder="Action…"
                    onChange={e => { const next = [...form.actions]; next[i] = { ...next[i], text: e.target.value }; patchForm({ actions: next }); }}
                    style={inputSt} className="col-span-4" />
                  <input type="text" value={a.owner} placeholder="Owner"
                    onChange={e => { const next = [...form.actions]; next[i] = { ...next[i], owner: e.target.value }; patchForm({ actions: next }); }}
                    style={inputSt} className="col-span-3" />
                  <input type="date" value={a.dueDate}
                    onChange={e => { const next = [...form.actions]; next[i] = { ...next[i], dueDate: e.target.value }; patchForm({ actions: next }); }}
                    style={inputSt} className="col-span-3" />
                  <select value={a.priority}
                    onChange={e => { const next = [...form.actions]; next[i] = { ...next[i], priority: e.target.value as ActionItem['priority'] }; patchForm({ actions: next }); }}
                    style={{ ...inputSt, padding: '8px 6px', fontSize: 11 }} className="col-span-1">
                    <option value="high">H</option><option value="medium">M</option><option value="low">L</option>
                  </select>
                  {form.actions.length > 1 && (
                    <button type="button" onClick={() => patchForm({ actions: form.actions.filter((_, j) => j !== i) })}
                      style={{ color: 'var(--dc-p3)', fontSize: 18, background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                  )}
                </div>
              ))}
              <button type="button"
                onClick={() => patchForm({ actions: [...form.actions, { text: '', owner: '', dueDate: '', priority: 'medium' }] })}
                style={{ fontSize: 11, fontWeight: 700, color: 'var(--dc-acc2)', background: 'none', border: 'none', cursor: 'pointer' }}>
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

  const filledActions = form.actions.filter(a => a.text.trim());
  const goalColorMap = {
    yes:     { bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)',   text: 'var(--dc-green)' },
    partial: { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)',  text: 'var(--dc-amber)' },
    no:      { bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)', text: 'var(--dc-red)'   },
  };
  const gc = form.goalMet ? goalColorMap[form.goalMet as keyof typeof goalColorMap] : null;

  return (
    <AppShell showNav>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button type="button" onClick={() => setView('form')}
            style={{ fontSize: 13, color: 'var(--dc-p2)', background: 'none', border: 'none', cursor: 'pointer' }}>← Edit</button>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--dc-p1)' }}>Retrospective: {form.sprintName}</h1>
            <p style={{ fontSize: 12, color: 'var(--dc-p3)' }}>{form.teamName || 'Team'} · {form.retroDate}</p>
          </div>
        </div>

        {/* Goal status */}
        {gc && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderRadius: 12, border: `1px solid ${gc.border}`, background: gc.bg, padding: '12px 20px', marginBottom: 20 }}>
            <span style={{ fontSize: 20 }}>{form.goalMet === 'yes' ? '✅' : form.goalMet === 'partial' ? '⚠️' : '❌'}</span>
            <p style={{ fontSize: 13, fontWeight: 700, color: gc.text }}>
              Sprint goal {form.goalMet === 'yes' ? 'achieved' : form.goalMet === 'partial' ? 'partially achieved' : 'not achieved'}{form.sprintGoal ? `: "${form.sprintGoal}"` : ''}
            </p>
          </div>
        )}

        {/* Insights */}
        {insight && <InsightPanel insight={insight} />}

        {/* Action items summary */}
        {filledActions.length > 0 && (
          <div style={{ ...sectionCard, marginBottom: 20 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--dc-p1)', marginBottom: 12 }}>✅ Next Actions ({filledActions.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filledActions.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: a.priority === 'high' ? 'var(--dc-red)' : a.priority === 'medium' ? 'var(--dc-amber)' : 'var(--dc-green)' }} />
                  <span style={{ flex: 1, color: 'var(--dc-p1)' }}>{a.text}</span>
                  {a.owner   && <span style={{ fontSize: 11, color: 'var(--dc-p3)', flexShrink: 0 }}>{a.owner}</span>}
                  {a.dueDate && <span style={{ fontSize: 11, color: 'var(--dc-p3)', flexShrink: 0 }}>{a.dueDate}</span>}
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

  // ── Upload ────────────────────────────────────────────────────────────────

  if (view === 'upload') return (
    <AppShell showNav>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button type="button" onClick={() => setView('menu')}
            style={{ fontSize: 13, color: 'var(--dc-p2)', background: 'none', border: 'none', cursor: 'pointer' }}>← Back</button>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--dc-p1)' }}>Upload Retrospective</h1>
            <p style={{ fontSize: 12, color: 'var(--dc-p3)' }}>CSV, Excel, Markdown, or plain text — up to 5 MB.</p>
          </div>
        </div>

        <input
          ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls,.md,.txt" style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelected(f); }}
        />

        <button
          type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadLoading}
          style={{
            ...sectionCard, width: '100%', textAlign: 'center', padding: 40, cursor: uploadLoading ? 'wait' : 'pointer',
            border: '1px dashed var(--dc-bdr2)',
          }}
        >
          <SvgIcon name="upload" size={28} style={{ color: 'var(--dc-acc2)', marginBottom: 12 }} />
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--dc-p1)', marginBottom: 4 }}>
            {uploadLoading ? 'Parsing file…' : 'Click to choose a file'}
          </p>
          <p style={{ fontSize: 11, color: 'var(--dc-p3)' }}>.csv, .xlsx, .xls, .md, .txt</p>
        </button>

        {uploadError && (
          <div style={{ marginTop: 16, borderRadius: 10, border: '1px solid rgba(248,113,113,0.25)', background: 'rgba(248,113,113,0.1)', padding: '12px 16px' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--dc-red)' }}>{uploadError}</p>
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
            style={{ fontSize: 13, color: 'var(--dc-p2)', background: 'none', border: 'none', cursor: 'pointer' }}>← Upload another</button>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--dc-p1)' }}>
              {uploadPreview.records.length} Retrospective{uploadPreview.records.length > 1 ? 's' : ''} Imported
            </h1>
            <p style={{ fontSize: 12, color: 'var(--dc-p3)' }}>Review the preview below before relying on it.</p>
          </div>
        </div>

        {(uploadPreview.warnings.length > 0 || uploadPreview.corrections.length > 0) && (
          <div style={{ marginBottom: 20, borderRadius: 10, border: '1px solid rgba(245,158,11,0.25)', background: 'rgba(245,158,11,0.08)', padding: '12px 16px' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--dc-amber)', marginBottom: 6 }}>Import notes</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {uploadPreview.warnings.map((w, i) => <li key={`w-${i}`} style={{ fontSize: 11, color: 'var(--dc-p2)' }}>• {w}</li>)}
              {uploadPreview.corrections.map((c, i) => <li key={`c-${i}`} style={{ fontSize: 11, color: 'var(--dc-p2)' }}>• {c.reason}</li>)}
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
