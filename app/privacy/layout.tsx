// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Server-only metadata wrapper — app/privacy/page.tsx is a Client Component
// (locale switching) and cannot export `metadata` itself.

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — Delivery Clarity',
  description: 'How Delivery Clarity collects, stores, and protects your Jira data, and the choices you have over it.',
  alternates: { canonical: '/privacy' },
  openGraph: {
    title: 'Privacy Policy — Delivery Clarity',
    description: 'How Delivery Clarity collects, stores, and protects your Jira data, and the choices you have over it.',
    type: 'website',
    url: '/privacy',
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
