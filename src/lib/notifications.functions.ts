import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  meta: Record<string, unknown>;
  read: boolean;
  created_at: string;
};

export const listNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Notification[]> => {
    const { data, error } = await context.supabase
      .from("notifications")
      .select("id, type, title, body, meta, read, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []) as Notification[];
  });

export const markRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const markAllRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", context.userId)
      .eq("read", false);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const ensureTodayAura = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        title: z.string().min(1).max(160),
        body: z.string().min(1).max(1000),
        advice: z.string().min(1).max(500),
        snapshot: z.record(z.string(), z.unknown()).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<Notification> => {
    const today = new Date().toISOString().slice(0, 10);

    // Look up today's existing aura_daily for this user.
    const { data: existing } = await context.supabase
      .from("notifications")
      .select("id, type, title, body, meta, read, created_at")
      .eq("user_id", context.userId)
      .eq("type", "aura_daily")
      .gte("created_at", `${today}T00:00:00Z`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) return existing as Notification;

    const { data: row, error } = await context.supabase
      .from("notifications")
      .insert({
        user_id: context.userId,
        type: "aura_daily",
        title: data.title,
        body: data.body,
        meta: { advice: data.advice, ...(data.snapshot ?? {}) },
      })
      .select("id, type, title, body, meta, read, created_at")
      .single();
    if (error) throw new Error(error.message);
    return row as Notification;
  });
