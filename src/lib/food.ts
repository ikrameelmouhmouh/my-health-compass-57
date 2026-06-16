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
const round1 = (n: number) => Math.round(n * 10) / 10;

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;

// ============ Open Food Facts ============
type OFFNutriments = Record<string, number | string | undefined>;

function mapOFFProduct(p: any): FoodItem | null {
  const n: OFFNutriments = p?.nutriments ?? {};
  const kcal = Number(n["energy-kcal_100g"] ?? n["energy-kcal"] ?? 0);
  if (!kcal && !p.product_name) return null;
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

const OFF_FIELDS =
  "code,product_name,product_name_nl,generic_name,generic_name_nl,brands,image_small_url,image_thumb_url,image_url,nutriments,serving_size,serving_quantity";

function preferNl(p: any) {
  if (p && (p.product_name_nl || p.generic_name_nl)) {
    return {
      ...p,
      product_name: p.product_name_nl || p.product_name,
      generic_name: p.generic_name_nl || p.generic_name,
    };
  }
  return p;
}

export async function searchFoods(query: string, signal?: AbortSignal): Promise<FoodItem[]> {
  const q = query.trim();
  if (!q) return [];
  // Search Dutch index first (NL products, Albert Heijn / Jumbo / etc.), then fall back to world.
  const nlUrl = `https://nl.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
    q
  )}&search_simple=1&action=process&json=1&page_size=25&lc=nl&cc=nl&fields=${OFF_FIELDS}`;
  const worldUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
    q
  )}&search_simple=1&action=process&json=1&page_size=15&lc=nl&fields=${OFF_FIELDS}`;

  const fetchList = async (url: string) => {
    try {
      const res = await fetch(url, { signal });
      if (!res.ok) return [] as FoodItem[];
      const data = await res.json();
      return ((data.products ?? []) as any[])
        .map((p) => mapOFFProduct(preferNl(p)))
        .filter(Boolean) as FoodItem[];
    } catch {
      return [] as FoodItem[];
    }
  };

  const [nl, world] = await Promise.all([fetchList(nlUrl), fetchList(worldUrl)]);
  const seen = new Set<string>();
  const merged: FoodItem[] = [];
  for (const item of [...nl, ...world]) {
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
  const urls = [
    `https://nl.openfoodfacts.org/api/v2/product/${c}.json?lc=nl&cc=nl&fields=${OFF_FIELDS}`,
    `https://world.openfoodfacts.org/api/v2/product/${c}.json?lc=nl&fields=${OFF_FIELDS}`,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      if (data.status === 1) return mapOFFProduct(preferNl(data.product));
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
