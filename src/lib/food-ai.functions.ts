import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const AnalyzeInput = z.object({
  /** data URL: data:image/jpeg;base64,.... */
  imageDataUrl: z.string().min(50).max(8_000_000),
  note: z.string().max(300).optional(),
});

export type AnalyzedMeal = {
  name: string;
  brand?: string;
  estimatedGrams: number;
  per100: {
    kcal: number; protein: number; carbs: number; fat: number;
    vitaminC?: number; vitaminD?: number; potassium?: number; iron?: number; calcium?: number;
  };
  confidence: "low" | "medium" | "high";
  reasoning: string;
};

export const analyzeMealPhoto = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AnalyzeInput.parse(input))
  .handler(async ({ data }): Promise<AnalyzedMeal> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const sys = `Je bent een Nederlandse voedingsdeskundige. Analyseer de foto van een maaltijd of voedingsproduct.
Geef ALLEEN geldige JSON terug, geen prose, geen markdown fences.
Schema: { "name": string (Nederlandse naam van het gerecht/product),
  "brand": string|null (merk indien zichtbaar, bv. "Albert Heijn", "Jumbo"),
  "estimatedGrams": number (geschatte totale portie in gram),
  "per100": { "kcal": number, "protein": number, "carbs": number, "fat": number },
  "confidence": "low"|"medium"|"high",
  "reasoning": string (1 korte zin in het Nederlands waarom je deze schatting maakt) }
Gebruik realistische Nederlandse voedingswaarden. Wees conservatief bij onduidelijke foto's (low confidence).`;

    const body = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: sys },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: data.note
                ? `Extra context van de gebruiker: ${data.note}\n\nAnalyseer deze foto en geef JSON terug.`
                : "Analyseer deze foto en geef JSON terug.",
            },
            { type: "image_url", image_url: { url: data.imageDataUrl } },
          ],
        },
      ],
    };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`AI gateway error ${res.status}: ${txt.slice(0, 200)}`);
    }
    const json = await res.json();
    const text: string = json.choices?.[0]?.message?.content ?? "";
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    const s = cleaned.indexOf("{");
    const e = cleaned.lastIndexOf("}");
    const jsonStr = s >= 0 ? cleaned.slice(s, e + 1) : cleaned;
    const parsed = JSON.parse(jsonStr);

    return {
      name: String(parsed.name || "Onbekende maaltijd"),
      brand: parsed.brand || undefined,
      estimatedGrams: Math.max(10, Math.round(Number(parsed.estimatedGrams) || 200)),
      per100: {
        kcal: Math.max(0, Math.round(Number(parsed.per100?.kcal) || 0)),
        protein: Math.max(0, Number(parsed.per100?.protein) || 0),
        carbs: Math.max(0, Number(parsed.per100?.carbs) || 0),
        fat: Math.max(0, Number(parsed.per100?.fat) || 0),
      },
      confidence: (["low", "medium", "high"].includes(parsed.confidence) ? parsed.confidence : "medium") as AnalyzedMeal["confidence"],
      reasoning: String(parsed.reasoning || ""),
    };
  });
