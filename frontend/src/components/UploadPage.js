import { useState } from 'react';
import { uploadJiraFile } from '../services/api';

export default function UploadPage({ onDataLoaded }) {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0];
    setError(null);

    if (!selectedFile) {
      return;
    }

    setLoading(true);
    try {
      const result = await uploadJiraFile(selectedFile);
      if (result.error) {
        const details = Array.isArray(result.details) && result.details.length
          ? ` ${result.details.join(' ')}`
          : '';
        setError(`${result.error}.${details}`);
      } else {
        onDataLoaded(result.metrics);
      }
    } catch (uploadError) {
      setError('Unable to upload file. Please try a different Jira export.');
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  return (
    <main className="upload-page card">
      <div>
        <span className="upload-eyebrow">Jira export analyzer</span>
        <h2>Start with a Jira Export</h2>
        <p>Upload a Jira CSV or Excel file and get delivery health, quarter trends, flow metrics, capacity, and risk analysis in one workspace.</p>
        <label className={`file-input-label upload-action ${loading ? 'disabled' : ''}`}>
          <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} disabled={loading} />
          {loading ? 'Uploading...' : 'Upload Jira file'}
        </label>
        {error && <div className="alert error">{error}</div>}
      </div>
    </main>
  );
}
