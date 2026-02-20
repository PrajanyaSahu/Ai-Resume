// // services/aiService.js
// // AI operations powered by Google Gemini AI
// // To change API key or model → update .env or backend/core/config.js

// const { GoogleGenerativeAI } = require('@google/generative-ai');
// const config = require('../core/config');

// // Initialize Gemini
// const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
// const model = genAI.getGenerativeModel({
//   model: config.GEMINI_MODEL || 'gemini-2.5-flash'
// });

// /**
//  * Calculate match score (1-10) with reasoning using Gemini
//  */
// async function calculateMatchScore(resumeText, jobDescription, jobTitle) {
//   const prompt = `Analyze this resume against the job description and provide a match score.

// JOB TITLE: ${jobTitle}

// JOB DESCRIPTION:
// ${jobDescription}

// RESUME:
// ${resumeText}

// Respond ONLY with valid JSON (no markdown, no extra text):
// {
//   "match_score": <integer 1-10>,
//   "reasoning": "<detailed explanation>",
//   "summary": "<brief one-line assessment>",
//   "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
//   "gaps": ["<gap 1>", "<gap 2>", "<gap 3>"]
// }`;

//   try {
//     const result = await model.generateContent(prompt);
//     const response = await result.response;
//     const text = response.text();

//     // Attempt to parse JSON
//     try {
//       // Clean up text in case Gemini wraps it in markdown blocks despite config
//       const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
//       return JSON.parse(cleanText);
//     } catch (parseError) {
//       console.error('Gemini JSON Parse Error:', parseError, 'Raw text:', text);
//       return {
//         match_score: 5,
//         reasoning: "Failed to parse AI response. " + text.substring(0, 500),
//         summary: 'Analysis partially completed',
//         strengths: [],
//         gaps: []
//       };
//     }
//   } catch (err) {
//     console.error('Gemini API Error:', err);
//     throw err;
//   }
// }

// /**
//  * Extract top missing keywords using Gemini
//  */
// async function extractMissingKeywords(resumeText, jobDescription, maxKeywords = 10) {
//   const prompt = `Find the top ${maxKeywords} most important keywords from the job description that are MISSING from the resume.

// JOB DESCRIPTION:
// ${jobDescription}

// RESUME:
// ${resumeText}

// Respond ONLY with a JSON array of strings (no markdown, no extra text):
// ["keyword1", "keyword2", ...]

// Focus on: technical skills, tools, certifications, required competencies.`;

//   try {
//     const result = await model.generateContent(prompt);
//     const response = await result.response;
//     const text = response.text();

//     try {
//       const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
//       const keywords = JSON.parse(cleanText);
//       return Array.isArray(keywords) ? keywords.slice(0, maxKeywords) : [];
//     } catch {
//       // Fallback for non-JSON response
//       return text.split('\n')
//         .map(l => l.replace(/^[-"'\[\]•\d.]+/, '').trim())
//         .filter(Boolean)
//         .slice(0, maxKeywords);
//     }
//   } catch (err) {
//     console.error('Gemini API Error (Keywords):', err);
//     return [];
//   }
// }

// /**
//  * Rewrite experience section using Gemini
//  */
// async function rewriteExperience(experienceText, jobDescription, missingKeywords) {
//   const keywords = (missingKeywords || []).slice(0, 5).join(', ');

//   const prompt = `Enhance this experience section for an ATS-friendly resume by integrating these keywords: ${keywords}.
  
// ORIGINAL EXPERIENCE:
// ${experienceText}

// TARGET JOB DESCRIPTION:
// ${jobDescription}

// Start instructions:
// 1. PRESERVE FACTS: Do not change company names, job titles, dates, or specific technical tools mentioned in the original text.
// 2. INTEGRATE KEYWORDS: Naturally weave the missing keywords into existing bullet points or add a new relevant bullet point if it fits the context.
// 3. IMPROVE IMPACT: Where possible, strengthen action verbs and clarify achievements (e.g., "Responsible for..." -> "Spearheaded...").
// 4. FORMATTING: Return the result as a clean, bulleted list (using "•"). Do not use Markdown bolding or headers inside the bullets.

// Write ONLY the enhanced experience section text. No intro/outro.`;

//   // For rewriting, we might want a slightly different config if we don't want JSON
//   const rewriteModel = genAI.getGenerativeModel({ model: config.GEMINI_MODEL });

//   try {
//     const result = await rewriteModel.generateContent(prompt);
//     const response = await result.response;
//     return response.text().trim();
//   } catch (err) {
//     console.error('Gemini API Error (Rewrite):', err);
//     return experienceText; // Return original as fallback
//   }
// }

// module.exports = { calculateMatchScore, extractMissingKeywords, rewriteExperience };

const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../core/config');

const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: config.GEMINI_MODEL || 'gemini-2.5-flash'
});

// ✅ NEW: Clean text before sending to AI
function cleanInput(text) {
  if (!text || typeof text !== 'string') return '';

  const half = Math.floor(text.length / 2);
  const firstHalf = text.substring(0, half);
  const secondHalf = text.substring(half);

  if (secondHalf.includes(firstHalf.substring(0, 100))) {
    text = firstHalf;
  }

  return text
    .replace(/\r/g, '')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

// ✅ NEW: Clean AI output (VERY IMPORTANT)
function cleanAIOutput(text) {
  if (!text) return '';

  return text
    .replace(/```[\s\S]*?```/g, '') // remove markdown blocks
    .replace(/professional experience/gi, '') // remove headers
    .replace(/^\s*[-•*]\s*/gm, '• ') // normalize bullets
    .replace(/\n{2,}/g, '\n')
    .trim();
}

async function calculateMatchScore(resumeText, jobDescription, jobTitle) {

  resumeText = cleanInput(resumeText);
  jobDescription = cleanInput(jobDescription);

  const prompt = `Analyze this resume against the job description and provide a match score.

JOB TITLE: ${jobTitle}

JOB DESCRIPTION:
${jobDescription}

RESUME:
${resumeText}

Respond ONLY with valid JSON (no markdown, no extra text):
{
  "match_score": <integer 1-10>,
  "reasoning": "<detailed explanation>",
  "summary": "<brief one-line assessment>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "gaps": ["<gap 1>", "<gap 2>", "<gap 3>"]
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanText);
    } catch (parseError) {
      return {
        match_score: 5,
        reasoning: "Failed to parse AI response.",
        summary: 'Partial result',
        strengths: [],
        gaps: []
      };
    }
  } catch (err) {
    console.error('Gemini API Error:', err);
    throw err;
  }
}

async function extractMissingKeywords(resumeText, jobDescription, maxKeywords = 10) {

  resumeText = cleanInput(resumeText);
  jobDescription = cleanInput(jobDescription);

  const prompt = `Find the top ${maxKeywords} most important keywords from the job description that are MISSING from the resume.

JOB DESCRIPTION:
${jobDescription}

RESUME:
${resumeText}

Respond ONLY with a JSON array:
["keyword1", "keyword2"]`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanText).slice(0, maxKeywords);
    } catch {
      return text.split('\n')
        .map(l => l.replace(/^[-•\d.\s]+/, '').trim())
        .filter(Boolean)
        .slice(0, maxKeywords);
    }
  } catch (err) {
    console.error('Gemini API Error:', err);
    return [];
  }
}

async function rewriteExperience(experienceText, jobDescription, missingKeywords) {

  experienceText = cleanInput(experienceText);
  jobDescription = cleanInput(jobDescription);

  const keywords = (missingKeywords || []).slice(0, 5).join(', ');

  const prompt = `Improve this resume experience using these keywords: ${keywords}.

IMPORTANT:
- Do NOT add headings
- Do NOT repeat content
- Keep only bullet points
- Keep it concise

EXPERIENCE:
${experienceText}

JOB DESCRIPTION:
${jobDescription}

Return ONLY bullet points starting with "•"`;

  const rewriteModel = genAI.getGenerativeModel({ model: config.GEMINI_MODEL });

  try {
    const result = await rewriteModel.generateContent(prompt);
    const response = await result.response;

    const cleaned = cleanAIOutput(response.text());

    // ✅ Remove duplicate bullets
    const uniqueLines = [...new Set(
      cleaned.split('\n').map(l => l.trim()).filter(Boolean)
    )];

    return uniqueLines.join('\n');

  } catch (err) {
    console.error('Gemini API Error (Rewrite):', err);
    return experienceText;
  }
}

module.exports = {
  calculateMatchScore,
  extractMissingKeywords,
  rewriteExperience
};