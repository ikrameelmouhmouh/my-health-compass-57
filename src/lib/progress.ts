import { useCallback, useEffect, useState } from "react";

export type Measurement = {
  date: string; // ISO
  waist?: number;
  hips?: number;
  chest?: number;
  arms?: number;
};

export type ProgressPhoto = {
  id: string;
  date: string;
  dataUrl: string;
  note?: string;
};

export type Milestone = {
  id: string;
  title: string;
  achievedAt: string;
  icon?: string;
};

const M_KEY = "vita.measurements.v1";
const P_KEY = "vita.photos.v1";
const ML_KEY = "vita.milestones.v1";

function load<T>(k: string, fb: T): T {
  if (typeof window === "undefined") return fb;
  try { return JSON.parse(localStorage.getItem(k) ?? "null") ?? fb; } catch { return fb; }
}

export function useMeasurements() {
  const [list, setList] = useState<Measurement[]>(() => load<Measurement[]>(M_KEY, []));
  useEffect(() => { try { localStorage.setItem(M_KEY, JSON.stringify(list)); } catch {} }, [list]);
  const add = useCallback((m: Measurement) => setList((l) => [...l, m].slice(-180)), []);
  const remove = useCallback((date: string) => setList((l) => l.filter((m) => m.date !== date)), []);
  return { list, add, remove };
}

export function usePhotos() {
  const [list, setList] = useState<ProgressPhoto[]>(() => load<ProgressPhoto[]>(P_KEY, []));
  useEffect(() => { try { localStorage.setItem(P_KEY, JSON.stringify(list)); } catch {} }, [list]);
  const add = useCallback((p: Omit<ProgressPhoto, "id">) => setList((l) => [
    { ...p, id: (typeof crypto !== "undefined" && "randomUUID" in crypto) ? crypto.randomUUID() : String(Date.now()) },
    ...l,
  ].slice(0, 60)), []);
  const remove = useCallback((id: string) => setList((l) => l.filter((p) => p.id !== id)), []);
  return { list, add, remove };
}

export function useMilestones() {
  const [list, setList] = useState<Milestone[]>(() => load<Milestone[]>(ML_KEY, []));
  useEffect(() => { try { localStorage.setItem(ML_KEY, JSON.stringify(list)); } catch {} }, [list]);
  const add = useCallback((m: Omit<Milestone, "id" | "achievedAt"> & { achievedAt?: string }) => setList((l) => {
    if (l.find((x) => x.title === m.title)) return l;
    return [{ id: String(Date.now()) + m.title, achievedAt: m.achievedAt ?? new Date().toISOString(), ...m }, ...l];
  }), []);
  return { list, add };
}
