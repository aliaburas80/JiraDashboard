import type { Metadata } from 'next';
import './globals.scss';
import { DataSourceProvider, CloudLoadingBanner } from '@/components/ui/DataSourceBadge';

export const metadata: Metadata = {
  title:       'Delivery Clarity — Jira Intelligence',
  description: 'Turn any Jira export into sprint health, flow efficiency, and delivery intelligence.',
  icons: {
    icon:             [
      { url: '/favicon.svg',  type: 'image/svg+xml' },
      { url: '/favicon.ico',  sizes: 'any' },
    ],
    apple:            '/logo/delivery_clarity_mark_128.png',
    shortcut:         '/favicon.ico',
  },
  themeColor:         '#2563eb',
  openGraph: {
    title:            'Delivery Clarity — Jira Intelligence',
    description:      'Turn any Jira export into sprint health, flow efficiency, and delivery intelligence.',
    type:             'website',
    images:           [{ url: '/logo/delivery_clarity_mark_128.png', width: 128, height: 128, alt: 'Delivery Clarity' }],
  },
  twitter: {
    card:             'summary',
    title:            'Delivery Clarity',
    description:      'From messy boards to measurable delivery confidence.',
    images:           ['/logo/delivery_clarity_mark_128.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased overflow-x-hidden" style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}>
        <DataSourceProvider>
          <CloudLoadingBanner />
          {children}
        </DataSourceProvider>
      </body>
    </html>
  );
}
