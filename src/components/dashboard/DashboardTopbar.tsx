'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect, useCallback } from 'react';
import { DC_NAV_GROUPS } from '@/components/dc-shell/navigation';
import UserMenu from '@/components/auth/UserMenu';

// Label overrides for space-constrained topbar
const GROUP_LABEL_OVERRIDE: Record<string, string> = {
  administration: 'Admin',
};

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));
}

function groupIsActive(pathname: string, group: typeof DC_NAV_GROUPS[0]): boolean {
  return group.items.some(item => isActivePath(pathname, item.href));
}

// ─── Health colour lookup ─────────────────────────────────────────────────────
function healthMeta(score: number): { arc: string; bg: string; border: string; text: string; label: string } {
  if (score >= 75) return { arc: '#059669', bg: '#ECFDF5', border: '#A7F3D0', text: '#059669', label: score >= 90 ? 'Excellent' : 'Good' };
  if (score >= 60) return { arc: '#D97706', bg: '#FFFBEB', border: '#FDE68A', text: '#D97706', label: 'Moderate' };
  if (score >= 40) return { arc: '#DC2626', bg: '#FEF2F2', border: '#FECACA', text: '#DC2626', label: 'At-Risk' };
  return { arc: '#991B1B', bg: '#FEF2F2', border: '#FECACA', text: '#991B1B', label: 'Critical' };
}

const CIRC = 40.84;

interface Props {
  healthScore?: number;
  onNewUpload: () => void;
}

export default function DashboardTopbar({ healthScore = 0, onNewUpload }: Props) {
  const pathname = usePathname();
  const hm = healthMeta(healthScore);
  const filled = (healthScore / 100) * CIRC;
  const gap    = CIRC - filled;
  const dash   = `${filled.toFixed(1)} ${gap.toFixed(1)}`;

  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [dropPos, setDropPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const groupButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const dropMenuRef = useRef<HTMLDivElement>(null);

  const toggleGroup = useCallback((groupId: string) => {
    if (openGroup === groupId) {
      setOpenGroup(null);
      return;
    }
    const btn = groupButtonRefs.current[groupId];
    if (btn) {
      const rect = btn.getBoundingClientRect();
      setDropPos({ top: rect.bottom + 4, left: rect.left });
    }
    setOpenGroup(groupId);
  }, [openGroup]);

  useEffect(() => {
    if (!openGroup) return;
    const onMouseDown = (e: MouseEvent) => {
      const t = e.target as Element;
      if (!dropMenuRef.current?.contains(t) && !Object.values(groupButtonRefs.current).some(r => r?.contains(t))) {
        setOpenGroup(null);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenGroup(null); };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [openGroup]);

  const activeGroup = openGroup ? DC_NAV_GROUPS.find(g => g.id === openGroup) : null;

  return (
    <>
      <header style={{
        height: 52,
        background: '#ffffff',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 500,
        boxShadow: '0 1px 2px rgba(0,0,0,.04)',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}>

        {/* ── Logo ── */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, textDecoration: 'none' }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7, background: '#2563EB',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="#fff" strokeWidth="2.5" aria-hidden="true">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', letterSpacing: '-.01em' }}>
            Delivery Clarity
          </span>
          <span style={{ fontSize: 8, color: '#94A3B8', fontFamily: 'monospace', marginLeft: 2 }}>
            v4.1
          </span>
        </Link>

        {/* ── Spacer ── */}
        <div style={{ flex: 1 }} />

        {/* ── Right nav ── */}
        <div style={{ display: 'flex', alignItems: 'center', height: 52 }}>

          {/* 6 nav group buttons */}
          {DC_NAV_GROUPS.map(group => {
            const active = groupIsActive(pathname, group);
            const isOpen = openGroup === group.id;
            const label = GROUP_LABEL_OVERRIDE[group.id] ?? group.label;
            return (
              <button
                key={group.id}
                ref={el => { groupButtonRefs.current[group.id] = el; }}
                type="button"
                onClick={() => toggleGroup(group.id)}
                aria-haspopup="menu"
                aria-expanded={isOpen}
                style={{
                  fontSize: 12,
                  color: active || isOpen ? '#2563EB' : '#64748B',
                  fontWeight: active || isOpen ? 600 : 400,
                  padding: '0 10px',
                  height: '100%',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  whiteSpace: 'nowrap',
                  position: 'relative',
                }}
              >
                {active && (
                  <span style={{
                    position: 'absolute', bottom: 0, left: 7, right: 7,
                    height: 2, background: '#2563EB', borderRadius: '2px 2px 0 0',
                  }} />
                )}
                {label}
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2"
                  style={{ opacity: 0.6, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }}
                  aria-hidden="true">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
            );
          })}

          {/* Separator */}
          <div style={{ width: 1, height: 18, background: '#E2E8F0', margin: '0 8px' }} />

          {/* Health pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 7,
            background: hm.bg, border: `1px solid ${hm.border}`,
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <circle cx="9" cy="9" r="6.5" fill="none" stroke={hm.border} strokeWidth="2.5" />
              <circle cx="9" cy="9" r="6.5" fill="none" stroke={hm.arc} strokeWidth="2.5"
                strokeDasharray={dash} strokeDashoffset="10" strokeLinecap="round" />
            </svg>
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: hm.text, lineHeight: 1 }}>
                {healthScore}
              </div>
              <div style={{
                fontSize: 8, fontWeight: 700, color: hm.text,
                textTransform: 'uppercase', letterSpacing: '.05em',
                display: 'block', marginTop: 1,
              }}>
                {hm.label}
              </div>
            </div>
          </div>

          {/* New Upload button */}
          <button
            type="button"
            onClick={onNewUpload}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: '#2563EB', color: '#fff',
              fontSize: 11, fontWeight: 600,
              padding: '6px 12px', borderRadius: 7, border: 'none',
              marginLeft: 8, cursor: 'pointer',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#1D4ED8')}
            onMouseLeave={e => (e.currentTarget.style.background = '#2563EB')}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
              stroke="#fff" strokeWidth="2.5" aria-hidden="true">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            New Upload
          </button>

          {/* User menu */}
          <div style={{ marginLeft: 6, flexShrink: 0 }}>
            <UserMenu />
          </div>
        </div>
      </header>

      {/* ── Dropdown menu ── */}
      {openGroup && activeGroup && (
        <div
          ref={dropMenuRef}
          role="menu"
          style={{
            position: 'fixed',
            top: dropPos.top,
            left: dropPos.left,
            zIndex: 600,
            background: '#ffffff',
            border: '1px solid #E2E8F0',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
            padding: '6px',
            minWidth: 220,
            maxWidth: 280,
            fontFamily: "'Segoe UI', system-ui, sans-serif",
          }}
        >
          {activeGroup.items.map(item => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                role="menuitem"
                onClick={() => setOpenGroup(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: 6,
                  textDecoration: 'none',
                  background: active ? '#EFF6FF' : 'transparent',
                  transition: 'background 120ms',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#F8FAFC'; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <span>
                  <span style={{
                    display: 'block', fontSize: 13, fontWeight: 600,
                    color: active ? '#2563EB' : '#0F172A',
                  }}>
                    {item.title}
                  </span>
                  <span style={{ fontSize: 11, color: '#94A3B8', marginTop: 1, display: 'block' }}>
                    {item.desc}
                  </span>
                </span>
                <span
                  style={{
                    width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                    background: item.status === 'critical' ? '#F87171'
                      : item.status === 'warning'  ? '#F59E0B'
                      : item.status === 'success'  ? '#22C55E'
                      : item.status === 'info'     ? '#3B82F6'
                      : '#CBD5E1',
                  }}
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
