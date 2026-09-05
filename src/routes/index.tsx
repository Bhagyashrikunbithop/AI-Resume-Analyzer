import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BrainCircuit,
  FileText,
  Gauge,
  LineChart,
  ListChecks,
  ScanSearch,
  Sparkles,
  Target,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Resume Analyzer — Match your resume to any job" },
      {
        name: "description",
        content:
          "Upload a PDF resume, paste a job description, and get an ATS-style score, semantic job match, skill gaps and AI recommendations.",
      },
      { property: "og:title", content: "AI Resume Analyzer — Match your resume to any job" },
      {
        property: "og:description",
        content: "Analyze your resume. Match your dream job. Improve your chances.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Gauge,
    title: "ATS-style score",
    body: "A 0–100 readiness estimate combining skills, keywords, semantic fit, structure, experience and education.",
  },
  {
    icon: Target,
    title: "Semantic job match",
    body: "Sentence-BERT embeddings and cosine similarity measure true meaning overlap, not just word counts.",
  },
  {
    icon: ListChecks,
    title: "Skill gap analysis",
    body: "See which skills and keywords from the job description your resume already covers — and which are missing.",
  },
  {
    icon: ScanSearch,
    title: "Section detection",
    body: "spaCy-powered extraction of education, experience, projects and structural completeness checks.",
  },
  {
    icon: Sparkles,
    title: "AI recommendations",
    body: "Prioritized, concrete suggestions to rewrite bullets, add evidence and close the biggest gaps.",
  },
  {
    icon: LineChart,
    title: "History & reports",
    body: "Every analysis is saved to your account so you can track improvements and download a report.",
  },
];

const STEPS = [
  { icon: UploadCloud, title: "Upload your resume", body: "Drag and drop a PDF (up to 5 MB)." },
  { icon: FileText, title: "Paste the job", body: "Add the job title and full job description." },
  { icon: BrainCircuit, title: "Get your dashboard", body: "Scores, gaps and next actions in seconds." },
];

function Landing() {
  return (
    <div>
      <section className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <Badge variant="secondary" className="mb-4">
              Sentence-BERT · all-MiniLM-L6-v2
            </Badge>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">AI Resume Analyzer</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Analyze your resume. Match your dream job. Improve your chances.
            </p>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Upload a PDF resume and paste a target job description. The analyzer extracts your
              skills, compares them semantically against the role, and returns an ATS-style score
              with a clear list of what to fix first.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/analyze">
                  <UploadCloud className="mr-2 h-4 w-4" /> Upload resume
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/history">View history</Link>
              </Button>
            </div>
          </div>

          <div className="surface-card p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Sample dashboard output</p>
              <Badge variant="outline">Live backend required</Badge>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4">
              {[
                { label: "ATS-style score", value: "84", tone: "text-success" },
                { label: "Job match", value: "78%", tone: "text-primary" },
                { label: "Skills found", value: "26", tone: "text-foreground" },
                { label: "Missing skills", value: "7", tone: "text-destructive" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg border border-border bg-background p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className={`mt-1 text-2xl font-semibold ${stat.tone}`}>{stat.value}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Real numbers come from the Python analysis service — nothing is simulated once it is
              connected.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-semibold">How it works</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <Card key={step.title} className="shadow-none">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <step.icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">Step {i + 1}</span>
                </div>
                <CardTitle className="pt-2 text-lg">{step.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{step.body}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-semibold">What you get</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="surface-card p-6">
                <f.icon className="h-6 w-6 text-primary" />
                <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold">The AI behind the score</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              A Python service handles all analysis. Resume text is extracted with PyMuPDF, cleaned
              and parsed with spaCy, then encoded together with the job description using the
              pre-trained Sentence-BERT model <strong>all-MiniLM-L6-v2</strong>. Cosine similarity
              between the two embeddings gives the semantic match percentage, while scikit-learn
              TF-IDF surfaces the keywords that matter most for the role.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              No model is trained from scratch, and the ATS-style score is a transparent heuristic —
              it is not an official applicant tracking system result.
            </p>
          </div>
          <div className="surface-card divide-y divide-border">
            {[
              ["Semantic model", "Sentence Transformers · all-MiniLM-L6-v2"],
              ["NLP pipeline", "spaCy entity & section extraction"],
              ["Keyword engine", "scikit-learn TF-IDF"],
              ["PDF parsing", "PyMuPDF / pdfplumber"],
              ["API", "FastAPI · POST /api/analyze-resume"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-4 px-6 py-4">
                <span className="text-sm font-medium">{k}</span>
                <span className="text-right text-sm text-muted-foreground">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
