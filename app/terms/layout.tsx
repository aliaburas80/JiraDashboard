// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Server-only metadata wrapper — app/terms/page.tsx is a Client Component
// (locale switching) and cannot export `metadata` itself.

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — Delivery Clarity',
  description: 'The terms that govern your use of Delivery Clarity.',
  alternates: { canonical: '/terms' },
  openGraph: {
    title: 'Terms of Service — Delivery Clarity',
    description: 'The terms that govern your use of Delivery Clarity.',
    type: 'website',
    url: '/terms',
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
