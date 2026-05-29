// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
const express = require('express');
const cors = require('cors');
const uploadRouter = require('./routes/upload');
const { renderBackendHome } = require('./services/backendView');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/upload', uploadRouter);

app.get('/', (req, res) => {
  res.type('html').send(renderBackendHome());
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'jira-transparency-dashboard-backend' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
