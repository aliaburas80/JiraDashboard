'use client';
export default function LoadingState({ message='Loading...' }: { message?: string }) {
  return <div className="flex flex-col items-center justify-center py-16 gap-4"><div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /><p className="text-slate-500 font-medium text-sm">{message}</p></div>;
}
