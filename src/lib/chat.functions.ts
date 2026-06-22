import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type ChatThread = {
  id: string;
  title: string;
  last_message_at: string;
  created_at: string;
};

export type ChatMessageRow = {
  id: string;
  thread_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
};

export const listThreads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ChatThread[]> => {
    const { data, error } = await context.supabase
      .from("chat_threads")
      .select("id, title, last_message_at, created_at")
      .order("last_message_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as ChatThread[];
  });

export const createThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ title: z.string().min(1).max(120).optional() }).parse(input ?? {}),
  )
  .handler(async ({ data, context }): Promise<ChatThread> => {
    const { data: row, error } = await context.supabase
      .from("chat_threads")
      .insert({
        user_id: context.userId,
        title: data.title ?? "New chat",
      })
      .select("id, title, last_message_at, created_at")
      .single();
    if (error || !row) throw new Error(error?.message ?? "Failed to create thread");
    return row as ChatThread;
  });

export const getThreadMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ threadId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }): Promise<ChatMessageRow[]> => {
    const { data: rows, error } = await context.supabase
      .from("chat_messages")
      .select("id, thread_id, role, content, created_at")
      .eq("thread_id", data.threadId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (rows ?? []) as ChatMessageRow[];
  });

export const deleteThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ threadId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("chat_threads")
      .delete()
      .eq("id", data.threadId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const renameThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ threadId: z.string().uuid(), title: z.string().min(1).max(120) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("chat_threads")
      .update({ title: data.title })
      .eq("id", data.threadId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const appendWorkoutFlowMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        threadId: z.string().uuid().nullable().optional(),
        userText: z.string().min(1).max(2000),
        assistantText: z.string().min(1).max(8000),
        title: z.string().min(1).max(120).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<{ threadId: string }> => {
    let threadId = data.threadId ?? null;
    if (!threadId) {
      const { data: row, error } = await context.supabase
        .from("chat_threads")
        .insert({ user_id: context.userId, title: data.title ?? "Workoutplan" })
        .select("id")
        .single();
      if (error || !row) throw new Error(error?.message ?? "Failed to create thread");
      threadId = row.id;
    }
    const { error: insErr } = await context.supabase.from("chat_messages").insert([
      { thread_id: threadId, user_id: context.userId, role: "user", content: data.userText },
      { thread_id: threadId, user_id: context.userId, role: "assistant", content: data.assistantText },
    ]);
    if (insErr) throw new Error(insErr.message);
    await context.supabase
      .from("chat_threads")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", threadId);
    return { threadId };
  });

