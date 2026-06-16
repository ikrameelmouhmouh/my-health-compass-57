import { useCallback, useEffect, useState } from "react";
import type { WizardInputT, WorkoutPlan } from "./workout.functions";

const KEY = "fitness.plan.v1";

export type StoredPlan = {
  wizard: WizardInputT;
  plan: WorkoutPlan;
  createdAt: string;
  completedDays: string[]; // ISO dates of completed workouts
};

function read(): StoredPlan | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredPlan) : null;
  } catch {
    return null;
  }
}

function write(v: StoredPlan | null) {
  if (typeof window === "undefined") return;
  if (v === null) localStorage.removeItem(KEY);
  else localStorage.setItem(KEY, JSON.stringify(v));
}

export function useWorkoutPlan() {
  const [stored, setStored] = useState<StoredPlan | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setStored(read());
    setLoaded(true);
  }, []);

  const save = useCallback((wizard: WizardInputT, plan: WorkoutPlan) => {
    const next: StoredPlan = {
      wizard,
      plan,
      createdAt: new Date().toISOString(),
      completedDays: [],
    };
    write(next);
    setStored(next);
  }, []);

  const clear = useCallback(() => {
    write(null);
    setStored(null);
  }, []);

  const toggleCompleted = useCallback((dayName: string) => {
    setStored((cur) => {
      if (!cur) return cur;
      const today = new Date().toISOString().slice(0, 10);
      const key = `${today}:${dayName}`;
      const next = cur.completedDays.includes(key)
        ? { ...cur, completedDays: cur.completedDays.filter((k) => k !== key) }
        : { ...cur, completedDays: [...cur.completedDays, key] };
      write(next);
      return next;
    });
  }, []);

  return { stored, loaded, save, clear, toggleCompleted };
}
