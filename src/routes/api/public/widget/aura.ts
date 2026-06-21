import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "crypto";
import type { Database } from "@/integrations/supabase/types";

/**
 * Public widget API — returns the latest "aura_daily" notification for a user.
 * Authentication: ?token=<hex>&user=<uuid> where token = HMAC_SHA256(user, WIDGET_SECRET).
 *
 * This endpoint is prepared so a future native iOS/Android home-screen widget
 * (WidgetKit / Glance) can fetch the daily insight without a session cookie.
 */

function safeEq(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export const Route = createFileRoute("/api/public/widget/aura")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const userId = url.searchParams.get("user");
        const token = url.searchParams.get("token");
        const secret = process.env.WIDGET_SECRET;

        if (!secret) {
          return new Response(JSON.stringify({ error: "Widget not configured" }), {
            status: 503,
            headers: { "content-type": "application/json" },
          });
        }
        if (!userId || !token) {
          return new Response(JSON.stringify({ error: "Missing user or token" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        const expected = createHmac("sha256", secret).update(userId).digest("hex");
        if (!safeEq(token, expected)) {
          return new Response(JSON.stringify({ error: "Invalid token" }), {
            status: 401,
            headers: { "content-type": "application/json" },
          });
        }

        const supabaseUrl = process.env.SUPABASE_URL!;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createClient<Database>(supabaseUrl, serviceKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const { data, error } = await supabase
          .from("notifications")
          .select("title, body, meta, created_at")
          .eq("user_id", userId)
          .eq("type", "aura_daily")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          return new Response(JSON.stringify({ error: "Lookup failed" }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }
        if (!data) {
          return Response.json({ title: null, body: null, advice: null, date: null });
        }

        const meta = (data.meta ?? {}) as { advice?: unknown };
        return Response.json(
          {
            title: data.title,
            body: data.body,
            advice: typeof meta.advice === "string" ? meta.advice : null,
            date: data.created_at,
          },
          {
            headers: {
              "cache-control": "public, max-age=60",
              "access-control-allow-origin": "*",
            },
          },
        );
      },
    },
  },
});
