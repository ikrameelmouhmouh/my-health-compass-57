// Public image proxy for the private `exercise-frames` storage bucket.
// Serves the two AI-generated demo frames per exercise with long browser cache.

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/exercise-frame/$id/$i")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const idx = params.i === "1" ? 1 : 0;
        const key = `${params.id}-${idx}.jpg`;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("exercise-frames").download(key);
        if (error || !data) {
          return new Response("Not found", { status: 404 });
        }
        const buf = await data.arrayBuffer();
        return new Response(buf, {
          status: 200,
          headers: {
            "Content-Type": "image/jpeg",
            "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
          },
        });
      },
    },
  },
});
