'use client';
import React from 'react';
import { cn } from '@/lib/utils';

export default function Card({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  const interactive = !!onClick;

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!onClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  }

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-slate-200/80 shadow-sm',
        interactive && 'cursor-pointer hover:shadow-md transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        className,
      )}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive ? handleKeyDown : undefined}
    >
      {children}
    </div>
  );
}
