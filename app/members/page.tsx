// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import RequestAddMemberModal from '@/components/admin/RequestAddMemberModal';
import { type Member, initialsFor, contactEmailFor, matchesMemberQuery } from '@/lib/members';

function roleBadgeCls(role: string): string {
  if (role === 'admin') return 'chip c-acc';
  if (role === 'manager') return 'chip c-am';
  return 'chip c-nt';
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, var(--dc-acc, #E85D12), #8B2D00)',
  'linear-gradient(135deg, #7C3AED, #4C1D95)',
  'linear-gradient(135deg, #0284C7, #1E3A5F)',
  'linear-gradient(135deg, #0D9488, #134E4A)',
  'linear-gradient(135deg, #CA8A04, #78350F)',
];

export default function MembersPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [selected, setSelected] = useState<Member | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [myRole, setMyRole] = useState<string | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => setMyRole(data?.role ?? null))
      .catch(() => setMyRole(null));
  }, []);

  useEffect(() => {
    fetch('/api/members')
      .then(async res => {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) { router.replace('/login'); return; }
        if (!res.ok) throw new Error(data.error ?? 'Could not load members.');
        setMembers(data.members ?? []);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Could not load members.'))
      .finally(() => setLoading(false));
  }, [router]);

  const filteredMembers = useMemo(() => (
    members.filter(member => matchesMemberQuery(member, query))
  ), [members, query]);

  const roleCount = new Set(members.map(m => m.role)).size;

  return (
    <AppShell showNav>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">

        {/* Header */}
        <section className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-black tracking-tight" style={{ fontSize: 28, fontWeight: 800, color: 'var(--dc-p1, #F2F2F2)' }}>Members</h1>
            <p className="mt-2" style={{ fontSize: 13, color: 'var(--dc-p2, #909090)' }}>Team directory, roles, profile details, and contact info.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
            <div className="rounded-[100px] px-5 py-3 text-center" style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>
              <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: 'var(--dc-p3, #505050)' }}>Members</p>
              <p className="text-2xl font-black" style={{ color: 'var(--dc-acc2, #FF8A4C)' }}>{members.length}</p>
            </div>
            <div className="rounded-[100px] px-5 py-3 text-center" style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>
              <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: 'var(--dc-p3, #505050)' }}>Roles</p>
              <p className="text-2xl font-black" style={{ color: 'var(--dc-acc2, #FF8A4C)' }}>{roleCount}</p>
            </div>
            {myRole && myRole !== 'admin' && (
              <button
                type="button"
                onClick={() => setShowRequestModal(true)}
                className="col-span-2 sm:col-span-1 flex items-center gap-2 rounded-[14px] px-5 py-3 text-sm font-bold transition-colors"
                style={{ background: 'rgba(232,93,18,0.10)', border: '1px solid rgba(232,93,18,0.20)', color: 'var(--dc-acc2, #FF8A4C)' }}
              >
                <span className="text-base">＋</span> Request add member
              </button>
            )}
          </div>
        </section>

        {/* Search bar */}
        <section className="mb-6">
          <label className="relative block">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--dc-p3, #505050)' }}>⌕</span>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              type="search"
              placeholder="Search members, roles, positions, or shared info"
              className="h-12 w-full pl-11 pr-4 text-base outline-none transition focus:ring-2 focus:ring-[rgba(232,93,18,0.25)]"
              style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))', borderRadius: 12, color: 'var(--dc-p1, #F2F2F2)' }}
            />
          </label>
        </section>

        {error && (
          <div className="mb-6 rounded-[14px] px-4 py-3 text-sm font-bold"
            style={{ background: 'rgba(248,113,113,0.11)', border: '1px solid rgba(248,113,113,0.25)', color: '#fca5a5' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-[14px]"
                style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }} />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredMembers.map((member, index) => (
              <button
                key={member.id}
                type="button"
                onClick={() => setSelected(member)}
                className="group rounded-[14px] p-5 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[rgba(232,93,18,0.30)]"
                style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}
                onMouseEnter={e => { e.currentTarget.style.border = '1px solid var(--dc-bdr2, rgba(255,255,255,0.13))'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.border = '1px solid var(--dc-bdr, rgba(255,255,255,0.07))'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div className="flex items-start gap-3 mb-3">
                  {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-black"
                      style={{ background: AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length], color: '#F2F2F2' }}>
                      {initialsFor(member)}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-semibold" style={{ fontSize: 13, color: 'var(--dc-p1, #F2F2F2)' }}>{member.name}</h2>
                    <p className="truncate" style={{ fontSize: 10, color: 'var(--dc-p2, #909090)' }}>{member.position || member.roleLabel}</p>
                  </div>
                  <span className={roleBadgeCls(member.role)} style={{ fontSize: 9, flexShrink: 0 }}>
                    {member.roleLabel}
                  </span>
                </div>
                <p className="truncate mb-2" style={{ fontSize: 10, color: 'var(--dc-p2, #909090)' }}>{contactEmailFor(member)}</p>
                <p className="line-clamp-2 min-h-8 leading-5" style={{ fontSize: 10, color: 'var(--dc-p3, #505050)', fontStyle: (!member.bio && !member.certificates) ? 'italic' : undefined }}>
                  {member.bio || member.certificates || 'No shared profile details yet.'}
                </p>
              </button>
            ))}
          </div>
        )}

        {!loading && filteredMembers.length === 0 && (
          <div className="rounded-[14px] p-8 text-center text-sm font-bold"
            style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))', color: 'var(--dc-p3, #505050)' }}>
            No members match the current search.
          </div>
        )}

        {/* Member detail modal */}
        {selected && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            role="dialog"
            aria-modal="true"
            onClick={() => setSelected(null)}
          >
            <div
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[16px] p-6"
              style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr2, rgba(255,255,255,0.13))', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-4">
                  {selected.avatarUrl ? (
                    <img src={selected.avatarUrl} alt="" className="h-20 w-20 shrink-0 rounded-[16px] object-cover" />
                  ) : (
                    <span className="grid h-20 w-20 shrink-0 place-items-center rounded-[16px] text-xl font-black"
                      style={{ background: 'linear-gradient(135deg, var(--dc-acc, #E85D12), #8B2D00)', color: '#F2F2F2' }}>
                      {initialsFor(selected)}
                    </span>
                  )}
                  <div className="min-w-0">
                    <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--dc-p1, #F2F2F2)' }}>{selected.name}</h2>
                    <p className="mt-1 text-sm font-bold" style={{ color: 'var(--dc-p2, #909090)' }}>{selected.position || selected.roleLabel}</p>
                    <span className={`mt-3 inline-flex ${roleBadgeCls(selected.role)}`} style={{ fontSize: 10 }}>
                      {selected.roleLabel}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-[9px] text-xl font-black transition"
                  style={{ border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))', color: 'var(--dc-p2, #909090)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--dc-s3, #282828)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
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

      {showRequestModal && (
        <RequestAddMemberModal onClose={() => setShowRequestModal(false)} />
      )}
    </AppShell>
  );
}

function Detail({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`rounded-[12px] p-4 ${wide ? 'sm:col-span-2' : ''}`}
      style={{ background: 'var(--dc-s3, #282828)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>
      <p className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--dc-p3, #505050)' }}>{label}</p>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm font-semibold leading-6" style={{ color: 'var(--dc-p1, #F2F2F2)' }}>{value}</p>
    </div>
  );
}
