import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { MoreHorizontal, ChevronDown, ChevronRight, Repeat, Clock } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CherryCheck } from "./Cherry";
import { TaskDialog } from "./TaskDialog";
import { areaDot, useAddTasks, useDeleteTask, useToggleTask, useUpdateTask, type Task } from "@/lib/api";
import { addDays, todayStr } from "@/lib/dates";
import { breakDown } from "@/lib/ai.functions";

export function TaskItem({
  task,
  subtasks = [],
  extraActions,
  draggable,
  compact,
}: {
  task: Task;
  subtasks?: Task[];
  extraActions?: React.ReactNode;
  draggable?: boolean;
  compact?: boolean;
}) {
  const toggle = useToggleTask();
  const update = useUpdateTask();
  const del = useDeleteTask();
  const add = useAddTasks();
  const brk = useServerFn(breakDown);
  const [edit, setEdit] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const done = task.status === "done";

  async function onToggle() {
    const earned = await toggle.mutateAsync(task).catch((e) => {
      toast.error(e.message);
      return 0;
    });
    if (earned) toast(`+${earned} cherry 🍒`, { description: "Small steps count, too." });
  }

  async function breakIt() {
    setBusy(true);
    try {
      const r = await brk({ data: { title: task.title, context: task.notes ?? "" } });
      await add.mutateAsync(r.steps.map((s, i) => ({ title: s, parent_id: task.id, area: task.area, project_id: task.project_id, position: i })));
      setOpen(true);
      toast(r.message);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="group"
      draggable={draggable}
      onDragStart={(e) => e.dataTransfer.setData("text/task", task.id)}
    >
      <div className={`flex items-center gap-3 rounded-2xl px-2 ${compact ? "py-1.5" : "py-2.5"} hover:bg-muted`}>
        <button onClick={onToggle} aria-label={done ? "Mark as not done" : "Mark as done"} className="rounded-full focus-visible:ring-2 focus-visible:ring-ring">
          <CherryCheck checked={done} />
        </button>
        {subtasks.length > 0 ? (
          <button onClick={() => setOpen(!open)} aria-label="Show steps" className="text-muted-foreground">
            {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </button>
        ) : null}
        <button onClick={() => setEdit(true)} className="min-w-0 flex-1 text-left">
          <span className={`block truncate ${done ? "text-muted-foreground line-through" : ""} ${compact ? "text-sm" : ""}`}>{task.title}</span>
          {!compact && (task.due_time || task.recurrence !== "none" || task.estimate_min || subtasks.length > 0) && (
            <span className="mt-0.5 flex gap-3 text-xs text-muted-foreground">
              {task.due_time && <span className="flex items-center gap-1"><Clock className="size-3" />{task.due_time.slice(0, 5)}</span>}
              {task.recurrence !== "none" && <span className="flex items-center gap-1"><Repeat className="size-3" />{task.recurrence}</span>}
              {task.estimate_min && <span>~{task.estimate_min} min (guess)</span>}
              {subtasks.length > 0 && <span>{subtasks.filter((s) => s.status === "done").length}/{subtasks.length} steps</span>}
            </span>
          )}
        </button>
        <span className={`size-2.5 shrink-0 rounded-full ${areaDot[task.area] ?? "bg-muted"}`} title={task.area} />
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full p-1.5 text-muted-foreground hover:bg-accent" aria-label="Task options">
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-2xl">
            <DropdownMenuItem onClick={() => setEdit(true)}>Edit</DropdownMenuItem>
            {!task.parent_id && (
              <DropdownMenuItem onClick={() => update.mutate({ id: task.id, is_pick: !task.is_pick, due_date: task.is_pick ? task.due_date : todayStr() })}>
                {task.is_pick ? "Remove from Cherry Picks" : "Make it a Cherry Pick 🍒"}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => update.mutate({ id: task.id, due_date: addDays(todayStr(), 1), is_pick: false })}>Move to tomorrow</DropdownMenuItem>
            <DropdownMenuItem onClick={() => update.mutate({ id: task.id, due_date: null, is_pick: false })}>Move to Anytime</DropdownMenuItem>
            {!task.parent_id && (
              <DropdownMenuItem disabled={busy} onClick={breakIt}>{busy ? "Thinking…" : "Break into smaller steps"}</DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Link to="/focus" search={{ task: task.id }}>Focus on this</Link>
            </DropdownMenuItem>
            {extraActions}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => update.mutate({ id: task.id, status: "archived" })}>Archive</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => del.mutate(task.id)}>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {open && subtasks.length > 0 && (
        <div className="ml-9 border-l-2 border-dotted border-strawberry pl-2">
          {subtasks.map((s) => <TaskItem key={s.id} task={s} compact />)}
        </div>
      )}
      <TaskDialog open={edit} onOpenChange={setEdit} task={task} />
    </div>
  );
}

export function QuickAdd({ defaults, placeholder = "Add a little task…", disabled }: { defaults?: Partial<Task>; placeholder?: string; disabled?: boolean }) {
  const add = useAddTasks();
  const [v, setV] = useState("");
  return (
    <form
      className="flex items-center gap-2 rounded-2xl border border-dashed border-strawberry bg-powder px-3 py-1.5"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!v.trim()) return;
        try {
          await add.mutateAsync([{ title: v.trim(), area: "personal", ...defaults }]);
          setV("");
        } catch (err) {
          toast.error((err as Error).message);
        }
      }}
    >
      <span className="text-primary">+</span>
      <input disabled={disabled} value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder} className="h-9 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50" />
    </form>
  );
}

export function groupSubtasks(tasks: Task[]) {
  const subs = new Map<string, Task[]>();
  for (const t of tasks) if (t.parent_id) subs.set(t.parent_id, [...(subs.get(t.parent_id) ?? []), t]);
  return subs;
}
