// const http = require('http');

// const server = http.createServer((req, res) => {
//     res.writeHead(200, { 'Content-Type': 'text/plain' });
//     res.end('Server is running');
// });

// const PORT = 3000;
// server.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
// });

// server.js
// Main Node.js application entry point

const express = require('express');
const cors = require('cors');
const nunjucks = require('nunjucks');
const path = require('path');
require('dotenv').config();

const config = require('./backend/core/config');
const { connectDB, syncDB } = require('./backend/core/database');

// Import routers
const authRouter = require('./backend/routers/auth');
const analysisRouter = require('./backend/routers/analysis');
const optimizerRouter = require('./backend/routers/optimizer');

const app = express();

// ─── Middleware ────────────────────────────────────────────────
app.use(cors({ origin: config.CORS_ORIGINS, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/static', express.static(path.join(__dirname, 'frontend/static')));

// ─── Nunjucks templating ────────────────────────────────────────
nunjucks.configure(path.join(__dirname, 'frontend/templates'), {
  autoescape: true,
  express: app
});
app.set('view engine', 'html');

// ─── API Routes ─────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/analysis', analysisRouter);
app.use('/api/optimizer', optimizerRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', version: config.VERSION });
});

// ─── Frontend Routes ─────────────────────────────────────────────
app.get('/', (req, res) => res.render('index.html'));
app.get('/login', (req, res) => res.render('login.html'));
app.get('/register', (req, res) => res.render('register.html'));
app.get('/dashboard', (req, res) => res.render('dashboard.html'));
app.get('/upload', (req, res) => res.render('upload.html'));
app.get('/results', (req, res) => res.render('results.html'));

// ─── Error handler ───────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ detail: err.message || 'Internal server error' });
});

// ─── Start server ────────────────────────────────────────────────
async function start() {
  await connectDB();
  await syncDB();

  app.listen(config.PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${config.PORT}`);
    console.log(`📄 Frontend:   http://localhost:${config.PORT}`);
    console.log(`🔌 API:        http://localhost:${config.PORT}/api`);
    console.log(`💚 Health:     http://localhost:${config.PORT}/api/health\n`);
  });
}

start();
