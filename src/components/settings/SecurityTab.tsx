// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// EP-018: voluntary "change your password anytime" action — previously the only
// password-change entry point was the forced first-login flow at /change-password
// (redirects to /dashboard once mustChangePassword is false), so there was no way
// for a signed-in user to change their password by choice. Reuses the existing
// POST /api/auth/change-password endpoint, which only requires an active session.
'use client';
import { useState, type FormEvent } from 'react';

interface SecurityTabProps {
  onToast: (msg: string) => void;
}

export default function SecurityTab({ onToast }: SecurityTabProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError]                     = useState('');
  const [saving, setSaving]                   = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Could not change password.');
        return;
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onToast('Password changed.');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-1 text-sm font-black uppercase tracking-wider text-slate-700">Password</h2>
      <p className="mb-4 text-xs text-slate-500">Change your account password. You'll stay signed in.</p>

      <form onSubmit={handleSubmit} className="grid max-w-sm gap-4">
        <label className="grid gap-2 text-xs font-extrabold text-slate-700">
          Current password
          <input
            type="password"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            required
            className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-400"
          />
        </label>
        <label className="grid gap-2 text-xs font-extrabold text-slate-700">
          New password
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
            className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-400"
          />
        </label>
        <label className="grid gap-2 text-xs font-extrabold text-slate-700">
          Confirm new password
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-400"
          />
        </label>

        {error && <p className="text-xs font-semibold text-red-600">{error}</p>}

        <button type="submit" disabled={saving} className="btn-primary justify-self-start px-5 py-2.5 disabled:opacity-50">
          {saving ? 'Saving...' : 'Change password'}
        </button>
      </form>
    </section>
  );
}
