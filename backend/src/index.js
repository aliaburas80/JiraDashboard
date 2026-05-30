// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const uploadRouter = require('./routes/upload');
const { renderBackendHome } = require('./services/backendView');
const { renderDeveloperWiki } = require('./services/developerView');

const app = express();

// CORS: set ALLOWED_ORIGIN in production (comma-separated for multiple origins).
// Defaults to allowing all origins in development.
const allowedOrigins = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(',').map((o) => o.trim())
  : true;

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());
app.use('/api/upload', uploadRouter);

app.get('/', (req, res) => {
  res.type('html').send(renderBackendHome());
});

app.get('/developer', (req, res) => {
  res.type('html').send(renderDeveloperWiki());
});

// Catch any /developer/* sub-paths and redirect to the main wiki page
app.get('/developer/*', (req, res) => {
  res.redirect('/developer');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'delivery-clarity-backend', version: '1.0.0' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Delivery Clarity backend → http://localhost:${PORT}`);
  console.log(`CORS origin: ${process.env.ALLOWED_ORIGIN || '* (all — set ALLOWED_ORIGIN in .env for production)'}`);
});
