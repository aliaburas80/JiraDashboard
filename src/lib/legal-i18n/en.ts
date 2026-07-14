import type { LegalTranslation } from './index';

export const en: LegalTranslation = {
  ui: {
    downloadPdf:            'Download PDF',
    autoTranslationWarning: '',
    backToRegister:         '← Back to registration',
    effectiveDate:          'Effective date',
    version:                'Version',
    contact:                'Contact',
    readTerms:              'Read our Terms of Use →',
    readPrivacy:            'Read our Privacy Policy →',
    supervisoryAuthority:   'Supervisory Authority (UK)',
    selectLanguage:         'Select language',
    operator:               'Operator',
    controller:             'Controller',
  },

  terms: {
    badge: 'Terms of Use',
    title: 'Terms of Use',
    intro: 'Please read these Terms carefully before using Delivery Clarity. By creating an account, clicking "I agree", or accessing any part of the service, you confirm that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree, do not use the service.',
    sections: [
      {
        title: '1. About the service',
        blocks: [
          { p: 'Delivery Clarity is a private, software-as-a-service delivery analytics platform that processes Jira CSV and Excel exports to generate sprint health metrics, flow efficiency scores, release readiness assessments, and delivery coaching recommendations ("the Service").' },
          { p: 'The Service is operated by Ali Abu Ras, an individual based in Jordan ("we", "us", "our").' },
          { b: 'The Service is provided for informational and analytical purposes only.' },
          { p: 'It does not constitute professional project management, financial, legal, compliance, or investment advice. All metrics, recommendations, and forecasts are produced algorithmically from the data you provide and carry no warranty of accuracy, completeness, or fitness for any particular business decision.' },
        ],
      },
      {
        title: '2. Eligibility',
        blocks: [
          { ul: [
            'You must be at least 18 years old to use the Service.',
            'You must have the legal capacity to enter into a binding contract.',
            'If you use the Service on behalf of an organisation, you represent that you have authority to bind that organisation to these Terms.',
            'The Service is intended for professional business use by agile practitioners, project managers, delivery managers, and related roles.',
            'The Service is not available to persons who have previously had their account suspended or terminated for breach of these Terms.',
          ]},
        ],
      },
      {
        title: '3. Account registration and security',
        blocks: [
          { ul: [
            'You must provide accurate, complete, and current information when creating your account and keep it updated.',
            'You may hold only one account. Duplicate accounts are prohibited.',
            'You are solely responsible for all activity that occurs under your account credentials.',
            'You must choose a strong, unique password and must not share your login credentials with any other person or entity.',
            'You must notify us immediately at ali.aburas@deliveryclarity.app if you believe your account has been compromised.',
            'We reserve the right to suspend or terminate any account we reasonably believe has been accessed by an unauthorised party.',
            'You must verify your email address before accessing analysis features. We reserve the right to require re-verification at any time.',
          ]},
        ],
      },
      {
        title: '4. Licence to use the service',
        blocks: [
          { p: 'Subject to your compliance with these Terms, we grant you a limited, non-exclusive, non-transferable, non-sublicensable, revocable licence to access and use the Service for your internal business purposes.' },
          { p: 'This licence does not include the right to:' },
          { ul: [
            'Resell, sublicense, or provide the Service as a bureau or managed service to third parties;',
            'Copy, reproduce, or distribute any part of the Service;',
            'Reverse-engineer, decompile, disassemble, or attempt to derive the source code or algorithms;',
            'Create derivative works based on the Service;',
            'Frame or mirror the Service on any other website or application;',
            'Remove or obscure any proprietary notices or branding.',
          ]},
          { p: 'We reserve all rights not expressly granted. This licence terminates automatically if you breach these Terms.' },
        ],
      },
      {
        title: '5. Acceptable use — what you may not do',
        blocks: [
          { p: 'You must not use the Service to:' },
          { ul: [
            'Upload data that you do not own or have explicit authorisation to process;',
            'Process personal data in violation of applicable data protection laws, including the UK GDPR, EU GDPR, or any equivalent legislation;',
            'Attempt to gain unauthorised access to another user\'s workspace, data, or account;',
            'Probe, scan, or test the vulnerability of the Service or any related system, network, or infrastructure;',
            'Introduce malware, ransomware, viruses, worms, or destructive code of any kind;',
            'Conduct automated scraping, crawling, spidering, data mining, or machine learning ingestion of any part of the Service without our prior written consent;',
            'Circumvent, disable, or interfere with authentication, rate limiting, access controls, or security features;',
            'Conduct denial-of-service attacks or deliberately overload the Service;',
            'Register multiple accounts to abuse the free trial or bypass account limits;',
            'Use the Service in connection with any unlawful, fraudulent, or deceptive activity;',
            'Impersonate any person or entity, or misrepresent your affiliation;',
            'Collect or harvest personal data about other users of the Service;',
            'Upload files containing formulas, macros, or executable code designed to exploit parsing vulnerabilities;',
            'Attempt to infer the Service\'s proprietary algorithms or scoring models through systematic testing or reverse engineering.',
          ]},
          { p: 'Violation of this section may result in immediate suspension or permanent termination of your account without refund and, where appropriate, referral to law enforcement authorities.' },
        ],
      },
      {
        title: '6. Your data and content',
        blocks: [
          { p: 'You retain all ownership rights in the data and files you upload to the Service ("Your Content").' },
          { p: 'By uploading Your Content you grant us a limited, worldwide, royalty-free licence to process, store, and analyse Your Content solely for the purpose of providing the Service to you. This licence terminates when you delete Your Content or close your account.' },
          { p: 'You represent and warrant that: you have all necessary rights, licences, and permissions to upload and process Your Content; Your Content does not violate any applicable law or third-party rights; you have obtained all required consents from individuals whose personal data may appear in Your Content; and your organisation\'s Jira data policies permit upload to a third-party analytics service.' },
          { b: 'We expressly disclaim responsibility for any data protection or privacy violations arising from your decision to upload data containing personal information of third parties.' },
        ],
      },
      {
        title: '7. Feedback',
        blocks: [
          { p: 'If you submit ideas, suggestions, bug reports, or other feedback ("Feedback") through the Service or by any other means, you grant us a perpetual, irrevocable, royalty-free, worldwide licence to use, copy, modify, and incorporate that Feedback into the Service or any other product, without any obligation to compensate or attribute you. You waive any moral rights in the Feedback to the fullest extent permitted by law.' },
        ],
      },
      {
        title: '8. Free trial and entitlement',
        blocks: [
          { p: 'During the soft-launch period, each account is entitled to one successful Jira analysis free of charge, followed by up to 30 days of read access to the results.' },
          { ul: [
            'Creating multiple accounts to circumvent the limit is a material breach of these Terms.',
            'We reserve the right to modify, limit, or withdraw the free trial at any time by providing reasonable notice.',
            'We reserve the right to cap the number of accounts that may access the Service during the soft-launch period.',
            'A failed upload or validation failure does not consume your trial entitlement. Only a successful completed analysis does.',
            'We reserve the right to introduce paid plans in the future. Continued use of the Service after the trial period, subject to any future pricing, constitutes acceptance of the applicable pricing terms.',
          ]},
        ],
      },
      {
        title: '9. Intellectual property — all rights reserved',
        blocks: [
          { b: '© 2026 Ali Abu Ras. All rights reserved.' },
          { p: 'The Service — including its source code, algorithms, calculation methods, scoring models, metric taxonomy, coaching methodology, feature architecture, user interface, visual design, trade dress, database schema, data pipeline, documentation, marketing materials, and all derived materials — is the exclusive intellectual property of Ali Abu Ras, protected by copyright, design right, database right, trade mark, trade secret, unfair competition, and all other applicable intellectual property laws.' },
          { p: 'The output produced by the Service — including reports, visualisations, metric scores, delivery recommendations, and coaching insights — constitutes derivative works of the Service and is owned by Ali Abu Ras. Your use of those outputs is subject to the licence in Section 4. You may not republish, sell, or distribute those outputs as the basis of a competing analytical product.' },
          { p: 'No part of these Terms, nor any access to or use of the Service, grants you any licence, right, title, or interest in any intellectual property of Ali Abu Ras beyond the strictly limited licence in Section 4. No implied licence arises from use of the Service, access to any output, or any course of conduct.' },
          { p: 'The Delivery Clarity name, logo, product name, visual identity, and branding are proprietary marks of Ali Abu Ras. You may not use them without prior written permission.' },
          { p: 'The database of metric definitions, threshold configurations, workflow templates, and coaching libraries is protected as a database under the Copyright and Rights in Databases Regulations 1997 (UK) and Directive 96/9/EC (EU). Extraction or re-utilisation of a substantial part of that database is prohibited.' },
          { b: 'Any individual or entity who creates a product or service substantially similar to Delivery Clarity, having previously used or accessed the Service, may be presumed to have misappropriated proprietary trade secrets and confidential information. Such parties may be required to account for all profits and shall be exposed to all available civil and criminal remedies.' },
        ],
      },
      {
        title: '10. Trade secrets and confidential information',
        blocks: [
          { p: 'The following elements of the Service constitute proprietary trade secrets of Ali Abu Ras, protected under the Trade Secrets (Enforcement, etc.) Regulations 2018 (UK), EU Trade Secrets Directive 2016/943, and equivalent legislation in all applicable jurisdictions:' },
          { ul: [
            'The algorithms and mathematical formulas used to calculate sprint health, delivery predictability, flow efficiency, release readiness, ownership risk, epic readiness, work-item age, throughput trends, and all other analytical scores;',
            'The weighting systems, threshold definitions, normalisation methods, and decision trees that produce recommendations and coaching insights;',
            'The data processing pipeline, validation logic, schema design, and import architecture;',
            'The metric taxonomy, analytical framework, and the complete product methodology that links raw Jira data to actionable delivery intelligence;',
            'The feature architecture, engineering decisions, technology choices, and implementation approach;',
            'The configuration system, widget registry, navigation structure, and product composition strategy.',
          ]},
          { p: 'By accessing the Service you acknowledge that you may be exposed to confidential information ("Confidential Information") that has economic value precisely because it is not publicly known. You agree to:' },
          { ul: [
            'Keep all Confidential Information strictly confidential and protect it with at least the same degree of care you use for your own most sensitive information, but no less than reasonable care;',
            'Not disclose, describe, document, publish, or communicate any Confidential Information to any third party without our prior written consent;',
            'Not use Confidential Information for any purpose other than using the Service within the scope of these Terms;',
            'Notify us immediately at ali.aburas@deliveryclarity.app if you become aware of any actual or suspected unauthorised disclosure of Confidential Information.',
          ]},
          { b: 'This obligation of confidentiality survives termination or expiry of your account for a period of seven (7) years, or for the maximum period permitted by applicable law, whichever is longer.' },
        ],
      },
      {
        title: '11. Prohibited competitive and imitative activity',
        blocks: [
          { p: 'In consideration of your access to the Service and the proprietary information disclosed through that access, you agree that you will not, without our prior express written consent:' },
          { ul: [
            'Develop, design, architect, build, contribute to, market, fund, or invest in any product or service that is substantially similar to, directly competitive with, or meaningfully inspired by Delivery Clarity;',
            'Reproduce, clone, imitate, or create a substantially similar version of the Service\'s user interface, feature set, analytical framework, scoring taxonomy, product workflow, coaching methodology, visual design, or overall user experience;',
            'Use screenshots, screen recordings, session documentation, feature lists, or any other capture of the Service — whether your own or obtained from another user — for the purpose of facilitating the development of any competing or imitative product;',
            'Describe, pitch, brief, or instruct any developer, designer, investor, product manager, employer, or third party on the specific workings, features, algorithms, or methodology of the Service for the purpose of replication or competition;',
            'Engage, employ, contract, advise, or otherwise direct any person or entity to develop any product based on, substantially inspired by, or designed to replace the Service.',
          ]},
          { p: 'You acknowledge that:' },
          { ul: [
            'Your use of the Service necessarily discloses confidential and proprietary information that has substantial commercial value;',
            'This restriction constitutes a reasonable and proportionate contractual condition of access, not an unreasonable restraint of trade;',
            'Violation of this section would constitute misappropriation of trade secrets, breach of confidence, and breach of this agreement, and would expose you to all available legal remedies.',
          ]},
          { b: 'The fact that a person accessed the Service prior to developing a substantially similar product is itself evidence of potential misappropriation and may be admitted in any legal proceeding.' },
        ],
      },
      {
        title: '12. Anti-circumvention and technical protection measures',
        blocks: [
          { p: 'The Service is protected by technological protection measures ("TPMs") under, without limitation:' },
          { ul: [
            'Chapter III of the Copyright, Designs and Patents Act 1988 (UK) and the Copyright and Related Rights Regulations 2003;',
            'EU Copyright Directive 2001/29/EC (Articles 6 and 7) and national implementations in all EU member states;',
            'Digital Millennium Copyright Act 1998 (DMCA), for access from United States territory;',
            'Equivalent national anti-circumvention legislation in all jurisdictions in which the Service is accessed.',
          ]},
          { p: 'You must not:' },
          { ul: [
            'Circumvent, bypass, disable, crack, decode, or remove any authentication mechanism, encryption, access control, rate limiting system, or other TPM protecting the Service;',
            'Reverse-engineer, decompile, disassemble, or otherwise reconstruct the source code, algorithms, scoring logic, or database schema of the Service by any means, including static or dynamic analysis;',
            'Intercept, monitor, capture, or replay network traffic between your client and the Service for any purpose other than your own legitimate debugging;',
            'Attempt to access server processes, file storage, internal APIs, database connections, or infrastructure components through any means not expressly provided by the Service interface;',
            'Use any automated tool, bot, script, crawler, or data-extraction utility to catalogue, map, or reproduce features, content, or functionality;',
            'Analyse usage patterns or API call sequences to infer proprietary algorithmic behaviour.',
          ]},
          { b: 'Circumvention of TPMs may constitute a criminal offence under applicable law, in addition to exposing you to civil liability under these Terms.' },
        ],
      },
      {
        title: '13. International intellectual property framework',
        blocks: [
          { p: 'The intellectual property embodied in the Service is recognised and protected under the following international frameworks and conventions, enforceable in every jurisdiction where the Service is accessed or where a violation is committed:' },
          { ul: [
            'Berne Convention for the Protection of Literary and Artistic Works (179 contracting states): automatic copyright protection exists in all member states without registration or formality. The source code, documentation, visual design, and content of the Service are all protected literary and artistic works from the moment of creation;',
            'Agreement on Trade-Related Aspects of Intellectual Property Rights (TRIPS Agreement, WTO): minimum enforceable IP standards apply in all 164 WTO member states, including copyright, trade marks, trade secrets, and design rights;',
            'WIPO Copyright Treaty (WCT) and WIPO Performances and Phonograms Treaty (WPPT): extended digital copyright protection across all contracting parties;',
            'Paris Convention for the Protection of Industrial Property: trade mark and design right protections enforceable in all 179 member states;',
            'Madrid Protocol for the International Registration of Marks: trade mark protections potentially registered across multiple jurisdictions;',
            'EU Directive 2016/943 on Trade Secrets: protection of undisclosed know-how and business information with full civil remedies across all EU member states;',
            'EU Database Directive 96/9/EC and UK equivalent: sui generis database right protecting the substantial investment in compiling and presenting the Service\'s analytical datasets;',
            'Applicable national copyright, trade mark, design right, unfair competition, misappropriation, and trade secret laws in every jurisdiction from which the Service is accessed.',
          ]},
          { b: 'These protections apply globally, regardless of your location, and irrespective of whether any specific right has been registered in your country. Violation of these Terms constitutes a violation of applicable law in your jurisdiction and may expose you to civil and criminal liability wherever you are located.' },
        ],
      },
      {
        title: '14. Injunctive and equitable relief',
        blocks: [
          { p: 'You acknowledge and expressly agree that:' },
          { ul: [
            'Any actual or threatened breach of Sections 9, 10, 11, or 12 of these Terms would cause immediate, substantial, and irreparable harm to Ali Abu Ras for which monetary damages alone would be an inadequate remedy;',
            'Ali Abu Ras is entitled to seek, without limitation, emergency, preliminary, interim, or permanent injunctive relief, specific performance, account of profits, delivery up and destruction of infringing materials, and any other equitable remedy from any court of competent jurisdiction — without the necessity of proving actual damage and without any requirement to post a bond, security deposit, or other undertaking as a precondition to obtaining such relief;',
            'You irrevocably consent to the jurisdiction of the courts of England and Wales, the courts of your country of residence or establishment, and any court in any jurisdiction where an infringement occurs or threatens to occur, for the sole and limited purpose of granting, enforcing, or recognising such injunctive or equitable relief;',
            'The existence of any dispute resolution process, arbitration clause, or negotiation obligation in these Terms shall not prevent or delay Ali Abu Ras from seeking and obtaining immediate equitable relief from any competent court;',
            'Any injunction or equitable relief granted to Ali Abu Ras shall not be the exclusive remedy, and Ali Abu Ras may simultaneously pursue all other available legal remedies including damages, an account of profits, and any applicable statutory or criminal remedy.',
          ]},
        ],
      },
      {
        title: '15. Availability, modifications, and termination',
        blocks: [
          { ul: [
            'No uptime guarantee. The Service is provided on an "as available" basis. We do not warrant uninterrupted or error-free availability and accept no liability for outages, maintenance windows, or service degradation.',
            'We reserve the right to modify, suspend, or discontinue any feature or the entire Service at any time, with or without notice.',
            'We reserve the right to suspend or terminate your account without notice if we determine, in our sole discretion, that you have violated these Terms, engaged in fraudulent or abusive conduct, or that your account poses a risk to other users or the Service.',
            'Upon termination for any reason, your licence to use the Service immediately ceases and you must stop all use.',
            'Sections 6, 7, 9, 10, 11, 12, 13, 14, 16, 17, 18, 19, and 20 survive termination.',
          ]},
        ],
      },
      {
        title: '16. Disclaimer of warranties',
        blocks: [
          { b: 'To the fullest extent permitted by applicable law, the Service is provided "as is" and "as available" without warranties of any kind, whether express, implied, statutory, or otherwise.' },
          { p: 'We expressly disclaim all warranties including, without limitation:' },
          { ul: [
            'Implied warranties of merchantability, fitness for a particular purpose, and non-infringement;',
            'That the Service will meet your requirements or produce specific business outcomes;',
            'That the metrics, scores, recommendations, or forecasts generated are accurate, complete, current, or suitable for any business decision;',
            'That the Service will be uninterrupted, error-free, secure, or free of viruses;',
            'That any errors or defects will be corrected;',
            'That the Service will correctly interpret all Jira export formats, field variations, or custom workflow configurations.',
          ]},
          { b: 'You use the Service and any output it produces entirely at your own risk. No output from the Service should be used as the sole basis for any business, staffing, financial, contractual, or operational decision.' },
        ],
      },
      {
        title: '17. Limitation of liability',
        blocks: [
          { b: 'To the fullest extent permitted by applicable law, we shall not be liable to you or any third party for:' },
          { ul: [
            'Any indirect, incidental, special, consequential, exemplary, or punitive damages;',
            'Loss of profits, revenue, business, contracts, or anticipated savings;',
            'Loss of data or corruption of data;',
            'Loss of goodwill or reputation;',
            'Business interruption;',
            'Wasted management or staff time;',
            'Any loss arising from your reliance on the accuracy of metrics, scores, recommendations, or forecasts;',
            'Any loss arising from the actions or omissions of third-party services we use;',
            'Any loss arising from unauthorised access to your account where the cause is attributable to your failure to maintain credential security.',
          ]},
          { b: 'In all cases, our total aggregate liability to you arising out of or in connection with these Terms or the Service shall not exceed the greater of: (a) the total fees you paid us in the twelve months preceding the claim, or (b) fifty pounds sterling (£50 GBP).' },
          { p: 'Nothing in these Terms excludes or limits our liability for death or personal injury caused by our negligence, fraud, fraudulent misrepresentation, or any other liability that cannot be excluded by law.' },
        ],
      },
      {
        title: '18. Indemnification',
        blocks: [
          { p: 'You agree to defend, indemnify, and hold harmless Ali Abu Ras and any officers, agents, partners, employees, and successors from and against any and all claims, damages, losses, costs, and expenses (including reasonable legal fees) arising out of or relating to:' },
          { ul: [
            'Your use of or access to the Service;',
            'Your violation of these Terms;',
            'Your violation of any applicable law, regulation, or third-party right, including data protection obligations and intellectual property rights;',
            'Your uploading or processing of data that infringes or violates the rights of any third party;',
            'Any claim by your organisation or any regulator arising from your use of Jira data that you were not authorised to process.',
          ]},
        ],
      },
      {
        title: '19. Third-party services and links',
        blocks: [
          { p: 'The Service uses third-party infrastructure providers including Render (hosting), Neon (database), and Resend or SMTP providers (email). We are not responsible for the availability, security, or terms of these providers beyond our contractual obligations to you.' },
          { p: 'The Service may contain links to third-party websites or services that are not owned or controlled by us. We have no control over and accept no responsibility for the content, privacy practices, or terms of any third-party site or service. Accessing third-party links is entirely at your own risk.' },
        ],
      },
      {
        title: '20. Dispute resolution and governing law',
        blocks: [
          { p: 'These Terms and any dispute or claim arising out of or in connection with them shall be governed by and construed in accordance with the laws of England and Wales.' },
          { p: 'Before commencing any formal proceedings, both parties agree to attempt to resolve any dispute in good faith by negotiation for a period of 30 days following written notice of the dispute.' },
          { p: 'Subject to the above, each party irrevocably agrees that the courts of England and Wales shall have exclusive jurisdiction to settle any dispute or claim arising out of or in connection with these Terms.' },
          { note: 'If you are a consumer in the European Union, you may also be entitled to use the EU Online Dispute Resolution platform at ec.europa.eu/consumers/odr.' },
        ],
      },
      {
        title: '21. General provisions',
        blocks: [
          { b: 'Entire agreement.' },
          { p: 'These Terms and the Privacy Policy constitute the entire agreement between you and us regarding the Service and supersede all prior agreements, representations, and understandings.' },
          { b: 'Severability.' },
          { p: 'If any provision of these Terms is found to be unenforceable, the remaining provisions shall continue in full force and effect.' },
          { b: 'No waiver.' },
          { p: 'Our failure to enforce any right or provision of these Terms shall not constitute a waiver of that right or provision.' },
          { b: 'Force majeure.' },
          { p: 'We shall not be liable for any failure or delay in performance resulting from causes beyond our reasonable control, including acts of God, internet outages, third-party service failures, government actions, or cyberattacks.' },
          { b: 'Assignment.' },
          { p: 'You may not assign or transfer your rights or obligations under these Terms without our prior written consent. We may assign our rights and obligations without restriction.' },
          { b: 'Changes to Terms.' },
          { p: 'We may update these Terms at any time. Material changes will be communicated by updating the effective date above and, where possible, by email notification. Your continued use of the Service after the effective date of any change constitutes acceptance of the updated Terms. If you do not agree, you must stop using the Service and contact us to request deletion of your account.' },
          { b: 'Language.' },
          { p: 'These Terms are drafted in English. Any translations are provided for convenience only. In the event of any conflict, the English version shall prevail.' },
        ],
      },
    ],
  },

  privacy: {
    badge: 'Privacy Policy',
    title: 'Privacy Policy',
    intro: 'This Privacy Policy explains how Delivery Clarity, operated by Ali Abu Ras ("we", "us", "our", "the Controller"), collects, uses, stores, discloses, and protects personal data when you use the Service. It also sets out your rights under the UK General Data Protection Regulation ("UK GDPR"), the Data Protection Act 2018, and equivalent legislation where applicable. If you do not agree with this Policy, you must not use the Service.',
    sections: [
      {
        title: '1. Who we are and how to contact us',
        blocks: [
          { p: 'The data controller for all personal data processed through Delivery Clarity is:' },
          { ul: ['Name: Ali Abu Ras', 'Operating as: Delivery Clarity', 'Email: ali.aburas@deliveryclarity.app', 'Country: Jordan'] },
          { p: 'For all data protection enquiries, rights requests, or complaints, please contact us at the email address above.' },
        ],
      },
      {
        title: '2. Data we collect and why',
        blocks: [
          { b: 'Account and registration data' },
          { ul: ['Full name and email address', 'Hashed password (never stored in plaintext)', 'Professional persona selected at signup', 'Date and version of Terms and Privacy Policy acceptance', 'Email verification status and login timestamps'] },
          { note: 'Lawful basis: Performance of a contract.' },
          { b: 'Jira export data you upload' },
          { ul: ['CSV or Excel files processed in your private workspace', 'Issue keys, types, statuses, date fields, story points, sprints, assignees', 'Derived metrics: lead time, cycle time, throughput, velocity, flow scores', 'File metadata: name, size, type, row count, upload timestamp, health score'] },
          { note: 'Lawful basis: Performance of a contract.' },
          { b: 'Your Jira data is never used for any purpose other than generating your private analytics reports. It is never included in error logs, feedback reports, analytics telemetry, AI training, or any external communication.' },
          { b: 'Security and usage data' },
          { ul: ['IP address — used for rate limiting and security; not stored permanently', 'Login and logout timestamps, audit events, login attempt records (pruned after 1 hour)', 'User agent / browser family'] },
          { note: 'Lawful basis: Legitimate interests (protecting the Service and other users from abuse).' },
          { b: 'Error and performance data' },
          { ul: ['Client-side error messages and sanitised stack traces (no file paths, no user data)', 'Page and component where errors occurred', 'Application version at the time of the error'] },
          { note: 'Lawful basis: Legitimate interests (maintaining stability and reliability of the Service).' },
          { b: 'Feedback you voluntarily submit' },
          { ul: ['Category and message text submitted through the in-app feedback form', 'Impact level, page location, browser family, application version', 'Your email address — only if you explicitly opt in to being contacted'] },
          { note: 'Lawful basis: Consent.' },
          { b: 'Data we do NOT collect' },
          { ul: ['No payment card data or financial information', 'No advertising cookies or third-party tracking pixels', 'No data from children under 18', 'No session replay or heatmap data', 'No Jira data sent to any AI, machine learning, or analytics service'] },
        ],
      },
      {
        title: '3. Automated decision-making and profiling',
        blocks: [
          { p: 'We do not make any automated decisions that produce legal or similarly significant effects about you personally. The metrics and scores generated by the Service are analytical outputs applied to project data — not decisions about individuals.' },
        ],
      },
      {
        title: '4. How we share your data',
        blocks: [
          { p: 'We do not sell, rent, or trade your personal data to any third party. We share data only in the following limited circumstances.' },
          { b: 'Infrastructure sub-processors' },
          { ul: [
            'Render Services Inc. (hosting) — USA. All application data in transit and at rest.',
            'Neon Inc. (PostgreSQL database) — USA East. All structured account and workspace data.',
            'Resend Inc. / SMTP providers (email) — USA. Your name and email for transactional emails only.',
            'Amazon Web Services S3 (optional cloud backup) — configurable location. Encrypted backup snapshots.',
          ]},
          { p: 'All sub-processors are bound by contractual obligations restricting their use of your data to performing services on our behalf.' },
          { b: 'Legal requirements' },
          { p: 'We may disclose your personal data if required to do so by law, court order, or at the request of a competent regulatory or law enforcement authority.' },
          { b: 'Business transfers' },
          { p: 'In the event that the Service or its assets are transferred to a third party, your data may be transferred as part of that transaction. We will notify you prior to your data being transferred and becoming subject to a different privacy policy.' },
        ],
      },
      {
        title: '5. International data transfers',
        blocks: [
          { p: 'Our primary infrastructure is located in the United States. Transfers of personal data from the UK or European Economic Area to the USA are made in reliance on Standard Contractual Clauses (SCCs) incorporated into our sub-processor agreements, and/or the UK International Data Transfer Agreement (IDTA) framework where appropriate.' },
          { p: 'You may request details of the specific transfer mechanisms we rely on by contacting ali.aburas@deliveryclarity.app.' },
        ],
      },
      {
        title: '6. Data retention',
        blocks: [
          { ul: [
            'Account data: retained while active; deleted within 30 days of confirmed account deletion.',
            'Jira import data and metrics: retained until deleted by you or upon account deletion.',
            'Dashboard snapshots: retained until deleted by you or upon account deletion.',
            'Audit events: 12 months from creation.',
            'Error records: 90 days.',
            'Login attempt records: pruned after 1 hour.',
            'Consent records: lifetime of account plus 6 years for legal compliance purposes.',
          ]},
          { p: 'The categories above are our retention targets. Today, an administrator can clear Jira import data and dashboard snapshots using an in-app cleanup tool, but this does not run on an automatic schedule; the other categories above do not yet have dedicated deletion tooling. We are working towards automated enforcement of these targets.' },
          { p: 'We may retain certain data for longer periods where required by law, regulation, or for the establishment, exercise, or defence of legal claims.' },
        ],
      },
      {
        title: '7. Cookies and session data',
        blocks: [
          { p: 'We use a single first-party session cookie:' },
          { ul: ['Name: dc_session', 'Purpose: Maintains your authenticated login state', 'Type: Strictly necessary (no opt-out required)', 'Attributes: HttpOnly, Secure (HTTPS only), SameSite=Strict', 'Expiry: Session (cleared on logout or browser close)'] },
          { p: 'We do not set any analytics, advertising, or third-party cookies. No cookie consent banner is displayed because we use only a strictly necessary session cookie that cannot be refused without preventing use of the Service.' },
        ],
      },
      {
        title: '8. Security measures',
        blocks: [
          { ul: [
            'Passwords hashed using bcrypt with a minimum work factor of 12.',
            'All data in transit encrypted using TLS 1.2 or higher (HTTPS enforced).',
            'Session cookies are HttpOnly, Secure, and SameSite=Strict.',
            'Stored Jira API credentials encrypted using AES-256-GCM.',
            'Database connections encrypted in transit.',
            'Rate limiting on all authentication and data submission endpoints.',
            'All data queries scoped to the authenticated user\'s workspace.',
            'Audit logging of all sensitive account and data actions.',
            'Server-side session validation on every authenticated request.',
          ]},
          { b: 'Despite our security measures, no system is 100% secure. In the event of a data breach that is likely to result in a risk to your rights and freedoms, we will notify the relevant supervisory authority within 72 hours and notify affected users without undue delay, as required by law.' },
        ],
      },
      {
        title: '9. Children\'s privacy',
        blocks: [
          { p: 'The Service is not directed at, and is not intended for use by, anyone under the age of 18. We do not knowingly collect personal data from children under 18. If we become aware that we have collected personal data from a child under 18, we will delete it promptly.' },
          { p: 'If you believe a child has provided us with personal data, please contact us immediately at ali.aburas@deliveryclarity.app.' },
        ],
      },
      {
        title: '10. Your rights',
        blocks: [
          { p: 'Under the UK GDPR and applicable data protection law, you have the following rights:' },
          { ul: [
            'Right of access (Article 15): Request a copy of the personal data we hold about you.',
            'Right to rectification (Article 16): Request correction of inaccurate or incomplete data.',
            'Right to erasure (Article 17): Request deletion of your personal data, subject to our legal retention obligations.',
            'Right to restriction of processing (Article 18): Request that we restrict processing of your data in certain circumstances.',
            'Right to data portability (Article 20): Request your data in a structured, machine-readable format where processing is based on consent or contract.',
            'Right to object (Article 21): Object to processing based on legitimate interests at any time.',
            'Right to withdraw consent: Where we process data based on consent, you may withdraw consent at any time.',
            'Right not to be subject to automated decision-making (Article 22): We do not make automated decisions that produce legal effects about you.',
          ]},
          { p: 'To exercise any of these rights, please contact ali.aburas@deliveryclarity.app. We will respond within one month.' },
          { b: 'Right to lodge a complaint: If you believe we have processed your data unlawfully, you have the right to lodge a complaint with the Information Commissioner\'s Office (ICO) at ico.org.uk, or with your local data protection authority if you are in the EEA.' },
        ],
      },
      {
        title: '11. Your Jira data — specific commitments',
        blocks: [
          { p: 'Because the sensitivity of your Jira export data is central to the Service, we make the following specific commitments:' },
          { ul: [
            'Your uploaded Jira data is processed only to generate your private analytics.',
            'It is stored in a workspace accessible only to you.',
            'It is not shared with any third-party analytics, advertising, or AI service.',
            'It is not used to train any machine learning or AI model.',
            'It does not appear in error logs, crash reports, or any monitoring system.',
            'It does not appear in feedback reports or support tickets.',
            'It is not transferred between user workspaces.',
            'It is deleted when you delete your import log or close your account.',
            'Staff do not access your Jira data unless strictly required for a support request you have raised and with your explicit permission.',
          ]},
        ],
      },
      {
        title: '12. Changes to this policy',
        blocks: [
          { p: 'We may update this Privacy Policy from time to time. The current version and effective date are always displayed at the top of this page.' },
          { p: 'For material changes — such as new categories of data, new third-party processors, new purposes, or changes to your rights — we will provide prominent notice within the Service and, where appropriate, by email.' },
          { p: 'If changes require fresh consent under applicable law, we will obtain that consent before the changes take effect. If you do not agree with a material change, you must stop using the Service and contact us to request deletion of your account.' },
        ],
      },
      {
        title: '13. Do Not Track',
        blocks: [
          { p: 'We do not track users across third-party websites and do not respond to Do Not Track (DNT) browser signals, because we do not engage in cross-site tracking in the first place.' },
        ],
      },
    ],
  },
};
