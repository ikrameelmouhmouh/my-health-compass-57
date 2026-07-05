// One-time bootstrap: if there are no admins yet, the caller becomes admin.
// After the first admin exists, subsequent calls return 403.

import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/admin/bootstrap-admin")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization") ?? "";
        const token = auth.replace(/^Bearer\s+/i, "");
        if (!token) return new Response("Unauthorized", { status: 401 });

        const supaUrl = process.env.SUPABASE_URL!;
        const supaAnon = process.env.SUPABASE_PUBLISHABLE_KEY!;

        const userClient = createClient(supaUrl, supaAnon, {
          auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
          global: { headers: { Authorization: `Bearer ${token}` } },
        });
        const { data: userRes, error: userErr } = await userClient.auth.getUser();
        if (userErr || !userRes.user) return new Response("Unauthorized", { status: 401 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { count } = await supabaseAdmin
          .from("user_roles")
          .select("*", { count: "exact", head: true })
          .eq("role", "admin");
        if ((count ?? 0) > 0) {
          // Already an admin somewhere — only allow if the caller IS that admin.
          const { data: mine } = await supabaseAdmin
            .from("user_roles")
            .select("id")
            .eq("user_id", userRes.user.id)
            .eq("role", "admin")
            .maybeSingle();
          if (!mine) return new Response("Forbidden — an admin already exists", { status: 403 });
          return Response.json({ ok: true, alreadyAdmin: true });
        }

        const { error: insErr } = await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: userRes.user.id, role: "admin" });
        if (insErr) return new Response(insErr.message, { status: 500 });
        return Response.json({ ok: true, promoted: true });
      },
    },
  },
});
