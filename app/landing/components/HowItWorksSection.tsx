// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
'use client';

import { useRef } from 'react';
import clsx from 'clsx';
import gsap from 'gsap';
import { SvgIcon } from '@/components/ui/SvgIcon';
import { useGsapContext } from '../hooks/useGsapContext';
import type { CSSVariableProperties } from '../lib/cssVars';
import styles from './HowItWorksSection.module.scss';

const INSIGHTS = [
  { label: 'Health Score',       value: '86%', color: '#22c55e' },
  { label: 'Risks Detected',     value: '8',   color: '#f97316' },
  { label: 'Release Confidence', value: '78%', color: '#2563eb' },
] as const;

const ACTIVE_SHADOW = '0 16px 32px rgba(37,99,235,0.14)';
const RESTING_SHADOW = '0 4px 16px rgba(15,23,42,0.06)';

export default function HowItWorksSection() {
  const sectionRef  = useRef<HTMLElement>(null);
  const card1Ref     = useRef<HTMLDivElement>(null);
  const card2Ref     = useRef<HTMLDivElement>(null);
  const card3Ref     = useRef<HTMLDivElement>(null);
  const filesRef     = useRef<HTMLDivElement>(null);
  const progressRef  = useRef<HTMLDivElement>(null);
  const insightsRef  = useRef<HTMLDivElement>(null);

  useGsapContext(sectionRef, () => {
    const activate = { scale: 1.03, y: -4, boxShadow: ACTIVE_SHADOW, borderColor: '#93c5fd' };
    const rest     = { scale: 1, y: 0, boxShadow: RESTING_SHADOW, borderColor: '#e2e8f0' };

    // A spotlight moves left-to-right across the 3 steps: reveal, then each
    // card activates (lifts + glows) in turn while its own mini-visual plays
    // (files bounce → progress bar fills → insight rows check in), settling
    // back to resting state before the next step takes focus. Replays every
    // time the section is scrolled into view, in either direction — no
    // pin/scrub, matching /promo's simpler reveal pattern.
    gsap.timeline({
      defaults: { ease: 'power2.inOut', duration: 0.4 },
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 75%',
        toggleActions: 'restart none restart none',
      },
    })
      .from([card1Ref.current, card2Ref.current, card3Ref.current], { opacity: 0, y: 24, duration: 0.5, stagger: 0.15 }, 0)
      .to(card1Ref.current, activate, 0.6)
      .to(filesRef.current?.children ?? [], { y: -8, stagger: 0.1, yoyo: true, repeat: 1 }, 0.7)
      .to(card1Ref.current, rest, 1.1)
      .to(card2Ref.current, activate, 1.1)
      .to(progressRef.current, { width: '100%', duration: 0.4 }, 1.2)
      .to(card2Ref.current, rest, 1.7)
      .to(card3Ref.current, activate, 1.7)
      .from(insightsRef.current?.children ?? [], { opacity: 0, x: 12, stagger: 0.1 }, 1.8);
  });

  return (
    <section ref={sectionRef} id="how-it-works" className={styles.section}>
      <h2 id="tour-section-landing-2" className={clsx(styles.title, 'text-2xl sm:text-3xl font-black')}>How it works</h2>

      <div className={styles.grid}>
        <SvgIcon name="arrowRight" size={20} className={clsx(styles.arrow, styles.arrow1)} aria-hidden="true" />
        <SvgIcon name="arrowRight" size={20} className={clsx(styles.arrow, styles.arrow2)} aria-hidden="true" />

        <div ref={card1Ref} className={styles.card}>
          <p className={styles.number}>01</p>
          <h3 className={styles.cardTitle}>Export from Jira</h3>
          <p className={styles.cardText}>Go to Jira → Backlog → Export → CSV or Excel. No API keys, no credentials, no plugins required.</p>
          <div className={styles.visual}>
            <div ref={filesRef} className={styles.filesRow}>
              <span className={styles.fileChip}><SvgIcon name="file" size={12} />CSV</span>
              <span className={styles.fileChip}><SvgIcon name="file" size={12} />XLSX</span>
            </div>
          </div>
        </div>

        <div ref={card2Ref} className={styles.card}>
          <p className={styles.number}>02</p>
          <h3 className={styles.cardTitle}>Upload in seconds</h3>
          <p className={styles.cardText}>Drag and drop your file. Delivery Clarity detects the format, validates the data, and computes delivery metrics instantly.</p>
          <div className={styles.visual}>
            <div className={styles.uploadBox}>
              <SvgIcon name="cloudUpload" size={22} className={styles.uploadIcon} />
              <span className={styles.progressTrack}>
                <span ref={progressRef} className={styles.progressFill} />
              </span>
            </div>
          </div>
        </div>

        <div ref={card3Ref} className={styles.card}>
          <p className={styles.number}>03</p>
          <h3 className={styles.cardTitle}>Act on insights</h3>
          <p className={styles.cardText}>See sprint health, blockers, team capacity, release confidence, and recommendations before your next standup.</p>
          <div className={styles.visual}>
            <div ref={insightsRef}>
              {INSIGHTS.map(row => {
                // DYNAMIC CSS VARIABLE: each insight row's value color comes from data.
                const variables: CSSVariableProperties = { '--insight-color': row.color };
                return (
                  <p key={row.label} className={styles.insightRow} style={variables}>
                    <span>{row.label}</span>
                    <span className={styles.insightValue}>{row.value}</span>
                  </p>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
