# ResumeMaxxing

AI-powered resume optimizer. Paste a job description and your resume, and it rewrites your resume to match the role, scores it against the job (overall, keyword match, relevance, ATS), and shows exactly what changed and why.

## Stack

- **Frontend** — React (Vite), in [`frontend/`](frontend)
- **Backend** — Node.js/Express, in [`server.js`](server.js)
- **AI** — Anthropic API (Claude), 3 sequential calls: extract keywords → rewrite resume → score it
- File parsing: PDF (`pdf-parse`), DOCX (`mammoth`), plain text

## Running locally

### 1. Backend

```bash
npm install
cp .env.example .env   # add your ANTHROPIC_API_KEY
npm start               # http://localhost:3001
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev             # http://localhost:5173
```

The frontend calls the backend at `http://localhost:3001` by default; override with a `VITE_API_BASE` env var in `frontend/.env` for a deployed backend.

## API

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/optimize` | Optimize a resume (multipart/form-data: `jobTitle`, `jobDescription`, `resume` file or `resumeText`, optional `customInstructions`) |

See [`SETUP_GUIDE.md`](SETUP_GUIDE.md) for deployment notes.
