/**
 * Integration layer for the Python (FastAPI) AI backend.
 *
 * Backend contract:
 *   POST {VITE_ANALYZER_API_URL}/api/analyze-resume
 *   multipart/form-data: resume (PDF), job_title, job_description
 *
 * The backend performs the actual AI work (Sentence-BERT all-MiniLM-L6-v2
 * embeddings + cosine similarity, spaCy NLP, scikit-learn TF-IDF, PyMuPDF
 * text extraction). No analysis is simulated on the client.
 */

export interface SectionAnalysis {
  [section: string]: boolean;
}

export interface AtsBreakdown {
  [factor: string]: number;
}

export interface AnalysisResult {
  ats_score: number;
  match_score: number;
  skills: string[];
  missing_skills: string[];
  matched_keywords: string[];
  missing_keywords: string[];
  education: string[];
  experience: string[];
  projects: string[];
  section_analysis: SectionAnalysis;
  recommendations: string[];
  job_roles?: string[];
  ats_breakdown?: AtsBreakdown;
}

export interface AnalyzeInput {
  file: File;
  jobTitle: string;
  jobDescription: string;
}

export class AnalyzerApiError extends Error {
  status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.name = "AnalyzerApiError";
    this.status = status;
  }
}

/**
 * Base URL of the Python FastAPI analysis service.
 *
 * Configure with `VITE_API_URL` (preferred) or the legacy
 * `VITE_ANALYZER_API_URL`. In local development only, it falls back to
 * http://localhost:8000. In a production build there is NO localhost
 * fallback — an unconfigured deployment reports a clear configuration error
 * instead of silently trying to reach the developer's own machine.
 */
const RAW_API_URL =
  ((import.meta.env['VITE_API_URL'] as string | undefined) ??
    (import.meta.env['VITE_ANALYZER_API_URL'] as string | undefined) ??
    (import.meta.env.DEV ? "http://localhost:8000" : "")) || "";

export const ANALYZER_API_URL: string = RAW_API_URL.replace(/\/+$/, "");

export const IS_ANALYZER_CONFIGURED = ANALYZER_API_URL.length > 0;

export const MAX_FILE_BYTES = 5 * 1024 * 1024;

export function validatePdf(file: File): string | null {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return "Only PDF resumes are supported.";
  if (file.size > MAX_FILE_BYTES) return "File is too large. Maximum size is 5 MB.";
  if (file.size === 0) return "That file appears to be empty.";
  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function normalize(raw: Partial<AnalysisResult>): AnalysisResult {
  const list = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  const num = (v: unknown): number =>
    typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.min(100, Math.round(v))) : 0;

  return {
    ats_score: num(raw.ats_score),
    match_score: num(raw.match_score),
    skills: list(raw.skills),
    missing_skills: list(raw.missing_skills),
    matched_keywords: list(raw.matched_keywords),
    missing_keywords: list(raw.missing_keywords),
    education: list(raw.education),
    experience: list(raw.experience),
    projects: list(raw.projects),
    section_analysis:
      raw.section_analysis && typeof raw.section_analysis === "object"
        ? (raw.section_analysis as SectionAnalysis)
        : {},
    recommendations: list(raw.recommendations),
    job_roles: list(raw.job_roles),
    ats_breakdown:
      raw.ats_breakdown && typeof raw.ats_breakdown === "object"
        ? (raw.ats_breakdown as AtsBreakdown)
        : {},
  };
}

export async function analyzeResume({
  file,
  jobTitle,
  jobDescription,
}: AnalyzeInput): Promise<AnalysisResult> {
  if (!IS_ANALYZER_CONFIGURED) {
    throw new AnalyzerApiError(
      "The AI analysis service is not configured. Set VITE_API_URL to the public URL of the deployed Python FastAPI backend and redeploy.",
    );
  }

  const body = new FormData();
  body.append("resume", file);
  body.append("job_title", jobTitle);
  body.append("job_description", jobDescription);

  let response: Response;
  try {
    response = await fetch(`${ANALYZER_API_URL}/api/analyze-resume`, { method: "POST", body });
  } catch {
    throw new AnalyzerApiError(
      `Could not reach the analysis service at ${ANALYZER_API_URL}. Check that the Python backend is running and that its CORS settings allow ${typeof window === "undefined" ? "this site" : window.location.origin}.`,
    );
  }

  if (!response.ok) {
    let detail = `Analysis failed (HTTP ${response.status}).`;
    try {
      const payload = (await response.json()) as { detail?: string; message?: string };
      detail = payload.detail ?? payload.message ?? detail;
    } catch {
      /* keep default detail */
    }
    throw new AnalyzerApiError(detail, response.status);
  }

  try {
    return normalize((await response.json()) as Partial<AnalysisResult>);
  } catch {
    throw new AnalyzerApiError("The analysis service returned an unreadable response.");
  }
}
