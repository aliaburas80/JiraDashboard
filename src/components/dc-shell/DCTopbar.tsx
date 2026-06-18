'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect, useCallback } from 'react';
import UserMenu from '@/components/auth/UserMenu';
import { DC_NAV_GROUPS } from './navigation';

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));
}

function groupIsActive(pathname: string, group: typeof DC_NAV_GROUPS[0]): boolean {
  return group.items.some(item => isActivePath(pathname, item.href));
}

export default function DCTopbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
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
      <header className="dc-topbar" role="banner">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 mr-6" aria-label="Delivery Clarity home">
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'var(--blue)',
            display: 'grid', placeItems: 'center', flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" stroke="white" strokeWidth="1" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--n900)', letterSpacing: '-0.02em' }}>
              Delivery Clarity
            </span>
            <span style={{ fontSize: 10, color: 'var(--n400)', fontWeight: 500, marginTop: 1 }}>
              v4.1
            </span>
          </div>
        </Link>

        {/* Center nav — 5 dropdown groups */}
        <nav className="hidden md:flex items-center gap-0.5 flex-1" aria-label="Main navigation">
          {DC_NAV_GROUPS.map(group => {
            const active = groupIsActive(pathname, group);
            const isOpen = openGroup === group.id;
            return (
              <button
                key={group.id}
                ref={el => { groupButtonRefs.current[group.id] = el; }}
                type="button"
                onClick={() => toggleGroup(group.id)}
                aria-haspopup="menu"
                aria-expanded={isOpen}
                style={{
                  padding: '6px 10px 4px',
                  borderRadius: 0,
                  fontSize: 13,
                  fontWeight: 500,
                  color: active || isOpen ? 'var(--blue)' : 'var(--n600)',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: active ? '2px solid var(--blue)' : '2px solid transparent',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  transition: 'color 150ms',
                }}
              >
                {group.label}
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"
                  style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }}>
                  <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            );
          })}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-2 ml-auto">
          {/* New upload */}
          <Link
            href="/"
            style={{
              background: 'var(--blue)',
              color: 'white',
              borderRadius: 8,
              padding: '6px 14px',
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
            title="Upload new file"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <span className="hidden sm:inline">New Upload</span>
          </Link>

          <UserMenu />

          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Open navigation"
            aria-expanded={mobileOpen}
            style={{ color: 'var(--n500)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>}
            </svg>
          </button>
        </div>
      </header>

      {/* Dropdown menu (shared, positioned absolutely) */}
      {openGroup && activeGroup && (
        <div
          ref={dropMenuRef}
          role="menu"
          style={{
            position: 'fixed',
            top: dropPos.top,
            left: dropPos.left,
            zIndex: 999,
            background: 'var(--sur)',
            border: '1px solid var(--n200)',
            borderRadius: 10,
            boxShadow: 'var(--sh3)',
            padding: '8px',
            minWidth: 220,
            maxWidth: 280,
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
                  background: active ? 'var(--blue-bg)' : 'transparent',
                  transition: 'background 120ms',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--n100)'; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <span>
                  <span style={{
                    display: 'block', fontSize: 13, fontWeight: 600,
                    color: active ? 'var(--blue)' : 'var(--n800)',
                  }}>
                    {item.title}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--n400)', marginTop: 1, display: 'block' }}>
                    {item.desc}
                  </span>
                </span>
                <span
                  style={{
                    width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                    background: item.status === 'critical' ? 'var(--crit)'
                      : item.status === 'warning' ? 'var(--warn)'
                      : item.status === 'success' ? 'var(--good)'
                      : item.status === 'info' ? 'var(--mod)'
                      : 'var(--n300)',
                  }}
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </div>
      )}

      {/* Mobile nav */}
      {mobileOpen && (
        <nav
          style={{
            background: 'var(--sur)',
            borderBottom: '1px solid var(--n200)',
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
          aria-label="Mobile navigation"
        >
          {DC_NAV_GROUPS.map(group => (
            <section key={group.id}>
              <p style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                color: 'var(--n400)', textTransform: 'uppercase',
                padding: '8px 12px 4px', margin: 0,
              }}>{group.label}</p>
              {group.items.map(item => {
                const active = isActivePath(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 6,
                      fontSize: 14,
                      fontWeight: 500,
                      color: active ? 'var(--blue)' : 'var(--n600)',
                      background: active ? 'var(--blue-bg)' : 'transparent',
                      textDecoration: 'none',
                      display: 'block',
                    }}
                  >
                    {item.title}
                  </Link>
                );
              })}
            </section>
          ))}
        </nav>
      )}
    </>
  );
}
