import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const VOICE =
  "You are a warm, practical planning assistant inside a cherry-themed planner for people who feel overwhelmed. Be kind, concrete and brief. Never diagnose or make medical claims. Never shame.";

async function askJSON<T>(system: string, prompt: string, schema: z.ZodType<T>): Promise<T> {
  const { createOpenAI } = await import("@ai-sdk/openai");
  const { streamText, Output, NoObjectGeneratedError } = await import("ai");
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured right now.");
  const openai = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey: key,
    headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });
  const result = streamText({
    model: openai.responses("openai/gpt-6-astra"),
    system,
    prompt,
    output: Output.object({ schema }),
    providerOptions: {
      openai: { forceReasoning: true, reasoningEffort: "low", store: false, strictJsonSchema: true },
    },
  });
  try {
    return (await result.output) as T;
  } catch (e) {
    if (NoObjectGeneratedError.isInstance(e) && e.text) return schema.parse(JSON.parse(e.text));
    const msg = e instanceof Error ? e.message : String(e);
    if (/402|credit/i.test(msg)) throw new Error("AI credits ran out. Your thoughts are saved — you can sort them by hand.");
    if (/429/.test(msg)) throw new Error("The helper is busy. Try again in a moment.");
    throw new Error("The helper couldn't think right now. Your text is saved.");
  }
}

const planSchema = z.object({
  message: z.string(),
  first_step: z.string(),
  tasks: z.array(
    z.object({
      title: z.string(),
      area: z.enum(["personal", "work", "studies", "creative"]),
      urgent: z.boolean(),
      is_project: z.boolean(),
      estimate_min: z.number().nullable(),
      steps: z.array(z.string()),
    }),
  ),
});
export type BrainPlan = z.infer<typeof planSchema>;

export const organizeBrainDump = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { text: string; easier?: boolean }) => ({ text: String(d.text).slice(0, 6000), easier: !!d.easier }))
  .handler(async ({ data }) => {
    const plan = await askJSON(
      VOICE,
      `Turn this messy brain dump into tasks.
Rules: one task per distinct thing. area is personal, work, studies or creative. urgent only if the text implies time pressure.
is_project true for big multi-step goals. steps: ${data.easier ? "2-4 ridiculously tiny steps (under 5 minutes each)" : "0-4 small actionable steps, empty for simple tasks"}.
estimate_min only when reasonable, else null. first_step: one tiny concrete starting action. message: one short encouraging sentence.
${data.easier ? "Make everything feel easier and smaller than before." : ""}

Brain dump:
"""${data.text}"""`,
      planSchema,
    );
    plan.tasks = plan.tasks.slice(0, 25).map((t) => ({ ...t, title: t.title.slice(0, 200), steps: t.steps.slice(0, 6) }));
    return plan;
  });

const stepsSchema = z.object({ steps: z.array(z.string()), message: z.string() });

export const breakDown = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { title: string; context?: string; tiny?: boolean }) => ({
    title: String(d.title).slice(0, 300),
    context: String(d.context ?? "").slice(0, 1500),
    tiny: !!d.tiny,
  }))
  .handler(async ({ data }) => {
    const res = await askJSON(
      VOICE,
      data.tiny
        ? `Task: "${data.title}". Give the single most ridiculously easy first step (under 2 minutes), e.g. "Pick up three things" or "Open the document". Return it as steps with exactly one item. message: a short gentle nudge.`
        : `Break this into a manageable sequence of 3-7 small, concrete steps in plain language (no jargon). Item: "${data.title}". ${data.context ? `Context: ${data.context}` : ""} message: one short encouraging sentence.`,
      stepsSchema,
    );
    return { steps: res.steps.slice(0, 8).map((s) => s.slice(0, 200)), message: res.message };
  });

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const uid = context.userId;
    for (const t of ["focus_sessions", "tasks", "projects", "brain_dumps", "check_ins", "rewards", "preferences"] as const) {
      await supabaseAdmin.from(t).delete().eq("user_id", uid);
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(uid);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
