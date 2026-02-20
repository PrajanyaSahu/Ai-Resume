// schemas/analysis.js
// Request validation for analysis routes

const { body } = require('express-validator');

const analysisSchema = [
  body('job_title')
    .notEmpty()
    .withMessage('Job title is required')
    .isString()
    .trim(),
  body('job_description')
    .notEmpty()
    .withMessage('Job description is required')
    .isString()
    .isLength({ min: 10 })
    .withMessage('Job description must be at least 10 characters'),
  body('company_name')
    .optional()
    .isString()
    .trim()
];

const rewriteSchema = [
  body('experience_text')
    .notEmpty()
    .withMessage('Experience text is required')
    .isString(),
  body('analysis_id')
    .notEmpty()
    .withMessage('Analysis ID is required')
    .isUUID()
];

module.exports = { analysisSchema, rewriteSchema };
