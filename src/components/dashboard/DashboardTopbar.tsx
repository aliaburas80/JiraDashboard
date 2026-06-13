'use client';
import { usePathname, useRouter } from 'next/navigation';

// ─── Health colour lookup ─────────────────────────────────────────────────────
function healthMeta(score: number): { arc: string; bg: string; border: string; text: string; label: string } {
  if (score >= 75) return { arc: '#059669', bg: '#ECFDF5', border: '#A7F3D0', text: '#059669', label: score >= 90 ? 'Excellent' : 'Good' };
  if (score >= 60) return { arc: '#D97706', bg: '#FFFBEB', border: '#FDE68A', text: '#D97706', label: 'Moderate' };
  if (score >= 40) return { arc: '#DC2626', bg: '#FEF2F2', border: '#FECACA', text: '#DC2626', label: 'At-Risk' };
  return { arc: '#991B1B', bg: '#FEF2F2', border: '#FECACA', text: '#991B1B', label: 'Critical' };
}

// SVG ring circumference for r=6.5 → 40.84
const CIRC = 40.84;

interface Props {
  healthScore?: number;
  userInitial?: string;
  onNewUpload: () => void;
}

export default function DashboardTopbar({ healthScore = 0, userInitial = 'A', onNewUpload }: Props) {
  const pathname = usePathname();
  const hm = healthMeta(healthScore);
  const filled = (healthScore / 100) * CIRC;
  const gap    = CIRC - filled;
  const dash   = `${filled.toFixed(1)} ${gap.toFixed(1)}`;

  const navGroups = [
    { label: 'Analytics', active: true },
    { label: 'Explore',   active: false },
    { label: 'Delivery',  active: false },
    { label: 'Data',      active: false },
    { label: 'Admin',     active: false },
    { label: 'Reference', active: false },
  ];

  return (
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
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
      </div>

      {/* ── Spacer ── */}
      <div style={{ flex: 1 }} />

      {/* ── Right nav ── */}
      <div style={{ display: 'flex', alignItems: 'center', height: 52 }}>

        {/* 6 nav buttons */}
        {navGroups.map(({ label, active }) => (
          <button
            key={label}
            type="button"
            style={{
              fontSize: 12,
              color: active ? '#2563EB' : '#64748B',
              fontWeight: active ? 600 : 400,
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
              stroke="currentColor" strokeWidth="2" style={{ opacity: 0.6 }} aria-hidden="true">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        ))}

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

        {/* User avatar */}
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: '#2563EB',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color: '#fff',
          marginLeft: 7, border: '1px solid #BFDBFE', flexShrink: 0,
        }}>
          {userInitial.toUpperCase()}
        </div>
      </div>
    </header>
  );
}
