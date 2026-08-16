import { useT } from "@/lib/i18n";

export const FOCUS_OPTIONS = [
  "FullBody",
  "UpperBody",
  "LowerBody",
  "Push",
  "Pull",
  "Legs",
  "Glutes",
  "Quads",
  "Hamstrings",
  "Calves",
  "Chest",
  "Back",
  "Shoulders",
  "Arms",
  "Biceps",
  "Triceps",
  "Core",
  "Abs",
  "Cardio",
  "Strength",
  "HIIT",
  "Mobility",
  "Functional",
] as const;

export type FocusOption = (typeof FOCUS_OPTIONS)[number];

export function useFocusLabel(option: FocusOption) {
  const t = useT();
  return t(`wiz.focus.${option}`);
}

export function formatFocus(selected: FocusOption[], t: (key: string) => string) {
  if (selected.length === 0) return "";
  return selected.map((s) => t(`wiz.focus.${s}`)).join(" + ");
}

export function parseFocus(value: string | undefined | null): FocusOption[] {
  if (!value) return [];
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  // Split on the display joiner " + " or common separators
  const parts = normalized.split(/\s*\+\s*|,\s*|\s+and\s+/gi).filter(Boolean);
  const result: FocusOption[] = [];

  for (const part of parts) {
    const clean = part.trim();
    // Try direct match against option keys
    const direct = FOCUS_OPTIONS.find((o) => o.toLowerCase() === clean.toLowerCase());
    if (direct) {
      result.push(direct);
      continue;
    }
    // Try matching translated labels (Dutch backwards compat)
    const lower = clean.toLowerCase();
    const mapped = FOCUS_OPTIONS.find((o) => {
      const label = DUTCH_LABELS[o]?.toLowerCase();
      return label && (lower === label || label.includes(lower) || lower.includes(label));
    });
    if (mapped) result.push(mapped);
  }

  return result;
}

const DUTCH_LABELS: Partial<Record<FocusOption, string>> = {
  FullBody: "Full body",
  UpperBody: "Upper body",
  LowerBody: "Lower body",
  Push: "Push",
  Pull: "Pull",
  Legs: "Benen",
  Glutes: "Bilspieren",
  Quads: "Quadriceps",
  Hamstrings: "Hamstrings",
  Calves: "Kuiten",
  Chest: "Borst",
  Back: "Rug",
  Shoulders: "Schouders",
  Arms: "Armen",
  Biceps: "Biceps",
  Triceps: "Triceps",
  Core: "Core",
  Abs: "Abs",
  Cardio: "Cardio",
  Strength: "Kracht",
  HIIT: "HIIT",
  Mobility: "Mobiliteit",
  Functional: "Functioneel",
};
