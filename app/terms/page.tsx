// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// EP-014: Terms of Use — public, no authentication required.

import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './page.module.scss';

export const metadata: Metadata = {
  title: 'Terms of Use — Delivery Clarity',
  description: 'Terms and conditions for using Delivery Clarity.',
};

const EFFECTIVE_DATE = '3 July 2026';
const VERSION        = 'v1';
const CONTACT_EMAIL  = 'aliaburas80@gmail.com';

export default function TermsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <Link href="/register" className={styles.back}>← Back to registration</Link>

        <p className={styles.badge}>Terms of Use {VERSION}</p>
        <h1 className={styles.title}>Terms of Use</h1>
        <p className={styles.meta}>Effective date: {EFFECTIVE_DATE} · Delivery Clarity</p>

        <div className={styles.section}>
          <div className={styles.body}>
            <p>
              These Terms of Use (&ldquo;Terms&rdquo;) govern your access to and use of
              Delivery Clarity, a private Jira delivery analytics platform operated by
              Ali Abu Ras (&ldquo;we&rdquo;, &ldquo;us&rdquo;). By creating an account
              you agree to these Terms.
            </p>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>1. The service</h2>
          <div className={styles.body}>
            <p>
              Delivery Clarity lets you upload Jira CSV or Excel exports and receive
              private delivery intelligence reports including sprint health, flow metrics,
              release readiness, and coaching recommendations.
            </p>
            <p>
              The service is provided on a <strong>free trial basis</strong> during
              the soft launch period. One successful analysis is included per account.
              We reserve the right to change pricing or availability with reasonable notice.
            </p>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>2. Your account</h2>
          <div className={styles.body}>
            <ul>
              <li>You must provide accurate information when creating your account</li>
              <li>You are responsible for maintaining the security of your credentials</li>
              <li>You must be at least 18 years old to use this service</li>
              <li>One account per person — do not share your login credentials</li>
              <li>You must verify your email address before using the analysis features</li>
            </ul>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>3. Acceptable use</h2>
          <div className={styles.body}>
            <p>You agree not to:</p>
            <ul>
              <li>Upload data you do not have permission to process</li>
              <li>Attempt to access another user&rsquo;s workspace or data</li>
              <li>Use the service to process confidential third-party data without appropriate rights</li>
              <li>Attempt to reverse-engineer, scrape, or extract the analytics algorithms</li>
              <li>Abuse the free trial through automated registrations or duplicate accounts</li>
              <li>Use the service in any way that violates applicable law</li>
            </ul>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>4. Your data</h2>
          <div className={styles.body}>
            <p>
              You retain ownership of any Jira data you upload. By uploading data you
              grant us a limited licence to process it solely for the purpose of generating
              your analytics reports. We do not use your data to train AI models or share
              it with third parties.
            </p>
            <p>
              You are responsible for ensuring you have the right to upload and process the
              Jira data within your organisation.
            </p>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>5. Intellectual property</h2>
          <div className={styles.body}>
            <p>
              The Delivery Clarity platform, algorithms, calculations, design, and branding
              are the exclusive intellectual property of Ali Abu Ras. Nothing in these Terms
              grants you any rights to the platform&rsquo;s intellectual property.
            </p>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>6. Disclaimers</h2>
          <div className={styles.body}>
            <p>
              The service is provided <strong>&ldquo;as is&rdquo;</strong> without
              warranties of any kind. Delivery metrics and recommendations are based on
              the data you provide and are for informational purposes only. We do not
              guarantee the accuracy of any analysis.
            </p>
            <p>
              We are not responsible for business decisions made based on the insights
              provided by Delivery Clarity.
            </p>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>7. Limitation of liability</h2>
          <div className={styles.body}>
            <p>
              To the fullest extent permitted by law, our total liability to you for any
              claim arising from these Terms or your use of the service is limited to the
              amount you paid us in the twelve months preceding the claim, or £50 (GBP),
              whichever is greater.
            </p>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>8. Account termination</h2>
          <div className={styles.body}>
            <p>
              We may suspend or terminate your account if you breach these Terms or if
              your account is used for abuse. You may request account deletion at any time
              by contacting us.
            </p>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>9. Changes to these Terms</h2>
          <div className={styles.body}>
            <p>
              We may update these Terms. Material changes will be communicated by
              updating the effective date and, where appropriate, notifying you by email.
              Continued use after changes constitutes acceptance.
            </p>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>10. Governing law</h2>
          <div className={styles.body}>
            <p>
              These Terms are governed by the laws of England and Wales. Any disputes
              shall be subject to the exclusive jurisdiction of the courts of England and Wales.
            </p>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.contactBox}>
          <strong>Contact</strong><br />
          For questions about these Terms, contact:<br />
          Ali Abu Ras · <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a><br /><br />
          <Link href="/privacy">Read our Privacy Policy →</Link>
        </div>
      </div>
    </div>
  );
}
