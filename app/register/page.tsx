// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
'use client';
import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { hasMetrics } from '@/lib/storage';

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ALLOW_REGISTER !== 'true') {
      router.replace('/login');
    }
  }, [router]);
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      // Step 1: Register
      const res  = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Registration failed.'); return; }

      // Step 2: Auto-login after registration
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (loginRes.ok) {
        // Logged in — go to upload if no data, dashboard if data exists
        router.push(hasMetrics() ? '/dashboard' : '/');
        router.refresh();
      } else {
        // Login failed for some reason — fall back to login page
        router.push('/login?registered=1');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Delivery Clarity</h1>
          <p className="text-sm text-slate-500 mt-1">Create your account</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>}
          {[
            { label: 'Full name', type: 'text',     value: name,     setter: setName,     placeholder: 'Ali Abu Ras' },
            { label: 'Email',     type: 'email',    value: email,    setter: setEmail,    placeholder: 'you@example.com' },
            { label: 'Password', type: 'password', value: password, setter: setPassword, placeholder: '8+ chars, 1 uppercase, 1 number' },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{f.label}</label>
              <input type={f.type} required value={f.value} placeholder={f.placeholder}
                onChange={e => f.setter(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          ))}
          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50">
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="text-center text-xs text-slate-500 mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
