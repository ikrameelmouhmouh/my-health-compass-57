// Public, read-only image endpoint for exercise demo frames.
// Lives under /api/public/* so external tools can fetch it without site auth.
// GET only: no upload, update or delete paths exist here.

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/export/exercise-frame/$id/$i")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const idx = params.i === "1" ? 1 : 0;
        const key = `${params.id}-${idx}.jpg`;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("exercise-frames").download(key);
        if (error || !data) return new Response("Not found", { status: 404 });
        const buf = await data.arrayBuffer();
        return new Response(buf, {
          status: 200,
          headers: {
            "Content-Type": data.type || "image/jpeg",
            "Cache-Control": "public, max-age=86400, s-maxage=86400",
            "Access-Control-Allow-Origin": "*",
          },
        });
      },
    },
  },
});
