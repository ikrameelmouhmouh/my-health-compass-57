import { useCallback, useEffect, useState } from "react";
import type { Exercise } from "./workout.functions";
import type { WorkoutTemplate } from "./workout-prefs";
import { EXERCISES } from "./exercise-library";
import { supabase } from "@/integrations/supabase/client";

const ACTIVE_KEY = "fitness.session.active.v1";
const HISTORY_KEY = "fitness.sessions.v1";
const PR_KEY = "fitness.prs.v1";

async function pushWorkoutToCloud(s: FinishedSession) {
  try {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) return;
    const { data: inserted, error } = await supabase
      .from("workout_sessions")
      .insert({
        user_id: uid,
        template_id: s.templateId,
        name: s.templateName,
        started_at: s.startedAt,
        ended_at: s.endedAt,
        duration_seconds: s.durationSec,
        active_seconds: s.durationSec,
        total_volume_kg: s.totalVolume,
        total_reps: s.totalReps,
      })
      .select("id")
      .single();
    if (error || !inserted) return;
    const sessionId = inserted.id;
    const rows: Array<{
      user_id: string;
      session_id: string;
      exercise_key: string;
      exercise_name: string;
      set_index: number;
      weight_kg: number;
      reps: number;
      completed_at: string;
      is_warmup: boolean;
    }> = [];
    s.exercises.forEach((ex) => {
      ex.sets.forEach((set, idx) => {
        if (!set.done) return;
        rows.push({
          user_id: uid,
          session_id: sessionId,
          exercise_key: (ex.libraryId ?? ex.name).toLowerCase(),
          exercise_name: ex.name,
          set_index: idx,
          weight_kg: set.weight,
          reps: set.reps,
          completed_at: set.completedAt ?? s.endedAt,
          is_warmup: false,
        });
      });
    });
    if (rows.length > 0) {
      await supabase.from("workout_sets").insert(rows);
    }
  } catch {
    /* offline — blijft in localStorage */
  }
}

export type SessionSet = {
  weight: number;
  reps: number;
  done: boolean;
  completedAt?: string;
};

export type SessionExercise = {
  libraryId?: string;
  name: string;
  equipment?: string;
  image?: string;
  sets: SessionSet[];
  restSec?: number;
  notes?: string;
  rpe?: number;
};

export type ActiveSession = {
  id: string;
  templateId: string;
  templateName: string;
  focus?: string;
  startedAt: string;
  endedAt?: string;
  exercises: SessionExercise[];
  /** ISO time when paused; undefined when running. */
  pausedAt?: string;
  /** Accumulated paused seconds (excluding the current pause window). */
  totalPausedSec: number;
};

export type FinishedSession = ActiveSession & {
  endedAt: string;
  durationSec: number;
  totalVolume: number;
  totalReps: number;
  totalSets: number;
};

export type PRRecord = {
  exerciseName: string;
  weight: number;
  reps: number;
  volume: number;
  achievedAt: string;
  sessionId: string;
};

function parseFirstInt(s: string | undefined, fallback = 0): number {
  if (!s) return fallback;
  const m = String(s).match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : fallback;
}

function findLibraryExercise(name: string) {
  const n = name.toLowerCase();
  return EXERCISES.find((e) => e.name.toLowerCase() === n)
    ?? EXERCISES.find((e) => n.includes(e.name.toLowerCase()) || e.name.toLowerCase().includes(n));
}

export function buildSessionFromTemplate(tpl: WorkoutTemplate): ActiveSession {
  const exercises: SessionExercise[] = tpl.exercises.map((ex: Exercise) => {
    const lib = findLibraryExercise(ex.name);
    const reps = parseFirstInt(ex.reps, 10);
    const weight = parseFirstInt(ex.suggestedWeight, 0);
    const setCount = Math.max(1, Number(ex.sets) || 1);
    return {
      libraryId: lib?.id,
      name: ex.name,
      equipment: lib?.equipment,
      image: lib?.image,
      sets: Array.from({ length: setCount }, () => ({ weight, reps, done: false })),
      restSec: 90,
    };
  });
  return {
    id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    templateId: tpl.id,
    templateName: tpl.name,
    focus: tpl.focus,
    startedAt: new Date().toISOString(),
    exercises,
    totalPausedSec: 0,
  };
}

function readActive(): ActiveSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActiveSession;
    if (typeof parsed.totalPausedSec !== "number") parsed.totalPausedSec = 0;
    return parsed;
  } catch {
    return null;
  }
}
function writeActive(v: ActiveSession | null) {
  if (typeof window === "undefined") return;
  if (v === null) localStorage.removeItem(ACTIVE_KEY);
  else localStorage.setItem(ACTIVE_KEY, JSON.stringify(v));
}

function readHistory(): FinishedSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as FinishedSession[]) : [];
  } catch {
    return [];
  }
}
function writeHistory(v: FinishedSession[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(v));
}

function readPRs(): Record<string, PRRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PR_KEY);
    return raw ? (JSON.parse(raw) as Record<string, PRRecord>) : {};
  } catch {
    return {};
  }
}
function writePRs(v: Record<string, PRRecord>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PR_KEY, JSON.stringify(v));
}

/** Compute elapsed seconds excluding paused time. */
export function computeElapsedSec(session: ActiveSession, now: number = Date.now()): number {
  const started = new Date(session.startedAt).getTime();
  let paused = session.totalPausedSec || 0;
  if (session.pausedAt) {
    paused += Math.max(0, Math.round((now - new Date(session.pausedAt).getTime()) / 1000));
  }
  return Math.max(0, Math.round((now - started) / 1000) - paused);
}

export function useActiveSession() {
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSession(readActive());
    setLoaded(true);
  }, []);

  const start = useCallback((s: ActiveSession) => {
    writeActive(s);
    setSession(s);
  }, []);

  const update = useCallback((updater: (s: ActiveSession) => ActiveSession) => {
    setSession((cur) => {
      if (!cur) return cur;
      const next = updater(cur);
      writeActive(next);
      return next;
    });
  }, []);

  const pause = useCallback(() => {
    setSession((cur) => {
      if (!cur || cur.pausedAt) return cur;
      const next = { ...cur, pausedAt: new Date().toISOString() };
      writeActive(next);
      return next;
    });
  }, []);

  const resume = useCallback(() => {
    setSession((cur) => {
      if (!cur || !cur.pausedAt) return cur;
      const addedSec = Math.max(
        0,
        Math.round((Date.now() - new Date(cur.pausedAt).getTime()) / 1000),
      );
      const next = {
        ...cur,
        pausedAt: undefined,
        totalPausedSec: (cur.totalPausedSec || 0) + addedSec,
      };
      writeActive(next);
      return next;
    });
  }, []);

  const cancel = useCallback(() => {
    writeActive(null);
    setSession(null);
  }, []);

  const finish = useCallback((): FinishedSession | null => {
    const cur = readActive();
    if (!cur) return null;
    // If still paused at finish time, fold the open pause into totalPausedSec.
    let totalPausedSec = cur.totalPausedSec || 0;
    if (cur.pausedAt) {
      totalPausedSec += Math.max(
        0,
        Math.round((Date.now() - new Date(cur.pausedAt).getTime()) / 1000),
      );
    }
    const endedAt = new Date().toISOString();
    const rawDuration = Math.max(
      0,
      Math.round((new Date(endedAt).getTime() - new Date(cur.startedAt).getTime()) / 1000),
    );
    const durationSec = Math.max(0, rawDuration - totalPausedSec);
    let totalVolume = 0;
    let totalReps = 0;
    let totalSets = 0;
    cur.exercises.forEach((e) =>
      e.sets.forEach((s) => {
        if (s.done) {
          totalVolume += s.weight * s.reps;
          totalReps += s.reps;
          totalSets += 1;
        }
      }),
    );
    const finished: FinishedSession = {
      ...cur,
      pausedAt: undefined,
      totalPausedSec,
      endedAt,
      durationSec,
      totalVolume,
      totalReps,
      totalSets,
    };
    const history = readHistory();
    writeHistory([finished, ...history].slice(0, 200));
    recordPRsFromSession(finished);
    writeActive(null);
    setSession(null);
    return finished;
  }, []);

  return { session, loaded, start, update, pause, resume, cancel, finish };
}

export function useSessionHistory() {
  const [history, setHistory] = useState<FinishedSession[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setHistory(readHistory());
    setLoaded(true);
  }, []);

  return { history, loaded };
}

/** Returns previous best (max weight × reps in a single set) for a given exercise name. */
export function previousBestFor(name: string, beforeSessionId?: string): { weight: number; reps: number } | null {
  const history = readHistory();
  let best: { weight: number; reps: number; volume: number } | null = null;
  for (const sess of history) {
    if (beforeSessionId && sess.id === beforeSessionId) continue;
    for (const ex of sess.exercises) {
      if (ex.name.toLowerCase() !== name.toLowerCase()) continue;
      for (const s of ex.sets) {
        if (!s.done) continue;
        const vol = s.weight * s.reps;
        if (!best || vol > best.volume) best = { weight: s.weight, reps: s.reps, volume: vol };
      }
    }
  }
  return best ? { weight: best.weight, reps: best.reps } : null;
}

export function getPR(name: string): PRRecord | null {
  const map = readPRs();
  return map[name.toLowerCase()] ?? null;
}

function recordPRsFromSession(finished: FinishedSession) {
  const map = readPRs();
  let changed = false;
  for (const ex of finished.exercises) {
    const key = ex.name.toLowerCase();
    const current = map[key];
    for (const s of ex.sets) {
      if (!s.done) continue;
      const volume = s.weight * s.reps;
      if (!current || volume > current.volume) {
        map[key] = {
          exerciseName: ex.name,
          weight: s.weight,
          reps: s.reps,
          volume,
          achievedAt: finished.endedAt,
          sessionId: finished.id,
        };
        changed = true;
      }
    }
  }
  if (changed) writePRs(map);
}

export function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Module-level audio context, unlocked on first user gesture. iOS Safari
 *  blocks audio that isn't kicked off inside a tap; priming here lets later
 *  timer beeps actually play. */
let _audioCtx: AudioContext | null = null;
function getAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (_audioCtx) return _audioCtx;
  const AC: typeof AudioContext | undefined =
    (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext
    ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  try {
    _audioCtx = new AC();
  } catch {
    _audioCtx = null;
  }
  return _audioCtx;
}

/** Call inside a user gesture (tap) to satisfy iOS audio unlock. */
export function primeAudio() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    // Play a near-silent buffer so iOS marks the context as unlocked.
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
  } catch {
    /* ignore */
  }
}

/** Short beep + optional vibration. Safe on browsers that don't support either. */
export function playRestEndCue() {
  if (typeof window === "undefined") return;
  try {
    const ctx = getAudioCtx();
    if (ctx) {
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      const playBeep = (offset: number) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.value = 880;
        g.gain.value = 0.0001;
        o.connect(g).connect(ctx.destination);
        const start = ctx.currentTime + offset;
        g.gain.exponentialRampToValueAtTime(0.3, start + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, start + 0.25);
        o.start(start);
        o.stop(start + 0.3);
      };
      playBeep(0);
      playBeep(0.35);
    }
  } catch {
    /* ignore */
  }
  try {
    navigator.vibrate?.([180, 80, 180]);
  } catch {
    /* ignore */
  }
}


export function vibrateShort() {
  try {
    if (typeof navigator !== "undefined") navigator.vibrate?.(40);
  } catch {
    /* ignore */
  }
}
