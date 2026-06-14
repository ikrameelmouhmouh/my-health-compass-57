import { useEffect, useState, useCallback } from "react";

export type DashCardId =
  | "nutrition"
  | "macros"
  | "water"
  | "steps"
  | "fasting"
  | "weight"
  | "activity"
  | "workout"
  | "goals";

export const DEFAULT_ORDER: DashCardId[] = [
  "nutrition",
  "fasting",
  "workout",
  "water",
  "steps",
  "activity",
  "weight",
  "macros",
  "goals",
];

export const DEFAULT_HIDDEN: DashCardId[] = ["macros"];

export const CARD_LABELS: Record<DashCardId, string> = {
  nutrition: "Nutrition",
  macros: "Macros",
  water: "Water",
  steps: "Steps",
  fasting: "Fasting",
  weight: "Weight",
  activity: "Activity",
  workout: "Today's workout",
  goals: "Daily goals",
};

type Prefs = { order: DashCardId[]; hidden: DashCardId[] };

const KEY = "vita.dashboard.prefs.v2";

function load(): Prefs {
  if (typeof window === "undefined") return { order: DEFAULT_ORDER, hidden: DEFAULT_HIDDEN };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { order: DEFAULT_ORDER, hidden: DEFAULT_HIDDEN };
    const p = JSON.parse(raw) as Prefs;
    const order = [...p.order.filter((c) => DEFAULT_ORDER.includes(c))];
    for (const c of DEFAULT_ORDER) if (!order.includes(c)) order.push(c);
    return { order, hidden: p.hidden?.filter((c) => DEFAULT_ORDER.includes(c)) ?? [] };
  } catch {
    return { order: DEFAULT_ORDER, hidden: DEFAULT_HIDDEN };
  }
}

export function useDashboardPrefs() {
  const [prefs, setPrefs] = useState<Prefs>(() => load());

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch {}
  }, [prefs]);

  const move = useCallback((id: DashCardId, dir: -1 | 1) => {
    setPrefs((p) => {
      const i = p.order.indexOf(id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= p.order.length) return p;
      const order = [...p.order];
      [order[i], order[j]] = [order[j], order[i]];
      return { ...p, order };
    });
  }, []);

  const toggle = useCallback((id: DashCardId) => {
    setPrefs((p) => ({
      ...p,
      hidden: p.hidden.includes(id) ? p.hidden.filter((c) => c !== id) : [...p.hidden, id],
    }));
  }, []);

  const reset = useCallback(() => setPrefs({ order: DEFAULT_ORDER, hidden: DEFAULT_HIDDEN }), []);

  return { prefs, move, toggle, reset };
}

// ----- Local daily tracking (placeholder until backend tracking ships) -----
const todayKey = () => new Date().toISOString().slice(0, 10);

type DayLog = {
  date: string;
  waterMl: number;
  steps: number;
  caloriesIn: number;
  caloriesOut: number;
  activeMin: number;
  protein: number;
  carbs: number;
  fat: number;
  meals: number;
  workoutCompleted: boolean;
};

const EMPTY_DAY = (): DayLog => ({
  date: todayKey(),
  waterMl: 0,
  steps: 0,
  caloriesIn: 0,
  caloriesOut: 0,
  activeMin: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  meals: 0,
  workoutCompleted: false,
});

const DAY_KEY = "vita.day.v1";

function loadDay(): DayLog {
  if (typeof window === "undefined") return EMPTY_DAY();
  try {
    const raw = localStorage.getItem(DAY_KEY);
    if (!raw) return EMPTY_DAY();
    const d = JSON.parse(raw) as DayLog;
    if (d.date !== todayKey()) return EMPTY_DAY();
    return { ...EMPTY_DAY(), ...d };
  } catch {
    return EMPTY_DAY();
  }
}

export function useDayLog() {
  const [day, setDay] = useState<DayLog>(() => loadDay());

  useEffect(() => {
    try { localStorage.setItem(DAY_KEY, JSON.stringify(day)); } catch {}
  }, [day]);

  const update = useCallback((patch: Partial<DayLog>) => {
    setDay((d) => ({ ...d, ...patch }));
  }, []);

  const addWater = useCallback((ml: number) => {
    setDay((d) => ({ ...d, waterMl: Math.max(0, d.waterMl + ml) }));
  }, []);

  const addMeal = useCallback((m: { kcal: number; protein: number; carbs: number; fat: number }) => {
    setDay((d) => ({
      ...d,
      caloriesIn: d.caloriesIn + m.kcal,
      protein: d.protein + m.protein,
      carbs: d.carbs + m.carbs,
      fat: d.fat + m.fat,
      meals: d.meals + 1,
    }));
  }, []);

  return { day, update, addWater, addMeal };
}

// ----- Weight log -----
export type WeightEntry = { date: string; kg: number };
const WEIGHT_KEY = "vita.weight.v1";

export function useWeightLog() {
  const [log, setLog] = useState<WeightEntry[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem(WEIGHT_KEY) ?? "[]"); } catch { return []; }
  });
  useEffect(() => {
    try { localStorage.setItem(WEIGHT_KEY, JSON.stringify(log)); } catch {}
  }, [log]);
  const addEntry = useCallback((kg: number) => {
    setLog((l) => [...l, { date: new Date().toISOString(), kg }].slice(-90));
  }, []);
  return { log, addEntry };
}

// ----- Workout (local) -----
export type Workout = {
  name: string;
  type: string;
  time?: string;
  durationMin: number;
};
const WORKOUT_KEY = "vita.workout.today.v1";

export function useTodayWorkout() {
  const [workout, setWorkout] = useState<Workout | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(WORKOUT_KEY);
      if (!raw) return null;
      const w = JSON.parse(raw) as Workout & { date: string };
      if (w.date !== todayKey()) return null;
      return w;
    } catch { return null; }
  });
  const save = useCallback((w: Workout | null) => {
    setWorkout(w);
    try {
      if (w) localStorage.setItem(WORKOUT_KEY, JSON.stringify({ ...w, date: todayKey() }));
      else localStorage.removeItem(WORKOUT_KEY);
    } catch {}
  }, []);
  return { workout, save };
}

// ----- Fasting -----
export type FastingState = { startedAt: string | null; windowHours: number; streak: number; lastCompletedDate: string | null };
const FAST_KEY = "vita.fasting.v1";

export function useFasting() {
  const [state, setState] = useState<FastingState>(() => {
    if (typeof window === "undefined") return { startedAt: null, windowHours: 16, streak: 0, lastCompletedDate: null };
    try {
      const raw = localStorage.getItem(FAST_KEY);
      if (!raw) return { startedAt: null, windowHours: 16, streak: 0, lastCompletedDate: null };
      return JSON.parse(raw);
    } catch { return { startedAt: null, windowHours: 16, streak: 0, lastCompletedDate: null }; }
  });
  useEffect(() => {
    try { localStorage.setItem(FAST_KEY, JSON.stringify(state)); } catch {}
  }, [state]);
  const start = useCallback(() => setState((s) => ({ ...s, startedAt: new Date().toISOString() })), []);
  const stop = useCallback(() => setState((s) => {
    if (!s.startedAt) return s;
    const hours = (Date.now() - new Date(s.startedAt).getTime()) / 3_600_000;
    const completed = hours >= s.windowHours;
    const today = todayKey();
    return {
      ...s,
      startedAt: null,
      streak: completed ? (s.lastCompletedDate === today ? s.streak : s.streak + 1) : s.streak,
      lastCompletedDate: completed ? today : s.lastCompletedDate,
    };
  }), []);
  const setWindow = useCallback((h: number) => setState((s) => ({ ...s, windowHours: h })), []);
  return { state, start, stop, setWindow };
}
