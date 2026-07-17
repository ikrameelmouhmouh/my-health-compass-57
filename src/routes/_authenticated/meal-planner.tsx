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
