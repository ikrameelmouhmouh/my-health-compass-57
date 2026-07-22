// Admin-only endpoint that generates AI frames for a list of exercises.
// Body: { ids: string[], force?: boolean, prompts?: Record<string,string> }
// Auth: Bearer token of a user with the `admin` role in `user_roles`.
//
// Generation strategy: frame 0 (start pose) is generated from text. Frame 1
// (end pose) is generated as an IMAGE EDIT of frame 0 — same camera, lighting,
// mannequin and background, only the body pose changes. This makes the two
// frames read as a mini-film of the movement instead of two unrelated shots.

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

        const results: Array<{ id: string; status: "done" | "failed" | "skipped"; error?: string }> = [];
        const CHUNK = 3;
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

    const basePrompt = prompt && prompt.trim().length > 0 ? prompt : buildDefaultPrompt(id);

    // Frame 0: START position (text-to-image).
    const startPrompt = `${basePrompt}\n\nThis is FRAME 1 of a 2-frame exercise animation. Render the START position of the movement: the ready/resting stance just before the rep begins. Full body in frame, feet visible, head visible.`;
    const b0 = await generateOne({ prompt: startPrompt, apiKey });

    // Frame 1: END position (image-to-image using frame 0 as reference so
    // camera, lighting, mannequin and background stay identical).
    const endPrompt = [
      "This is FRAME 2 of a 2-frame exercise animation. The reference image is FRAME 1.",
      "CRITICAL — keep IDENTICAL to the reference image:",
      "- exact same room, background, floor and wall",
      "- exact same camera position, angle, height, distance and focal length (do NOT rotate around the subject)",
      "- exact same viewing side of the body: if FRAME 1 shows the FRONT of the body, FRAME 2 MUST also show the front; if side view, keep side view; if 3/4 view, keep 3/4 view. NEVER flip to the back or a different side.",
      "- exact same lighting, shadows and color grading",
      "- exact same mannequin: identical body proportions, identical matte grey skin, no hair, no facial features, no gender markers, identical clothing",
      "- exact same equipment in the exact same position",
      "ONLY change: move the mannequin's limbs and torso to the END position of the exercise (peak contraction, muscles fully engaged).",
      "Do not zoom, pan, tilt, rotate, crop or restyle. Treat this like the very next video frame from the same locked-off camera.",
    ].join(" ");
    const b64_0 = uint8ToBase64(b0);
    const b1 = await generateOne({
      prompt: endPrompt,
      apiKey,
      referenceImageB64: b64_0,
    });

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
      prompt: basePrompt,
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

async function generateOne(args: {
  prompt: string;
  apiKey: string;
  referenceImageB64?: string;
}): Promise<Uint8Array> {
  const { prompt, apiKey, referenceImageB64 } = args;
  const content: Array<Record<string, unknown>> = [{ type: "text", text: prompt }];
  if (referenceImageB64) {
    content.push({
      type: "image_url",
      image_url: { url: `data:image/jpeg;base64,${referenceImageB64}` },
    });
  }
  const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3.1-flash-image",
      messages: [{ role: "user", content }],
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

function uint8ToBase64(bytes: Uint8Array): string {
  let bin = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

function buildDefaultPrompt(id: string): string {
  const angle = cameraAngleFor(id);
  return [
    `Photorealistic 3D-rendered androgynous mannequin performing the "${humanize(id)}" gym exercise.`,
    "Matte medium-grey skin, no hair, no facial features, no gender markers (flat chest, generic athletic shorts).",
    "Correct anatomical form and posture for this specific exercise.",
    "If the exercise uses a machine or equipment, the equipment must be clearly visible and correctly positioned in the frame.",
    `Camera: ${angle}, fixed position, 50mm equivalent focal length, full body visible, sharp focus.`,
    "Studio shot on a clean off-white background with a single soft shadow.",
    "No text, no watermark, no logos.",
  ].join(" ");
}

function cameraAngleFor(id: string): string {
  const s = id.toLowerCase();
  // Vertical pulling / pressing movements read best from the front so both
  // arms are visible symmetrically.
  if (/(pulldown|pull-?up|chin-?up|shoulder-?press|overhead-?press|lateral-?raise|front-?raise|face-?pull|shrug|curl)/.test(s)) {
    return "straight front view, eye level";
  }
  // Push-ups and planks — slight 3/4 angle reads the body line best.
  if (/(push-?up|plank|dip)/.test(s)) {
    return "three-quarter front view, slightly low angle";
  }
  // Everything else (squat, deadlift, row, hinge, lunge, bench press, leg
  // curl/extension, hip thrust): pure side view shows the joint angles.
  return "pure side view, eye level";
}

function humanize(id: string): string {
  return id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
