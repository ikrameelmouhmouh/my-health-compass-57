import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Exercise } from "./workout.functions";

const ExtractInput = z.object({
  text: z.string().min(1).max(20000),
});

export type ExtractedTemplate = {
  name: string;
  day?: string;
  focus?: string;
  exercises: Exercise[];
};

export type ExtractedTemplatesPayload = {
  templates: ExtractedTemplate[];
};

export const extractWorkoutTemplates = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ExtractInput.parse(input))
  .handler(async ({ data }): Promise<ExtractedTemplatesPayload> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const { generateText } = await import("ai");
    const gateway = createLovableAiGatewayProvider(key);

    const sys = `You convert a coach's chat reply (any language) into structured workout templates that can be saved to a workouts app. Output ONLY valid JSON, no prose, no markdown fences.
Return JSON: { "templates": [ { "name": string, "day"?: string, "focus"?: string, "exercises": [ { "name": string, "sets": number, "reps": string, "restSec": number, "suggestedWeight"?: string, "notes"?: string } ] } ] }
Rules:
- If the message contains a single workout, return one template. If it contains multiple distinct training days (e.g. "Training 1", "Training 2", "Monday/Wednesday/Friday"), return one template per training day.
- Skip rest days entirely.
- "name" is short (e.g. "Full Body A", "Training 1 – Kracht & basis").
- "day" optional: one of mon|tue|wed|thu|fri|sat|sun if a specific day is mentioned, otherwise omit.
- "focus" optional: short phrase like "Strength", "Push", "Core".
- "sets" defaults to 3 if not specified. "reps" string like "10-12" or "30s". "restSec" defaults to 60.
- Translate exercise names to canonical English where obvious (Squats, Push-ups, Dumbbell Rows, Glute Bridges, Plank, Leg Raises, Shoulder Press, Lunges, Deadlift, etc.).
- If the text contains no workout/exercises, return { "templates": [] }.`;

    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system: sys,
      prompt: `Coach reply:\n"""${data.text}"""\n\nReturn the JSON now.`,
    });

    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    const s = cleaned.indexOf("{");
    const e = cleaned.lastIndexOf("}");
    const jsonStr = s >= 0 ? cleaned.slice(s, e + 1) : cleaned;
    const parsed = JSON.parse(jsonStr) as ExtractedTemplatesPayload;
    return { templates: Array.isArray(parsed.templates) ? parsed.templates : [] };
  });
