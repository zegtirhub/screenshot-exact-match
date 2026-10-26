import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/Cherry";
import { AREAS, areaDot, useProjects, useSaveProject, useTasks } from "@/lib/api";
import { prettyDate } from "@/lib/dates";

export const Route = createFileRoute("/_authenticated/projects/")({
  head: () => ({ meta: [{ title: "Projects — CherryMind planner" }, { name: "description", content: "Big dreams, little steps." }] }),
  component: Projects,
});

const IDEAS = ["Launch my business", "Finish my thesis", "Redecorate my apartment", "Build my portfolio", "Plan my vacation"];

function Projects() {
  const { data: projects = [] } = useProjects();
  const { data: tasks = [] } = useTasks();
  const [open, setOpen] = useState(false);
  return (
    <div>
      <PageHeader title="Projects" subtitle="For big dreams. One little step at a time.">
        <Button onClick={() => setOpen(true)}>+ New project</Button>
      </PageHeader>
      {projects.length === 0 && (
        <div className="paper p-8 text-center">
          <p className="font-display text-xl text-burgundy">Your dreams are big. Your next step can be tiny.</p>
          <p className="mt-1 text-sm text-muted-foreground">Start a project to give a big goal a home.</p>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => {
          const pt = tasks.filter((t) => t.project_id === p.id);
          const done = pt.filter((t) => t.status === "done").length;
          const pct = pt.length ? Math.round((done / pt.length) * 100) : 0;
          return (
            <Link key={p.id} to="/projects/$id" params={{ id: p.id }} className="paper block p-5 transition-transform hover:-translate-y-0.5">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                <span className={`size-2 rounded-full ${areaDot[p.category]}`} /> {p.category}
                {p.deadline && <span className="ml-auto normal-case">by {prettyDate(p.deadline, { month: "short", day: "numeric" })}</span>}
              </div>
              <h3 className="mt-2 text-xl text-burgundy">{p.name}</h3>
              {p.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>}
              <Progress value={pct} className="mt-4 h-2 bg-blush" />
              <p className="mt-1 text-xs text-muted-foreground">{done}/{pt.length} steps · {pct}%</p>
            </Link>
          );
        })}
      </div>
      <NewProject open={open} onOpenChange={setOpen} />
    </div>
  );
}

function NewProject({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const save = useSaveProject();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [description, setDesc] = useState("");
  const [category, setCat] = useState("personal");
  const [deadline, setDeadline] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const p = await save.mutateAsync({ name: name.trim(), description: description || null, category, deadline: deadline || null });
      onOpenChange(false);
      setName(""); setDesc(""); setDeadline("");
      nav({ to: "/projects/$id", params: { id: p.id } });
    } catch (err) {
      toast.error((err as Error).message);
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl">
        <DialogHeader><DialogTitle className="font-display text-2xl text-burgundy">A new big dream</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid gap-3">
          <Input autoFocus placeholder="Name it" value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-xl" />
          <div className="flex flex-wrap gap-1">{IDEAS.map((i) => <button type="button" key={i} onClick={() => setName(i)} className="sticker">{i}</button>)}</div>
          <Textarea placeholder="What's it about? (optional)" value={description} onChange={(e) => setDesc(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <select value={category} onChange={(e) => setCat(e.target.value)} className="h-10 rounded-xl border bg-card px-3 text-sm">
              {AREAS.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
            </select>
            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} aria-label="Optional deadline" />
          </div>
          <Button type="submit" disabled={save.isPending}>Create project</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
