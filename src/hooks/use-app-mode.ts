import { useCallback, useEffect, useState } from "react";

export type AppMode = "edit" | "customer" | null;
const STORAGE_KEY = "alyva.app_mode";
const EVENT = "alyva:app-mode";

export function readAppMode(): AppMode {
  if (typeof window === "undefined") return "edit";
  const v = window.localStorage.getItem(STORAGE_KEY);
  if (v === "edit") return "edit";
  if (v === "customer") return "customer";
  // Default when nothing is stored: edit mode.
  return "edit";
}

export function useAppMode() {
  const [mode, setModeState] = useState<AppMode>(() => readAppMode());

  useEffect(() => {
    const sync = () => setModeState(readAppMode());
    window.addEventListener("storage", sync);
    window.addEventListener(EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EVENT, sync);
    };
  }, []);

  const setMode = useCallback((next: AppMode) => {
    if (next === null) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new Event(EVENT));
    setModeState(next);
  }, []);

  return { mode, isEdit: mode === "edit", setMode };
}
