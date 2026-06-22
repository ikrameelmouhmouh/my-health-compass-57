import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

async function pushActivityToCloud(s: FinishedActivitySession) {
  try {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) return;
    await supabase.from("activity_sessions").insert({
      id: s.id,
      user_id: uid,
      activity_id: s.activityId,
      activity_name: s.activityName,
      started_at: s.startedAt,
      ended_at: s.endedAt,
      duration_seconds: s.durationSec,
      paused_seconds: s.pausedSec,
      kcal: s.kcal || null,
      heart_rate_avg: s.heartRateAvg,
      heart_rate_max: s.heartRateMax,
      distance_m: s.distanceM,
      source: s.source,
      notes: s.note ?? null,
    });
  } catch {
    /* offline — blijft in localStorage */
  }
}

const ACTIVE_KEY = "fitness.activity-session.active.v1";
const HISTORY_KEY = "fitness.activity-sessions.v1";

export type ActivityIntensity = "easy" | "normal" | "intense";

export const INTENSITY_MULT: Record<ActivityIntensity, number> = {
  easy: 0.8,
  normal: 1,
  intense: 1.25,
};

export type ActiveActivitySession = {
  id: string;
  activityId: string;
  activityName: string;
  kcalPerHour: number;
  intensity: ActivityIntensity;
  weightKg: number;
  startedAt: string;
  pausedAt?: string;
  totalPausedSec: number;
};

export type FinishedActivitySession = {
  id: string;
  activityId: string;
  activityName: string;
  intensity: ActivityIntensity;
  startedAt: string;
  endedAt: string;
  durationSec: number;
  pausedSec: number;
  kcal: number;
  /** Optional HealthKit fields, null until Apple Watch integration. */
  heartRateAvg: number | null;
  heartRateMax: number | null;
  distanceM: number | null;
  source: "estimate" | "healthkit";
  note?: string;
};

function readActive(): ActiveActivitySession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActiveActivitySession;
    if (typeof parsed.totalPausedSec !== "number") parsed.totalPausedSec = 0;
    return parsed;
  } catch {
    return null;
  }
}
function writeActive(v: ActiveActivitySession | null) {
  if (typeof window === "undefined") return;
  if (v === null) localStorage.removeItem(ACTIVE_KEY);
  else localStorage.setItem(ACTIVE_KEY, JSON.stringify(v));
}

function readHistory(): FinishedActivitySession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as FinishedActivitySession[]) : [];
  } catch {
    return [];
  }
}
function writeHistory(v: FinishedActivitySession[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(v));
}

export function computeElapsedSec(s: ActiveActivitySession, now = Date.now()): number {
  const started = new Date(s.startedAt).getTime();
  let paused = s.totalPausedSec || 0;
  if (s.pausedAt) {
    paused += Math.max(0, Math.round((now - new Date(s.pausedAt).getTime()) / 1000));
  }
  return Math.max(0, Math.round((now - started) / 1000) - paused);
}

export function estimateKcal(s: Pick<ActiveActivitySession, "kcalPerHour" | "intensity" | "weightKg">, elapsedSec: number): number {
  const mult = INTENSITY_MULT[s.intensity] ?? 1;
  const weightFactor = (s.weightKg || 70) / 70;
  return Math.round((s.kcalPerHour * mult * weightFactor) * (elapsedSec / 3600));
}

export function formatTimer(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function useActiveActivitySession() {
  const [session, setSession] = useState<ActiveActivitySession | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSession(readActive());
    setLoaded(true);
  }, []);

  const start = useCallback((init: Omit<ActiveActivitySession, "id" | "startedAt" | "totalPausedSec">) => {
    const s: ActiveActivitySession = {
      ...init,
      id: crypto.randomUUID(),
      startedAt: new Date().toISOString(),
      totalPausedSec: 0,
    };
    writeActive(s);
    setSession(s);
    return s;
  }, []);

  const pause = useCallback(() => {
    setSession((curr) => {
      if (!curr || curr.pausedAt) return curr;
      const next = { ...curr, pausedAt: new Date().toISOString() };
      writeActive(next);
      return next;
    });
  }, []);

  const resume = useCallback(() => {
    setSession((curr) => {
      if (!curr || !curr.pausedAt) return curr;
      const pausedMs = Date.now() - new Date(curr.pausedAt).getTime();
      const next = {
        ...curr,
        pausedAt: undefined,
        totalPausedSec: curr.totalPausedSec + Math.max(0, Math.round(pausedMs / 1000)),
      };
      writeActive(next);
      return next;
    });
  }, []);

  const cancel = useCallback(() => {
    writeActive(null);
    setSession(null);
  }, []);

  const finish = useCallback((): FinishedActivitySession | null => {
    const curr = readActive();
    if (!curr) return null;
    // ensure paused time is flushed
    let totalPaused = curr.totalPausedSec;
    if (curr.pausedAt) {
      totalPaused += Math.max(0, Math.round((Date.now() - new Date(curr.pausedAt).getTime()) / 1000));
    }
    const endedAt = new Date().toISOString();
    const durationSec = Math.max(
      0,
      Math.round((Date.now() - new Date(curr.startedAt).getTime()) / 1000) - totalPaused,
    );
    const kcal = estimateKcal(curr, durationSec);
    const finished: FinishedActivitySession = {
      id: curr.id,
      activityId: curr.activityId,
      activityName: curr.activityName,
      intensity: curr.intensity,
      startedAt: curr.startedAt,
      endedAt,
      durationSec,
      pausedSec: totalPaused,
      kcal,
      heartRateAvg: null,
      heartRateMax: null,
      distanceM: null,
      source: "estimate",
    };
    const hist = readHistory();
    hist.unshift(finished);
    writeHistory(hist);
    writeActive(null);
    setSession(null);
    return finished;
  }, []);

  return { session, loaded, start, pause, resume, cancel, finish };
}

export function listActivitySessions(): FinishedActivitySession[] {
  return readHistory();
}

export function updateActivitySession(id: string, patch: Partial<FinishedActivitySession>) {
  const hist = readHistory();
  const idx = hist.findIndex((s) => s.id === id);
  if (idx === -1) return;
  hist[idx] = { ...hist[idx], ...patch };
  writeHistory(hist);
}

export function deleteActivitySession(id: string) {
  writeHistory(readHistory().filter((s) => s.id !== id));
}
