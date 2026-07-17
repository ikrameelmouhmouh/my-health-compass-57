import { useCallback, useEffect, useState } from "react";

// ============ Types ============
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export const MEAL_TYPES: { id: MealType; label: string; emoji: string }[] = [
  { id: "breakfast", label: "Breakfast", emoji: "🥣" },
  { id: "lunch", label: "Lunch", emoji: "🥗" },
  { id: "dinner", label: "Dinner", emoji: "🍽️" },
  { id: "snack", label: "Snack", emoji: "🍎" },
];

/** Nutrition values, always *per 100g* of the product (canonical storage). */
export type Per100 = {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  /** Micros — all optional, values per 100 g. mg unless noted. */
  vitaminC?: number;   // mg
  vitaminD?: number;   // µg
  potassium?: number;  // mg
  iron?: number;       // mg
  calcium?: number;    // mg
};

export type Micros = {
  vitaminC: number;
  vitaminD: number;
  potassium: number;
  iron: number;
  calcium: number;
};

export type FoodServing = {
  /** Display label, e.g. "100 g", "1 slice (25 g)" */
  label: string;
  /** Grams in 1x of this serving */
  grams: number;
};

export type FoodItem = {
  id: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  barcode?: string;
  per100: Per100;
  servings: FoodServing[];
  verified?: boolean;
  source: "off" | "custom" | "favorite";
};

export type LoggedMeal = {
  id: string;
  date: string;          // YYYY-MM-DD
  mealType: MealType;
  loggedAt: string;      // ISO
  food: FoodItem;
  /** Total grams eaten (already multiplied by serving count). */
  grams: number;
  servingLabel: string;
  servingCount: number;
  // Cached computed totals
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
};

// ============ Helpers ============
export const todayKey = () => new Date().toISOString().slice(0, 10);

export function computeNutrition(per100: Per100, grams: number) {
  const f = grams / 100;
  return {
    kcal: Math.round(per100.kcal * f),
    protein: round1(per100.protein * f),
    carbs: round1(per100.carbs * f),
    fat: round1(per100.fat * f),
  };
}

export function computeMicros(per100: Per100, grams: number): Micros {
  const f = grams / 100;
  return {
    vitaminC: round1((per100.vitaminC ?? 0) * f),
    vitaminD: round1((per100.vitaminD ?? 0) * f),
    potassium: Math.round((per100.potassium ?? 0) * f),
    iron: round1((per100.iron ?? 0) * f),
    calcium: Math.round((per100.calcium ?? 0) * f),
  };
}

const round1 = (n: number) => Math.round(n * 10) / 10;

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;

// ============ Open Food Facts ============
type OFFNutriments = Record<string, number | string | undefined>;

function num(v: unknown): number { return Number(v) || 0; }

function mapOFFProduct(p: any): FoodItem | null {
  const n: OFFNutriments = p?.nutriments ?? {};
  const kcal = Number(n["energy-kcal_100g"] ?? n["energy-kcal"] ?? 0);
  if (!kcal && !p.product_name) return null;
  // Vitamin D in OFF is grams; convert to µg. Others are already in grams -> mg.
  const vitDGrams = num(n["vitamin-d_100g"]);
  const per100: Per100 = {
    kcal: Math.round(kcal),
    protein: round1(Number(n["proteins_100g"] ?? 0)),
    carbs: round1(Number(n["carbohydrates_100g"] ?? 0)),
    fat: round1(Number(n["fat_100g"] ?? 0)),
  };
  const servingGrams = Number(p.serving_quantity);
  const servings: FoodServing[] = [];
  if (servingGrams && servingGrams > 0) {
    servings.push({ label: p.serving_size || `1 serving (${servingGrams} g)`, grams: servingGrams });
  }
  servings.push({ label: "100 g", grams: 100 });
  servings.push({ label: "1 g", grams: 1 });
  return {
    id: `off:${p.code ?? p._id ?? uid()}`,
    name: p.product_name || p.generic_name || "Unknown product",
    brand: p.brands?.split(",")[0]?.trim() || undefined,
    imageUrl: p.image_small_url || p.image_thumb_url || p.image_url,
    barcode: p.code,
    per100,
    servings,
    verified: true,
    source: "off",
  };
}

// Map app language → OFF country subdomain (improves local product ranking).
// Falls back to "world" for languages without an obvious single country.
const LANG_TO_CC: Record<string, string> = {
  nl: "nl", fr: "fr", de: "de", es: "es", it: "it", pt: "pt",
  pl: "pl", sv: "se", da: "dk", fi: "fi", no: "no", cs: "cz",
  ja: "jp", zh: "cn", ko: "kr", ru: "ru", tr: "tr",
};

function getUserLang(): string {
  if (typeof window === "undefined") return "en";
  try {
    const stored = localStorage.getItem("vita.lang");
    if (stored) return stored;
  } catch {}
  const nav = (typeof navigator !== "undefined" && navigator.language) || "en";
  return nav.slice(0, 2).toLowerCase();
}

function offFields(lc: string) {
  // Include localized name fields for the active language so users see names in their language when available.
  return `code,product_name,product_name_${lc},generic_name,generic_name_${lc},brands,image_small_url,image_thumb_url,image_url,nutriments,serving_size,serving_quantity`;
}

function preferLocale(p: any, lc: string) {
  if (!p) return p;
  const localName = p[`product_name_${lc}`];
  const localGeneric = p[`generic_name_${lc}`];
  if (localName || localGeneric) {
    return {
      ...p,
      product_name: localName || p.product_name,
      generic_name: localGeneric || p.generic_name,
    };
  }
  return p;
}

export async function searchFoods(query: string, signal?: AbortSignal): Promise<FoodItem[]> {
  const q = query.trim();
  if (!q) return [];
  const lc = getUserLang();
  const cc = LANG_TO_CC[lc];
  const fields = offFields(lc);

  // Always query the worldwide index so the app works for any country.
  // If we know the user's likely country, query that too and merge it first for better local relevance.
  const worldUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
    q
  )}&search_simple=1&action=process&json=1&page_size=25&lc=${lc}&fields=${fields}`;
  const localUrl = cc
    ? `https://${cc}.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
        q
      )}&search_simple=1&action=process&json=1&page_size=20&lc=${lc}&cc=${cc}&fields=${fields}`
    : null;

  const fetchList = async (url: string) => {
    try {
      const res = await fetch(url, { signal });
      if (!res.ok) return [] as FoodItem[];
      const data = await res.json();
      return ((data.products ?? []) as any[])
        .map((p) => mapOFFProduct(preferLocale(p, lc)))
        .filter(Boolean) as FoodItem[];
    } catch {
      return [] as FoodItem[];
    }
  };

  const [local, world] = await Promise.all([
    localUrl ? fetchList(localUrl) : Promise.resolve([] as FoodItem[]),
    fetchList(worldUrl),
  ]);
  const seen = new Set<string>();
  const merged: FoodItem[] = [];
  for (const item of [...local, ...world]) {
    const key = item.barcode || item.id;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged;
}

export async function lookupBarcode(code: string): Promise<FoodItem | null> {
  const c = code.replace(/\D/g, "");
  if (!c) return null;
  const lc = getUserLang();
  const cc = LANG_TO_CC[lc];
  const fields = offFields(lc);

  // Try local country index first (when available), then the worldwide index as fallback.
  const urls = [
    cc ? `https://${cc}.openfoodfacts.org/api/v2/product/${c}.json?lc=${lc}&cc=${cc}&fields=${fields}` : null,
    `https://world.openfoodfacts.org/api/v2/product/${c}.json?lc=${lc}&fields=${fields}`,
  ].filter(Boolean) as string[];

  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      if (data.status === 1) return mapOFFProduct(preferLocale(data.product, lc));
    } catch {}
  }
  return null;
}

// ============ Meals storage ============
const MEALS_KEY = "vita.meals.v1";

function loadMeals(): LoggedMeal[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(MEALS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function inferMealType(d = new Date()): MealType {
  const h = d.getHours();
  if (h < 10) return "breakfast";
  if (h < 14) return "lunch";
  if (h < 17) return "snack";
  if (h < 22) return "dinner";
  return "snack";
}

export function useMeals() {
  const [meals, setMeals] = useState<LoggedMeal[]>(() => loadMeals());

  useEffect(() => {
    try {
      localStorage.setItem(MEALS_KEY, JSON.stringify(meals.slice(-500)));
    } catch {}
  }, [meals]);

  const logMeal = useCallback(
    (args: {
      food: FoodItem;
      servingCount: number;
      serving: FoodServing;
      mealType: MealType;
      date?: string;
    }) => {
      const grams = args.serving.grams * args.servingCount;
      const n = computeNutrition(args.food.per100, grams);
      const entry: LoggedMeal = {
        id: uid(),
        date: args.date ?? todayKey(),
        mealType: args.mealType,
        loggedAt: new Date().toISOString(),
        food: args.food,
        grams,
        servingLabel: args.serving.label,
        servingCount: args.servingCount,
        ...n,
      };
      setMeals((m) => [...m, entry]);
      return entry;
    },
    []
  );

  const removeMeal = useCallback((id: string) => {
    setMeals((m) => m.filter((x) => x.id !== id));
  }, []);

  const updateMeal = useCallback(
    (id: string, patch: { servingCount?: number; mealType?: MealType }) => {
      setMeals((m) =>
        m.map((x) => {
          if (x.id !== id) return x;
          const sc = patch.servingCount ?? x.servingCount;
          const grams = (x.grams / x.servingCount) * sc;
          const n = computeNutrition(x.food.per100, grams);
          return {
            ...x,
            servingCount: sc,
            mealType: patch.mealType ?? x.mealType,
            grams,
            ...n,
          };
        })
      );
    },
    []
  );

  const mealsOn = useCallback(
    (date: string) => meals.filter((m) => m.date === date),
    [meals]
  );

  return { meals, logMeal, removeMeal, updateMeal, mealsOn };
}

// ============ Favorites & custom foods ============
const FAV_KEY = "vita.food.favorites.v1";
const CUSTOM_KEY = "vita.food.custom.v1";

function loadList(key: string): FoodItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(key) ?? "[]");
  } catch {
    return [];
  }
}

export function useFoodLibrary() {
  const [favorites, setFavorites] = useState<FoodItem[]>(() => loadList(FAV_KEY));
  const [custom, setCustom] = useState<FoodItem[]>(() => loadList(CUSTOM_KEY));

  useEffect(() => {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(favorites)); } catch {}
  }, [favorites]);
  useEffect(() => {
    try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(custom)); } catch {}
  }, [custom]);

  const toggleFavorite = useCallback((food: FoodItem) => {
    setFavorites((list) => {
      const exists = list.some((f) => f.id === food.id);
      if (exists) return list.filter((f) => f.id !== food.id);
      return [{ ...food, source: "favorite" as const }, ...list].slice(0, 100);
    });
  }, []);

  const isFavorite = useCallback(
    (id: string) => favorites.some((f) => f.id === id),
    [favorites]
  );

  const addCustom = useCallback((food: Omit<FoodItem, "id" | "source">) => {
    const item: FoodItem = { ...food, id: `custom:${uid()}`, source: "custom" };
    setCustom((list) => [item, ...list].slice(0, 200));
    return item;
  }, []);

  const removeCustom = useCallback((id: string) => {
    setCustom((list) => list.filter((f) => f.id !== id));
  }, []);

  return { favorites, custom, toggleFavorite, isFavorite, addCustom, removeCustom };
}

// ============ Barcode scanning (native BarcodeDetector) ============
export function isBarcodeScanSupported() {
  return typeof window !== "undefined" && "BarcodeDetector" in window;
}
