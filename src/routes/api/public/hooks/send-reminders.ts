import { createFileRoute } from "@tanstack/react-router";

// Public cron endpoint. Authenticated by Supabase anon apikey header.
// Sends daily workout-reminder pushes to users with no completed session today
// and an active streak.

export const Route = createFileRoute("/api/public/hooks/send-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey") ?? request.headers.get("authorization")?.replace("Bearer ", "");
        if (!apikey || apikey !== process.env.SUPABASE_PUBLISHABLE_KEY) {
          return new Response("Unauthorized", { status: 401 });
        }

        const vapidPublic = "BHdqCSyPw1FbZU1SH9mzadLqPI0q_maMGk1GyRuFDOLO38gtLVu6DmvFsBGg3cLlXzgSeQySQRhSoY-Zp4rTKu0";
        const vapidPrivate = process.env.VAPID_PRIVATE_KEY!;
        const subject = process.env.VAPID_SUBJECT || "mailto:noreply@vita.app";
        if (!vapidPrivate) return new Response("VAPID not configured", { status: 500 });

        const { default: webpush } = await import("web-push");
        webpush.setVapidDetails(subject, vapidPublic, vapidPrivate);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Pull all subscriptions
        const { data: subs, error: subsErr } = await supabaseAdmin
          .from("push_subscriptions")
          .select("user_id,endpoint,p256dh,auth,enabled_workout");
        if (subsErr) return new Response(subsErr.message, { status: 500 });

        // Pull today's sessions per user
        const dayStart = new Date(); dayStart.setUTCHours(0, 0, 0, 0);
        const { data: todaySessions } = await supabaseAdmin
          .from("workout_sessions")
          .select("user_id")
          .gte("started_at", dayStart.toISOString());
        const activeToday = new Set((todaySessions ?? []).map((s) => s.user_id));

        let sent = 0, removed = 0;
        for (const sub of subs ?? []) {
          if (!sub.enabled_workout) continue;
          if (activeToday.has(sub.user_id)) continue;
          const payload = JSON.stringify({
            title: "Tijd voor je workout",
            body: "Houd je streak in leven — log een snelle sessie.",
            url: "/fitness",
            tag: "workout-reminder",
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
