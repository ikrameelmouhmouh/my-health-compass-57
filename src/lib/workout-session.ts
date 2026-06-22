import { useCallback, useEffect, useState } from "react";
import type { Exercise } from "./workout.functions";
import type { WorkoutTemplate } from "./workout-prefs";
import { EXERCISES } from "./exercise-library";

const ACTIVE_KEY = "fitness.session.active.v1";
const HISTORY_KEY = "fitness.sessions.v1";

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
};

export type ActiveSession = {
  id: string;
  templateId: string;
  templateName: string;
  focus?: string;
  startedAt: string;
  endedAt?: string;
  exercises: SessionExercise[];
};

export type FinishedSession = ActiveSession & {
  endedAt: string;
  durationSec: number;
  totalVolume: number;
  totalReps: number;
  totalSets: number;
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
    };
  });
  return {
    id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    templateId: tpl.id,
    templateName: tpl.name,
    focus: tpl.focus,
    startedAt: new Date().toISOString(),
    exercises,
  };
}

function readActive(): ActiveSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    return raw ? (JSON.parse(raw) as ActiveSession) : null;
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

  const cancel = useCallback(() => {
    writeActive(null);
    setSession(null);
  }, []);

  const finish = useCallback((): FinishedSession | null => {
    const cur = readActive();
    if (!cur) return null;
    const endedAt = new Date().toISOString();
    const durationSec = Math.max(
      0,
      Math.round((new Date(endedAt).getTime() - new Date(cur.startedAt).getTime()) / 1000),
    );
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
      endedAt,
      durationSec,
      totalVolume,
      totalReps,
      totalSets,
    };
    const history = readHistory();
    writeHistory([finished, ...history].slice(0, 200));
    writeActive(null);
    setSession(null);
    return finished;
  }, []);

  return { session, loaded, start, update, cancel, finish };
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

export function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
