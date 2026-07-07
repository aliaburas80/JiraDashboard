// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Server-only metadata wrapper — app/register/page.tsx is a Client Component
// and cannot export `metadata` itself. noindex: a signup form has no organic
// search value and should not compete with /landing or /promo in results.

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Account — Delivery Clarity',
  description: 'Create a Delivery Clarity account.',
  alternates: { canonical: '/register' },
  robots: { index: false, follow: true },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
