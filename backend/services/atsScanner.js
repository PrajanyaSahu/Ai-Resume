

const path = require('path');
const fs = require('fs');

class ATSScannerService {

  scanResume(filePath, resumeText) {
    const ext = path.extname(filePath).toLowerCase();

    // Normalize text (fix spacing/typos) WITHOUT over-stripping
    const normalizedText = this._normalizeText(resumeText);
    // A more aggressively cleaned version for keyword matching only
    const lowerText = normalizedText.toLowerCase();

    const issues = [];
    const warnings = [];

    issues.push(...this._checkFileFormat(filePath, ext));
    issues.push(...this._checkStructure(normalizedText, lowerText));
    warnings.push(...this._checkContent(lowerText));

    const score = this._calculateScore(issues, warnings, normalizedText);

    return {
      compatibility_score: score,
      total_issues: issues.length,
      total_warnings: warnings.length,
      issues,
      warnings,
      recommendations: this._buildRecommendations(issues, warnings)
    };
  }

  // Normalize text: fix common OCR typos and spacing WITHOUT stripping important chars
  _normalizeText(text) {
    if (!text || typeof text !== 'string') return '';

    // De-duplicate repeated content blocks (handles bad PDF parsing)
    const half = Math.floor(text.length / 2);
    const firstHalf = text.substring(0, half);
    const secondHalf = text.substring(half);
    if (secondHalf.includes(firstHalf.substring(0, 100))) {
      text = firstHalf;
    }

    return text
      .replace(/\r/g, '')
      .replace(/Bachelorof/g, 'Bachelor of')   // Fix before lowercase
      .replace(/Linkedln:/gi, 'LinkedIn:')
      .replace(/\n{3,}/g, '\n\n')              // Reduce excessive blank lines
      .trim();
  }

  _checkFileFormat(filePath, ext) {
    const issues = [];

    if (!['.pdf', '.docx', '.doc', '.txt'].includes(ext)) {
      issues.push({
        category: 'File Format',
        severity: 'high',
        description: `Unsupported format: ${ext}`,
        recommendation: 'Use PDF or DOCX format'
      });
    }

    // Guard against missing/cleaned-up temp file
    try {
      const stats = fs.statSync(filePath);
      if (stats.size < 500) {
        issues.push({
          category: 'File Size',
          severity: 'high',
          description: 'File appears to be empty or too small',
          recommendation: 'Ensure resume has sufficient content'
        });
      }
    } catch (_) {
      // File may have been cleaned up after parsing — skip size check
    }

    return issues;
  }

  _checkStructure(text, lowerText) {
    const issues = [];

    // Check for key sections using the lowercased version
    if (!/(experience|work|employment)/.test(lowerText)) {
      issues.push({
        category: 'Missing Section',
        severity: 'high',
        description: "No 'Experience' section found",
        recommendation: "Add a clearly labeled 'Professional Experience' section"
      });
    }

    if (!/(education|academic|university|college|degree)/.test(lowerText)) {
      issues.push({
        category: 'Missing Section',
        severity: 'medium',
        description: "No 'Education' section found",
        recommendation: "Add a clearly labeled 'Education' section"
      });
    }

    if (!/(skills|technologies|programming)/.test(lowerText)) {
      issues.push({
        category: 'Missing Section',
        severity: 'medium',
        description: "No 'Skills' section found",
        recommendation: "Add a clearly labeled 'Skills' section"
      });
    }

    // Email check on original (not over-cleaned) text
    if (!/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(text)) {
      issues.push({
        category: 'Contact Info',
        severity: 'high',
        description: 'No email address found',
        recommendation: 'Include your email address in the contact section'
      });
    }

    // Phone check
    if (!/((\+91[\-\s]?)?[6-9]\d{9}|\d{3}[\-.\s]\d{3}[\-.\s]\d{4})/.test(text)) {
      issues.push({
        category: 'Contact Info',
        severity: 'medium',
        description: 'No phone number found',
        recommendation: 'Include your phone number in the contact section'
      });
    }

    return issues;
  }

  _checkContent(lowerText) {
    const warnings = [];
    const wordCount = lowerText.split(/\s+/).filter(Boolean).length;

    if (wordCount < 150) {
      warnings.push({
        category: 'Content Length',
        severity: 'medium',
        description: `Resume is short (${wordCount} words)`,
        recommendation: 'Expand with more details about your experience and skills'
      });
    }

    if (wordCount > 1200) {
      warnings.push({
        category: 'Content Length',
        severity: 'low',
        description: `Resume is long (${wordCount} words)`,
        recommendation: 'Consider condensing to 1-2 pages for better ATS parsing'
      });
    }

    // Check for measurable achievements (good ATS signal)
    if (!/%|\d+x|\$[\d,]+|increased|reduced|improved|delivered|launched/i.test(lowerText)) {
      warnings.push({
        category: 'Quantified Achievements',
        severity: 'medium',
        description: 'No quantified achievements found',
        recommendation: 'Add metrics like "Improved performance by 30%" to strengthen ATS scoring'
      });
    }

    const specialChars = ['©', '®', '™', '★', '→', '←'];
    const found = specialChars.filter(c => lowerText.includes(c));
    if (found.length) {
      warnings.push({
        category: 'Special Characters',
        severity: 'low',
        description: `Special characters found: ${found.join(' ')}`,
        recommendation: 'Replace with standard text equivalents'
      });
    }

    return warnings;
  }

  _calculateScore(issues, warnings, text) {
    let score = 100;

    for (const issue of issues) {
      if (issue.severity === 'high') score -= 15;
      else if (issue.severity === 'medium') score -= 8;
      else score -= 3;
    }

    for (const warning of warnings) {
      if (warning.severity === 'medium') score -= 5;
      else score -= 2;
    }

    // Bonuses for good practices
    if (/@/.test(text)) score += 5;                        // has email
    if (/linkedin/i.test(text)) score += 3;                 // has LinkedIn
    if (/github/i.test(text)) score += 3;                   // has GitHub
    if (text.split(/\s+/).filter(Boolean).length >= 200) score += 5; // sufficient content

    return Math.max(0, Math.min(100, score));
  }

  _buildRecommendations(issues, warnings) {
    const recs = [];

    issues
      .filter(i => i.severity === 'high')
      .forEach(i => recs.push(i.recommendation));

    issues
      .filter(i => i.severity === 'medium')
      .forEach(i => recs.push(i.recommendation));

    warnings
      .slice(0, 3)
      .forEach(w => recs.push(w.recommendation));

    return recs;
  }
}

module.exports = new ATSScannerService();
