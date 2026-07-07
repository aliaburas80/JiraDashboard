// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Server-only metadata wrapper — app/help/page.tsx is a Client Component
// and cannot export `metadata` itself.

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Help & Documentation — Delivery Clarity',
  description: 'Guides for uploading Jira exports, reading dashboards, and configuring Delivery Clarity.',
  alternates: { canonical: '/help' },
  openGraph: {
    title: 'Help & Documentation — Delivery Clarity',
    description: 'Guides for uploading Jira exports, reading dashboards, and configuring Delivery Clarity.',
    type: 'website',
    url: '/help',
  },
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
