import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Search = {
  email?: string | undefined;
  error?: string | undefined;
  error_description?: string | undefined;
};

export const Route = createFileRoute("/verify-email")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): Search => ({
    email: typeof search['email'] === "string" ? search['email'] : undefined,
    error: typeof search['error'] === "string" ? search['error'] : undefined,
    error_description:
      typeof search['error_description'] === "string" ? search['error_description'] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Verify your email — AI Resume Analyzer" },
      {
        name: "description",
        content:
          "Confirm your email address to unlock the AI Resume Analyzer dashboard, analysis history and saved reports.",
      },
      { property: "og:title", content: "Verify your email — AI Resume Analyzer" },
      {
        property: "og:description",
        content: "Confirm your email address to start analyzing resumes.",
      },
    ],
  }),
  component: VerifyEmailPage,
});

/** Supabase returns link errors in the URL hash (#error=...&error_description=...). */
function readHashError(): string | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  const description = params.get("error_description");
  const code = params.get("error_code") ?? params.get("error");
  if (!description && !code) return null;
  return description ?? code ?? null;
}

function VerifyEmailPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { user, loading } = useAuth();
  const [linkError, setLinkError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    setLinkError(search.error_description ?? search.error ?? readHashError());
  }, [search.error, search.error_description]);

  const email = user?.email ?? search.email ?? "";
  const verified = Boolean(user?.email_confirmed_at);

  const resend = async () => {
    if (!email) {
      toast.error("No email address to resend to. Please sign up or sign in again.");
      return;
    }
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/verify-email` },
    });
    setResending(false);
    if (error) {
      const message = /already confirmed|already been confirmed/i.test(error.message)
        ? "This email is already verified — you can sign in."
        : error.message;
      toast.error(message);
      return;
    }
    toast.success("Verification email sent. Check your inbox (and spam folder).");
  };

  if (loading) {
    return (
      <div className="mx-auto flex max-w-md items-center justify-center px-4 py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (verified) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <Card>
          <CardHeader className="items-center text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-primary">
              <CheckCircle2 className="h-6 w-6" />
            </span>
            <CardTitle className="mt-3">Email Verified Successfully</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              {email} is confirmed. Your analyzer dashboard is ready.
            </p>
            <Button className="w-full" onClick={() => navigate({ to: "/analyze" })}>
              Continue to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Card>
        <CardHeader className="items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-primary">
            <MailCheck className="h-6 w-6" />
          </span>
          <CardTitle className="mt-3">Check Your Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-center text-sm text-muted-foreground">
            We&apos;ve sent a verification link to your email address. Please verify your email to
            continue.
          </p>

          {email && (
            <p className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-center text-sm font-medium">
              {email}
            </p>
          )}

          {linkError && (
            <Alert variant="destructive">
              <AlertTitle>Verification link problem</AlertTitle>
              <AlertDescription>
                {linkError}. The link may be expired or already used — request a new one below.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Button className="w-full" onClick={resend} disabled={resending}>
              {resending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Resend Verification Email
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/auth">Back to Login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
