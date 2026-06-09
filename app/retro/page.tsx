// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// /retro — Sprint retrospective: fill in-app, download template, or upload file.
'use client';
import { useState } from 'react';
import AppShell from '@/components/layout/AppShell';

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

// ── Insights engine ────────────────────────────────────────────────────────────

function generateInsights(form: RetroForm): string[] {
  const insights: string[] = [];
  const blockers  = form.blockers.filter(b => b.text.trim()).length;
  const actions   = form.actions.filter(a => a.text.trim()).length;
  const highActs  = form.actions.filter(a => a.priority === 'high' && a.text.trim()).length;
  const noOwner   = form.actions.filter(a => a.text.trim() && !a.owner.trim()).length;
  const noDue     = form.actions.filter(a => a.text.trim() && !a.dueDate.trim()).length;

  if (form.goalMet === 'no')      insights.push('Sprint goal was not met. Review capacity planning and scope commitment for the next sprint.');
  if (form.goalMet === 'partial') insights.push('Sprint goal was partially met. Identify which stories caused slippage and prioritise them first next sprint.');
  if (blockers > 0) insights.push(`${blockers} blocker${blockers > 1 ? 's' : ''} recorded. Escalate unresolved blockers to the next planning session.`);
  if (highActs > 0) insights.push(`${highActs} high-priority action item${highActs > 1 ? 's' : ''} need immediate follow-up.`);
  if (noOwner > 0)  insights.push(`${noOwner} action item${noOwner > 1 ? 's are' : ' is'} missing an owner — assign owners to ensure accountability.`);
  if (noDue > 0)    insights.push(`${noDue} action item${noDue > 1 ? 's are' : ' is'} missing a due date — set deadlines to track completion.`);
  if (actions === 0) insights.push('No action items recorded. Consider whether improvement opportunities were missed.');
  if (form.wentWell.filter(w => w.text.trim()).length > 0) insights.push('Capture what went well and reinforce those practices in the next sprint.');

  return insights;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function EntryList({
  label, icon, items, onChange, placeholder,
}: { label: string; icon: string; items: RetroEntry[]; onChange: (v: RetroEntry[]) => void; placeholder: string }) {
  return (
    <div>
      <h3 className="text-sm font-black text-slate-900 mb-2">{icon} {label}</h3>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text" value={item.text} placeholder={placeholder}
              onChange={e => { const next = [...items]; next[i] = { text: e.target.value }; onChange(next); }}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
            />
            {items.length > 1 && (
              <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))}
                className="text-slate-300 hover:text-red-400 text-lg px-1 transition-colors">×</button>
            )}
          </div>
        ))}
        <button type="button" onClick={() => onChange([...items, { text: '' }])}
          className="text-xs font-bold text-blue-500 hover:text-blue-700 transition-colors">+ Add another</button>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

type View = 'menu' | 'form' | 'insights';

export default function RetroPage() {
  const [view,     setView]     = useState<View>('menu');
  const [form,     setForm]     = useState<RetroForm>(EMPTY_FORM);
  const [insights, setInsights] = useState<string[]>([]);

  function handleSubmit() {
    setInsights(generateInsights(form));
    setView('insights');
  }

  function patchForm(partial: Partial<RetroForm>) {
    setForm(f => ({ ...f, ...partial }));
  }

  // ── Menu ──────────────────────────────────────────────────────────────────

  if (view === 'menu') return (
    <AppShell showNav>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-full px-3 py-1 text-xs font-bold text-teal-700 mb-3">
            🔄 Delivery
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Retrospective</h1>
          <p className="text-sm text-slate-500">Capture what happened, what to improve, and generate next-action suggestions.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Fill in App */}
          <button type="button" onClick={() => setView('form')}
            className="bg-white border-2 border-blue-200 hover:border-blue-400 rounded-2xl p-6 text-left transition-all hover:shadow-md group">
            <div className="text-3xl mb-3">✍️</div>
            <h2 className="text-sm font-black text-slate-900 mb-1">Fill in App</h2>
            <p className="text-xs text-slate-500">Complete the retrospective form directly here. Get instant suggestions and action items on submit.</p>
            <p className="text-xs font-bold text-blue-500 mt-3 group-hover:text-blue-700 transition-colors">Start →</p>
          </button>

          {/* Download Template */}
          <button type="button" onClick={downloadTemplate}
            className="bg-white border-2 border-green-200 hover:border-green-400 rounded-2xl p-6 text-left transition-all hover:shadow-md group">
            <div className="text-3xl mb-3">📥</div>
            <h2 className="text-sm font-black text-slate-900 mb-1">Download Template</h2>
            <p className="text-xs text-slate-500">Download a CSV template to fill with your team offline, then upload it here.</p>
            <p className="text-xs font-bold text-green-500 mt-3 group-hover:text-green-700 transition-colors">Download CSV →</p>
          </button>

          {/* Upload File (coming soon) */}
          <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-6 text-left opacity-60">
            <div className="text-3xl mb-3">📤</div>
            <h2 className="text-sm font-black text-slate-900 mb-1">Upload Retro File</h2>
            <p className="text-xs text-slate-500">Upload a completed CSV or Excel retrospective for automated analysis.</p>
            <p className="text-xs font-bold text-slate-400 mt-3">Coming soon</p>
          </div>
        </div>

        {/* Info strip */}
        <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700">
          <p className="font-bold mb-1">What the retrospective tool does</p>
          <ul className="space-y-0.5 list-disc list-inside text-blue-600">
            <li>Captures what went well, what did not, and blockers</li>
            <li>Records action items with owners and due dates</li>
            <li>Generates insights and next-sprint recommendations</li>
            <li>Flags missing owners, due dates, and unresolved blockers</li>
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
          <button type="button" onClick={() => setView('menu')} className="text-slate-400 hover:text-slate-600 text-sm">← Back</button>
          <div>
            <h1 className="text-xl font-black text-slate-900">Sprint Retrospective</h1>
            <p className="text-xs text-slate-400">Fill in all sections then click Submit to get suggestions.</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Context */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-slate-900">📋 Sprint Context</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Sprint Name *</label>
                <input type="text" value={form.sprintName} placeholder="e.g. Sprint 42"
                  onChange={e => patchForm({ sprintName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Team Name</label>
                <input type="text" value={form.teamName} placeholder="e.g. Backend Team"
                  onChange={e => patchForm({ teamName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Retro Date</label>
                <input type="date" value={form.retroDate} onChange={e => patchForm({ retroDate: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Sprint Goal Met?</label>
                <select value={form.goalMet} onChange={e => patchForm({ goalMet: e.target.value as RetroForm['goalMet'] })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition">
                  <option value="">Select…</option>
                  <option value="yes">Yes</option>
                  <option value="partial">Partially</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Sprint Goal</label>
              <input type="text" value={form.sprintGoal} placeholder="What were you trying to achieve?"
                onChange={e => patchForm({ sprintGoal: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition" />
            </div>
          </div>

          {/* Observations */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
            <h2 className="text-sm font-black text-slate-900">🗣️ Team Observations</h2>
            <EntryList label="What Went Well" icon="✅" items={form.wentWell} onChange={v => patchForm({ wentWell: v })} placeholder="Something that worked well…" />
            <EntryList label="What Did Not Go Well" icon="❌" items={form.didntGoWell} onChange={v => patchForm({ didntGoWell: v })} placeholder="Something that caused friction or slippage…" />
            <EntryList label="Blockers & Impediments" icon="🚧" items={form.blockers} onChange={v => patchForm({ blockers: v })} placeholder="Something that blocked the team…" />
          </div>

          {/* Action Items */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-black text-slate-900 mb-3">✅ Action Items</h2>
            <div className="space-y-3">
              {form.actions.map((a, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-start">
                  <input type="text" value={a.text} placeholder="Action…" onChange={e => { const next = [...form.actions]; next[i] = { ...next[i], text: e.target.value }; patchForm({ actions: next }); }}
                    className="col-span-4 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition" />
                  <input type="text" value={a.owner} placeholder="Owner" onChange={e => { const next = [...form.actions]; next[i] = { ...next[i], owner: e.target.value }; patchForm({ actions: next }); }}
                    className="col-span-3 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition" />
                  <input type="date" value={a.dueDate} onChange={e => { const next = [...form.actions]; next[i] = { ...next[i], dueDate: e.target.value }; patchForm({ actions: next }); }}
                    className="col-span-3 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition" />
                  <select value={a.priority} onChange={e => { const next = [...form.actions]; next[i] = { ...next[i], priority: e.target.value as ActionItem['priority'] }; patchForm({ actions: next }); }}
                    className="col-span-1 rounded-xl border border-slate-200 px-2 py-2 text-xs bg-white focus:border-blue-400 focus:outline-none">
                    <option value="high">H</option><option value="medium">M</option><option value="low">L</option>
                  </select>
                  {form.actions.length > 1 && <button type="button" onClick={() => patchForm({ actions: form.actions.filter((_, j) => j !== i) })} className="text-slate-300 hover:text-red-400 text-lg transition-colors">×</button>}
                </div>
              ))}
              <button type="button" onClick={() => patchForm({ actions: [...form.actions, { text: '', owner: '', dueDate: '', priority: 'medium' }] })}
                className="text-xs font-bold text-blue-500 hover:text-blue-700 transition-colors">+ Add action item</button>
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
  return (
    <AppShell showNav>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button type="button" onClick={() => setView('form')} className="text-slate-400 hover:text-slate-600 text-sm">← Edit</button>
          <div>
            <h1 className="text-xl font-black text-slate-900">Retrospective: {form.sprintName}</h1>
            <p className="text-xs text-slate-400">{form.teamName || 'Team'} · {form.retroDate}</p>
          </div>
        </div>

        {/* Goal status */}
        {form.goalMet && (
          <div className={`flex items-center gap-3 rounded-2xl border px-5 py-3 mb-5 ${form.goalMet === 'yes' ? 'bg-green-50 border-green-200 text-green-700' : form.goalMet === 'partial' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            <span className="text-xl">{form.goalMet === 'yes' ? '✅' : form.goalMet === 'partial' ? '⚠️' : '❌'}</span>
            <p className="font-bold text-sm">Sprint goal {form.goalMet === 'yes' ? 'achieved' : form.goalMet === 'partial' ? 'partially achieved' : 'not achieved'}{form.sprintGoal ? `: "${form.sprintGoal}"` : ''}</p>
          </div>
        )}

        {/* Insights */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 mb-5">
          <h2 className="text-sm font-black text-slate-900 mb-3">💡 Suggestions</h2>
          {insights.length > 0 ? (
            <ul className="space-y-2">
              {insights.map((ins, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="text-blue-400 mt-0.5 shrink-0">→</span>{ins}
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-slate-400">No specific suggestions. Good job — keep it up!</p>}
        </div>

        {/* Action items summary */}
        {filledActions.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 mb-5">
            <h2 className="text-sm font-black text-slate-900 mb-3">✅ Next Actions ({filledActions.length})</h2>
            <div className="space-y-2">
              {filledActions.map((a, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${a.priority === 'high' ? 'bg-red-400' : a.priority === 'medium' ? 'bg-amber-400' : 'bg-green-400'}`} />
                  <span className="flex-1 text-slate-700">{a.text}</span>
                  {a.owner && <span className="text-[11px] text-slate-400 shrink-0">{a.owner}</span>}
                  {a.dueDate && <span className="text-[11px] text-slate-400 shrink-0">{a.dueDate}</span>}
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
