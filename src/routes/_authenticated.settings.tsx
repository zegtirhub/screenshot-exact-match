import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/Cherry";
import { supabase } from "@/integrations/supabase/client";
import { usePrefs, useSavePrefs } from "@/lib/api";
import { deleteMyAccount } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Cherry planner" }, { name: "description", content: "Make your planner yours." }] }),
  component: Settings,
});

function Settings() {
  const { data: prefs } = usePrefs();
  const save = useSavePrefs();
  const delAcc = useServerFn(deleteMyAccount);
  const nav = useNavigate();
  const [name, setName] = useState(prefs?.display_name ?? "");

  async function exportData() {
    const tables = ["preferences", "tasks", "projects", "brain_dumps", "check_ins", "focus_sessions", "rewards"] as const;
    const out: Record<string, unknown> = {};
    for (const t of tables) out[t] = (await supabase.from(t).select("*")).data;
    const url = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "cherry-planner-export.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function deleteAll() {
    if (!confirm("This permanently deletes your account and everything in it. Are you sure?")) return;
    try {
      await delAcc();
      await supabase.auth.signOut();
      nav({ to: "/" });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="grid max-w-2xl gap-5">
      <PageHeader title="Settings" />
      <section className="paper grid gap-3 p-5">
        <h2 className="text-xl text-burgundy">You</h2>
        <div className="flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          <Button onClick={() => save.mutate({ display_name: name.trim() || null }, { onSuccess: () => toast("Saved ♡") })}>Save</Button>
        </div>
      </section>
      <section className="paper grid gap-4 p-5">
        <h2 className="text-xl text-burgundy">Vibe</h2>
        <label className="flex items-center justify-between gap-4">
          <span><b>Calm Mode</b><br /><span className="text-sm text-muted-foreground">Less decoration, no motion, extra clarity.</span></span>
          <Switch checked={prefs?.mode === "calm"} onCheckedChange={(v) => save.mutate({ mode: v ? "calm" : "cherry" })} />
        </label>
        <label className="flex items-center justify-between gap-4">
          <span><b>Cherry rewards</b><br /><span className="text-sm text-muted-foreground">Earn cherries and stickers. Turn off anytime.</span></span>
          <Switch checked={prefs?.rewards_enabled ?? true} onCheckedChange={(v) => save.mutate({ rewards_enabled: v })} />
        </label>
      </section>
      <section className="paper grid gap-3 p-5">
        <h2 className="text-xl text-burgundy">Your data</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportData}>Export my data</Button>
          <Button variant="outline" onClick={() => supabase.auth.signOut().then(() => nav({ to: "/" }))}>Sign out</Button>
          <Button variant="destructive" onClick={deleteAll}>Delete my account</Button>
        </div>
      </section>
    </div>
  );
}
