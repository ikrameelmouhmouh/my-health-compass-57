import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import {
  Plus, Flame, Trash2, ChevronLeft, ChevronRight, Timer, Play, Square, ChevronRight as ChevRight,
  Camera, CalendarDays,
} from "lucide-react";
import { FoodLogDialog } from "@/components/food-log-dialog";
import { NutritionSpeedDial } from "@/components/nutrition-speed-dial";
import { MicroDetailsCard } from "@/components/nutrition/micro-details-card";
import {
  useMeals, MEAL_TYPES,
  type MealType, type LoggedMeal,
} from "@/lib/food";
import { useDayLog, useFasting, getProtocol } from "@/lib/dashboard-prefs";
import { useI18n } from "@/lib/i18n";
import { PaywallOverlay } from "@/components/paywall-gate";

export const Route = createFileRoute("/_authenticated/nutrition")({
  head: () => ({ meta: [{ title: "Nutrition — Alyva" }] }),
  component: Nutrition,
});

function Nutrition() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const { removeMeal, logMeal, mealsOn } = useMeals();
  const { day, addMeal } = useDayLog();
  const [open, setOpen] = useState(false);
  const [defaultMealType, setDefaultMealType] = useState<MealType | undefined>();
  const [autoOpenScan, setAutoOpenScan] = useState(false);
  const [dateOffset, setDateOffset] = useState(0);

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
    setAutoOpenScan(false);
    setOpen(true);
  }

  function openScan() {
    setDefaultMealType(undefined);
    setAutoOpenScan(true);
    setOpen(true);
  }


  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-background px-5 pb-32 pt-8">
      <header className="flex items-center justify-between">
        <button
          onClick={() => setDateOffset((d) => d - 1)}
          className="grid size-9 place-items-center rounded-full border border-border"
          aria-label={t("nutr.prev")}
        >
          <ChevronLeft className="size-4" />
        </button>
        <div className="text-center">
          <h1 className="font-display text-xl font-semibold tracking-tight">
            {formatDate(viewDate, lang)}
          </h1>
          <p className="text-[11px] text-muted-foreground">{t("nutr.title")}</p>
        </div>
        <button
          onClick={() => setDateOffset((d) => Math.min(0, d + 1))}
          className="grid size-9 place-items-center rounded-full border border-border disabled:opacity-40"
          aria-label={t("nutr.next")}
          disabled={dateOffset >= 0}
        >
          <ChevronRight className="size-4" />
        </button>
      </header>

      <PaywallOverlay feature={t("nutr.title")} description={t("pay.overlay.food_desc")}>
      <section className="mt-5 rounded-3xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t("nutr.cal_remaining")}
            </p>
            <p className="mt-1 font-display text-3xl font-bold tabular-nums">
              {remaining.toLocaleString()}
              <span className="ml-1 text-sm text-muted-foreground">{t("food.kcal")}</span>
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
            <span className="font-semibold text-foreground">{totals.kcal}</span> {t("nutr.eaten")}
          </span>
          <span className="text-muted-foreground">
            {t("nutr.goal")}: <span className="font-semibold text-foreground">{calorieTarget}</span>
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <MacroBlock label={t("food.carbs")} value={totals.carbs} goal={carbsTarget} color="text-pink-500" />
          <MacroBlock label={t("food.protein")} value={totals.protein} goal={proteinTarget} color="text-blue-500" />
          <MacroBlock label={t("food.fat")} value={totals.fat} goal={fatTarget} color="text-orange-500" />
        </div>
      </section>
      </PaywallOverlay>

      {isToday && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={openScan}
            className="flex flex-col items-start rounded-3xl border border-border bg-card p-4 text-left ios-press"
          >
            <div className="grid size-10 place-items-center rounded-2xl bg-brand/15 text-brand">
              <Camera className="size-5" />
            </div>
            <p className="mt-3 font-display text-sm font-semibold">{t("nutr.scan_meal")}</p>
            <p className="text-[11px] text-muted-foreground">{t("nutr.scan_sub")}</p>
          </button>
          <Link
            to="/meal-planner"
            className="flex flex-col items-start rounded-3xl border border-border bg-card p-4 text-left ios-press"
          >
            <div className="grid size-10 place-items-center rounded-2xl bg-accent text-foreground">
              <CalendarDays className="size-5" />
            </div>
            <p className="mt-3 font-display text-sm font-semibold">{t("mealplan.title")}</p>
            <p className="text-[11px] text-muted-foreground">{t("mealplan.sub_short")}</p>
          </Link>
        </div>
      )}

      <PaywallOverlay feature={t("nutr.title")} description={t("pay.overlay.food_desc")}>


      <MicroDetailsCard
        meals={dayMeals}
        title={t("nutr.micro_title")}
        todayLabel={isToday ? t("nutr.today") : formatDate(viewDate, lang)}
        labels={{
          vitaminC: t("nutr.micro.vitaminC"),
          vitaminD: t("nutr.micro.vitaminD"),
          potassium: t("nutr.micro.potassium"),
          iron: t("nutr.micro.iron"),
          calcium: t("nutr.micro.calcium"),
        }}
      />



      <section className="mt-5 space-y-3">
        {MEAL_TYPES.map((m) => (
          <MealSection
            key={m.id}
            type={m.id}
            label={t(`meal.${m.id}`)}
            emoji={m.emoji}
            meals={byType[m.id]}
            onAdd={() => openFor(m.id)}
            onRemove={removeMeal}
            disabled={!isToday}
            tAddTo={t("nutr.add_to", { meal: t(`meal.${m.id}`) })}
            tRemove={t("nutr.remove")}
            tItem={t("nutr.item_one")}
            tItems={t("nutr.item_other")}
            tKcal={t("food.kcal")}
          />
        ))}
      </section>

      {dayMeals.length === 0 && (
        <div className="mt-6 rounded-3xl border border-dashed border-border bg-card/50 p-8 text-center">
          <div className="mx-auto mb-2 grid size-12 place-items-center rounded-full bg-brand/15 text-brand">
            <Flame className="size-5" />
          </div>
          <p className="text-sm font-semibold">
            {isToday ? t("nutr.empty_title_today") : t("nutr.empty_title_day")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{t("nutr.empty_desc")}</p>
        </div>
      )}

      {isToday && (
        <NutritionSpeedDial onAddMeal={() => openFor(undefined)} onScan={openScan} />
      )}
      </PaywallOverlay>

      <FoodLogDialog
        open={open}
        onOpenChange={setOpen}
        defaultMealType={defaultMealType}
        autoOpenScan={autoOpenScan}
        onLogged={(entry) => {
          logMeal({ food: entry.food, serving: entry.serving, servingCount: entry.servingCount, mealType: entry.mealType });
          if (isToday) addMeal({ kcal: entry.kcal, protein: entry.protein, carbs: entry.carbs, fat: entry.fat });
          setOpen(false);
        }}
      />
    </main>
  );
}

function MealSection({
  type, label, emoji, meals, onAdd, onRemove, disabled,
  tAddTo, tRemove, tItem, tItems, tKcal,
}: {
  type: MealType;
  label: string;
  emoji: string;
  meals: LoggedMeal[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
  tAddTo: string; tRemove: string; tItem: string; tItems: string; tKcal: string;
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
              {totalKcal} {tKcal} · {meals.length} {meals.length === 1 ? tItem : tItems}
            </p>
          </div>
        </div>
        {!disabled && (
          <button
            onClick={onAdd}
            className="grid size-8 place-items-center rounded-full bg-brand/15 text-brand"
            aria-label={tAddTo}
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
                <p className="text-xs font-bold tabular-nums text-brand">{m.kcal} {tKcal}</p>
                <p className="text-[10px] text-muted-foreground">
                  P{m.protein} · C{m.carbs} · F{m.fat}
                </p>
              </div>
              {!disabled && (
                <button
                  onClick={() => onRemove(m.id)}
                  className="grid size-7 place-items-center text-muted-foreground hover:text-destructive"
                  aria-label={tRemove}
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

const LOCALE_MAP: Record<string, string> = {
  en: "en-US", nl: "nl-NL", ar: "ar", fr: "fr-FR", de: "de-DE", es: "es-ES",
};

function formatDate(iso: string, lang: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(LOCALE_MAP[lang] ?? undefined, { weekday: "short", day: "numeric", month: "short" });
}

function FastingCard() {
  const { t } = useI18n();
  const { state, start, stop } = useFasting();
  const proto = getProtocol(state.protocol);
  const targetMs = proto.fast * 3_600_000;

  const [, setTick] = useState(0);
  useEffect(() => {
    if (!state.startedAt || state.pausedAt) return;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [state.startedAt, state.pausedAt]);

  const live = useMemo(() => {
    if (!state.startedAt) return { active: false, elapsedMs: 0, pct: 0 };
    const now = Date.now();
    let pausedMs = state.pausedTotalMs;
    if (state.pausedAt) pausedMs += now - new Date(state.pausedAt).getTime();
    const elapsedMs = Math.max(0, now - new Date(state.startedAt).getTime() - pausedMs);
    return { active: true, elapsedMs, pct: Math.min(100, (elapsedMs / targetMs) * 100) };
  }, [state.startedAt, state.pausedAt, state.pausedTotalMs, targetMs]);

  const hh = Math.floor(live.elapsedMs / 3_600_000);
  const mm = Math.floor((live.elapsedMs % 3_600_000) / 60_000);
  const timeLabel = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;

  const size = 56, stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (live.pct / 100) * c;

  return (
    <section className="mt-5 rounded-3xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle cx={size/2} cy={size/2} r={r} stroke="currentColor" strokeOpacity={0.12} strokeWidth={stroke} fill="none" />
            {live.active && (
              <circle cx={size/2} cy={size/2} r={r} stroke="currentColor" className="text-brand"
                strokeWidth={stroke} strokeLinecap="round" fill="none"
                strokeDasharray={c} strokeDashoffset={off} />
            )}
          </svg>
          <Timer className={`absolute size-5 ${live.active ? "text-brand" : "text-muted-foreground"}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-sm font-semibold">{t("nut.fastingTitle")}</h3>
            <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
              {proto.label}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {live.active ? (
              <span><span className="font-semibold text-foreground tabular-nums">{timeLabel}</span> · {t("nut.fastingActive")}</span>
            ) : (
              t("nut.fastingIdle")
            )}
          </p>
        </div>
        {live.active ? (
          <button
            onClick={stop}
            className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-3 py-1.5 text-[12px] font-semibold text-destructive ios-press"
          >
            <Square className="size-3.5" /> {t("nut.stopFast")}
          </button>
        ) : (
          <button
            onClick={start}
            className="inline-flex items-center gap-1 rounded-full bg-brand px-3 py-1.5 text-[12px] font-semibold text-brand-foreground ios-press"
          >
            <Play className="size-3.5" /> {t("nut.startFast")}
          </button>
        )}
      </div>
      <Link
        to="/fasting"
        className="mt-3 flex items-center justify-between rounded-2xl bg-accent/40 px-3 py-2 text-[12px] font-medium text-foreground ios-press"
      >
        <span>{t("nut.viewAll")}</span>
        <ChevRight className="size-4 text-muted-foreground rtl:rotate-180" />
      </Link>
    </section>
  );
}
