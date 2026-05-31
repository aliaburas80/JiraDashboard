import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  lines?: number;
  className?: string;
}

export default function SkeletonCard({ lines = 3, className }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 animate-pulse',
        className
      )}
    >
      {/* Header rect */}
      <div className="h-4 bg-slate-200 rounded w-1/3 mb-4" />

      {/* Line rects */}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-3 bg-slate-200 rounded',
              i === lines - 1 && lines > 1 ? 'w-2/3' : 'w-full'
            )}
          />
        ))}
      </div>
    </div>
  );
}
