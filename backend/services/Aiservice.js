 module.exports = { calculateMatchScore, extractMissingKeywords, rewriteExperience };

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

async function rewriteExperience(experienceText, jobDescription, missingKeywords, isFullResume = false) {

  experienceText = cleanInput(experienceText);
  jobDescription = cleanInput(jobDescription);

  const keywords = (missingKeywords || []).slice(0, 5).join(', ');

  let prompt;

  if (isFullResume) {
    // ── Full resume mode: no dedicated experience section ──────────────────
    prompt = `You are an expert resume writer. The resume below does NOT have a separate experience section (it may be a student/fresher resume with projects, skills, education, etc.). Enhance ALL sections to make them more impactful and ATS-friendly for the target job, integrating these keywords where relevant: ${keywords || 'none provided'}.

STRICT RULES:
1. PRESERVE every section header (e.g. Skills, Projects, Education, Certifications) exactly as written — output them on their own line with NO bullet prefix.
2. KEEP all factual details accurate (college names, project names, tools used, dates).
3. ENHANCE descriptions: use stronger action verbs, add measurable impact where plausible, and weave in the keywords naturally.
4. FORMAT all list items as bullet points starting with "• ".
5. Do NOT add an Experience or Work History section if there was none.
6. Do NOT use Markdown (no **, no ##, no backticks).
7. No duplicate lines.

RESUME CONTENT:
${experienceText}

TARGET JOB DESCRIPTION (context only):
${jobDescription}

Return ONLY the optimized resume content. No intro or outro.`;

  } else {
    // ── Experience section mode ────────────────────────────────────────────
    prompt = `You are an expert resume writer. Enhance the experience section below to make it more impactful and ATS-friendly by naturally integrating these keywords where relevant: ${keywords || 'none provided'}.

STRICT RULES:
1. PRESERVE STRUCTURE: Keep every job title, company name, and date line exactly as they appear on their own lines with NO bullet prefix.
2. ENHANCE BULLETS: Improve each bullet point with stronger action verbs and quantified achievements. Keep factual details accurate.
3. INTEGRATE KEYWORDS: Weave keywords naturally into existing bullets or add one new relevant bullet per role.
4. FORMAT:
   - Job title / company lines: output as-is on their own line.
   - Date lines: output as-is on their own line.
   - Bullet points: start each with "• ".
   - Do NOT use Markdown (no **, no ##, no backticks).
5. NO DUPLICATES.
6. Similar length to original.

EXPERIENCE SECTION:
${experienceText}

TARGET JOB DESCRIPTION (context only):
${jobDescription}

Return ONLY the enhanced experience section. No intro, no outro, no section headers.`;
  }

  const rewriteModel = genAI.getGenerativeModel({ model: config.GEMINI_MODEL });

  try {
    const result = await rewriteModel.generateContent(prompt);
    const response = await result.response;

    const cleaned = cleanAIOutput(response.text());

    // Remove duplicate lines
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