// core/security.js
// JWT token management and password hashing

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('./config');
const { User } = require('../models/user');

// Hash password
async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

// Verify password
async function verifyPassword(plain, hashed) {
  return await bcrypt.compare(plain, hashed);
}

// Create JWT token
function createToken(userId) {
  return jwt.sign(
    { sub: userId },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );
}

// Verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, config.JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// Auth middleware — protect routes
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ detail: 'No token provided' });
    }

    const token = authHeader.slice(7);
    const payload = verifyToken(token);

    if (!payload) {
      return res.status(401).json({ detail: 'Invalid or expired token' });
    }

    const user = await User.findByPk(payload.sub);
    if (!user) {
      return res.status(401).json({ detail: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ detail: 'Authentication error' });
  }
}

// Optional Auth middleware — allow guest or authenticated user
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const payload = verifyToken(token);

      if (payload) {
        const user = await User.findByPk(payload.sub);
        if (user) {
          req.user = user;
        }
      }
    }
    next();
  } catch (err) {
    // If auth fails, just proceed as guest (req.user will be undefined)
    next();
  }
}

module.exports = { hashPassword, verifyPassword, createToken, verifyToken, requireAuth, optionalAuth };