import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowUp, ArrowDown, Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CherryIcon, Sparkle } from "@/components/Cherry";
import { TaskItem, QuickAdd, groupSubtasks } from "@/components/TaskItem";
import { AREAS, sortPicks, useCheckIn, usePrefs, useRewards, useSetCheckIn, useTasks, useUpdateTask } from "@/lib/api";
import { addDays, prettyDate, todayStr } from "@/lib/dates";
import { STICKERS } from "@/lib/stickers";

export const Route = createFileRoute("/_authenticated/today")({
  head: () => ({ meta: [{ title: "Today — Cherry planner" }, { name: "description", content: "Your gentle daily plan." }] }),
  component: Today,
});

const MESSAGES = [
  "You don't have to do everything today.",
  "Your dreams are big. Your next step can be tiny.",
  "Small steps count, too.",
  "Rest is allowed.",
  "One thing at a time, cherry.",
];

const ENERGY = [
  { key: "low", label: "Low energy ☁️", tip: "Let's keep it soft today. Maybe just one Cherry Pick — and that's plenty." },
  { key: "mid", label: "Somewhere in between 🌷", tip: "A steady day. Start with the smallest pick to warm up." },
  { key: "high", label: "Ready to go ✨", tip: "Lovely! Tackle your biggest pick first while the energy's here." },
];

const TIPS: Record<string, string> = {
  "I have too many thoughts": "Your brain has a lot of tabs open. Try a Brain Dump to close a few.",
  "I struggle to get started": "Stuck? Open the Focus Room and let's make it ridiculously easy.",
  "I underestimate how long things take": "Add a guess in minutes to a task — it helps you see your day honestly.",
  "I get overwhelmed by long lists": "We keep 'Everything else' tucked away. Just look at your three picks.",
  "I forget things": "Capture it the second you think of it — the + box is always here.",
  "I struggle to stay consistent": "No streaks to lose here. Every day is a fresh page.",
};

function Today() {
  const today = todayStr();
  const { data: prefs } = usePrefs();
  const { data: tasks = [] } = useTasks();
  const { data: rewards = [] } = useRewards();
  const { data: checkin } = useCheckIn(today);
  const setCheck = useSetCheckIn();
  const update = useUpdateTask();
  const [area, setArea] = useState("all");

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const msg = MESSAGES[new Date().getDate() % MESSAGES.length];
  const tip = prefs?.struggles?.map((s) => TIPS[s]).filter(Boolean)[0];

  const filtered = useMemo(() => tasks.filter((t) => area === "all" || t.area === area), [tasks, area]);
  const subs = useMemo(() => groupSubtasks(tasks), [tasks]);
  const picks = sortPicks(filtered).slice(0, 3);
  const rest = filtered.filter((t) => !t.parent_id && t.status === "todo" && !picks.includes(t) && t.due_date && t.due_date <= today);
  const overdue = tasks.filter((t) => t.status === "todo" && t.due_date && t.due_date < today && !t.parent_id).length;
  const wins = tasks.filter((t) => t.status === "done" && t.completed_at && new Date(t.completed_at).toDateString() === new Date().toDateString()).length;
  const energy = ENERGY.find((e) => e.key === checkin?.energy);
  const myStickers = STICKERS.filter((s) => rewards.some((r) => r.item_key === s.key));

  function move(i: number, dir: -1 | 1) {
    const a = picks[i], b = picks[i + dir];
    if (!a || !b) return;
    update.mutate({ id: a.id, position: i + dir });
    update.mutate({ id: b.id, position: i });
  }

  function lightenDay() {
    const extra = rest.filter((t) => t.due_date === today);
    if (!extra.length) return toast("Your day is already light ♡");
    if (!confirm(`Move ${extra.length} non-pick task(s) to tomorrow?`)) return;
    extra.forEach((t) => update.mutate({ id: t.id, due_date: addDays(today, 1) }));
    toast("Moved to tomorrow. Rest is allowed.");
  }

  return (
    <div className="grid gap-6">
      <header className="paper scallop relative overflow-visible p-6 md:p-8">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">{prettyDate(today)}</p>
        <h1 className="mt-1 flex items-center gap-2 text-3xl font-semibold text-burgundy md:text-4xl">
          {greet}, {prefs?.display_name || "lovely"} <CherryIcon className="size-8 deco animate-floaty" />
        </h1>
        <p className="mt-2 font-display text-lg italic text-primary">{msg}</p>
        {myStickers.length > 0 && (
          <div className="deco absolute right-5 top-4 flex gap-1 text-2xl">{myStickers.slice(-4).map((s) => <span key={s.key} title={s.name}>{s.emoji}</span>)}</div>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="grid content-start gap-6">
          <div className="flex flex-wrap gap-2">
            {[{ key: "all", label: "All" }, ...AREAS].map((a) => (
              <button key={a.key} onClick={() => setArea(a.key)} className={`rounded-full px-4 py-1.5 text-sm font-medium ${area === a.key ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"}`}>
                {a.label}
              </button>
            ))}
          </div>

          <section className="paper p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-2xl text-burgundy">Today's Cherry Picks <Sparkle /></h2>
              <span className="sticker">{picks.length}/3</span>
            </div>
            {picks.length === 0 && <p className="py-3 text-sm text-muted-foreground">What are the three things that would make today feel good?</p>}
            {picks.map((t, i) => (
              <div key={t.id} className="flex items-center gap-1">
                <span className="w-5 font-display text-lg text-strawberry">{i + 1}</span>
                <div className="flex-1"><TaskItem task={t} subtasks={subs.get(t.id)} /></div>
                <div className="flex flex-col">
                  <button aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)} className="text-muted-foreground disabled:opacity-20"><ArrowUp className="size-3.5" /></button>
                  <button aria-label="Move down" disabled={i === picks.length - 1} onClick={() => move(i, 1)} className="text-muted-foreground disabled:opacity-20"><ArrowDown className="size-3.5" /></button>
                </div>
              </div>
            ))}
            <div className="mt-3">
              <QuickAdd disabled={picks.length >= 3} placeholder={picks.length >= 3 ? "Three is perfect. ♡" : "Add a Cherry Pick…"} defaults={{ is_pick: true, due_date: today, position: picks.length, area: area === "all" ? "personal" : area }} />
            </div>
          </section>

          <Collapsible className="paper p-5">
            <CollapsibleTrigger className="flex w-full items-center justify-between text-left">
              <h2 className="text-xl text-burgundy">Everything else</h2>
              <span className="text-sm text-muted-foreground">{rest.length} tucked away · show</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              {rest.map((t) => <TaskItem key={t.id} task={t} subtasks={subs.get(t.id)} />)}
              <div className="mt-2"><QuickAdd defaults={{ due_date: today, area: area === "all" ? "personal" : area }} /></div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <aside className="grid content-start gap-4">
          <Button asChild size="lg" className="h-14 text-base shadow-lg">
            <Link to="/brain-dump">+ Get it out of my head</Link>
          </Button>

          <section className="paper p-5">
            <h3 className="text-lg text-burgundy">How's your brain feeling today?</h3>
            <div className="mt-3 grid gap-2">
              {ENERGY.map((e) => (
                <button key={e.key} onClick={() => setCheck.mutate({ day: today, energy: e.key })} className={`rounded-2xl border px-3 py-2 text-left text-sm ${checkin?.energy === e.key ? "border-primary bg-blush" : "border-border hover:bg-muted"}`}>
                  {e.label}
                </button>
              ))}
            </div>
            {energy && (
              <div className="mt-3 rounded-2xl bg-powder p-3 text-sm">
                {energy.tip}
                {energy.key === "low" && <Button size="sm" variant="soft" className="mt-2" onClick={lightenDay}>Lighten my day</Button>}
              </div>
            )}
          </section>

          <section className="paper p-5 text-center">
            <Heart className="mx-auto size-6 fill-strawberry text-strawberry" />
            <p className="mt-2 font-display text-lg text-burgundy">
              {wins === 0 ? "Your first little win is waiting." : `${wins} little win${wins > 1 ? "s" : ""} today. Look at you! ♡`}
            </p>
          </section>

          {overdue > 0 && (
            <Button asChild variant="soft"><Link to="/fresh-start">Need a fresh start? ♡</Link></Button>
          )}
          {tip && <p className="rounded-2xl border border-dashed border-strawberry p-4 text-sm text-muted-foreground">💡 {tip}</p>}
        </aside>
      </div>
    </div>
  );
}
