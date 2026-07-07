// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Server-only metadata wrapper — app/landing/page.tsx is a Client Component
// (GSAP scroll animation) and cannot export `metadata` itself; Next.js only
// reads the Metadata API from Server Components.

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Delivery Clarity — See Delivery Clearly | Jira Intelligence Dashboard',
  description:
    'Turn any Jira CSV or Excel export into sprint health, flow efficiency, forecasting, and role-based coaching — in seconds. Zero credentials, private, self-hosted.',
  alternates: { canonical: '/landing' },
  openGraph: {
    title: 'Delivery Clarity — See Delivery Clearly',
    description:
      'From messy boards to measurable delivery confidence. Zero-credential Jira analytics, forecasting, coaching, and retrospective intelligence in one private workspace.',
    type: 'website',
    url: '/landing',
  },
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
