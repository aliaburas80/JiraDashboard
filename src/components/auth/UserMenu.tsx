// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
      <Link href="/login"
        className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors">
        Sign in
      </Link>
    );
  }

  const initials = me.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <span className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-black">
          {initials}
        </span>
        <span className="text-xs font-semibold text-slate-700 hidden sm:block max-w-[100px] truncate">{me.name}</span>
        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1.5 min-w-[180px]">
          <div className="px-4 py-2 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-800 truncate">{me.name}</p>
            <p className="text-xs text-slate-400 truncate">{me.email}</p>
            {me.role === 'admin' && (
              <span className="inline-block mt-1 text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase tracking-wider">Admin</span>
            )}
          </div>
          <Link href="/profile" onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            <span>👤</span> My Profile
          </Link>
          {me.role === 'admin' && (
            <Link href="/admin/logs" onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
              <span>🗂️</span> Admin Logs
            </Link>
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
