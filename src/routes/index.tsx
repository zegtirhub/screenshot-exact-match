import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sparkle } from "@/components/Cherry";
import { useAuth } from "@/lib/auth";
import cherry from "@/assets/cherry-bow.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cherry — a pretty little planner for a beautifully messy brain" },
      { name: "description", content: "Brain dump, cherry picks, gentle focus. A soft, playful planner for your life and your big dreams." },
      { property: "og:title", content: "Cherry — a pretty little planner" },
      { property: "og:description", content: "Big dreams. Busy brain. Little steps." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const features = [
  ["Brain Dump", "Pour out the mess. We'll sort it into little steps together."],
  ["Cherry Picks", "Just three priorities a day. Everything else can wait."],
  ["Focus Room", "One little thing, an optional timer, zero pressure."],
];

function Landing() {
  const { user } = useAuth();
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-8">
      <nav className="flex items-center justify-between">
        <span className="font-display text-2xl font-semibold text-primary">cherry.</span>
        <Button asChild variant="ghost">
          <Link to={user ? "/today" : "/auth"}>{user ? "Open my planner" : "Sign in"}</Link>
        </Button>
      </nav>
      <section className="grid flex-1 items-center gap-10 py-12 md:grid-cols-2">
        <div>
          <span className="sticker">Big dreams · Busy brain · Little steps</span>
          <h1 className="mt-5 text-5xl font-semibold leading-[1.05] text-burgundy md:text-6xl">
            A pretty little planner for a <em className="text-primary">beautifully messy</em> brain.
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted-foreground">
            Organize your everyday life and your big ambitions — gently, one cherry at a time.
          </p>
          <div className="mt-8 flex gap-3">
            <Button asChild size="lg">
              <Link to={user ? "/today" : "/auth"}>Let's get started 🍒</Link>
            </Button>
          </div>
        </div>
        <div className="relative mx-auto">
          <div className="absolute inset-6 rounded-full bg-blush blur-2xl" />
          <img src={cherry} alt="Two cherries tied with a pink bow" width={816} height={816} className="relative w-72 animate-floaty md:w-96" />
          <Sparkle className="absolute left-4 top-10 size-6" />
          <Sparkle className="absolute bottom-12 right-6 size-8" />
        </div>
      </section>
      <section className="grid gap-4 pb-8 md:grid-cols-3">
        {features.map(([t, d]) => (
          <div key={t} className="paper p-5">
            <h3 className="text-xl text-burgundy">{t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
