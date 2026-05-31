'use client';
import { cn } from '@/lib/utils';
const V = { success:'bg-green-50 text-green-700 border-green-200', warning:'bg-amber-50 text-amber-700 border-amber-200', danger:'bg-red-50 text-red-700 border-red-200', info:'bg-blue-50 text-blue-700 border-blue-200', neutral:'bg-slate-100 text-slate-600 border-slate-200' };
export default function Badge({ label, variant='neutral', className }: { label: string; variant?: keyof typeof V; className?: string }) {
  return <span className={cn('inline-flex items-center text-xs font-bold rounded-full px-2.5 py-0.5 border', V[variant], className)}>{label}</span>;
}
