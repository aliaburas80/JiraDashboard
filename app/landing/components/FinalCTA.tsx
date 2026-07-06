// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { useGsapContext } from '../hooks/useGsapContext';
import styles from './FinalCTA.module.scss';

export default function FinalCTA() {
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef     = useRef<HTMLDivElement>(null);
  const actionsRef  = useRef<HTMLDivElement>(null);

  useGsapContext(sectionRef, () => {
    gsap.from(cardRef.current, {
      opacity: 0,
      y: 30,
      duration: 0.6,
      scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' },
    });
    gsap.from(actionsRef.current?.children ?? [], {
      opacity: 0,
      y: 16,
      duration: 0.4,
      stagger: 0.1,
      scrollTrigger: { trigger: sectionRef.current, start: 'top 65%' },
    });
  });

  return (
    <section ref={sectionRef} id="final-cta" className={styles.section}>
      <div className={styles.wrap}>
        <div ref={cardRef} className={styles.card}>
          <h2 className={styles.title}>Ready to see what your Jira export is really telling you?</h2>
          <p className={styles.desc}>
            Upload your Jira export or try the sample dataset. No Jira credentials, no API keys, no plugins.
          </p>

          <div ref={actionsRef} className={styles.actions}>
            <button type="button" onClick={() => router.push('/')} className={styles.btnPrimary}>
              Upload Jira Export
            </button>
            {/* Sample-dataset action: home page auto-loads the sample when this query param is present */}
            <button type="button" onClick={() => router.push('/?sample=1')} className={styles.btnOutline}>
              Try Sample Dataset
            </button>
            <a href="/developer" className={styles.btnOutline}>
              Developer Portal
            </a>
          </div>

          <p className={styles.footerNote}>
            Delivery Clarity v4.1 · © 2026 Ali Abu Ras · ali.aburas@deliveryclarity.app
          </p>
        </div>
      </div>
    </section>
  );
}
