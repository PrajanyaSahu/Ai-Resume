// models/usage_limit.js
// Free tier usage tracking

const { DataTypes } = require('sequelize');
const { sequelize } = require('../core/database');

const UsageLimit = sequelize.define('UsageLimit', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true
  },
  analyses_used: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  analyses_limit: {
    type: DataTypes.INTEGER,
    defaultValue: 2
  },
  rewrites_used: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  rewrites_limit: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  reset_date: {
    type: DataTypes.DATE,
    defaultValue: () => {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      return d;
    }
  }
}, {
  tableName: 'usage_limits',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Instance methods
UsageLimit.prototype.canAnalyze = function () {
  this.checkReset();
  return this.analyses_used < this.analyses_limit;
};

UsageLimit.prototype.canRewrite = function () {
  this.checkReset();
  return this.rewrites_used < this.rewrites_limit;
};

UsageLimit.prototype.checkReset = function () {
  if (new Date() >= new Date(this.reset_date)) {
    this.analyses_used = 0;
    this.rewrites_used = 0;
    const d = new Date();
    d.setDate(d.getDate() + 30);
    this.reset_date = d;
    this.save();
  }
};

module.exports = { UsageLimit };
