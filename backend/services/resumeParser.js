// services/resumeParser.js
// Extract text and structure from PDF and DOCX files

// const pdfParse = require('pdf-parse');
// const mammoth = require('mammoth');
// const path = require('path');
// const fs = require('fs');

// class ResumeParserService {

//   async parseFile(filePath) {
//     const ext = path.extname(filePath).toLowerCase();

//     let text = '';

//     if (ext === '.pdf') {
//       text = await this._parsePDF(filePath);
//     } else if (ext === '.docx' || ext === '.doc') {
//       text = await this._parseDOCX(filePath);
//     } else if (ext === '.txt') {
//       text = fs.readFileSync(filePath, 'utf8');
//     } else {
//       throw new Error(`Unsupported file format: ${ext}`);
//     }

//     return {
//       raw_text: text,
//       metadata: this._extractMetadata(text),
//       sections: this._extractSections(text),
//       word_count: text.split(/\s+/).filter(Boolean).length
//     };
//   }

//   async _parsePDF(filePath) {
//     try {
//       const buffer = fs.readFileSync(filePath);
//       const data = await pdfParse(buffer);
//       return data.text.trim();
//     } catch (err) {
//       throw new Error(`Error parsing PDF: ${err.message}`);
//     }
//   }

//   async _parseDOCX(filePath) {
//     try {
//       const result = await mammoth.extractRawText({ path: filePath });
//       return result.value.trim();
//     } catch (err) {
//       throw new Error(`Error parsing DOCX: ${err.message}`);
//     }
//   }

//   _extractMetadata(text) {
//     const metadata = {};

//     // Email
//     const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
//     if (emailMatch) metadata.email = emailMatch[0];

//     // Phone
//     const phoneMatch = text.match(/(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
//     if (phoneMatch) metadata.phone = phoneMatch[0];

//     // LinkedIn
//     const linkedinMatch = text.toLowerCase().match(/linkedin\.com\/in\/[\w-]+/);
//     if (linkedinMatch) metadata.linkedin = linkedinMatch[0];

//     return metadata;
//   }

//   _extractSections(text) {
//     const sections = {};

//     // Regex patterns for flexible header matching
//     // Matches headers that might be surrounded by bullets, numbers, whitespace, or colons
//     // e.g. "1. Education", "• Projects", "SKILLS:", "Technical Skills"
//     const headerPatterns = {
//       'experience': /^(?:professional\s+)?(?:work\s+)?(?:experience|history|background|employment)(?:\s+history)?$/i,
//       'education': /^(?:educational\s+)?(?:education|qualifications|academic|degrees|scholastic)(?:\s+background|\s+history|\s+details)?$/i,
//       'skills': /^(?:technical\s+)?(?:skills|competencies|technologies|stack|proficiency|languages)(?:\s+and\s+tools)?$/i,
//       'projects': /^(?:academic\s+|personal\s+|key\s+)?(?:projects|undertakings)(?:\s+experience)?$/i,
//       'certifications': /^(?:certifications|certificates|licenses|awards|honors|achievements)(?:\s+and\s+awards)?$/i,
//       'summary': /^(?:professional\s+)?(?:summary|profile|objective|about\s+me|bio)$/i,
//       'languages': /^(?:languages|spoken\s+languages|linguistic\s+skills)$/i,
//       'interests': /^(?:interests|hobbies|activities|extracurricular)$/i
//     };

//     const lines = text.split('\n');
//     let currentSection = 'contact_info';
//     let currentContent = [];

//     for (const line of lines) {
//       const distinctLine = line.trim();
//       const lower = distinctLine.toLowerCase();

//       // Sanitized line for checking: remove leading bullets, numbers, special chars
//       // e.g. "1. Education" -> "education"
//       const cleanLine = lower.replace(/^[0-9]+\.|^[•\-\*>]|[:|]/g, '').trim();

//       let matchedKey = null;

//       // Header Heuristic:
//       // 1. Should be reasonably short (less than 80 chars)
//       // 2. Should match one of our regex patterns
//       if (distinctLine.length < 80) {
//         for (const [key, regex] of Object.entries(headerPatterns)) {
//           // Check exact clean match or if the regex matches the full clean line
//           if (regex.test(cleanLine)) {
//             matchedKey = key;
//             break;
//           }
//         }
//       }

//       if (matchedKey) {
//         // Save previous section
//         if (currentContent.length) {
//           if (sections[currentSection]) {
//             sections[currentSection] += '\n' + currentContent.join('\n').trim();
//           } else {
//             sections[currentSection] = currentContent.join('\n').trim();
//           }
//         }

//         // Start new section
//         currentSection = matchedKey;
//         currentContent = [];
//       } else {
//         if (distinctLine) {
//           currentContent.push(line);
//         }
//       }
//     }

//     // Flush last section
//     if (currentContent.length) {
//       if (sections[currentSection]) {
//         sections[currentSection] += '\n' + currentContent.join('\n').trim();
//       } else {
//         sections[currentSection] = currentContent.join('\n').trim();
//       }
//     }

//     return sections;
//   }
// }

// module.exports = new ResumeParserService();


const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const path = require('path');
const fs = require('fs');

class ResumeParserService {

  async parseFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();

    let text = '';

    if (ext === '.pdf') {
      text = await this._parsePDF(filePath);
    } else if (ext === '.docx' || ext === '.doc') {
      text = await this._parseDOCX(filePath);
    } else if (ext === '.txt') {
      text = fs.readFileSync(filePath, 'utf8');
    } else {
      throw new Error(`Unsupported file format: ${ext}`);
    }

    // ✅ Normalize text early (SAFE)
    text = this._normalizeText(text);

    return {
      raw_text: text,
      metadata: this._extractMetadata(text),
      sections: this._extractSections(text),
      word_count: text.split(/\s+/).filter(Boolean).length
    };
  }

  async _parsePDF(filePath) {
    try {
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      return data.text.trim();
    } catch (err) {
      throw new Error(`Error parsing PDF: ${err.message}`);
    }
  }

  async _parseDOCX(filePath) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value.trim();
    } catch (err) {
      throw new Error(`Error parsing DOCX: ${err.message}`);
    }
  }

  // ✅ NEW: Safe text normalization (fixes spacing + formatting issues)
  _normalizeText(text) {
    if (!text) return '';

    return text
      .replace(/\r/g, '')
      .replace(/Bachelorof/g, 'Bachelor of')
      .replace(/Phone:/g, '\nPhone: ')
      .replace(/Email:/g, ' Email: ')
      .replace(/Linkedln:/gi, 'LinkedIn:')
      .replace(/\n{2,}/g, '\n')
      .trim();
  }

  _extractMetadata(text) {
    const metadata = {};

    // Email
    const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
    if (emailMatch) metadata.email = emailMatch[0];

    // Phone (slightly safer for Indian numbers too)
    const phoneMatch = text.match(/(\+91[\-\s]?)?[6-9]\d{9}/);
    if (phoneMatch) metadata.phone = phoneMatch[0];

    // LinkedIn
    const linkedinMatch = text.toLowerCase().match(/linkedin\.com\/in\/[\w-]+/);
    if (linkedinMatch) metadata.linkedin = linkedinMatch[0];

    return metadata;
  }

  // ✅ FIXED: Section extraction (no duplication + better detection)
  _extractSections(text) {
    const sections = {};

    const headerPatterns = {
      experience: /^(professional\s+)?(work\s+)?(experience|employment|history)$/i,
      education: /^(education|educational\s+background|academic\s+background|qualification|degrees?)$/i,
      skills: /^(technical\s+)?skills(\s+&\s+tools)?$/i,
      projects: /^(key\s+|personal\s+|academic\s+)?projects$/i,
      certifications: /^(certifications?(\s+&\s+awards?)?|certificates?|awards?|achievements?|licenses?)$/i,
      summary: /^(professional\s+)?(summary|profile|objective|about\s+me)$/i,
      languages: /^(languages?)$/i,
      interests: /^(interests?|hobbies)$/i
    };

    const lines = text.split('\n');

    let currentSection = 'contact_info';
    let buffer = [];

    const saveSection = () => {
      if (!buffer.length) return;

      const content = buffer.join('\n').trim();

      if (!sections[currentSection]) {
        sections[currentSection] = content;
      } else {
        // Append only if content is not already present (avoid duplication)
        if (!sections[currentSection].includes(content.substring(0, 50))) {
          sections[currentSection] += '\n' + content;
        }
      }

      buffer = [];
    };

    for (let line of lines) {
      const raw = line.trim();
      if (!raw) continue;

      const clean = raw
        .toLowerCase()
        .replace(/^[0-9.\-•\s]+/, '')
        .replace(/[:|]/g, '')
        .trim();

      let matched = null;

      // Only short lines can be headers (safer)
      if (raw.length < 60) {
        for (const [key, regex] of Object.entries(headerPatterns)) {
          if (regex.test(clean)) {
            matched = key;
            break;
          }
        }
      }

      if (matched) {
        saveSection();
        currentSection = matched;
      } else {
        buffer.push(raw);
      }
    }

    // Final flush
    saveSection();

    return sections;
  }
}

module.exports = new ResumeParserService();