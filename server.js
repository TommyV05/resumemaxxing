'use strict';

try { require('dotenv').config(); } catch {}

const express   = require('express');
const cors      = require('cors');
const multer    = require('multer');
const mammoth   = require('mammoth');
const Anthropic = require('@anthropic-ai/sdk');
const fs        = require('fs');
const path      = require('path');

const app    = express();
const PORT   = process.env.PORT || 3001;
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

async function extractText(file) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.txt') {
    return fs.readFileSync(file.path, 'utf-8');
  }
  if (ext === '.docx' || ext === '.doc') {
    const result = await mammoth.extractRawText({ path: file.path });
    return result.value;
  }
  if (ext === '.pdf') {
    try {
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(fs.readFileSync(file.path));
      return data.text;
    } catch {
      throw new Error('PDF parsing failed — please paste your resume text instead.');
    }
  }
  throw new Error('Unsupported file type. Use PDF, DOCX, or TXT.');
}

function parseJSON(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON in response');
  return JSON.parse(match[0]);
}

app.post('/api/optimize', upload.single('resume'), async (req, res) => {
  const { jobTitle, jobDescription, resumeText, customInstructions } = req.body;
  const filePath = req.file?.path;
  let resumeContent = resumeText || '';

  try {
    if (req.file) {
      resumeContent = await extractText(req.file);
    }
    if (!resumeContent?.trim()) {
      return res.status(400).json({ error: 'No resume content provided.' });
    }

    // Step 1 — extract keywords from job description
    const kwMsg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Extract keywords from this job description for the role: ${jobTitle}

${jobDescription}

Return ONLY valid JSON (no explanation, no markdown):
{"hardSkills":[],"softSkills":[],"requirements":[],"keywords":[],"actionVerbs":[]}`
      }]
    });

    let keywords;
    try { keywords = parseJSON(kwMsg.content[0].text); }
    catch { keywords = { hardSkills: [], softSkills: [], requirements: [], keywords: [], actionVerbs: [] }; }

    // Step 2 — rewrite resume as structured JSON
    const allKW = [
      ...(keywords.hardSkills  || []),
      ...(keywords.softSkills  || []),
      ...(keywords.keywords    || []),
      ...(keywords.actionVerbs || [])
    ].join(', ');

    const customNote = customInstructions
      ? `\nCUSTOM INSTRUCTIONS: ${customInstructions}\n`
      : '';

    const rwMsg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `You are an expert resume writer. Rewrite the resume below to target the role of "${jobTitle}".
Incorporate these keywords naturally where they fit: ${allKW}.${customNote}

ORIGINAL RESUME:
${resumeContent}

Return ONLY valid JSON (no markdown, no explanation):
{
  "name": "Full Name",
  "subtitle": "Target Job Title",
  "contact": {
    "lines": ["City, State", "linkedin.com/in/handle", "Phone Number", "email@example.com"]
  },
  "leftSections": [
    {
      "title": "EDUCATION",
      "entries": [
        {
          "org": "University Name, City",
          "jobTitle": "Degree",
          "dates": "Expected Month Year",
          "bullets": ["GPA or honor", "Relevant coursework or activities"]
        }
      ]
    },
    {
      "title": "EXPERIENCE",
      "entries": [
        {
          "org": "Company Name, City",
          "jobTitle": "Role Title",
          "dates": "Month Year – Month Year",
          "bullets": ["Quantified achievement", "Another achievement"]
        }
      ]
    },
    {
      "title": "PROJECTS",
      "entries": [
        {
          "org": "Project Name",
          "jobTitle": "Tech Stack",
          "dates": "Month Year",
          "bullets": ["What it does and how", "Impact or outcome"]
        }
      ]
    }
  ],
  "rightSections": [
    {
      "title": "SKILLS",
      "items": ["Languages: ...", "Frameworks: ...", "Tools: ..."]
    },
    {
      "title": "COURSEWORK",
      "items": ["Course 1", "Course 2", "Course 3"]
    }
  ],
  "optimizationNotes": [
    "Specific change made and why it helps for this role",
    "Another change and rationale"
  ]
}`
      }]
    });

    let resumeData;
    try { resumeData = parseJSON(rwMsg.content[0].text); }
    catch { return res.status(500).json({ error: 'Failed to parse resume output — please try again.' }); }

    // Step 3 — score the optimized resume
    const scoreMsg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Score this optimized resume for the role of "${jobTitle}".

Job description:
${jobDescription}

Optimized resume:
${JSON.stringify(resumeData)}

Return ONLY valid JSON (scores 0-100):
{
  "overallScore": 85,
  "keywordMatch": 88,
  "relevanceScore": 82,
  "atsScore": 90,
  "topStrengths": ["strength 1", "strength 2", "strength 3"],
  "missingKeywords": ["keyword1", "keyword2"]
}`
      }]
    });

    let scoreReport;
    try { scoreReport = parseJSON(scoreMsg.content[0].text); }
    catch { scoreReport = { overallScore: 80, keywordMatch: 80, relevanceScore: 80, atsScore: 80, topStrengths: [], missingKeywords: [] }; }

    res.json({ resumeData, keywords, scoreReport });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Something went wrong.' });
  } finally {
    if (filePath) try { fs.unlinkSync(filePath); } catch {}
  }
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
