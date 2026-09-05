"""
AI Resume Analyzer — Python analysis service (FastAPI).

Run:
    pip install -r requirements.txt
    python -m spacy download en_core_web_sm
    uvicorn main:app --reload --port 8000

Then set VITE_API_URL=http://localhost:8000 for the frontend (in production this
must be the public HTTPS URL of the deployed service, never localhost).

Pipeline:
    PDF text extraction  -> PyMuPDF (fitz)
    NLP / sections       -> spaCy (en_core_web_sm)
    Keyword importance   -> scikit-learn TF-IDF
    Semantic job match   -> Sentence-BERT (all-MiniLM-L6-v2) + cosine similarity
    ATS-style score      -> transparent weighted heuristic (NOT an official ATS score)
"""

from __future__ import annotations

import io
import os
import re
from typing import Dict, List

import fitz  # PyMuPDF
import numpy as np
import spacy
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer
from sklearn.feature_extraction.text import TfidfVectorizer

MAX_BYTES = 5 * 1024 * 1024

app = FastAPI(title="AI Resume Analyzer API", version="1.0.0")
# CORS: set ALLOWED_ORIGINS to a comma-separated list of frontend origins in
# production, e.g. "https://your-app.lovable.app,https://your-domain.com".
# Defaults to "*" so local development works out of the box.
_origins_env = os.getenv("ALLOWED_ORIGINS", "*").strip()
ALLOWED_ORIGINS = ["*"] if _origins_env == "*" else [o.strip() for o in _origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pre-trained models are loaded once at startup (never trained from scratch).
embedder = SentenceTransformer("all-MiniLM-L6-v2")
nlp = spacy.load("en_core_web_sm")

SKILL_VOCAB = [
    "python", "java", "c++", "c", "javascript", "typescript", "sql", "nosql", "html", "css",
    "react", "angular", "vue", "node.js", "django", "flask", "fastapi", "spring boot",
    "machine learning", "deep learning", "nlp", "computer vision", "data analysis",
    "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "keras", "opencv",
    "matplotlib", "power bi", "tableau", "excel", "statistics", "linear algebra",
    "aws", "azure", "gcp", "docker", "kubernetes", "git", "github", "ci/cd", "linux",
    "rest api", "graphql", "microservices", "mongodb", "postgresql", "mysql", "redis",
    "spark", "hadoop", "airflow", "etl", "data warehouse", "agile", "scrum", "jira",
    "communication", "leadership", "teamwork", "problem solving",
]

SECTION_PATTERNS: Dict[str, List[str]] = {
    "contact": [r"\b[\w.+-]+@[\w-]+\.[\w.]+\b", r"\+?\d[\d\s\-()]{8,}"],
    "summary": [r"\b(summary|objective|profile)\b"],
    "skills": [r"\b(skills|technical skills|technologies)\b"],
    "experience": [r"\b(experience|employment|internship|work history)\b"],
    "education": [r"\b(education|academic|qualification)\b"],
    "projects": [r"\b(projects?|portfolio)\b"],
    "certifications": [r"\b(certification|certificate|licenses?)\b"],
}

STOPWORDS_EXTRA = {"experience", "work", "role", "team", "job", "candidate", "company"}


def extract_pdf_text(payload: bytes) -> str:
    try:
        with fitz.open(stream=io.BytesIO(payload), filetype="pdf") as doc:
            return "\n".join(page.get_text("text") for page in doc)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"Could not read the PDF: {exc}") from exc


def detect_sections(text: str) -> Dict[str, bool]:
    lowered = text.lower()
    return {
        name: any(re.search(p, lowered) for p in patterns)
        for name, patterns in SECTION_PATTERNS.items()
    }


def split_section(text: str, headings: List[str], stop_headings: List[str]) -> List[str]:
    lines = [ln.strip() for ln in text.splitlines()]
    out: List[str] = []
    capture = False
    for line in lines:
        low = line.lower().strip(" :•-")
        if any(low.startswith(h) for h in headings):
            capture = True
            continue
        if capture and any(low.startswith(h) for h in stop_headings):
            break
        if capture and len(line) > 3:
            out.append(line)
    return out[:12]


def find_skills(text: str) -> List[str]:
    lowered = text.lower()
    return [s for s in SKILL_VOCAB if re.search(rf"(?<!\w){re.escape(s)}(?!\w)", lowered)]


def top_keywords(job_description: str, limit: int = 30) -> List[str]:
    vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2), max_features=400)
    matrix = vectorizer.fit_transform([job_description])
    scores = np.asarray(matrix.todense()).ravel()
    terms = np.array(vectorizer.get_feature_names_out())
    ranked = terms[np.argsort(scores)[::-1]]
    return [t for t in ranked if t not in STOPWORDS_EXTRA][:limit]


def semantic_match(resume_text: str, job_text: str) -> float:
    vectors = embedder.encode([resume_text, job_text], normalize_embeddings=True)
    similarity = float(np.dot(vectors[0], vectors[1]))
    return max(0.0, min(1.0, (similarity + 1) / 2 if similarity < 0 else similarity))


def build_recommendations(
    missing_skills: List[str],
    missing_keywords: List[str],
    sections: Dict[str, bool],
    match_pct: int,
) -> List[str]:
    tips: List[str] = []
    if missing_skills:
        tips.append(
            "Add concrete evidence for these required skills: "
            + ", ".join(missing_skills[:6])
            + ". Mention them inside project or experience bullets, not just a skills list."
        )
    if missing_keywords:
        tips.append(
            "Mirror the job's language by naturally including: " + ", ".join(missing_keywords[:8]) + "."
        )
    for name in ("summary", "skills", "projects", "experience", "education", "certifications"):
        if not sections.get(name):
            tips.append(f"Your resume has no clear '{name}' section — add one with a plain heading.")
    if match_pct < 60:
        tips.append(
            "Semantic match is low. Rewrite your summary and top three bullets around the "
            "responsibilities named in the job description."
        )
    tips.append(
        "Quantify impact in each bullet (metrics, scale, latency, accuracy, users) — "
        "recruiters and ATS ranking both favour specific outcomes."
    )
    return tips[:8]


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok", "model": "all-MiniLM-L6-v2"}


@app.post("/api/analyze-resume")
async def analyze_resume(
    resume: UploadFile = File(...),
    job_title: str = Form(""),
    job_description: str = Form(...),
):
    payload = await resume.read()
    if not payload:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    if len(payload) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="Resume exceeds the 5 MB limit.")
    if not (resume.filename or "").lower().endswith(".pdf"):
        raise HTTPException(status_code=415, detail="Only PDF resumes are supported.")
    if len(job_description.strip()) < 50:
        raise HTTPException(status_code=422, detail="Job description is too short to analyze.")

    resume_text = extract_pdf_text(payload)
    if len(resume_text.strip()) < 100:
        raise HTTPException(
            status_code=422,
            detail="Could not extract enough text. The PDF may be a scanned image.",
        )

    job_text = f"{job_title}\n{job_description}".strip()

    resume_skills = find_skills(resume_text)
    job_skills = find_skills(job_text)
    matched_skills = sorted(set(resume_skills) & set(job_skills)) or resume_skills
    missing_skills = sorted(set(job_skills) - set(resume_skills))

    keywords = top_keywords(job_text)
    resume_lower = resume_text.lower()
    matched_keywords = [k for k in keywords if k in resume_lower]
    missing_keywords = [k for k in keywords if k not in resume_lower]

    match_ratio = semantic_match(resume_text, job_text)
    match_score = round(match_ratio * 100)

    sections = detect_sections(resume_text)
    education = split_section(
        resume_text, ["education", "academic"], ["experience", "projects", "skills", "certification"]
    )
    experience = split_section(
        resume_text, ["experience", "employment", "internship"], ["education", "projects", "skills"]
    )
    projects = split_section(
        resume_text, ["project"], ["education", "experience", "skills", "certification"]
    )

    skills_factor = (
        len(matched_skills) / max(1, len(job_skills)) * 100 if job_skills else 60.0
    )
    keyword_factor = len(matched_keywords) / max(1, len(keywords)) * 100
    semantic_factor = match_score
    structure_factor = sum(sections.values()) / len(sections) * 100
    experience_factor = min(100.0, len(experience) * 12.5) if experience else 0.0
    education_factor = 100.0 if sections.get("education") else 0.0

    breakdown = {
        "skills_match": round(min(100.0, skills_factor)),
        "keyword_match": round(min(100.0, keyword_factor)),
        "semantic_match": round(semantic_factor),
        "structure": round(structure_factor),
        "experience": round(experience_factor),
        "education": round(education_factor),
    }
    weights = {
        "skills_match": 0.25,
        "keyword_match": 0.2,
        "semantic_match": 0.25,
        "structure": 0.15,
        "experience": 0.1,
        "education": 0.05,
    }
    ats_score = round(sum(breakdown[k] * w for k, w in weights.items()))

    doc = nlp(job_text[:3000])
    job_roles = sorted(
        {
            chunk.text.strip().title()
            for chunk in doc.noun_chunks
            if any(word in chunk.text.lower() for word in ("engineer", "developer", "analyst", "scientist"))
        }
    )[:6]

    return {
        "ats_score": ats_score,
        "match_score": match_score,
        "skills": matched_skills,
        "missing_skills": missing_skills,
        "matched_keywords": matched_keywords,
        "missing_keywords": missing_keywords,
        "education": education,
        "experience": experience,
        "projects": projects,
        "section_analysis": sections,
        "recommendations": build_recommendations(
            missing_skills, missing_keywords, sections, match_score
        ),
        "job_roles": job_roles,
        "ats_breakdown": breakdown,
    }


if __name__ == "__main__":  # local / container entry point
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
