import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResultsDashboard } from "@/components/ResultsDashboard";
import { getAnalysis, readLocalAnalysis, type StoredAnalysis } from "@/lib/analyses";

export const Route = createFileRoute("/results/$id")({
  head: () => ({
    meta: [
      { title: "Results Dashboard — AI Resume Analyzer" },
      {
        name: "description",
        content:
          "ATS-style score, semantic job match, skill gaps, keyword coverage and AI recommendations for your resume.",
      },
      { property: "og:title", content: "Results Dashboard — AI Resume Analyzer" },
      {
        property: "og:description",
        content: "See your ATS-style score, job match and prioritized resume improvements.",
      },
    ],
  }),
  component: ResultsPage,
});

function ResultsPage() {
  const { id } = Route.useParams();

  const query = useQuery<StoredAnalysis | null>({
    queryKey: ["analysis", id],
    queryFn: async () => {
      if (id === "latest") return readLocalAnalysis();
      const remote = await getAnalysis(id);
      if (remote) return remote;
      const local = readLocalAnalysis();
      return local && local.id === id ? local : null;
    },
  });

  if (query.isLoading) {
    return (
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-24 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading analysis…
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">Analysis not available</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {query.isError
            ? (query.error as Error).message
            : "This analysis could not be found. It may belong to another account or the session expired."}
        </p>
        <Button asChild className="mt-6">
          <Link to="/analyze">Run a new analysis</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <ResultsDashboard analysis={query.data} />
    </div>
  );
}
