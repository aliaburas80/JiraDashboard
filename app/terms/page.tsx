// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// EP-014: Terms of Use — comprehensive legal protection, public route.

import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './page.module.scss';

export const metadata: Metadata = {
  title: 'Terms of Use — Delivery Clarity',
  description: 'Terms and conditions governing your use of Delivery Clarity.',
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
        <p className={styles.meta}>
          Effective date: {EFFECTIVE_DATE} · Version {VERSION}<br />
          Operator: Ali Abu Ras · <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>

        <div className={styles.section}>
          <div className={styles.body}>
            <p>
              <strong>Please read these Terms of Use (&ldquo;Terms&rdquo;) carefully before
              using Delivery Clarity.</strong> By creating an account, clicking &ldquo;I
              agree&rdquo;, or accessing any part of the service, you confirm that you have
              read, understood, and agree to be bound by these Terms and our{' '}
              <Link href="/privacy">Privacy Policy</Link>. If you do not agree, do not
              use the service.
            </p>
          </div>
        </div>

        <div className={styles.divider} />

        {/* 1 */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>1. About the service</h2>
          <div className={styles.body}>
            <p>
              Delivery Clarity is a private, software-as-a-service delivery analytics
              platform that processes Jira CSV and Excel exports to generate sprint health
              metrics, flow efficiency scores, release readiness assessments, and delivery
              coaching recommendations (&ldquo;the Service&rdquo;).
            </p>
            <p>
              The Service is operated by Ali Abu Ras, an individual trader based in the
              United Kingdom (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;).
            </p>
            <p>
              <strong>The Service is provided for informational and analytical purposes
              only.</strong> It does not constitute professional project management,
              financial, legal, compliance, or investment advice. All metrics,
              recommendations, and forecasts are produced algorithmically from the data
              you provide and carry no warranty of accuracy, completeness, or fitness
              for any particular business decision.
            </p>
          </div>
        </div>

        <div className={styles.divider} />

        {/* 2 */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>2. Eligibility</h2>
          <div className={styles.body}>
            <ul>
              <li>You must be at least 18 years old to use the Service.</li>
              <li>You must have the legal capacity to enter into a binding contract.</li>
              <li>
                If you use the Service on behalf of an organisation, you represent that
                you have authority to bind that organisation to these Terms.
              </li>
              <li>
                The Service is intended for professional business use by agile
                practitioners, project managers, delivery managers, and related roles.
              </li>
              <li>
                The Service is not available to persons who have previously had their
                account suspended or terminated for breach of these Terms.
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.divider} />

        {/* 3 */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>3. Account registration and security</h2>
          <div className={styles.body}>
            <ul>
              <li>
                You must provide accurate, complete, and current information when
                creating your account and keep it updated.
              </li>
              <li>You may hold only one account. Duplicate accounts are prohibited.</li>
              <li>
                You are solely responsible for all activity that occurs under your
                account credentials.
              </li>
              <li>
                You must choose a strong, unique password and must not share your
                login credentials with any other person or entity.
              </li>
              <li>
                You must notify us immediately at{' '}
                <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> if you believe
                your account has been compromised.
              </li>
              <li>
                We reserve the right to suspend or terminate any account we reasonably
                believe has been accessed by an unauthorised party.
              </li>
              <li>
                You must verify your email address before accessing analysis features.
                We reserve the right to require re-verification at any time.
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.divider} />

        {/* 4 */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>4. Licence to use the service</h2>
          <div className={styles.body}>
            <p>
              Subject to your compliance with these Terms, we grant you a limited,
              non-exclusive, non-transferable, non-sublicensable, revocable licence to
              access and use the Service for your internal business purposes.
            </p>
            <p>This licence does not include the right to:</p>
            <ul>
              <li>Resell, sublicense, or provide the Service as a bureau or managed service to third parties;</li>
              <li>Copy, reproduce, or distribute any part of the Service;</li>
              <li>Reverse-engineer, decompile, disassemble, or attempt to derive the source code or algorithms;</li>
              <li>Create derivative works based on the Service;</li>
              <li>Frame or mirror the Service on any other website or application;</li>
              <li>Remove or obscure any proprietary notices or branding.</li>
            </ul>
            <p>
              We reserve all rights not expressly granted. This licence terminates
              automatically if you breach these Terms.
            </p>
          </div>
        </div>

        <div className={styles.divider} />

        {/* 5 */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>5. Acceptable use — what you may not do</h2>
          <div className={styles.body}>
            <p>You must not use the Service to:</p>
            <ul>
              <li>Upload data that you do not own or have explicit authorisation to process;</li>
              <li>
                Process personal data in violation of applicable data protection laws,
                including the UK GDPR, EU GDPR, or any equivalent legislation;
              </li>
              <li>Attempt to gain unauthorised access to another user&rsquo;s workspace, data, or account;</li>
              <li>
                Probe, scan, or test the vulnerability of the Service or any related
                system, network, or infrastructure;
              </li>
              <li>Introduce malware, ransomware, viruses, worms, or destructive code of any kind;</li>
              <li>
                Conduct automated scraping, crawling, spidering, data mining, or
                machine learning ingestion of any part of the Service without our
                prior written consent;
              </li>
              <li>Send or submit unsolicited communications, spam, or phishing content;</li>
              <li>
                Circumvent, disable, or interfere with authentication, rate limiting,
                access controls, or security features;
              </li>
              <li>Conduct denial-of-service attacks or deliberately overload the Service;</li>
              <li>
                Register multiple accounts to abuse the free trial or bypass account limits;
              </li>
              <li>
                Use the Service in connection with any unlawful, fraudulent, or deceptive
                activity or to facilitate any criminal offence;
              </li>
              <li>
                Impersonate any person or entity, or misrepresent your affiliation with
                any person or entity;
              </li>
              <li>
                Collect or harvest personal data about other users of the Service;
              </li>
              <li>
                Use the Service in any manner that could damage, disable, overburden,
                or impair our servers or networks;
              </li>
              <li>
                Upload files containing formulas, macros, or executable code designed
                to exploit parsing vulnerabilities;
              </li>
              <li>
                Attempt to infer the Service&rsquo;s proprietary algorithms, calculation
                methods, or scoring models through systematic testing or reverse engineering.
              </li>
            </ul>
            <p>
              We may monitor use of the Service to detect violations. Violation of this
              section may result in immediate suspension or permanent termination of
              your account without refund and, where appropriate, referral to law
              enforcement authorities.
            </p>
          </div>
        </div>

        <div className={styles.divider} />

        {/* 6 */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>6. Your data and content</h2>
          <div className={styles.body}>
            <p>
              You retain all ownership rights in the data and files you upload to the
              Service (&ldquo;Your Content&rdquo;).
            </p>
            <p>
              By uploading Your Content you grant us a limited, worldwide, royalty-free
              licence to process, store, and analyse Your Content solely for the purpose
              of providing the Service to you. This licence terminates when you delete
              Your Content or close your account.
            </p>
            <p>You represent and warrant that:</p>
            <ul>
              <li>
                You have all necessary rights, licences, and permissions to upload and
                process Your Content through the Service;
              </li>
              <li>
                Your Content does not violate any applicable law, regulation, or
                third-party rights including intellectual property rights and
                data protection obligations;
              </li>
              <li>
                You have obtained all required consents from individuals whose personal
                data may appear in Your Content (e.g. Jira issue assignees, reporters);
              </li>
              <li>
                Your organisation&rsquo;s Jira data policies permit upload to a third-party
                analytics service.
              </li>
            </ul>
            <p>
              <strong>
                We expressly disclaim responsibility for any data protection or privacy
                violations arising from your decision to upload data containing personal
                information of third parties.
              </strong>
            </p>
          </div>
        </div>

        <div className={styles.divider} />

        {/* 7 */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>7. Feedback</h2>
          <div className={styles.body}>
            <p>
              If you submit ideas, suggestions, bug reports, or other feedback
              (&ldquo;Feedback&rdquo;) through the Service or by any other means, you
              grant us a perpetual, irrevocable, royalty-free, worldwide licence to use,
              copy, modify, and incorporate that Feedback into the Service or any other
              product or service, without any obligation to compensate you or attribute
              the Feedback to you. You waive any moral rights in the Feedback to the
              fullest extent permitted by law.
            </p>
          </div>
        </div>

        <div className={styles.divider} />

        {/* 8 */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>8. Free trial and entitlement</h2>
          <div className={styles.body}>
            <p>
              During the soft-launch period, each account is entitled to one successful
              Jira analysis free of charge, followed by up to 30 days of read access
              to the results.
            </p>
            <ul>
              <li>
                The free trial is intended for legitimate evaluation by individual
                professionals. Creating multiple accounts to circumvent the limit
                is a material breach of these Terms.
              </li>
              <li>
                We reserve the right to modify, limit, or withdraw the free trial
                at any time by providing reasonable notice.
              </li>
              <li>
                We reserve the right to cap the number of accounts that may access
                the Service during the soft-launch period.
              </li>
              <li>
                A failed upload or validation failure does not consume your trial
                entitlement. Only a successful completed analysis does.
              </li>
              <li>
                We reserve the right to introduce paid plans in the future. Continued
                use of the Service after the trial period, subject to any future pricing,
                constitutes acceptance of the applicable pricing terms.
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.divider} />

        {/* 9 */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>9. Intellectual property</h2>
          <div className={styles.body}>
            <p>
              The Service, including its algorithms, calculation methods, scoring models,
              user interface, design, branding, trade secrets, database schema, source
              code, documentation, and all derived materials, is the exclusive intellectual
              property of Ali Abu Ras and is protected by copyright, trade secret, and
              other applicable intellectual property laws of the United Kingdom and
              internationally.
            </p>
            <p>
              No part of these Terms, nor any access to or use of the Service, grants
              you any rights in the Service&rsquo;s intellectual property beyond the limited
              licence in Section 4. All rights not expressly granted are reserved.
            </p>
            <p>
              The Delivery Clarity name, logo, and branding are proprietary marks of
              Ali Abu Ras. You may not use them without prior written permission.
            </p>
          </div>
        </div>

        <div className={styles.divider} />

        {/* 10 */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>10. Availability, modifications, and termination</h2>
          <div className={styles.body}>
            <ul>
              <li>
                <strong>No uptime guarantee.</strong> The Service is provided on an
                &ldquo;as available&rdquo; basis. We do not warrant uninterrupted or
                error-free availability and accept no liability for outages, maintenance
                windows, or service degradation.
              </li>
              <li>
                We reserve the right to modify, suspend, or discontinue any feature
                or the entire Service at any time, with or without notice.
              </li>
              <li>
                We reserve the right to suspend or terminate your account without
                notice if we determine, in our sole discretion, that you have violated
                these Terms, engaged in fraudulent or abusive conduct, or that your
                account poses a risk to other users or the Service.
              </li>
              <li>
                Upon termination for any reason, your licence to use the Service
                immediately ceases and you must stop all use.
              </li>
              <li>
                Sections 6, 7, 9, 11, 12, 13, 14, and 15 survive termination.
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.divider} />

        {/* 11 */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>11. Disclaimer of warranties</h2>
          <div className={styles.body}>
            <p>
              <strong>
                To the fullest extent permitted by applicable law, the Service is
                provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without
                warranties of any kind, whether express, implied, statutory, or
                otherwise.
              </strong>
            </p>
            <p>We expressly disclaim all warranties including, without limitation:</p>
            <ul>
              <li>Implied warranties of merchantability, fitness for a particular purpose, and non-infringement;</li>
              <li>That the Service will meet your requirements or produce specific business outcomes;</li>
              <li>
                That the metrics, scores, recommendations, or forecasts generated are
                accurate, complete, current, or suitable for any business decision;
              </li>
              <li>That the Service will be uninterrupted, error-free, secure, or free of viruses;</li>
              <li>That any errors or defects will be corrected;</li>
              <li>
                That the Service will correctly interpret all Jira export formats,
                field variations, or custom workflow configurations.
              </li>
            </ul>
            <p>
              <strong>
                You use the Service and any output it produces entirely at your own risk.
                No output from the Service should be used as the sole basis for any
                business, staffing, financial, contractual, or operational decision.
              </strong>
            </p>
          </div>
        </div>

        <div className={styles.divider} />

        {/* 12 */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>12. Limitation of liability</h2>
          <div className={styles.body}>
            <p>
              <strong>
                To the fullest extent permitted by applicable law, we shall not be
                liable to you or any third party for:
              </strong>
            </p>
            <ul>
              <li>Any indirect, incidental, special, consequential, exemplary, or punitive damages;</li>
              <li>Loss of profits, revenue, business, contracts, or anticipated savings;</li>
              <li>Loss of data or corruption of data;</li>
              <li>Loss of goodwill or reputation;</li>
              <li>Business interruption;</li>
              <li>Wasted management or staff time;</li>
              <li>
                Any loss arising from your reliance on the accuracy of metrics,
                scores, recommendations, or forecasts;
              </li>
              <li>Any loss arising from the actions or omissions of third-party services we use;</li>
              <li>
                Any loss arising from unauthorised access to your account or data
                where the cause is attributable to your failure to maintain credential
                security.
              </li>
            </ul>
            <p>
              <strong>
                In all cases, our total aggregate liability to you arising out of or
                in connection with these Terms or the Service, regardless of the
                cause of action, shall not exceed the greater of:
                (a) the total fees you paid us in the twelve months preceding the
                claim, or (b) fifty pounds sterling (£50 GBP).
              </strong>
            </p>
            <p>
              Nothing in these Terms excludes or limits our liability for death or
              personal injury caused by our negligence, fraud, fraudulent
              misrepresentation, or any other liability that cannot be excluded
              by law.
            </p>
          </div>
        </div>

        <div className={styles.divider} />

        {/* 13 */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>13. Indemnification</h2>
          <div className={styles.body}>
            <p>
              You agree to defend, indemnify, and hold harmless Ali Abu Ras and any
              officers, agents, partners, employees, and successors from and against any
              and all claims, damages, losses, costs, and expenses (including reasonable
              legal fees) arising out of or relating to:
            </p>
            <ul>
              <li>Your use of or access to the Service;</li>
              <li>Your violation of these Terms;</li>
              <li>
                Your violation of any applicable law, regulation, or third-party right,
                including data protection obligations and intellectual property rights;
              </li>
              <li>
                Your uploading or processing of data that infringes or violates
                the rights of any third party;
              </li>
              <li>
                Any claim by your organisation or any regulator arising from your
                use of Jira data that you were not authorised to process.
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.divider} />

        {/* 14 */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>14. Third-party services and links</h2>
          <div className={styles.body}>
            <p>
              The Service uses third-party infrastructure providers including Render
              (hosting), Neon (database), and Resend or SMTP providers (email). We
              are not responsible for the availability, security, or terms of these
              providers beyond our contractual obligations to you.
            </p>
            <p>
              The Service may contain links to third-party websites or services that
              are not owned or controlled by us. We have no control over and accept
              no responsibility for the content, privacy practices, or terms of any
              third-party site or service. Accessing third-party links is entirely
              at your own risk.
            </p>
          </div>
        </div>

        <div className={styles.divider} />

        {/* 15 */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>15. Dispute resolution and governing law</h2>
          <div className={styles.body}>
            <p>
              These Terms and any dispute or claim arising out of or in connection with
              them (including non-contractual disputes or claims) shall be governed by
              and construed in accordance with the laws of England and Wales.
            </p>
            <p>
              Before commencing any formal proceedings, both parties agree to attempt
              to resolve any dispute in good faith by negotiation for a period of 30
              days following written notice of the dispute.
            </p>
            <p>
              Subject to the above, each party irrevocably agrees that the courts of
              England and Wales shall have exclusive jurisdiction to settle any dispute
              or claim arising out of or in connection with these Terms.
            </p>
            <p>
              <strong>
                If you are a consumer in the European Union, you may also be entitled
                to use the EU Online Dispute Resolution platform at
                https://ec.europa.eu/consumers/odr.
              </strong>
            </p>
          </div>
        </div>

        <div className={styles.divider} />

        {/* 16 */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>16. General provisions</h2>
          <div className={styles.body}>
            <p>
              <strong>Entire agreement.</strong> These Terms and the Privacy Policy
              constitute the entire agreement between you and us regarding the Service
              and supersede all prior agreements, representations, and understandings.
            </p>
            <p>
              <strong>Severability.</strong> If any provision of these Terms is found
              to be unenforceable, the remaining provisions shall continue in full
              force and effect.
            </p>
            <p>
              <strong>No waiver.</strong> Our failure to enforce any right or provision
              of these Terms shall not constitute a waiver of that right or provision.
            </p>
            <p>
              <strong>Force majeure.</strong> We shall not be liable for any failure
              or delay in performance resulting from causes beyond our reasonable
              control, including acts of God, internet outages, third-party service
              failures, government actions, or cyberattacks.
            </p>
            <p>
              <strong>Assignment.</strong> You may not assign or transfer your rights
              or obligations under these Terms without our prior written consent. We
              may assign our rights and obligations without restriction.
            </p>
            <p>
              <strong>Changes to Terms.</strong> We may update these Terms at any time.
              Material changes will be communicated by updating the effective date above
              and, where possible, by email notification. Your continued use of the
              Service after the effective date of any change constitutes acceptance of
              the updated Terms. If you do not agree, you must stop using the Service
              and request account deletion.
            </p>
            <p>
              <strong>Language.</strong> These Terms are drafted in English. Any
              translations are provided for convenience only. In the event of any
              conflict, the English version shall prevail.
            </p>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.contactBox}>
          <strong>Contact</strong><br />
          For questions about these Terms or to report a violation, contact:<br />
          Ali Abu Ras · <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a><br /><br />
          <Link href="/privacy">Read our Privacy Policy →</Link>
        </div>
      </div>
    </div>
  );
}
