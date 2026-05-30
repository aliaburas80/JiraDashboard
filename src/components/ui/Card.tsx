// @ts-nocheck
'use client';
import { cn } from '@/lib/utils';
export default function Card({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return <div className={cn('bg-white rounded-xl border border-slate-200/80 shadow-sm', onClick && 'cursor-pointer hover:shadow-md transition-shadow', className)} onClick={onClick}>{children}</div>;
}
