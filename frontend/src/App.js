import { useState } from 'react';
import UploadPage from './components/UploadPage';
import DashboardPage from './components/DashboardPage';

function App() {
  const [dashboardData, setDashboardData] = useState(null);
  const [theme, setTheme] = useState('light');

  return (
    <div className={`app shell ${theme}`}>
      <header className="app-header">
        <div>
          <h1>Jira Transparency Dashboard</h1>
          <p>Upload Jira export data to visualize sprint, release, and risk health.</p>
        </div>
        <button className="theme-toggle" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </button>
      </header>

      {!dashboardData ? (
        <UploadPage onDataLoaded={setDashboardData} />
      ) : (
        <DashboardPage data={dashboardData} onReset={() => setDashboardData(null)} />
      )}
    </div>
  );
}

export default App;
