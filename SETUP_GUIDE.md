# ⚡ ResumeForge — AI Resume Optimizer
## Complete Setup Guide

---

## What You Have

```
server.js          ← Express API server (handles AI + file parsing)
package.json       ← Backend dependencies
.env.example       ← Environment variable template

frontend/          ← React (Vite) frontend
├── src/App.jsx
├── src/components/ResumeDoc.jsx
└── package.json
```

---

## Prerequisites

- **Node.js** v18+ → https://nodejs.org
- **Anthropic API Key** → https://console.anthropic.com

---

## Step-by-Step Setup

### 1. Set up the backend

```bash
# Install dependencies
npm install

# Create your .env file
cp .env.example .env
```

Open `.env` and add your key:
```
ANTHROPIC_API_KEY=sk-ant-your-key-here
PORT=3001
```

### 2. Start the backend server

```bash
npm start
# → Server running at http://localhost:3001

# For development with auto-restart:
npm run dev
```

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## How It Works (Architecture)

```
Browser (index.html)
        ↓  POST /api/optimize (FormData: jobTitle, jobDescription, resume file)
Express Server (server.js)
        ↓  Extract text from PDF/DOCX/TXT using pdf-parse / mammoth
        ↓  Call Claude API (3 sequential calls):
           1. Extract keywords from job description → JSON
           2. Rewrite resume with keywords + ATS optimization → text
           3. Score the optimized resume → JSON scores
        ↓  Return: { optimizedResume, keywords, scoreReport }
Browser
        ↓  Display scores, keyword chips, strengths, and full resume
```

---

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/optimize` | Optimize resume (multipart/form-data) |

### POST `/api/optimize` — Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `jobTitle` | string | ✅ | Job title |
| `jobDescription` | string | ✅ | Full job description text |
| `resume` | file | Either/or | PDF, DOCX, or TXT file |
| `resumeText` | string | Either/or | Plain text resume |

### Response

```json
{
  "success": true,
  "optimizedResume": "Full optimized resume text...",
  "keywords": {
    "hardSkills": ["Python", "AWS", "React"],
    "softSkills": ["Leadership", "Communication"],
    "requirements": ["5+ years experience"],
    "keywords": ["SaaS", "agile", "cross-functional"],
    "actionVerbs": ["led", "built", "optimized"]
  },
  "scoreReport": {
    "overallScore": 88,
    "keywordMatch": 85,
    "relevanceScore": 90,
    "atsScore": 92,
    "topStrengths": ["Strong technical alignment", "Quantified achievements"],
    "missingKeywords": ["Kubernetes", "CI/CD"]
  }
}
```

---

## Deploying to Production

### Backend → Render.com (Free)
1. Push this repo to GitHub
2. Go to https://render.com → New Web Service → Connect your repo
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add environment variable: `ANTHROPIC_API_KEY=your_key`
6. Deploy → copy the URL (e.g. `https://resumeforge.onrender.com`)

### Frontend → Update API URL and deploy
Set `VITE_API_BASE` in `frontend/.env` to your deployed backend URL, then build:
```bash
cd frontend
npm run build   # outputs frontend/dist
```

Host `frontend/dist` on:
- **Netlify**: Drag & drop the `dist` folder at netlify.com/drop
- **Vercel**: `vercel deploy` from `frontend/`
- **GitHub Pages**: Push `dist` to a `gh-pages` branch

---

## Cost Estimate

Each optimization run uses ~3 Claude API calls.

| Resume Length | Approx. Input Tokens | Approx. Cost |
|--------------|---------------------|--------------|
| Short (1 page) | ~3,000 | ~$0.01 |
| Medium (2 pages) | ~5,000 | ~$0.02 |
| Long (3+ pages) | ~8,000 | ~$0.03 |

Very affordable — hundreds of optimizations per dollar.

---

## Enhancements You Can Add

- **User accounts** (Supabase or Firebase Auth)
- **Save history** of past optimizations per user
- **Cover letter generator** using the same job + resume inputs
- **Export to DOCX** using the `docx` npm package
- **LinkedIn profile optimizer** as a second tab
- **Stripe payments** for premium usage (rate limiting free tier)

---

## Troubleshooting

**"Failed to fetch" error in browser**
→ Backend is not running. Run `npm start` in the backend folder.

**"CORS error"**
→ Make sure `cors()` middleware is active in server.js (it is by default).

**PDF text extraction fails**
→ Some PDFs are image-based (scanned). Use a text-based PDF or paste text instead.

**API key error**
→ Check your `.env` file has the correct key. Restart the server after editing `.env`.
