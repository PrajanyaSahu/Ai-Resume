// services/pdfGenerator.js
// Generate ATS-friendly, well-formatted PDF resumes using PDFKit

const PDFDocument = require('pdfkit');

// ─── Colour / style tokens ────────────────────────────────────────────────────
const COLORS = {
    primary: '#1a2b4a',   // dark navy — headings
    accent: '#2563eb',   // blue — rule lines / name
    bodyText: '#1f2937',   // near-black body
    mutedText: '#6b7280',   // grey — dates / company
    bgLight: '#f0f4ff',   // light blue tint (not used on print, kept for reference)
    white: '#ffffff',
    rule: '#2563eb'
};

const FONTS = {
    regular: 'Helvetica',
    bold: 'Helvetica-Bold',
    oblique: 'Helvetica-Oblique'
};

const MARGIN = 48;
const PAGE_W = 595.28; // A4 points
const CONTENT_W = PAGE_W - MARGIN * 2;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Strip markdown bold/italic, clean whitespace */
function cleanLine(line) {
    return line
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/__(.*?)__/g, '$1')
        .replace(/_(.*?)_/g, '$1')
        .replace(/`(.*?)`/g, '$1')
        .trim();
}

/** Remove duplicate lines while preserving order */
function dedup(text) {
    if (!text) return '';
    const seen = new Set();
    return text.split('\n').filter(line => {
        const t = line.trim();
        if (!t || seen.has(t)) return false;
        seen.add(t);
        return true;
    }).join('\n');
}

/**
 * Try to extract the candidate name from parsed resume data.
 * Priority: metadata.name → first non-contact line of raw text → fallback.
 */
function extractName(metadata, sections) {
    if (metadata.name && typeof metadata.name === 'string') {
        return metadata.name.trim();
    }

    // Try contact_info section — first short line that looks like a name
    const contactText = sections.contact_info || '';
    for (const line of contactText.split('\n')) {
        const t = line.trim();
        // A name is typically 2–4 words, no digits, no @ symbol
        if (t && t.length < 60 && t.split(' ').length >= 2 &&
            !/\d/.test(t) && !t.includes('@') && !t.toLowerCase().includes('linkedin')) {
            return t;
        }
    }

    // Derive from email
    if (metadata.email) {
        return metadata.email
            .split('@')[0]
            .replace(/[._0-9]/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase())
            .trim();
    }

    return 'Your Name';
}

// ─── PDF builder ─────────────────────────────────────────────────────────────

function generateResumePDF(resumeData, optimizedExperience) {
    const doc = new PDFDocument({
        margin: MARGIN,
        size: 'A4',
        info: { Title: 'ATS Optimized Resume', Author: 'Resume ATS Optimizer' }
    });

    const metadata = resumeData.metadata || {};
    const sections = resumeData.sections || {};

    // ── SECTION HEADER ──────────────────────────────────────────────────────────
    function sectionHeader(title) {
        doc.moveDown(0.9);

        // Blue rule above header text
        const y = doc.y;
        doc
            .fillColor(COLORS.accent)
            .rect(MARGIN, y, CONTENT_W, 1.5)
            .fill();

        doc.moveDown(0.3);
        doc
            .font(FONTS.bold)
            .fontSize(10.5)
            .fillColor(COLORS.primary)
            .text(title.toUpperCase(), MARGIN, doc.y, { width: CONTENT_W });

        doc.moveDown(0.35);
        doc.font(FONTS.regular).fontSize(10).fillColor(COLORS.bodyText);
    }

    // ── BODY TEXT renderer ──────────────────────────────────────────────────────
    function bodyText(raw) {
        if (!raw || typeof raw !== 'string') return;

        const lines = dedup(raw).split('\n');

        for (const line of lines) {
            const t = cleanLine(line);
            if (!t) continue;

            // Detect job-title-like lines: ALL CAPS, or "Job Title | Company" patterns
            const isJobTitle = /^[A-Z][A-Z\s,.'&()\-/]+$/.test(t) && t.split(' ').length <= 8;

            // Detect date lines: contain  year(s) and possibly month names
            const isDateLine = /\b(20\d{2}|19\d{2})\b/.test(t) && t.length < 60;

            // Detect bullet
            const isBullet = /^[-•*▪–►]/.test(t);

            if (isJobTitle && !isBullet) {
                // Bold job title
                doc
                    .font(FONTS.bold)
                    .fontSize(10.5)
                    .fillColor(COLORS.primary)
                    .text(t, MARGIN, doc.y, { width: CONTENT_W });
                doc.moveDown(0.15);
                doc.font(FONTS.regular).fontSize(10).fillColor(COLORS.bodyText);

            } else if (isDateLine) {
                // Muted date / subtitle
                doc
                    .font(FONTS.oblique)
                    .fontSize(9.5)
                    .fillColor(COLORS.mutedText)
                    .text(t, MARGIN, doc.y, { width: CONTENT_W });
                doc.moveDown(0.2);
                doc.font(FONTS.regular).fontSize(10).fillColor(COLORS.bodyText);

            } else if (isBullet) {
                const content = cleanLine(t.replace(/^[-•*▪–►\s]+/, ''));
                doc
                    .font(FONTS.regular)
                    .fontSize(10)
                    .fillColor(COLORS.bodyText)
                    .text(`• ${content}`, MARGIN + 10, doc.y, {
                        width: CONTENT_W - 10,
                        align: 'left'
                    });
                doc.moveDown(0.25);

            } else {
                // Normal paragraph
                doc
                    .font(FONTS.regular)
                    .fontSize(10)
                    .fillColor(COLORS.bodyText)
                    .text(t, MARGIN, doc.y, { width: CONTENT_W, align: 'left' });
                doc.moveDown(0.25);
            }
        }

        doc.moveDown(0.3);
    }

    // ── HEADER ──────────────────────────────────────────────────────────────────
    const name = extractName(metadata, sections);

    // Name — large, navy, bold
    doc
        .font(FONTS.bold)
        .fontSize(22)
        .fillColor(COLORS.primary)
        .text(name, MARGIN, MARGIN, { align: 'center', width: CONTENT_W });

    doc.moveDown(0.4);

    // Contact info row
    const contactParts = [];
    if (metadata.email) contactParts.push(metadata.email);
    if (metadata.phone) contactParts.push(metadata.phone);
    if (metadata.linkedin) contactParts.push(metadata.linkedin);

    if (contactParts.length) {
        doc
            .font(FONTS.regular)
            .fontSize(9)
            .fillColor(COLORS.mutedText)
            .text(contactParts.join('   |   '), MARGIN, doc.y, {
                width: CONTENT_W,
                align: 'center'
            });
        doc.moveDown(0.3);
    }

    // Full-width accent rule under header
    doc
        .fillColor(COLORS.accent)
        .rect(MARGIN, doc.y, CONTENT_W, 2)
        .fill();

    doc.moveDown(0.6);
    doc.font(FONTS.regular).fontSize(10).fillColor(COLORS.bodyText);

    // ── PROFESSIONAL SUMMARY ────────────────────────────────────────────────────
    if (sections.summary) {
        sectionHeader('Professional Summary');
        bodyText(sections.summary);
    }

    // ── EXPERIENCE (uses AI-optimized version if available) ──────────────────
    if (optimizedExperience) {
        // If the original resume had an experience section, label it explicitly.
        // If not (full-resume optimization), the AI output already contains section headers.
        const hadExperience = !!(sections.experience);
        if (hadExperience) {
            sectionHeader('Professional Experience');
        }
        bodyText(optimizedExperience);
    } else if (sections.experience) {
        sectionHeader('Professional Experience');
        bodyText(sections.experience);
    }
    // If neither exists simply skip — other sections cover the content.

    // ── EDUCATION ───────────────────────────────────────────────────────────────
    if (sections.education) {
        sectionHeader('Education');
        bodyText(dedup(sections.education));
    }

    // ── SKILLS ──────────────────────────────────────────────────────────────────
    if (sections.skills) {
        sectionHeader('Skills');
        // Skills are often a long comma-separated string — wrap nicely
        const skillText = dedup(sections.skills);
        doc
            .font(FONTS.regular)
            .fontSize(10)
            .fillColor(COLORS.bodyText)
            .text(skillText, MARGIN, doc.y, { width: CONTENT_W, align: 'left' });
        doc.moveDown(0.5);
    }

    // ── PROJECTS ─────────────────────────────────────────────────────────────────
    if (sections.projects) {
        sectionHeader('Projects');
        bodyText(dedup(sections.projects));
    }

    // ── CERTIFICATIONS ───────────────────────────────────────────────────────────
    if (sections.certifications) {
        sectionHeader('Certifications & Awards');
        bodyText(dedup(sections.certifications));
    }

    // ── LANGUAGES ────────────────────────────────────────────────────────────────
    if (sections.languages) {
        sectionHeader('Languages');
        bodyText(dedup(sections.languages));
    }

    // ── ANY OTHER SECTIONS ──────────────────────────────────────────────────────
    const SKIP_KEYS = new Set(['summary', 'experience', 'education', 'skills',
        'contact_info', 'other', 'projects', 'certifications', 'languages']);
    for (const [key, content] of Object.entries(sections)) {
        if (SKIP_KEYS.has(key) || !content || content.length < 20) continue;
        sectionHeader(key.replace(/_/g, ' '));
        bodyText(dedup(content));
    }

    return doc;
}

module.exports = { generateResumePDF };