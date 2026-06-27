import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export type Badge = {
  id: string;
  name: string;
  description: string;
  criteria: string;
  icon: string; // emoji
  check: (s: RetentionStats) => boolean;
  progress: (s: RetentionStats) => { current: number; target: number; unit?: string };
};

export type RetentionStats = {
  totalWorkouts: number;
  currentStreak: number;
  longestStreak: number;
  thisWeekWorkouts: number;
  thisWeekVolumeKg: number;
  thisWeekMinutes: number;
  daysActiveThisWeek: number;
  totalVolumeKg: number;
};

export const BADGES: Badge[] = [
  { id: "first-workout", name: "Eerste stap", description: "Voltooi je eerste workout", criteria: "Voltooi 1 workout van begin tot eind.", icon: "🌱", check: (s) => s.totalWorkouts >= 1, progress: (s) => ({ current: Math.min(s.totalWorkouts, 1), target: 1, unit: "workout" }) },
  { id: "workouts-5", name: "Op dreef", description: "5 workouts voltooid", criteria: "Voltooi in totaal 5 workouts.", icon: "⚡", check: (s) => s.totalWorkouts >= 5, progress: (s) => ({ current: Math.min(s.totalWorkouts, 5), target: 5, unit: "workouts" }) },
  { id: "workouts-25", name: "Toegewijd", description: "25 workouts voltooid", criteria: "Voltooi in totaal 25 workouts.", icon: "🔥", check: (s) => s.totalWorkouts >= 25, progress: (s) => ({ current: Math.min(s.totalWorkouts, 25), target: 25, unit: "workouts" }) },
  { id: "workouts-100", name: "Centurion", description: "100 workouts voltooid", criteria: "Voltooi in totaal 100 workouts.", icon: "🏆", check: (s) => s.totalWorkouts >= 100, progress: (s) => ({ current: Math.min(s.totalWorkouts, 100), target: 100, unit: "workouts" }) },
  { id: "streak-3", name: "3-daagse streak", description: "3 dagen op rij actief", criteria: "Train 3 dagen achter elkaar zonder een dag over te slaan.", icon: "✨", check: (s) => s.longestStreak >= 3, progress: (s) => ({ current: Math.min(s.longestStreak, 3), target: 3, unit: "dagen" }) },
  { id: "streak-7", name: "Volle week", description: "7 dagen op rij actief", criteria: "Train 7 dagen op rij.", icon: "🌟", check: (s) => s.longestStreak >= 7, progress: (s) => ({ current: Math.min(s.longestStreak, 7), target: 7, unit: "dagen" }) },
  { id: "streak-30", name: "Onverstoorbaar", description: "30 dagen streak", criteria: "Houd een streak vol van 30 dagen achter elkaar.", icon: "💎", check: (s) => s.longestStreak >= 30, progress: (s) => ({ current: Math.min(s.longestStreak, 30), target: 30, unit: "dagen" }) },
  { id: "volume-10k", name: "10.000 kg", description: "Totaal volume bereikt", criteria: "Til in totaal 10.000 kg over al je workouts (sets × reps × gewicht).", icon: "🏋️", check: (s) => s.totalVolumeKg >= 10000, progress: (s) => ({ current: Math.min(s.totalVolumeKg, 10000), target: 10000, unit: "kg" }) },
  { id: "week-4", name: "4× per week", description: "4 workouts in één week", criteria: "Voltooi 4 workouts binnen dezelfde week (ma–zo).", icon: "📅", check: (s) => s.thisWeekWorkouts >= 4, progress: (s) => ({ current: Math.min(s.thisWeekWorkouts, 4), target: 4, unit: "workouts" }) },
];

function ymd(d: Date | string): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toISOString().slice(0, 10);
}

function startOfWeek(d = new Date()): Date {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  const day = (dt.getDay() + 6) % 7; // Mon=0
  dt.setDate(dt.getDate() - day);
  return dt;
}

export function computeStats(sessions: Array<{ started_at: string; duration_seconds: number | null; total_volume_kg: number | null }>): RetentionStats {
  const ended = sessions.filter((s) => s.started_at);
  const days = Array.from(new Set(ended.map((s) => ymd(s.started_at)))).sort();
  // streaks
  let longest = 0, current = 0, prev: string | null = null;
  for (const d of days) {
    if (!prev) { current = 1; }
    else {
      const diff = (new Date(d).getTime() - new Date(prev).getTime()) / 86_400_000;
      current = diff === 1 ? current + 1 : 1;
    }
    longest = Math.max(longest, current);
    prev = d;
  }
  const today = ymd(new Date());
  const yesterday = ymd(new Date(Date.now() - 86_400_000));
  const last = days[days.length - 1];
  const currentStreak = last === today || last === yesterday ? current : 0;

  const weekStart = startOfWeek();
  const inWeek = ended.filter((s) => new Date(s.started_at) >= weekStart);
  const thisWeekWorkouts = inWeek.length;
  const thisWeekVolumeKg = inWeek.reduce((a, s) => a + (s.total_volume_kg ?? 0), 0);
  const thisWeekMinutes = Math.round(inWeek.reduce((a, s) => a + (s.duration_seconds ?? 0), 0) / 60);
  const daysActiveThisWeek = new Set(inWeek.map((s) => ymd(s.started_at))).size;
  const totalVolumeKg = ended.reduce((a, s) => a + (s.total_volume_kg ?? 0), 0);

  return {
    totalWorkouts: ended.length,
    currentStreak,
    longestStreak: longest,
    thisWeekWorkouts,
    thisWeekVolumeKg: Math.round(thisWeekVolumeKg),
    thisWeekMinutes,
    daysActiveThisWeek,
    totalVolumeKg: Math.round(totalVolumeKg),
  };
}

export function useRetention(userId: string | undefined) {
  const qc = useQueryClient();
  const sessionsQ = useQuery({
    queryKey: ["retention", "sessions", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workout_sessions")
        .select("started_at,duration_seconds,total_volume_kg")
        .eq("user_id", userId!)
        .order("started_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const badgesQ = useQuery({
    queryKey: ["retention", "badges", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_badges")
        .select("badge_id,earned_at")
        .eq("user_id", userId!);
      if (error) throw error;
      return data ?? [];
    },
  });

  const stats = sessionsQ.data ? computeStats(sessionsQ.data) : null;

  // auto-award newly earned badges
  useEffect(() => {
    if (!stats || !userId || !badgesQ.data) return;
    const earned = new Set(badgesQ.data.map((b) => b.badge_id));
    const toAward = BADGES.filter((b) => b.check(stats) && !earned.has(b.id));
    if (toAward.length === 0) return;
    (async () => {
      await supabase.from("user_badges").insert(toAward.map((b) => ({ user_id: userId, badge_id: b.id })));
      qc.invalidateQueries({ queryKey: ["retention", "badges", userId] });
    })();
  }, [stats, userId, badgesQ.data, qc]);

  // week breakdown by day
  const weekDays = (() => {
    const start = startOfWeek();
    const out: Array<{ date: string; label: string; workouts: number; volumeKg: number }> = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const key = ymd(d);
      const day = (sessionsQ.data ?? []).filter((s) => ymd(s.started_at) === key);
      out.push({
        date: key,
        label: ["M", "D", "W", "D", "V", "Z", "Z"][i],
        workouts: day.length,
        volumeKg: Math.round(day.reduce((a, s) => a + (s.total_volume_kg ?? 0), 0)),
      });
    }
    return out;
  })();

  return {
    loading: sessionsQ.isLoading || badgesQ.isLoading,
    stats,
    weekDays,
    earnedBadgeIds: new Set((badgesQ.data ?? []).map((b) => b.badge_id)),
  };
}
