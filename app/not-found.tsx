import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';

export default function NotFound() {
  return (
    <AppShell showNav={false}>
      <div className="min-h-[calc(100vh-10rem)] flex flex-col items-center justify-center gap-6 py-12 text-center">
        <p className="text-[8rem] font-black leading-none text-slate-200 select-none">404</p>

        <div className="max-w-md -mt-4">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
            Page not found
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            The page you are looking for does not exist or has been moved.
            Check the URL or head back to a known location.
          </p>
        </div>

        <div className="flex items-center gap-3 mt-2">
          <Link
            href="/"
            className="btn-primary px-6 py-2"
          >
            Go to Home
          </Link>
          <Link
            href="/dashboard"
            className="btn-secondary px-6 py-2"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
