const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';

export async function uploadJiraFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });

  return response.json();
}
