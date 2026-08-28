import type { Metadata } from 'next';
import './globals.css';
import './analytics.css';

export const metadata: Metadata = {
  title: 'Delivery Clarity Admin',
  description: 'Separate administration console for Delivery Clarity.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
