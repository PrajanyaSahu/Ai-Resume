// models/optimized_resume.js
// Optimized resume versions table

const { DataTypes } = require('sequelize');
const { sequelize } = require('../core/database');

const OptimizedResume = sequelize.define('OptimizedResume', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  analysis_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  content: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  formatted_text: {
    type: DataTypes.TEXT
  },
  version: {
    type: DataTypes.STRING(10),
    defaultValue: 'A'
  }
}, {
  tableName: 'optimized_resumes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = { OptimizedResume };
