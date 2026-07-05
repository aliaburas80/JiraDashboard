// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// In-app landing page — product showcase for new and returning users (9.38)
'use client';

import type { CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import clsx from 'clsx';
import AppShell from '@/components/layout/AppShell';
import { AnimatedDataBackground } from '@/components/ui/AnimatedDataBackground';
import { SvgIcon } from '@/components/ui/SvgIcon';
import styles from './page.module.scss';

// DYNAMIC CSS VARIABLE: each feature/stat has its own brand color from data,
// not a fixed set of variants — passed through as a custom property so SCSS
// still owns every other visual rule (CLAUDE.md §14.2).
type CSSVariableProperties = CSSProperties & Record<`--${string}`, string>;

// ── Feature data ──────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: 'chartBar', title: 'Sprint Throughput',          description: 'Committed vs completed, carryover, goal outcomes, and mid-sprint delivery patterns across every sprint.',                                                          href: '/dashboard',          color: '#E85D12' },
  { icon: 'link', title: 'Work Item Explorer',         description: 'Visualise the complete hierarchy of any issue — parent, children, risk path, orphan detection — as an interactive graph.',                                         href: '/explore',            color: '#7c3aed' },
  { icon: 'chartTrendUp', title: 'Upload-to-Upload Trends',    description: 'Track how health score, completion rate, lead time, cycle time, and release confidence evolve across every upload.',                                               href: '/trends',             color: '#0891b2' },
  { icon: 'people', title: 'Team Health Comparison',     description: 'Side-by-side health scores per assignee — completion, critical items, blocked items, workload share, and average open age.',                                       href: '/teams',              color: '#22C55E' },
  { icon: 'folder', title: 'Portfolio Summary',          description: 'Cross-team portfolio score aggregating epics (40%), projects (30%), sprint performance (20%), and data quality (10%).',                                            href: '/portfolio',          color: '#F59E0B' },
  { icon: 'release', title: 'Release Readiness',          description: 'Per-version Go / Conditional Go / No-Go verdicts with a 7-item checklist: completion, blockers, bugs, critical items.',                                           href: '/readiness',          color: '#22C55E' },
  { icon: 'chartTrendDown', title: 'Visual Analytics',           description: '14 chart types: delivery composition, health mix, sprint velocity, epic progress, team capacity, kanban status, and more.',                                       href: '/charts',             color: '#FF8A4C' },
  { icon: 'person', title: 'Customer View',              description: 'Clean, jargon-free stakeholder summary — completion ring, milestones, top risks. Print or PDF in one click.',                                                     href: '/customer',           color: '#0d9488' },
  { icon: 'download', title: 'Smart Export Suite',         description: '17-sheet Excel workbook, executive PDF, HTML report, and Work Item Explorer export — all from a single upload.',                                                   href: '/summary',            color: '#059669' },
  { icon: 'camera', title: 'Dashboard Snapshots',        description: 'Save named metric snapshots (e.g. "End of Sprint 14") and compare any two side-by-side with delta indicators.',                                                   href: '/snapshots',          color: '#6366f1' },
  { icon: 'search', title: 'Data Quality Score',         description: 'Per-upload 0–100% data quality score with field-level breakdown — know which missing fields break which metrics.',                                                 href: '/dashboard',          color: '#F59E0B' },
  { icon: 'statusInfo', title: 'Admin Diagnostics',          description: 'Live ops health score, DB stats, import success rates, environment checks, and recent audit log — admin-only.',                                                   href: '/admin/diagnostics',  color: '#F87171' },
] as const;

const HOW_IT_WORKS = [
  { step: '01', title: 'Export from Jira',    description: 'Go to Jira → Backlog → Export → CSV or Excel. No API keys, no credentials, no plugins required.',                                                                        icon: 'upload' },
  { step: '02', title: 'Upload in seconds',   description: 'Drag and drop your file. Delivery Clarity parses it instantly, detects column formats, and computes all metrics.',                                                         icon: 'priorityHigh' },
  { step: '03', title: 'Act on insights',     description: 'Sprint health, risk signals, team capacity, release readiness, and smart recommendations — all ready before your next standup.',                                           icon: 'target' },
] as const;

const STATS = [
  { value: '28+',  label: 'Metrics calculated',  color: '#FF8A4C' },
  { value: '17',   label: 'Excel export sheets',  color: '#22C55E' },
  { value: '14',   label: 'Dashboard sections',   color: '#FF8A4C' },
  { value: '469+', label: 'Automated tests',      color: '#F59E0B' },
] as const;

// ── Components ────────────────────────────────────────────────────────────────

function FeatureCard({ icon, title, description, href, color }: typeof FEATURES[number]) {
  // DYNAMIC CSS VARIABLE: each feature has its own brand color from data.
  const variables: CSSVariableProperties = { '--feature-color': color };
  return (
    <a href={href} className={clsx(styles.featureCard, 'group')} style={variables}>
      <div className="flex items-center gap-3">
        <div className={styles.featureIconWrap}>
          <SvgIcon name={icon} size={22} />
        </div>
        <h3 className={styles.featureTitle}>{title}</h3>
      </div>
      <p className={styles.featureDesc}>{description}</p>
      <span className={styles.featureCta}>Open →</span>
    </a>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const router = useRouter();

  return (
    <AppShell showNav>
      <div className={styles.wrapper}>

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className={styles.hero}>
          <AnimatedDataBackground />
          <div className={styles.heroVignette} aria-hidden="true" />
          <div className={clsx(styles.heroContent, 'animate-fade-in')}>
            <div className="flex justify-center mb-6">
              <Image
                src="/logo/delivery-clarity-logo-horizontal.svg"
                alt="Delivery Clarity"
                width={240}
                height={74}
                priority
              />
            </div>
            <div className={styles.heroBadge}>
              <SvgIcon name="priorityHigh" size={12} />
              Zero-credential Jira intelligence
            </div>
            <h1 className={clsx(styles.heroTitle, 'text-4xl sm:text-5xl font-black tracking-tight leading-tight mb-4')}>
              From messy boards to<br className="hidden sm:block" />
              <span className={styles.heroAccent}> measurable delivery confidence</span>
            </h1>
            <p className={clsx(styles.heroSubhead, 'text-lg leading-relaxed max-w-2xl mx-auto')}>
              Upload any Jira CSV or Excel export. Get sprint health, team comparisons, risk signals,
              release readiness, and executive reports — in seconds, no API keys needed.
            </p>
            <div className={styles.heroActions}>
              <button type="button" onClick={() => router.push('/')} className="btn-primary px-7 py-3 text-sm">
                <SvgIcon name="upload" size={16} />
                Upload Jira Export
              </button>
              <button type="button" onClick={() => router.push('/dashboard')} className={clsx(styles.btnOutline, 'px-7 py-3 text-sm')}>
                <SvgIcon name="dashboard" size={16} />
                Open Dashboard
              </button>
            </div>
          </div>
        </section>

        {/* ── Stats strip ──────────────────────────────────────────────────── */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12 animate-fade-in">
          {STATS.map(s => {
            // DYNAMIC CSS VARIABLE: each stat has its own brand color from data.
            const variables: CSSVariableProperties = { '--stat-color': s.color };
            return (
              <div key={s.label} className={styles.statCard} style={variables}>
                <p className={styles.statValue}>{s.value}</p>
                <p className={styles.statLabel}>{s.label}</p>
              </div>
            );
          })}
        </section>

        {/* ── How it works ─────────────────────────────────────────────────── */}
        <section className="mb-12">
          <h2 className={clsx(styles.sectionTitle, 'text-2xl font-black text-center mb-8')}>How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map(step => (
              <div key={step.step} className={styles.stepCard}>
                <SvgIcon name={step.icon} size={40} className={clsx(styles.stepIcon, 'mx-auto mb-3')} />
                <div className={clsx(styles.stepBadge, 'chip c-acc')}>
                  STEP {step.step}
                </div>
                <h3 className={clsx(styles.stepTitle, 'text-sm font-black mb-2')}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Feature grid ─────────────────────────────────────────────────── */}
        <section className="mb-12">
          <h2 className={clsx(styles.sectionTitle, 'text-2xl font-black text-center mb-2')}>Everything in one place</h2>
          <p className={clsx(styles.sectionSubtitle, 'text-sm text-center mb-8')}>Click any feature to open it directly.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(f => <FeatureCard key={f.title} {...f} />)}
          </div>
        </section>

        {/* ── CTA footer ───────────────────────────────────────────────────── */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaIconWrap}>
            <SvgIcon name="priorityHigh" size={28} />
          </div>
          <h2 className={clsx(styles.ctaTitle, 'text-2xl font-black mb-2')}>Ready to get started?</h2>
          <p className={clsx(styles.ctaDesc, 'text-sm mb-6 max-w-md mx-auto')}>
            Upload your Jira export or try the 35-issue sample dataset — no account required for the dashboard.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => router.push('/')} className="btn-primary px-7 py-3 text-sm">
              Upload Jira Export →
            </button>
            <a href="/developer" className={clsx(styles.btnOutline, 'px-7 py-3 text-sm')}>
              Developer Portal
            </a>
          </div>
          <p className={clsx(styles.ctaFooterNote, 'text-xs')}>
            Delivery Clarity v4.1 · © 2026 Ali Abu Ras · ali.aburas@deliveryclarity.app
          </p>
        </section>

      </div>
    </AppShell>
  );
}
