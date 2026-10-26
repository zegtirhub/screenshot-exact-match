import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { CherryIcon, CherryCheck, Sparkle } from "@/components/Cherry";
import { useAuth } from "@/lib/auth";
import cherry from "@/assets/cherry-bow.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CherryMind — the planner for brains with 47 tabs open" },
      { name: "description", content: "Brain dump the chaos, pick three things, take tiny steps toward big dreams. A soft, playful planner that never shames you." },
      { property: "og:title", content: "CherryMind — big dreams, busy brain, little steps" },
      { property: "og:description", content: "The planner for brains with 47 tabs open. No guilt, no streaks — just tiny wins." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const relatable = [
  "You wrote a to-do list… then lost the to-do list.",
  "You have 4 planners. All of them stop in February.",
  "“Just start” is not advice. It's a riddle.",
  "Your brain at 2am: here are 31 ideas. Enjoy.",
  "You did a lot today. It just wasn't on the list.",
  "Big dreams. Zero idea where step one is.",
];

const steps = [
  { n: "01", t: "Dump it", d: "Type every messy thought. AI sorts it into tasks you can tweak — or sort it yourself." },
  { n: "02", t: "Pick three", d: "Three Cherry Picks a day. Everything else stays tucked away, out of sight." },
  { n: "03", t: "Make it tiny", d: "Stuck? Break any task into ridiculously small steps, then hop into the Focus Room." },
];

const promises = [
  ["No guilt streaks", "Miss a day? Nothing breaks. Every morning is a fresh page."],
  ["Energy-aware", "Tell us how your brain feels. Low day? We'll help you lighten it."],
  ["Dreams, not just chores", "Turn “someday” goals into projects with real, doable next steps."],
  ["Calm Mode", "Too much sparkle? Switch off every decoration and animation in a tap."],
];

function Landing() {
  const { user } = useAuth();
  const cta = user ? "/today" : "/auth";
  return (
    <main className="overflow-hidden">
      <div className="mx-auto max-w-6xl px-6">
        <nav className="flex items-center justify-between py-6">
          <span className="flex items-center gap-1.5 font-display text-2xl font-semibold text-primary">
            <CherryIcon className="size-7" /> cherry.
          </span>
          <Button asChild variant="ghost">
            <Link to={cta}>{user ? "Open my planner" : "Sign in"}</Link>
          </Button>
        </nav>

        {/* Hero */}
        <section className="grid items-center gap-10 py-10 md:grid-cols-[1.2fr_1fr] md:py-16">
          <div>
            <span className="sticker">For brains with 47 tabs open</span>
            <h1 className="mt-6 text-5xl font-semibold leading-[1.02] tracking-tight text-burgundy md:text-7xl">
              Your brain isn't broken. <em className="text-primary">Your planner was.</em>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground md:text-xl">
              CherryMind turns the chaos in your head into three tiny wins a day — so you can chase big dreams without burning out.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button asChild size="lg" className="h-14 px-8 text-base shadow-lg">
                <Link to={cta}>Start my fresh page 🍒</Link>
              </Button>
              <span className="text-sm text-muted-foreground">Free · no streaks to lose</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute inset-8 rounded-full bg-blush blur-3xl" />
            <img src={cherry} alt="Two cherries tied with a pink bow" width={816} height={816} className="relative mx-auto w-60 animate-floaty md:w-72" />
            <div className="paper relative -mt-10 rotate-[-2deg] p-5 shadow-xl">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Today's Cherry Picks</p>
              {[["Email the landlord", true], ["10 min on my portfolio", true], ["Drink water like a plant", false]].map(([t, c]) => (
                <div key={t as string} className="mt-3 flex items-center gap-3">
                  <CherryCheck checked={c as boolean} />
                  <span className={c ? "text-muted-foreground line-through" : ""}>{t as string}</span>
                </div>
              ))}
              <p className="mt-4 font-display italic text-primary">2 little wins. Look at you! ♡</p>
            </div>
            <Sparkle className="absolute left-2 top-6 size-6" />
            <Sparkle className="absolute right-0 top-24 size-8" />
          </div>
        </section>
      </div>

      {/* Relatable */}
      <section className="bg-burgundy py-16 text-primary-foreground">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-3xl font-semibold md:text-5xl">If this is you… <em className="text-strawberry">hi, friend.</em></h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {relatable.map((r, i) => (
              <p key={r} className={`rounded-3xl border border-primary-foreground/20 bg-primary-foreground/5 p-6 font-display text-xl leading-snug ${i % 2 ? "md:rotate-1" : "md:-rotate-1"}`}>
                {r}
              </p>
            ))}
          </div>
          <p className="mt-10 max-w-2xl text-lg text-primary-foreground/80">
            None of that means you're lazy. It means you need a planner that works <em>with</em> your brain, not against it.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6">
        {/* How */}
        <section className="py-20">
          <h2 className="text-center text-3xl font-semibold text-burgundy md:text-5xl">From mess to momentum in three moves</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="paper p-7">
                <span className="font-display text-5xl text-strawberry">{s.n}</span>
                <h3 className="mt-3 text-2xl text-burgundy">{s.t}</h3>
                <p className="mt-2 text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Promises */}
        <section className="grid gap-10 pb-20 md:grid-cols-[1fr_1.4fr] md:items-center">
          <div>
            <span className="sticker">Our promise</span>
            <h2 className="mt-4 text-3xl font-semibold text-burgundy md:text-5xl">Soft on you. <em className="text-primary">Serious about your dreams.</em></h2>
            <p className="mt-4 text-muted-foreground">Cute on the outside, built to actually get you moving. Collect cherries for showing up — they're never taken away.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {promises.map(([t, d]) => (
              <div key={t} className="rounded-3xl bg-powder p-6">
                <h3 className="flex items-center gap-2 text-xl text-burgundy"><Sparkle className="size-4" /> {t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="paper scallop mb-16 p-10 text-center md:p-16">
          <CherryIcon className="mx-auto size-12 animate-floaty" />
          <h2 className="mt-4 text-4xl font-semibold text-burgundy md:text-6xl">You were never too much.</h2>
          <p className="mx-auto mt-4 max-w-md text-lg text-muted-foreground">Your next step can be tiny. Let's find it together.</p>
          <Button asChild size="lg" className="mt-8 h-14 px-10 text-base shadow-lg">
            <Link to={cta}>Let's get started 🍒</Link>
          </Button>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-2 pb-10 text-sm text-muted-foreground">
          <span className="font-display text-lg text-primary">cherrymind./span>
          <span>Big dreams · Busy brain · Little steps</span>
        </footer>
      </div>
    </main>
  );
}
