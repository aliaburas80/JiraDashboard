import { useEffect, useState } from 'react';

const sections = {
  start: {
    title: 'Start',
    cards: [
      {
        title: 'Dashboard path',
        body: (
          <>Read the dashboard from top to bottom: <span className="keyword">summary</span>, quick filters, attention cards, KPIs, charts, detailed tables, then Story / Task Flow Health.</>
        ),
      },
      {
        title: 'Best workflow',
        body: (
          <>Start with health and risk, then use the quick filters to jump to the work-item table. Use the tables to justify the status with evidence.</>
        ),
      },
      {
        title: 'Question marks',
        body: (
          <>Click any <span className="keyword">?</span> beside a section to open this guide directly to the explanation for that exact dashboard area.</>
        ),
      },
      {
        title: 'Import confidence',
        body: (
          <>If sprint, story point, date, or assignee fields are missing from Jira, the dashboard still works but marks the missing context in badges and empty states.</>
        ),
      },
    ],
  },
  summary: {
    title: 'Summary',
    cards: [
      {
        title: 'Urgent Attention',
        body: 'Shows whether the export has warning or critical work. It is driven by flow health, blockers, overdue work, and aging active items.',
      },
      {
        title: 'Target vs Actual',
        body: 'Compares planned completion target against actual completion from the imported Jira issues. Use it to explain delivery confidence.',
      },
      {
        title: 'Completion delta',
        body: 'Shows the current completion signal. A low actual value means many imported issues are still not in Done, Closed, or Resolved.',
      },
      {
        title: 'Risk and cycle summary',
        body: 'Risk counts warning and critical items. Cycle time shows the average active delivery time when start and done dates exist.',
      },
    ],
  },
  quickFilters: {
    title: 'Quick Filters',
    cards: [
      {
        title: 'All',
        body: 'Clears dashboard filters and shows the full imported story/task list in Flow Health.',
      },
      {
        title: 'High risk',
        body: 'Filters the work-item table to critical health items. Use it first when you need the strongest delivery-risk evidence.',
      },
      {
        title: 'Blocked',
        body: 'Filters items whose health reason mentions blocking. These are good candidates for escalation or dependency review.',
      },
      {
        title: 'Needs review / Sprint today',
        body: 'Needs review focuses active review-like work. Sprint today looks for items flagged by today-related reason text when that data exists.',
      },
    ],
  },
  attention: {
    title: 'Attention',
    cards: [
      {
        title: 'Top blockers',
        body: 'Lists the first blocked items found from the flow health reasons. If empty, the export did not expose blocker signals.',
      },
      {
        title: 'Top overdue',
        body: 'Shows unfinished items whose open age is high. Use it to identify stale work that may need re-planning.',
      },
      {
        title: 'Risk Readout',
        body: 'Summarizes blocked, overdue, and high-priority open counts. It explains why a project may be marked unhealthy.',
      },
      {
        title: 'What to do',
        body: 'Review the rows, assign owners, confirm if dates/statuses are correct in Jira, and use the risk export for follow-up.',
      },
    ],
  },
  kpis: {
    title: 'KPIs',
    cards: [
      {
        title: 'Completion',
        body: 'Percent of imported issues in Done, Closed, or Resolved. It answers: how much of the imported work is complete?',
      },
      {
        title: 'Health Alerts',
        body: 'Warning plus critical items from Story / Task Flow Health. It answers: how much work needs attention?',
      },
      {
        title: 'Active Work',
        body: 'Items currently in active statuses such as In Progress, Code Review, QA, Testing, or UAT.',
      },
      {
        title: 'Lead Time',
        body: 'Time from Created Date to Done or Resolution Date. It answers: how long did the request live from creation to finish?',
      },
      {
        title: 'Cycle Time',
        body: 'Time from active start, such as In Progress or Sprint Start, to Done or Resolution Date. It answers: how long did delivery take after work started?',
      },
      {
        title: 'Story Points',
        body: 'Total and completed point progress. If Jira export has no points, the dashboard falls back to issue-count analysis.',
      },
    ],
  },
  visuals: {
    title: 'Visuals',
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
        title: 'Work State Distribution',
        body: 'Groups statuses into To Do, In Progress, Done, and Other so you can quickly see where work is concentrated.',
      },
      {
        title: 'Chart colors',
        body: 'Green usually means complete or healthy, amber means watch closely, red means risk, blue/teal show flow and delivery movement.',
      },
    ],
  },
  ratios: {
    title: 'Ratios',
    cards: [
      {
        title: 'Done Ratio',
        body: 'Done items divided by total imported items. This is a fast completion check.',
      },
      {
        title: 'Risk Pressure',
        body: 'Warning plus critical items divided by total items. High pressure means more delivery explanation is needed.',
      },
      {
        title: 'Orphan Ratio',
        body: 'Items without epic or parent divided by total items. A high value means scope ownership is hard to trace.',
      },
      {
        title: 'Active Work',
        body: 'Active items divided by total items. Use it to see how much work is currently moving through the workflow.',
      },
    ],
  },
  delivery: {
    title: 'Delivery',
    cards: [
      {
        title: 'Flow Efficiency',
        body: 'Explains delivery speed using lead time, cycle time, completed sample size, and critical items.',
      },
      {
        title: 'Story Point Delivery',
        body: 'Compares completed and remaining points. It is the best scope-completion view when story points are present.',
      },
      {
        title: 'Completed sample',
        body: 'Only items with enough date information can be used for average lead/cycle time. Low samples mean the timing metric is less reliable.',
      },
      {
        title: 'Critical items',
        body: 'Items where age, blocker, overdue, priority, or cycle-time signals indicate high delivery concern.',
      },
    ],
  },
  quarters: {
    title: 'Quarters',
    cards: [
      {
        title: 'Quarter Statistics',
        body: 'Splits work by quarter using completion date when available, otherwise created date. This helps compare delivery over time.',
      },
      {
        title: 'Completion rate',
        body: 'Done issues divided by total issues in that quarter. Use it to compare quarter health.',
      },
      {
        title: 'Lead and cycle',
        body: 'Average timing for items assigned to that quarter. Missing date fields reduce the available sample.',
      },
      {
        title: 'Top Status',
        body: 'The largest workflow statuses in that quarter. It helps explain whether work is stuck in QA, In Progress, or Done.',
      },
    ],
  },
  kanban: {
    title: 'Kanban',
    cards: [
      {
        title: 'Kanban Distribution',
        body: 'Shows how many items sit in each Jira status. Big counts in active or QA statuses can reveal workflow bottlenecks.',
      },
      {
        title: 'Kanban Status Health',
        body: 'Adds lead time, cycle time, health counts, and story points to every status so you can justify why a status is healthy or risky.',
      },
      {
        title: 'Good / warning / critical',
        body: 'Status-level health counts come from the story/task health calculation for each item inside that status.',
      },
      {
        title: 'How to use',
        body: 'Look for statuses with high count plus warning or critical items. Those are usually bottlenecks or waiting states.',
      },
    ],
  },
  sprint: {
    title: 'Sprint',
    cards: [
      {
        title: 'Sprint Comparison',
        body: 'Compares issue count by sprint. It only appears when the Jira export includes sprint values.',
      },
      {
        title: 'Sprint Status',
        body: 'Shows issues, done count, done points, lead/cycle time, warnings, criticals, and completion by sprint.',
      },
      {
        title: 'Missing sprint data',
        body: 'If the export does not include sprint fields, the dashboard reports that instead of guessing.',
      },
      {
        title: 'How to use',
        body: 'Compare sprints by completion rate, critical count, and cycle time to see which sprint needs explanation.',
      },
    ],
  },
  ownership: {
    title: 'Ownership',
    cards: [
      {
        title: 'Capacity By Assignee',
        body: 'Shows issue load, active items, story points, and load share by assignee. Use it to identify concentration or overload.',
      },
      {
        title: 'Epic / Parent Performance',
        body: 'Groups work by epic or parent and shows progress, timing, criticals, and warnings.',
      },
      {
        title: 'Orphan Items',
        body: 'Stories or tasks without Epic Link or Parent Key. They are highlighted because ownership and scope traceability are unclear.',
      },
      {
        title: 'How to use',
        body: 'High orphan count means clean Jira hierarchy first. High load share means check capacity and ownership balance.',
      },
    ],
  },
  readiness: {
    title: 'Readiness',
    cards: [
      {
        title: 'Top at-risk epics',
        body: 'Epics with critical health or low completion. Use them for release readiness and stakeholder conversations.',
      },
      {
        title: 'Dependency callouts',
        body: 'Items that reference dependencies or external epics when those fields exist in the parsed Jira data.',
      },
      {
        title: 'View items',
        body: 'Opens the related work items for the selected epic so you can inspect evidence instead of relying on the summary alone.',
      },
      {
        title: 'Release readiness',
        body: 'A release is healthier when at-risk epics are low, dependencies are known, and critical work is explained.',
      },
    ],
  },
  justification: {
    title: 'Justification',
    cards: [
      {
        title: 'Purpose',
        body: 'Turns the raw numbers into plain-language reasons. Use this section when explaining the dashboard result to stakeholders.',
      },
      {
        title: 'Where it comes from',
        body: 'Insights are generated from completion, flow, risk, capacity, story point, sprint, and epic signals.',
      },
      {
        title: 'How to use',
        body: 'Copy the strongest insights into status reports, but validate important claims against the detailed tables below.',
      },
    ],
  },
  flow: {
    title: 'Flow Table',
    cards: [
      {
        title: 'Story / Task Flow Health',
        body: 'The most detailed view. It lists each story/task with status, sprint, epic/parent, assignee, lead time, cycle time, open age, health, and reason.',
      },
      {
        title: 'Filters',
        body: 'Filter by key, summary, status, sprint, assignee, maximum lead/cycle/open-age days, health, or reason.',
      },
      {
        title: 'Lead / Cycle / Open Age',
        body: 'Lead is creation to finish, cycle is active start to finish, and open age is how long unfinished work has been open.',
      },
      {
        title: 'Health and reason',
        body: 'Health gives the severity. Reason explains why, such as blocker, overdue, long cycle time, stale active work, or missing ownership.',
      },
    ],
  },
};

export default function HelpGuide({ open, activeSection: requestedSection = 'start', onClose }) {
  const [activeSection, setActiveSection] = useState(requestedSection);

  useEffect(() => {
    if (open && sections[requestedSection]) {
      setActiveSection(requestedSection);
    }
  }, [open, requestedSection]);

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
