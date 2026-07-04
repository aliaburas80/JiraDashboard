// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// USERREQ-16–20 — Admin panel to review, accept, and reject add-member requests.
'use client';
import { useCallback, useEffect, useState } from 'react';
import { SvgIcon } from '@/components/ui/SvgIcon';

function generateTempPassword(): string {
  const upper   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower   = 'abcdefghijklmnopqrstuvwxyz';
  const digits  = '0123456789';
  const special = '!@#$%^&*';
  const all     = upper + lower + digits + special;
  const buf     = crypto.getRandomValues(new Uint8Array(32));
  let bi = 0;
  const rand = (n: number) => buf[bi++ % 32] % n;
  const chars: string[] = [
    upper[rand(upper.length)],
    upper[rand(upper.length)],
    digits[rand(digits.length)],
    digits[rand(digits.length)],
    special[rand(special.length)],
    special[rand(special.length)],
    ...Array.from({ length: 8 }, () => all[rand(all.length)]),
  ];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}
import { roleLabel } from '@/lib/roles';

interface UserAddRequest {
  id: string;
  requestedName: string;
  requestedEmail: string;
  requestedRole: string;
  reason: string;
  teamOrProject: string | null;
  notes: string | null;
  status: string;
  adminDecisionNote: string | null;
  adminDecisionAt: string | null;
  createdAt: string;
  requestedBy: { name: string; email: string; role: string } | null;
}

const STATUS_BADGE: Record<string, string> = {
  pending:  'bg-amber-100 text-amber-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled:'bg-slate-100 text-slate-600',
  expired:  'bg-slate-100 text-slate-600',
};

export default function UserAddRequestsPanel() {
  const [requests, setRequests]     = useState<UserAddRequest[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [filter, setFilter]         = useState<'all' | 'pending' | 'decided'>('pending');
  const [acting, setActing]         = useState<string | null>(null);
  const [tempPasswords, setTempPasswords] = useState<Record<string, string>>({});
  const [emailSentMap, setEmailSentMap] = useState<Record<string, boolean>>({});
  const [copied, setCopied]         = useState<string | null>(null);
  const [decisionNote, setDecisionNote] = useState<Record<string, string>>({});
  const [adminPasswords, setAdminPasswords] = useState<Record<string, string>>({});
  const [showAdminPw, setShowAdminPw] = useState<Record<string, boolean>>({});
  const [pwError, setPwError]       = useState<Record<string, string>>({});
  const [expanded, setExpanded]     = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const qs = filter === 'pending' ? '?status=pending' : '';
    fetch(`/api/admin/user-add-requests${qs}`)
      .then(async res => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? 'Could not load requests.');
        setRequests(data.requests ?? []);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Could not load requests.'))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function decide(id: string, action: 'accept' | 'reject') {
    if (action === 'accept') {
      const pw = adminPasswords[id]?.trim() ?? '';
      if (!pw) {
        setPwError(e => ({ ...e, [id]: 'You must set a temporary password before accepting.' }));
        return;
      }
      // basic client-side strength check mirrors server validation
      if (pw.length < 8 || !/[A-Z]/.test(pw) || !/[0-9]/.test(pw)) {
        setPwError(e => ({ ...e, [id]: 'Password must be ≥ 8 chars with at least one uppercase letter and one number.' }));
        return;
      }
      setPwError(e => ({ ...e, [id]: '' }));
    }
    setActing(id);
    try {
      const payload: Record<string, string> = {};
      if (decisionNote[id]?.trim()) payload.adminDecisionNote = decisionNote[id].trim();
      if (action === 'accept') payload.tempPassword = adminPasswords[id].trim();
      const res = await fetch(`/api/admin/user-add-requests/${id}/${action}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? `Could not ${action} request.`);
        return;
      }
      if (action === 'accept') {
        // Use the password already in state — never echo sensitive data from the response
        setTempPasswords(p => ({ ...p, [id]: adminPasswords[id].trim() }));
        setEmailSentMap(m => ({ ...m, [id]: !!data.emailSent }));
      }
      setRequests(prev => prev.map(r =>
        r.id === id
          ? { ...r, status: action === 'accept' ? 'accepted' : 'rejected', adminDecisionNote: decisionNote[id] ?? null }
          : r,
      ));
    } catch {
      setError(`Network error while trying to ${action}.`);
    } finally {
      setActing(null);
    }
  }

  function copyPassword(id: string) {
    const pw = tempPasswords[id];
    if (!pw) return;
    navigator.clipboard.writeText(pw).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(c => c === id ? null : c), 2000);
    }).catch(() => {});
  }

  const shown = filter === 'decided'
    ? requests.filter(r => r.status !== 'pending')
    : requests;

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(['pending', 'all', 'decided'] as const).map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f}{f === 'pending' && pendingCount > 0 ? ` (${pendingCount})` : ''}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={load}
          className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
          <button onClick={() => setError('')} className="ml-2 underline text-xs">Dismiss</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 animate-pulse rounded-[14px] border border-slate-200 bg-white" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <div className="rounded-[14px] border border-slate-200 bg-white px-6 py-10 text-center">
          <p className="text-2xl mb-2">📭</p>
          <p className="text-sm font-bold text-slate-500">
            {filter === 'pending' ? 'No pending requests' : 'No requests found'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map(req => (
            <div
              key={req.id}
              className="rounded-[14px] border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]"
            >
              {/* Summary row */}
              <div
                className="flex flex-wrap items-center gap-3 px-5 py-4 cursor-pointer"
                onClick={() => setExpanded(e => e === req.id ? null : req.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-slate-900 text-sm">{req.requestedName}</span>
                    <span className="text-xs text-slate-500">{req.requestedEmail}</span>
                    <span className="text-xs font-semibold text-blue-600">{roleLabel(req.requestedRole)}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold capitalize ${STATUS_BADGE[req.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {req.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    Requested by {req.requestedBy?.name ?? 'Unknown'} · {new Date(req.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-slate-400 text-xs">{expanded === req.id ? '▲' : '▼'}</span>
              </div>

              {/* Expanded detail + actions */}
              {expanded === req.id && (
                <div className="border-t border-slate-100 px-5 py-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <Detail label="Requested by" value={`${req.requestedBy?.name ?? '—'} (${req.requestedBy?.email ?? '—'})`} />
                    <Detail label="Role of requester" value={roleLabel(req.requestedBy?.role)} />
                    {req.teamOrProject && <Detail label="Team / project" value={req.teamOrProject} />}
                    <Detail label="Business reason" value={req.reason} wide />
                    {req.notes && <Detail label="Notes" value={req.notes} wide />}
                    {req.adminDecisionNote && <Detail label="Decision note" value={req.adminDecisionNote} wide />}
                  </div>

                  {req.status === 'pending' && (
                    <div className="pt-1 space-y-3">
                      {/* Mandatory: admin sets the temporary password */}
                      <div className="rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3">
                        <label className="block text-xs font-black uppercase text-amber-700 mb-1.5">
                          Temporary password <span className="text-red-600">*</span>{' '}
                          <span className="text-amber-600 font-normal normal-case">— required before accepting</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type={showAdminPw[req.id] ? 'text' : 'password'}
                            value={adminPasswords[req.id] ?? ''}
                            onChange={e => {
                              setAdminPasswords(p => ({ ...p, [req.id]: e.target.value }));
                              if (pwError[req.id]) setPwError(er => ({ ...er, [req.id]: '' }));
                            }}
                            placeholder="Min 8 chars, 1 uppercase, 1 number"
                            className={`flex-1 rounded-[9px] border px-3 py-2 text-sm outline-none transition focus:ring-4 ${
                              pwError[req.id]
                                ? 'border-red-400 bg-red-50 focus:border-red-400 focus:ring-red-100'
                                : 'border-amber-300 bg-white focus:border-amber-400 focus:ring-amber-100'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const pw = generateTempPassword();
                              setAdminPasswords(p => ({ ...p, [req.id]: pw }));
                              setShowAdminPw(s => ({ ...s, [req.id]: true }));
                              setPwError(er => ({ ...er, [req.id]: '' }));
                            }}
                            className="px-2.5 py-2 rounded-[8px] border border-amber-300 bg-amber-50 text-amber-800 text-[11px] font-bold hover:bg-amber-100 transition-colors shrink-0"
                            title="Auto-generate a strong password"
                          >
                            Generate
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAdminPw(s => ({ ...s, [req.id]: !s[req.id] }))}
                            className="px-2 py-2 rounded-[8px] border border-amber-200 bg-white text-amber-700 text-xs hover:bg-amber-50 transition-colors shrink-0"
                            aria-label={showAdminPw[req.id] ? 'Hide password' : 'Show password'}
                          >
                            {showAdminPw[req.id] ? '🙈' : '👁'}
                          </button>
                        </div>
                        {pwError[req.id] && (
                          <p className="text-xs text-red-600 font-semibold mt-1.5">{pwError[req.id]}</p>
                        )}
                        <p className="text-[11px] text-amber-600 mt-1.5">
                          This password will be shared with the requester via in-app notification and sent to the new user by email. The user must change it on first login.
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
                          Decision note <span className="text-slate-400 font-normal">(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={decisionNote[req.id] ?? ''}
                          onChange={e => setDecisionNote(n => ({ ...n, [req.id]: e.target.value }))}
                          placeholder="Optional note sent to the requester"
                          className="w-full rounded-[10px] border border-slate-300 px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={acting === req.id || !adminPasswords[req.id]?.trim()}
                          onClick={() => decide(req.id, 'accept')}
                          className="px-4 py-2 rounded-xl text-sm font-bold bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                          {acting === req.id ? <Spinner /> : <SvgIcon name="check" size={12} />} Accept & create account
                        </button>
                        <button
                          type="button"
                          disabled={acting === req.id}
                          onClick={() => decide(req.id, 'reject')}
                          className="px-4 py-2 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {acting === req.id ? <Spinner /> : '✕'} Reject
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Temp password revealed after accept */}
                  {req.status === 'accepted' && tempPasswords[req.id] && (
                    <div className="mt-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 space-y-2">
                      <p className="text-xs font-black uppercase text-green-700">Temporary password — share with user</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 rounded-lg bg-white border border-green-200 px-3 py-2 text-sm font-mono font-bold text-slate-900 select-all">
                          {tempPasswords[req.id]}
                        </code>
                        <button
                          type="button"
                          onClick={() => copyPassword(req.id)}
                          className="px-3 py-2 rounded-lg text-xs font-bold border border-green-200 bg-white hover:bg-green-50 text-green-700 transition-colors shrink-0"
                        >
                          {copied === req.id ? <><SvgIcon name="check" size={12} /> Copied</> : 'Copy'}
                        </button>
                      </div>
                      {/* Email delivery status */}
                      {emailSentMap[req.id] === true && (
                        <p className="text-[11px] font-semibold text-green-700 flex items-center gap-1">
                          <SvgIcon name="checkCircle" size={12} /> Welcome email sent to {req.requestedEmail}
                        </p>
                      )}
                      {emailSentMap[req.id] === false && (
                        <p className="text-[11px] font-semibold text-amber-700 flex items-center gap-1">
                          <SvgIcon name="warning" size={12} /> Email not sent — SMTP not configured. Share the password manually.
                        </p>
                      )}
                      <p className="text-[11px] text-green-600">
                        The requester received this password via in-app notification. They must change the password on first login.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Detail({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`rounded-[10px] border border-slate-200 bg-slate-50 p-3 ${wide ? 'sm:col-span-2' : ''}`}>
      <p className="text-[11px] font-black uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-800 whitespace-pre-wrap break-words">{value}</p>
    </div>
  );
}

function Spinner() {
  return <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />;
}
