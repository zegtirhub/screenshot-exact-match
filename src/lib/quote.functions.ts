import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function newToken() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Get (or lazily create) this user's private daily-quote widget token. */
export const getWidgetToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: prefs } = await context.supabase.from("preferences").select("widget_token").maybeSingle();
    if (prefs?.widget_token) return { token: prefs.widget_token };
    const token = newToken();
    await context.supabase
      .from("preferences")
      .upsert({ user_id: context.userId, widget_token: token }, { onConflict: "user_id" });
    return { token };
  });

/** Issue a fresh token — old links stop working. */
export const resetWidgetToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const token = newToken();
    await context.supabase
      .from("preferences")
      .upsert({ user_id: context.userId, widget_token: token }, { onConflict: "user_id" });
    return { token };
  });
