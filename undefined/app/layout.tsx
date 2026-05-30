// @ts-nocheck
import type { Metadata } from 'next';
import './globals.scss';

export const metadata: Metadata = {
  title: 'Delivery Clarity — Jira Intelligence',
  description: 'Turn any Jira export into sprint health, flow efficiency, and delivery intelligence.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased" style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}>
        {children}
      </body>
    </html>
  );
}
