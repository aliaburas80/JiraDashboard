'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';

// ── Types ────────────────────────────────────────────────────────────────────

interface Architecture {
  framework: string;
  language: string;
  styling: string;
}

interface Service {
  name: string;
  path: string;
  description: string;
}

interface TypeDef {
  name: string;
  path: string;
  description: string;
}

interface HealthClassification {
  critical: { condition: string };
  warning: { condition: string };
  good: { condition: string };
}

interface HealthScoreWeights {
  completionRate: number;
  criticalFree: number;
  warningFree: number;
  sprintCompletion: number;
  orphanFree: number;
  cycleTimeScore: number;
}

interface DeveloperViewData {
  architecture: Architecture;
  services: Service[];
  types: TypeDef[];
  healthClassification: HealthClassification;
  healthScoreWeights: HealthScoreWeights;
}

// ── Static data not provided by the API ──────────────────────────────────────

const API_ROUTES = [
  { method: 'POST', path: '/api/upload', description: 'Upload and parse a Jira CSV/JSON export file.' },
  { method: 'GET',  path: '/api/dashboard', description: 'Return aggregated sprint metrics and KPIs for the dashboard.' },
  { method: 'GET',  path: '/api/metrics', description: 'Return raw computed metric values for a given import.' },
  { method: 'GET',  path: '/api/health', description: 'Application liveness and readiness health check.' },
  { method: 'GET',  path: '/api/imports', description: 'List all previous Jira data import sessions.' },
  { method: 'GET',  path: '/api/developer-view', description: 'Return architecture metadata powering this page.' },
  { method: 'GET',  path: '/api/backend-view', description: 'Return backend internals summary for ops view.' },
];

const NAV_SECTIONS = [
  'Architecture',
  'API Routes',
  'Services',
  'Types',
  'Health Rules',
  'Score Formula',
  'Quick Start',
] as const;

type Section = (typeof NAV_SECTIONS)[number];

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}

function MethodBadge({ method }: { method: string }) {
  const colours: Record<string, string> = {
    GET:    'bg-emerald-100 text-emerald-700 border border-emerald-200',
    POST:   'bg-blue-100   text-blue-700   border border-blue-200',
    PUT:    'bg-amber-100  text-amber-700  border border-amber-200',
    PATCH:  'bg-purple-100 text-purple-700 border border-purple-200',
    DELETE: 'bg-red-100    text-red-700    border border-red-200',
  };
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-bold font-mono ${colours[method] ?? 'bg-slate-100 text-slate-600'}`}>
      {method}
    </span>
  );
}

// ── Sections ──────────────────────────────────────────────────────────────────

function ArchitectureSection({ arch }: { arch: Architecture }) {
  const cards = [
    { label: 'Framework',  value: arch.framework, icon: '⬡', color: 'bg-blue-50   border-blue-200   text-blue-800' },
    { label: 'Language',   value: arch.language,  icon: '⌨', color: 'bg-indigo-50 border-indigo-200 text-indigo-800' },
    { label: 'Styling',    value: arch.styling,   icon: '🎨', color: 'bg-cyan-50   border-cyan-200   text-cyan-800' },
    { label: 'Testing',    value: 'Jest + RTL',   icon: '✓',  color: 'bg-green-50  border-green-200  text-green-800' },
  ];
  return (
    <div>
      <SectionHeading title="Architecture" subtitle="High-level technology choices for this project." />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className={`rounded-xl border p-5 ${c.color}`}>
            <div className="text-2xl mb-3">{c.icon}</div>
            <div className="text-xs font-semibold uppercase tracking-wider opacity-60 mb-1">{c.label}</div>
            <div className="text-lg font-bold">{c.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ApiRoutesSection() {
  return (
    <div>
      <SectionHeading title="API Routes" subtitle="All Next.js App Router route handlers exposed by this application." />
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-20">Method</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Path</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {API_ROUTES.map(r => (
              <tr key={r.path} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3"><MethodBadge method={r.method} /></td>
                <td className="px-4 py-3 font-mono text-slate-800 whitespace-nowrap">{r.path}</td>
                <td className="px-4 py-3 text-slate-600">{r.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ServiceCard({ item }: { item: Service | TypeDef }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
          <span className="text-blue-600 text-sm font-bold">{item.name.charAt(0).toUpperCase()}</span>
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-slate-900">{item.name}</div>
          <div className="font-mono text-xs text-slate-400 mt-0.5 truncate">{item.path}</div>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.description}</p>
        </div>
      </div>
    </div>
  );
}

function ServicesSection({ services }: { services: Service[] }) {
  return (
    <div>
      <SectionHeading title="Services" subtitle="Core business-logic modules that power the application." />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {services.map(s => <ServiceCard key={s.name} item={s} />)}
      </div>
    </div>
  );
}

function TypesSection({ types }: { types: TypeDef[] }) {
  return (
    <div>
      <SectionHeading title="Types" subtitle="TypeScript type definition files enforcing domain contracts." />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {types.map(t => <ServiceCard key={t.name} item={t} />)}
      </div>
    </div>
  );
}

function HealthRulesSection({ classification }: { classification: HealthClassification }) {
  const rules = [
    {
      label: 'Critical',
      condition: classification.critical.condition,
      bg: 'bg-red-50',
      border: 'border-red-300',
      badge: 'bg-red-500 text-white',
      text: 'text-red-800',
      dot: 'bg-red-500',
    },
    {
      label: 'Warning',
      condition: classification.warning.condition,
      bg: 'bg-amber-50',
      border: 'border-amber-300',
      badge: 'bg-amber-400 text-white',
      text: 'text-amber-800',
      dot: 'bg-amber-400',
    },
    {
      label: 'Good',
      condition: classification.good.condition,
      bg: 'bg-green-50',
      border: 'border-green-300',
      badge: 'bg-green-500 text-white',
      text: 'text-green-800',
      dot: 'bg-green-500',
    },
  ];
  return (
    <div>
      <SectionHeading title="Health Rules" subtitle="Thresholds used to classify sprint health status." />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {rules.map(r => (
          <div key={r.label} className={`rounded-xl border-2 p-6 ${r.bg} ${r.border}`}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-3 h-3 rounded-full ${r.dot}`} />
              <span className={`text-sm font-bold uppercase tracking-wider ${r.text}`}>{r.label}</span>
            </div>
            <p className={`text-base font-semibold ${r.text}`}>{r.condition}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeightBar({ label, weight }: { label: string; weight: number }) {
  const pct = Math.round(weight * 100);
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm font-bold text-slate-900">{pct}%</span>
      </div>
      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const WEIGHT_LABELS: Record<string, string> = {
  completionRate:   'Completion Rate',
  criticalFree:     'Critical-Free',
  warningFree:      'Warning-Free',
  sprintCompletion: 'Sprint Completion',
  orphanFree:       'Orphan-Free',
  cycleTimeScore:   'Cycle Time Score',
};

function ScoreFormulaSection({ weights }: { weights: HealthScoreWeights }) {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  return (
    <div>
      <SectionHeading
        title="Score Formula"
        subtitle={`Weighted sum of six factors totalling ${Math.round(total * 100)}%. Higher is healthier.`}
      />
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm max-w-2xl">
        {Object.entries(weights).map(([key, val]) => (
          <WeightBar key={key} label={WEIGHT_LABELS[key] ?? key} weight={val} />
        ))}
      </div>
    </div>
  );
}

function QuickStartSection() {
  const commands = [
    { comment: '# Install dependencies', cmd: 'npm install' },
    { comment: '# Start dev server',     cmd: 'npm run dev' },
    { comment: '# Production build',     cmd: 'npm run build' },
    { comment: '# Run test suite',       cmd: 'npm test' },
  ];
  return (
    <div>
      <SectionHeading title="Quick Start" subtitle="Get up and running in four commands." />
      <div className="rounded-xl overflow-hidden border border-slate-800 shadow-lg max-w-2xl">
        <div className="flex items-center gap-1.5 px-4 py-3 bg-slate-800">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="w-3 h-3 rounded-full bg-amber-400" />
          <span className="w-3 h-3 rounded-full bg-green-400" />
          <span className="ml-3 text-xs text-slate-400 font-mono">terminal</span>
        </div>
        <pre className="bg-slate-900 px-5 py-5 text-sm leading-7 overflow-x-auto">
          <code>
            {commands.map((c, i) => (
              <span key={i}>
                <span className="text-slate-500">{c.comment}{'\n'}</span>
                <span className="text-emerald-400">$ </span>
                <span className="text-slate-100">{c.cmd}{'\n'}</span>
                {i < commands.length - 1 && '\n'}
              </span>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-slate-200 rounded w-1/3" />
      <div className="h-4 bg-slate-100 rounded w-1/2" />
      <div className="grid grid-cols-4 gap-4 mt-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-slate-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DeveloperPage() {
  const [data, setData] = useState<DeveloperViewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<Section>('Architecture');

  useEffect(() => {
    fetch('/api/developer-view')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<DeveloperViewData>;
      })
      .then(setData)
      .catch(e => setError(String(e)));
  }, []);

  function renderSection() {
    if (error) {
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 text-sm">
          Failed to load developer data: {error}
        </div>
      );
    }
    if (!data) return <Skeleton />;

    switch (active) {
      case 'Architecture':
        return <ArchitectureSection arch={data.architecture} />;
      case 'API Routes':
        return <ApiRoutesSection />;
      case 'Services':
        return <ServicesSection services={data.services} />;
      case 'Types':
        return <TypesSection types={data.types} />;
      case 'Health Rules':
        return <HealthRulesSection classification={data.healthClassification} />;
      case 'Score Formula':
        return <ScoreFormulaSection weights={data.healthScoreWeights} />;
      case 'Quick Start':
        return <QuickStartSection />;
    }
  }

  return (
    <AppShell showNav>
      <div className="flex gap-6 min-h-[calc(100vh-10rem)]">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col gap-1 w-48 flex-shrink-0 pt-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 px-3 mb-2">Sections</p>
          {NAV_SECTIONS.map(section => (
            <button
              key={section}
              onClick={() => setActive(section)}
              className={
                'text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ' +
                (active === section
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
              }
            >
              {section}
            </button>
          ))}
        </aside>

        {/* Mobile nav */}
        <div className="md:hidden w-full mb-4 flex gap-2 overflow-x-auto pb-1">
          {NAV_SECTIONS.map(section => (
            <button
              key={section}
              onClick={() => setActive(section)}
              className={
                'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ' +
                (active === section
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50')
              }
            >
              {section}
            </button>
          ))}
        </div>

        {/* Main content */}
        <main className="flex-1 min-w-0">{renderSection()}</main>
      </div>
    </AppShell>
  );
}
