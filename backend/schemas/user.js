// schemas/user.js
// Request validation for user routes using express-validator

const { body } = require('express-validator');

const registerSchema = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('name')
    .optional()
    .isString()
    .trim()
];

const loginSchema = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

module.exports = { registerSchema, loginSchema };
