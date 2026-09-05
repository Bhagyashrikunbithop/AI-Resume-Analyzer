import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState, type DragEvent } from "react";
import { FileText, Loader2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  analyzeResume,
  formatBytes,
  validatePdf,
  ANALYZER_API_URL,
  IS_ANALYZER_CONFIGURED,
  type AnalysisResult,
} from "@/lib/analyzer-api";
import { cacheLocalAnalysis, saveAnalysis } from "@/lib/analyses";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/analyze")({
  head: () => ({
    meta: [
      { title: "Analyze Resume — AI Resume Analyzer" },
      {
        name: "description",
        content:
          "Upload your PDF resume and paste a job description to run a Sentence-BERT powered resume analysis.",
      },
      { property: "og:title", content: "Analyze Resume — AI Resume Analyzer" },
      {
        property: "og:description",
        content: "Upload a PDF resume and target job description to get an ATS-style analysis.",
      },
    ],
  }),
  component: AnalyzePage,
});

function AnalyzePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Please upload a PDF resume first.");
      if (jobDescription.trim().length < 50)
        throw new Error("Please paste a fuller job description (at least 50 characters).");

      const result: AnalysisResult = await analyzeResume({
        file,
        jobTitle: jobTitle.trim(),
        jobDescription: jobDescription.trim(),
      });

      const base = {
        ...result,
        job_title: jobTitle.trim(),
        job_description: jobDescription.trim(),
        file_name: file.name,
        created_at: new Date().toISOString(),
      };

      if (user) {
        const saved = await saveAnalysis({
          userId: user.id,
          jobTitle: jobTitle.trim(),
          jobDescription: jobDescription.trim(),
          fileName: file.name,
          result,
        });
        cacheLocalAnalysis(saved);
        return saved.id;
      }

      cacheLocalAnalysis({ ...base, id: "latest" } as never);
      return "latest";
    },
    onSuccess: (id) => {
      toast.success("Analysis complete");
      navigate({ to: "/results/$id", params: { id } });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const accept = (candidate: File) => {
    const problem = validatePdf(candidate);
    if (problem) {
      toast.error(problem);
      return;
    }
    setFile(candidate);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) accept(dropped);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Analyze your resume</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Upload a PDF resume and paste the job you are targeting. Analysis runs on the Python AI
        service
        {IS_ANALYZER_CONFIGURED ? (
          <>
            {" "}
            at <code className="rounded bg-muted px-1.5 py-0.5">{ANALYZER_API_URL}</code>.
          </>
        ) : (
          "."
        )}
      </p>

      {!IS_ANALYZER_CONFIGURED && (
        <Alert variant="destructive" className="mt-6">
          <AlertTitle>AI backend not configured</AlertTitle>
          <AlertDescription>
            Set the <code>VITE_API_URL</code> environment variable to the public URL of the deployed
            Python FastAPI analyzer (see <code>backend/README.md</code>), then rebuild. Analysis is
            disabled until then.
          </AlertDescription>
        </Alert>
      )}

      {!user && (
        <Alert className="mt-6">
          <AlertTitle>You are not signed in</AlertTitle>
          <AlertDescription>
            Results will be shown but not saved to your history. Sign in to keep every analysis.
          </AlertDescription>
        </Alert>
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">1. Resume (PDF)</CardTitle>
        </CardHeader>
        <CardContent>
          {file ? (
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background p-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <FileText className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(file.size)} · {mutation.isPending ? "Analyzing…" : "Ready"}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Remove file"
                onClick={() => setFile(null)}
                disabled={mutation.isPending}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-background px-6 py-14 text-center transition-colors",
                dragging && "border-primary bg-accent",
              )}
            >
              <UploadCloud className="h-8 w-8 text-primary" />
              <p className="mt-4 text-sm font-medium">Drag & drop your resume here</p>
              <p className="mt-1 text-xs text-muted-foreground">PDF only · up to 5 MB</p>
              <Button type="button" variant="outline" size="sm" className="mt-4">
                Browse files
              </Button>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              const chosen = e.target.files?.[0];
              if (chosen) accept(chosen);
              e.target.value = "";
            }}
          />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">2. Target job</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="job-title">Job title</Label>
            <Input
              id="job-title"
              placeholder="e.g. Machine Learning Engineer"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="job-description">Job description</Label>
            <Textarea
              id="job-description"
              rows={10}
              placeholder="Paste the full job description here…"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {jobDescription.trim().length} characters
            </p>
          </div>
        </CardContent>
      </Card>

      {mutation.isError && (
        <Alert variant="destructive" className="mt-6">
          <AlertTitle>Analysis failed</AlertTitle>
          <AlertDescription>{(mutation.error as Error).message}</AlertDescription>
        </Alert>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Button
          size="lg"
          disabled={!file || mutation.isPending || !IS_ANALYZER_CONFIGURED}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing resume…
            </>
          ) : (
            "Analyze resume"
          )}
        </Button>
        {mutation.isPending && (
          <span className="text-sm text-muted-foreground">
            Extracting text, embedding with Sentence-BERT and scoring…
          </span>
        )}
      </div>
    </div>
  );
}
