'use client';
// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// EP-014 / EP-I18N-01: Terms of Use — 7 languages, animated background, PDF download.

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

function TermsContent() {
  const params    = useSearchParams();
  const rawLang   = params.get('lang') ?? DEFAULT_LANG;
  const lang      = (rawLang in LANGUAGES ? rawLang : DEFAULT_LANG) as LangCode;
  const t         = translations[lang];
  const dir       = LANGUAGES[lang].dir;
  const isEn      = lang === 'en';

  return (
    <div className={styles.page} dir={dir}>
      <AnimatedDataBackground className={`${styles.bg} ${styles.bgDim}`} />

      <div className={styles.inner}>
        {/* Page actions bar */}
        <div className={styles.pageActions}>
          <Link href="/register" className={styles.back}>{t.ui.backToRegister}</Link>
          <div className={styles.actionButtons}>
            <LanguageSwitcher current={lang} selectLabel={t.ui.selectLanguage} />
            <DownloadPdfButton label={t.ui.downloadPdf} />
          </div>
        </div>

        {/* Auto-translation warning */}
        {!isEn && t.ui.autoTranslationWarning && (
          <div className={styles.translationBanner} role="note">
            {t.ui.autoTranslationWarning}
          </div>
        )}

        <p className={styles.badge}>{t.terms.badge} {VERSION}</p>
        <h1 className={styles.title}>{t.terms.title}</h1>
        <p className={styles.meta}>
          {t.ui.effectiveDate}: {EFFECTIVE_DATE} · {t.ui.version} {VERSION}<br />
          {isEn ? 'Operator' : 'Operator'}: Ali Abu Ras ·{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>

        {/* Intro */}
        <div className={styles.section}>
          <div className={styles.body}>
            <p>{t.terms.description}</p>
          </div>
        </div>

        <div className={styles.divider} />

        {/* Section 1 */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t.terms.sections[0].title}</h2>
          <div className={styles.body}>
            <p>Delivery Clarity is a private, software-as-a-service delivery analytics platform that processes Jira CSV and Excel exports to generate sprint health metrics, flow efficiency scores, release readiness assessments, and delivery coaching recommendations (&ldquo;the Service&rdquo;).</p>
            <p>The Service is operated by Ali Abu Ras, an individual trader based in the United Kingdom (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;).</p>
            <p><strong>The Service is provided for informational and analytical purposes only.</strong> It does not constitute professional project management, financial, legal, compliance, or investment advice. All metrics, recommendations, and forecasts are produced algorithmically from the data you provide and carry no warranty of accuracy, completeness, or fitness for any particular business decision.</p>
          </div>
        </div>
        <div className={styles.divider} />

        {/* Section 2 */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t.terms.sections[1].title}</h2>
          <div className={styles.body}>
            <ul>
              <li>You must be at least 18 years old to use the Service.</li>
              <li>You must have the legal capacity to enter into a binding contract.</li>
              <li>If you use the Service on behalf of an organisation, you represent that you have authority to bind that organisation to these Terms.</li>
              <li>The Service is intended for professional business use by agile practitioners, project managers, delivery managers, and related roles.</li>
              <li>The Service is not available to persons who have previously had their account suspended or terminated for breach of these Terms.</li>
            </ul>
          </div>
        </div>
        <div className={styles.divider} />

        {/* Section 3 */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t.terms.sections[2].title}</h2>
          <div className={styles.body}>
            <ul>
              <li>You must provide accurate, complete, and current information when creating your account and keep it updated.</li>
              <li>You may hold only one account. Duplicate accounts are prohibited.</li>
              <li>You are solely responsible for all activity that occurs under your account credentials.</li>
              <li>You must choose a strong, unique password and must not share your login credentials with any other person or entity.</li>
              <li>You must notify us immediately at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> if you believe your account has been compromised.</li>
              <li>We reserve the right to suspend or terminate any account we reasonably believe has been accessed by an unauthorised party.</li>
              <li>You must verify your email address before accessing analysis features. We reserve the right to require re-verification at any time.</li>
            </ul>
          </div>
        </div>
        <div className={styles.divider} />

        {/* Section 4 */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t.terms.sections[3].title}</h2>
          <div className={styles.body}>
            <p>Subject to your compliance with these Terms, we grant you a limited, non-exclusive, non-transferable, non-sublicensable, revocable licence to access and use the Service for your internal business purposes.</p>
            <p>This licence does not include the right to:</p>
            <ul>
              <li>Resell, sublicense, or provide the Service as a bureau or managed service to third parties;</li>
              <li>Copy, reproduce, or distribute any part of the Service;</li>
              <li>Reverse-engineer, decompile, disassemble, or attempt to derive the source code or algorithms;</li>
              <li>Create derivative works based on the Service;</li>
              <li>Frame or mirror the Service on any other website or application;</li>
              <li>Remove or obscure any proprietary notices or branding.</li>
            </ul>
            <p>We reserve all rights not expressly granted. This licence terminates automatically if you breach these Terms.</p>
          </div>
        </div>
        <div className={styles.divider} />

        {/* Section 5 */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t.terms.sections[4].title}</h2>
          <div className={styles.body}>
            <p>You must not use the Service to:</p>
            <ul>
              <li>Upload data that you do not own or have explicit authorisation to process;</li>
              <li>Process personal data in violation of applicable data protection laws;</li>
              <li>Attempt to gain unauthorised access to another user&rsquo;s workspace, data, or account;</li>
              <li>Probe, scan, or test the vulnerability of the Service or any related system;</li>
              <li>Introduce malware, ransomware, viruses, worms, or destructive code of any kind;</li>
              <li>Conduct automated scraping, crawling, spidering, or data mining without our prior written consent;</li>
              <li>Circumvent, disable, or interfere with authentication, rate limiting, or access controls;</li>
              <li>Conduct denial-of-service attacks or deliberately overload the Service;</li>
              <li>Register multiple accounts to abuse the free trial or bypass account limits;</li>
              <li>Use the Service in connection with any unlawful, fraudulent, or deceptive activity;</li>
              <li>Impersonate any person or entity, or misrepresent your affiliation;</li>
              <li>Collect or harvest personal data about other users;</li>
              <li>Upload files containing formulas, macros, or executable code designed to exploit parsing vulnerabilities;</li>
              <li>Attempt to infer the Service&rsquo;s proprietary algorithms through systematic testing or reverse engineering.</li>
            </ul>
            <p>Violation of this section may result in immediate suspension or permanent termination without refund and referral to law enforcement authorities.</p>
          </div>
        </div>
        <div className={styles.divider} />

        {/* Sections 6–16 */}
        {[
          { idx: 5, content: <><p>You retain all ownership rights in the data and files you upload to the Service (&ldquo;Your Content&rdquo;).</p><p>By uploading Your Content you grant us a limited, worldwide, royalty-free licence to process, store, and analyse Your Content solely for the purpose of providing the Service to you. This licence terminates when you delete Your Content or close your account.</p><p>You represent and warrant that: you have all necessary rights to upload and process Your Content; Your Content does not violate any applicable law or third-party rights; you have obtained all required consents from individuals whose personal data may appear in Your Content; and your organisation&rsquo;s Jira data policies permit upload to a third-party analytics service.</p><p><strong>We expressly disclaim responsibility for any data protection or privacy violations arising from your decision to upload data containing personal information of third parties.</strong></p></> },
          { idx: 6, content: <><p>If you submit ideas, suggestions, bug reports, or other feedback (&ldquo;Feedback&rdquo;) through the Service or by any other means, you grant us a perpetual, irrevocable, royalty-free, worldwide licence to use, copy, modify, and incorporate that Feedback into the Service or any other product, without any obligation to compensate or attribute you. You waive any moral rights in the Feedback to the fullest extent permitted by law.</p></> },
          { idx: 7, content: <><p>During the soft-launch period, each account is entitled to one successful Jira analysis free of charge, followed by up to 30 days of read access to the results.</p><ul><li>Creating multiple accounts to circumvent the limit is a material breach of these Terms.</li><li>We reserve the right to modify, limit, or withdraw the free trial at any time.</li><li>We reserve the right to cap the number of accounts during the soft-launch period.</li><li>A failed upload or validation failure does not consume your trial entitlement. Only a successful completed analysis does.</li></ul></> },
          { idx: 8, content: <><p>The Service, including its algorithms, calculation methods, scoring models, user interface, design, branding, trade secrets, database schema, source code, and all derived materials, is the exclusive intellectual property of Ali Abu Ras, protected by copyright, trade secret, and other applicable laws of the United Kingdom and internationally.</p><p>No part of these Terms grants you any rights in the Service&rsquo;s intellectual property beyond the limited licence in Section 4. The Delivery Clarity name, logo, and branding are proprietary marks. You may not use them without prior written permission.</p></> },
          { idx: 9, content: <><ul><li><strong>No uptime guarantee.</strong> The Service is provided on an &ldquo;as available&rdquo; basis. We do not warrant uninterrupted or error-free availability.</li><li>We reserve the right to modify, suspend, or discontinue any feature or the entire Service at any time.</li><li>We reserve the right to suspend or terminate your account without notice if you have violated these Terms.</li><li>Upon termination for any reason, your licence immediately ceases.</li><li>Sections 6, 7, 9, 11, 12, 13, 14, and 15 survive termination.</li></ul></> },
          { idx: 10, content: <><p><strong>To the fullest extent permitted by applicable law, the Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind.</strong> We expressly disclaim all warranties including: implied warranties of merchantability, fitness for a particular purpose, and non-infringement; that the Service will meet your requirements or produce specific business outcomes; that the metrics, scores, recommendations, or forecasts generated are accurate, complete, or suitable for any business decision; that the Service will be uninterrupted, error-free, or secure.</p><p><strong>You use the Service and any output it produces entirely at your own risk. No output should be used as the sole basis for any business, staffing, financial, contractual, or operational decision.</strong></p></> },
          { idx: 11, content: <><p><strong>To the fullest extent permitted by applicable law, we shall not be liable for: any indirect, incidental, special, consequential, exemplary, or punitive damages; loss of profits, revenue, business, contracts, or anticipated savings; loss of data or corruption of data; loss of goodwill or reputation; business interruption; wasted management or staff time; any loss arising from reliance on the accuracy of metrics, scores, recommendations, or forecasts; or any loss arising from unauthorised access to your account.</strong></p><p><strong>Our total aggregate liability to you, regardless of the cause of action, shall not exceed the greater of: (a) the total fees you paid us in the twelve months preceding the claim, or (b) fifty pounds sterling (£50 GBP).</strong></p><p>Nothing in these Terms excludes our liability for death or personal injury caused by our negligence, fraud, or any other liability that cannot be excluded by law.</p></> },
          { idx: 12, content: <><p>You agree to defend, indemnify, and hold harmless Ali Abu Ras and any officers, agents, partners, employees, and successors from and against any and all claims, damages, losses, costs, and expenses (including reasonable legal fees) arising out of or relating to: your use of the Service; your violation of these Terms; your violation of any applicable law or third-party right; or any claim arising from your use of Jira data that you were not authorised to process.</p></> },
          { idx: 13, content: <><p>The Service uses third-party infrastructure including Render (hosting), Neon (database), and Resend/SMTP providers (email). We are not responsible for the availability, security, or terms of these providers beyond our contractual obligations to you.</p><p>The Service may contain links to third-party websites. We accept no responsibility for the content, privacy practices, or terms of any third-party site. Accessing third-party links is entirely at your own risk.</p></> },
          { idx: 14, content: <><p>These Terms shall be governed by and construed in accordance with the laws of England and Wales. Before commencing formal proceedings, both parties agree to attempt to resolve any dispute in good faith by negotiation for 30 days. Subject to the above, the courts of England and Wales shall have exclusive jurisdiction. EU consumers may also use the EU Online Dispute Resolution platform.</p></> },
          { idx: 15, content: <><p><strong>Entire agreement.</strong> These Terms and the Privacy Policy constitute the entire agreement between you and us regarding the Service.</p><p><strong>Severability.</strong> If any provision is found unenforceable, the remaining provisions continue in full force.</p><p><strong>No waiver.</strong> Our failure to enforce any right shall not constitute a waiver.</p><p><strong>Force majeure.</strong> We shall not be liable for failure resulting from causes beyond our reasonable control.</p><p><strong>Assignment.</strong> You may not assign your rights without our prior written consent. We may assign our rights and obligations without restriction.</p><p><strong>Language.</strong> These Terms are drafted in English. In the event of any conflict, the English version shall prevail.</p></> },
        ].map(({ idx, content }) => (
          <div key={idx}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>{t.terms.sections[idx].title}</h2>
              <div className={styles.body}>{content}</div>
            </div>
            <div className={styles.divider} />
          </div>
        ))}

        <div className={styles.contactBox}>
          <strong>{t.ui.contact}</strong><br />
          Ali Abu Ras · <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a><br /><br />
          <Link href="/privacy">{t.ui.readPrivacy}</Link>
        </div>
      </div>
    </div>
  );
}

export default function TermsPage() {
  return (
    <Suspense>
      <TermsContent />
    </Suspense>
  );
}
