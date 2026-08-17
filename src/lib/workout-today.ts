import { useMemo } from "react";
import { useTemplates, type WorkoutTemplate } from "./workout-prefs";
import type { Workout } from "./dashboard-prefs";

const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

/** Normalizes various day representations ("Monday", "mon", "maandag", etc.) to canonical English "Monday". */
export function normalizeDay(input?: string | null): string | null {
  if (!input) return null;
  const v = input.trim().toLowerCase();
  if (!v) return null;
  const map: Record<string, string> = {
    mon: "Monday", monday: "Monday", maandag: "Monday", lundi: "Monday", montag: "Monday", lunes: "Monday", "الإثنين": "Monday", "الاثنين": "Monday",
    tue: "Tuesday", tuesday: "Tuesday", dinsdag: "Tuesday", mardi: "Tuesday", dienstag: "Tuesday", martes: "Tuesday", "الثلاثاء": "Tuesday",
    wed: "Wednesday", wednesday: "Wednesday", woensdag: "Wednesday", mercredi: "Wednesday", mittwoch: "Wednesday", "miércoles": "Wednesday", miercoles: "Wednesday", "الأربعاء": "Wednesday",
    thu: "Thursday", thursday: "Thursday", donderdag: "Thursday", jeudi: "Thursday", donnerstag: "Thursday", jueves: "Thursday", "الخميس": "Thursday",
    fri: "Friday", friday: "Friday", vrijdag: "Friday", vendredi: "Friday", freitag: "Friday", viernes: "Friday", "الجمعة": "Friday",
    sat: "Saturday", saturday: "Saturday", zaterdag: "Saturday", samedi: "Saturday", samstag: "Saturday", sonnabend: "Saturday", "sábado": "Saturday", sabado: "Saturday", "السبت": "Saturday",
    sun: "Sunday", sunday: "Sunday", zondag: "Sunday", dimanche: "Sunday", sonntag: "Sunday", domingo: "Sunday", "الأحد": "Sunday",
  };
  return map[v] ?? null;
}

export function todayDayName(date = new Date()): string {
  return FULL_DAYS[date.getDay()];
}

/** Finds the first template scheduled for today (matched on normalized day name). */
export function findTodaysTemplate(templates: WorkoutTemplate[], date = new Date()): WorkoutTemplate | null {
  const today = todayDayName(date);
  for (const t of templates) {
    if (normalizeDay(t.day) === today) return t;
  }
  return null;
}

/** Returns a Workout-shaped object derived from today's scheduled template, or null. */
export function useScheduledWorkoutForToday(): Workout | null {
  const { templates } = useTemplates();
  return useMemo(() => {
    const tpl = findTodaysTemplate(templates);
    if (!tpl) return null;
    // Estimate duration from sets count (~3 min per set), clamp to 15..120.
    const sets = tpl.exercises.reduce((s, e) => s + (Number(e.sets) || 0), 0);
    const durationMin = Math.max(15, Math.min(120, Math.round(sets * 3) || 30));
    return {
      name: tpl.name,
      type: tpl.focus || "Workout",
      durationMin,
    };
  }, [templates]);
}

const CANONICAL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

/**
 * Replaces any hardcoded English weekday inside a free-text string (e.g. legacy
 * template names like "Full Body & Glute Volume — Monday") with the weekday in
 * the app's current language, using the central i18n `day.<Day>` keys.
 */
export function localizeDayNames(text: string | null | undefined, t: (k: string) => string): string {
  if (!text) return text ?? "";
  let out = text;
  for (const day of CANONICAL_DAYS) {
    const label = t(`day.${day}`);
    if (!label || label === `day.${day}`) continue;
    out = out.replace(new RegExp(`\\b${day}\\b`, "gi"), label);
  }
  return out;
}
