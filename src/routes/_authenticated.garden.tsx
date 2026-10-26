import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CherryIcon, PageHeader } from "@/components/Cherry";
import { supabase } from "@/integrations/supabase/client";
import { usePrefs, useRewards, useSavePrefs } from "@/lib/api";
import { STICKERS } from "@/lib/stickers";
import { DAILY_CHERRY_CAP } from "@/lib/dates";

export const Route = createFileRoute("/_authenticated/garden")({
  head: () => ({ meta: [{ title: "My Little Garden — CherryMind planner" }, { name: "description", content: "Gentle rewards for showing up." }] }),
  component: Garden,
});

function Garden() {
  const { data: prefs } = usePrefs();
  const { data: rewards = [] } = useRewards();
  const save = useSavePrefs();
  const qc = useQueryClient();
  const owned = new Set(rewards.map((r) => r.item_key));
  const cherries = prefs?.cherries ?? 0;

  async function unlock(key: string, cost: number) {
    if (cherries < cost) return;
    const { error } = await supabase.from("rewards").insert({ item_key: key });
    if (error) { toast.error(error.message); return; }
    await save.mutateAsync({ cherries: cherries - cost });
    qc.invalidateQueries({ queryKey: ["rewards"] });
    toast("A new sticker for your planner ✨");
  }

  return (
    <div>
      <PageHeader title="My Little Garden" subtitle="Cherries for showing up. Never lost, never taken away.">
        <label className="flex items-center gap-2 text-sm">Rewards <Switch checked={prefs?.rewards_enabled ?? true} onCheckedChange={(v) => save.mutate({ rewards_enabled: v })} /></label>
      </PageHeader>
      {!prefs?.rewards_enabled ? (
        <div className="paper p-8 text-center text-muted-foreground">Rewards are off. Your planner works just the same ♡</div>
      ) : (
        <>
          <section className="paper flex items-center gap-4 p-6">
            <CherryIcon className="size-14 animate-floaty" />
            <div>
              <p className="font-display text-4xl text-primary">{cherries}</p>
              <p className="text-sm text-muted-foreground">
                1 cherry per finished task (up to {DAILY_CHERRY_CAP} a day — rest matters too), 2 per focus session.
              </p>
            </div>
          </section>
          <h2 className="mb-3 mt-8 text-2xl text-burgundy">Sticker shop</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {STICKERS.map((s) => {
              const have = owned.has(s.key);
              return (
                <div key={s.key} className={`paper flex flex-col items-center p-4 text-center ${have ? "bg-blush" : ""}`}>
                  <span className="text-5xl">{s.emoji}</span>
                  <p className="mt-2 text-sm font-semibold">{s.name}</p>
                  {have ? (
                    <span className="sticker mt-2">In your planner</span>
                  ) : (
                    <Button size="sm" variant={cherries >= s.cost ? "default" : "outline"} disabled={cherries < s.cost} className="mt-2" onClick={() => unlock(s.key, s.cost)}>
                      {s.cost} 🍒
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Unlocked stickers appear on your Today page.</p>
        </>
      )}
    </div>
  );
}
