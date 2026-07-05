// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// In-app landing page — product showcase for new and returning users (9.38)
'use client';

import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import clsx from 'clsx';
import AppShell from '@/components/layout/AppShell';
import { AnimatedDataBackground } from '@/components/ui/AnimatedDataBackground';
import { SvgIcon } from '@/components/ui/SvgIcon';
import styles from './page.module.scss';

// DYNAMIC CSS VARIABLE: each feature/stat/preview tile has its own brand color
// or stagger delay from data, not a fixed set of variants — passed through as
// a custom property so SCSS still owns every other visual rule (CLAUDE.md §14.2).
type CSSVariableProperties = CSSProperties & Record<`--${string}`, string>;

// Reveals its target once it scrolls into view, then stays revealed — used to
// stagger sections and cards in on scroll. Skips straight to revealed when the
// visitor prefers reduced motion, per CLAUDE.md §26.6.
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setRevealed(true); return; }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setRevealed(true); observer.disconnect(); }
    }, { threshold: 0.15 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, revealed] as const;
}

// ── Hero floating mini-cards (decorative, desktop only) ─────────────────────

const HERO_FLOATS = [
  { label: 'Sprint Health',       icon: 'sprint',       color: '#22C55E', className: 'top-[16%] left-[3%]',   delay: '0s' },
  { label: 'Release Readiness',   icon: 'release',      color: '#F59E0B', className: 'top-[8%] right-[4%]',   delay: '0.6s' },
  { label: 'Data Quality',        icon: 'search',       color: '#0891b2', className: 'bottom-[22%] right-[8%]', delay: '1.2s' },
  { label: 'Team Capacity',       icon: 'people',       color: '#7c3aed', className: 'bottom-[14%] left-[6%]', delay: '1.8s' },
  { label: 'Risk Signals',        icon: 'priorityHigh', color: '#F87171', className: 'top-[42%] right-[1%]',  delay: '2.4s' },
] as const;

const HERO_GLIMPSE = [
  { label: 'Sprint completion',    value: '78%', width: '78%' },
  { label: 'Release confidence',   value: 'Go',  width: '92%' },
  { label: 'Data quality score',   value: '94%', width: '94%' },
] as const;

// ── Stats strip ──────────────────────────────────────────────────────────────

const STATS = [
  { icon: 'chartTrendUp', value: '28+',  label: 'Metrics calculated',   color: '#FF8A4C' },
  { icon: 'table',        value: '17',   label: 'Excel export sheets',  color: '#22C55E' },
  { icon: 'dashboard',    value: '14',   label: 'Dashboard sections',   color: '#0891b2' },
  { icon: 'shield',       value: '469+', label: 'Automated tests',      color: '#F59E0B' },
] as const;

// ── How it works ─────────────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  { step: '01', title: 'Export from Jira',  description: 'Go to Jira → Backlog → Export → CSV or Excel. No API keys, no credentials, no plugins required.',                         icon: 'upload' },
  { step: '02', title: 'Upload in seconds', description: 'Drag and drop your file. Delivery Clarity detects the format, validates the data, and computes delivery metrics instantly.', icon: 'priorityHigh' },
  { step: '03', title: 'Act on insights',   description: 'See sprint health, blockers, team capacity, release confidence, and recommendations before your next standup.',             icon: 'target' },
] as const;

// ── Feature grid ─────────────────────────────────────────────────────────────

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

// ── Business value ───────────────────────────────────────────────────────────

const VALUE_PROPS = [
  { icon: 'chartTrendUp', title: 'See delivery confidence before sprint reviews',        description: 'Know where a sprint really stands — completion, carryover, and risk — before the meeting starts.' },
  { icon: 'people',       title: 'Compare teams without manual Excel work',              description: 'Side-by-side team health, workload, and blockers, computed automatically from your export.' },
  { icon: 'search',       title: 'Detect blockers, orphan work, and data-quality issues', description: 'Surface what is stuck, unlinked, or missing fields before it derails a release.' },
  { icon: 'share',        title: 'Share clean executive views with stakeholders',        description: 'A jargon-free summary you can print or share — no spreadsheet clean-up required.' },
] as const;

// ── Dashboard preview (CSS-only mock widgets) ───────────────────────────────

const PREVIEW_TILES = [
  { kind: 'ring',  label: 'Completion Rate',      value: '78%', ring: '78%',  color: '#22C55E' },
  { kind: 'value', label: 'Cycle Time',           value: '3.2d', sub: 'days per issue',    color: '#0891b2' },
  { kind: 'value', label: 'Blocked Items',        value: '4',   sub: 'need attention',     color: '#F87171' },
  { kind: 'pill',  label: 'Release Confidence',   value: 'Go',  color: '#22C55E' },
  { kind: 'bar',   label: 'Data Quality Score',   value: '94%', width: '94%', color: '#F59E0B' },
  { kind: 'bar',   label: 'Team Health Score',    value: '82%', width: '82%', color: '#FF8A4C' },
] as const;

// ── Components ────────────────────────────────────────────────────────────────

function FeatureCard({ icon, title, description, href, color, delay, revealed }: typeof FEATURES[number] & { delay: string; revealed: boolean }) {
  // DYNAMIC CSS VARIABLE: each feature has its own brand color and scroll-reveal
  // stagger delay from data.
  const variables: CSSVariableProperties = { '--feature-color': color, '--reveal-delay': delay };
  return (
    <a href={href} className={clsx(styles.featureCard, styles.reveal, { [styles.revealed]: revealed }, 'group')} style={variables}>
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

  const [statsRef, statsRevealed]     = useReveal<HTMLDivElement>();
  const [stepsRef, stepsRevealed]     = useReveal<HTMLDivElement>();
  const [featuresRef, featuresRevealed] = useReveal<HTMLDivElement>();
  const [valueRef, valueRevealed]     = useReveal<HTMLDivElement>();
  const [previewRef, previewRevealed] = useReveal<HTMLDivElement>();

  return (
    <AppShell showNav>
      <div className={styles.wrapper}>

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className={styles.hero}>
          <AnimatedDataBackground />
          <div className={styles.heroVignette} aria-hidden="true" />
          <div className={styles.heroFloats} aria-hidden="true">
            {HERO_FLOATS.map(f => {
              // DYNAMIC CSS VARIABLE: each floating card has its own accent color
              // and animation stagger delay from data.
              const variables: CSSVariableProperties = { '--float-color': f.color, '--float-delay': f.delay };
              return (
                <div key={f.label} className={clsx(styles.heroFloatCard, 'hidden lg:flex', f.className)} style={variables}>
                  <SvgIcon name={f.icon} size={14} className={styles.heroFloatIcon} />
                  {f.label}
                </div>
              );
            })}
          </div>
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
              From messy Jira boards to<br className="hidden sm:block" />
              <span className={styles.heroAccent}> measurable delivery confidence</span>
            </h1>
            <p className={clsx(styles.heroSubhead, 'text-lg leading-relaxed max-w-2xl mx-auto')}>
              Upload any Jira CSV or Excel export. Get sprint health, team comparison, risk signals,
              release readiness, and executive insights — without API keys or Jira credentials.
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

            {/* Compact dashboard glimpse — a small taste of the real thing */}
            <div className={styles.heroGlimpse}>
              {HERO_GLIMPSE.map(row => {
                // DYNAMIC CSS VARIABLE: bar width is a preview value per row.
                const variables: CSSVariableProperties = { '--glimpse-width': row.width };
                return (
                  <div key={row.label} className={styles.heroGlimpseRow}>
                    <span className={styles.heroGlimpseLabel}>{row.label}</span>
                    <span className={styles.heroGlimpseBarTrack}>
                      <span className={styles.heroGlimpseBarFill} style={variables} />
                    </span>
                    <span className={styles.heroGlimpseValue}>{row.value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Stats strip ──────────────────────────────────────────────────── */}
        <div ref={statsRef} className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
          {STATS.map((s, i) => {
            // DYNAMIC CSS VARIABLE: each stat has its own brand color and stagger delay.
            const variables: CSSVariableProperties = { '--stat-color': s.color, '--reveal-delay': `${i * 0.08}s` };
            return (
              <div
                key={s.label}
                className={clsx(styles.statCard, styles.reveal, { [styles.revealed]: statsRevealed })}
                style={variables}
              >
                <div className={styles.statIconWrap}>
                  <SvgIcon name={s.icon} size={16} />
                </div>
                <p className={styles.statValue}>{s.value}</p>
                <p className={styles.statLabel}>{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* ── How it works ─────────────────────────────────────────────────── */}
        <section className="mb-12">
          <h2 className={clsx(styles.sectionTitle, 'text-2xl font-black text-center mb-8')}>How it works</h2>
          <div ref={stepsRef} className={clsx(styles.stepsRow, 'grid grid-cols-1 sm:grid-cols-3 gap-6')}>
            {HOW_IT_WORKS.map((step, i) => {
              // DYNAMIC CSS VARIABLE: stagger delay per step, left to right.
              const variables: CSSVariableProperties = { '--reveal-delay': `${i * 0.15}s` };
              return (
                <div
                  key={step.step}
                  className={clsx(styles.stepCard, styles.reveal, { [styles.revealed]: stepsRevealed })}
                  style={variables}
                >
                  <SvgIcon name={step.icon} size={40} className={clsx(styles.stepIcon, 'mx-auto mb-3')} />
                  <div className={clsx(styles.stepBadge, 'chip c-acc')}>
                    STEP {step.step}
                  </div>
                  <h3 className={clsx(styles.stepTitle, 'text-sm font-black mb-2')}>{step.title}</h3>
                  <p className={styles.stepDesc}>{step.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Feature grid ─────────────────────────────────────────────────── */}
        <section className="mb-12">
          <h2 className={clsx(styles.sectionTitle, 'text-2xl font-black text-center mb-2')}>Everything in one place</h2>
          <p className={clsx(styles.sectionSubtitle, 'text-sm text-center mb-8')}>Click any feature to open it directly.</p>
          <div ref={featuresRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <FeatureCard
                key={f.title}
                {...f}
                delay={`${(i % 6) * 0.08}s`}
                revealed={featuresRevealed}
              />
            ))}
          </div>
        </section>

        {/* ── Business value ────────────────────────────────────────────────── */}
        <section className="mb-12">
          <h2 className={clsx(styles.sectionTitle, 'text-2xl font-black text-center mb-8')}>Turn Jira exports into delivery decisions</h2>
          <div ref={valueRef} className={styles.valueGrid}>
            {VALUE_PROPS.map((v, i) => {
              // DYNAMIC CSS VARIABLE: stagger delay per card.
              const variables: CSSVariableProperties = { '--reveal-delay': `${i * 0.1}s` };
              return (
                <div
                  key={v.title}
                  className={clsx(styles.valueCard, styles.reveal, { [styles.revealed]: valueRevealed })}
                  style={variables}
                >
                  <div className={styles.valueIconWrap}>
                    <SvgIcon name={v.icon} size={18} />
                  </div>
                  <h3 className={styles.valueTitle}>{v.title}</h3>
                  <p className={styles.valueDesc}>{v.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Dashboard preview ─────────────────────────────────────────────── */}
        <section className="mb-12">
          <h2 className={clsx(styles.sectionTitle, 'text-2xl font-black text-center mb-2')}>A preview of what you&apos;ll see</h2>
          <p className={clsx(styles.sectionSubtitle, 'text-sm text-center mb-8')}>Illustrative example — your real dashboard reflects your own export.</p>
          <div
            ref={previewRef}
            className={clsx(styles.previewPanel, styles.reveal, { [styles.revealed]: previewRevealed })}
          >
            <div className={styles.previewGrid}>
              {PREVIEW_TILES.map(t => {
                // DYNAMIC CSS VARIABLE: each mock widget's fill color/width/ring
                // comes from illustrative sample data.
                const variables: CSSVariableProperties = {
                  '--preview-color': t.color,
                  ...(t.kind === 'bar'  ? { '--preview-width': t.width } : {}),
                  ...(t.kind === 'ring' ? { '--preview-ring': t.ring }   : {}),
                };
                return (
                  <div key={t.label} className={styles.previewTile} style={variables}>
                    <p className={styles.previewTileLabel}>{t.label}</p>
                    {t.kind === 'ring' && (
                      <div className={styles.previewRing}>
                        <span className={styles.previewRingInner}>{t.value}</span>
                      </div>
                    )}
                    {t.kind === 'value' && (
                      <>
                        <p className={styles.previewTileValue}>{t.value}</p>
                        <p className={styles.previewTileLabel}>{t.sub}</p>
                      </>
                    )}
                    {t.kind === 'pill' && (
                      <span className={styles.previewPill}>
                        <SvgIcon name="checkCircle" size={12} />
                        {t.value}
                      </span>
                    )}
                    {t.kind === 'bar' && (
                      <>
                        <p className={styles.previewTileValue}>{t.value}</p>
                        <span className={styles.previewBarTrack}>
                          <span className={styles.previewBarFill} />
                        </span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── CTA footer ───────────────────────────────────────────────────── */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaIconWrap}>
            <SvgIcon name="priorityHigh" size={28} />
          </div>
          <h2 className={clsx(styles.ctaTitle, 'text-2xl font-black mb-2')}>Ready to see what your Jira export is really telling you?</h2>
          <p className={clsx(styles.ctaDesc, 'text-sm mb-6 max-w-md mx-auto')}>
            Upload your Jira export or try the sample dataset. No account setup required for the dashboard.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => router.push('/')} className="btn-primary px-7 py-3 text-sm">
              Upload Jira Export →
            </button>
            <button type="button" onClick={() => router.push('/?sample=1')} className={clsx(styles.btnOutline, 'px-7 py-3 text-sm')}>
              Try Sample Dataset
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
