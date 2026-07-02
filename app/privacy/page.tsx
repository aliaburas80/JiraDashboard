// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// EP-014: Privacy Policy — public, no authentication required.

import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './page.module.scss';

export const metadata: Metadata = {
  title: 'Privacy Policy — Delivery Clarity',
  description: 'How Delivery Clarity collects, uses and protects your data.',
};

const EFFECTIVE_DATE = '3 July 2026';
const VERSION        = 'v1';
const CONTACT_EMAIL  = 'aliaburas80@gmail.com';

export default function PrivacyPage() {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <Link href="/register" className={styles.back}>← Back to registration</Link>

        <p className={styles.badge}>Privacy Policy {VERSION}</p>
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.meta}>Effective date: {EFFECTIVE_DATE} · Delivery Clarity</p>

        <div className={styles.section}>
          <div className={styles.body}>
            <p>
              Delivery Clarity (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) is a
              private Jira delivery analytics platform operated by Ali Abu Ras. This Privacy
              Policy explains what data we collect, how we use it, and your rights.
            </p>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>1. Data we collect</h2>
          <div className={styles.body}>
            <p><strong>Account data</strong></p>
            <ul>
              <li>Full name and email address (provided at registration)</li>
              <li>Professional persona selected at signup (e.g. Scrum Master, Delivery Manager)</li>
              <li>Hashed password — we never store your plaintext password</li>
              <li>Date and version of Terms acceptance</li>
            </ul>
            <p><strong>Jira export data</strong></p>
            <ul>
              <li>CSV or Excel files you upload for analysis — processed in your private workspace</li>
              <li>Derived metrics, health scores, and aggregated calculations</li>
              <li>File metadata (name, size, row count, upload timestamp)</li>
            </ul>
            <p><strong>Usage data</strong></p>
            <ul>
              <li>Login timestamps and IP address (for security and rate limiting)</li>
              <li>Audit events (uploads, exports, setting changes)</li>
              <li>Error reports and browser family (for stability monitoring)</li>
              <li>Feedback you voluntarily submit through the in-app feedback button</li>
            </ul>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>2. How we use your data</h2>
          <div className={styles.body}>
            <ul>
              <li>To provide and operate your private delivery analytics workspace</li>
              <li>To authenticate you securely and prevent unauthorised access</li>
              <li>To send transactional emails (account verification, password reset)</li>
              <li>To detect and prevent abuse, fraud, and security threats</li>
              <li>To diagnose errors and improve reliability</li>
              <li>To understand how the product is used at an aggregate, non-personal level</li>
            </ul>
            <p>
              We do <strong>not</strong> sell your data to third parties.
              We do <strong>not</strong> use your Jira data to train AI models.
              We do <strong>not</strong> share your Jira export content with any analytics service.
            </p>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>3. Your Jira data</h2>
          <div className={styles.body}>
            <p>
              Your uploaded Jira exports are processed to calculate delivery metrics and are
              stored in your private workspace in our PostgreSQL database hosted on Neon
              (neon.tech), located in the US East region.
            </p>
            <p>
              Your Jira data is <strong>never</strong> included in:
            </p>
            <ul>
              <li>Error logs or crash reports</li>
              <li>Feedback reports</li>
              <li>Analytics or usage telemetry</li>
              <li>Communications sent externally</li>
            </ul>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>4. Data retention</h2>
          <div className={styles.body}>
            <ul>
              <li>Account data is retained while your account is active</li>
              <li>Import logs and snapshots are retained for the duration of your workspace</li>
              <li>Error logs are retained for 90 days</li>
              <li>Audit events are retained for 12 months</li>
              <li>Login attempt records are pruned after 1 hour</li>
            </ul>
            <p>
              You may request deletion of your account and all associated data at any time
              by contacting us at the address below.
            </p>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>5. Cookies and session</h2>
          <div className={styles.body}>
            <p>
              We use a single secure, HttpOnly, SameSite=Strict session cookie
              (<code>dc_session</code>) to maintain your login state. No tracking
              cookies are set. No third-party advertising cookies are used.
            </p>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>6. Your rights</h2>
          <div className={styles.body}>
            <p>You have the right to:</p>
            <ul>
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your account and data</li>
              <li>Export your account data</li>
              <li>Withdraw consent (by closing your account)</li>
            </ul>
            <p>To exercise any of these rights, contact us at the address below.</p>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>7. Security</h2>
          <div className={styles.body}>
            <p>
              We use industry-standard security practices including bcrypt password
              hashing, AES-256-GCM encryption for stored credentials, HTTPS-only
              communication, rate limiting on all authentication endpoints, and
              server-side session validation on every authenticated request.
            </p>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>8. Changes to this policy</h2>
          <div className={styles.body}>
            <p>
              We will notify you of material changes by updating the effective date above
              and, where appropriate, by email. Continued use of the service after a change
              constitutes acceptance of the updated policy.
            </p>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.contactBox}>
          <strong>Contact</strong><br />
          For privacy questions or data requests, contact:<br />
          Ali Abu Ras · <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </div>
      </div>
    </div>
  );
}
