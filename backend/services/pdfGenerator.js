// // services/pdfGenerator.js
// // Generate ATS-friendly PDF resumes

// const PDFDocument = require('pdfkit');
// const fs = require('fs');

// /**
//  * Generate a clean, ATS-friendly PDF
//  * @param {Object} resumeData - Original resume data (metadata, sections)
//  * @param {String} optimizedExperience - The optimized experience text
//  * @returns {PDFDocument} - The PDF document stream
//  */
// function generateResumePDF(resumeData, optimizedExperience) {
//     const doc = new PDFDocument({ margin: 50, font: 'Helvetica' });

//     const metadata = resumeData.metadata || {};
//     const sections = resumeData.sections || {};

//     // -- HELPER FUNCTIONS --
//     const printSectionHeader = (title) => {
//         doc.moveDown(1);
//         doc.fontSize(12).font('Helvetica-Bold').text(title.toUpperCase(), { align: 'left' });
//         doc.strokeColor('#333333').lineWidth(1)
//             .moveTo(doc.x, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
//         doc.moveDown(0.5);
//         doc.font('Helvetica').fontSize(10);
//     };

//     const printBodyText = (text) => {
//         if (!text) return;
//         const lines = text.split('\n');
//         lines.forEach(line => {
//             const trimmed = line.trim();
//             if (!trimmed) return;

//             // Check for bullet points
//             if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
//                 // Remove the bullet char and render as list item
//                 const content = trimmed.substring(1).trim();
//                 doc.text(`• ${content}`, { indent: 10, align: 'justify' });
//             } else {
//                 doc.text(trimmed, { align: 'justify' });
//             }
//             doc.moveDown(0.2);
//         });
//         doc.moveDown(0.5);
//     };

//     // -- HEADER (Contact Info) --
//     let name = "Candidate Name";
//     // Try to find name in metadata if parser supports it, or first line of raw text? 
//     // For now, we'll use a generic placeholder or the email prefix if available
//     if (metadata.email) {
//         name = metadata.email.split('@')[0].replace(/[._]/g, ' ').toUpperCase();
//     }

//     doc.fontSize(18).font('Helvetica-Bold').text(name, { align: 'center' });
//     doc.moveDown(0.3);

//     const contactLines = [];
//     if (metadata.email) contactLines.push(metadata.email);
//     if (metadata.phone) contactLines.push(metadata.phone);
//     if (metadata.linkedin) contactLines.push(metadata.linkedin);

//     doc.fontSize(10).font('Helvetica').text(contactLines.join('  |  '), { align: 'center' });
//     doc.moveDown(1.5);

//     // -- SUMMARY --
//     if (sections.summary) {
//         printSectionHeader('Professional Summary');
//         printBodyText(sections.summary);
//     }

//     // -- EXPERIENCE (Optimized) --
//     printSectionHeader('Professional Experience');
//     const xpText = optimizedExperience || sections.experience || 'No experience section found.';
//     printBodyText(xpText);

//     // -- EDUCATION --
//     if (sections.education) {
//         printSectionHeader('Education');
//         printBodyText(sections.education);
//     }

//     // -- SKILLS --
//     if (sections.skills) {
//         printSectionHeader('Skills');
//         printBodyText(sections.skills);
//     }

//     // -- PROJECTS --
//     if (sections.projects) {
//         printSectionHeader('Projects');
//         printBodyText(sections.projects);
//     }

//     // -- CERTIFICATIONS --
//     if (sections.certifications) {
//         printSectionHeader('Certifications & Awards');
//         printBodyText(sections.certifications);
//     }

//     // -- LANGUAGES --
//     if (sections.languages) {
//         printSectionHeader('Languages');
//         printBodyText(sections.languages);
//     }

//     // -- ADDITIONAL SECTIONS --
//     const standardKeys = ['summary', 'experience', 'education', 'skills', 'contact_info', 'other'];
//     const otherSections = Object.entries(sections).filter(([key, content]) =>
//         !standardKeys.includes(key) && content && content.length > 20
//     );

//     otherSections.forEach(([key, content]) => {
//         printSectionHeader(key);
//         printBodyText(content);
//     });

//     return doc;
// }

// module.exports = { generateResumePDF };

const PDFDocument = require('pdfkit');
const fs = require('fs');

function extractSection(text, sectionName) {
    if (!text) return '';

    const lower = text.toLowerCase();

    const sectionOrder = [
        'summary',
        'experience',
        'skills',
        'projects',
        'education',
        'certifications',
        'languages'
    ];

    const startIndex = lower.indexOf(sectionName);
    if (startIndex === -1) return '';

    let endIndex = text.length;

    for (let sec of sectionOrder) {
        if (sec === sectionName) continue;

        const idx = lower.indexOf(sec, startIndex + 10);
        if (idx !== -1 && idx < endIndex) {
            endIndex = idx;
        }
    }

    return text.substring(startIndex, endIndex).trim();
}

function removeDuplicateBlocks(text) {
    if (!text) return '';

    // 🔥 Detect repeated full blocks
    const half = Math.floor(text.length / 2);
    const firstHalf = text.substring(0, half);
    const secondHalf = text.substring(half);

    if (secondHalf.includes(firstHalf.substring(0, 200))) {
        text = firstHalf;
    }

    // Then remove duplicate lines (your old logic)
    const lines = text.split('\n');
    const seen = new Set();
    const result = [];

    for (let line of lines) {
        const clean = line.trim();
        if (!clean) continue;
        if (seen.has(clean)) continue;

        seen.add(clean);
        result.push(line);
    }

    return result.join('\n');
}

function cleanSectionContent(text, sectionName) {
    if (!text) return '';

    // Only filter out lines that are PURELY a section header keyword (not content mentioning it)
    const sectionHeaderRegex = /^(education|skills|projects|certifications?|languages?|experience|summary|profile|objective)$/i;

    const lines = text.split('\n');

    return lines
        .filter(line => {
            const trimmed = line.trim();
            // Remove a line only if it's nothing but a section header word
            return !sectionHeaderRegex.test(trimmed);
        })
        .join('\n');
}

function generateResumePDF(resumeData, optimizedExperience) {
    const doc = new PDFDocument({ margin: 50, font: 'Helvetica' });

    const metadata = resumeData.metadata || {};
    const sections = resumeData.sections || {};

    // -- HELPER FUNCTIONS --

    const printSectionHeader = (title) => {
        doc.moveDown(1);
        doc.fontSize(12).font('Helvetica-Bold').text(title.toUpperCase(), { align: 'left' });

        doc.strokeColor('#333333').lineWidth(1)
            .moveTo(doc.x, doc.y)
            .lineTo(doc.page.width - 50, doc.y)
            .stroke();

        doc.moveDown(0.5);
        doc.font('Helvetica').fontSize(10);
    };

    const printBodyText = (text) => {
        if (!text || typeof text !== 'string') return;

        const lines = text.split('\n');

        lines.forEach(line => {
            let trimmed = line.trim();
            if (!trimmed) return;

            // Strip Markdown bold/italic formatting (AI sometimes outputs **text**)
            trimmed = trimmed.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');

            // Bullet detection
            if (/^[-•*▪–]/.test(trimmed)) {
                const content = trimmed.replace(/^[-•*▪–\s]+/, '');
                doc.text(`• ${content}`, { indent: 10, align: 'left' });
            } else {
                doc.text(trimmed, { align: 'left' });
            }

            doc.moveDown(0.3);
        });

        doc.moveDown(0.4);
    };

    // -- HEADER (Contact Info) --

    let name = "Candidate Name";

    // SAFER name logic (no crash risk)
    if (metadata.name && typeof metadata.name === 'string') {
        name = metadata.name;
    } else if (metadata.email) {
        name = metadata.email
            .split('@')[0]
            .replace(/[._0-9]/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
    }

    doc.fontSize(18).font('Helvetica-Bold').text(name, { align: 'center' });
    doc.moveDown(0.3);

    const contactLines = [];

    if (metadata.email) contactLines.push(metadata.email);
    if (metadata.phone) contactLines.push(metadata.phone);
    if (metadata.linkedin) contactLines.push(metadata.linkedin);

    doc.fontSize(10).font('Helvetica')
        .text(contactLines.join('  |  '), { align: 'center' });

    doc.moveDown(1.5);

    // -- SUMMARY --
    if (sections.summary) {
        printSectionHeader('Professional Summary');
        printBodyText(removeDuplicateBlocks(sections.summary));
    }

    // -- EXPERIENCE --
    printSectionHeader('Professional Experience');

    let xpText = optimizedExperience || sections.experience || 'No experience section found.';
    xpText = removeDuplicateBlocks(xpText);
    printBodyText(xpText);

    // -- EDUCATION --
    if (sections.education) {
        printSectionHeader('Education');
        let eduText = removeDuplicateBlocks(sections.education);
        eduText = cleanSectionContent(eduText, 'education');

        printBodyText(eduText);
    }

    // -- SKILLS --
    if (sections.skills) {
        printSectionHeader('Skills');
        let skillsText = removeDuplicateBlocks(sections.skills);
        skillsText = cleanSectionContent(skillsText, 'skills');

        printBodyText(skillsText);
    }

    // -- PROJECTS --
    if (sections.projects) {
        printSectionHeader('Projects');
        let projectsText = removeDuplicateBlocks(sections.projects);
        projectsText = cleanSectionContent(projectsText, 'projects');

        printBodyText(projectsText);
    }

    // -- CERTIFICATIONS --
    if (sections.certifications) {
        printSectionHeader('Certifications & Awards');
        let certText = removeDuplicateBlocks(sections.certifications);
        certText = cleanSectionContent(certText, 'certifications');

        printBodyText(certText);
    }

    // -- LANGUAGES --
    if (sections.languages) {
        printSectionHeader('Languages');
        let langText = removeDuplicateBlocks(sections.languages);
        langText = cleanSectionContent(langText, 'languages');

        printBodyText(langText);
    }

    // -- ADDITIONAL SECTIONS --
    const standardKeys = ['summary', 'experience', 'education', 'skills', 'contact_info', 'other'];

    const otherSections = Object.entries(sections).filter(([key, content]) =>
        !standardKeys.includes(key) && content && content.length > 20
    );

    otherSections.forEach(([key, content]) => {
        printSectionHeader(key);
        let otherText = removeDuplicateBlocks(content);
        otherText = cleanSectionContent(otherText, key);

        printBodyText(otherText);
    });

    return doc;
}

module.exports = { generateResumePDF };