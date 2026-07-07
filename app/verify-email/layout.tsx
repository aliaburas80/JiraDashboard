// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Server-only metadata wrapper — app/verify-email/page.tsx is a Client
// Component and cannot export `metadata` itself. noindex: a transactional
// utility page with no organic search value.

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verify Your Email — Delivery Clarity',
  description: 'Verify your email address for your Delivery Clarity account.',
  robots: { index: false, follow: true },
};

export default function VerifyEmailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
