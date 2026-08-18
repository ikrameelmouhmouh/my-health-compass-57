import { todayLocalKey, localDayKey } from "@/lib/local-date";
import { AlyvaWordmark } from "@/components/brand";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import {
  Plus, Flame, Trash2, ChevronLeft, ChevronRight, Timer, Play, Square, ChevronRight as ChevRight,
  Camera, CalendarDays, Utensils, Search,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MonthCalendar } from "@/components/nutrition/month-calendar";
import { MEAL_ICONS, ScanMealIcon, PlannerIcon, TipIcon } from "@/components/nutrition/meal-icons";
import { FoodLogDialog } from "@/components/food-log-dialog";
import { useRegisterAiQuickActions } from "@/lib/ai-quick-actions";
import { useNavigate } from "@tanstack/react-router";
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
  const { removeMeal, logMeal, mealsOn, meals } = useMeals();
  const { day, addMeal } = useDayLog();
  const [open, setOpen] = useState(false);
  const [defaultMealType, setDefaultMealType] = useState<MealType | undefined>();
  const [autoOpenScan, setAutoOpenScan] = useState(false);
  const [dateOffset, setDateOffset] = useState(0);
  const [calendarOpen, setCalendarOpen] = useState(false);

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
    return localDayKey(d);
  }, [dateOffset]);
  const isToday = dateOffset === 0;

  const markedDays = useMemo(() => new Set(meals.map((m) => m.date)), [meals]);

  function selectDay(day: string) {
    const target = new Date(day + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((target.getTime() - today.getTime()) / 86_400_000);
    setDateOffset(Math.min(0, diff));
    setCalendarOpen(false);
  }

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

  const navigate = useNavigate();
  useRegisterAiQuickActions(
    [
      { id: "add", label: t("nut.fab.add_meal"), icon: Utensils, run: () => openFor(undefined) },
      { id: "scan", label: t("nutr.scan_meal"), icon: Camera, run: () => openScan() },
      { id: "search", label: t("nutr.search_food"), icon: Search, run: () => openFor(undefined) },
      {
        id: "planner",
        label: t("mealplan.title"),
        icon: CalendarDays,
        run: () => navigate({ to: "/meal-planner" }),
      },
    ],
    [t, navigate],
  );

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-background px-5 pb-32 pt-8">
      <div className="mb-5 flex items-center justify-center"><AlyvaWordmark size="sm" /></div>

      <header>
        <h1 className="font-display text-[30px] font-semibold leading-tight tracking-tight">
          {t("nutr.title")}
        </h1>
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => setDateOffset((d) => d - 1)}
            className="grid size-9 shrink-0 place-items-center rounded-full border border-border ios-press"
            aria-label={t("nutr.prev")}
          >
            <ChevronLeft className="size-4" />
          </button>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex-1 rounded-full border border-border bg-card px-4 py-2 text-center ios-press"
              >
                <span className="text-[13px] font-semibold capitalize">{formatDate(viewDate, lang)}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="center" className="w-[320px] rounded-3xl p-4">
              <MonthCalendar
                value={viewDate}
                markedDays={markedDays}
                locale={LOCALE_MAP[lang]}
                onSelect={selectDay}
              />
            </PopoverContent>
          </Popover>
          <button
            onClick={() => setDateOffset((d) => Math.min(0, d + 1))}
            className="grid size-9 shrink-0 place-items-center rounded-full border border-border ios-press disabled:opacity-40"
            aria-label={t("nutr.next")}
            disabled={dateOffset >= 0}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </header>

      <PaywallOverlay feature={t("nutr.title")} description={t("pay.overlay.food_desc")}>
      <section className="mt-5 rounded-[28px] border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium text-muted-foreground">{t("nutr.cal_remaining")}</p>
            <p className="mt-1 font-display text-[34px] font-bold leading-none tabular-nums">
              {remaining.toLocaleString()}
              <span className="ml-1.5 text-sm font-semibold text-muted-foreground">{t("food.kcal")}</span>
            </p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-alyva/12">
              <div className="h-full rounded-full bg-alyva transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-2 text-[12px] text-muted-foreground">
              <span className="font-semibold text-foreground tabular-nums">{totals.kcal}</span>{" "}
              {t("food.kcal")} {t("nutr.eaten")}
            </p>
          </div>

          <div className="relative grid size-[104px] shrink-0 place-items-center">
            <svg width={104} height={104} className="-rotate-90">
              <circle cx={52} cy={52} r={44} stroke="currentColor" className="text-alyva/12" strokeWidth={10} fill="none" />
              <circle
                cx={52} cy={52} r={44}
                stroke="currentColor" className="text-alyva"
                strokeWidth={10} strokeLinecap="round" fill="none"
                strokeDasharray={2 * Math.PI * 44}
                strokeDashoffset={2 * Math.PI * 44 - (pct / 100) * 2 * Math.PI * 44}
              />
            </svg>
            <span className="absolute grid size-12 place-items-center rounded-full bg-alyva/10">
              <Flame className="size-6 text-alyva" />
            </span>
          </div>
        </div>

        <p className="mt-4 text-[12px] text-muted-foreground">
          {t("nutr.goal")} <span className="font-semibold text-foreground tabular-nums">{calorieTarget.toLocaleString()}</span> {t("food.kcal")}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <MacroBlock label={t("food.carbs")} value={totals.carbs} goal={carbsTarget} color="text-alyva" />
          <MacroBlock label={t("food.protein")} value={totals.protein} goal={proteinTarget} color="text-acc-protein" />
          <MacroBlock label={t("food.fat")} value={totals.fat} goal={fatTarget} color="text-acc-fat" />
        </div>
      </section>
      </PaywallOverlay>

      <PaywallOverlay feature={t("nutr.title")} description={t("pay.overlay.food_desc")}>
      <section className="mt-5 space-y-3">
        {MEAL_TYPES.map((m) => (
          <MealSection
            key={m.id}
            type={m.id}
            label={t(`meal.${m.id}`)}
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
        <div className="mt-4 rounded-3xl border border-dashed border-border bg-card/50 p-6 text-center">
          <p className="text-sm font-semibold">
            {isToday ? t("nutr.empty_title_today") : t("nutr.empty_title_day")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{t("nutr.empty_desc")}</p>
        </div>
      )}
      </PaywallOverlay>

      <section className="mt-5 flex items-start gap-3 rounded-3xl border border-alyva/20 bg-alyva/[0.05] px-4 py-3">
        <TipIcon className="mt-0.5 size-5 shrink-0 text-alyva" />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-alyva">
            {t("nutr.tip_title")}
          </p>
          <p className="mt-0.5 text-[12px] leading-snug text-foreground/90">
            {t("today.aura.tip_default")}
          </p>
        </div>
      </section>

      {isToday && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={openScan}
            className="flex flex-col items-start rounded-3xl border border-border bg-card p-4 text-left ios-press"
          >
            <div className="grid size-10 place-items-center rounded-2xl bg-alyva/10 text-alyva">
              <ScanMealIcon className="size-5" />
            </div>
            <p className="mt-3 font-display text-sm font-semibold">{t("nutr.scan_meal")}</p>
            <p className="text-[11px] text-muted-foreground">{t("nutr.scan_sub")}</p>
          </button>
          <Link
            to="/meal-planner"
            className="flex flex-col items-start rounded-3xl border border-border bg-card p-4 text-left ios-press"
          >
            <div className="grid size-10 place-items-center rounded-2xl bg-alyva/10 text-alyva">
              <PlannerIcon className="size-5" />
            </div>
            <p className="mt-3 font-display text-sm font-semibold">{t("mealplan.title")}</p>
            <p className="text-[11px] text-muted-foreground">{t("mealplan.sub_short")}</p>
          </Link>
        </div>
      )}


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
            className="grid size-8 place-items-center rounded-full bg-alyva/12 text-alyva"
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
                <p className="text-xs font-bold tabular-nums text-alyva">{m.kcal} {tKcal}</p>
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
  return d.toLocaleDateString(LOCALE_MAP[lang] ?? undefined, { weekday: "long", day: "numeric", month: "long" });
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
