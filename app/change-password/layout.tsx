// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Server-only metadata wrapper — app/change-password/page.tsx is a Client
// Component and cannot export `metadata` itself. noindex: a forced,
// authenticated first-login flow with no organic search value.

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Change Your Password — Delivery Clarity',
  description: 'Change your Delivery Clarity account password.',
  robots: { index: false, follow: true },
};

export default function ChangePasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
