import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteAnalysis, listAnalyses } from "@/lib/analyses";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "Analysis History — AI Resume Analyzer" },
      {
        name: "description",
        content: "Review every resume analysis you have run and track score improvements over time.",
      },
      { property: "og:title", content: "Analysis History — AI Resume Analyzer" },
      { property: "og:description", content: "All your past resume analyses in one place." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["analyses"], queryFn: listAnalyses });

  const remove = useMutation({
    mutationFn: deleteAnalysis,
    onSuccess: () => {
      toast.success("Analysis deleted");
      void queryClient.invalidateQueries({ queryKey: ["analyses"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Analysis history</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every analysis saved to your account.
          </p>
        </div>
        <Button asChild>
          <Link to="/analyze">New analysis</Link>
        </Button>
      </div>

      {query.isLoading ? (
        <div className="mt-12 flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading history…
        </div>
      ) : query.isError ? (
        <p className="mt-12 text-sm text-destructive">{(query.error as Error).message}</p>
      ) : (query.data ?? []).length === 0 ? (
        <Card className="mt-10">
          <CardContent className="py-14 text-center">
            <p className="text-sm text-muted-foreground">
              No analyses yet. Upload a resume to get started.
            </p>
            <Button asChild className="mt-5">
              <Link to="/analyze">Analyze a resume</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-8 space-y-4">
          {(query.data ?? []).map((item) => (
            <Card key={item.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">
                      {item.job_title || "Untitled role"}
                    </CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.file_name} · {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        item.ats_score >= 75
                          ? "border-success/30 bg-success-soft text-success"
                          : item.ats_score >= 50
                            ? "border-warning/40 bg-warning-soft text-warning-foreground"
                            : "border-destructive/30 bg-danger-soft text-destructive"
                      }
                    >
                      ATS {item.ats_score}
                    </Badge>
                    <Badge variant="secondary">Match {item.match_score}%</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-0">
                <p className="text-xs text-muted-foreground">
                  {item.skills.length} skills found · {item.missing_skills.length} missing
                </p>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to="/results/$id" params={{ id: item.id }}>
                      View dashboard
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
