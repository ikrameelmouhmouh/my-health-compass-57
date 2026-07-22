import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "log_activity",
  title: "Log a cardio activity",
  description:
    "Insert a completed cardio activity session for the signed-in user (e.g. a run, a swim). Duration is in seconds.",
  inputSchema: {
    activity_name: z.string().min(1).describe("Human-readable activity name, e.g. 'Zwemmen' or 'Running'."),
    activity_id: z.string().min(1).describe("Short slug, e.g. 'swim', 'run', 'cycle'."),
    duration_seconds: z.number().int().min(1).describe("Total duration in seconds."),
    kcal: z.number().optional().describe("Calories burned, if known."),
    distance_m: z.number().optional().describe("Distance in meters, if known."),
    notes: z.string().max(500).optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const sb = supabaseForUser(ctx);
    const endedAt = new Date();
    const startedAt = new Date(endedAt.getTime() - input.duration_seconds * 1000);
    const { data, error } = await sb
      .from("activity_sessions")
      .insert({
        user_id: ctx.getUserId(),
        activity_id: input.activity_id,
        activity_name: input.activity_name,
        started_at: startedAt.toISOString(),
        ended_at: endedAt.toISOString(),
        duration_seconds: input.duration_seconds,
        kcal: input.kcal,
        distance_m: input.distance_m,
        notes: input.notes,
        source: "mcp",
      })
      .select()
      .single();
    if (error)
      return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Logged ${input.activity_name} (${Math.round(input.duration_seconds / 60)} min).` }],
      structuredContent: { activity: data },
    };
  },
});
