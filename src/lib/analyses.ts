import { supabase } from "@/integrations/supabase/client";
import type { AnalysisResult, SectionAnalysis } from "./analyzer-api";

export interface StoredAnalysis extends AnalysisResult {
  id: string;
  job_title: string;
  job_description: string;
  file_name: string;
  created_at: string;
}

interface AnalysisRow {
  id: string;
  job_title: string;
  job_description: string;
  file_name: string;
  ats_score: number;
  match_score: number;
  skills: unknown;
  missing_skills: unknown;
  matched_keywords: unknown;
  missing_keywords: unknown;
  education: unknown;
  experience: unknown;
  projects: unknown;
  section_analysis: unknown;
  recommendations: unknown;
  created_at: string;
}

const asList = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

function fromRow(row: AnalysisRow): StoredAnalysis {
  return {
    id: row.id,
    job_title: row.job_title,
    job_description: row.job_description,
    file_name: row.file_name,
    created_at: row.created_at,
    ats_score: row.ats_score,
    match_score: row.match_score,
    skills: asList(row.skills),
    missing_skills: asList(row.missing_skills),
    matched_keywords: asList(row.matched_keywords),
    missing_keywords: asList(row.missing_keywords),
    education: asList(row.education),
    experience: asList(row.experience),
    projects: asList(row.projects),
    section_analysis: (row.section_analysis as SectionAnalysis) ?? {},
    recommendations: asList(row.recommendations),
  };
}

export async function saveAnalysis(input: {
  userId: string;
  jobTitle: string;
  jobDescription: string;
  fileName: string;
  result: AnalysisResult;
}): Promise<StoredAnalysis> {
  const { data, error } = await supabase
    .from("resume_analyses")
    .insert({
      user_id: input.userId,
      job_title: input.jobTitle,
      job_description: input.jobDescription,
      file_name: input.fileName,
      ats_score: input.result.ats_score,
      match_score: input.result.match_score,
      skills: input.result.skills,
      missing_skills: input.result.missing_skills,
      matched_keywords: input.result.matched_keywords,
      missing_keywords: input.result.missing_keywords,
      education: input.result.education,
      experience: input.result.experience,
      projects: input.result.projects,
      section_analysis: input.result.section_analysis,
      recommendations: input.result.recommendations,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return fromRow(data as unknown as AnalysisRow);
}

export async function listAnalyses(): Promise<StoredAnalysis[]> {
  const { data, error } = await supabase
    .from("resume_analyses")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as AnalysisRow[]).map(fromRow);
}

export async function getAnalysis(id: string): Promise<StoredAnalysis | null> {
  const { data, error } = await supabase
    .from("resume_analyses")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? fromRow(data as unknown as AnalysisRow) : null;
}

export async function deleteAnalysis(id: string): Promise<void> {
  const { error } = await supabase.from("resume_analyses").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Local fallback so an analysis is viewable even when the user is signed out. */
const LOCAL_KEY = "ai-resume-analyzer:last-analysis";

export function cacheLocalAnalysis(value: Omit<StoredAnalysis, "id">) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(LOCAL_KEY, JSON.stringify({ ...value, id: "latest" }));
}

export function readLocalAnalysis(): StoredAnalysis | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(LOCAL_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAnalysis;
  } catch {
    return null;
  }
}

export function downloadReport(analysis: StoredAnalysis) {
  const lines = [
    "AI RESUME ANALYZER — ANALYSIS REPORT",
    "=".repeat(48),
    `Generated: ${new Date(analysis.created_at).toLocaleString()}`,
    `Resume file: ${analysis.file_name}`,
    `Target role: ${analysis.job_title}`,
    "",
    `ATS-style score: ${analysis.ats_score}/100 (unofficial, heuristic)`,
    `AI job match: ${analysis.match_score}%`,
    "",
    `Skills found (${analysis.skills.length}): ${analysis.skills.join(", ") || "—"}`,
    `Missing skills (${analysis.missing_skills.length}): ${analysis.missing_skills.join(", ") || "—"}`,
    "",
    `Matched keywords: ${analysis.matched_keywords.join(", ") || "—"}`,
    `Missing keywords: ${analysis.missing_keywords.join(", ") || "—"}`,
    "",
    "Resume sections:",
    ...Object.entries(analysis.section_analysis).map(
      ([name, present]) => `  - ${name}: ${present ? "present" : "missing"}`,
    ),
    "",
    "Education:",
    ...analysis.education.map((e) => `  - ${e}`),
    "",
    "Experience:",
    ...analysis.experience.map((e) => `  - ${e}`),
    "",
    "Projects:",
    ...analysis.projects.map((p) => `  - ${p}`),
    "",
    "AI recommendations:",
    ...analysis.recommendations.map((r, i) => `  ${i + 1}. ${r}`),
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `resume-analysis-${analysis.job_title.replace(/\s+/g, "-").toLowerCase() || "report"}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
