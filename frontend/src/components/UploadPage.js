// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
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
        <span className="upload-eyebrow">Delivery Clarity — Jira Intelligence</span>
        <h2>Turn your Jira export into instant delivery insight</h2>
        <p>Upload any Jira CSV or Excel export and get sprint health, flow efficiency, risk signals, capacity, epic readiness, and quarter trends — all in one workspace.</p>
        <label className={`file-input-label upload-action ${loading ? 'disabled' : ''}`}>
          <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} disabled={loading} />
          {loading ? 'Uploading...' : 'Upload Jira file'}
        </label>
        {error && <div className="alert error">{error}</div>}
      </div>
    </main>
  );
}
