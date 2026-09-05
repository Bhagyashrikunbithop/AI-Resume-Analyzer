import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { listAnalyses } from "@/lib/analyses";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your Profile — AI Resume Analyzer" },
      {
        name: "description",
        content: "Manage your analyzer profile, target role and see your analysis statistics.",
      },
      { property: "og:title", content: "Your Profile — AI Resume Analyzer" },
      { property: "og:description", content: "Manage your analyzer profile and target role." },
    ],
  }),
  component: ProfilePage,
});

interface ProfileForm {
  full_name: string;
  headline: string;
  target_role: string;
}

function ProfilePage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ProfileForm>({ full_name: "", headline: "", target_role: "" });

  const userQuery = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => (await supabase.auth.getUser()).data.user,
  });

  const profileQuery = useQuery({
    queryKey: ["profile", userQuery.data?.id],
    enabled: Boolean(userQuery.data?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, headline, target_role")
        .eq("id", userQuery.data!.id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data ?? { full_name: "", headline: "", target_role: "" }) as ProfileForm;
    },
  });

  const analysesQuery = useQuery({ queryKey: ["analyses"], queryFn: listAnalyses });

  useEffect(() => {
    if (profileQuery.data) {
      setForm({
        full_name: profileQuery.data.full_name ?? "",
        headline: profileQuery.data.headline ?? "",
        target_role: profileQuery.data.target_role ?? "",
      });
    }
  }, [profileQuery.data]);

  const save = useMutation({
    mutationFn: async () => {
      const id = userQuery.data?.id;
      if (!id) throw new Error("Not signed in.");
      const { error } = await supabase.from("profiles").upsert({ id, ...form });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Profile saved");
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const analyses = analysesQuery.data ?? [];
  const bestAts = analyses.length ? Math.max(...analyses.map((a) => a.ats_score)) : 0;
  const avgMatch = analyses.length
    ? Math.round(analyses.reduce((sum, a) => sum + a.match_score, 0) / analyses.length)
    : 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Your profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">{userQuery.data?.email}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Analyses run", value: String(analyses.length) },
          { label: "Best ATS-style score", value: `${bestAts}/100` },
          { label: "Average job match", value: `${avgMatch}%` },
        ].map((stat) => (
          <div key={stat.label} className="surface-card p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">Profile details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input
              id="full_name"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="headline">Headline</Label>
            <Input
              id="headline"
              placeholder="Final-year CSE student · ML enthusiast"
              value={form.headline}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="target_role">Target role</Label>
            <Input
              id="target_role"
              placeholder="Machine Learning Engineer"
              value={form.target_role}
              onChange={(e) => setForm({ ...form, target_role: e.target.value })}
            />
          </div>
          <Button disabled={save.isPending} onClick={() => save.mutate()}>
            {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save profile
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
