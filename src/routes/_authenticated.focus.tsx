import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CherryIcon } from "@/components/Cherry";
import { sortPicks, useLogFocus, useTasks, useToggleTask } from "@/lib/api";
import { breakDown } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/focus")({
  validateSearch: (s: Record<string, unknown>) => ({ task: typeof s["task"] === "string" ? (s["task"] as string) : undefined }),
  head: () => ({ meta: [{ title: "Focus Room — Cherry planner" }, { name: "description", content: "Just one little thing." }] }),
  component: Focus,
});

function Focus() {
  const { task: taskId } = Route.useSearch();
  const nav = useNavigate();
  const { data: tasks = [] } = useTasks();
  const toggle = useToggleTask();
  const logFocus = useLogFocus();
  const brk = useServerFn(breakDown);
  const task = tasks.find((t) => t.id === taskId);
  const nextStep = useMemo(() => tasks.filter((t) => t.parent_id === taskId && t.status === "todo").sort((a, b) => a.position - b.position)[0], [tasks, taskId]);
  const [tiny, setTiny] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [secs, setSecs] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const ref = useRef<number | undefined>(undefined);

  useEffect(() => {
    setTiny(null); setFinished(false); setSecs(null); setRunning(false);
  }, [taskId]);
  useEffect(() => {
    if (!running) return;
    ref.current = window.setInterval(() => setSecs((s) => (s && s > 0 ? s - 1 : 0)), 1000);
    return () => window.clearInterval(ref.current);
  }, [running]);
  useEffect(() => {
    if (secs === 0 && running) {
      setRunning(false);
      toast("Time's up! You showed up for yourself ♡");
      logFocus.mutate({ taskId: taskId ?? null, minutes: Math.round(total / 60) });
    }
  }, [secs, running]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!task) {
    const options = [...sortPicks(tasks), ...tasks.filter((t) => t.status === "todo" && !t.parent_id && !t.is_pick)].slice(0, 12);
    return (
      <div className="mx-auto max-w-xl py-6 text-center">
        <h1 className="text-4xl text-burgundy">Just one little thing.</h1>
        <p className="mt-2 text-muted-foreground">Pick what you'd like to sit with.</p>
        <div className="mt-6 grid gap-2 text-left">
          {options.map((t) => (
            <button key={t.id} onClick={() => nav({ to: "/focus", search: { task: t.id } })} className="paper flex items-center gap-3 px-4 py-3 hover:bg-muted">
              {t.is_pick && <CherryIcon className="size-5" />} {t.title}
            </button>
          ))}
          {options.length === 0 && <p className="text-center text-sm text-muted-foreground">No tasks yet. <Link to="/today" className="text-primary underline">Add one on Today</Link>.</p>}
        </div>
      </div>
    );
  }

  async function makeEasy() {
    setBusy(true);
    try {
      const r = await brk({ data: { title: task!.title, tiny: true } });
      setTiny(r.steps[0] ?? null);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function complete() {
    setRunning(false);
    if (nextStep) {
      await toggle.mutateAsync(nextStep);
      toast("Step done ♡ On to the next one, whenever you're ready.");
      return;
    }
    await toggle.mutateAsync(task!);
    if (total > 0) logFocus.mutate({ taskId: task!.id, minutes: Math.max(1, Math.round((total - (secs ?? 0)) / 60)) });
    setFinished(true);
  }

  const mm = secs !== null ? `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}` : null;

  if (finished)
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <CherryIcon className="mx-auto size-16 animate-pop" />
        <h1 className="mt-4 text-3xl text-burgundy">Look at you, showing up for yourself.</h1>
        <div className="mt-8 grid gap-2">
          <Button onClick={() => nav({ to: "/focus", search: { task: undefined } })}>Choose another task</Button>
          <Button variant="soft" onClick={() => nav({ to: "/today" })}>Take a break ☕</Button>
          <Button variant="ghost" onClick={() => setFinished(false)}>Continue here</Button>
        </div>
      </div>
    );

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center text-center">
      <p className="text-sm uppercase tracking-widest text-muted-foreground">Just one little thing</p>
      <h1 className="mt-3 text-4xl font-semibold text-burgundy">{task.title}</h1>
      <div className="paper mt-6 w-full p-5">
        <span className="sticker">Next step</span>
        <p className="mt-2 text-lg">{tiny ?? nextStep?.title ?? "Start wherever feels easiest."}</p>
        {!tiny && <Button variant="link" onClick={makeEasy} disabled={busy}>{busy ? "Thinking…" : "Let's make this ridiculously easy."}</Button>}
      </div>

      <div className="mt-8">
        {mm ? (
          <p className="font-display text-6xl tabular-nums text-primary">{mm}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Want a timer? Totally optional.</p>
        )}
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {[2, 5, 15, 25].map((m) => (
            <Button key={m} size="sm" variant="outline" onClick={() => { setSecs(m * 60); setTotal(m * 60); setRunning(true); }}>{m} min</Button>
          ))}
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        {secs !== null && secs > 0 && <Button variant="soft" onClick={() => setRunning(!running)}>{running ? "Pause" : "Resume"}</Button>}
        <Button size="lg" onClick={complete}>{nextStep ? "Step done ✓" : "I did it ✓"}</Button>
      </div>
      <Link to="/focus" search={{ task: undefined }} className="mt-6 text-sm text-muted-foreground underline">Choose a different task</Link>
    </div>
  );
}
