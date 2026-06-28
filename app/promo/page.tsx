// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Public marketing page (/promo) — a standalone, animated product showcase
// distinct from the in-app dashboard look. Server-rendered for SEO; only the
// motion/interaction pieces (PromoNav, Reveal, CountUp) are client components,
// keeping the client boundary small (CLAUDE.md §4.4). Not behind auth — it is
// intentionally absent from middleware.ts's matcher so it is publicly shareable.

import type { Metadata } from 'next';
import PromoNav from './PromoNav';
import Reveal from './Reveal';
import CountUp from './CountUp';
import Marquee from './Marquee';
import DemoRequest from './DemoRequest';
import styles from './page.module.scss';

export const metadata: Metadata = {
  title: 'Delivery Clarity — See delivery clearly',
  description:
    'Turn any Jira CSV or Excel export into sprint health, flow efficiency, forecasting, and role-based coaching — in seconds. Zero credentials, private, self-hosted.',
  alternates: { canonical: '/promo' },
  openGraph: {
    title: 'Delivery Clarity — See delivery clearly',
    description:
      'From messy boards to measurable delivery confidence. Zero-credential Jira analytics, forecasting, coaching, and retrospective intelligence in one private workspace.',
    type: 'website',
  },
};

const CAPABILITIES = [
  {
    name: 'Sprint Throughput',
    body: 'Committed vs. completed, carryover, goal outcomes, and the mid-sprint patterns that decide whether you finish.',
  },
  {
    name: 'Flow Health',
    body: 'Cycle time, lead time, work-in-progress, and exactly where work stalls between "started" and "done".',
  },
  {
    name: 'Delivery Forecasting',
    body: 'A velocity-based outlook on when you will finish — with confidence that honestly reflects your data quality.',
  },
  {
    name: 'Role-Based Coaching',
    body: 'Evidence-cited guidance written for the reader — Scrum Master, Product Owner, manager, or C-level.',
  },
  {
    name: 'Release Readiness',
    body: 'Go, Conditional-Go, or No-Go verdicts per version, against a clear checklist of completion, blockers, and defects.',
  },
  {
    name: 'Retrospective Intelligence',
    body: 'Themes, blockers that keep coming back, and concrete, copy-ready stories for your next sprint.',
  },
] as const;

const STEPS = [
  {
    no: '01',
    title: 'Export from Jira',
    body: 'Backlog → Export → CSV or Excel. No API keys, no plugins, no admin permission to request.',
  },
  {
    no: '02',
    title: 'Upload in seconds',
    body: 'Drag and drop. Columns are detected automatically and every metric is computed on the spot.',
  },
  {
    no: '03',
    title: 'Act on what matters',
    body: 'Health, risks, capacity, forecasts, and coaching — ready before your next standup.',
  },
] as const;

const STATS = [
  { value: 28, prefix: '', suffix: '+', label: 'Delivery metrics calculated' },
  { value: 17, prefix: '', suffix: '', label: 'Excel report sheets' },
  { value: 5, prefix: '<', suffix: 's', label: 'From upload to insight' },
  { value: 736, prefix: '', suffix: '+', label: 'Automated tests' },
] as const;

const ASSURANCES = [
  {
    title: 'Zero credentials',
    body: 'No Jira login, no OAuth, no stored tokens. You upload a file — nothing connects back to your tracker.',
  },
  {
    title: 'Private by default',
    body: 'Self-hosted on your own Node.js server. Your delivery data is never sent to a third-party analytics service.',
  },
  {
    title: 'Yours to delete',
    body: 'Every upload is yours. Remove a dataset whenever you want — clarity should never cost you control.',
  },
] as const;

export default function PromoPage() {
  return (
    <div className={styles.page} id="top">
      <PromoNav />

      <main>
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className={styles.hero}>
          <div className={styles.heroMesh} aria-hidden="true" />
          <div className={styles.heroGrain} aria-hidden="true" />

          <div className={styles.heroInner}>
            <p className={styles.eyebrow}>
              <span className={styles.eyebrowDot} aria-hidden="true" />
              Delivery intelligence from the data you already have
            </p>

            <h1 className={styles.heroTitle}>
              <span className={styles.heroLine}>
                <span className={styles.heroLineInner}>See delivery</span>
              </span>
              <span className={styles.heroLine}>
                <span className={`${styles.heroLineInner} ${styles.heroAccent}`}>clearly.</span>
              </span>
            </h1>

            <p className={styles.heroSub}>
              Turn any Jira CSV or Excel export into sprint health, flow efficiency, risk signals,
              forecasting, and role-based coaching — in seconds. No credentials. No setup.
              Nothing leaves your workspace.
            </p>

            <div className={styles.heroActions}>
              <DemoRequest label="Request a demo" triggerClassName={styles.btnPrimary} />
              <a className={styles.btnGhost} href="/login">
                Open the app <span aria-hidden="true">→</span>
              </a>
            </div>

            <div className={styles.heroCard} aria-hidden="true">
              <div className={styles.heroCardGlow} />
              <div className={styles.heroCardHead}>
                <span className={styles.heroCardDot} />
                Delivery overview
                <span className={styles.heroCardLive}>
                  <span className={styles.heroCardLiveDot} />
                  Live
                </span>
              </div>
              <div className={styles.heroCardBody}>
                <div className={styles.heroRing}>
                  <svg className={styles.heroRingSvg} viewBox="0 0 120 120">
                    <defs>
                      <linearGradient id="heroRingGradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#ff8a4c" />
                        <stop offset="100%" stopColor="#8b7bff" />
                      </linearGradient>
                    </defs>
                    <circle className={styles.heroRingTrack} cx="60" cy="60" r="52" />
                    <circle className={styles.heroRingFill} cx="60" cy="60" r="52" />
                  </svg>
                  <div className={styles.heroRingInner}>
                    <span className={styles.heroRingValue}>82</span>
                    <span className={styles.heroRingLabel}>Health</span>
                  </div>
                </div>
                <div className={styles.heroMetrics}>
                  <div className={styles.heroMetric} data-tone="risk">
                    <span className={styles.heroMetricValue}>12</span>
                    <span className={styles.heroMetricLabel}>At risk</span>
                  </div>
                  <div className={styles.heroMetric} data-tone="flow">
                    <span className={styles.heroMetricValue}>6.2</span>
                    <span className={styles.heroMetricLabel}>Avg cycle time</span>
                  </div>
                  <div className={styles.heroMetric} data-tone="done">
                    <span className={styles.heroMetricValue}>94%</span>
                    <span className={styles.heroMetricLabel}>Done this sprint</span>
                  </div>
                </div>
                <div className={styles.heroBars}>
                  <span data-tone="a" />
                  <span data-tone="b" />
                  <span data-tone="c" />
                  <span data-tone="d" />
                  <span data-tone="e" />
                </div>
              </div>
            </div>
          </div>

          <span className={styles.scrollCue} aria-hidden="true">
            <span className={styles.scrollCueLine} />
            Scroll
          </span>
        </section>

        {/* ── Capability marquee ───────────────────────────────────────── */}
        <Marquee
          items={[
            'Sprint throughput',
            'Flow health',
            'Forecasting',
            'Role-based coaching',
            'Release readiness',
            'Retrospectives',
            'Team capacity',
            'Data quality',
          ]}
        />

        {/* ── Why ──────────────────────────────────────────────────────── */}
        <section className={styles.section} id="why">
          <div className={styles.sectionInner}>
            <Reveal as="p" className={styles.kicker}>
              The problem
            </Reveal>
            <Reveal as="p" className={styles.statement} delayMs={80}>
              Stop rebuilding the same delivery report{' '}
              <span className={styles.statementMuted}>every single week.</span>
            </Reveal>
            <Reveal as="p" className={styles.lede} delayMs={160}>
              Managers and Scrum Masters lose 30–60 minutes before every review exporting data,
              wrangling spreadsheets, and writing the narrative by hand. Delivery Clarity does that
              work the moment you upload — consistently, for every team.
            </Reveal>
          </div>
        </section>

        {/* ── Capabilities ─────────────────────────────────────────────── */}
        <section className={styles.section} id="capabilities">
          <div className={styles.sectionInner}>
            <Reveal as="p" className={styles.kicker}>
              What you get
            </Reveal>
            <Reveal as="header" className={styles.sectionHead} delayMs={80}>
              <h2 className={styles.sectionTitle}>The signals that matter, already organized.</h2>
              <p className={styles.sectionDesc}>
                One upload becomes a full delivery picture — not a folder of charts you still have to
                interpret.
              </p>
            </Reveal>

            <div className={styles.grid}>
              {CAPABILITIES.map((cap, i) => (
                <Reveal key={cap.name} className={styles.card} delayMs={(i % 3) * 110}>
                  <span className={styles.cardIndex}>{String(i + 1).padStart(2, '0')}</span>
                  <h3 className={styles.cardTitle}>{cap.name}</h3>
                  <p className={styles.cardBody}>{cap.body}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Go deeper ────────────────────────────────────────────────── */}
        <section className={styles.sectionAlt}>
          <div className={styles.splitInner}>
            <Reveal className={styles.splitText} variant="left">
              <p className={styles.kicker}>Beyond the numbers</p>
              <h2 className={styles.sectionTitle}>Go deeper than dashboards.</h2>
              <p className={styles.sectionDesc}>
                Most tools stop at showing you what happened. Delivery Clarity tells you what to do
                about it — forecasting where you will land, diagnosing the single weakest factor, and
                coaching each role with evidence pulled straight from your own data.
              </p>
              <a className={styles.btnGhost} href="/login">
                Explore delivery insights <span aria-hidden="true">→</span>
              </a>
            </Reveal>

            <Reveal className={styles.splitPanel} variant="right" delayMs={120}>
              <ul className={styles.insightList}>
                <li>
                  <span className={styles.insightTag} data-tone="risk">Forecast</span>
                  At 6 sprints × 5 items you complete 30 of 46 remaining — scope is the constraint.
                </li>
                <li>
                  <span className={styles.insightTag} data-tone="coach">Coaching</span>
                  3 action items have no owner — assign them before the sprint starts.
                </li>
                <li>
                  <span className={styles.insightTag} data-tone="watch">Retro</span>
                  &ldquo;Infra dependency&rdquo; blocked work in 3 of the last 4 sprints — time-box a fix.
                </li>
              </ul>
            </Reveal>
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────────────────── */}
        <section className={styles.section} id="how">
          <div className={styles.sectionInner}>
            <Reveal as="p" className={styles.kicker}>
              How it works
            </Reveal>
            <Reveal as="header" className={styles.sectionHead} delayMs={80}>
              <h2 className={styles.sectionTitle}>From Jira export to clarity in three steps.</h2>
            </Reveal>

            <ol className={styles.steps}>
              {STEPS.map((step, i) => (
                <Reveal key={step.no} as="li" className={styles.step} delayMs={i * 120}>
                  <span className={styles.stepNo}>{step.no}</span>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepBody}>{step.body}</p>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Stats ────────────────────────────────────────────────────── */}
        <section className={styles.statsBand}>
          <div className={styles.statsInner}>
            {STATS.map((stat) => (
              <Reveal key={stat.label} className={styles.stat}>
                <span className={styles.statValue}>
                  <CountUp value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                </span>
                <span className={styles.statLabel}>{stat.label}</span>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Security ─────────────────────────────────────────────────── */}
        <section className={styles.section} id="security">
          <div className={styles.sectionInner}>
            <Reveal as="p" className={styles.kicker}>
              Trust
            </Reveal>
            <Reveal as="header" className={styles.sectionHead} delayMs={80}>
              <h2 className={styles.sectionTitle}>Your delivery data stays yours.</h2>
              <p className={styles.sectionDesc}>
                Clarity should never mean handing your project data to someone else.
              </p>
            </Reveal>

            <div className={styles.assurances}>
              {ASSURANCES.map((item, i) => (
                <Reveal key={item.title} className={styles.assurance} delayMs={i * 110}>
                  <span className={styles.assuranceMark} aria-hidden="true" />
                  <h3 className={styles.assuranceTitle}>{item.title}</h3>
                  <p className={styles.assuranceBody}>{item.body}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ────────────────────────────────────────────────── */}
        <section className={styles.cta}>
          <div className={styles.ctaMesh} aria-hidden="true" />
          <Reveal className={styles.ctaInner} variant="scale">
            <h2 className={styles.ctaTitle}>Make delivery easier to understand.</h2>
            <p className={styles.ctaSub}>
              From messy boards to measurable delivery confidence — starting with your next upload.
            </p>
            <div className={styles.heroActions}>
              <DemoRequest label="Request a demo" triggerClassName={styles.btnPrimary} />
              <a className={styles.btnGhost} href="/login">
                Open the app <span aria-hidden="true">→</span>
              </a>
            </div>
          </Reveal>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span className={styles.footerBrand}>
            <span className={styles.footerMark} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </span>
            Delivery Clarity
          </span>
          <p className={styles.footerTag}>From messy boards to measurable delivery confidence.</p>
          <small className={styles.footerCopy}>© 2026 Ali Abu Ras · aliaburas80@gmail.com</small>
        </div>
      </footer>
    </div>
  );
}
