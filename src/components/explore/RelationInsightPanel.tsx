// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
'use client';

interface Props { insights: string[] }

export default function RelationInsightPanel({ insights }: Props) {
  if (!insights.length) return null;
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
      <p className="text-xs font-black uppercase tracking-widest text-blue-700 mb-3">Delivery Insights</p>
      <ul className="space-y-2">
        {insights.map((insight, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-blue-900">
            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
            {insight}
          </li>
        ))}
      </ul>
    </div>
  );
}
