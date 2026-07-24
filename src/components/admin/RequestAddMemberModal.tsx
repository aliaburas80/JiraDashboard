// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// USERREQ-02/03 — Modal for any logged-in user to request adding a new member.
'use client';
import { useEffect, useRef, useState } from 'react';
import { ROLE_OPTIONS, ASSIGNABLE_ROLES, isHighPrivilegeRole } from '@/lib/roles';
import { SvgIcon } from '@/components/ui/SvgIcon';

interface Props {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function RequestAddMemberModal({ onClose, onSuccess }: Props) {
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [role, setRole]               = useState('');
  const [reason, setReason]           = useState('');
  const [teamProject, setTeamProject] = useState('');
  const [notes, setNotes]             = useState('');

  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState('');
  const [done, setDone]               = useState(false);

  useEffect(() => {
    firstFieldRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const isHighPrivilege = isHighPrivilegeRole(role);
  const reasonTooShort  = isHighPrivilege && reason.trim().length < 20;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !role || !reason.trim()) {
      setError('Name, email, role, and reason are all required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (reasonTooShort) {
      setError('For Admin or C-level roles, please provide a more detailed reason (at least 20 characters).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/user-add-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestedName: name.trim(),
          requestedEmail: email.trim().toLowerCase(),
          requestedRole: role,
          reason: reason.trim(),
          teamOrProject: teamProject.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Could not submit request. Please try again.');
        return;
      }
      setDone(true);
      onSuccess?.();
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="req-modal-title"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {done ? (
          <div className="text-center py-6">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-black text-slate-900 mb-2">Request submitted</h2>
            <p className="text-sm text-slate-500 mb-6">
              An admin will review your request and you&apos;ll be notified once a decision is made.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 id="req-modal-title" className="text-lg font-black text-slate-900">Request Add Member</h2>
                <p className="text-sm text-slate-500 mt-0.5">An admin will review and create the account.</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 -m-2 text-slate-400 hover:text-slate-700 text-xl leading-none transition-colors"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Full name */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
                  Full name <span className="text-red-500">*</span>
                </label>
                <input
                  ref={firstFieldRef}
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Jane Smith"
                  required
                  className="w-full rounded-[10px] border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
                  Email address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="jane@company.com"
                  required
                  className="w-full rounded-[10px] border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
                  Requested role <span className="text-red-500">*</span>
                </label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  required
                  className="w-full rounded-[10px] border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition bg-white"
                >
                  <option value="">— Select a role —</option>
                  {ROLE_OPTIONS.filter(r => ASSIGNABLE_ROLES.includes(r.id)).map(r => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                  <option value="user">User</option>
                </select>
                {isHighPrivilege && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-amber-600">
                    <SvgIcon name="warning" size={12} />
                    {role === 'admin' ? 'Admin' : 'C-level'} roles have elevated access. Provide a detailed justification below.
                  </p>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
                  Business reason <span className="text-red-500">*</span>
                  {isHighPrivilege && <span className="ml-1 text-amber-600">(min. 20 chars)</span>}
                </label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Why does this person need access to Delivery Clarity?"
                  rows={3}
                  required
                  className="w-full rounded-[10px] border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition resize-none"
                />
                {isHighPrivilege && reason.trim().length > 0 && (
                  <p className={`mt-1 text-xs font-semibold ${reasonTooShort ? 'text-amber-600' : 'text-green-600'}`}>
                    {reason.trim().length} / 20 chars minimum
                  </p>
                )}
              </div>

              {/* Team / project (optional) */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
                  Team or project <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={teamProject}
                  onChange={e => setTeamProject(e.target.value)}
                  placeholder="e.g. Alpha Squad, Project Phoenix"
                  className="w-full rounded-[10px] border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition"
                />
              </div>

              {/* Notes (optional) */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
                  Notes <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Any additional context for the admin"
                  rows={2}
                  className="w-full rounded-[10px] border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || reasonTooShort}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting…
                  </>
                ) : 'Submit request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
