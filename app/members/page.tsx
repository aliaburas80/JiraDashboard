// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  roleLabel: string;
  avatarUrl: string;
  position: string;
  phone: string;
  contactEmail: string;
  address: string;
  certificates: string;
  bio: string;
}

function initialsFor(member: Member): string {
  return member.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || member.email.slice(0, 2).toUpperCase();
}

function contactEmailFor(member: Member): string {
  return member.contactEmail || member.email;
}

export default function MembersPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [selected, setSelected] = useState<Member | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/members')
      .then(async res => {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) {
          router.replace('/login');
          return;
        }
        if (!res.ok) throw new Error(data.error ?? 'Could not load members.');
        setMembers(data.members ?? []);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Could not load members.'))
      .finally(() => setLoading(false));
  }, [router]);

  const filteredMembers = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return members;
    return members.filter(member => (
      `${member.name} ${member.email} ${member.position} ${member.roleLabel} ${member.bio}`.toLowerCase().includes(text)
    ));
  }, [members, query]);

  const roleCount = new Set(members.map(member => member.role)).size;

  return (
    <AppShell showNav>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <section className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Members</h1>
            <p className="mt-3 text-lg text-slate-600">Team directory, roles, profile details, and contact info.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
            <div className="rounded-[14px] border border-slate-200 bg-white px-5 py-3 shadow-[0_3px_12px_rgba(15,23,42,0.04)]">
              <p className="text-xs font-black uppercase text-slate-500">Members</p>
              <p className="text-2xl font-black text-slate-950">{members.length}</p>
            </div>
            <div className="rounded-[14px] border border-slate-200 bg-white px-5 py-3 shadow-[0_3px_12px_rgba(15,23,42,0.04)]">
              <p className="text-xs font-black uppercase text-slate-500">Roles</p>
              <p className="text-2xl font-black text-slate-950">{roleCount}</p>
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-[14px] border border-slate-200 bg-white p-4 shadow-[0_3px_12px_rgba(15,23,42,0.04)]">
          <label className="relative block">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">⌕</span>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              type="search"
              placeholder="Search members, roles, positions, or shared info"
              className="h-12 w-full rounded-[10px] border border-slate-300 bg-white pl-11 pr-4 text-base text-slate-900 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            />
          </label>
        </section>

        {error && (
          <div className="mb-6 rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>
        )}

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-48 animate-pulse rounded-[14px] border border-slate-200 bg-white" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredMembers.map((member, index) => {
              const avatarTone = [
                'bg-violet-50 text-violet-700',
                'bg-blue-50 text-blue-700',
                'bg-cyan-50 text-cyan-700',
                'bg-amber-50 text-amber-700',
                'bg-emerald-50 text-emerald-700',
              ][index % 5];

              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setSelected(member)}
                  className="group rounded-[14px] border border-slate-200 bg-white p-5 text-left shadow-[0_3px_12px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_16px_32px_rgba(15,23,42,0.08)] focus:outline-none focus:ring-4 focus:ring-blue-100"
                >
                  <div className="flex items-start gap-4">
                    {member.avatarUrl ? (
                      <img src={member.avatarUrl} alt="" className="h-16 w-16 shrink-0 rounded-[14px] object-cover" />
                    ) : (
                      <span className={`grid h-16 w-16 shrink-0 place-items-center rounded-[14px] text-lg font-black ${avatarTone}`}>
                        {initialsFor(member)}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="truncate text-xl font-black tracking-tight text-slate-950">{member.name}</h2>
                          <p className="mt-1 truncate text-sm font-bold text-slate-600">{member.position || member.roleLabel}</p>
                        </div>
                        <span className="shrink-0 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                          {member.roleLabel}
                        </span>
                      </div>
                      <p className="mt-4 truncate text-sm text-slate-500">{contactEmailFor(member)}</p>
                      <p className="mt-4 line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">
                        {member.bio || member.certificates || 'No shared profile details yet.'}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {!loading && filteredMembers.length === 0 && (
          <div className="rounded-[14px] border border-slate-200 bg-white p-8 text-center text-sm font-bold text-slate-500">
            No members match the current search.
          </div>
        )}

        {selected && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4"
            role="dialog"
            aria-modal="true"
            onClick={() => setSelected(null)}
          >
            <div
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[16px] bg-white p-6 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-4">
                  {selected.avatarUrl ? (
                    <img src={selected.avatarUrl} alt="" className="h-20 w-20 shrink-0 rounded-[16px] object-cover" />
                  ) : (
                    <span className="grid h-20 w-20 shrink-0 place-items-center rounded-[16px] bg-blue-50 text-xl font-black text-blue-700">
                      {initialsFor(selected)}
                    </span>
                  )}
                  <div className="min-w-0">
                    <h2 className="text-2xl font-black tracking-tight text-slate-950">{selected.name}</h2>
                    <p className="mt-1 text-sm font-bold text-slate-600">{selected.position || selected.roleLabel}</p>
                    <span className="mt-3 inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                      {selected.roleLabel}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-[9px] border border-slate-200 text-xl font-black text-slate-500 transition hover:bg-slate-50"
                  aria-label="Close member details"
                >
                  ×
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Detail label="Email" value={contactEmailFor(selected)} />
                <Detail label="Telephone" value={selected.phone || 'Not shared'} />
                <Detail label="Address" value={selected.address || 'Not shared'} wide />
                <Detail label="Certificates" value={selected.certificates || 'Not shared'} wide />
                <Detail label="Shared team info" value={selected.bio || 'Not shared'} wide />
              </div>
            </div>
          </div>
        )}
      </main>
    </AppShell>
  );
}

function Detail({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`rounded-[12px] border border-slate-200 bg-slate-50 p-4 ${wide ? 'sm:col-span-2' : ''}`}>
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm font-semibold leading-6 text-slate-800">{value}</p>
    </div>
  );
}
