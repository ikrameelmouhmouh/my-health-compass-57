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
  name: "set_current_weight",
  title: "Update current weight",
  description: "Update the signed-in user's current body weight (in kilograms) on their Alyva profile.",
  inputSchema: {
    weight_kg: z.number().min(20).max(400).describe("Current body weight in kilograms."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ weight_kg }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const sb = supabaseForUser(ctx);
    const { data, error } = await sb
      .from("profiles")
      .update({ current_weight_kg: weight_kg })
      .eq("id", ctx.getUserId())
      .select("current_weight_kg, goal_weight_kg")
      .single();
    if (error)
      return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Weight updated to ${weight_kg} kg.` }],
      structuredContent: { profile: data },
    };
  },
});
