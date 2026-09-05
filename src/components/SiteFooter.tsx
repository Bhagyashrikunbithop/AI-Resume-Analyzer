export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>AI Resume Analyzer — Sentence-BERT semantic matching, spaCy NLP, TF-IDF keywords.</p>
        <p>Scores are ATS-style estimates, not official ATS results.</p>
      </div>
    </footer>
  );
}
