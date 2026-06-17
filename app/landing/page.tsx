// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// In-app landing page — product showcase for new and returning users (9.38)
'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import AppShell from '@/components/layout/AppShell';
import { SvgIcon } from '@/components/ui/SvgIcon';

// ── Feature data ──────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: '📊', title: 'Sprint Throughput',          description: 'Committed vs completed, carryover, goal outcomes, and mid-sprint delivery patterns across every sprint.',                                                          href: '/dashboard',          color: '#E85D12' },
  { icon: '🔗', title: 'Work Item Explorer',         description: 'Visualise the complete hierarchy of any issue — parent, children, risk path, orphan detection — as an interactive graph.',                                         href: '/explore',            color: '#7c3aed' },
  { icon: '📈', title: 'Upload-to-Upload Trends',    description: 'Track how health score, completion rate, lead time, cycle time, and release confidence evolve across every upload.',                                               href: '/trends',             color: '#0891b2' },
  { icon: '👥', title: 'Team Health Comparison',     description: 'Side-by-side health scores per assignee — completion, critical items, blocked items, workload share, and average open age.',                                       href: '/teams',              color: '#22C55E' },
  { icon: '🗂️', title: 'Portfolio Summary',          description: 'Cross-team portfolio score aggregating epics (40%), projects (30%), sprint performance (20%), and data quality (10%).',                                            href: '/portfolio',          color: '#F59E0B' },
  { icon: '🚀', title: 'Release Readiness',          description: 'Per-version Go / Conditional Go / No-Go verdicts with a 7-item checklist: completion, blockers, bugs, critical items.',                                           href: '/readiness',          color: '#22C55E' },
  { icon: '📉', title: 'Visual Analytics',           description: '14 chart types: delivery composition, health mix, sprint velocity, epic progress, team capacity, kanban status, and more.',                                       href: '/charts',             color: '#FF8A4C' },
  { icon: '👤', title: 'Customer View',              description: 'Clean, jargon-free stakeholder summary — completion ring, milestones, top risks. Print or PDF in one click.',                                                     href: '/customer',           color: '#0d9488' },
  { icon: '📥', title: 'Smart Export Suite',         description: '17-sheet Excel workbook, executive PDF, HTML report, and Work Item Explorer export — all from a single upload.',                                                   href: '/summary',            color: '#059669' },
  { icon: '📸', title: 'Dashboard Snapshots',        description: 'Save named metric snapshots (e.g. "End of Sprint 14") and compare any two side-by-side with delta indicators.',                                                   href: '/snapshots',          color: '#6366f1' },
  { icon: '🔍', title: 'Data Quality Score',         description: 'Per-upload 0–100% data quality score with field-level breakdown — know which missing fields break which metrics.',                                                 href: '/dashboard',          color: '#F59E0B' },
  { icon: '🩺', title: 'Admin Diagnostics',          description: 'Live ops health score, DB stats, import success rates, environment checks, and recent audit log — admin-only.',                                                   href: '/admin/diagnostics',  color: '#F87171' },
] as const;

const HOW_IT_WORKS = [
  { step: '01', title: 'Export from Jira',    description: 'Go to Jira → Backlog → Export → CSV or Excel. No API keys, no credentials, no plugins required.',                                                                        icon: '📤' },
  { step: '02', title: 'Upload in seconds',   description: 'Drag and drop your file. Delivery Clarity parses it instantly, detects column formats, and computes all metrics.',                                                         icon: '⚡' },
  { step: '03', title: 'Act on insights',     description: 'Sprint health, risk signals, team capacity, release readiness, and smart recommendations — all ready before your next standup.',                                           icon: '🎯' },
] as const;

const STATS = [
  { value: '28+',  label: 'Metrics calculated',  color: 'var(--dc-acc2, #FF8A4C)' },
  { value: '17',   label: 'Excel export sheets',  color: 'var(--dc-green, #22C55E)' },
  { value: '14',   label: 'Dashboard sections',   color: 'var(--dc-acc2, #FF8A4C)' },
  { value: '469+', label: 'Automated tests',      color: 'var(--dc-amber, #F59E0B)' },
] as const;

// ── Components ────────────────────────────────────────────────────────────────

function FeatureCard({ icon, title, description, href, color }: typeof FEATURES[number]) {
  return (
    <a
      href={href}
      className="group rounded-2xl p-5 flex flex-col gap-3 cursor-pointer transition-all duration-200"
      style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}
      onMouseEnter={e => { e.currentTarget.style.border = '1px solid var(--dc-bdr2, rgba(255,255,255,0.13))'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'; }}
      onMouseLeave={e => { e.currentTarget.style.border = '1px solid var(--dc-bdr, rgba(255,255,255,0.07))'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ background: `${color}22` }}>
          <SvgIcon name={icon} size={22} style={{ color }} />
        </div>
        <h3 className="text-sm font-black" style={{ color: 'var(--dc-p1, #F2F2F2)' }}>{title}</h3>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: 'var(--dc-p2, #909090)' }}>{description}</p>
      <span className="text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: 'var(--dc-acc2, #FF8A4C)' }}>
        Open →
      </span>
    </a>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const router = useRouter();

  return (
    <AppShell showNav>
      <div className="max-w-6xl mx-auto">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="text-center py-12 px-4">
          <div className="flex justify-center mb-6">
            <Image
              src="/logo/delivery-clarity-logo-horizontal.svg"
              alt="Delivery Clarity"
              width={240}
              height={74}
              priority
            />
          </div>
          <div className="inline-flex items-center gap-2 mb-5 chip c-acc"
            style={{ borderRadius: 100, padding: '4px 12px', fontSize: 12 }}>
            <SvgIcon name="priorityHigh" size={12} />
            Zero-credential Jira intelligence
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight mb-4"
            style={{ color: 'var(--dc-p1, #F2F2F2)' }}>
            From messy boards to<br className="hidden sm:block" />
            <span style={{ color: 'var(--dc-acc2, #FF8A4C)' }}> measurable delivery confidence</span>
          </h1>
          <p className="text-lg leading-relaxed max-w-2xl mx-auto mb-8" style={{ color: 'var(--dc-p2, #909090)' }}>
            Upload any Jira CSV or Excel export. Get sprint health, team comparisons, risk signals,
            release readiness, and executive reports — in seconds, no API keys needed.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => router.push('/')}
              className="inline-flex items-center gap-2 rounded-[10px] px-7 py-3 text-sm font-extrabold text-white transition hover:opacity-90"
              style={{ background: 'var(--dc-acc, #E85D12)' }}>
              <SvgIcon name="upload" size={16} />
              Upload Jira Export
            </button>
            <button type="button" onClick={() => router.push('/dashboard')}
              className="inline-flex items-center gap-2 rounded-[10px] px-7 py-3 text-sm font-extrabold transition"
              style={{ background: 'rgba(232,93,18,0.09)', color: 'var(--dc-acc2, #FF8A4C)', border: '1px solid rgba(232,93,18,0.22)' }}>
              <SvgIcon name="dashboard" size={16} />
              Open Dashboard
            </button>
          </div>
        </section>

        {/* ── Stats strip ──────────────────────────────────────────────────── */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
          {STATS.map(s => (
            <div key={s.label} className="rounded-[10px] p-5 text-center"
              style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>
              <p className="font-black mb-1" style={{ color: s.color, fontSize: 22, fontFamily: 'var(--font-mono, monospace)' }}>{s.value}</p>
              <p className="font-bold uppercase tracking-wide" style={{ fontSize: 10, color: 'var(--dc-p2, #909090)' }}>{s.label}</p>
            </div>
          ))}
        </section>

        {/* ── How it works ─────────────────────────────────────────────────── */}
        <section className="mb-12">
          <h2 className="text-2xl font-black text-center mb-8" style={{ color: 'var(--dc-p1, #F2F2F2)' }}>How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map(step => (
              <div key={step.step} className="rounded-2xl p-6 text-center"
                style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>
                <SvgIcon name={step.icon} size={40} className="mx-auto mb-3" style={{ color: 'var(--dc-acc2, #FF8A4C)' }} />
                <div className="chip c-acc mb-2" style={{ display: 'inline-flex', borderRadius: 100, fontSize: 9, letterSpacing: '0.08em' }}>
                  STEP {step.step}
                </div>
                <h3 className="text-sm font-black mb-2" style={{ color: 'var(--dc-p1, #F2F2F2)' }}>{step.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--dc-p2, #909090)' }}>{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Feature grid ─────────────────────────────────────────────────── */}
        <section className="mb-12">
          <h2 className="text-2xl font-black text-center mb-2" style={{ color: 'var(--dc-p1, #F2F2F2)' }}>Everything in one place</h2>
          <p className="text-sm text-center mb-8" style={{ color: 'var(--dc-p2, #909090)' }}>Click any feature to open it directly.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(f => <FeatureCard key={f.title} {...f} />)}
          </div>
        </section>

        {/* ── CTA footer ───────────────────────────────────────────────────── */}
        <section className="rounded-2xl p-10 text-center mb-8"
          style={{ background: 'rgba(232,93,18,0.04)', border: '1px solid rgba(232,93,18,0.10)' }}>
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(232,93,18,0.12)' }}>
              <SvgIcon name="priorityHigh" size={28} style={{ color: 'var(--dc-acc2, #FF8A4C)' }} />
            </div>
          </div>
          <h2 className="text-2xl font-black mb-2" style={{ color: 'var(--dc-p1, #F2F2F2)' }}>Ready to get started?</h2>
          <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'var(--dc-p2, #909090)' }}>
            Upload your Jira export or try the 35-issue sample dataset — no account required for the dashboard.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => router.push('/')}
              className="inline-flex items-center gap-2 rounded-[10px] px-7 py-3 text-sm font-extrabold text-white transition hover:opacity-90"
              style={{ background: 'var(--dc-acc, #E85D12)' }}>
              Upload Jira Export →
            </button>
            <a href="/developer"
              className="inline-flex items-center gap-2 rounded-[10px] px-7 py-3 text-sm font-extrabold transition"
              style={{ background: 'rgba(232,93,18,0.09)', color: 'var(--dc-acc2, #FF8A4C)', border: '1px solid rgba(232,93,18,0.22)' }}>
              Developer Portal
            </a>
          </div>
          <p className="text-xs mt-6" style={{ color: 'var(--dc-p3, #505050)' }}>
            Delivery Clarity v4.1 · © 2026 Ali Abu Ras · aliaburas80@gmail.com
          </p>
        </section>

      </div>
    </AppShell>
  );
}
