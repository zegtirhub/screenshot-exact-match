import { createFileRoute } from "@tanstack/react-router";
import { buildQuoteCard } from "@/lib/quotes";

/** Private daily-quote card, addressed by a per-user secret token.
 *  The token itself is the caller verification — the handler never returns
 *  any account details, only the rendered quote card. */
export const Route = createFileRoute("/api/public/quote/$token")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const token = String(params.token ?? "");
        if (!/^[a-f0-9]{16,64}$/.test(token)) return new Response("Not found", { status: 404 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: prefs } = await supabaseAdmin
          .from("preferences")
          .select("user_id, display_name")
          .eq("widget_token", token)
          .maybeSingle();
        if (!prefs) return new Response("Not found", { status: 404 });
        const today = new Date().toISOString().slice(0, 10);
        const [tasks, checkin] = await Promise.all([
          supabaseAdmin
            .from("tasks")
            .select("status, completed_at, due_date, parent_id")
            .eq("user_id", prefs.user_id)
            .neq("status", "archived"),
          supabaseAdmin.from("check_ins").select("energy").eq("user_id", prefs.user_id).eq("day", today).maybeSingle(),
        ]);
        const wins = (tasks.data ?? []).filter(
          (t) => t.status === "done" && t.completed_at && t.completed_at.slice(0, 10) === today,
        ).length;
        const overdue = (tasks.data ?? []).filter(
          (t) => t.status === "todo" && !t.parent_id && t.due_date && t.due_date < today,
        ).length;
        const svg = buildQuoteCard({
          day: today,
          name: prefs.display_name ?? null,
          energy: checkin.data?.energy ?? null,
          wins,
          overdue,
        });
        return new Response(svg, {
          headers: {
            "Content-Type": "image/svg+xml; charset=utf-8",
            "Cache-Control": "public, max-age=300",
            "Access-Control-Allow-Origin": "*",
          },
        });
      },
    },
  },
});
