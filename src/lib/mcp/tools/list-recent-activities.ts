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
  name: "list_recent_activities",
  title: "List recent cardio activities",
  description:
    "Return the signed-in user's most recent cardio activity sessions (activity name, duration, calories, distance).",
  inputSchema: {
    limit: z.number().int().min(1).max(50).optional().describe("How many activities to return. Default 10."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const sb = supabaseForUser(ctx);
    const { data, error } = await sb
      .from("activity_sessions")
      .select(
        "id, activity_id, activity_name, started_at, ended_at, duration_seconds, kcal, distance_m, heart_rate_avg, notes",
      )
      .eq("user_id", ctx.getUserId())
      .order("started_at", { ascending: false })
      .limit(limit ?? 10);
    if (error)
      return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { activities: data },
    };
  },
});
