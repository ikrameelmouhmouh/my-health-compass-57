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
  name: "list_recent_workouts",
  title: "List recent gym workouts",
  description:
    "Return the signed-in user's most recent completed gym workout sessions (name, date, duration, total volume, reps, RPE).",
  inputSchema: {
    limit: z.number().int().min(1).max(50).optional().describe("How many sessions to return. Default 10."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const sb = supabaseForUser(ctx);
    const { data, error } = await sb
      .from("workout_sessions")
      .select(
        "id, name, template_id, started_at, ended_at, duration_seconds, active_seconds, total_volume_kg, total_reps, rpe, notes",
      )
      .eq("user_id", ctx.getUserId())
      .order("started_at", { ascending: false })
      .limit(limit ?? 10);
    if (error)
      return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { workouts: data },
    };
  },
});
