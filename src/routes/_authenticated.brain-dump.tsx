import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/Cherry";
import { supabase } from "@/integrations/supabase/client";
import { AREAS, useAddTasks, useSaveProject } from "@/lib/api";
import { todayStr } from "@/lib/dates";
import { organizeBrainDump, type BrainPlan } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/brain-dump")({
  head: () => ({ meta: [{ title: "Brain Dump — Cherry planner" }, { name: "description", content: "Drop it all here. We'll figure it out together." }] }),
  component: BrainDump,
});

type Item = BrainPlan["tasks"][number] & { keep: boolean };

function BrainDump() {
  const [text, setText] = useState("");
  const [items, setItems] = useState<Item[] | null>(null);
  const [plan, setPlan] = useState<{ message: string; first_step: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [aiFailed, setAiFailed] = useState(false);
  const [showFirst, setShowFirst] = useState(false);
  const organize = useServerFn(organizeBrainDump);
  const addTasks = useAddTasks();
  const saveProject = useSaveProject();
  const nav = useNavigate();

  async function run(easier = false) {
    if (!text.trim()) { toast("Write anything at all — messy is perfect."); return; }
    setBusy(true);
    setAiFailed(false);
    if (!easier) await supabase.from("brain_dumps").insert({ content: text });
    try {
      const r = await organize({ data: { text, easier } });
      setItems(r.tasks.map((t) => ({ ...t, keep: true })));
      setPlan({ message: r.message, first_step: r.first_step });
    } catch (e) {
      setAiFailed(true);
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function manual() {
    const parts = text.split(/\n|,|;| and /).map((s) => s.trim()).filter((s) => s.length > 2);
    setItems(parts.map((title) => ({ title, area: "personal", urgent: false, is_project: false, estimate_min: null, steps: [], keep: true })));
    setPlan(null);
  }

  const upd = (i: number, patch: Partial<Item>) => setItems((arr) => arr!.map((it, j) => (j === i ? { ...it, ...patch } : it)));

  async function save() {
    const keep = (items ?? []).filter((i) => i.keep && i.title.trim());
    if (!keep.length) { toast("Nothing selected yet."); return; }
    try {
      for (const it of keep) {
        if (it.is_project) {
          const p = await saveProject.mutateAsync({ name: it.title, category: it.area });
          await addTasks.mutateAsync(it.steps.map((s, k) => ({ title: s, area: it.area, project_id: p.id, position: k })));
        } else {
          const [t] = await addTasks.mutateAsync([{ title: it.title, area: it.area, estimate_min: it.estimate_min, due_date: it.urgent ? todayStr() : null }]);
          if (t && it.steps.length) await addTasks.mutateAsync(it.steps.map((s, k) => ({ title: s, area: it.area, parent_id: t.id, position: k })));
        }
      }
      toast("Out of your head and into your planner ♡");
      setText("");
      setItems(null);
      nav({ to: "/today" });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div>
      <PageHeader title="Too much on your mind?" subtitle="Drop it all here. We'll figure it out together." />
      <div className="paper p-5">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="I need to send that client proposal, clean my apartment, work on my startup, buy groceries, and I don't even know where to start…"
          className="min-h-48 resize-y border-none bg-transparent text-base shadow-none focus-visible:ring-0"
        />
        <div className="flex flex-wrap justify-end gap-2 border-t border-dotted pt-3">
          <Button variant="ghost" onClick={manual} disabled={!text.trim()}>Sort it myself</Button>
          <Button onClick={() => run()} disabled={busy}>{busy ? "Untangling…" : "Help me sort this ✨"}</Button>
        </div>
      </div>
      {aiFailed && (
        <p className="mt-3 rounded-2xl bg-powder p-3 text-sm">Your thoughts are safe. You can <button className="font-semibold text-primary underline" onClick={manual}>turn them into tasks by hand</button>.</p>
      )}

      {items && (
        <section className="mt-6 grid gap-4">
          {plan && <p className="font-display text-lg italic text-primary">{plan.message}</p>}
          {showFirst && plan && (
            <div className="paper border-primary p-4">
              <span className="sticker">Your first step</span>
              <p className="mt-2 text-lg">{plan.first_step}</p>
            </div>
          )}
          <div className="paper divide-y divide-dotted p-2">
            {items.map((it, i) => (
              <div key={i} className={`grid gap-2 p-3 ${it.keep ? "" : "opacity-50"}`}>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={it.keep} onChange={(e) => upd(i, { keep: e.target.checked })} className="size-4 accent-primary" aria-label="Include" />
                  <input value={it.title} onChange={(e) => upd(i, { title: e.target.value })} className="flex-1 rounded-lg bg-transparent px-2 py-1 outline-none focus:bg-muted" />
                  <button onClick={() => setItems(items.filter((_, j) => j !== i))} aria-label="Remove" className="text-muted-foreground"><Trash2 className="size-4" /></button>
                </div>
                <div className="flex flex-wrap items-center gap-2 pl-6 text-xs">
                  <select value={it.area} onChange={(e) => upd(i, { area: e.target.value as Item["area"] })} className="rounded-full border bg-card px-2 py-1">
                    {AREAS.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
                  </select>
                  <button onClick={() => upd(i, { urgent: !it.urgent })} className={`sticker ${it.urgent ? "!bg-primary !text-primary-foreground" : ""}`}>{it.urgent ? "Today-ish" : "Not urgent"}</button>
                  <button onClick={() => upd(i, { is_project: !it.is_project })} className="sticker">{it.is_project ? "Big project" : "Single task"}</button>
                  {it.estimate_min && <span className="text-muted-foreground">~{it.estimate_min} min (estimate)</span>}
                </div>
                {it.steps.length > 0 && (
                  <ul className="ml-6 list-inside list-disc text-sm text-muted-foreground">
                    {it.steps.map((s, k) => <li key={k}>{s}</li>)}
                  </ul>
                )}
              </div>
            ))}
            {items.length === 0 && <p className="p-4 text-sm text-muted-foreground">Nothing here yet.</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={save} disabled={addTasks.isPending}>Add to my planner</Button>
            {plan && <Button variant="soft" onClick={() => run(true)} disabled={busy}>Make this easier</Button>}
            {plan && <Button variant="outline" onClick={() => setShowFirst(true)}>Choose my first step</Button>}
            <Button variant="ghost" onClick={() => setItems([...items, { title: "", area: "personal", urgent: false, is_project: false, estimate_min: null, steps: [], keep: true }])}>+ Add one</Button>
          </div>
        </section>
      )}
    </div>
  );
}
