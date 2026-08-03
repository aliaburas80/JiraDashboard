import type { Metadata, Viewport } from 'next';
import './globals.scss';
import { DataSourceProvider, CloudLoadingBanner } from '@/components/ui/DataSourceBadge';
import { GlobalErrorHandler } from '@/components/ui/GlobalErrorHandler';
import { AnalyticsQueueInit } from '@/components/ui/AnalyticsQueueInit';
import { FeedbackButton } from '@/components/feedback/FeedbackButton';
import { EmailVerificationBanner } from '@/components/auth/EmailVerificationBanner';
import ProductTour from '@/components/tour/ProductTour';
import PageTourButton from '@/components/tour/PageTourButton';
import { normalizeAppUrl } from '@/lib/url';

const appUrl = normalizeAppUrl(process.env.NEXT_PUBLIC_APP_URL);

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

// Static, server-defined JSON-LD (no user-supplied content) — safe to inline
// via dangerouslySetInnerHTML per CLAUDE.md §38.3, since nothing here
// originates from user input or an external source.
const organizationJsonLd = {
  '@context':  'https://schema.org',
  '@type':     'Organization',
  name:        'Delivery Clarity',
  url:         appUrl,
  logo:        `${appUrl}/logo/delivery_clarity_mark_128.png`,
  description: 'Turn any Jira export into sprint health, flow efficiency, and delivery intelligence.',
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type':    'WebSite',
  name:       'Delivery Clarity',
  url:        appUrl,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased overflow-x-hidden">
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger -- static, server-defined JSON-LD, no user input
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger -- static, server-defined JSON-LD, no user input
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <DataSourceProvider>
          <GlobalErrorHandler />
          <AnalyticsQueueInit />
          <CloudLoadingBanner />
          <EmailVerificationBanner />
          {children}
          <FeedbackButton />
          {/* Mounted once at the root, alongside PageTourButton (the floating
              trigger) — each route's tour is self-contained, so ProductTour
              only needs to read the current pathname, not survive navigating
              across it. See src/lib/tour.ts (PAGE_TOURS) for the per-route
              registry both of these read from. */}
          <ProductTour />
          <PageTourButton />
        </DataSourceProvider>
      </body>
    </html>
  );
}
