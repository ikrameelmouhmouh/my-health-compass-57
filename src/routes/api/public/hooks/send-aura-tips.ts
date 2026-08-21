import { createFileRoute } from "@tanstack/react-router";

// Daily Aura tip push. Sends a generic "open Alyva for today's tip" push to
// every subscription with enabled_streak. The actual personalized tip is
// computed client-side when the user opens the app (ensureTodayAura) and
// shown in the in-app notification inbox.
//
// Auth: Supabase anon apikey header (cron via pg_cron + pg_net).

export const Route = createFileRoute("/api/public/hooks/send-aura-tips")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey") ?? request.headers.get("authorization")?.replace("Bearer ", "");
        if (!apikey || apikey !== process.env.SUPABASE_PUBLISHABLE_KEY) {
          return new Response("Unauthorized", { status: 401 });
        }

        const vapidPublic = "BHdqCSyPw1FbZU1SH9mzadLqPI0q_maMGk1GyRuFDOLO38gtLVu6DmvFsBGg3cLlXzgSeQySQRhSoY-Zp4rTKu0";
        const vapidPrivate = (process.env.VAPID_PRIVATE_KEY ?? "")
          .trim()
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");
        const rawSubject = process.env.VAPID_SUBJECT;
        const subject =
          rawSubject && /^(mailto:|https:\/\/)/i.test(rawSubject) ? rawSubject : "mailto:noreply@alyva.app";
        if (!vapidPrivate) return new Response("VAPID not configured", { status: 500 });

        const { default: webpush } = await import("web-push");
        webpush.setVapidDetails(subject, vapidPublic, vapidPrivate);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: subs, error: subsErr } = await supabaseAdmin
          .from("push_subscriptions")
          .select("user_id,endpoint,p256dh,auth,enabled_streak");
        if (subsErr) return new Response(subsErr.message, { status: 500 });

        // Try to fetch today's aura_daily notification per user for a richer body.
        const dayStart = new Date(); dayStart.setUTCHours(0, 0, 0, 0);
        const { data: todayAura } = await supabaseAdmin
          .from("notifications")
          .select("user_id,title,body")
          .eq("type", "aura_daily")
          .gte("created_at", dayStart.toISOString());
        const auraByUser = new Map<string, { title: string; body: string }>();
        for (const n of todayAura ?? []) {
          auraByUser.set(n.user_id, { title: n.title ?? "Aura tip", body: n.body ?? "" });
        }

        let sent = 0, removed = 0;
        for (const sub of subs ?? []) {
          if (!sub.enabled_streak) continue;
          const aura = auraByUser.get(sub.user_id);
          const payload = JSON.stringify({
            title: aura?.title || "Je dagelijkse Aura-tip",
            body: aura?.body || "Open Alyva voor je persoonlijke tip van vandaag.",
            url: "/profile",
            tag: "aura-daily",
          });
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              payload,
            );
            sent++;
          } catch (err: unknown) {
            const status = (err as { statusCode?: number })?.statusCode;
            if (status === 404 || status === 410) {
              await supabaseAdmin.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
              removed++;
            }
          }
        }

        return Response.json({ ok: true, sent, removed, total: subs?.length ?? 0 });
      },
    },
  },
});
