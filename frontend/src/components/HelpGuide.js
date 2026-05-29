import { useEffect, useState } from 'react';

const sections = {
  use: {
    title: 'How to use',
    cards: [
      {
        title: 'Upload Jira export',
        body: (
          <>Use a <span className="keyword">Jira CSV</span> or <span className="keyword">Excel export</span>. The dashboard maps common Jira headers, validates core fields, and builds analysis from the imported rows.</>
        ),
      },
      {
        title: 'Read top-down',
        body: (
          <>Start with <span className="keyword">KPI cards</span> and <span className="keyword">circle charts</span>, then review quarter, kanban, sprint, capacity, and epic sections for the reason behind the result.</>
        ),
      },
      {
        title: 'Drill into work items',
        body: (
          <>Open <span className="keyword">Story / Task Flow Health</span> to filter by key, summary, status, sprint, assignee, health, cycle time, lead time, open age, or reason.</>
        ),
      },
      {
        title: 'Check import history',
        body: (
          <>Open the backend <span className="keyword">control center</span> to review import logs, extracted headers, statistics, and export the history to Excel.</>
        ),
      },
    ],
  },
  metrics: {
    title: 'Metric meanings',
    cards: [
      {
        title: 'Completion',
        body: 'Percentage of issues whose status is Done, Closed, or Resolved compared with all imported issues.',
      },
      {
        title: 'Lead time',
        body: 'Time from Created Date to Done or Resolution Date. It explains how long an item lived from request to completion.',
      },
      {
        title: 'Cycle time',
        body: 'Time from In Progress or Sprint Start to Done or Resolution Date. It explains how long delivery took after work started.',
      },
      {
        title: 'Open age',
        body: 'How long an unfinished item has been open since Created Date. Completed items do not show open age.',
      },
      {
        title: 'Health',
        body: 'Good, warning, or critical based on cycle time, active age, waiting age, overdue due dates, priority, and blocked flags.',
      },
      {
        title: 'Orphan item',
        body: 'A story or task without Epic Link or Parent Key. These are highlighted because ownership and scope tracing may be unclear.',
      },
    ],
  },
  charts: {
    title: 'Charts',
    cards: [
      {
        title: 'Health Mix',
        body: 'Shows the share of good, warning, and critical items. Use it to understand delivery risk pressure immediately.',
      },
      {
        title: 'Quarter Progress',
        body: 'Groups items by completion date when available, otherwise by created date, and compares quarter throughput and completion.',
      },
      {
        title: 'Kanban Distribution',
        body: 'Shows how many items sit in each workflow status such as backlog, in progress, QA, or done.',
      },
      {
        title: 'Sprint Comparison',
        body: 'Compares sprint groups when sprint fields exist in the Jira export. Missing sprint data is reported instead of guessed.',
      },
      {
        title: 'Capacity',
        body: 'Compares issue load by assignee. If story points are missing, capacity is count-based.',
      },
      {
        title: 'Epic / Parent Performance',
        body: 'Shows progress, lead time, cycle time, and health counts by epic or parent. Orphans appear separately.',
      },
    ],
  },
};

export default function HelpGuide({ open, onClose }) {
  const [activeSection, setActiveSection] = useState('use');

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  const section = sections[activeSection];

  return (
    <div className="help-overlay" role="dialog" aria-modal="true" aria-labelledby="help-title">
      <div className="help-backdrop" onClick={onClose} />
      <section className="help-panel">
        <header className="help-header">
          <div>
            <span className="help-eyebrow">Dashboard guide</span>
            <h2 id="help-title">How to read the Jira dashboard</h2>
            <p>Use this guide to understand the workflow, metric definitions, and chart signals.</p>
          </div>
          <button className="help-close" type="button" onClick={onClose} aria-label="Close help">
            Close
          </button>
        </header>

        <nav className="help-tabs" aria-label="Help sections">
          {Object.entries(sections).map(([key, item]) => (
            <button
              className={activeSection === key ? 'active' : ''}
              key={key}
              type="button"
              onClick={() => setActiveSection(key)}
            >
              {item.title}
            </button>
          ))}
        </nav>

        <div className="help-card-grid">
          {section.cards.map((card, index) => (
            <article className="help-card" key={card.title} style={{ '--delay': `${index * 55}ms` }}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
