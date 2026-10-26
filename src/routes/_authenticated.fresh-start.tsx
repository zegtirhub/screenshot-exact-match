import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/Cherry";
import { useAddTasks, useDeleteTask, useTasks, useUpdateTask } from "@/lib/api";
import { addDays, prettyDate, todayStr } from "@/lib/dates";
import { breakDown } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/fresh-start")({
  head: () => ({ meta: [{ title: "Fresh Start — Cherry planner" }, { name: "description", content: "Yesterday is over. We can start again." }] }),
  component: FreshStart,
});

function FreshStart() {
  const today = todayStr();
  const { data: tasks = [] } = useTasks();
  const update = useUpdateTask();
  const del = useDeleteTask();
  const add = useAddTasks();
  const brk = useServerFn(breakDown);
  const [busy, setBusy] = useState<string | null>(null);
  const old = tasks.filter((t) => t.status === "todo" && !t.parent_id && t.due_date && t.due_date < today);

  async function split(id: string, title: string, area: string) {
    setBusy(id);
    try {
      const r = await brk({ data: { title } });
      await add.mutateAsync(r.steps.map((s, i) => ({ title: s, parent_id: id, area, position: i })));
      update.mutate({ id, due_date: today });
      toast("Smaller steps added. Moved to today.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Need a fresh start? ♡" subtitle="Yesterday is over. We can start again." />
      {old.length === 0 ? (
        <div className="paper p-8 text-center">
          <p className="font-display text-xl text-burgundy">All clear. A fresh page is waiting.</p>
          <Button asChild className="mt-4"><Link to="/today">Back to Today</Link></Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {old.map((t) => (
            <div key={t.id} className="paper p-4">
              <p className="font-medium">{t.title}</p>
              <p className="text-xs text-muted-foreground">Was planned for {prettyDate(t.due_date!, { month: "short", day: "numeric" })}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => update.mutate({ id: t.id, due_date: today })}>Keep for today</Button>
                <Button size="sm" variant="soft" onClick={() => update.mutate({ id: t.id, due_date: addDays(today, 7), is_pick: false })}>Next week</Button>
                <Button size="sm" variant="outline" onClick={() => update.mutate({ id: t.id, due_date: null, is_pick: false })}>Anytime</Button>
                <Button size="sm" variant="outline" disabled={busy === t.id} onClick={() => split(t.id, t.title, t.area)}>{busy === t.id ? "Thinking…" : "Break into smaller steps"}</Button>
                <Button size="sm" variant="ghost" onClick={() => update.mutate({ id: t.id, status: "archived" })}>Archive</Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => del.mutate(t.id)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
