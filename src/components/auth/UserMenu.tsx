// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { roleLabel } from '@/lib/roles';

interface Me { name: string; email: string; role: string }

export default function UserMenu() {
  const router = useRouter();
  const [me, setMe]       = useState<Me | null>(null);
  const [open, setOpen]   = useState(false);
  const menuRef           = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => setMe(data))
      .catch(() => setMe(null));
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [open]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setMe(null);
    router.push('/login');
    router.refresh();
  }

  if (!me) {
    return (
      <div className="flex items-center gap-1.5">
        <Link href="/login"
          className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors">
          Sign in
        </Link>
      </div>
    );
  }

  const initials = me.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '3px 8px 3px 3px', borderRadius: 20,
          border: '1px solid #E2E8F0', background: open ? '#F1F5F9' : '#fff',
          cursor: 'pointer', transition: 'background 120ms',
        }}
        onMouseEnter={e => { if (!open) (e.currentTarget as HTMLElement).style.background = '#F8FAFC'; }}
        onMouseLeave={e => { if (!open) (e.currentTarget as HTMLElement).style.background = '#fff'; }}
      >
        <span style={{
          width: 26, height: 26, borderRadius: '50%', background: '#2563EB',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 10, fontWeight: 800, fontFamily: 'monospace', flexShrink: 0,
        }}>
          {initials}
        </span>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#334155', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {me.email.split('@')[0]}
        </span>
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms', flexShrink: 0 }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 min-w-[200px]" style={{ zIndex: 9999 }}>
          <div className="px-4 py-2 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-800 truncate">{me.name}</p>
            <p className="text-xs text-slate-400 truncate">{me.email}</p>
            <span className="inline-block mt-1 text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase tracking-wider">{roleLabel(me.role)}</span>
          </div>
          <Link href="/profile" onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            <span>👤</span> My Profile
          </Link>
          {me.role === 'admin' && (
            <>
              <Link href="/admin/logs" onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                <span>🗂️</span> Admin Logs
              </Link>
              <Link href="/admin/security" onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                <span>🔒</span> Security Checklist
              </Link>
              <Link href="/admin/settings" onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                <span>🔒</span> Privacy & Retention
              </Link>
            </>
          )}
          <div className="border-t border-slate-100 mt-1 pt-1">
            <button onClick={logout}
              className="flex items-center gap-2 w-full px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">
              <span>🚪</span> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
