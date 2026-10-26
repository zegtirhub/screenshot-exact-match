import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSavePrefs } from "@/lib/api";
import cherry from "@/assets/cherry-bow.png";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Welcome — CherryMind planner" }, { name: "description", content: "Set up your little planner." }] }),
  component: Onboarding,
});

const ORGANIZE = ["My everyday life", "My work or business", "My studies", "My creative projects", "A little bit of everything"];
const STRUGGLES = [
  "I have too many thoughts",
  "I struggle to get started",
  "I underestimate how long things take",
  "I forget things",
  "I get overwhelmed by long lists",
  "I struggle to stay consistent",
];

function Chip({ on, children, onClick }: { on: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`rounded-2xl border px-4 py-3 text-left transition-colors ${on ? "border-primary bg-blush text-burgundy" : "border-border bg-card hover:bg-muted"}`}
    >
      {children}
    </button>
  );
}

function Onboarding() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [org, setOrg] = useState<string[]>([]);
  const [str, setStr] = useState<string[]>([]);
  const [mode, setMode] = useState("cherry");
  const save = useSavePrefs();
  const nav = useNavigate();
  const tog = (arr: string[], set: (a: string[]) => void, v: string) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  async function finish() {
    try {
      await save.mutateAsync({ display_name: name.trim() || null, organizing: org, struggles: str, mode, onboarded: true });
      nav({ to: "/today" });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-5 py-10">
      <div className="mb-6 flex justify-center gap-2">
        {[0, 1, 2, 3].map((i) => <span key={i} className={`h-1.5 w-10 rounded-full ${i <= step ? "bg-primary" : "bg-blush"}`} />)}
      </div>
      <div className="paper p-7">
        {step === 0 && (
          <div className="text-center">
            <img src={cherry} alt="" width={816} height={816} className="mx-auto w-32 animate-floaty" />
            <h1 className="mt-2 text-3xl text-burgundy">Welcome to your little corner of the world 🍒</h1>
            <p className="mt-3 text-muted-foreground">A softer way to organize your life, chase your dreams, and make room for yourself.</p>
            <Input className="mt-6 h-11 rounded-xl text-center" placeholder="What should we call you? (optional)" value={name} onChange={(e) => setName(e.target.value)} />
            <Button size="lg" className="mt-5 w-full" onClick={() => setStep(1)}>Let's get started</Button>
          </div>
        )}
        {step === 1 && (
          <div>
            <h2 className="text-2xl text-burgundy">What are you organizing?</h2>
            <p className="mb-4 text-sm text-muted-foreground">Pick as many as you like.</p>
            <div className="grid gap-2">{ORGANIZE.map((o) => <Chip key={o} on={org.includes(o)} onClick={() => tog(org, setOrg, o)}>{o}</Chip>)}</div>
          </div>
        )}
        {step === 2 && (
          <div>
            <h2 className="text-2xl text-burgundy">What feels tricky sometimes?</h2>
            <p className="mb-4 text-sm text-muted-foreground">Totally optional — it just helps us suggest the right tools.</p>
            <div className="grid gap-2">{STRUGGLES.map((o) => <Chip key={o} on={str.includes(o)} onClick={() => tog(str, setStr, o)}>{o}</Chip>)}</div>
          </div>
        )}
        {step === 3 && (
          <div>
            <h2 className="text-2xl text-burgundy">Your preferred vibe</h2>
            <p className="mb-4 text-sm text-muted-foreground">You can switch anytime in Settings.</p>
            <div className="grid gap-3">
              <Chip on={mode === "cherry"} onClick={() => setMode("cherry")}><b>Cherry Mode 🍒</b><br /><span className="text-sm text-muted-foreground">Full playful aesthetic, stickers & sparkles.</span></Chip>
              <Chip on={mode === "calm"} onClick={() => setMode("calm")}><b>Calm Mode ☁️</b><br /><span className="text-sm text-muted-foreground">Minimal decoration, no motion, extra clarity.</span></Chip>
            </div>
          </div>
        )}
        {step > 0 && (
          <div className="mt-6 flex justify-between">
            <Button variant="ghost" onClick={() => (step === 3 ? finish() : setStep(step + 1))}>Skip</Button>
            <Button onClick={() => (step === 3 ? finish() : setStep(step + 1))} disabled={save.isPending}>{step === 3 ? "Open my Today" : "Next"}</Button>
          </div>
        )}
      </div>
    </main>
  );
}
