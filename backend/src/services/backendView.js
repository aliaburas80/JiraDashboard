// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderShell({ title, subtitle, active = 'home', actions = '', content }) {
  const navItems = [
    { id: 'home', label: 'Home', href: '/' },
    { id: 'logs', label: 'Import Logs', href: '/api/upload/logs/view' },
    { id: 'json', label: 'JSON Logs', href: '/api/upload/logs' },
    { id: 'export', label: 'Export Excel', href: '/api/upload/logs/export' },
    { id: 'health', label: 'Health', href: '/api/health' },
    { id: 'frontend', label: 'Frontend', href: 'http://localhost:3000' },
  ];

  return `<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(title)}</title>
        <style>
          :root { color-scheme: light; font-family: Inter, system-ui, sans-serif; color: #172033; background: #eef2f7; }
          * { box-sizing: border-box; }
          body { margin: 0; }
          .layout { display: grid; grid-template-columns: 250px minmax(0, 1fr); min-height: 100vh; }
          aside { background: #111827; color: #f8fafc; padding: 22px 18px; }
          .brand { margin-bottom: 22px; }
          .brand strong { display: block; font-size: 1.05rem; }
          .brand span { color: #cbd5e1; font-size: 0.88rem; }
          nav { display: grid; gap: 8px; }
          nav a { border-radius: 8px; color: #cbd5e1; padding: 11px 12px; text-decoration: none; font-weight: 700; }
          nav a:hover, nav a.active { background: #2563eb; color: white; }
          main { padding: 24px; }
          .topbar { display: flex; justify-content: space-between; gap: 18px; align-items: flex-start; margin-bottom: 20px; }
          h1, h2, h3, p { margin-top: 0; }
          h1 { font-size: 2rem; margin-bottom: 6px; }
          h2 { font-size: 1.1rem; margin-bottom: 6px; }
          h3 { font-size: 0.86rem; text-transform: uppercase; color: #526070; }
          .muted, .log-head p, .summary-card span, .metric-grid span { color: #64748b; }
          .button, button.button { display: inline-flex; align-items: center; justify-content: center; border: 0; border-radius: 8px; background: #2563eb; color: white; padding: 11px 16px; text-decoration: none; font: inherit; font-weight: 800; cursor: pointer; white-space: nowrap; }
          .button.secondary { background: white; color: #1d4ed8; border: 1px solid #bfdbfe; }
          .actions { display: flex; flex-wrap: wrap; gap: 10px; }
          .summary-grid, .metric-grid, .log-columns, .details-grid, .route-grid { display: grid; gap: 14px; }
          .summary-grid { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); margin-bottom: 18px; }
          .route-grid { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
          .summary-card, .log-card, .route-card { border: 1px solid #e1e5eb; border-radius: 8px; background: white; box-shadow: 0 14px 36px rgba(15, 23, 42, 0.08); }
          .summary-card, .route-card { padding: 16px; }
          .route-card p { min-height: 44px; }
          .summary-card strong, .metric-grid strong { display: block; font-size: 1.8rem; }
          .log-card { padding: 18px; margin-bottom: 16px; }
          .log-head { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
          .status { border-radius: 999px; padding: 6px 10px; font-size: 0.78rem; font-weight: 800; text-transform: uppercase; height: fit-content; }
          .status.success { background: #dcfce7; color: #166534; }
          .status.validation_failed { background: #fef3c7; color: #92400e; }
          .status.failed { background: #fee2e2; color: #991b1b; }
          .metric-grid { grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); margin-bottom: 18px; }
          .metric-grid div { border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; }
          .log-columns { grid-template-columns: repeat(3, minmax(0, 1fr)); margin-bottom: 16px; }
          .bar-row { display: grid; grid-template-columns: minmax(90px, 150px) 1fr 34px; gap: 10px; align-items: center; margin-bottom: 9px; }
          .bar-row span { overflow-wrap: anywhere; font-weight: 700; }
          .bar-row strong { text-align: right; }
          .bar-track { height: 10px; overflow: hidden; border-radius: 999px; background: #e5e7eb; }
          .bar-fill { height: 100%; border-radius: inherit; background: #2563eb; }
          details { border-top: 1px solid #e5e7eb; padding-top: 14px; }
          summary { cursor: pointer; font-weight: 800; color: #1d4ed8; }
          .details-grid { grid-template-columns: 2fr 1fr; margin: 16px 0; }
          .chips { display: flex; flex-wrap: wrap; gap: 6px; }
          .chips span { border-radius: 999px; background: #eef2ff; color: #1e3a8a; padding: 5px 9px; font-size: 0.78rem; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border-bottom: 1px solid #e5e7eb; padding: 10px; text-align: left; }
          th { color: #526070; font-size: 0.78rem; text-transform: uppercase; }
          @media (max-width: 860px) {
            .layout { grid-template-columns: 1fr; }
            aside { position: static; }
            main { padding: 16px; }
            .topbar, .log-head { flex-direction: column; }
            .log-columns, .details-grid { grid-template-columns: 1fr; }
            .bar-row { grid-template-columns: 1fr; }
          }
        </style>
      </head>
      <body>
        <div class="layout">
          <aside>
            <div class="brand">
              <strong>Jira Backend</strong>
              <span>Import process center</span>
            </div>
            <nav>
              ${navItems.map((item) => `<a class="${item.id === active ? 'active' : ''}" href="${item.href}">${escapeHtml(item.label)}</a>`).join('')}
            </nav>
          </aside>
          <main>
            <section class="topbar">
              <div>
                <h1>${escapeHtml(title)}</h1>
                <p class="muted">${escapeHtml(subtitle)}</p>
              </div>
              ${actions ? `<div class="actions">${actions}</div>` : ''}
            </section>
            ${content}
          </main>
        </div>
      </body>
    </html>`;
}

function renderBackendHome() {
  const routes = [
    { title: 'Import Logs', text: 'Visual view of uploaded files, extracted data, processing status, and statistics.', href: '/api/upload/logs/view', action: 'Open logs' },
    { title: 'Export Excel', text: 'Download the stored import history and statistics as an Excel workbook.', href: '/api/upload/logs/export', action: 'Download' },
    { title: 'JSON Logs', text: 'Raw import log API for debugging or integration work.', href: '/api/upload/logs', action: 'View JSON' },
    { title: 'Health Check', text: 'Confirm the backend service is up and responding.', href: '/api/health', action: 'Check health' },
    { title: 'Frontend App', text: 'Open the React dashboard used to upload Jira exports.', href: 'http://localhost:3000', action: 'Open frontend' },
  ];

  const content = `
    <section class="route-grid">
      ${routes.map((route) => `
        <article class="route-card">
          <h2>${escapeHtml(route.title)}</h2>
          <p class="muted">${escapeHtml(route.text)}</p>
          <a class="button secondary" href="${route.href}">${escapeHtml(route.action)}</a>
        </article>
      `).join('')}
    </section>
  `;

  return renderShell({
    title: 'Backend Control Center',
    subtitle: 'Navigate backend routes, review imports, and export process logs without reading raw JSON.',
    active: 'home',
    actions: '<a class="button" href="/api/upload/logs/view">View Import Logs</a>',
    content,
  });
}

module.exports = {
  escapeHtml,
  renderBackendHome,
  renderShell,
};
