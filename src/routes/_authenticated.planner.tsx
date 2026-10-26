import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/Cherry";
import { TaskItem, QuickAdd, groupSubtasks } from "@/components/TaskItem";
import { areaDot, useTasks, useUpdateTask, type Task } from "@/lib/api";
import { addDays, parseDay, prettyDate, startOfWeek, toDay, todayStr } from "@/lib/dates";

export const Route = createFileRoute("/_authenticated/planner")({
  head: () => ({ meta: [{ title: "My Planner — CherryMind planner" }, { name: "description", content: "Your week, softly laid out." }] }),
  component: Planner,
});

function DropZone({ day, children, className = "" }: { day: string | null; children: React.ReactNode; className?: string }) {
  const update = useUpdateTask();
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        setOver(false);
        const id = e.dataTransfer.getData("text/task");
        if (id) update.mutate({ id, due_date: day, is_pick: false });
      }}
      className={`${className} ${over ? "ring-2 ring-primary" : ""}`}
    >
      {children}
    </div>
  );
}

function Planner() {
  const today = todayStr();
  const [view, setView] = useState<"day" | "week" | "month">("week");
  const [anchor, setAnchor] = useState(today);
  const { data: tasks = [] } = useTasks();
  const subs = useMemo(() => groupSubtasks(tasks), [tasks]);
  const top = tasks.filter((t) => !t.parent_id);
  const byDay = (d: string) => top.filter((t) => t.due_date === d).sort((a, b) => (a.due_time ?? "99").localeCompare(b.due_time ?? "99"));
  const anytime = top.filter((t) => !t.due_date && t.status === "todo" && !t.project_id);

  const weekStart = startOfWeek(anchor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const step = view === "day" ? 1 : view === "week" ? 7 : 0;
  const shift = (dir: number) => {
    if (view === "month") {
      const d = parseDay(anchor);
      setAnchor(toDay(new Date(d.getFullYear(), d.getMonth() + dir, 1)));
    } else setAnchor(addDays(anchor, dir * step));
  };

  const title =
    view === "day" ? prettyDate(anchor) : view === "week" ? `Week of ${prettyDate(weekStart, { month: "long", day: "numeric" })}` : parseDay(anchor).toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <div>
      <PageHeader title="My Planner" subtitle="Drag tasks between days. Nothing needs a deadline.">
        <div className="flex rounded-full bg-secondary p-1">
          {(["day", "week", "month"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className={`rounded-full px-4 py-1.5 text-sm capitalize ${view === v ? "bg-card font-semibold text-primary shadow" : "text-secondary-foreground"}`}>{v}</button>
          ))}
        </div>
      </PageHeader>

      <div className="mb-4 flex items-center gap-2">
        <Button size="icon" variant="outline" onClick={() => shift(-1)} aria-label="Previous"><ChevronLeft /></Button>
        <Button size="icon" variant="outline" onClick={() => shift(1)} aria-label="Next"><ChevronRight /></Button>
        <Button variant="ghost" size="sm" onClick={() => setAnchor(today)}>Today</Button>
        <h2 className="ml-2 text-xl text-burgundy">{title}</h2>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_260px]">
        {view === "day" && <DayCol day={anchor} tasks={byDay(anchor)} subs={subs} big />}
        {view === "week" && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
            {days.map((d) => <DayCol key={d} day={d} tasks={byDay(d)} subs={subs} />)}
          </div>
        )}
        {view === "month" && <Month anchor={anchor} tasks={top} onPick={(d) => { setAnchor(d); setView("day"); }} />}

        <DropZone day={null} className="paper h-fit p-4">
          <h3 className="text-lg text-burgundy">Anytime ☁️</h3>
          <p className="mb-2 text-xs text-muted-foreground">No date, no pressure.</p>
          {anytime.map((t) => <TaskItem key={t.id} task={t} subtasks={subs.get(t.id)} draggable compact />)}
          <div className="mt-2"><QuickAdd placeholder="Someday…" /></div>
        </DropZone>
      </div>
    </div>
  );
}

function DayCol({ day, tasks, subs, big }: { day: string; tasks: Task[]; subs: Map<string, Task[]>; big?: boolean }) {
  const isToday = day === todayStr();
  return (
    <DropZone day={day} className={`paper min-h-40 p-3 ${isToday ? "border-primary" : ""}`}>
      <div className="dotted-line mb-2 flex items-baseline justify-between pb-1">
        <span className="font-display text-lg text-burgundy">{prettyDate(day, { weekday: big ? "long" : "short" })}</span>
        <span className={`grid size-7 place-items-center rounded-full text-sm ${isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{parseDay(day).getDate()}</span>
      </div>
      {tasks.map((t) => <TaskItem key={t.id} task={t} subtasks={subs.get(t.id)} draggable compact={!big} />)}
      <div className="mt-1"><QuickAdd placeholder="+ add" defaults={{ due_date: day }} /></div>
    </DropZone>
  );
}

function Month({ anchor, tasks, onPick }: { anchor: string; tasks: Task[]; onPick: (d: string) => void }) {
  const a = parseDay(anchor);
  const first = toDay(new Date(a.getFullYear(), a.getMonth(), 1));
  const start = startOfWeek(first);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  return (
    <div className="paper grid grid-cols-7 gap-1 p-3">
      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="pb-1 text-center text-xs text-muted-foreground">{d}</div>)}
      {cells.map((d) => {
        const dt = tasks.filter((t) => t.due_date === d);
        const inMonth = parseDay(d).getMonth() === a.getMonth();
        return (
          <button key={d} onClick={() => onPick(d)} className={`min-h-16 rounded-xl p-1.5 text-left hover:bg-muted ${inMonth ? "" : "opacity-40"} ${d === todayStr() ? "bg-blush" : ""}`}>
            <span className="text-xs font-semibold">{parseDay(d).getDate()}</span>
            <div className="mt-1 flex flex-wrap gap-0.5">
              {dt.slice(0, 6).map((t) => <span key={t.id} className={`size-1.5 rounded-full ${t.status === "done" ? "bg-muted-foreground/40" : areaDot[t.area]}`} />)}
            </div>
          </button>
        );
      })}
    </div>
  );
}
