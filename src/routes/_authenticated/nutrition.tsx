import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import {
  Plus, ScanLine, Flame, Trash2, ChevronLeft, ChevronRight, Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FoodLogDialog } from "@/components/food-log-dialog";
import {
  useMeals, MEAL_TYPES, todayKey,
  type MealType, type LoggedMeal,
} from "@/lib/food";
import { useDayLog } from "@/lib/dashboard-prefs";

export const Route = createFileRoute("/_authenticated/nutrition")({
  head: () => ({ meta: [{ title: "Nutrition — Vita" }] }),
  component: Nutrition,
});

function Nutrition() {
  const { user } = useAuth();
  const { meals, removeMeal, logMeal, mealsOn } = useMeals();
  const { day, addMeal } = useDayLog();
  const [open, setOpen] = useState(false);
  const [defaultMealType, setDefaultMealType] = useState<MealType | undefined>();
  const [dateOffset, setDateOffset] = useState(0); // 0=today, -1=yesterday

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const r = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return r.data;
    },
  });

  const calorieTarget = profile?.daily_calories ?? 2000;
  const proteinTarget = profile?.protein_g ?? 140;
  const carbsTarget = profile?.carbs_g ?? 200;
  const fatTarget = profile?.fat_g ?? 60;

  const viewDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dateOffset);
    return d.toISOString().slice(0, 10);
  }, [dateOffset]);
  const isToday = dateOffset === 0;

  const dayMeals = mealsOn(viewDate);
  const totals = useMemo(() => sum(dayMeals), [dayMeals]);
  const remaining = Math.max(0, calorieTarget - totals.kcal);
  const pct = clamp((totals.kcal / calorieTarget) * 100);

  const byType = useMemo(() => {
    const map: Record<MealType, LoggedMeal[]> = { breakfast: [], lunch: [], dinner: [], snack: [] };
    dayMeals.forEach((m) => map[m.mealType].push(m));
    return map;
  }, [dayMeals]);

  function openFor(mt?: MealType) {
    setDefaultMealType(mt);
    setOpen(true);
  }

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-background px-5 pb-32 pt-8">
      {/* Header / date picker */}
      <header className="flex items-center justify-between">
        <button
          onClick={() => setDateOffset((d) => d - 1)}
          className="grid size-9 place-items-center rounded-full border border-border"
          aria-label="Previous day"
        >
          <ChevronLeft className="size-4" />
        </button>
        <div className="text-center">
          <h1 className="font-display text-xl font-semibold tracking-tight">
            {isToday ? "Today" : formatDate(viewDate)}
          </h1>
          <p className="text-[11px] text-muted-foreground">Nutrition</p>
        </div>
        <button
          onClick={() => setDateOffset((d) => Math.min(0, d + 1))}
          className="grid size-9 place-items-center rounded-full border border-border disabled:opacity-40"
          aria-label="Next day"
          disabled={dateOffset >= 0}
        >
          <ChevronRight className="size-4" />
        </button>
      </header>

      {/* Hero card */}
      <section className="mt-5 rounded-3xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Calories remaining
            </p>
            <p className="mt-1 font-display text-3xl font-bold tabular-nums">
              {remaining.toLocaleString()}
              <span className="ml-1 text-sm text-muted-foreground">kcal</span>
            </p>
          </div>
          <div className="relative grid size-20 place-items-center">
            <svg width={80} height={80} className="-rotate-90">
              <circle cx={40} cy={40} r={34} stroke="currentColor" strokeOpacity={0.12} strokeWidth={8} fill="none" />
              <circle
                cx={40} cy={40} r={34}
                stroke="currentColor" className="text-brand"
                strokeWidth={8} strokeLinecap="round" fill="none"
                strokeDasharray={2 * Math.PI * 34}
                strokeDashoffset={2 * Math.PI * 34 - (pct / 100) * 2 * Math.PI * 34}
              />
            </svg>
            <Flame className="absolute size-5 text-brand" />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground">{totals.kcal}</span> eaten
          </span>
          <span className="text-muted-foreground">
            Goal: <span className="font-semibold text-foreground">{calorieTarget}</span>
          </span>
        </div>

        {/* Macros */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <MacroBlock label="Carbs" value={totals.carbs} goal={carbsTarget} color="text-pink-500" />
          <MacroBlock label="Protein" value={totals.protein} goal={proteinTarget} color="text-blue-500" />
          <MacroBlock label="Fat" value={totals.fat} goal={fatTarget} color="text-orange-500" />
        </div>
      </section>

      {/* Meals by type */}
      <section className="mt-5 space-y-3">
        {MEAL_TYPES.map((m) => (
          <MealSection
            key={m.id}
            type={m.id}
            label={m.label}
            emoji={m.emoji}
            meals={byType[m.id]}
            onAdd={() => openFor(m.id)}
            onRemove={removeMeal}
            disabled={!isToday}
          />
        ))}
      </section>

      {/* Empty state for whole day */}
      {dayMeals.length === 0 && (
        <div className="mt-6 rounded-3xl border border-dashed border-border bg-card/50 p-8 text-center">
          <div className="mx-auto mb-2 grid size-12 place-items-center rounded-full bg-brand/15 text-brand">
            <Flame className="size-5" />
          </div>
          <p className="text-sm font-semibold">Nothing logged {isToday ? "today" : "this day"}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Search the food database or scan a barcode to get started.
          </p>
        </div>
      )}

      {/* Floating FAB */}
      {isToday && (
        <button
          onClick={() => openFor(undefined)}
          className="fixed bottom-24 right-5 z-40 grid size-14 place-items-center rounded-full bg-brand text-brand-foreground shadow-lg shadow-brand/40 transition active:scale-95"
          aria-label="Log food"
        >
          <Plus className="size-6" />
        </button>
      )}

      <FoodLogDialog
        open={open}
        onOpenChange={setOpen}
        defaultMealType={defaultMealType}
        onLogged={(entry) => {
          logMeal({ food: entry.food, serving: entry.serving, servingCount: entry.servingCount, mealType: entry.mealType });
          // Keep the dashboard "today" total in sync.
          if (isToday) addMeal({ kcal: entry.kcal, protein: entry.protein, carbs: entry.carbs, fat: entry.fat });
          setOpen(false);
        }}
      />
    </main>
  );
}

/* ---------- Meal section ---------- */
function MealSection({
  type, label, emoji, meals, onAdd, onRemove, disabled,
}: {
  type: MealType;
  label: string;
  emoji: string;
  meals: LoggedMeal[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
}) {
  const totalKcal = meals.reduce((s, m) => s + m.kcal, 0);
  return (
    <div className="rounded-3xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{emoji}</span>
          <div>
            <h3 className="font-display text-sm font-semibold">{label}</h3>
            <p className="text-[11px] text-muted-foreground">
              {totalKcal} kcal · {meals.length} item{meals.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        {!disabled && (
          <button
            onClick={onAdd}
            className="grid size-8 place-items-center rounded-full bg-brand/15 text-brand"
            aria-label={`Add to ${label}`}
          >
            <Plus className="size-4" />
          </button>
        )}
      </div>

      {meals.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {meals.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-3 rounded-xl border border-border/60 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">{m.food.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {m.servingCount}× {m.servingLabel} · {Math.round(m.grams)}g
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold tabular-nums text-brand">{m.kcal} kcal</p>
                <p className="text-[10px] text-muted-foreground">
                  P{m.protein} · C{m.carbs} · F{m.fat}
                </p>
              </div>
              {!disabled && (
                <button
                  onClick={() => onRemove(m.id)}
                  className="grid size-7 place-items-center text-muted-foreground hover:text-destructive"
                  aria-label="Remove"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------- Macro ring ---------- */
function MacroBlock({ label, value, goal, color }: { label: string; value: number; goal: number; color: string }) {
  const pct = clamp(goal > 0 ? (value / goal) * 100 : 0);
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <div className="rounded-2xl border border-border p-3 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="relative mx-auto mt-2 grid size-14 place-items-center">
        <svg width={56} height={56} className="-rotate-90">
          <circle cx={28} cy={28} r={r} stroke="currentColor" strokeOpacity={0.12} strokeWidth={5} fill="none" />
          <circle
            cx={28} cy={28} r={r}
            stroke="currentColor" className={color}
            strokeWidth={5} strokeLinecap="round" fill="none"
            strokeDasharray={c}
            strokeDashoffset={c - (pct / 100) * c}
          />
        </svg>
        <span className="absolute text-[10px] font-bold">{Math.round(pct)}%</span>
      </div>
      <p className="mt-1 text-[11px] font-semibold tabular-nums">
        {Math.round(value)}<span className="text-muted-foreground">/{goal}g</span>
      </p>
    </div>
  );
}

/* ---------- helpers ---------- */
function sum(meals: LoggedMeal[]) {
  return meals.reduce(
    (s, m) => ({
      kcal: s.kcal + m.kcal,
      protein: s.protein + m.protein,
      carbs: s.carbs + m.carbs,
      fat: s.fat + m.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

const clamp = (n: number) => Math.max(0, Math.min(100, n));

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}
