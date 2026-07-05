// Admin-only endpoint that generates AI frames for a list of exercises.
// Body: { ids: string[], force?: boolean, prompts?: Record<string,string> }
// Auth: Bearer token of a user with the `admin` role in `user_roles`.

import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

type Body = { ids?: unknown; force?: unknown; prompts?: unknown };

export const Route = createFileRoute("/api/admin/generate-exercise-frames")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization") ?? "";
        const token = auth.replace(/^Bearer\s+/i, "");
        if (!token) return new Response("Unauthorized", { status: 401 });

        const supaUrl = process.env.SUPABASE_URL!;
        const supaAnon = process.env.SUPABASE_PUBLISHABLE_KEY!;

        // Verify user + admin role via a request-scoped client that uses the caller's JWT.
        const userClient = createClient(supaUrl, supaAnon, {
          auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
          global: { headers: { Authorization: `Bearer ${token}` } },
        });
        const { data: userRes, error: userErr } = await userClient.auth.getUser();
        if (userErr || !userRes.user) return new Response("Unauthorized", { status: 401 });
        const { data: roleRow } = await userClient
          .from("user_roles")
          .select("role")
          .eq("user_id", userRes.user.id)
          .eq("role", "admin")
          .maybeSingle();
        if (!roleRow) return new Response("Forbidden", { status: 403 });

        const body = (await request.json()) as Body;
        const ids = Array.isArray(body.ids) ? (body.ids as unknown[]).filter((x): x is string => typeof x === "string") : [];
        const force = Boolean(body.force);
        const prompts = (body.prompts && typeof body.prompts === "object" ? body.prompts : {}) as Record<string, string>;
        if (ids.length === 0) return Response.json({ ok: true, results: [] });
        if (ids.length > 25) return new Response("Too many ids (max 25)", { status: 400 });

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Process in parallel batches of 5 to stay under Worker timeout.
        const results: Array<{ id: string; status: "done" | "failed" | "skipped"; error?: string }> = [];
        const CHUNK = 5;
        for (let i = 0; i < ids.length; i += CHUNK) {
          const chunk = ids.slice(i, i + CHUNK);
          const outs = await Promise.all(
            chunk.map((id) => generateForExercise({ id, force, prompt: prompts[id], apiKey: key, supabaseAdmin })),
          );
          results.push(...outs);
        }
        return Response.json({ ok: true, results });
      },
    },
  },
});

async function generateForExercise(args: {
  id: string;
  force: boolean;
  prompt?: string;
  apiKey: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any;
}): Promise<{ id: string; status: "done" | "failed" | "skipped"; error?: string }> {
  const { id, force, prompt, apiKey, supabaseAdmin } = args;
  try {
    if (!force) {
      const { data: job } = await supabaseAdmin
        .from("exercise_frame_jobs")
        .select("status")
        .eq("exercise_id", id)
        .maybeSingle();
      if (job?.status === "done") return { id, status: "skipped" };
    }

    const finalPrompt = prompt && prompt.trim().length > 0 ? prompt : buildDefaultPrompt(id);

    // Generate 2 frames in parallel (start + end position).
    const [b0, b1] = await Promise.all([
      generateOne(`${finalPrompt}\n\nRender the START position: neutral resting stance before the movement begins.`, apiKey),
      generateOne(`${finalPrompt}\n\nRender the END position: peak contraction, muscles fully engaged.`, apiKey),
    ]);

    const up0 = await supabaseAdmin.storage.from("exercise-frames").upload(`${id}-0.jpg`, b0, {
      contentType: "image/jpeg",
      upsert: true,
    });
    if (up0.error) throw new Error(up0.error.message);
    const up1 = await supabaseAdmin.storage.from("exercise-frames").upload(`${id}-1.jpg`, b1, {
      contentType: "image/jpeg",
      upsert: true,
    });
    if (up1.error) throw new Error(up1.error.message);

    await supabaseAdmin.from("exercise_frame_jobs").upsert({
      exercise_id: id,
      status: "done",
      prompt: finalPrompt,
      error: null,
    });
    return { id, status: "done" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabaseAdmin.from("exercise_frame_jobs").upsert({
      exercise_id: id,
      status: "failed",
      error: msg,
    });
    return { id, status: "failed", error: msg };
  }
}

async function generateOne(prompt: string, apiKey: string): Promise<Uint8Array> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3.1-flash-image",
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    }),
  });
  if (!res.ok) throw new Error(`Gateway ${res.status}: ${await res.text().catch(() => "")}`);
  const json = (await res.json()) as { data?: Array<{ b64_json?: string }> };
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error("No image data in response");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function buildDefaultPrompt(id: string): string {
  return [
    `Photorealistic 3D-rendered androgynous mannequin performing the "${humanize(id)}" gym exercise.`,
    "Matte medium-grey skin, no hair, no facial features, no gender markers (flat chest, generic athletic shorts).",
    "Correct anatomical form and posture for this specific exercise.",
    "If the exercise uses a machine or equipment, the equipment must be clearly visible and correctly positioned in the frame.",
    "Studio shot on a clean off-white background with soft shadow, side-angle view, full body visible, sharp focus.",
    "No text, no watermark, no logos.",
  ].join(" ");
}

function humanize(id: string): string {
  return id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
