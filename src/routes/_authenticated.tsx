import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sun, Brain, CalendarHeart, FolderHeart, Timer, Flower2, Settings, MoreHorizontal, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { usePrefs } from "@/lib/api";
import { CherryIcon } from "@/components/Cherry";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: Layout,
});

const NAV = [
  { to: "/today", label: "Today", icon: Sun },
  { to: "/brain-dump", label: "Brain Dump", icon: Brain },
  { to: "/planner", label: "My Planner", icon: CalendarHeart },
  { to: "/projects", label: "Projects", icon: FolderHeart },
  { to: "/focus", label: "Focus Room", icon: Timer },
  { to: "/garden", label: "My Little Garden", icon: Flower2 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function Layout() {
  const { user, loading } = useAuth();
  const { data: prefs, isLoading } = usePrefs();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [loading, user, nav]);
  useEffect(() => {
    if (user && !isLoading && !prefs?.onboarded && pathname !== "/onboarding") nav({ to: "/onboarding" });
  }, [user, isLoading, prefs, pathname, nav]);
  useEffect(() => {
    document.documentElement.classList.toggle("calm", prefs?.mode === "calm");
  }, [prefs?.mode]);

  if (loading || !user || isLoading)
    return (
      <div className="grid min-h-screen place-items-center">
        <CherryIcon className="size-12 animate-floaty" />
      </div>
    );
  if (pathname === "/onboarding") return <Outlet />;

  return (
    <div className="flex min-h-screen">
      <aside className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-3 md:flex ${collapsed ? "w-[68px]" : "w-60"}`}>
        <div className="mb-6 flex items-center justify-between px-2 pt-2">
          {!collapsed && <span className="font-display text-2xl font-semibold text-primary">cherrymind.</span>}
          <button onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar" className="rounded-full p-2 text-muted-foreground hover:bg-sidebar-accent">
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </button>
        </div>
        <nav className="grid gap-1">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent"
              activeProps={{ className: "bg-primary !text-primary-foreground hover:!bg-primary" }}
              title={n.label}
            >
              <n.icon className="size-5 shrink-0" />
              {!collapsed && n.label}
            </Link>
          ))}
        </nav>
        {!collapsed && (
          <p className="mt-auto px-3 pb-2 font-display text-sm italic text-muted-foreground">Big dreams. Busy brain. Little steps.</p>
        )}
      </aside>

      <main className="min-w-0 flex-1 px-4 pb-28 pt-6 md:px-10 md:pb-10">
        <div className="mx-auto max-w-5xl">
          <Outlet />
        </div>
      </main>

      <nav className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-full border border-border bg-card/95 px-2 py-1.5 shadow-lg backdrop-blur md:hidden">
        {NAV.slice(0, 4).map((n) => (
          <Link key={n.to} to={n.to} className="flex flex-col items-center gap-0.5 rounded-full px-3 py-1.5 text-[11px] text-muted-foreground" activeProps={{ className: "!text-primary font-semibold" }}>
            <n.icon className="size-5" />
            {n.label.split(" ").pop()}
          </Link>
        ))}
        <Sheet>
          <SheetTrigger className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-[11px] text-muted-foreground">
            <MoreHorizontal className="size-5" />
            More
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl">
            <SheetTitle className="font-display text-burgundy">More</SheetTitle>
            <div className="mt-4 grid gap-1 pb-4">
              {NAV.slice(4).map((n) => (
                <Link key={n.to} to={n.to} className="flex items-center gap-3 rounded-2xl px-3 py-3 hover:bg-muted">
                  <n.icon className="size-5 text-primary" /> {n.label}
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}
