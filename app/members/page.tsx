// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import RequestAddMemberModal from '@/components/admin/RequestAddMemberModal';
import { type Member, initialsFor, contactEmailFor, matchesMemberQuery } from '@/lib/members';
import { paginate } from '@/lib/pagination';
import styles from './page.module.scss';

// STYLE-05 (2026-07-19): converted from inline styles to SCSS Module — see
// page.module.scss for the token mapping notes. No behavior change.

// MPE-02: /api/members returns every active member with no server-side limit —
// bounded by organization headcount, so a client-side page slice resolves the
// missing-pagination finding without a riskier API change. 24 fits the 2- and
// 3-column responsive grid below evenly.
const PAGE_SIZE = 24;

const AVATAR_COUNT = 5;

function roleBadgeCls(role: string): string {
  if (role === 'admin') return 'chip c-acc';
  if (role === 'manager') return 'chip c-am';
  return 'chip c-nt';
}

export default function MembersPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [selected, setSelected] = useState<Member | null>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [myRole, setMyRole] = useState<string | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        setMyRole(data?.role ?? null);
        // EP-025: Members directory is restricted to the protected super-admin
        // account only — distinct from role: 'admin'. Redirect everyone else
        // away rather than showing an error state on a page they shouldn't see.
        if (!data?.isSuperAdmin) { router.replace('/dashboard'); return; }
      })
      .catch(() => setMyRole(null));
  }, [router]);

  useEffect(() => {
    fetch('/api/members')
      .then(async res => {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) { router.replace('/login'); return; }
        if (res.status === 403) { router.replace('/dashboard'); return; }
        if (!res.ok) throw new Error(data.error ?? 'Could not load members.');
        setMembers(data.members ?? []);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Could not load members.'))
      .finally(() => setLoading(false));
  }, [router]);

  const filteredMembers = useMemo(() => (
    members.filter(member => matchesMemberQuery(member, query))
  ), [members, query]);

  const { items: pageMembers, page: safePage, totalPages } = paginate(filteredMembers, page, PAGE_SIZE);

  const roleCount = new Set(members.map(m => m.role)).size;

  return (
    <AppShell showNav>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">

        {/* Header */}
        <section className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 id="tour-header-members" className={`font-black tracking-tight ${styles.title}`}>Members</h1>
            <p className={`mt-2 ${styles.subtitle}`}>Team directory, roles, profile details, and contact info.</p>
          </div>
          <div id="tour-section-members-1" className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
            <div className={`px-5 py-3 text-center ${styles.statChip}`}>
              <p className={`text-xs font-black uppercase tracking-wider ${styles.statLabel}`}>Members</p>
              <p className={`text-2xl font-black ${styles.statValue}`}>{members.length}</p>
            </div>
            <div className={`px-5 py-3 text-center ${styles.statChip}`}>
              <p className={`text-xs font-black uppercase tracking-wider ${styles.statLabel}`}>Roles</p>
              <p className={`text-2xl font-black ${styles.statValue}`}>{roleCount}</p>
            </div>
            {myRole && myRole !== 'admin' && (
              <button
                type="button"
                onClick={() => setShowRequestModal(true)}
                className={`col-span-2 sm:col-span-1 flex items-center gap-2 px-5 py-3 text-sm font-bold ${styles.requestBtn}`}
              >
                <span className="text-base">＋</span> Request add member
              </button>
            )}
          </div>
        </section>

        {/* Search bar */}
        <section id="tour-section-members-2" className="mb-6">
          <label className="relative block">
            <span className="sr-only">Search members, roles, positions, or shared info</span>
            <span aria-hidden="true" className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${styles.searchIcon}`}>⌕</span>
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); setPage(1); }}
              type="search"
              placeholder="Search members, roles, positions, or shared info"
              className={`pl-11 pr-4 text-base ${styles.searchInput}`}
            />
          </label>
        </section>

        {error && (
          <div className={`mb-6 px-4 py-3 text-sm font-bold ${styles.errorBanner}`}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`animate-pulse ${styles.skeletonCard}`} />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pageMembers.map((member, index) => {
              const hasProfile = Boolean(member.bio || member.certificates);
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setSelected(member)}
                  className={`group p-5 text-left transition-all duration-200 ${styles.memberCard}`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    {member.avatarUrl ? (
                      <img src={member.avatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                    ) : (
                      <span
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-black ${styles.avatarFallback}`}
                        data-avatar={index % AVATAR_COUNT}
                      >
                        {initialsFor(member)}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <h2 className={`truncate font-semibold ${styles.memberName}`}>{member.name}</h2>
                      <p className={`truncate ${styles.memberPosition}`}>{member.position || member.roleLabel}</p>
                    </div>
                    <span className={`${roleBadgeCls(member.role)} text-xs shrink-0`}>
                      {member.roleLabel}
                    </span>
                  </div>
                  <p className={`truncate mb-2 ${styles.memberEmail}`}>{contactEmailFor(member)}</p>
                  <p
                    className={`line-clamp-2 min-h-8 leading-5 ${styles.memberBio}`}
                    data-empty={!hasProfile || undefined}
                  >
                    {member.bio || member.certificates || 'No shared profile details yet.'}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {!loading && filteredMembers.length === 0 && (
          <div className={`p-8 text-center text-sm font-bold ${styles.emptyState}`}>
            No members match the current search.
          </div>
        )}

        {/* MPE-02: pagination — plain Tailwind (remapped to design tokens via the
            html[data-palette] override in globals.scss), no inline style. */}
        {!loading && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setPage(safePage - 1)}
              disabled={safePage <= 1}
              className={`rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-default disabled:opacity-40 ${styles.pagerBtn}`}
            >
              ← Prev
            </button>
            <span className="text-xs font-semibold text-slate-400">
              Page {safePage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage(safePage + 1)}
              disabled={safePage >= totalPages}
              className={`rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-default disabled:opacity-40 ${styles.pagerBtn}`}
            >
              Next →
            </button>
          </div>
        )}

        {/* Member detail modal */}
        {selected && (
          <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${styles.modalOverlay}`}
            role="dialog"
            aria-modal="true"
            onClick={() => setSelected(null)}
          >
            <div
              className={`w-full max-w-2xl overflow-y-auto rounded-2xl p-6 ${styles.modalCard}`}
              onClick={e => e.stopPropagation()}
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-4">
                  {selected.avatarUrl ? (
                    <img src={selected.avatarUrl} alt="" className="h-20 w-20 shrink-0 rounded-2xl object-cover" />
                  ) : (
                    <span className={`grid h-20 w-20 shrink-0 place-items-center rounded-2xl text-xl font-black ${styles.modalAvatarLg}`}>
                      {initialsFor(selected)}
                    </span>
                  )}
                  <div className="min-w-0">
                    <h2 className={`text-2xl font-black tracking-tight ${styles.modalName}`}>{selected.name}</h2>
                    <p className={`mt-1 text-sm font-bold ${styles.modalPosition}`}>{selected.position || selected.roleLabel}</p>
                    <span className={`mt-3 inline-flex text-xs ${roleBadgeCls(selected.role)}`}>
                      {selected.roleLabel}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className={`grid h-9 w-9 shrink-0 place-items-center text-xl font-black transition ${styles.modalCloseBtn}`}
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
    <div className={`p-4 ${styles.detailCard} ${wide ? 'sm:col-span-2' : ''}`}>
      <p className={`text-xs font-black uppercase tracking-wider ${styles.detailLabel}`}>{label}</p>
      <p className={`mt-2 whitespace-pre-wrap break-words text-sm font-semibold leading-6 ${styles.detailValue}`}>{value}</p>
    </div>
  );
}
