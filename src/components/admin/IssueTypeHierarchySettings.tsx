// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
'use client';
import { useState, type CSSProperties } from 'react';
import { SvgIcon } from '@/components/ui/SvgIcon';
import type { IssueTypeDefinition, IssueTypeHierarchyConfig } from '@/types/issueTypeHierarchy';
import { buildIssueTypeId } from '@/types/issueTypeHierarchy';
import { deriveColorSet } from '@/lib/colorSwatch';
import styles from './IssueTypeHierarchySettings.module.scss';

type CSSVariableProperties = CSSProperties & Record<`--${string}`, string>;

interface Props {
  config: IssueTypeHierarchyConfig;
  onSave: (types: IssueTypeDefinition[]) => Promise<void>;
}

const ICON_OPTIONS = [
  'package', 'briefcase', 'target', 'roadmap', 'story', 'checkCircle', 'subtasks',
  'bug', 'flask', 'warning', 'alert', 'refresh', 'flag', 'goal', 'board', 'folder',
];

const COLOR_PRESETS = [
  { color: '#0e7490', bg: '#ecfeff', border: '#67e8f9' },
  { color: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd' },
  { color: '#0369a1', bg: '#f0f9ff', border: '#7dd3fc' },
  { color: '#7c3aed', bg: '#faf5ff', border: '#a78bfa' },
  { color: '#2563eb', bg: '#eff6ff', border: '#93c5fd' },
  { color: '#475569', bg: '#f8fafc', border: '#cbd5e1' },
  { color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
  { color: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
  { color: '#9f1239', bg: '#fff1f2', border: '#fda4af' },
  { color: '#0f766e', bg: '#f0fdfa', border: '#5eead4' },
  { color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' },
];

function levelLabel(level: number, levels: number[]): string {
  const sorted = [...new Set(levels)].sort((a, b) => a - b);
  const position = sorted.indexOf(level);
  if (position === 0) return `Level ${level} — Root`;
  if (position === sorted.length - 1) return `Level ${level} — Deepest`;
  return `Level ${level}`;
}

export default function IssueTypeHierarchySettings({ config, onSave }: Props) {
  const [types, setTypes]   = useState<IssueTypeDefinition[]>([...config.types]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState<{ text: string; ok: boolean } | null>(null);

  const sorted = [...types].sort((a, b) => a.level - b.level || a.label.localeCompare(b.label));
  const levels = types.map(t => t.level);

  function updateType(id: string, patch: Partial<IssueTypeDefinition>) {
    setTypes(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
  }

  function updateMatchNames(id: string, raw: string) {
    const matchNames = raw.split(',').map(s => s.trim()).filter(Boolean);
    updateType(id, { matchNames: matchNames.length ? matchNames : [''] });
  }

  function addType() {
    const label = 'New Type';
    const id = buildIssueTypeId(label, types.map(t => t.id));
    const maxLevel = types.length ? Math.max(...types.map(t => t.level)) : 0;
    const preset = COLOR_PRESETS[types.length % COLOR_PRESETS.length];
    setTypes(prev => [...prev, {
      id, label, matchNames: [label.toLowerCase()], level: maxLevel + 1,
      icon: 'folder', ...preset, size: 'md', builtIn: false,
    }]);
  }

  function removeType(id: string) {
    setTypes(prev => prev.filter(t => t.id !== id));
  }

  function moveLevel(id: string, direction: -1 | 1) {
    updateType(id, { level: Math.max(0, (types.find(t => t.id === id)?.level ?? 0) + direction) });
  }

  async function handleSave() {
    setSaving(true); setMsg(null);
    try {
      await onSave(types);
      setMsg({ text: 'Issue type hierarchy saved. Explore page will use it on next load.', ok: true });
    } catch (e: any) {
      setMsg({ text: e?.message ?? 'Failed to save.', ok: false });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 5000);
    }
  }

  function handleReset() {
    setTypes([...config.types]);
    setMsg(null);
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600">
        <p className="font-bold text-slate-700 mb-1">How this works</p>
        <p className="mt-1">
          Each type maps one or more raw Jira &ldquo;Issue Type&rdquo; names to a display label, icon, color, and a
          <strong> hierarchy level</strong> — level 0 is the topmost root (e.g. Product), and each
          increasing level is one step deeper (e.g. Product → Project → Epic → Story → Sub-task).
        </p>
        <p className="mt-1">
          The Explore page uses these levels to infer missing parent links (an item with no explicit parent
          is matched to an item one level up sharing the same project key) and to decide which types are
          legitimate roots rather than orphans.
        </p>
        <p className="text-slate-400 mt-2">Built-in types can be re-mapped and reordered, but not deleted.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">Issue Types &amp; Hierarchy</h3>
          <button type="button" onClick={addType} className="btn-secondary text-xs font-bold px-3 py-1.5">
            + Add custom type
          </button>
        </div>

        <div className="space-y-3">
          {sorted.map(t => (
            <div key={t.id} className="border border-slate-200 rounded-xl p-4" style={{ background: t.bg, borderColor: t.border }}>
              <div className="flex items-start gap-3 flex-wrap">
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <button type="button" onClick={() => moveLevel(t.id, -1)} title="Move up one level"
                    className="w-6 h-6 flex items-center justify-center rounded border border-slate-200 bg-white hover:bg-slate-50">
                    <SvgIcon name="chevronUp" size={12} />
                  </button>
                  <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">{levelLabel(t.level, levels)}</span>
                  <button type="button" onClick={() => moveLevel(t.id, 1)} title="Move down one level"
                    className="w-6 h-6 flex items-center justify-center rounded border border-slate-200 bg-white hover:bg-slate-50">
                    <SvgIcon name="chevronDown" size={12} />
                  </button>
                </div>

                <div className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0" style={{ background: '#fff', border: `1px solid ${t.border}` }}>
                  <SvgIcon name={t.icon} size={16} style={{ color: t.color }} />
                </div>

                <div className="flex-1 min-w-[180px] space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={t.label}
                      onChange={e => updateType(t.id, { label: e.target.value })}
                      className="font-bold text-sm bg-white border border-slate-200 rounded-lg px-2 py-1 flex-1 min-w-[120px]"
                      style={{ color: t.color }}
                      placeholder="Display label"
                    />
                    {t.builtIn && (
                      <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 rounded-full px-2 py-0.5">Built-in</span>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Matches raw Jira type name(s)</label>
                    <input
                      type="text"
                      value={t.matchNames.join(', ')}
                      onChange={e => updateMatchNames(t.id, e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono mt-0.5"
                      placeholder="e.g. product, offering"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <select
                    value={t.icon}
                    onChange={e => updateType(t.id, { icon: e.target.value })}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs"
                  >
                    {ICON_OPTIONS.map(icon => <option key={icon} value={icon}>{icon}</option>)}
                  </select>
                  <div className="flex items-center gap-1">
                    {COLOR_PRESETS.map(preset => (
                      <button
                        key={preset.color}
                        type="button"
                        title={preset.color}
                        onClick={() => updateType(t.id, preset)}
                        className={`w-5 h-5 rounded-full border-2 ${t.color === preset.color ? 'border-slate-700' : 'border-white'}`}
                        style={{ background: preset.color }}
                      />
                    ))}
                    <span className="w-px h-4 bg-slate-200 mx-0.5" aria-hidden="true" />
                    <label
                      title="Choose any color"
                      className={`relative w-5 h-5 rounded-full border-2 border-white shadow-sm overflow-hidden cursor-pointer shrink-0 ${styles.colorSwatch}`}
                      // DYNAMIC CSS VARIABLE: swatch shows the admin's freely-chosen
                      // color, which can't be a predefined class (CLAUDE.md §14.2).
                      // Always a browser-validated #rrggbb from <input type="color">.
                      style={{ '--swatch-color': t.color } as CSSVariableProperties}
                    >
                      <input
                        type="color"
                        value={t.color}
                        onChange={e => updateType(t.id, deriveColorSet(e.target.value))}
                        aria-label={`Custom color for ${t.label || 'this type'}`}
                        className="absolute -inset-2 cursor-pointer opacity-0"
                      />
                    </label>
                  </div>
                  {!t.builtIn && (
                    <button type="button" onClick={() => removeType(t.id)} title="Delete custom type"
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50">
                      <SvgIcon name="delete" size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {msg && (
          <p className={`text-xs font-semibold mt-4 ${msg.ok ? 'text-green-700' : 'text-red-600'}`}>{msg.text}</p>
        )}

        <div className="flex items-center gap-3 mt-5 pt-4 border-t border-slate-100">
          <button type="button" onClick={handleSave} disabled={saving} className="btn-primary text-sm font-bold px-5 py-2 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <button type="button" onClick={handleReset} disabled={saving} className="btn-secondary text-sm font-semibold px-4 py-2">
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
