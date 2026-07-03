'use client';
// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// EP-014 / EP-I18N-01: Privacy Policy — 7 languages, animated background, PDF download.

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AnimatedDataBackground } from '@/components/ui/AnimatedDataBackground';
import { LanguageSwitcher } from '@/components/legal/LanguageSwitcher';
import { DownloadPdfButton } from '@/components/legal/DownloadPdfButton';
import { translations, LANGUAGES, DEFAULT_LANG, type LangCode } from '@/lib/legal-i18n';
import styles from './page.module.scss';

const EFFECTIVE_DATE = '3 July 2026';
const VERSION        = 'v1';
const CONTACT_EMAIL  = 'aliaburas80@gmail.com';

function PrivacyContent() {
  const params  = useSearchParams();
  const rawLang = params.get('lang') ?? DEFAULT_LANG;
  const lang    = (rawLang in LANGUAGES ? rawLang : DEFAULT_LANG) as LangCode;
  const t       = translations[lang];
  const dir     = LANGUAGES[lang].dir;
  const isEn    = lang === 'en';

  return (
    <div className={styles.page} dir={dir}>
      <AnimatedDataBackground className={`${styles.bg} ${styles.bgDim}`} />

      <div className={styles.inner}>
        {/* Actions bar */}
        <div className={styles.pageActions}>
          <Link href="/register" className={styles.back}>{t.ui.backToRegister}</Link>
          <div className={styles.actionButtons}>
            <LanguageSwitcher current={lang} selectLabel={t.ui.selectLanguage} />
            <DownloadPdfButton label={t.ui.downloadPdf} />
          </div>
        </div>

        {!isEn && t.ui.autoTranslationWarning && (
          <div className={styles.translationBanner} role="note">
            {t.ui.autoTranslationWarning}
          </div>
        )}

        <p className={styles.badge}>{t.privacy.badge} {VERSION}</p>
        <h1 className={styles.title}>{t.privacy.title}</h1>
        <p className={styles.meta}>
          {t.ui.effectiveDate}: {EFFECTIVE_DATE} · {t.ui.version} {VERSION}<br />
          Controller: Ali Abu Ras · <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>

        <div className={styles.section}>
          <div className={styles.body}><p>{t.privacy.description}</p></div>
        </div>
        <div className={styles.divider} />

        {/* Section 1 */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t.privacy.sections[0].title}</h2>
          <div className={styles.body}>
            <ul>
              <li><strong>Name:</strong> Ali Abu Ras</li>
              <li><strong>Operating as:</strong> Delivery Clarity</li>
              <li><strong>Email:</strong> <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></li>
              <li><strong>Country of establishment:</strong> United Kingdom</li>
            </ul>
          </div>
        </div>
        <div className={styles.divider} />

        {/* Section 2 */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t.privacy.sections[1].title}</h2>
          <div className={styles.body}>
            <p><strong>Account and registration data</strong></p>
            <ul><li>Full name and email address</li><li>Hashed password (never stored in plaintext)</li><li>Professional persona selected at signup</li><li>Date and version of Terms and Privacy Policy acceptance</li><li>Email verification status and login timestamps</li></ul>
            <p><em>Lawful basis:</em> Performance of a contract.</p>
            <p><strong>Jira export data you upload</strong></p>
            <ul><li>CSV or Excel files processed in your private workspace</li><li>Issue keys, types, statuses, date fields, story points, sprints, assignees</li><li>Derived metrics: lead time, cycle time, throughput, velocity, flow scores</li><li>File metadata: name, size, type, row count, upload timestamp, health score</li></ul>
            <p><em>Lawful basis:</em> Performance of a contract.</p>
            <p><strong>Your Jira data is never used for any purpose other than generating your private analytics reports.</strong> It is never included in error logs, feedback reports, analytics telemetry, AI training, or any external communication.</p>
            <p><strong>Security and usage data</strong></p>
            <ul><li>IP address — used for rate limiting and security; not stored permanently</li><li>Login/logout timestamps, audit events, login attempt records (pruned after 1 hour)</li><li>User agent / browser family</li></ul>
            <p><em>Lawful basis:</em> Legitimate interests (protecting the Service from abuse).</p>
            <p><strong>Data we do NOT collect:</strong></p>
            <ul><li>No payment card data</li><li>No advertising cookies or tracking pixels</li><li>No data from children under 18</li><li>No session replay or heatmap data</li><li>No Jira data sent to any AI or analytics service</li></ul>
          </div>
        </div>
        <div className={styles.divider} />

        {/* Sections 3–13 */}
        {[
          { idx: 2, content: <p>We do not make any automated decisions that produce legal or similarly significant effects about you personally. The metrics and scores generated by the Service are analytical outputs applied to project data — not decisions about individuals.</p> },
          { idx: 3, content: <><p>We do not sell, rent, or trade your personal data. We share data only in limited circumstances:</p><p><strong>Infrastructure sub-processors:</strong> Render (hosting, USA), Neon (database, USA East), Resend/SMTP (transactional email, USA), AWS S3 (optional cloud backup). All are bound by contractual obligations restricting their use of your data.</p><p><strong>Legal requirements:</strong> We may disclose data if required by law, court order, or regulatory authority.</p><p><strong>Business transfers:</strong> In the event of a merger or acquisition, your data may transfer. We will notify you beforehand.</p></> },
          { idx: 4, content: <><p>Our primary infrastructure is located in the United States. Transfers of personal data from the UK or EEA to the USA are made in reliance on Standard Contractual Clauses (SCCs) or the UK International Data Transfer Agreement (IDTA) framework where applicable.</p><p>You may request details of the specific transfer mechanisms by contacting <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p></> },
          { idx: 5, content: <ul><li><strong>Account data:</strong> Retained while active; deleted within 30 days of confirmed account deletion.</li><li><strong>Jira import data and metrics:</strong> Retained until deleted by you or upon account deletion.</li><li><strong>Audit events:</strong> 12 months.</li><li><strong>Error records:</strong> 90 days.</li><li><strong>Login attempt records:</strong> 1 hour.</li><li><strong>Consent records:</strong> Lifetime of account plus 6 years for legal compliance.</li></ul> },
          { idx: 6, content: <><p>We use a single first-party session cookie:</p><ul><li><strong>Name:</strong> <code>dc_session</code></li><li><strong>Purpose:</strong> Maintains your authenticated login state</li><li><strong>Type:</strong> Strictly necessary</li><li><strong>Attributes:</strong> HttpOnly, Secure (HTTPS only), SameSite=Strict</li><li><strong>Expiry:</strong> Session</li></ul><p>No analytics, advertising, or third-party cookies are set.</p></> },
          { idx: 7, content: <ul><li>Passwords hashed using bcrypt with a minimum work factor of 12</li><li>All data in transit encrypted using TLS 1.2 or higher (HTTPS enforced)</li><li>Session cookies are HttpOnly, Secure, and SameSite=Strict</li><li>Stored Jira API credentials encrypted using AES-256-GCM</li><li>Rate limiting on all authentication and data submission endpoints</li><li>All data queries scoped to the authenticated user&rsquo;s workspace</li><li>Audit logging of all sensitive account and data actions</li><li><strong>In the event of a data breach likely to result in a risk to your rights, we will notify the ICO within 72 hours and affected users without undue delay.</strong></li></ul> },
          { idx: 8, content: <><p>The Service is not directed at anyone under the age of 18. We do not knowingly collect personal data from children under 18. If we become aware we have done so, we will delete it promptly. Contact us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> if you believe a child has provided us data.</p></> },
          { idx: 9, content: <><p>Under the UK GDPR and applicable law, you have the right to: access your data (Article 15); rectification (Article 16); erasure (Article 17); restriction of processing (Article 18); data portability (Article 20); object to processing (Article 21); withdraw consent; and not be subject to automated decision-making (Article 22).</p><p>To exercise any right, contact <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We will respond within one month.</p><p><strong>Right to lodge a complaint:</strong> You may contact the Information Commissioner&rsquo;s Office (ICO) at <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">ico.org.uk</a>, or your local data protection authority if you are in the EEA.</p></> },
          { idx: 10, content: <ul><li>Your uploaded Jira data is processed only to generate your private analytics</li><li>It is stored in a workspace accessible only to you</li><li>It is not shared with any third-party analytics, advertising, or AI service</li><li>It is not used to train any machine learning or AI model</li><li>It does not appear in error logs, crash reports, or any monitoring system</li><li>It does not appear in feedback reports or support tickets</li><li>It is not transferred between user workspaces</li><li>It is deleted when you delete your import log or close your account</li><li>Staff do not access your Jira data without your explicit permission</li></ul> },
          { idx: 11, content: <p>We may update this Privacy Policy from time to time. For material changes — such as new categories of data, new third-party processors, or new purposes — we will provide prominent notice within the Service and, where possible, by email. If you do not agree with a material change, you must stop using the Service and request account deletion.</p> },
          { idx: 12, content: <p>We do not track users across third-party websites and do not respond to Do Not Track (DNT) browser signals, because we do not engage in cross-site tracking.</p> },
        ].map(({ idx, content }) => (
          <div key={idx}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>{t.privacy.sections[idx].title}</h2>
              <div className={styles.body}>{content}</div>
            </div>
            <div className={styles.divider} />
          </div>
        ))}

        <div className={styles.contactBox}>
          <strong>{t.ui.contact}</strong><br />
          Ali Abu Ras · <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a><br /><br />
          <strong>{t.ui.supervisoryAuthority}</strong><br />
          Information Commissioner&rsquo;s Office (ICO) ·{' '}
          <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">ico.org.uk</a><br /><br />
          <Link href="/terms">{t.ui.readTerms}</Link>
        </div>
      </div>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <Suspense>
      <PrivacyContent />
    </Suspense>
  );
}
