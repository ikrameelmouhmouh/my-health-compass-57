import { supabase } from "@/integrations/supabase/client";

export type LoggedSet = {
  weight_kg: number | null;
  reps: number | null;
  rest_seconds: number | null;
  estimated_1rm: number | null;
  completed_at: string;
};

export type ExercisePR = {
  exercise_key: string;
  exercise_name: string;
  best_weight_kg: number | null;
  best_weight_reps: number | null;
  best_volume_kg: number | null;
  best_1rm_kg: number | null;
};

export function exerciseKey(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Epley formula
export function estimate1RM(weight: number, reps: number) {
  if (!weight || !reps) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

export async function startSession(input: { name: string; templateId?: string }) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Niet ingelogd");
  const { data, error } = await supabase
    .from("workout_sessions")
    .insert({ user_id: u.user.id, name: input.name, template_id: input.templateId ?? null })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function getLastSetsForExercise(exerciseName: string) {
  const key = exerciseKey(exerciseName);
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return [];
  // Get most recent session id for this exercise
  const { data: latest } = await supabase
    .from("workout_sets")
    .select("session_id, completed_at")
    .eq("user_id", u.user.id)
    .eq("exercise_key", key)
    .order("completed_at", { ascending: false })
    .limit(1);
  const lastSessionId = latest?.[0]?.session_id;
  if (!lastSessionId) return [];
  const { data } = await supabase
    .from("workout_sets")
    .select("weight_kg, reps, rest_seconds, set_index, completed_at")
    .eq("user_id", u.user.id)
    .eq("exercise_key", key)
    .eq("session_id", lastSessionId)
    .order("set_index", { ascending: true });
  return data ?? [];
}

export async function getPR(exerciseName: string): Promise<ExercisePR | null> {
  const key = exerciseKey(exerciseName);
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data } = await supabase
    .from("exercise_prs")
    .select("*")
    .eq("user_id", u.user.id)
    .eq("exercise_key", key)
    .maybeSingle();
  return data;
}

export type LogSetResult = {
  setId: string;
  isPRWeight: boolean;
  isPRVolume: boolean;
  isPR1RM: boolean;
  estimated1RM: number;
};

export async function logSet(input: {
  sessionId: string;
  exerciseName: string;
  setIndex: number;
  weightKg: number | null;
  reps: number | null;
  restSeconds: number | null;
}): Promise<LogSetResult> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Niet ingelogd");
  const key = exerciseKey(input.exerciseName);
  const weight = input.weightKg ?? 0;
  const reps = input.reps ?? 0;
  const volume = weight * reps;
  const oneRM = estimate1RM(weight, reps);

  // Fetch existing PR
  const { data: existingPR } = await supabase
    .from("exercise_prs")
    .select("*")
    .eq("user_id", u.user.id)
    .eq("exercise_key", key)
    .maybeSingle();

  const isPRWeight = weight > 0 && (!existingPR?.best_weight_kg || weight > Number(existingPR.best_weight_kg));
  const isPRVolume = volume > 0 && (!existingPR?.best_volume_kg || volume > Number(existingPR.best_volume_kg));
  const isPR1RM = oneRM > 0 && (!existingPR?.best_1rm_kg || oneRM > Number(existingPR.best_1rm_kg));

  const { data: setRow, error: setErr } = await supabase
    .from("workout_sets")
    .insert({
      user_id: u.user.id,
      session_id: input.sessionId,
      exercise_key: key,
      exercise_name: input.exerciseName,
      set_index: input.setIndex,
      weight_kg: input.weightKg,
      reps: input.reps,
      rest_seconds: input.restSeconds,
      estimated_1rm: oneRM,
      is_pr_weight: isPRWeight,
      is_pr_volume: isPRVolume,
      is_pr_1rm: isPR1RM,
    })
    .select("id")
    .single();
  if (setErr) throw setErr;

  if (isPRWeight || isPRVolume || isPR1RM || !existingPR) {
    const now = new Date().toISOString();
    await supabase.from("exercise_prs").upsert(
      {
        user_id: u.user.id,
        exercise_key: key,
        exercise_name: input.exerciseName,
        best_weight_kg: isPRWeight ? weight : existingPR?.best_weight_kg ?? weight,
        best_weight_reps: isPRWeight ? reps : existingPR?.best_weight_reps ?? reps,
        best_weight_at: isPRWeight ? now : existingPR?.best_weight_at ?? now,
        best_volume_kg: isPRVolume ? volume : existingPR?.best_volume_kg ?? volume,
        best_volume_at: isPRVolume ? now : existingPR?.best_volume_at ?? now,
        best_1rm_kg: isPR1RM ? oneRM : existingPR?.best_1rm_kg ?? oneRM,
        best_1rm_at: isPR1RM ? now : existingPR?.best_1rm_at ?? now,
      },
      { onConflict: "user_id,exercise_key" },
    );
  }

  return { setId: setRow.id, isPRWeight, isPRVolume, isPR1RM, estimated1RM: oneRM };
}

export type SessionSummary = {
  durationSec: number;
  activeSec: number;
  totalVolumeKg: number;
  totalReps: number;
  totalSets: number;
  prCount: number;
  exercises: { name: string; sets: number; volume: number; topWeight: number }[];
};

export async function finishSession(input: {
  sessionId: string;
  startedAt: number;
  rpe: number | null;
}): Promise<SessionSummary> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Niet ingelogd");
  const { data: sets } = await supabase
    .from("workout_sets")
    .select("exercise_name, weight_kg, reps, rest_seconds, is_pr_weight, is_pr_volume, is_pr_1rm")
    .eq("session_id", input.sessionId);

  const list = sets ?? [];
  const totalVolume = list.reduce((s, x) => s + Number(x.weight_kg ?? 0) * Number(x.reps ?? 0), 0);
  const totalReps = list.reduce((s, x) => s + Number(x.reps ?? 0), 0);
  const totalRest = list.reduce((s, x) => s + Number(x.rest_seconds ?? 0), 0);
  const durationSec = Math.round((Date.now() - input.startedAt) / 1000);
  const activeSec = Math.max(0, durationSec - totalRest);
  const prCount = list.filter((x) => x.is_pr_weight || x.is_pr_volume || x.is_pr_1rm).length;

  const byEx = new Map<string, { name: string; sets: number; volume: number; topWeight: number }>();
  for (const s of list) {
    const k = s.exercise_name;
    const cur = byEx.get(k) ?? { name: k, sets: 0, volume: 0, topWeight: 0 };
    cur.sets += 1;
    cur.volume += Number(s.weight_kg ?? 0) * Number(s.reps ?? 0);
    cur.topWeight = Math.max(cur.topWeight, Number(s.weight_kg ?? 0));
    byEx.set(k, cur);
  }

  await supabase
    .from("workout_sessions")
    .update({
      ended_at: new Date().toISOString(),
      duration_seconds: durationSec,
      active_seconds: activeSec,
      total_volume_kg: totalVolume,
      total_reps: totalReps,
      rpe: input.rpe,
    })
    .eq("id", input.sessionId);

  return {
    durationSec,
    activeSec,
    totalVolumeKg: totalVolume,
    totalReps,
    totalSets: list.length,
    prCount,
    exercises: Array.from(byEx.values()),
  };
}

export async function getExerciseHistory(exerciseName: string, limit = 30) {
  const key = exerciseKey(exerciseName);
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return [];
  const { data } = await supabase
    .from("workout_sets")
    .select("weight_kg, reps, estimated_1rm, completed_at, session_id")
    .eq("user_id", u.user.id)
    .eq("exercise_key", key)
    .order("completed_at", { ascending: false })
    .limit(limit * 6);
  const rows = data ?? [];
  // Group by session, pick top weight and total volume
  const bySession = new Map<string, { date: string; topWeight: number; volume: number; top1RM: number }>();
  for (const r of rows) {
    const cur = bySession.get(r.session_id) ?? { date: r.completed_at, topWeight: 0, volume: 0, top1RM: 0 };
    const w = Number(r.weight_kg ?? 0);
    const reps = Number(r.reps ?? 0);
    cur.topWeight = Math.max(cur.topWeight, w);
    cur.volume += w * reps;
    cur.top1RM = Math.max(cur.top1RM, Number(r.estimated_1rm ?? 0));
    if (new Date(r.completed_at) < new Date(cur.date)) cur.date = r.completed_at;
    bySession.set(r.session_id, cur);
  }
  return Array.from(bySession.values())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-limit);
}
