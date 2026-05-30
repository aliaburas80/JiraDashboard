// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import UploadPage from './components/UploadPage';
import SummaryPage from './components/SummaryPage';
import DashboardPage from './components/DashboardPage';
import HelpGuide from './components/HelpGuide';

// ── Section navigator pills (lives in the header when on /dashboard) ──────────
const SECTION_ITEMS = [
  { id: 'dashboard-summary',         label: 'Summary',     color: '#2563eb' },
  { id: 'section-attention',         label: 'Alerts',      color: '#f59e0b' },
  { id: 'section-overview',          label: 'KPIs',        color: '#16a34a' },
  { id: 'section-visuals',           label: 'Charts',      color: '#0891b2' },
  { id: 'section-ratios',            label: 'Composition', color: '#7c3aed' },
  { id: 'section-delivery-controls', label: 'Delivery',    color: '#f97316' },
  { id: 'section-quarters',          label: 'Quarters',    color: '#f97316' },
  { id: 'section-kanban',            label: 'Kanban',      color: '#0f766e' },
  { id: 'section-sprint',            label: 'Sprint',      color: '#7c3aed' },
  { id: 'section-ownership',         label: 'Ownership',   color: '#0f766e' },
  { id: 'section-labels',            label: 'Labels',      color: '#7c3aed' },
  { id: 'section-relations',         label: 'Relations',   color: '#dc2626' },
  { id: 'section-readiness',         label: 'Readiness',   color: '#dc2626' },
  { id: 'flow-health-panel',         label: 'Flow',        color: '#2563eb' },
];

function SectionNavBar() {
  const [active, setActive] = useState(SECTION_ITEMS[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
    );
    SECTION_ITEMS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <nav className="section-nav-bar" aria-label="Dashboard sections">
      {SECTION_ITEMS.map(({ id, label, color }) => (
        <button
          key={id}
          type="button"
          className={`section-nav-pill${active === id ? ' active' : ''}`}
          style={
            active === id
              ? {
                  background: color,
                  borderColor: color,
                  color: 'white',
                  boxShadow: `0 4px 14px ${color}55`,
                }
              : {
                  background: `${color}18`,
                  borderColor: `${color}48`,
                  color,
                }
          }
          onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          aria-label={`Go to ${label}`}
          aria-current={active === id ? 'location' : undefined}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}

// ── Help full-page wrapper ────────────────────────────────────────────────────
function HelpPage({ theme }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const section = searchParams.get('section') || 'welcome';

  return (
    <div className={`app shell ${theme}`}>
      <div className="help-page-container">
        <HelpGuide
          open={true}
          activeSection={section}
          onClose={() => navigate(-1)}
          pageMode={true}
        />
      </div>
    </div>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [theme, setTheme] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setTheme(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const handleDataLoaded = (data) => {
    setDashboardData(data);
    navigate('/summary');
  };

  const handleReset = () => {
    setDashboardData(null);
    navigate('/');
  };

  const openHelp = (section = 'welcome') => {
    navigate(`/help?section=${encodeURIComponent(section)}`);
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          dashboardData
            ? <Navigate to="/summary" replace />
            : (
              <div className={`app shell ${theme}`}>
                <AppHeader theme={theme} setTheme={setTheme} openHelp={openHelp} showNav={false} />
                <UploadPage onDataLoaded={handleDataLoaded} />
                <AppFooter />
              </div>
            )
        }
      />

      <Route
        path="/summary"
        element={
          !dashboardData
            ? <Navigate to="/" replace />
            : (
              <div className={`app shell ${theme}`}>
                <AppHeader theme={theme} setTheme={setTheme} openHelp={openHelp} showNav={true} />
                <SummaryPage data={dashboardData} onReset={handleReset} openHelp={openHelp} />
                <AppFooter />
              </div>
            )
        }
      />

      <Route
        path="/dashboard"
        element={
          !dashboardData
            ? <Navigate to="/" replace />
            : (
              <div className={`app shell ${theme}`}>
                <AppHeader theme={theme} setTheme={setTheme} openHelp={openHelp} showNav={true} showSectionNav={true} />
                <DashboardPage data={dashboardData} onReset={handleReset} onOpenHelp={openHelp} />
                <AppFooter />
              </div>
            )
        }
      />

      <Route path="/help" element={<HelpPage theme={theme} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// ── Shared layout components ──────────────────────────────────────────────────
function AppHeader({ theme, setTheme, openHelp, showNav, showSectionNav }) {
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';

  return (
    <header className="app-header">
      <div className="header-main-row">
        <div>
          <h1>Delivery Clarity</h1>
          <p>Jira Delivery Intelligence — sprint, flow, risk, capacity, and epic readiness from a single export.</p>
        </div>
        <div className="header-actions">
          {showNav && (
            <>
              <Link to="/summary" className={`header-nav-link${location.pathname === '/summary' ? ' active' : ''}`}>Overview</Link>
              <Link to="/dashboard" className={`header-nav-link${isDashboard ? ' active' : ''}`}>Full Report</Link>
            </>
          )}
          <button className="help-button" type="button" onClick={() => openHelp('welcome')}>
            Help
          </button>
          <button className="theme-toggle" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
        </div>
      </div>

      {/* Section navigator — only shown on /dashboard, lives in header to avoid collisions */}
      {showSectionNav && isDashboard && <SectionNavBar />}
    </header>
  );
}

function AppFooter() {
  return (
    <footer className="app-footer">
      © {new Date().getFullYear()} Ali Abu Ras &nbsp;·&nbsp; aburasali80@gmail.com &nbsp;·&nbsp; All rights reserved.
    </footer>
  );
}
