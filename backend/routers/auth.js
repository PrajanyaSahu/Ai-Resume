// routers/auth.js
// Authentication routes: register, login, me

const express = require('express');
const { validationResult } = require('express-validator');
const { User } = require('../models/user');
const { UsageLimit } = require('../models/usage_limit');
const { hashPassword, verifyPassword, createToken, requireAuth } = require('../core/security');
const { registerSchema, loginSchema } = require('../schemas/user');

const router = express.Router();

// POST /api/auth/register
router.post('/register', registerSchema, async (req, res) => {
  // Validate
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ detail: errors.array()[0].msg });
  }

  const { email, password, name } = req.body;

  try {
    // Check if email already exists
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ detail: 'Email already registered' });
    }

    // Create user
    const user = await User.create({
      email,
      password_hash: await hashPassword(password),
      name: name || null
    });

    // Create usage limits for new user
    await UsageLimit.create({ user_id: user.id });

    // Generate token
    const token = createToken(user.id);

    res.status(201).json({
      access_token: token,
      token_type: 'bearer',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at
      }
    });

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ detail: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', loginSchema, async (req, res) => {
  // Validate
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ detail: errors.array()[0].msg });
  }

  const { email, password } = req.body;

  try {
    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ detail: 'Invalid email or password' });
    }

    // Verify password
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ detail: 'Invalid email or password' });
    }

    // Generate token
    const token = createToken(user.id);

    res.json({
      access_token: token,
      token_type: 'bearer',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ detail: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  const usage = await UsageLimit.findOne({ where: { user_id: req.user.id } });

  res.json({
    id: req.user.id,
    email: req.user.email,
    name: req.user.name,
    created_at: req.user.created_at,
    usage: usage ? {
      analyses_used: usage.analyses_used,
      analyses_remaining: usage.analyses_limit - usage.analyses_used,
      rewrites_used: usage.rewrites_used,
      rewrites_remaining: usage.rewrites_limit - usage.rewrites_used,
      reset_date: usage.reset_date
    } : null
  });
});

module.exports = router;