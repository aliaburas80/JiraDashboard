'use client';

import { type ReactNode } from 'react';

// ─── Sticky toolbar that sits immediately under the 52px topbar ──────────────
export function StickyToolbar({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 52,
        zIndex: 40,
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E2E8F0',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 24px',
        flexWrap: 'wrap',
        minHeight: 52,
      }}
    >
      {children}
    </div>
  );
}

// ─── Filter chip button ───────────────────────────────────────────────────────
export function FilterChip({
  label, active, onClick, dot,
}: { label: string; active: boolean; onClick: () => void; dot?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '5px 12px',
        borderRadius: 20,
        border: active ? 'none' : '1px solid #E2E8F0',
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: 600,
        color: active ? '#2563EB' : '#64748B',
        background: active ? '#EFF6FF' : 'transparent',
        transition: 'all 150ms',
        whiteSpace: 'nowrap',
        fontFamily: 'inherit',
      }}
    >
      {dot && (
        <span style={{
          position: 'absolute', top: 3, right: 3,
          width: 6, height: 6, borderRadius: '50%',
          background: '#EF4444',
        }} />
      )}
      {label}
    </button>
  );
}

// ─── Toolbar spacer ───────────────────────────────────────────────────────────
export function ToolbarSpacer() {
  return <div style={{ flex: 1 }} />;
}

// ─── Icon button in toolbar ───────────────────────────────────────────────────
export function ToolbarButton({
  label, onClick, primary,
}: { label: string; onClick: () => void; primary?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '5px 12px', borderRadius: 7,
        border: primary ? 'none' : '1px solid #E2E8F0',
        cursor: 'pointer',
        fontSize: 12, fontWeight: 600,
        color: primary ? '#fff' : '#475569',
        background: primary ? '#2563EB' : '#fff',
        fontFamily: 'inherit',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

// ─── Layout control (far right of toolbar) ───────────────────────────────────
export function LayoutControl() {
  return (
    <button
      type="button"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '5px 10px', borderRadius: 7,
        border: '1px solid #E2E8F0',
        cursor: 'pointer',
        fontSize: 12, fontWeight: 500,
        color: '#64748B',
        background: '#fff',
        fontFamily: 'inherit',
        marginLeft: 4,
      }}
      title="Layout options"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
      Layout
    </button>
  );
}

// ─── Page header ─────────────────────────────────────────────────────────────
export function PageHeader({
  title, subtitle, badge,
}: { title: string; subtitle?: string; badge?: string }) {
  return (
    <div style={{ padding: '24px 28px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
          {title}
        </h1>
        {badge && (
          <span style={{
            fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 3,
            background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE',
            letterSpacing: '.06em', textTransform: 'uppercase' as const,
          }}>
            {badge}
          </span>
        )}
      </div>
      {subtitle && (
        <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>{subtitle}</p>
      )}
    </div>
  );
}

// ─── KPI mini-card ────────────────────────────────────────────────────────────
export function MiniKpiCard({
  label, value, color, bg, border,
}: { label: string; value: string; color: string; bg: string; border: string }) {
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: '14px 16px' }}>
      <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.08em', color: '#94A3B8', marginBottom: 4 }}>
        {label}
      </p>
      <p style={{ fontSize: 22, fontWeight: 800, fontFamily: 'monospace', color, margin: 0, lineHeight: 1 }}>
        {value}
      </p>
    </div>
  );
}

// ─── Section card wrapper ─────────────────────────────────────────────────────
export function SectionCard({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #E2E8F0',
      borderRadius: 12, overflow: 'hidden',
      marginBottom: 16,
    }}>
      {title && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{title}</span>
        </div>
      )}
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
export function EmptyPage({ message }: { message: string }) {
  return (
    <div style={{ padding: '60px 28px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
      {message}
    </div>
  );
}

// ─── Loading shimmer ──────────────────────────────────────────────────────────
export function PageLoading() {
  return (
    <div style={{ padding: '28px' }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          height: 80, borderRadius: 10, background: '#F1F5F9',
          marginBottom: 12, animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      ))}
    </div>
  );
}
