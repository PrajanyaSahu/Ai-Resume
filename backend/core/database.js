// core/database.js
// PostgreSQL connection using Sequelize ORM

const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Test connection
async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected');
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    process.exit(1);
  }
}

// Sync all models (create tables if not exist)
async function syncDB() {
  try {
    await sequelize.sync({ alter: true });
    console.log('✅ Database tables synced');
  } catch (error) {
    console.error('❌ Database sync error:', error.message);
  }
}

module.exports = { sequelize, connectDB, syncDB };
