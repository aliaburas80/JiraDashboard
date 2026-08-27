// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Launch gate: every HTML email must use the same Delivery Clarity light theme.

import {
  buildAdminTestEmail,
  buildAnalysisReadyEmail,
  buildDemoRequestEmail,
  buildFeedbackNotificationEmail,
  buildFeedbackReceivedEmail,
  buildPasswordChangedEmail,
  buildPasswordResetEmail,
  buildPrivateTestInviteEmail,
  buildSupportTicketReceivedEmail,
  buildUploadFailedEmail,
  buildUploadSuccessEmail,
  buildVerificationEmail,
  buildVerificationThankYouEmail,
  buildWelcomeEmail,
  buildWorkspaceReadyEmail,
} from '../lib/email';

const appUrl = 'https://deliveryclarity.app';

const templates = [
  ['admin email test', buildAdminTestEmail('SMTP', appUrl)],
  ['demo request', buildDemoRequestEmail({
    name: 'Sam Example',
    email: 'sam@example.com',
    organization: 'Example Co',
    role: 'Delivery Lead',
    need: 'Delivery visibility',
    justification: 'Evaluate the product',
    submittedAt: '2026-08-28T00:00:00.000Z',
  })],
  ['feedback notification', buildFeedbackNotificationEmail({
    category: 'Suggestion',
    message: 'Improve the dashboard.',
    impactLevel: 'Minor',
    page: '/dashboard',
    browserFamily: 'Chrome',
    userEmail: 'sam@example.com',
    submittedAt: '2026-08-28T00:00:00.000Z',
  })],
  ['welcome', buildWelcomeEmail('Sam', 'sam@example.com', 'TempPass123!', appUrl)],
  ['verification', buildVerificationEmail('Sam', 'sam@example.com', 'verify-token', appUrl)],
  ['verification thank-you', buildVerificationThankYouEmail('Sam')],
  ['password reset', buildPasswordResetEmail('Sam', 'reset-token', appUrl)],
  ['password changed', buildPasswordChangedEmail('Sam', appUrl)],
  ['upload success', buildUploadSuccessEmail({ userName: 'Sam', appUrl, fileName: 'jira.csv' })],
  ['upload failure', buildUploadFailedEmail({ userName: 'Sam', appUrl, fileName: 'jira.csv', errorMessage: 'Invalid columns' })],
  ['analysis ready', buildAnalysisReadyEmail({ userName: 'Sam', appUrl })],
  ['feedback receipt', buildFeedbackReceivedEmail({ userName: 'Sam', appUrl, feedbackSummary: 'Useful feedback' })],
  ['support receipt', buildSupportTicketReceivedEmail({ userName: 'Sam', appUrl, supportReference: 'SUP-123' })],
  ['private test invite', buildPrivateTestInviteEmail({ userName: 'Sam', appUrl })],
  ['workspace ready', buildWorkspaceReadyEmail({ userName: 'Sam', appUrl })],
] as const;

describe('Delivery Clarity email template standard', () => {
  test.each(templates)('%s uses the launch light theme', (_name, email) => {
    expect(email.html).toContain('Delivery Clarity');
    expect(email.html).toContain('background:linear-gradient(135deg,#2563eb 0%,#0891b2 100%)');
    expect(email.html).toContain('background:#ffffff');
    expect(email.html).toContain('color:#0f172a');
    expect(email.html).toContain('support@deliveryclarity.app');

    // Prevent the two superseded visual systems from returning.
    expect(email.html).not.toContain('#070b16');
    expect(email.html).not.toContain('#0b1020');
    expect(email.html).not.toContain('#ff8a4c');
    expect(email.html).not.toContain('#e85d12');
  });
});
