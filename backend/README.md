# AI Resume Analyzer — Python backend

Standalone FastAPI service that performs all AI analysis. Nothing is simulated in the frontend.

## Local setup

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn main:app --reload --port 8000
```

## Connect the frontend

The frontend reads the backend base URL from `VITE_API_URL` (legacy
`VITE_ANALYZER_API_URL` still works).

```
# local development
VITE_API_URL=http://localhost:8000

# production — the public HTTPS URL of the deployed service
VITE_API_URL=https://resume-analyzer-api.onrender.com
```

There is **no localhost fallback in production builds**: if `VITE_API_URL` is not set,
the Analyze page shows a clear "AI backend not configured" message instead of trying
to reach `localhost:8000`.

## Deployment

The service is a normal container — deploy it to Render, Railway, Fly.io, Google Cloud Run,
or any Docker host. It cannot run inside the Lovable frontend hosting.

- `Dockerfile` — builds the image and pre-downloads the spaCy and Sentence-BERT models.
- `render.yaml` — one-click Render blueprint (`rootDir: backend`).
- `Procfile` — for Railway / Heroku-style buildpacks.

Give it at least **2 GB RAM**; Sentence-BERT `all-MiniLM-L6-v2` plus spaCy will OOM on
smaller free tiers.

### Environment variables (backend)

| Variable          | Purpose                                                            |
| ----------------- | ------------------------------------------------------------------ |
| `ALLOWED_ORIGINS` | Comma-separated frontend origins allowed by CORS (`*` for local dev) |
| `PORT`            | Listen port (most hosts inject this automatically)                  |

Health check: `GET /health`.

## Endpoint

`POST /api/analyze-resume` — multipart form: `resume` (PDF), `job_title`, `job_description`.

Returns JSON with `ats_score`, `match_score`, `skills`, `missing_skills`,
`matched_keywords`, `missing_keywords`, `education`, `experience`, `projects`,
`section_analysis`, `recommendations`, plus optional `job_roles` and `ats_breakdown`.

## Stack

- Sentence-BERT `all-MiniLM-L6-v2` embeddings + cosine similarity (semantic job match)
- spaCy `en_core_web_sm` for NLP and section/entity extraction
- scikit-learn TF-IDF for keyword importance
- PyMuPDF for PDF text extraction

The ATS score is an **ATS-style heuristic**, not an official applicant tracking system score.
