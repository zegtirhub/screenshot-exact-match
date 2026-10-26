import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AREAS, useAddTasks, useProjects, useUpdateTask, type Task } from "@/lib/api";

const sel = "h-10 w-full rounded-xl border border-input bg-card px-3 text-sm";

export function TaskDialog({
  open,
  onOpenChange,
  task,
  defaults,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  task?: Task | null;
  defaults?: Partial<Task>;
}) {
  const add = useAddTasks();
  const update = useUpdateTask();
  const { data: projects = [] } = useProjects();
  const [f, setF] = useState<Partial<Task>>({});
  useEffect(() => {
    if (open) setF(task ? { ...task } : { title: "", area: "personal", recurrence: "none", ...defaults });
  }, [open, task, defaults]);
  const set = (k: keyof Task, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  async function save() {
    if (!f.title?.trim()) return toast("Give it a little name first ♡");
    const row = {
      title: f.title.trim(),
      notes: f.notes || null,
      area: f.area ?? "personal",
      project_id: f.project_id || null,
      due_date: f.due_date || null,
      due_time: f.due_time || null,
      recurrence: f.recurrence ?? "none",
      estimate_min: f.estimate_min ? Number(f.estimate_min) : null,
      is_pick: f.is_pick ?? false,
      parent_id: f.parent_id ?? null,
    };
    try {
      if (task) await update.mutateAsync({ id: task.id, ...row });
      else await add.mutateAsync([row]);
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-burgundy">{task ? "Edit task" : "New little task"}</DialogTitle>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <Input autoFocus placeholder="What needs doing?" value={f.title ?? ""} onChange={(e) => set("title", e.target.value)} className="h-11 rounded-xl" />
          <details className="group rounded-xl border border-dashed border-border p-3">
            <summary className="cursor-pointer text-sm text-muted-foreground">More details (all optional)</summary>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Notes</Label>
                <Textarea value={f.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
              </div>
              <div>
                <Label>Life area</Label>
                <select className={sel} value={f.area ?? "personal"} onChange={(e) => set("area", e.target.value)}>
                  {AREAS.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
                </select>
              </div>
              <div>
                <Label>Project</Label>
                <select className={sel} value={f.project_id ?? ""} onChange={(e) => set("project_id", e.target.value)}>
                  <option value="">None</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <Label>Day</Label>
                <Input type="date" value={f.due_date ?? ""} onChange={(e) => set("due_date", e.target.value)} />
              </div>
              <div>
                <Label>Time</Label>
                <Input type="time" value={f.due_time?.slice(0, 5) ?? ""} onChange={(e) => set("due_time", e.target.value)} />
              </div>
              <div>
                <Label>Repeats</Label>
                <select className={sel} value={f.recurrence ?? "none"} onChange={(e) => set("recurrence", e.target.value)}>
                  <option value="none">Doesn't repeat</option>
                  <option value="daily">Every day</option>
                  <option value="weekdays">Weekdays</option>
                  <option value="weekly">Every week</option>
                  <option value="monthly">Every month</option>
                </select>
              </div>
              <div>
                <Label>Guess (minutes)</Label>
                <Input type="number" min={1} value={f.estimate_min ?? ""} onChange={(e) => set("estimate_min", e.target.value)} />
              </div>
            </div>
          </details>
          <DialogFooter>
            <Button type="submit" disabled={add.isPending || update.isPending}>Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
