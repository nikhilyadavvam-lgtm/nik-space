require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { connectDB } = require('./config/db');
const { validateEnv } = require('./config/env');
const routes = require('./routes');

// Validate environment on startup
validateEnv();

const app = express();
const PORT = process.env.PORT || 10000;

app.set('trust proxy', 1); 

// ── Inline NoSQL injection sanitizer ──
function sanitize(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
    } else if (typeof obj[key] === 'object') {
      sanitize(obj[key]);
    }
  }
  return obj;
}

// ── Security middleware ──
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use((req, res, next) => {
  if (req.body) sanitize(req.body);
  next();
});


app.get('/', (req, res) => {
  res.json({ message: 'Welcome to NIK SPACE backend' });

});
// ── Routes ──
app.use('/api', routes);

// ── Health check ──
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Start server ──
connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 NIK SPACE backend running on http://0.0.0.0:${PORT}`);
  });
});
