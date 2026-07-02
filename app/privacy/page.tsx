// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// EP-014: Privacy Policy — comprehensive GDPR/UK GDPR compliant, public route.

import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './page.module.scss';

export const metadata: Metadata = {
  title: 'Privacy Policy — Delivery Clarity',
  description: 'How Delivery Clarity collects, uses, stores, and protects your personal data.',
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
        <p className={styles.meta}>
          Effective date: {EFFECTIVE_DATE} · Version {VERSION}<br />
          Controller: Ali Abu Ras · <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>

        <div className={styles.section}>
          <div className={styles.body}>
            <p>
              This Privacy Policy explains how Delivery Clarity, operated by Ali Abu Ras
              (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;, &ldquo;the
              Controller&rdquo;), collects, uses, stores, discloses, and protects
              personal data when you use the Service. It also sets out your rights
              under the UK General Data Protection Regulation (&ldquo;UK GDPR&rdquo;),
              the Data Protection Act 2018, and equivalent legislation where applicable.
            </p>
            <p>
              <strong>
                If you do not agree with this Policy, you must not use the Service.
              </strong>
            </p>
          </div>
        </div>

        <div className={styles.divider} />

        {/* 1 */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>1. Who we are and how to contact us</h2>
          <div className={styles.body}>
            <p>
              The data controller for all personal data processed through Delivery Clarity is:
            </p>
            <ul>
              <li><strong>Name:</strong> Ali Abu Ras</li>
              <li><strong>Operating as:</strong> Delivery Clarity</li>
              <li><strong>Email:</strong> <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></li>
              <li><strong>Country of establishment:</strong> United Kingdom</li>
            </ul>
            <p>
              For all data protection enquiries, rights requests, or complaints, please
              contact us at the email address above.
            </p>
          </div>
        </div>

        <div className={styles.divider} />

        {/* 2 */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>2. Data we collect and why</h2>
          <div className={styles.body}>

            <p><strong>2.1 Account and registration data</strong></p>
            <ul>
              <li>Full name and email address</li>
              <li>Hashed password (never stored in plaintext)</li>
              <li>Professional persona / role selected at signup</li>
              <li>Date and version of Terms and Privacy Policy acceptance</li>
              <li>Email verification status</li>
              <li>Account creation and last-login timestamps</li>
            </ul>
            <p>
              <em>Lawful basis:</em> Performance of a contract (account creation and authentication).
            </p>

            <p><strong>2.2 Jira export data you upload</strong></p>
            <ul>
              <li>CSV or Excel files you upload — processed in your private workspace</li>
              <li>Issue keys, types, statuses, date fields, story points, sprints, assignees</li>
              <li>Derived metrics: lead time, cycle time, throughput, velocity, flow scores</li>
              <li>File metadata: name, size, type, row count, upload timestamp, health score</li>
            </ul>
            <p>
              <em>Lawful basis:</em> Performance of a contract (providing the analytics Service you requested).
            </p>
            <p>
              <strong>
                Your Jira data is never used for any purpose other than generating
                your private analytics reports. It is never included in error logs,
                feedback reports, analytics telemetry, AI training, or any
                communication external to the Service.
              </strong>
            </p>

            <p><strong>2.3 Security and usage data</strong></p>
            <ul>
              <li>IP address — used for rate limiting and security monitoring only; not stored permanently</li>
              <li>Login and logout timestamps</li>
              <li>Audit events (uploads, exports, settings changes, password changes)</li>
              <li>Login attempt records (hashed key only, pruned after 1 hour)</li>
              <li>User agent / browser family</li>
            </ul>
            <p>
              <em>Lawful basis:</em> Legitimate interests (protecting the Service and other users from abuse and unauthorised access).
            </p>

            <p><strong>2.4 Error and performance data</strong></p>
            <ul>
              <li>Client-side error messages, sanitised stack traces (no file paths, no user data)</li>
              <li>Page and component where errors occurred</li>
              <li>Application version at the time of the error</li>
              <li>Error occurrence count and timestamps</li>
            </ul>
            <p>
              <em>Lawful basis:</em> Legitimate interests (maintaining stability and reliability of the Service).
            </p>

            <p><strong>2.5 Feedback you voluntarily submit</strong></p>
            <ul>
              <li>Category and message text you submit through the in-app feedback form</li>
              <li>Impact level, page location, browser family, application version</li>
              <li>Your email address — only if you explicitly opt in to being contacted</li>
            </ul>
            <p>
              <em>Lawful basis:</em> Consent (you submit feedback voluntarily and choose whether to allow contact).
            </p>

            <p><strong>2.6 Data we do NOT collect</strong></p>
            <ul>
              <li>We do not collect payment card data or financial information (the Service is free to trial)</li>
              <li>We do not use advertising cookies or third-party tracking pixels</li>
              <li>We do not profile users for advertising purposes</li>
              <li>We do not collect data from children under 18</li>
              <li>We do not use third-party session replay or heatmap tools</li>
              <li>We do not send your Jira data to any AI, machine learning, or analytics service</li>
            </ul>
          </div>
        </div>

        <div className={styles.divider} />

        {/* 3 */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>3. Automated decision-making and profiling</h2>
          <div className={styles.body}>
            <p>
              We do not make any automated decisions that produce legal or similarly
              significant effects about you personally. The metrics and scores generated
              by the Service are analytical outputs applied to project data — not
              decisions about individuals.
            </p>
          </div>
        </div>

        <div className={styles.divider} />

        {/* 4 */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>4. How we share your data</h2>
          <div className={styles.body}>
            <p>
              We do not sell, rent, or trade your personal data to any third party.
              We share data only in the following limited circumstances:
            </p>

            <p><strong>4.1 Infrastructure and service providers (data processors)</strong></p>
            <p>We use the following sub-processors to operate the Service:</p>
            <ul>
              <li>
                <strong>Render Services Inc.</strong> (hosting) — servers on which the
                application runs. Location: USA. Data processed: all application data
                in transit and at rest on the server.
              </li>
              <li>
                <strong>Neon Inc.</strong> (PostgreSQL database) — stores account data,
                workspace data, import logs, and snapshots. Location: USA East.
                Data processed: all structured data described in Section 2.
              </li>
              <li>
                <strong>Resend Inc. / SMTP providers</strong> (transactional email) —
                used to send verification emails and password reset links. Only your
                name and email address are shared. Location: USA.
              </li>
              <li>
                <strong>Amazon Web Services S3</strong> (optional cloud storage) —
                used if configured for backup and restore. Location: configurable.
                Data processed: encrypted backup snapshots of application data.
              </li>
            </ul>
            <p>
              All sub-processors are bound by contractual obligations that restrict
              their use of your data to performing services on our behalf.
            </p>

            <p><strong>4.2 Legal requirements</strong></p>
            <p>
              We may disclose your personal data if required to do so by law, court
              order, or at the request of a competent regulatory or law enforcement
              authority, provided we are legally permitted to notify you of such
              disclosure.
            </p>

            <p><strong>4.3 Business transfers</strong></p>
            <p>
              In the event that the Service or its assets are transferred to a third
              party (including through a merger, acquisition, or sale of assets), your
              data may be transferred as part of that transaction. We will notify you
              prior to your data being transferred and becoming subject to a different
              privacy policy.
            </p>

            <p><strong>4.4 Protection of rights</strong></p>
            <p>
              We may share information where we believe it is necessary to protect our
              rights, investigate fraud or abuse, or enforce these Terms.
            </p>
          </div>
        </div>

        <div className={styles.divider} />

        {/* 5 */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>5. International data transfers</h2>
          <div className={styles.body}>
            <p>
              Our primary infrastructure (Render, Neon) is located in the United States.
              Transfers of personal data from the UK or European Economic Area to the
              USA are made in reliance on:
            </p>
            <ul>
              <li>
                Standard Contractual Clauses (SCCs) incorporated into our sub-processor
                agreements where applicable; and/or
              </li>
              <li>
                The UK&rsquo;s International Data Transfer Agreement (IDTA) framework
                where appropriate.
              </li>
            </ul>
            <p>
              You may request details of the specific transfer mechanisms we rely on
              by contacting us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
          </div>
        </div>

        <div className={styles.divider} />

        {/* 6 */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>6. Data retention</h2>
          <div className={styles.body}>
            <ul>
              <li><strong>Account data:</strong> Retained while your account is active. Deleted within 30 days of confirmed account deletion.</li>
              <li><strong>Jira import data and metrics:</strong> Retained for the duration of your workspace or until you delete them, then within 30 days of account deletion.</li>
              <li><strong>Dashboard snapshots:</strong> Retained until deleted by you or upon account deletion.</li>
              <li><strong>Audit events:</strong> Retained for 12 months from creation.</li>
              <li><strong>Error records:</strong> Retained for 90 days.</li>
              <li><strong>Feedback submissions:</strong> Retained indefinitely unless you request deletion, as they do not contain personal data unless you opted in to contact.</li>
              <li><strong>Login attempt records:</strong> Pruned automatically after 1 hour.</li>
              <li><strong>Consent records:</strong> Retained for the lifetime of the account plus 6 years for legal compliance purposes.</li>
            </ul>
            <p>
              We may retain certain data for longer periods where required by law,
              regulation, or for the establishment, exercise, or defence of legal claims.
            </p>
          </div>
        </div>

        <div className={styles.divider} />

        {/* 7 */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>7. Cookies and session data</h2>
          <div className={styles.body}>
            <p>We use a single first-party session cookie:</p>
            <ul>
              <li>
                <strong>Name:</strong> <code>dc_session</code>
              </li>
              <li><strong>Purpose:</strong> Maintains your authenticated login state</li>
              <li><strong>Type:</strong> Strictly necessary (no opt-out required)</li>
              <li><strong>Attributes:</strong> HttpOnly, Secure (HTTPS only), SameSite=Strict</li>
              <li><strong>Expiry:</strong> Session (cleared on logout or browser close)</li>
            </ul>
            <p>
              We do not set any analytics, advertising, or third-party cookies.
              No cookie consent banner is displayed because we use only a strictly
              necessary session cookie that cannot be refused without preventing use
              of the Service.
            </p>
          </div>
        </div>

        <div className={styles.divider} />

        {/* 8 */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>8. Security measures</h2>
          <div className={styles.body}>
            <p>We implement the following security measures to protect your data:</p>
            <ul>
              <li>Passwords hashed using bcrypt with a minimum work factor of 12</li>
              <li>All data in transit encrypted using TLS 1.2 or higher (HTTPS enforced)</li>
              <li>Session cookies are HttpOnly, Secure, and SameSite=Strict</li>
              <li>Stored Jira API credentials encrypted using AES-256-GCM</li>
              <li>Database connections encrypted in transit</li>
              <li>Rate limiting on all authentication and data submission endpoints</li>
              <li>All data queries scoped to the authenticated user&rsquo;s workspace</li>
              <li>Audit logging of all sensitive account and data actions</li>
              <li>Server-side session validation on every authenticated request</li>
              <li>Database backups retained by our hosting provider (Neon)</li>
            </ul>
            <p>
              <strong>
                Despite our security measures, no system is 100% secure. We cannot
                guarantee absolute security of your data. In the event of a data breach
                that is likely to result in a risk to your rights and freedoms, we will
                notify the relevant supervisory authority within 72 hours and notify
                affected users without undue delay, as required by law.
              </strong>
            </p>
          </div>
        </div>

        <div className={styles.divider} />

        {/* 9 */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>9. Children&rsquo;s privacy</h2>
          <div className={styles.body}>
            <p>
              The Service is not directed at, and is not intended for use by, anyone
              under the age of 18. We do not knowingly collect personal data from
              children under 18. If we become aware that we have collected personal
              data from a child under 18, we will delete it promptly.
            </p>
            <p>
              If you believe a child has provided us with personal data, please
              contact us immediately at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
          </div>
        </div>

        <div className={styles.divider} />

        {/* 10 */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>10. Your rights</h2>
          <div className={styles.body}>
            <p>
              Under the UK GDPR and applicable data protection law, you have the
              following rights regarding your personal data:
            </p>
            <ul>
              <li>
                <strong>Right of access (Article 15):</strong> Request a copy of
                the personal data we hold about you.
              </li>
              <li>
                <strong>Right to rectification (Article 16):</strong> Request
                correction of inaccurate or incomplete personal data.
              </li>
              <li>
                <strong>Right to erasure (Article 17):</strong> Request deletion of
                your personal data, subject to our legal retention obligations.
              </li>
              <li>
                <strong>Right to restriction of processing (Article 18):</strong>{' '}
                Request that we restrict processing of your data in certain circumstances.
              </li>
              <li>
                <strong>Right to data portability (Article 20):</strong> Request
                your personal data in a structured, commonly used, machine-readable
                format where processing is based on consent or contract.
              </li>
              <li>
                <strong>Right to object (Article 21):</strong> Object to processing
                based on legitimate interests at any time.
              </li>
              <li>
                <strong>Right to withdraw consent:</strong> Where we process data
                based on consent, you may withdraw consent at any time without
                affecting the lawfulness of prior processing.
              </li>
              <li>
                <strong>Right not to be subject to automated decision-making
                (Article 22):</strong> We do not make automated decisions that
                produce legal or similarly significant effects about you.
              </li>
            </ul>
            <p>
              To exercise any of these rights, please contact us at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We will
              respond within one month. We may ask you to verify your identity
              before processing your request.
            </p>
            <p>
              <strong>Right to lodge a complaint:</strong> If you believe we have
              processed your data unlawfully, you have the right to lodge a complaint
              with the UK supervisory authority, the Information Commissioner&rsquo;s
              Office (ICO), at <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">ico.org.uk</a>,
              or with your local data protection authority if you are in the EEA.
              We would, however, appreciate the opportunity to address your concerns
              directly before you contact the ICO.
            </p>
          </div>
        </div>

        <div className={styles.divider} />

        {/* 11 */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>11. Your Jira data — specific commitments</h2>
          <div className={styles.body}>
            <p>
              Because the sensitivity of your Jira export data is central to the Service,
              we make the following specific commitments:
            </p>
            <ul>
              <li>Your uploaded Jira data is processed only to generate your private analytics</li>
              <li>It is stored in a workspace accessible only to you (and, in future, members you invite)</li>
              <li>It is not shared with any third-party analytics, advertising, or AI service</li>
              <li>It is not used to train any machine learning or AI model</li>
              <li>It does not appear in error logs, crash reports, or any monitoring system</li>
              <li>It does not appear in feedback reports or support tickets</li>
              <li>It is not transferred between user workspaces</li>
              <li>It is deleted when you delete your import log or close your account</li>
              <li>Staff do not access your Jira data unless strictly required for a support request you have raised and with your explicit permission</li>
            </ul>
          </div>
        </div>

        <div className={styles.divider} />

        {/* 12 */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>12. Changes to this policy</h2>
          <div className={styles.body}>
            <p>
              We may update this Privacy Policy from time to time. The current version
              and effective date are always displayed at the top of this page.
            </p>
            <p>
              For material changes — such as new categories of data, new third-party
              processors, new purposes, or changes to your rights — we will provide
              prominent notice within the Service and, where we have your email
              address, by email.
            </p>
            <p>
              If changes require fresh consent under applicable law, we will obtain
              that consent before the changes take effect. If you do not agree with
              a material change, you must stop using the Service and request account
              deletion.
            </p>
          </div>
        </div>

        <div className={styles.divider} />

        {/* 13 */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>13. Do Not Track</h2>
          <div className={styles.body}>
            <p>
              We do not track users across third-party websites and do not respond
              to Do Not Track (DNT) browser signals, because we do not engage in
              cross-site tracking in the first place.
            </p>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.contactBox}>
          <strong>Data Controller Contact</strong><br />
          Ali Abu Ras · <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a><br /><br />
          <strong>Supervisory Authority (UK)</strong><br />
          Information Commissioner&rsquo;s Office (ICO) · <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">ico.org.uk</a><br /><br />
          <Link href="/terms">Read our Terms of Use →</Link>
        </div>
      </div>
    </div>
  );
}
