// core/config.js
// Application configuration & environment variables

require('dotenv').config();
const path = require('path');
const fs = require('fs');

const config = {
  // App
  APP_NAME: 'Resume ATS Optimizer',
  VERSION: '1.0.0',
  PORT: process.env.PORT || 8000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/resume_ats',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  JWT_EXPIRES_IN: '7d',

  // Gemini
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: 'gemini-2.5-flash',

  // File Upload
  UPLOAD_DIR: path.join(__dirname, '../../uploads'),
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_EXTENSIONS: ['.pdf', '.docx', '.doc', '.txt'],

  // Free Tier Limits
  FREE_ANALYSES_LIMIT: 2,
  FREE_REWRITES_LIMIT: 1,

  // CORS
  CORS_ORIGINS: ['http://localhost:8000', 'http://127.0.0.1:8000']
};

// Ensure upload directory exists
if (!fs.existsSync(config.UPLOAD_DIR)) {
  fs.mkdirSync(config.UPLOAD_DIR, { recursive: true });
}

module.exports = config;