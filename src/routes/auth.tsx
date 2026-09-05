import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — AI Resume Analyzer" },
      {
        name: "description",
        content: "Sign in to save your resume analyses, track history and manage your profile.",
      },
      { property: "og:title", content: "Sign in — AI Resume Analyzer" },
      { property: "og:description", content: "Save your resume analyses and track your progress." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  const signIn = async () => {
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      if (/email not confirmed|not confirmed/i.test(error.message)) {
        toast.error("Please verify your email address before accessing the Resume Analyzer.");
        navigate({ to: "/verify-email", search: { email } });
        return;
      }
      toast.error(error.message);
      return;
    }
    if (!data.user?.email_confirmed_at) {
      await supabase.auth.signOut();
      toast.error("Please verify your email address before accessing the Resume Analyzer.");
      navigate({ to: "/verify-email", search: { email } });
      return;
    }
    toast.success("Welcome back");
    navigate({ to: "/analyze" });
  };

  const signUp = async () => {
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/verify-email`,
        data: { full_name: fullName },
      },
    });
    setBusy(false);
    if (error) {
      if (/already registered|already been registered|user already/i.test(error.message)) {
        toast.error("That email is already registered. Try signing in instead.");
        return;
      }
      toast.error(error.message);
      return;
    }
    if (data.session && data.user?.email_confirmed_at) {
      toast.success("Account created. You can start analyzing now.");
      navigate({ to: "/analyze" });
      return;
    }
    toast.success("Account created. Check your email to verify your address.");
    navigate({ to: "/verify-email", search: { email } });
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Your analyzer account</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="si-email">Email</Label>
                <Input
                  id="si-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="si-password">Password</Label>
                <Input
                  id="si-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button className="w-full" disabled={busy} onClick={signIn}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Sign in
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="su-name">Full name</Label>
                <Input id="su-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="su-email">Email</Label>
                <Input
                  id="su-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="su-password">Password</Label>
                <Input
                  id="su-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button className="w-full" disabled={busy} onClick={signUp}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create account
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
