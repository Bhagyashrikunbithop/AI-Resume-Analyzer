import {
  Award,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Download,
  FolderGit2,
  Gauge,
  ListChecks,
  Sparkles,
  Target,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { downloadReport, type StoredAnalysis } from "@/lib/analyses";

function scoreTone(score: number) {
  if (score >= 75) return { label: "Strong", color: "text-success", bar: "bg-success" };
  if (score >= 50) return { label: "Needs work", color: "text-warning", bar: "bg-warning" };
  return { label: "At risk", color: "text-destructive", bar: "bg-destructive" };
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
  hint: string;
  tone: string;
}) {
  return (
    <div className="surface-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <Icon className={`h-4 w-4 ${tone}`} />
      </div>
      <p className={`mt-3 text-3xl font-semibold ${tone}`}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function ChipList({
  items,
  variant,
  empty,
}: {
  items: string[];
  variant: "match" | "missing" | "neutral";
  empty: string;
}) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  const cls =
    variant === "match"
      ? "border-success/30 bg-success-soft text-success"
      : variant === "missing"
        ? "border-destructive/30 bg-danger-soft text-destructive"
        : "border-border bg-muted text-foreground";
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className={`rounded-full border px-3 py-1 text-xs font-medium ${cls}`}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function SectionList({
  icon: Icon,
  title,
  items,
  empty,
}: {
  icon: typeof BookOpen;
  title: string;
  items: string[];
  empty: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 text-primary" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item, i) => (
              <li key={`${title}-${i}`} className="flex gap-3 text-sm leading-relaxed">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function ResultsDashboard({ analysis }: { analysis: StoredAnalysis }) {
  const ats = scoreTone(analysis.ats_score);
  const match = scoreTone(analysis.match_score);

  const skillData = [
    { name: "Matched skills", value: analysis.skills.length },
    { name: "Missing skills", value: analysis.missing_skills.length },
  ];
  const keywordData = [
    { name: "Matched", value: analysis.matched_keywords.length },
    { name: "Missing", value: analysis.missing_keywords.length },
  ];
  const pieColors = ["var(--color-success)", "var(--color-destructive)"];
  const sections = Object.entries(analysis.section_analysis);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Analysis results</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {analysis.file_name || "Resume"} · {analysis.job_title || "Target role"} ·{" "}
            {new Date(analysis.created_at).toLocaleString()}
          </p>
        </div>
        <Button variant="outline" onClick={() => downloadReport(analysis)}>
          <Download className="mr-2 h-4 w-4" /> Download report
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Gauge}
          label="ATS-style score"
          value={`${analysis.ats_score}/100`}
          hint={`${ats.label} — unofficial estimate`}
          tone={ats.color}
        />
        <StatCard
          icon={Target}
          label="AI job match"
          value={`${analysis.match_score}%`}
          hint={`${match.label} semantic fit`}
          tone={match.color}
        />
        <StatCard
          icon={CheckCircle2}
          label="Skills found"
          value={String(analysis.skills.length)}
          hint="Detected in your resume"
          tone="text-primary"
        />
        <StatCard
          icon={TriangleAlert}
          label="Missing skills"
          value={String(analysis.missing_skills.length)}
          hint="Required by the job description"
          tone="text-destructive"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-4 w-4 text-primary" /> ATS-style score breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Overall ATS-style score</span>
                <span className={ats.color}>{analysis.ats_score}/100</span>
              </div>
              <Progress value={analysis.ats_score} className="mt-2" />
            </div>
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Semantic job match</span>
                <span className={match.color}>{analysis.match_score}%</span>
              </div>
              <Progress value={analysis.match_score} className="mt-2" />
            </div>
            <Separator />
            {analysis.ats_breakdown && Object.keys(analysis.ats_breakdown).length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={Object.entries(analysis.ats_breakdown).map(([name, value]) => ({
                      name: name.replace(/_/g, " "),
                      value,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                The score blends skills match, keyword coverage, semantic job match, section
                completeness, experience relevance and education relevance. It is an ATS-style
                estimate, not an official ATS result.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={skillData} dataKey="value" innerRadius={45} outerRadius={70}>
                    {skillData.map((_, i) => (
                      <Cell key={i} fill={pieColors[i]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-2 text-sm">
              {keywordData.map((k, i) => (
                <div key={k.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: pieColors[i] }}
                    />
                    {k.name} keywords
                  </span>
                  <span className="font-medium">{k.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4 text-success" /> Skills analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChipList items={analysis.skills} variant="match" empty="No skills detected." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <XCircle className="h-4 w-4 text-destructive" /> Missing skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChipList
              items={analysis.missing_skills}
              variant="missing"
              empty="Nothing missing — great coverage."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ListChecks className="h-4 w-4 text-primary" /> Matched keywords
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChipList
              items={analysis.matched_keywords}
              variant="match"
              empty="No overlapping keywords found."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TriangleAlert className="h-4 w-4 text-warning" /> Missing keywords
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChipList
              items={analysis.missing_keywords}
              variant="missing"
              empty="All important keywords are covered."
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resume structure</CardTitle>
        </CardHeader>
        <CardContent>
          {sections.length === 0 ? (
            <p className="text-sm text-muted-foreground">No section data returned.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sections.map(([name, present]) => (
                <div
                  key={name}
                  className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3"
                >
                  <span className="text-sm font-medium capitalize">{name.replace(/_/g, " ")}</span>
                  <Badge
                    variant="outline"
                    className={
                      present
                        ? "border-success/30 bg-success-soft text-success"
                        : "border-destructive/30 bg-danger-soft text-destructive"
                    }
                  >
                    {present ? "Present" : "Missing"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionList
          icon={BookOpen}
          title="Education"
          items={analysis.education}
          empty="No education entries detected."
        />
        <SectionList
          icon={Briefcase}
          title="Experience"
          items={analysis.experience}
          empty="No experience entries detected."
        />
        <SectionList
          icon={FolderGit2}
          title="Projects"
          items={analysis.projects}
          empty="No projects detected."
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" /> AI recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analysis.recommendations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recommendations returned.</p>
          ) : (
            <ol className="space-y-4">
              {analysis.recommendations.map((rec, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed">{rec}</p>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      {analysis.job_roles && analysis.job_roles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recommended job roles</CardTitle>
          </CardHeader>
          <CardContent>
            <ChipList items={analysis.job_roles} variant="neutral" empty="" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
