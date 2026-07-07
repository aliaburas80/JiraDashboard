// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Server-only metadata wrapper — app/login/page.tsx is a Client Component
// and cannot export `metadata` itself. noindex: a login form has no organic
// search value and should not compete with /landing or /promo in results.

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Log In — Delivery Clarity',
  description: 'Log in to your Delivery Clarity workspace.',
  alternates: { canonical: '/login' },
  robots: { index: false, follow: true },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
