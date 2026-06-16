import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Exercise } from "./workout.functions";

const SuggestInput = z.object({
  focus: z.string().min(1).max(200),
  experience: z.string().optional(),
  equipment: z.string().optional(),
  count: z.number().min(1).max(12).optional(),
  notes: z.string().optional(),
});

export type SuggestInputT = z.infer<typeof SuggestInput>;

export type CoachSuggestion = {
  message: string;
  exercises: Exercise[];
};

export const suggestExercises = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SuggestInput.parse(input))
  .handler(async ({ data }): Promise<CoachSuggestion> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const { generateText } = await import("ai");
    const gateway = createLovableAiGatewayProvider(key);

    const count = data.count ?? 5;
    const sys = `You are a certified strength coach. Output ONLY valid JSON, no prose, no markdown fences.
Return JSON: { "message": string (1-2 short sentences of coaching advice, may be in the user's language),
  "exercises": [ { "name": string, "sets": number, "reps": string, "restSec": number, "suggestedWeight": string, "notes": string } ] }
Provide exactly ${count} exercises tailored to the requested focus.
Suggested weight: realistic kg range for the experience level (e.g. "40-50 kg") or "bodyweight" / "RPE 7".`;

    const user = `Focus: ${data.focus}
Experience: ${data.experience || "intermediate"}
Equipment available: ${data.equipment || "full gym"}
Extra notes: ${data.notes || "none"}

Return the JSON now.`;

    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system: sys,
      prompt: user,
    });

    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    const s = cleaned.indexOf("{");
    const e = cleaned.lastIndexOf("}");
    const jsonStr = s >= 0 ? cleaned.slice(s, e + 1) : cleaned;
    return JSON.parse(jsonStr) as CoachSuggestion;
  });
