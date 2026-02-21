const express = require('express');
const { body, validationResult } = require('express-validator');
const { requireAuth, optionalAuth } = require('../core/security');
const { guestDownloadLimit, incrementGuestDownload } = require('../core/guestLimiter');
const { Analysis } = require('../models/analysis');
const { Resume } = require('../models/resume');
const { OptimizedResume } = require('../models/optimized_resume');
const { UsageLimit } = require('../models/usage_limit');
const aiService = require('../services/Aiservice');
const { generateResumePDF } = require('../services/pdfGenerator');

const router = express.Router();

// POST /api/optimizer/rewrite
router.post('/rewrite', optionalAuth, [
  body('analysis_id').notEmpty().withMessage('analysis_id is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ detail: errors.array()[0].msg });
  }

  const { analysis_id, experience_text } = req.body;

  try {
    let usage;
    // Check usage limits ONLY if user is logged in
    if (req.user) {
      usage = await UsageLimit.findOne({ where: { user_id: req.user.id } });
      if (!usage || !usage.canRewrite()) {
        return res.status(403).json({
          detail: `Rewrite limit reached. Used ${usage?.rewrites_used}/${usage?.rewrites_limit}.`
        });
      }
    }

    // Get analysis
    const analysis = await Analysis.findByPk(analysis_id);

    if (!analysis) {
      return res.status(404).json({ detail: 'Analysis not found' });
    }

    // Check permission
    if (analysis.user_id && (!req.user || req.user.id !== analysis.user_id)) {
      return res.status(403).json({ detail: 'Access denied' });
    }

    // Get text to rewrite — priority: manual input > sections.experience > full parsed_text
    let textToRewrite = experience_text;
    let isFullResume = false;
    if (!textToRewrite && analysis.resume_id) {
      const resume = await Resume.findByPk(analysis.resume_id);
      if (resume) {
        if (resume.sections && resume.sections.experience) {
          textToRewrite = resume.sections.experience;
        } else {
          // No experience section found — optimize entire resume content
          textToRewrite = resume.parsed_text;
          isFullResume = true;
        }
      }
    }

    if (!textToRewrite) {
      return res.status(400).json({ detail: 'Could not find resume text to optimize. Please try re-uploading your resume.' });
    }

    // Rewrite using Gemini
    const rewritten = await aiService.rewriteExperience(
      textToRewrite,
      analysis.job_description,
      analysis.missing_keywords || [],
      isFullResume
    );

    // Save optimized resume
    const optimized = await OptimizedResume.create({
      analysis_id: analysis.id,
      user_id: req.user ? req.user.id : null,
      content: { experience: rewritten },
      formatted_text: rewritten,
      version: 'A'
    });

    // Increment usage if user exists
    if (usage) {
      await usage.increment('rewrites_used');
    }

    res.json({
      success: true,
      data: {
        optimized_id: optimized.id,
        original: textToRewrite,
        rewritten,
        keywords_integrated: (analysis.missing_keywords || []).slice(0, 5),
        usage: usage ? {
          rewrites_used: usage.rewrites_used + 1,
          rewrites_remaining: usage.rewrites_limit - usage.rewrites_used - 1
        } : null
      }
    });

  } catch (err) {
    console.error('Rewrite error:', err);
    res.status(500).json({ detail: `Rewrite failed: ${err.message}` });
  }
});

// GET /api/optimizer/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const optimized = await OptimizedResume.findByPk(req.params.id);

    if (!optimized) {
      return res.status(404).json({ detail: 'Optimized resume not found' });
    }

    // Check permission
    if (optimized.user_id && (!req.user || req.user.id !== optimized.user_id)) {
      return res.status(403).json({ detail: 'Access denied' });
    }

    res.json({
      success: true,
      data: {
        id: optimized.id,
        content: optimized.content,
        formatted_text: optimized.formatted_text,
        version: optimized.version,
        created_at: optimized.created_at
      }
    });
  } catch (err) {
    res.status(500).json({ detail: 'Failed to load optimized resume' });
  }
});

// POST /api/optimizer/download-pdf
router.post('/download-pdf', optionalAuth, guestDownloadLimit, [
  body('analysis_id').notEmpty().withMessage('analysis_id is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ detail: errors.array()[0].msg });
  }

  const { analysis_id, optimized_text } = req.body;

  try {
    // Get analysis
    const analysis = await Analysis.findByPk(analysis_id);
    if (!analysis) return res.status(404).json({ detail: 'Analysis not found' });

    // Permission check
    if (analysis.user_id && (!req.user || req.user.id !== analysis.user_id)) {
      return res.status(403).json({ detail: 'Access denied' });
    }

    // Get Resume data (metadata, sections)
    const resume = await Resume.findByPk(analysis.resume_id);
    if (!resume) return res.status(404).json({ detail: 'Original resume not found' });

    // determine experience text: manual input > optimized DB record > original resume
    let experienceContent = optimized_text;

    if (!experienceContent) {
      // Try finding latest optimized version
      const latestOpt = await OptimizedResume.findOne({
        where: { analysis_id: analysis.id },
        order: [['created_at', 'DESC']]
      });
      if (latestOpt) experienceContent = latestOpt.formatted_text;
    }

    if (!experienceContent && resume.sections) {
      experienceContent = resume.sections.experience;
    }

    // Generate PDF
    const doc = generateResumePDF(resume, experienceContent);

    // Increment guest download counter before streaming (count the attempt)
    incrementGuestDownload(req);

    // Set headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ATS_Optimized_Resume.pdf"`);

    doc.pipe(res);
    doc.end();

  } catch (err) {
    console.error('PDF Generation Error:', err);
    // If headers sent, we can't send JSON error, so we might crash stream or just log
    if (!res.headersSent) {
      res.status(500).json({ detail: `PDF generation failed: ${err.message}` });
    }
  }
});

module.exports = router;