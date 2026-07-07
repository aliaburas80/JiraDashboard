// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Server-only metadata wrapper — app/reset-password/page.tsx is a Client
// Component and cannot export `metadata` itself. noindex: a transactional
// utility page with no organic search value.

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Choose a New Password — Delivery Clarity',
  description: 'Choose a new password for your Delivery Clarity account.',
  robots: { index: false, follow: true },
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
