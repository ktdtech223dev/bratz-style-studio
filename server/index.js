require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const pool = require('./db');

const playerRoutes = require('./routes/player');
const gachaRoutes = require('./routes/gacha');
const looksRoutes = require('./routes/looks');
const challengesRoutes = require('./routes/challenges');
const economyRoutes = require('./routes/economy');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '2mb' }));

// Serve static files from client build
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));

// Health check — always returns 200 so Railway deploy succeeds
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API routes
app.use('/api/player', playerRoutes);
app.use('/api/gacha', gachaRoutes);
app.use('/api/looks', looksRoutes);
app.use('/api/challenges', challengesRoutes);
app.use('/api/economy', economyRoutes);

// SPA catch-all
app.get('*', (req, res) => {
  const indexPath = path.join(clientDist, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: 'Client build not found. Run npm run build first.' });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Run schema on startup then listen
async function start() {
  try {
    const schemaPath = path.join(__dirname, 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    await pool.query(schema);
    console.log('Database schema applied successfully');
  } catch (err) {
    console.error('Failed to apply database schema:', err.message);
    // Continue starting even if schema fails (tables may already exist)
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bratz Style Studio server running on port ${PORT}`);
  });
}

start();
