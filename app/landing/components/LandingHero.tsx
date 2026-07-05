// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SvgIcon } from '@/components/ui/SvgIcon';
import { AnimatedDataBackground } from '@/components/ui/AnimatedDataBackground';
import { useGsapContext } from '../hooks/useGsapContext';
import type { CSSVariableProperties } from '../lib/cssVars';
import styles from './LandingHero.module.scss';

const TRUST_CHIPS = ['No API keys', 'No Jira credentials', 'No plugins'] as const;

const FLOATS = [
  { label: 'Sprint Health',     value: '86%', color: '#22c55e', className: 'top-[14%] left-[2%]',    delay: '0s' },
  { label: 'Release Readiness', value: 'Go',  color: '#38bdf8', className: 'top-[6%] left-[38%]',     delay: '0.7s' },
  { label: 'Data Quality',      value: '92%', color: '#a78bfa', className: 'top-[46%] left-[42%]',    delay: '1.4s' },
  { label: 'Risk Signals',      value: '8',   color: '#f97316', className: 'top-[10%] right-[2%]',    delay: '2.1s' },
  { label: 'Team Capacity',     value: '74%', color: '#38bdf8', className: 'bottom-[10%] left-[6%]',  delay: '2.8s' },
] as const;

const SPARKLINE_POINTS = '0,32 16,26 32,28 48,18 64,20 80,10 96,14 112,4';
const BARS = [40, 65, 50, 80, 60, 90, 70];

const MOCKUP_KPIS = [
  { label: 'Commitment',         value: '86%',     color: '#22c55e' },
  { label: 'Cycle Time',         value: '4.2 days', color: '#38bdf8' },
  { label: 'Blocked Items',      value: '23',      color: '#f97316' },
  { label: 'Release Confidence', value: '78%',     color: '#22c55e' },
] as const;

export default function LandingHero() {
  const router = useRouter();
  const heroRef    = useRef<HTMLElement>(null);
  const badgeRef   = useRef<HTMLDivElement>(null);
  const line1Ref   = useRef<HTMLSpanElement>(null);
  const line2Ref   = useRef<HTMLSpanElement>(null);
  const subheadRef = useRef<HTMLParagraphElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const chipsRef   = useRef<HTMLDivElement>(null);
  const mockupRef  = useRef<HTMLDivElement>(null);
  const copyRef    = useRef<HTMLDivElement>(null);

  useGsapContext(heroRef, () => {
    // ── Entrance timeline ────────────────────────────────────────────────
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from(badgeRef.current, { opacity: 0, y: -12, duration: 0.5 })
      .from(line1Ref.current, { opacity: 0, y: 24, duration: 0.6 }, '-=0.2')
      .from(line2Ref.current, { opacity: 0, y: 24, duration: 0.6 }, '-=0.4')
      .from(subheadRef.current, { opacity: 0, y: 16, duration: 0.5 }, '-=0.3')
      .from(actionsRef.current?.children ?? [], { opacity: 0, y: 16, duration: 0.4, stagger: 0.1 }, '-=0.2')
      .from(chipsRef.current?.children ?? [], { opacity: 0, y: 10, duration: 0.35, stagger: 0.12 }, '-=0.15')
      .from(mockupRef.current, { opacity: 0, x: 60, filter: 'blur(16px)', duration: 0.8 }, '-=0.6')
      .from('[data-float]', { opacity: 0, y: 20, duration: 0.5, stagger: 0.12 }, '-=0.5');

    // ── Scroll-scrubbed exit as the hero leaves the viewport ────────────────
    ScrollTrigger.create({
      trigger: heroRef.current,
      start: 'top top',
      end: 'bottom top',
      scrub: true,
      animation: gsap.timeline()
        .to(copyRef.current, { opacity: 0.15, y: -40 }, 0)
        .to(mockupRef.current, { opacity: 0.2, scale: 0.94 }, 0),
    });
  });

  return (
    <section ref={heroRef} id="landing-hero" className={styles.hero}>
      <AnimatedDataBackground />

      <div className={styles.floats} aria-hidden="true">
        {FLOATS.map(f => {
          // DYNAMIC CSS VARIABLE: each floating card has its own accent color
          // and ambient-drift animation delay from data.
          const variables: CSSVariableProperties = { '--float-color': f.color, '--float-delay': f.delay };
          return (
            <div key={f.label} data-float className={clsx(styles.floatCard, f.className)} style={variables}>
              <span className={styles.floatLabel}>{f.label}</span>
              <span className={styles.floatValue}>{f.value}</span>
            </div>
          );
        })}
      </div>

      <div className={styles.inner}>
        <div ref={copyRef} className={styles.copy}>
          <div ref={badgeRef} className={styles.badge}>
            <SvgIcon name="priorityHigh" size={12} />
            Zero-credential Jira Intelligence
          </div>

          <h1 className={clsx(styles.title, 'text-4xl sm:text-5xl leading-tight')}>
            <span ref={line1Ref} className="block">From messy Jira boards to</span>
            {/* Animating opacity/transform on a wrapper (not the gradient-clip
                span itself) avoids a rendering artifact some browsers show
                when a background-clip:text element's own inline style is
                actively tweened mid-transition. */}
            <span ref={line2Ref} className="block">
              <span className={styles.highlight}>measurable delivery confidence</span>
            </span>
          </h1>

          <p ref={subheadRef} className={clsx(styles.subhead, 'text-lg leading-relaxed')}>
            Upload any Jira CSV or Excel export. Get sprint health, team comparison, risk signals,
            release readiness, and executive insights — without API keys or Jira credentials.
          </p>

          <div ref={actionsRef} className={styles.actions}>
            <button type="button" onClick={() => router.push('/')} className="btn-primary px-7 py-3 text-sm">
              <SvgIcon name="upload" size={16} />
              Upload Jira Export
            </button>
            <button type="button" onClick={() => router.push('/dashboard')} className={clsx(styles.btnSecondary, 'px-7 py-3 text-sm')}>
              <SvgIcon name="dashboard" size={16} />
              Open Dashboard
            </button>
          </div>

          <div ref={chipsRef} className={styles.trustChips}>
            {TRUST_CHIPS.map(chip => (
              <span key={chip} className={styles.trustChip}>
                <SvgIcon name="checkCircle" size={13} />
                {chip}
              </span>
            ))}
          </div>
        </div>

        <div ref={mockupRef} className={styles.mockupWrap}>
          <div className={styles.mockup}>
            <p className={styles.mockupTitle}>
              <SvgIcon name="dashboard" size={14} />
              Delivery Clarity Dashboard
            </p>

            <div className={styles.mockupKpiGrid}>
              {MOCKUP_KPIS.map(kpi => {
                // DYNAMIC CSS VARIABLE: each KPI's value color comes from data.
                const variables: CSSVariableProperties = { '--kpi-color': kpi.color };
                return (
                  <div key={kpi.label} className={styles.mockupKpi}>
                    <p className={styles.mockupKpiLabel}>{kpi.label}</p>
                    <p className={styles.mockupKpiValue} style={variables}>{kpi.value}</p>
                  </div>
                );
              })}
            </div>

            <div className={styles.mockupChartsGrid}>
              <div className={styles.mockupChartCard}>
                <p className={styles.mockupChartLabel}>Sprint Progress</p>
                <svg viewBox="0 0 112 40" className={styles.sparkline} preserveAspectRatio="none">
                  <polyline points={SPARKLINE_POINTS} className={styles.sparklinePath} />
                </svg>
              </div>
              <div className={styles.mockupChartCard}>
                <p className={styles.mockupChartLabel}>Work Item Flow</p>
                <div className={styles.barsRow}>
                  {BARS.map((h, i) => {
                    // DYNAMIC CSS VARIABLE: each bar's height is a data value.
                    const variables: CSSVariableProperties = { '--bar-height': `${h}%` };
                    return <span key={i} className={styles.bar} style={variables} />;
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
