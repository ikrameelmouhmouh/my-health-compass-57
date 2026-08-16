import { todayLocalKey, localDayKey } from "@/lib/local-date";
import { useCallback, useEffect, useState } from "react";
import type { Exercise, WizardInputT, WorkoutPlan } from "./workout.functions";

const KEY = "fitness.plan.v1";
const TKEY = "fitness.templates.v1";

export type StoredPlan = {
  wizard: WizardInputT;
  plan: WorkoutPlan;
  createdAt: string;
  completedDays: string[];
};

export type WorkoutTemplate = {
  id: string;
  name: string;
  day?: string;
  focus?: string;
  exercises: Exercise[];
  createdAt: string;
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

function readTemplates(): WorkoutTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TKEY);
    return raw ? (JSON.parse(raw) as WorkoutTemplate[]) : [];
  } catch {
    return [];
  }
}
const TEMPLATES_EVENT = "alyva:templates-changed";

function writeTemplates(v: WorkoutTemplate[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TKEY, JSON.stringify(v));
  window.dispatchEvent(new CustomEvent(TEMPLATES_EVENT));
}


export function useWorkoutPlan() {
  const [stored, setStored] = useState<StoredPlan | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setStored(read());
    setLoaded(true);
  }, []);

  const save = useCallback((wizard: WizardInputT, plan: WorkoutPlan) => {
    const next: StoredPlan = { wizard, plan, createdAt: new Date().toISOString(), completedDays: [] };
    write(next);
    setStored(next);
  }, []);

  const clear = useCallback(() => { write(null); setStored(null); }, []);

  const toggleCompleted = useCallback((dayName: string) => {
    setStored((cur) => {
      if (!cur) return cur;
      const today = todayLocalKey();
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

export function useTemplates() {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTemplates(readTemplates());
    setLoaded(true);
    const sync = () => setTemplates(readTemplates());
    window.addEventListener(TEMPLATES_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(TEMPLATES_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);


  const upsert = useCallback((t: WorkoutTemplate) => {
    setTemplates((cur) => {
      const idx = cur.findIndex((x) => x.id === t.id);
      const next = idx >= 0 ? cur.map((x, i) => (i === idx ? t : x)) : [...cur, t];
      writeTemplates(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setTemplates((cur) => {
      const next = cur.filter((x) => x.id !== id);
      writeTemplates(next);
      return next;
    });
  }, []);

  const addExercises = useCallback((id: string, exercises: Exercise[]) => {
    setTemplates((cur) => {
      const next = cur.map((x) => (x.id === id ? { ...x, exercises: [...x.exercises, ...exercises] } : x));
      writeTemplates(next);
      return next;
    });
  }, []);

  return { templates, loaded, upsert, remove, addExercises };
}

export function newTemplate(partial: Partial<WorkoutTemplate> = {}): WorkoutTemplate {
  return {
    id: crypto.randomUUID(),
    name: partial.name ?? "Nieuwe training",
    day: partial.day,
    focus: partial.focus,
    exercises: partial.exercises ?? [],
    createdAt: new Date().toISOString(),
  };
}

export function templatesFromPlan(plan: WorkoutPlan): WorkoutTemplate[] {
  return plan.days
    .filter((d) => !d.rest && d.exercises.length > 0)
    .map((d) => newTemplate({
      name: `${d.focus} — ${d.day}`,
      day: d.day,
      focus: d.focus,
      exercises: d.exercises,
    }));
}

export function clearAllTemplates() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TKEY);
}
