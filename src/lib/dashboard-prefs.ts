import { useEffect, useState, useCallback } from "react";

export type DashCardId =
  | "nutrition"
  | "macros"
  | "water"
  | "steps"
  | "fasting"
  | "weight"
  | "activity"
  | "activitySummary"
  | "workout"
  | "goals";

export const DEFAULT_ORDER: DashCardId[] = [
  "nutrition",
  "activitySummary",
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
  activitySummary: "Activity summary",
  workout: "Today's workout",
  goals: "Daily goals",
};

// ----- Smart Calorie Adjustment preferences -----
export type CalorieMode = "standard" | "smart";
export type CaloriePrefs = { mode: CalorieMode; kcalPerStep: number };

const CAL_PREFS_KEY = "vita.calorie.prefs.v1";
const DEFAULT_CAL_PREFS: CaloriePrefs = { mode: "smart", kcalPerStep: 0.04 };

export function useCaloriePrefs() {
  const [prefs, setPrefs] = useState<CaloriePrefs>(() => {
    if (typeof window === "undefined") return DEFAULT_CAL_PREFS;
    try {
      const raw = localStorage.getItem(CAL_PREFS_KEY);
      return raw ? { ...DEFAULT_CAL_PREFS, ...JSON.parse(raw) } : DEFAULT_CAL_PREFS;
    } catch { return DEFAULT_CAL_PREFS; }
  });
  useEffect(() => {
    try { localStorage.setItem(CAL_PREFS_KEY, JSON.stringify(prefs)); } catch {}
  }, [prefs]);
  const setMode = useCallback((mode: CalorieMode) => setPrefs((p) => ({ ...p, mode })), []);
  const toggleMode = useCallback(() => setPrefs((p) => ({ ...p, mode: p.mode === "smart" ? "standard" : "smart" })), []);
  return { prefs, setMode, toggleMode };
}

export type CalorieBudget = {
  target: number;
  eaten: number;
  walkingBurn: number;
  workoutBurn: number;
  totalBurn: number;
  earned: number;
  allowance: number;
  remaining: number;
  net: number;
  mode: CalorieMode;
};

export function calcCalorieBudget(args: {
  target: number; eaten: number; workoutBurn: number; steps: number; prefs: CaloriePrefs;
}): CalorieBudget {
  const walkingBurn = Math.round(Math.max(0, args.steps) * args.prefs.kcalPerStep);
  const workoutBurn = Math.max(0, Math.round(args.workoutBurn));
  const totalBurn = walkingBurn + workoutBurn;
  const earned = args.prefs.mode === "smart" ? totalBurn : 0;
  const allowance = Math.max(0, args.target) + earned;
  const remaining = allowance - args.eaten;
  const net = args.eaten - totalBurn;
  return {
    target: args.target,
    eaten: args.eaten,
    walkingBurn, workoutBurn, totalBurn, earned, allowance, remaining, net,
    mode: args.prefs.mode,
  };
}

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
  const addEntry = useCallback((kg: number, date?: string) => {
    setLog((l) =>
      [...l, { date: date ?? new Date().toISOString(), kg }]
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-90),
    );
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
export type FastingProtocol = "12:12" | "14:10" | "16:8" | "18:6" | "20:4" | "OMAD";

export const FASTING_PROTOCOLS: { id: FastingProtocol; fast: number; eat: number; label: string; desc: string }[] = [
  { id: "12:12", fast: 12, eat: 12, label: "12:12", desc: "Beginner • balanced" },
  { id: "14:10", fast: 14, eat: 10, label: "14:10", desc: "Gentle daily fast" },
  { id: "16:8",  fast: 16, eat: 8,  label: "16:8",  desc: "Most popular" },
  { id: "18:6",  fast: 18, eat: 6,  label: "18:6",  desc: "Advanced" },
  { id: "20:4",  fast: 20, eat: 4,  label: "20:4",  desc: "Warrior diet" },
  { id: "OMAD",  fast: 23, eat: 1,  label: "OMAD",  desc: "One meal a day" },
];

export function getProtocol(id: FastingProtocol) {
  return FASTING_PROTOCOLS.find((p) => p.id === id) ?? FASTING_PROTOCOLS[2];
}

export type FastEntry = {
  id: string;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  targetMs: number;
  completed: boolean;
  protocol: FastingProtocol;
};

export type FastingState = {
  protocol: FastingProtocol;
  startedAt: string | null;
  pausedAt: string | null;
  pausedTotalMs: number;
  windowHours: number;
  streak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  history: FastEntry[];
};

const FAST_KEY = "vita.fasting.v2";

const DEFAULT_FAST: FastingState = {
  protocol: "16:8",
  startedAt: null,
  pausedAt: null,
  pausedTotalMs: 0,
  windowHours: 16,
  streak: 0,
  longestStreak: 0,
  lastCompletedDate: null,
  history: [],
};

function loadFast(): FastingState {
  if (typeof window === "undefined") return DEFAULT_FAST;
  try {
    const raw = localStorage.getItem(FAST_KEY);
    if (!raw) {
      const legacy = localStorage.getItem("vita.fasting.v1");
      if (legacy) {
        const v1 = JSON.parse(legacy);
        return { ...DEFAULT_FAST, startedAt: v1.startedAt ?? null, windowHours: v1.windowHours ?? 16, streak: v1.streak ?? 0, lastCompletedDate: v1.lastCompletedDate ?? null };
      }
      return DEFAULT_FAST;
    }
    return { ...DEFAULT_FAST, ...JSON.parse(raw) };
  } catch { return DEFAULT_FAST; }
}

export function notify(title: string, body?: string) {
  if (typeof window === "undefined") return;
  try {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    }
  } catch {}
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  if (Notification.permission === "default") return await Notification.requestPermission();
  return Notification.permission;
}

function fmtDur(ms: number) {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

export function useFasting() {
  const [state, setState] = useState<FastingState>(() => loadFast());

  useEffect(() => {
    try { localStorage.setItem(FAST_KEY, JSON.stringify(state)); } catch {}
  }, [state]);

  const setProtocol = useCallback((id: FastingProtocol) => {
    const p = getProtocol(id);
    setState((s) => ({ ...s, protocol: id, windowHours: p.fast }));
  }, []);

  const start = useCallback(() => {
    setState((s) => {
      notify("Fast started", `Goal: ${getProtocol(s.protocol).fast}h`);
      return { ...s, startedAt: new Date().toISOString(), pausedAt: null, pausedTotalMs: 0 };
    });
  }, []);

  const pause = useCallback(() => {
    setState((s) => (s.startedAt && !s.pausedAt ? { ...s, pausedAt: new Date().toISOString() } : s));
  }, []);

  const resume = useCallback(() => {
    setState((s) => {
      if (!s.pausedAt) return s;
      const add = Date.now() - new Date(s.pausedAt).getTime();
      return { ...s, pausedAt: null, pausedTotalMs: s.pausedTotalMs + add };
    });
  }, []);

  const setStartTime = useCallback((iso: string) => {
    setState((s) => ({ ...s, startedAt: iso, pausedTotalMs: 0, pausedAt: null }));
  }, []);

  const stop = useCallback(() => setState((s) => {
    if (!s.startedAt) return s;
    const proto = getProtocol(s.protocol);
    const endedAt = new Date();
    let pausedMs = s.pausedTotalMs;
    if (s.pausedAt) pausedMs += endedAt.getTime() - new Date(s.pausedAt).getTime();
    const durationMs = endedAt.getTime() - new Date(s.startedAt).getTime() - pausedMs;
    const targetMs = proto.fast * 3_600_000;
    const completed = durationMs >= targetMs;
    const today = todayKey();
    const entry: FastEntry = {
      id: (typeof crypto !== "undefined" && "randomUUID" in crypto) ? crypto.randomUUID() : String(Date.now()),
      startedAt: s.startedAt,
      endedAt: endedAt.toISOString(),
      durationMs,
      targetMs,
      completed,
      protocol: s.protocol,
    };
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    const sameDay = s.lastCompletedDate === today;
    const consecutive = s.lastCompletedDate === yesterday;
    const newStreak = completed
      ? sameDay ? s.streak : consecutive ? s.streak + 1 : 1
      : s.streak;
    notify(completed ? "Fast complete!" : "Fast ended", `${fmtDur(durationMs)} • ${completed ? "Goal reached" : "Below goal"}`);
    return {
      ...s,
      startedAt: null,
      pausedAt: null,
      pausedTotalMs: 0,
      streak: newStreak,
      longestStreak: Math.max(s.longestStreak, newStreak),
      lastCompletedDate: completed ? today : s.lastCompletedDate,
      history: [entry, ...s.history].slice(0, 365),
    };
  }), []);

  const deleteEntry = useCallback((id: string) => {
    setState((s) => ({ ...s, history: s.history.filter((e) => e.id !== id) }));
  }, []);

  const updateEntry = useCallback((id: string, patch: Partial<Pick<FastEntry, "startedAt" | "endedAt">>) => {
    setState((s) => ({
      ...s,
      history: s.history.map((e) => {
        if (e.id !== id) return e;
        const startedAt = patch.startedAt ?? e.startedAt;
        const endedAt = patch.endedAt ?? e.endedAt;
        const durationMs = new Date(endedAt).getTime() - new Date(startedAt).getTime();
        return { ...e, startedAt, endedAt, durationMs, completed: durationMs >= e.targetMs };
      }),
    }));
  }, []);

  const setWindow = useCallback((h: number) => {
    const match = FASTING_PROTOCOLS.find((p) => p.fast === h);
    if (match) setProtocol(match.id);
  }, [setProtocol]);

  return { state, start, pause, resume, stop, setProtocol, setStartTime, deleteEntry, updateEntry, setWindow };
}

