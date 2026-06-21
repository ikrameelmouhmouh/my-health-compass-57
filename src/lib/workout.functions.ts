import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

const WizardInput = z.object({
  goal: z.string(),
  experience: z.string(),
  location: z.string(),
  equipment: z.array(z.string()),
  frequency: z.number().min(1).max(7),
  trainingDays: z.array(z.enum(DAY_NAMES)).optional(),
  focusAreas: z.array(z.string()),
  duration: z.number().optional(),
  injuries: z.string().optional(),
  avoid: z.string().optional(),
  favorites: z.string().optional(),
});

export type WizardInputT = z.infer<typeof WizardInput>;

export type Exercise = {
  name: string;
  sets: number;
  reps: string;
  restSec: number;
  suggestedWeight?: string;
  notes?: string;
};

export type WorkoutDay = {
  day: string;
  focus: string;
  rest: boolean;
  exercises: Exercise[];
};

export type WorkoutPlan = {
  name: string;
  split: string;
  durationWeeks: number;
  progressionNotes: string;
  days: WorkoutDay[];
};

export const generateWorkoutPlan = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => WizardInput.parse(input))
  .handler(async ({ data }): Promise<WorkoutPlan> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const { generateText } = await import("ai");

    const gateway = createLovableAiGatewayProvider(key);

    const sys = `You are a certified strength coach. Output ONLY valid JSON, no prose, no markdown fences.
Generate a personalized weekly workout plan as JSON matching this shape:
{
  "name": string,
  "split": string,
  "durationWeeks": number,
  "progressionNotes": string,
  "days": [
    { "day": "Monday"|"Tuesday"|...|"Sunday", "focus": string, "rest": boolean,
      "exercises": [{ "name": string, "sets": number, "reps": string, "restSec": number, "suggestedWeight": string, "notes": string }] }
  ]
}
Include all 7 days (Monday-Sunday). Rest days have rest:true and exercises:[].
Match the user's frequency exactly (number of non-rest days).
Suggested weight: use bodyweight, RPE, or relative descriptors (e.g. "moderate, RPE 7", "bodyweight", "~60% 1RM").`;

    const user = `Goal: ${data.goal}
Experience: ${data.experience}
Location: ${data.location}
Equipment: ${data.equipment.join(", ") || "n/a"}
Training days per week: ${data.frequency}
Focus areas (prioritize): ${data.focusAreas.join(", ") || "balanced"}
Preferred session duration: ${data.duration ? `${data.duration} min` : "any"}
Injuries/limitations: ${data.injuries || "none"}
Exercises to avoid: ${data.avoid || "none"}
Favorite exercises: ${data.favorites || "none"}

Return the JSON now.`;

    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system: sys,
      prompt: user,
    });

    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    const jsonStart = cleaned.indexOf("{");
    const jsonEnd = cleaned.lastIndexOf("}");
    const jsonStr = jsonStart >= 0 ? cleaned.slice(jsonStart, jsonEnd + 1) : cleaned;
    const parsed = JSON.parse(jsonStr) as WorkoutPlan;
    return parsed;
  });
