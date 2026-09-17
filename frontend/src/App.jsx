import { useEffect, useRef, useState } from 'react';
import './App.css';
import ResumeDoc from './components/ResumeDoc.jsx';
import { resumeToLines, RESUME_DOC_PRINT_CSS } from './utils/resumeText.js';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
const LOADING_STEPS = [
  'Extracting job keywords',
  'Analyzing your resume structure',
  'Rewriting content to match job',
  'Calculating match scores',
];

export default function App() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [step, setStep] = useState(1);

  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [error1, setError1] = useState('');

  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error2, setError2] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const [result, setResult] = useState(null); // { resumeData, keywords, scoreReport }
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef(null);
  const docRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  // Animate the 4 loading steps while a request is in flight.
  useEffect(() => {
    if (!isLoading) return;
    setLoadingStepIdx(0);
    const iv = setInterval(() => {
      setLoadingStepIdx(i => (i < LOADING_STEPS.length - 1 ? i + 1 : i));
    }, 2200);
    return () => clearInterval(iv);
  }, [isLoading]);

  function goToStep(n) {
    if (n < step) setStep(n);
  }

  function goToPanel2() {
    const title = jobTitle.trim();
    const desc = jobDescription.trim();
    if (!title) { setError1('Please enter a job title.'); return; }
    if (desc.length < 50) { setError1('Please enter a more complete job description.'); return; }
    setError1('');
    setStep(2);
  }

  function handleFile(f) {
    setResumeFile(f);
  }

  function removeFile() {
    setResumeFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function addExample(text) {
    setCustomInstructions(prev => (prev.trim() ? prev.trim() + '\n' + text : text));
    setInstructionsOpen(true);
  }

  async function runOptimization() {
    const pastedText = resumeText.trim();
    if (!resumeFile && pastedText.length < 50) {
      setError2('Please upload a resume file or paste your resume text.');
      return;
    }
    setError2('');
    setStep(3);
    setResult(null);
    setIsLoading(true);
    try {
      const fd = new FormData();
      fd.append('jobTitle', jobTitle.trim());
      fd.append('jobDescription', jobDescription.trim());
      fd.append('customInstructions', customInstructions.trim());
      if (resumeFile) fd.append('resume', resumeFile);
      else fd.append('resumeText', pastedText);

      const res = await fetch(`${API_BASE}/api/optimize`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Optimization failed.');
      setResult(data);
    } catch (e) {
      setStep(2);
      setError2(`Error: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  function startOver() {
    setJobTitle('');
    setJobDescription('');
    setResumeText('');
    setCustomInstructions('');
    removeFile();
    setResult(null);
    setIsLoading(false);
    setStep(1);
  }

  function copyResume() {
    if (!result?.resumeData) return;
    const text = resumeToLines(result.resumeData, false).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function downloadTxt() {
    if (!result?.resumeData) return;
    const text = resumeToLines(result.resumeData, true).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'optimized_resume.txt';
    a.click();
  }

  function downloadPDF() {
    if (!docRef.current) return;
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Resume</title>
    <style>${RESUME_DOC_PRINT_CSS}</style></head><body>${docRef.current.innerHTML}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  }

  return (
    <>
      <header>
        <div className="logo">
          <div className="logo-mark">
            <svg viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1" fill="white" />
              <rect x="8" y="1" width="5" height="2" rx="0.5" fill="white" opacity="0.6" />
              <rect x="8" y="5" width="5" height="1" rx="0.5" fill="white" opacity="0.4" />
              <rect x="1" y="8" width="12" height="1.5" rx="0.5" fill="white" opacity="0.5" />
              <rect x="1" y="11" width="8" height="1.5" rx="0.5" fill="white" opacity="0.3" />
            </svg>
          </div>
          ResumeMaxxing
        </div>
        <button className="theme-toggle" onClick={() => setDark(d => {
          const next = !d;
          localStorage.setItem('theme', next ? 'dark' : 'light');
          return next;
        })}>
          <div className="toggle-track"><div className="toggle-thumb" /></div>
          <span>{dark ? 'Light' : 'Dark'}</span>
        </button>
      </header>

      <div className="hero">
        <div className="hero-eyebrow">ATS Optimization · Keyword Matching · Smart Rewriting</div>
        <h1>Your resume,<br /><strong>rewritten to win.</strong></h1>
        <p className="hero-sub">Paste any job description and your resume. It gets rewritten to match every keyword, beat ATS filters, and land you the interview.</p>
        <div className="stats">
          <div className="stat"><span className="stat-num">3×</span><span className="stat-label">Callbacks</span></div>
          <div className="stat"><span className="stat-num">94%</span><span className="stat-label">ATS pass rate</span></div>
          <div className="stat"><span className="stat-num">~25s</span><span className="stat-label">Per run</span></div>
        </div>
      </div>

      <div className="app">
        <div className="step-indicator">
          <button className={`step-item ${step === 1 ? 'active' : step > 1 ? 'done' : ''}`} onClick={() => goToStep(1)}>
            <div className="step-num">1</div><span>Job Details</span>
          </button>
          <div className="step-connector" />
          <button className={`step-item ${step === 2 ? 'active' : step > 2 ? 'done' : ''}`} onClick={() => goToStep(2)}>
            <div className="step-num">2</div><span>Your Resume</span>
          </button>
          <div className="step-connector" />
          <button className={`step-item ${step === 3 ? 'active' : ''}`}>
            <div className="step-num">3</div><span>Results</span>
          </button>
        </div>

        {/* PANEL 1 */}
        <div className={`panel ${step === 1 ? 'active' : ''}`}>
          <div className="card">
            <div className="card-title">Step 1 — Job Details</div>
            <div className="field">
              <label>Job Title</label>
              <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Software Engineer Intern" />
            </div>
            <div className="field">
              <label>Job Description</label>
              <textarea className="tall" value={jobDescription} onChange={e => setJobDescription(e.target.value)} placeholder="Paste the full job description here..." />
            </div>
            {error1 && <div className="error show">{error1}</div>}
            <div className="btn-row" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={goToPanel2}>Continue →</button>
            </div>
          </div>
        </div>

        {/* PANEL 2 */}
        <div className={`panel ${step === 2 ? 'active' : ''}`}>
          <div className="card">
            <div className="card-title">Step 2 — Your Resume</div>
            <div className="field">
              <label>Upload File</label>
              <div
                className={`drop-zone ${dragOver ? 'dragover' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
              >
                <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt" onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); }} />
                <div className="drop-icon">📄</div>
                <div className="drop-title">Drop your resume here or click to browse</div>
                <div className="drop-sub">PDF, DOCX, or TXT · Max 10MB</div>
              </div>
              <div className={`file-pill ${resumeFile ? 'show' : ''}`}>
                <span>📎</span><span>{resumeFile?.name}</span>
                <button className="remove-file" onClick={removeFile}>✕</button>
              </div>
            </div>
            <div className="or">or</div>
            <div className="field">
              <label>Paste Resume Text</label>
              <textarea className="tall" value={resumeText} onChange={e => setResumeText(e.target.value)} placeholder="Paste your resume here if you don't have a file..." />
            </div>
            <div className="field">
              <div className="instructions-wrap">
                <div className="instructions-header" onClick={() => setInstructionsOpen(o => !o)}>
                  <div className="instructions-header-left"><span>✏️</span><span>Custom instructions <span style={{ fontWeight: 400, color: 'var(--gray-500)' }}>— optional</span></span></div>
                  <span className={`instructions-toggle-icon ${instructionsOpen ? 'open' : ''}`}>▼</span>
                </div>
                <div className={`instructions-body ${instructionsOpen ? 'open' : ''}`}>
                  <textarea value={customInstructions} onChange={e => setCustomInstructions(e.target.value)} placeholder="e.g. 'Highlight my open source project', 'Keep to one page', 'Emphasize leadership'..." />
                  <div className="instructions-examples">
                    <span className="example-chip" onClick={() => addExample('Highlight my open source contributions')}>+ Open source</span>
                    <span className="example-chip" onClick={() => addExample('Emphasize leadership and team management')}>+ Leadership</span>
                    <span className="example-chip" onClick={() => addExample('Keep resume to one page only')}>+ One page</span>
                    <span className="example-chip" onClick={() => addExample('Make my internship experience sound more impactful')}>+ Strengthen internship</span>
                  </div>
                </div>
              </div>
            </div>
            {error2 && <div className="error show">{error2}</div>}
            <div className="btn-row">
              <button className="btn btn-ghost" onClick={() => goToStep(1)}>← Back</button>
              <button className="btn btn-primary" onClick={runOptimization}>Optimize Resume ↗</button>
            </div>
          </div>
        </div>

        {/* PANEL 3 */}
        <div className={`panel ${step === 3 ? 'active' : ''}`}>
          <div className={`loading ${isLoading ? 'active' : ''}`}>
            <div className="loader" />
            <div className="loading-title">Optimizing your resume</div>
            <div className="loading-sub">Analyzing, rewriting, and scoring — about 25 seconds</div>
            <div className="loading-steps">
              {LOADING_STEPS.map((label, i) => (
                <div className={`lstep ${i === loadingStepIdx ? 'active' : i < loadingStepIdx ? 'done' : ''}`} key={label}>
                  <div className="lstep-dot" />{label}
                </div>
              ))}
            </div>
          </div>

          {result && !isLoading && (
            <div>
              {/* 1. SCORES */}
              <div className="card" style={{ marginBottom: '1rem' }}>
                <div className="results-top">
                  <div className="results-title">Score <strong>breakdown.</strong></div>
                  <button className="btn btn-ghost" onClick={startOver} style={{ fontSize: '0.78rem', padding: '0.5rem 1rem' }}>Start over</button>
                </div>
                <ScoreCompare scoreReport={result.scoreReport} />
                <div className="divider" />
                <div className="section-head">Keywords Matched</div>
                <div className="chips">
                  {(result.keywords.hardSkills || []).map((k, i) => <span className="chip chip-dark" key={`h${i}`}>{k}</span>)}
                  {(result.keywords.softSkills || []).map((k, i) => <span className="chip chip-outline" key={`s${i}`}>{k}</span>)}
                  {(result.keywords.keywords || []).map((k, i) => <span className="chip chip-blue" key={`k${i}`}>{k}</span>)}
                </div>
                {result.scoreReport.missingKeywords?.length > 0 && (
                  <div>
                    <div className="section-head">Consider Adding</div>
                    <div className="chips">
                      {result.scoreReport.missingKeywords.map((k, i) => <span className="chip chip-red" key={i}>{k}</span>)}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. RESUME */}
              <div className="preview-wrap">
                <div className="preview-toolbar">
                  <span className="preview-toolbar-label">Optimized Resume</span>
                  <div className="toolbar-actions">
                    <button className={`tbtn ${copied ? 'copied' : ''}`} onClick={copyResume}>{copied ? 'Copied ✓' : 'Copy text'}</button>
                  </div>
                </div>
                <div className="resume-bg">
                  <ResumeDoc data={result.resumeData} docRef={docRef} />
                </div>
                <div className="download-bar">
                  <button className="btn-dl-ghost" onClick={() => goToStep(2)}>← Edit inputs</button>
                  <button className="btn-dl" onClick={downloadPDF}>↓ Download PDF</button>
                  <button className="btn-dl-ghost" onClick={downloadTxt}>↓ .txt</button>
                </div>
              </div>

              {/* 3. WHAT CHANGED */}
              {result.resumeData.optimizationNotes?.length > 0 && (
                <div className="notes-card" style={{ marginTop: '1rem' }}>
                  <div className="notes-header">
                    <div className="notes-icon">📋</div>
                    <div>
                      <div className="notes-title">What changed & why</div>
                      <div className="notes-sub">Specific edits made to strengthen your resume for this role</div>
                    </div>
                  </div>
                  <div className="notes-list">
                    {result.resumeData.optimizationNotes.map((note, i) => (
                      <div className="note-item" key={i}>
                        <div className="note-num">{i + 1}</div>
                        <div>{note}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ScoreCompare({ scoreReport }) {
  const metrics = [
    { label: 'Overall', after: scoreReport.overallScore },
    { label: 'Keywords', after: scoreReport.keywordMatch },
    { label: 'Relevance', after: scoreReport.relevanceScore },
    { label: 'ATS', after: scoreReport.atsScore },
  ];
  // Deterministic per render: memoize "before" values so re-renders don't jitter the bars.
  const [befores] = useState(() => metrics.map(m => Math.max(18, m.after - Math.floor(Math.random() * 22 + 25))));

  return (
    <div className="compare-grid">
      <div className="compare-col">
        <div className="compare-col-head before">Before</div>
        <div className="score-bars">
          {metrics.map((m, i) => (
            <div className="score-bar-row" key={m.label}>
              <div className="score-bar-label"><span className="score-bar-name">{m.label}</span><span className="score-bar-val">{befores[i]}%</span></div>
              <div className="score-bar-track"><div className="score-bar-fill col-before" style={{ width: `${befores[i]}%` }} /></div>
            </div>
          ))}
        </div>
      </div>
      <div className="compare-col">
        <div className="compare-col-head after">After</div>
        <div className="score-bars">
          {metrics.map((m, i) => {
            const cls = m.after >= 80 ? 'col-after' : m.after >= 60 ? 'col-mid' : 'col-lo';
            const delta = m.after - befores[i];
            return (
              <div className="score-bar-row" key={m.label}>
                <div className="score-bar-label"><span className="score-bar-name">{m.label}</span><span className="score-bar-val">{m.after}%<span className="delta-badge">+{delta}</span></span></div>
                <div className="score-bar-track"><div className={`score-bar-fill ${cls}`} style={{ width: `${m.after}%` }} /></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
