'use client';
import { cn } from '@/lib/utils';
interface P { label: string; value: string | number; detail?: string; accent?: string; onClick?: () => void; }
export default function KpiCard({ label, value, detail, accent='#2563eb', onClick }: P) {
  return (
    <div
      onClick={onClick}
      className={cn('bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between min-h-[110px] relative overflow-hidden', onClick && 'cursor-pointer hover:shadow-md transition-shadow')}
      style={{ borderLeft: '4px solid ' + accent }}
    >
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <div>
        <p className="text-2xl font-black text-slate-900 tracking-tight leading-none mt-2">{value}</p>
        {detail && <p className="text-xs text-slate-500 mt-1.5 font-medium">{detail}</p>}
      </div>
    </div>
  );
}
