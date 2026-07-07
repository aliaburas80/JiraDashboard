// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Server-only metadata wrapper — app/forgot-password/page.tsx is a Client
// Component and cannot export `metadata` itself. noindex: a transactional
// utility page with no organic search value.

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset Your Password — Delivery Clarity',
  description: 'Request a password reset link for your Delivery Clarity account.',
  robots: { index: false, follow: true },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
