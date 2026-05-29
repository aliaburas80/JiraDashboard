// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
import { useState, useEffect } from 'react';
import UploadPage from './components/UploadPage';
import DashboardPage from './components/DashboardPage';
import HelpGuide from './components/HelpGuide';

function App() {
  const [dashboardData, setDashboardData] = useState(null);
  const [theme, setTheme] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpSection, setHelpSection] = useState('welcome');

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setTheme(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const openHelp = (section = 'welcome') => {
    setHelpSection(section);
    setHelpOpen(true);
  };

  return (
    <div className={`app shell ${theme}`}>
      <header className="app-header">
        <div>
          <h1>Delivery Clarity</h1>
          <p>Jira Delivery Intelligence — sprint, flow, risk, capacity, and epic readiness from a single export.</p>
        </div>
        <div className="header-actions">
          <button className="help-button" type="button" onClick={() => openHelp('welcome')}>
            Help
          </button>
          <button className="theme-toggle" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
        </div>
      </header>

      {!dashboardData ? (
        <UploadPage onDataLoaded={setDashboardData} />
      ) : (
        <DashboardPage data={dashboardData} onReset={() => setDashboardData(null)} onOpenHelp={openHelp} />
      )}

      <footer className="app-footer">
        © {new Date().getFullYear()} Ali Abu Ras &nbsp;·&nbsp; aburasali80@gmail.com &nbsp;·&nbsp; All rights reserved.
      </footer>

      <HelpGuide open={helpOpen} activeSection={helpSection} onClose={() => setHelpOpen(false)} />
    </div>
  );
}

export default App;
