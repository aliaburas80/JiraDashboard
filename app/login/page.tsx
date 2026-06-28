// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// NOTE: Fully functional after npm install iron-session prisma @prisma/client bcryptjs
'use client';
import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { hasMetricsFromAnySource } from '@/lib/storage';
import { SvgIcon } from '@/components/ui/SvgIcon';

interface LoginErrorState {
  message:  string;
  solution: string;
  details?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState<LoginErrorState | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setShowSolution(false);
    try {
      if (!email.trim() || !password) {
        setError({
          message:  'Email and password are required.',
          solution: 'Enter both fields, then click Sign in again.',
        });
        return;
      }
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError({
          message:  data.error ?? 'Login failed.',
          solution: data.solution ?? 'Check your email and password, then try again.',
          details:  data.details,
        });
        return;
      }
      if (data.mustChangePassword || data.user?.mustChangePassword) {
        router.push('/change-password');
        router.refresh();
        return;
      }
      // If an explicit redirect param exists, honour it.
      // Otherwise go to dashboard only if the user already has data;
      // if no data has been uploaded yet, send them to the upload page.
      const explicit = params.get('redirect');
      const hasData = await hasMetricsFromAnySource();
      const destination = explicit ?? (hasData ? '/dashboard' : '/');
      router.push(destination);
      router.refresh();
    } catch (err) {
      setError({
        message:  'Network error. The login request could not reach the server.',
        solution: 'Check that the app server is running, refresh the page, and try again.',
        details:  err instanceof Error ? err.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Image
              src="/logo/delivery-clarity-logo-horizontal.svg"
              alt="Delivery Clarity"
              width={200}
              height={62}
              priority
            />
          </div>
          <p className="text-sm text-slate-500">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm shadow-sm" role="alert">
              <div className="flex items-start gap-2">
                <SvgIcon name="info" size={16} className="mt-0.5 text-red-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-black text-red-700">{error.message}</p>
                  <button
                    type="button"
                    onClick={() => setShowSolution(v => !v)}
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-red-500 underline underline-offset-2"
                    aria-expanded={showSolution}
                  >
                    {showSolution ? 'Hide solution' : 'Show solution'}
                    <SvgIcon name={showSolution ? 'chevronUp' : 'chevronDown'} size={12} />
                  </button>
                  {showSolution && (
                    <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs leading-relaxed">
                      <p className="text-emerald-800"><span className="font-black">Solution: </span>{error.solution}</p>
                      {error.details && (
                        <p className="mt-1 text-emerald-700"><span className="font-black">Details: </span>{error.details}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Email address</label>
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-invalid={!!error}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Password</label>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              aria-invalid={!!error}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full btn-primary py-2.5 disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          New to Delivery Clarity?{' '}
          <Link href="/promo" className="font-semibold text-blue-600 hover:underline">
            See the product tour →
          </Link>
        </p>
      </div>
    </div>
  );
}
