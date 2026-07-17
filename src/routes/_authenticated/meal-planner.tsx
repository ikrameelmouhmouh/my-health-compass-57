import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, ChevronRight, Plus, Search, Trash2, X, Save } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import {
  listMealPlan,
  saveMealPlanDay,
  type MealPlanDay,
  type PlannedMeal,
} from "@/lib/meal-plans.functions";
import { PaywallOverlay } from "@/components/paywall-gate";
import { searchFoods, computeNutrition, type FoodItem } from "@/lib/food";

export const Route = createFileRoute("/_authenticated/meal-planner")({
  head: () => ({ meta: [{ title: "Meal planner — Alyva" }] }),
  component: MealPlannerPage,
});

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `m-${Date.now()}-${Math.random().toString(36).slice(2)}`;

function MealPlannerPage() {
  const { t } = useI18n();
  const list = useServerFn(listMealPlan);
  const save = useServerFn(saveMealPlanDay);

  const [days, setDays] = useState<MealPlanDay[]>(() =>
    Array.from({ length: 7 }, (_, i) => ({ dayIndex: i, meals: [] })),
  );
  const [openDay, setOpenDay] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    list()
      .then((rows) => {
        if (!alive) return;
        const merged = Array.from({ length: 7 }, (_, i) => {
          const found = rows.find((r) => r.dayIndex === i);
          return found ?? { dayIndex: i, meals: [] };
        });
        setDays(merged);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [list]);

  async function commitDay(dayIndex: number, meals: PlannedMeal[]) {
    setDays((prev) =>
      prev.map((d) => (d.dayIndex === dayIndex ? { ...d, meals } : d)),
    );
    try {
      await save({ data: { dayIndex, meals } });
    } catch {
      // silent — user will see it revert on reload
    }
  }

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-background px-5 pb-24 pt-8">
      <header className="flex items-center gap-3">
        <Link
          to="/nutrition"
          className="grid size-10 place-items-center rounded-full border border-border"
          aria-label={t("common.back")}
        >
          <ChevronLeft className="size-4" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {t("mealplan.title")}
          </h1>
          <p className="text-xs text-muted-foreground">{t("mealplan.subtitle")}</p>
        </div>
      </header>

      <PaywallOverlay
        feature={t("mealplan.title")}
        description={t("pay.overlay.food_desc")}
      >
        <section className="mt-6 rounded-3xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold">
              {t("mealplan.planner")}
            </h2>
            <span className="text-[11px] text-muted-foreground">
              {t("mealplan.week")}
            </span>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-muted-foreground">…</div>
          ) : (
            <ul className="space-y-2">
              {days.map((d) => {
                const total = d.meals.reduce((s, m) => s + m.kcal, 0);
                return (
                  <li key={d.dayIndex}>
                    <button
                      onClick={() => setOpenDay(d.dayIndex)}
                      className="flex w-full items-center justify-between rounded-2xl bg-background/60 px-4 py-3 text-left ios-press"
                    >
                      <div>
                        <p className="font-display text-sm font-semibold">
                          {t("mealplan.day")} {d.dayIndex + 1}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {total.toLocaleString()} {t("food.kcal")} ·{" "}
                          {d.meals.length} {t("mealplan.meals")}
                        </p>
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground rtl:rotate-180" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </PaywallOverlay>

      {openDay !== null && (
        <DaySheet
          day={days.find((d) => d.dayIndex === openDay)!}
          onClose={() => setOpenDay(null)}
          onSave={async (meals) => {
            await commitDay(openDay, meals);
            setOpenDay(null);
          }}
        />
      )}
    </main>
  );
}

function DaySheet({
  day,
  onClose,
  onSave,
}: {
  day: MealPlanDay;
  onClose: () => void;
  onSave: (meals: PlannedMeal[]) => Promise<void>;
}) {
  const { t } = useI18n();
  const [meals, setMeals] = useState<PlannedMeal[]>(day.meals);
  const [name, setName] = useState("");
  const [kcal, setKcal] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [saving, setSaving] = useState(false);

  const total = useMemo(
    () =>
      meals.reduce(
        (s, m) => ({
          kcal: s.kcal + m.kcal,
          protein: s.protein + m.protein,
          carbs: s.carbs + m.carbs,
          fat: s.fat + m.fat,
        }),
        { kcal: 0, protein: 0, carbs: 0, fat: 0 },
      ),
    [meals],
  );

  function addMeal() {
    const n = name.trim();
    const k = Number(kcal);
    if (!n || !Number.isFinite(k) || k <= 0) return;
    setMeals((prev) => [
      ...prev,
      {
        id: uid(),
        name: n,
        kcal: Math.round(k),
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
      },
    ]);
    setName("");
    setKcal("");
    setProtein("");
    setCarbs("");
    setFat("");
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/40" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="mt-auto max-h-[92dvh] w-full rounded-t-3xl bg-background p-5 pb-8 shadow-2xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">
            {t("mealplan.day")} {day.dayIndex + 1}
          </h3>
          <button
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full border border-border"
            aria-label={t("common.close")}
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="text-[11px] text-muted-foreground">
          {t("mealplan.total")}:{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {total.kcal} {t("food.kcal")}
          </span>{" "}
          · P{Math.round(total.protein)} · C{Math.round(total.carbs)} · F
          {Math.round(total.fat)}
        </p>

        <ul className="mt-4 max-h-[36dvh] space-y-2 overflow-y-auto">
          {meals.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-3 rounded-2xl border border-border px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{m.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {m.kcal} {t("food.kcal")} · P{m.protein} · C{m.carbs} · F{m.fat}
                </p>
              </div>
              <button
                onClick={() =>
                  setMeals((prev) => prev.filter((x) => x.id !== m.id))
                }
                className="grid size-7 place-items-center text-muted-foreground hover:text-destructive"
                aria-label={t("nutr.remove")}
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
          {meals.length === 0 && (
            <li className="rounded-2xl border border-dashed border-border p-4 text-center text-[11px] text-muted-foreground">
              {t("mealplan.empty_day")}
            </li>
          )}
        </ul>

        <FoodSearchBlock
          onPick={(meal) => setMeals((prev) => [...prev, meal])}
        />

        <div className="mt-3 space-y-2 rounded-2xl border border-border p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("mealplan.manual_entry")}
          </p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("mealplan.meal_name")}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <div className="grid grid-cols-4 gap-2">
            <NumField label={t("food.kcal")} value={kcal} onChange={setKcal} />
            <NumField label="P" value={protein} onChange={setProtein} />
            <NumField label="C" value={carbs} onChange={setCarbs} />
            <NumField label="F" value={fat} onChange={setFat} />
          </div>
          <button
            onClick={addMeal}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand/15 py-2 text-sm font-semibold text-brand ios-press"
          >
            <Plus className="size-4" /> {t("mealplan.add_meal")}
          </button>
        </div>

        <button
          onClick={async () => {
            setSaving(true);
            await onSave(meals);
            setSaving(false);
          }}
          disabled={saving}
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          <Save className="size-4" />
          {saving ? "…" : t("mealplan.save")}
        </button>
      </div>
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))}
        className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm tabular-nums outline-none focus:border-brand"
      />
    </label>
  );
}

const uid2 = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `m-${Date.now()}-${Math.random().toString(36).slice(2)}`;

function FoodSearchBlock({ onPick }: { onPick: (meal: PlannedMeal) => void }) {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [grams, setGrams] = useState("100");
  const [results, setResults] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const query = q.trim();
    if (!query) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setTouched(true);
    const handle = setTimeout(() => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      searchFoods(query, ctrl.signal)
        .then((items) => {
          if (ctrl.signal.aborted) return;
          setResults(items);
        })
        .catch(() => {})
        .finally(() => {
          if (!ctrl.signal.aborted) setLoading(false);
        });
    }, 300);
    return () => clearTimeout(handle);
  }, [q]);

  const g = Math.max(1, Number(grams) || 100);

  function pick(item: FoodItem) {
    const n = computeNutrition(item.per100, g);
    onPick({
      id: uid2(),
      name: item.brand ? `${item.name} — ${item.brand}` : item.name,
      kcal: n.kcal,
      protein: Math.round(n.protein),
      carbs: Math.round(n.carbs),
      fat: Math.round(n.fat),
    });
  }

  return (
    <div className="mt-4 space-y-2 rounded-2xl border border-border p-3">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("mealplan.search_placeholder")}
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        <label className="flex items-center gap-1 rounded-xl border border-border bg-background px-2 py-2">
          <input
            inputMode="numeric"
            value={grams}
            onChange={(e) => setGrams(e.target.value.replace(/[^\d]/g, ""))}
            className="w-12 bg-transparent text-center text-sm tabular-nums outline-none"
          />
          <span className="text-[11px] text-muted-foreground">g</span>
        </label>
      </div>

      {loading && (
        <p className="text-center text-[11px] text-muted-foreground">…</p>
      )}

      {!loading && touched && q.trim() && results.length === 0 && (
        <p className="rounded-xl border border-dashed border-border p-3 text-center text-[11px] text-muted-foreground">
          {t("mealplan.search_empty")}
        </p>
      )}

      {!touched && (
        <p className="text-[11px] text-muted-foreground">
          {t("mealplan.search_hint")}
        </p>
      )}

      {results.length > 0 && (
        <ul className="max-h-56 space-y-1.5 overflow-y-auto">
          {results.map((item) => {
            const n = computeNutrition(item.per100, g);
            return (
              <li key={item.id}>
                <button
                  onClick={() => pick(item)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-background/60 px-3 py-2 text-left ios-press"
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="size-9 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-[10px] text-muted-foreground">
                      🍽️
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{item.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {item.brand ? `${item.brand} · ` : ""}
                      {n.kcal} {t("food.kcal")} · P{Math.round(n.protein)} · C
                      {Math.round(n.carbs)} · F{Math.round(n.fat)}
                    </p>
                  </div>
                  <Plus className="size-4 shrink-0 text-brand" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
