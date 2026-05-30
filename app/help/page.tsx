// @ts-nocheck
'use client';
import AppShell from '@/components/layout/AppShell';
import { useState } from 'react';
import Card from '@/components/ui/Card';

const SECTIONS = [
  { id:'start', title:'🚀 Getting Started', items:[
    { q:'How do I export from Jira?', a:'Go to your board → Backlog → Export → Excel or CSV. Include Sprint, Story Points, Assignee, Created Date, and Resolution Date for best results.' },
    { q:'What files are supported?', a:'CSV (.csv), Excel (.xlsx, .xls). Max 20 MB. Export the full backlog, not just one sprint, for quarter trends and epic analysis.' },
  ]},
  { id:'metrics', title:'📊 Metrics Explained', items:[
    { q:'What is the Delivery Health Score?', a:'A 0–100 score: completion rate (28%) + critical-free ratio (24%) + warning-free ratio (12%) + sprint completion (14%) + orphan-free ratio (12%) + cycle time score (10%).' },
    { q:'Lead Time vs Cycle Time?', a:'Lead Time = Created → Done (includes backlog wait). Cycle Time = In Progress → Done (pure delivery). A big gap means items wait a long time before anyone starts them.' },
  ]},
  { id:'health', title:'🏥 Health Classification', items:[
    { q:'When does an item become Critical?', a:'Active > 14 days · Cycle > 14 days · Blocked Flag = true · Due Date passed · High/Highest/Critical priority and still open.' },
    { q:'When does an item become Warning?', a:'Active > 7 days · Cycle > 7 days · Waiting > 30 days without being started.' },
  ]},
];

export default function HelpPage() {
  const [open, setOpen] = useState<string|null>('start');
  return (
    <AppShell showNav>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-black text-slate-900 mb-2">Help & Documentation</h1>
        <p className="text-slate-500 mb-6">Everything you need to get value from Delivery Clarity.</p>
        <div className="space-y-3">
          {SECTIONS.map(s => (
            <Card key={s.id} className="overflow-hidden p-0">
              <button className="w-full text-left px-5 py-4 flex items-center justify-between font-bold text-slate-800 hover:bg-slate-50 transition-colors" onClick={() => setOpen(open===s.id?null:s.id)}>
                {s.title}
                <span className={"text-slate-400 transition-transform " + (open===s.id?'rotate-180':'')} style={{display:'inline-block'}}>▾</span>
              </button>
              {open===s.id && <div className="border-t border-slate-100 divide-y divide-slate-100">{s.items.map((item,i)=>(
                <div key={i} className="px-5 py-4">
                  <p className="font-semibold text-slate-800 text-sm mb-1">{item.q}</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.a}</p>
                </div>
              ))}</div>}
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
