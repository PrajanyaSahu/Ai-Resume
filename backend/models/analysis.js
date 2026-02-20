// models/analysis.js
// Analysis results table model

const { DataTypes } = require('sequelize');
const { sequelize } = require('../core/database');

const Analysis = sequelize.define('Analysis', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  resume_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  // Job info
  job_title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  company_name: {
    type: DataTypes.STRING(255)
  },
  job_description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  // Match analysis
  match_score: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 10 }
  },
  match_reasoning: {
    type: DataTypes.TEXT
  },
  match_summary: {
    type: DataTypes.TEXT
  },
  strengths: {
    type: DataTypes.ARRAY(DataTypes.TEXT)
  },
  gaps: {
    type: DataTypes.ARRAY(DataTypes.TEXT)
  },
  // Keywords
  missing_keywords: {
    type: DataTypes.ARRAY(DataTypes.TEXT)
  },
  // ATS analysis
  ats_score: {
    type: DataTypes.INTEGER,
    validate: { min: 0, max: 100 }
  },
  ats_issues: {
    type: DataTypes.JSONB
  },
  ats_warnings: {
    type: DataTypes.JSONB
  },
  ats_recommendations: {
    type: DataTypes.ARRAY(DataTypes.TEXT)
  }
}, {
  tableName: 'analyses',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = { Analysis };
