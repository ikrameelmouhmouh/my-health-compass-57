// Public, read-only export manifest: lists every exercise in the ALYVA library
// together with stable public URLs for its demo frames (when rendered).
// GET only — no writes are possible through this endpoint.

import { createFileRoute } from "@tanstack/react-router";
import { EXERCISES } from "@/lib/exercise-library";

export const Route = createFileRoute("/api/public/export/manifest")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: rows } = await supabaseAdmin
          .from("exercise_frame_jobs")
          .select("exercise_id")
          .eq("status", "done");
        const done = new Set((rows ?? []).map((r) => r.exercise_id));

        const exercises = EXERCISES.map((e) => ({
          id: e.id,
          name: e.name,
          equipment: e.equipment,
          primary: e.primary,
          secondary: e.secondary,
          steps: e.steps,
          frames: done.has(e.id)
            ? [
                `${origin}/api/public/export/exercise-frame/${encodeURIComponent(e.id)}/0`,
                `${origin}/api/public/export/exercise-frame/${encodeURIComponent(e.id)}/1`,
              ]
            : [],
        }));

        return new Response(
          JSON.stringify({
            generated_at: new Date().toISOString(),
            count: exercises.length,
            with_frames: exercises.filter((e) => e.frames.length > 0).length,
            exercises,
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              "Cache-Control": "public, max-age=300",
              "Access-Control-Allow-Origin": "*",
            },
          },
        );
      },
    },
  },
});
