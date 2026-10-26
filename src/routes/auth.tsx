import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import "@lovable.dev/cloud-auth-js/styles.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import cherry from "@/assets/cherry-bow.png";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — CherryMind planner" },
      { name: "description", content: "Sign in or create your CherryMind planner account." },
      { property: "og:title", content: "Sign in — CherryMind planner" },
      { property: "og:description", content: "Your little corner of the world is waiting." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) nav({ to: "/today" });
  }, [user, nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/today" } });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    if (mode === "up" && !data.session) toast("Check your inbox to confirm your email 💌");
  }

  async function social(p: "google" | "lovable") {
    const r = await lovable.auth.signInWithOAuth(p, { redirect_uri: window.location.origin });
    if (r.error) toast.error(r.error.message ?? "Sign in failed");
  }

  return (
    <main className="grid min-h-screen place-items-center px-5">
      <div className="paper w-full max-w-sm p-7">
        <img src={cherry} alt="" width={816} height={816} className="mx-auto -mt-16 w-28" />
        <h1 className="text-center text-3xl text-burgundy">{mode === "in" ? "Welcome back" : "Make your corner"}</h1>
        <p className="mb-5 text-center text-sm text-muted-foreground">One thing at a time, cherry.</p>
        <form onSubmit={submit} className="grid gap-3">
          <Input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl" />
          <Input type="password" required minLength={6} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 rounded-xl" />
          <Button type="submit" disabled={busy} size="lg">{mode === "in" ? "Sign in" : "Create account"}</Button>
        </form>
        <div className="my-4 text-center text-xs text-muted-foreground">or</div>
        <div className="grid gap-2">
          <Button variant="outline" onClick={() => social("google")}>Continue with Google</Button>
          <button type="button" className="lovable-auth-button" onClick={() => social("lovable")}>Continue with Lovable</button>
        </div>
        <button className="mt-5 w-full text-center text-sm text-primary underline-offset-4 hover:underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>
          {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}
