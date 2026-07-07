// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Server-only metadata wrapper — app/glossary/page.tsx is a Client Component
// and cannot export `metadata` itself.

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Glossary — Delivery Clarity',
  description: 'Definitions of the delivery metrics and terms used across Delivery Clarity dashboards.',
  alternates: { canonical: '/glossary' },
  openGraph: {
    title: 'Glossary — Delivery Clarity',
    description: 'Definitions of the delivery metrics and terms used across Delivery Clarity dashboards.',
    type: 'website',
    url: '/glossary',
  },
};

export default function GlossaryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
