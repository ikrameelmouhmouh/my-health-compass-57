// Admin-only endpoint that generates AI frames for a list of exercises.
// Body: {
//   ids: string[],
//   force?: boolean,
//   action?: "generate" | "reset",
//   prompts?: Record<string,string>,
//   exerciseData?: Record<string, { name: string; equipment: string }>
// }
// Auth: Bearer token of a user with the `admin` role in `user_roles`.
//
// Generation strategy: frame 0 (start pose) is generated from text. Frame 1
// (end pose) is generated as an IMAGE EDIT of frame 0 — same camera, lighting,
// mannequin, machine and background, only the body pose changes. This makes the
// two frames read as a mini-film of the movement instead of two unrelated shots.

import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { getCameraHint } from "@/lib/exercise-camera-hints";

type Body = {
  ids?: unknown;
  force?: unknown;
  action?: unknown;
  prompts?: unknown;
  exerciseData?: unknown;
};

type AdminClient = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];

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
        const action = body.action === "reset" ? "reset" : "generate";
        const force = Boolean(body.force);
        const prompts = (body.prompts && typeof body.prompts === "object" ? body.prompts : {}) as Record<string, string>;
        const exerciseData = (body.exerciseData && typeof body.exerciseData === "object" ? body.exerciseData : {}) as Record<
          string,
          { name?: string; equipment?: string }
        >;
        if (ids.length === 0) return Response.json({ ok: true, results: [] });
        if (action === "generate" && ids.length > 25) return new Response("Too many ids (max 25)", { status: 400 });
        if (ids.length > 1500) return new Response("Too many ids (max 1500)", { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        if (action === "reset") {
          await resetFrameJobs(ids, supabaseAdmin);
          return Response.json({ ok: true, reset: ids.length });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const results: Array<{ id: string; status: "done" | "failed" | "skipped"; error?: string }> = [];
        const CHUNK = 3;
        for (let i = 0; i < ids.length; i += CHUNK) {
          const chunk = ids.slice(i, i + CHUNK);
          const outs = await Promise.all(
            chunk.map((id) =>
              generateForExercise({
                id,
                force,
                prompt: prompts[id],
                name: exerciseData[id]?.name,
                equipment: exerciseData[id]?.equipment,
                apiKey: key,
                supabaseAdmin,
              }),
            ),
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
  name?: string;
  equipment?: string;
  apiKey: string;
  supabaseAdmin: AdminClient;
}): Promise<{ id: string; status: "done" | "failed" | "skipped"; error?: string }> {
  const { id, force, prompt, name, equipment, apiKey, supabaseAdmin } = args;
  try {
    if (!force) {
      const { data: job } = await supabaseAdmin
        .from("exercise_frame_jobs")
        .select("status")
        .eq("exercise_id", id)
        .maybeSingle();
      if (job?.status === "done") return { id, status: "skipped" };
    }

    const hint = getCameraHint(id, equipment, name);
    const basePrompt = prompt && prompt.trim().length > 0 ? prompt : buildDefaultPrompt(id, name, hint);

    await supabaseAdmin.from("exercise_frame_jobs").upsert({
      exercise_id: id,
      status: "pending",
      prompt: basePrompt,
      error: null,
    });

    // Frame 0: START position (text-to-image).
    const startPrompt = [
      basePrompt,
      "",
      "This is FRAME 1 of a 2-frame exercise animation.",
      `Render the START position of the movement: ${hint.startPose}.`,
      "The result must look like the first still of a locked-off training video: full body in frame, feet visible, head visible, no cropped limbs.",
      "Do not choose a dramatic angle. Do not rotate to the back. Do not hide, crop or simplify the machine. Keep the full apparatus visible when equipment is used.",
    ].join("\n");
    const b0 = await generateOne({ prompt: startPrompt, apiKey });

    // Frame 1: END position (image-to-image using frame 0 as reference so
    // camera, lighting, mannequin, machine and background stay identical).
    const endPrompt = [
      "This is FRAME 2 of a 2-frame exercise animation. The reference image is FRAME 1.",
      "",
      "CRITICAL — keep IDENTICAL to the reference image:",
      "- exact same room, background, floor, wall and ceiling",
      "- exact same camera position, angle, height, distance and focal length (do NOT rotate, pan, tilt, zoom or dolly around the subject)",
      `- exact same viewing side of the body: ${hint.angle}. NEVER flip to the back, the opposite side, or a different angle.`,
      hint.machineView ? `- exact same machine and equipment framing: ${hint.machineView}. The machine must not disappear, slide, or rotate in the frame.` : "",
      "- exact same lighting, shadows, color grading and reflections",
      "- exact same mannequin: identical body proportions, identical matte grey skin, no hair, no facial features, no gender markers, identical black athletic shorts",
      "- exact same equipment placement (barbell, dumbbells, machine, cable, bench) — if it is visible in frame 1 it must be in the exact same spot in frame 2",
      "",
      "ONLY change:",
      `- move the mannequin's limbs and torso to the END position: ${hint.endPose}.`,
      "Keep all machine pads, rails, cables, handles, benches, plates and weight stacks in the same visible positions unless that exact moving part is mechanically supposed to move.",
      "Do not zoom, pan, tilt, rotate, crop, restyle, change perspective, change the machine, change the background, or switch from front to back. Treat this like the very next video frame from the same locked-off camera.",
    ]
      .filter(Boolean)
      .join("\n");
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

async function resetFrameJobs(ids: string[], supabaseAdmin: AdminClient): Promise<void> {
  const rows = ids.map((id) => ({ exercise_id: id, status: "pending", prompt: null, error: null }));
  for (let i = 0; i < rows.length; i += 250) {
    const { error } = await supabaseAdmin.from("exercise_frame_jobs").upsert(rows.slice(i, i + 250));
    if (error) throw new Error(error.message);
  }

  const paths = ids.flatMap((id) => [`${id}-0.jpg`, `${id}-1.jpg`]);
  for (let i = 0; i < paths.length; i += 100) {
    await supabaseAdmin.storage.from("exercise-frames").remove(paths.slice(i, i + 100));
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

function buildDefaultPrompt(id: string, name: string | undefined, hint: ReturnType<typeof getCameraHint>): string {
  return [
    `Alyva Motion Lab reference render: photorealistic 3D androgynous mannequin performing the "${name ?? humanize(id)}" gym exercise.`,
    "Mannequin: smooth matte medium-grey skin, no hair, no facial features, completely flat chest, generic black athletic shorts, no gender markers of any kind.",
    "Correct anatomical form and posture for this specific exercise.",
    `Body orientation: ${hint.bodyOrientation}. This body orientation may not change between frames.`,
    hint.machineView
      ? `Equipment framing: ${hint.machineView}. The machine must be clearly visible, complete, anchored to the floor, and consistently positioned in both frames.`
      : "If the exercise uses equipment, it must be clearly visible and correctly positioned in the frame.",
    `Camera: ${hint.angle}. Locked-off tripod, 50mm equivalent focal length, fixed camera height and distance, subject centered, full body visible from head to feet.`,
    "Scene: Alyva Motion Lab — plain seamless off-white studio cyclorama, matte light-grey floor, one soft key light from upper-left, one soft fill light, single soft shadow on the floor. Keep this exact scene identical across all frames.",
    "No text, no watermark, no logos, no other people, no props besides the required equipment.",
  ].join("\n");
}

function humanize(id: string): string {
  return id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
