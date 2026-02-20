// models/resume.js
// Resume table model

const { DataTypes } = require('sequelize');
const { sequelize } = require('../core/database');

const Resume = sequelize.define('Resume', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  filename: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  file_path: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  file_type: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  parsed_text: {
    type: DataTypes.TEXT
  },
  metadata: {
    type: DataTypes.JSONB
  },
  sections: {
    type: DataTypes.JSONB
  }
}, {
  tableName: 'resumes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = { Resume };
