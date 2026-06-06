// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// In-app landing page — product showcase for new and returning users (9.38)
'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import AppShell from '@/components/layout/AppShell';

// ── Feature data ──────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: '📊',
    title: 'Sprint Throughput',
    description: 'Committed vs completed, carryover, goal outcomes, and mid-sprint delivery patterns across every sprint.',
    href: '/dashboard',
    color: '#2563eb',
  },
  {
    icon: '🔗',
    title: 'Work Item Explorer',
    description: 'Visualise the complete hierarchy of any issue — parent, children, risk path, orphan detection — as an interactive graph.',
    href: '/explore',
    color: '#7c3aed',
  },
  {
    icon: '📈',
    title: 'Upload-to-Upload Trends',
    description: 'Track how health score, completion rate, lead time, cycle time, and release confidence evolve across every upload.',
    href: '/trends',
    color: '#0891b2',
  },
  {
    icon: '👥',
    title: 'Team Health Comparison',
    description: 'Side-by-side health scores per assignee — completion, critical items, blocked items, workload share, and average open age.',
    href: '/teams',
    color: '#16a34a',
  },
  {
    icon: '🗂️',
    title: 'Portfolio Summary',
    description: 'Cross-team portfolio score aggregating epics (40%), projects (30%), sprint performance (20%), and data quality (10%).',
    href: '/portfolio',
    color: '#f59e0b',
  },
  {
    icon: '🚀',
    title: 'Release Readiness',
    description: 'Per-version Go / Conditional Go / No-Go verdicts with a 7-item checklist: completion, blockers, bugs, critical items.',
    href: '/readiness',
    color: '#22c55e',
  },
  {
    icon: '📉',
    title: 'Visual Analytics',
    description: '14 chart types: delivery composition, health mix, sprint velocity, epic progress, team capacity, kanban status, and more.',
    href: '/charts',
    color: '#ea580c',
  },
  {
    icon: '👤',
    title: 'Customer View',
    description: 'Clean, jargon-free stakeholder summary — completion ring, milestones, top risks. Print or PDF in one click.',
    href: '/customer',
    color: '#0d9488',
  },
  {
    icon: '📥',
    title: 'Smart Export Suite',
    description: '17-sheet Excel workbook, executive PDF, HTML report, and Work Item Explorer export — all from a single upload.',
    href: '/summary',
    color: '#059669',
  },
  {
    icon: '📸',
    title: 'Dashboard Snapshots',
    description: 'Save named metric snapshots (e.g. "End of Sprint 14") and compare any two side-by-side with delta indicators.',
    href: '/snapshots',
    color: '#6366f1',
  },
  {
    icon: '🔍',
    title: 'Data Quality Score',
    description: 'Per-upload 0–100% data quality score with field-level breakdown — know which missing fields break which metrics.',
    href: '/dashboard',
    color: '#f97316',
  },
  {
    icon: '🩺',
    title: 'Admin Diagnostics',
    description: 'Live ops health score, DB stats, import success rates, environment checks, and recent audit log — admin-only.',
    href: '/admin/diagnostics',
    color: '#dc2626',
  },
] as const;

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Export from Jira',
    description: 'Go to Jira → Backlog → Export → CSV or Excel. No API keys, no credentials, no plugins required.',
    icon: '📤',
  },
  {
    step: '02',
    title: 'Upload in seconds',
    description: 'Drag and drop your file. Delivery Clarity parses it instantly, detects column formats, and computes all metrics.',
    icon: '⚡',
  },
  {
    step: '03',
    title: 'Act on insights',
    description: 'Sprint health, risk signals, team capacity, release readiness, and smart recommendations — all ready before your next standup.',
    icon: '🎯',
  },
] as const;

const STATS = [
  { value: '28+',  label: 'Metrics calculated',    color: '#2563eb' },
  { value: '17',   label: 'Excel export sheets',    color: '#16a34a' },
  { value: '14',   label: 'Dashboard sections',     color: '#7c3aed' },
  { value: '310+', label: 'Automated tests',        color: '#f59e0b' },
] as const;

// ── Components ────────────────────────────────────────────────────────────────

function FeatureCard({ icon, title, description, href, color }: typeof FEATURES[number]) {
  return (
    <a href={href}
      className="group bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all flex flex-col gap-3 cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ background: `${color}15` }}>
          {icon}
        </div>
        <h3 className="text-sm font-black text-slate-900 group-hover:text-blue-700 transition-colors">{title}</h3>
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
      <span className="text-[10px] font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
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
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 text-xs font-bold text-blue-700 mb-5">
            ⚡ Zero-credential Jira intelligence
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-4">
            From messy boards to<br className="hidden sm:block" />
            <span className="text-blue-600"> measurable delivery confidence</span>
          </h1>
          <p className="text-slate-500 text-lg leading-relaxed max-w-2xl mx-auto mb-8">
            Upload any Jira CSV or Excel export. Get sprint health, team comparisons, risk signals,
            release readiness, and executive reports — in seconds, no API keys needed.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => router.push('/')}
              className="btn-primary px-7 py-3 text-sm gap-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M11 3h2v10.2l3.6-3.6L18 11l-6 6-6-6 1.4-1.4 3.6 3.6V3ZM5 19h14v2H5v-2Z"/></svg>
              Upload Jira Export
            </button>
            <button type="button" onClick={() => router.push('/dashboard')}
              className="btn-secondary px-7 py-3 text-sm gap-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M4 19h16v2H2V3h2v16Zm3-2 4-5 3 3.5L19 8l1.7 1.1-6.5 9.8-3.1-3.6L8.5 18 7 17Z"/></svg>
              Open Dashboard
            </button>
          </div>
        </section>

        {/* ── Stats strip ──────────────────────────────────────────────────── */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
          {STATS.map(s => (
            <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-5 text-center shadow-sm">
              <p className="text-3xl font-black mb-1" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </section>

        {/* ── How it works ─────────────────────────────────────────────────── */}
        <section className="mb-12">
          <h2 className="text-2xl font-black text-slate-900 text-center mb-8">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map(step => (
              <div key={step.step} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-center">
                <div className="text-4xl mb-3">{step.icon}</div>
                <div className="text-xs font-black text-blue-600 tracking-widest uppercase mb-2">Step {step.step}</div>
                <h3 className="text-base font-black text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Feature grid ─────────────────────────────────────────────────── */}
        <section className="mb-12">
          <h2 className="text-2xl font-black text-slate-900 text-center mb-2">Everything in one place</h2>
          <p className="text-sm text-slate-500 text-center mb-8">Click any feature to open it directly.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(f => <FeatureCard key={f.title} {...f} />)}
          </div>
        </section>

        {/* ── CTA footer ───────────────────────────────────────────────────── */}
        <section className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-2xl p-10 text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#1455f5,#2563eb 48%,#17b8d6)', boxShadow: '0 8px 24px rgba(37,99,235,0.4)' }}>
              <svg viewBox="0 0 24 24" style={{ width: 28, height: 28, fill: 'white' }} aria-hidden="true">
                <path d="M13.7 2.3 4.8 13.1c-.5.6-.1 1.5.7 1.5h5.2l-1 6.6c-.1.8.9 1.2 1.4.6l8.1-10.5c.5-.6.1-1.5-.7-1.5h-4.8l1.4-6.8c.2-.8-.9-1.3-1.4-.7Z"/>
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Ready to get started?</h2>
          <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
            Upload your Jira export or try the 35-issue sample dataset — no account required for the dashboard.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => router.push('/')}
              className="btn-primary px-7 py-3 text-sm">
              Upload Jira Export →
            </button>
            <a href="/developer" className="btn-secondary px-7 py-3 text-sm" style={{ color: '#e2e8f0', borderColor: '#334155', background: 'transparent' }}>
              Developer Portal
            </a>
          </div>
          <p className="text-xs text-slate-600 mt-6">
            Delivery Clarity v4.1 · © 2026 Ali Abu Ras · aliaburas80@gmail.com
          </p>
        </section>

      </div>
    </AppShell>
  );
}
