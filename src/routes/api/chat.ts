import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type Body = {
  messages: UIMessage[];
  threadId?: string | null;
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
        if (!body || !Array.isArray(body.messages)) {
          return new Response("Bad request", { status: 400 });
        }

        let threadId = body.threadId ?? null;
        if (threadId) {
          const { data: thread } = await supabase
            .from("chat_threads")
            .select("id")
            .eq("id", threadId)
            .maybeSingle();
          if (!thread) return new Response("Thread not found", { status: 404 });
        } else {
          const { data: thread, error } = await supabase
            .from("chat_threads")
            .insert({ user_id: userId, title: "New chat" })
            .select("id")
            .single();
          if (error || !thread) return new Response("Failed to create thread", { status: 500 });
          threadId = thread.id;
        }

        // Persist the latest user message
        const last = body.messages[body.messages.length - 1];
        if (last?.role === "user") {
          const userText = last.parts
            .map((p) => (p.type === "text" ? p.text : ""))
            .join("")
            .trim();
          const hasImage = last.parts.some((p) => p.type === "file");
          const stored = hasImage ? (userText ? `📷 ${userText}` : "📷") : userText;
          if (stored) {
            await supabase.from("chat_messages").insert({
              thread_id: threadId,
              user_id: userId,
              role: "user",
              content: stored,
            });
            // Auto-title from first user message if still default
            const { data: t } = await supabase
              .from("chat_threads")
              .select("title")
              .eq("id", threadId)
              .maybeSingle();
            const defaultTitles = ["New chat", "", "Nieuw gesprek"];
            if (t && defaultTitles.includes(t.title)) {
              const title = (userText || "📷 Foto").slice(0, 60);
              await supabase.from("chat_threads").update({ title }).eq("id", threadId);
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
- If the user asks to make a workout plan for this week and key planning details are missing, do NOT generate the full plan immediately. First ask the needed questions in the user's language: which training days, goal, focus areas/body parts, gym/home/equipment, experience level, available minutes, injuries/limitations, and whether to replace existing templates or add alongside them.
- Once the user answers enough details, generate a clear weekly plan with day names, exercises, sets, reps, rest, and focus so the app can extract it.
- IMPORTANT: When you propose a workout/training schema with concrete exercises, the app automatically shows the user an "Add to Workouts" button under your message that saves it to their Workouts tab. So if the user asks to add a workout to their Workouts/training section, simply (re-)present the workout clearly with exercises (name, sets, reps) and tell them to tap the "Add to Workouts" button below your message — never claim you cannot do this or that they must enter it manually.

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
          headers: { "x-thread-id": threadId },
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
                  thread_id: threadId,
                  user_id: userId,
                  role: "assistant",
                  content: text,
                });
                await supabase
                  .from("chat_threads")
                  .update({ last_message_at: new Date().toISOString() })
                  .eq("id", threadId);
              }
            }
          },
        });
      },
    },
  },
});
