import type { Metadata, Viewport } from 'next';
import './globals.scss';
import { DataSourceProvider, CloudLoadingBanner } from '@/components/ui/DataSourceBadge';

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
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

export const viewport: Viewport = {
  themeColor: '#2563eb',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased overflow-x-hidden">
        <DataSourceProvider>
          <CloudLoadingBanner />
          {children}
        </DataSourceProvider>
      </body>
    </html>
  );
}
