import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type Body = {
  messages: UIMessage[];
  threadId: string;
  lang?: string;
};

const LANG_NAMES: Record<string, string> = {
  en: "English",
  nl: "Dutch (Nederlands)",
  ar: "Arabic (العربية)",
  fr: "French (Français)",
  de: "German (Deutsch)",
  es: "Spanish (Español)",
};

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return new Response("Unauthorized", { status: 401 });
        }
        const token = authHeader.slice(7);

        const SUPABASE_URL = process.env.SUPABASE_URL!;
        const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY!;
        const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        });
        const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
        if (claimsErr || !claimsData?.claims?.sub) {
          return new Response("Unauthorized", { status: 401 });
        }
        const userId = claimsData.claims.sub;

        const body = (await request.json()) as Body;
        if (!body?.threadId || !Array.isArray(body.messages)) {
          return new Response("Bad request", { status: 400 });
        }

        // Verify thread ownership
        const { data: thread } = await supabase
          .from("chat_threads")
          .select("id")
          .eq("id", body.threadId)
          .maybeSingle();
        if (!thread) return new Response("Thread not found", { status: 404 });

        // Persist the latest user message
        const last = body.messages[body.messages.length - 1];
        if (last?.role === "user") {
          const userText = last.parts
            .map((p) => (p.type === "text" ? p.text : ""))
            .join("")
            .trim();
          if (userText) {
            await supabase.from("chat_messages").insert({
              thread_id: body.threadId,
              user_id: userId,
              role: "user",
              content: userText,
            });
            // Auto-title from first user message if still default
            const { data: t } = await supabase
              .from("chat_threads")
              .select("title")
              .eq("id", body.threadId)
              .maybeSingle();
            if (t && (t.title === "New chat" || t.title === "" || t.title === "Nieuw gesprek")) {
              const title = userText.slice(0, 60);
              await supabase.from("chat_threads").update({ title }).eq("id", body.threadId);
            }
          }
        }

        // Load profile for personalization
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        const langName = LANG_NAMES[body.lang ?? "en"] ?? "English";

        const profileBlock = profile
          ? `User profile:
- Name: ${profile.display_name ?? "—"}
- Goal: ${profile.goal ?? "—"}
- Current weight: ${profile.current_weight_kg ?? "—"} kg
- Goal weight: ${profile.goal_weight_kg ?? "—"} kg
- Height: ${profile.height_cm ?? "—"} cm
- Age: ${profile.age ?? "—"}
- Activity: ${profile.activity_level ?? "—"}
- Workouts/week: ${profile.workout_frequency ?? "—"}
- Daily calorie target: ${profile.daily_calories ?? "—"} kcal
- Macros (P/C/F): ${profile.protein_g ?? "—"}/${profile.carbs_g ?? "—"}/${profile.fat_g ?? "—"} g`
          : "User profile not available.";

        const system = `You are Vita, a calm, encouraging personal health & nutrition coach inside the user's health app. You help with nutrition, intermittent fasting, workouts, and progress.

Always respond in: ${langName}.

Guidelines:
- Be concise, warm, practical. Use short paragraphs, bullets when helpful.
- Tailor advice to the user's profile below.
- For medical issues recommend consulting a professional.
- Never invent metrics; if data is missing, say so.
- Use markdown for formatting when useful.

${profileBlock}`;

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        const gateway = createLovableAiGatewayProvider(key);

        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system,
          messages: await convertToModelMessages(body.messages),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: body.messages,
          onFinish: async ({ messages }) => {
            const assistant = messages[messages.length - 1];
            if (assistant?.role === "assistant") {
              const text = assistant.parts
                .map((p) => (p.type === "text" ? p.text : ""))
                .join("")
                .trim();
              if (text) {
                await supabase.from("chat_messages").insert({
                  thread_id: body.threadId,
                  user_id: userId,
                  role: "assistant",
                  content: text,
                });
                await supabase
                  .from("chat_threads")
                  .update({ last_message_at: new Date().toISOString() })
                  .eq("id", body.threadId);
              }
            }
          },
        });
      },
    },
  },
});
