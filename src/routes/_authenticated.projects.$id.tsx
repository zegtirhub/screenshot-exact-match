import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { TaskItem, QuickAdd, groupSubtasks } from "@/components/TaskItem";
import { useAddTasks, useDeleteProject, useProjects, useSaveProject, useTasks } from "@/lib/api";
import { prettyDate } from "@/lib/dates";
import { breakDown } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/projects/$id")({
  head: () => ({ meta: [{ title: "Project — Cherry planner" }, { name: "description", content: "One project, many little steps." }] }),
  component: ProjectPage,
});

function ProjectPage() {
  const { id } = Route.useParams();
  const { data: projects = [], isLoading } = useProjects();
  const { data: tasks = [] } = useTasks();
  const save = useSaveProject();
  const del = useDeleteProject();
  const add = useAddTasks();
  const brk = useServerFn(breakDown);
  const nav = useNavigate();
  const p = projects.find((x) => x.id === id);
  const [view, setView] = useState<"list" | "board" | "timeline">("list");
  const [notes, setNotes] = useState("");
  const [suggest, setSuggest] = useState<{ text: string; keep: boolean }[] | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => setNotes(p?.notes ?? ""), [p?.notes]);

  const pt = useMemo(() => tasks.filter((t) => t.project_id === id && !t.parent_id), [tasks, id]);
  const subs = useMemo(() => groupSubtasks(tasks), [tasks]);
  if (isLoading) return null;
  if (!p) return <p>Project not found. <Link to="/projects" className="text-primary underline">Back to projects</Link></p>;
  const done = pt.filter((t) => t.status === "done").length;
  const pct = pt.length ? Math.round((done / pt.length) * 100) : 0;

  async function lessOverwhelming() {
    setBusy(true);
    try {
      const r = await brk({ data: { title: p!.name, context: [p!.description, ...pt.map((t) => `existing step: ${t.title}`)].filter(Boolean).join("\n") } });
      setSuggest(r.steps.map((text) => ({ text, keep: true })));
      toast(r.message);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function addSuggestions() {
    const keep = suggest!.filter((s) => s.keep && s.text.trim());
    await add.mutateAsync(keep.map((s, i) => ({ title: s.text, project_id: id, area: p!.category, position: pt.length + i })));
    setSuggest(null);
  }

  return (
    <div className="grid gap-6">
      <Link to="/projects" className="flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="size-4" /> Projects</Link>
      <header className="paper p-6">
        <span className="sticker capitalize">{p.category}</span>
        <input
          defaultValue={p.name}
          onBlur={(e) => e.target.value.trim() && e.target.value !== p.name && save.mutate({ id, name: e.target.value.trim() })}
          className="mt-2 w-full bg-transparent font-display text-3xl font-semibold text-burgundy outline-none"
          aria-label="Project name"
        />
        <textarea
          defaultValue={p.description ?? ""}
          placeholder="Add a description…"
          onBlur={(e) => e.target.value !== (p.description ?? "") && save.mutate({ id, name: p.name, description: e.target.value })}
          className="mt-1 w-full resize-none bg-transparent text-muted-foreground outline-none"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-2 text-muted-foreground">Deadline (optional)
            <Input type="date" className="h-8 w-40" defaultValue={p.deadline ?? ""} onChange={(e) => save.mutate({ id, name: p.name, deadline: e.target.value || null })} />
          </label>
        </div>
        <Progress value={pct} className="mt-4 h-2.5 bg-blush" />
        <p className="mt-1 text-xs text-muted-foreground">{done}/{pt.length} steps done</p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-full bg-secondary p-1">
          {(["list", "board", "timeline"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className={`rounded-full px-4 py-1.5 text-sm capitalize ${view === v ? "bg-card font-semibold text-primary shadow" : ""}`}>{v}</button>
          ))}
        </div>
        <Button variant="soft" onClick={lessOverwhelming} disabled={busy} className="ml-auto">{busy ? "Thinking…" : "Make this less overwhelming"}</Button>
      </div>

      {suggest && (
        <section className="paper border-primary p-5">
          <h3 className="text-lg text-burgundy">Suggested steps — edit anything</h3>
          <div className="mt-2 grid gap-2">
            {suggest.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="checkbox" checked={s.keep} onChange={(e) => setSuggest(suggest.map((x, j) => (j === i ? { ...x, keep: e.target.checked } : x)))} className="size-4 accent-primary" />
                <Input value={s.text} onChange={(e) => setSuggest(suggest.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} />
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Button onClick={addSuggestions}>Add these steps</Button>
            <Button variant="ghost" onClick={() => setSuggest(null)}>Never mind</Button>
          </div>
        </section>
      )}

      {view === "list" && (
        <section className="paper p-4">
          {pt.map((t) => <TaskItem key={t.id} task={t} subtasks={subs.get(t.id)} />)}
          <div className="mt-2"><QuickAdd defaults={{ project_id: id, area: p.category, position: pt.length }} placeholder="Add a step…" /></div>
        </section>
      )}
      {view === "board" && (
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Not yet", pt.filter((t) => t.status === "todo" && !t.due_date)],
            ["Scheduled", pt.filter((t) => t.status === "todo" && t.due_date)],
            ["Done ♡", pt.filter((t) => t.status === "done")],
          ].map(([label, list]) => (
            <section key={label as string} className="paper p-4">
              <h3 className="mb-2 text-lg text-burgundy">{label as string}</h3>
              {(list as typeof pt).map((t) => <TaskItem key={t.id} task={t} subtasks={subs.get(t.id)} compact />)}
            </section>
          ))}
        </div>
      )}
      {view === "timeline" && (
        <section className="paper p-4">
          {pt.filter((t) => t.due_date).sort((a, b) => a.due_date!.localeCompare(b.due_date!)).map((t) => (
            <div key={t.id} className="flex items-center gap-3 border-l-2 border-dotted border-strawberry pl-3">
              <span className="w-24 shrink-0 text-xs text-muted-foreground">{prettyDate(t.due_date!, { month: "short", day: "numeric" })}</span>
              <div className="flex-1"><TaskItem task={t} compact /></div>
            </div>
          ))}
          {pt.every((t) => !t.due_date) && <p className="text-sm text-muted-foreground">Give steps a day to see them on a timeline.</p>}
        </section>
      )}

      <section className="paper p-4">
        <h3 className="text-lg text-burgundy">Notes</h3>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => notes !== (p.notes ?? "") && save.mutate({ id, name: p.name, notes })} placeholder="Ideas, links, thoughts…" className="mt-2 min-h-28" />
      </section>

      <Button variant="ghost" className="justify-self-start text-destructive" onClick={async () => { if (confirm("Delete this project and its steps?")) { await del.mutateAsync(id); nav({ to: "/projects" }); } }}>
        Delete project
      </Button>
    </div>
  );
}
