// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useSearchParams, Link } from 'react-router-dom';
import UploadPage from './components/UploadPage';
import SummaryPage from './components/SummaryPage';
import DashboardPage from './components/DashboardPage';
import HelpGuide from './components/HelpGuide';

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

  // All ? buttons and Help button navigate to /help?section=xxx
  const openHelp = (section = 'welcome') => {
    navigate(`/help?section=${encodeURIComponent(section)}`);
  };

  return (
    <Routes>
      {/* Upload */}
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

      {/* Summary — first page after upload */}
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

      {/* Full dashboard */}
      <Route
        path="/dashboard"
        element={
          !dashboardData
            ? <Navigate to="/" replace />
            : (
              <div className={`app shell ${theme}`}>
                <AppHeader theme={theme} setTheme={setTheme} openHelp={openHelp} showNav={true} />
                <DashboardPage data={dashboardData} onReset={handleReset} onOpenHelp={openHelp} />
                <AppFooter />
              </div>
            )
        }
      />

      {/* Help — full page route */}
      <Route path="/help" element={<HelpPage theme={theme} />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// ── Shared layout components ──────────────────────────────────────────────────
function AppHeader({ theme, setTheme, openHelp, showNav }) {
  return (
    <header className="app-header">
      <div>
        <h1>Delivery Clarity</h1>
        <p>Jira Delivery Intelligence — sprint, flow, risk, capacity, and epic readiness from a single export.</p>
      </div>
      <div className="header-actions">
        {showNav && (
          <>
            <Link to="/summary" className="header-nav-link">Overview</Link>
            <Link to="/dashboard" className="header-nav-link">Full Report</Link>
          </>
        )}
        <button className="help-button" type="button" onClick={() => openHelp('welcome')}>
          Help
        </button>
        <button className="theme-toggle" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </button>
      </div>
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
