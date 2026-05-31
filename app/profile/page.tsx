// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';

interface Me { name: string; email: string; role: string }

export default function ProfilePage() {
  const router = useRouter();
  const [me, setMe]           = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (!data) { router.replace('/login'); return; } setMe(data); })
      .catch(() => router.replace('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  if (loading) return <AppShell showNav><div className="flex items-center justify-center h-64 text-slate-400">Loading…</div></AppShell>;
  if (!me)     return null;

  return (
    <AppShell showNav>
      <div className="max-w-lg mx-auto py-10">
        <h1 className="text-2xl font-black text-slate-900 mb-6">My Profile</h1>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
          {/* Avatar circle */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-black shrink-0">
              {me.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-base font-black text-slate-900">{me.name}</p>
              <p className="text-sm text-slate-500">{me.email}</p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Role</p>
              <p className="text-sm font-bold text-slate-800 capitalize">{me.role}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</p>
              <p className="text-sm font-bold text-slate-800 truncate">{me.email}</p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 flex justify-end">
            <button onClick={handleLogout}
              className="px-5 py-2 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm font-bold hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors">
              Sign out
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
