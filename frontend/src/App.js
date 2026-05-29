import { useState } from 'react';
import UploadPage from './components/UploadPage';
import DashboardPage from './components/DashboardPage';
import HelpGuide from './components/HelpGuide';

function App() {
  const [dashboardData, setDashboardData] = useState(null);
  const [theme, setTheme] = useState('light');
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpSection, setHelpSection] = useState('start');

  const openHelp = (section = 'start') => {
    setHelpSection(section);
    setHelpOpen(true);
  };

  return (
    <div className={`app shell ${theme}`}>
      <header className="app-header">
        <div>
          <h1>Jira Transparency Dashboard</h1>
          <p>Upload Jira export data to visualize sprint, release, and risk health.</p>
        </div>
        <div className="header-actions">
          <button className="help-button" type="button" onClick={() => openHelp('start')}>
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

      <HelpGuide open={helpOpen} activeSection={helpSection} onClose={() => setHelpOpen(false)} />
    </div>
  );
}

export default App;
