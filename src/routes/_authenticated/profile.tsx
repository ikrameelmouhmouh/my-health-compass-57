import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Settings, Sliders,
  Apple, Timer, Dumbbell, LineChart, Droplet, Footprints, Flame,
  Plus, Minus, GripVertical, Eye, EyeOff, ChevronUp, ChevronDown,
  CheckCircle2, Circle, Scale, ArrowUpRight, Bell,
} from "lucide-react";
import { useT, useI18n } from "@/lib/i18n";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useDashboardPrefs, useDayLog, useWeightLog, useTodayWorkout, useFasting,
  useCaloriePrefs, calcCalorieBudget,
  type DashCardId, type CalorieBudget, type CalorieMode,
} from "@/lib/dashboard-prefs";
import { useScheduledWorkoutForToday } from "@/lib/workout-today";
import { FoodLogDialog } from "@/components/food-log-dialog";
import { useMeals } from "@/lib/food";
import { RetentionSection } from "@/components/retention-section";
import { NotificationsSheet, useNotifications } from "@/components/notifications-sheet";

import { useServerFn } from "@tanstack/react-start";
import { ensureTodayAura } from "@/lib/notifications.functions";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Today — Vita" }] }),
  component: Profile,
});

const WATER_GOAL_ML = 2500;
const STEP_GOAL = 10000;

function Profile() {
  const t = useT();
  const { lang } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { prefs, move, toggle: toggleCard, reset } = useDashboardPrefs();
  const { day, update, addWater, addMeal } = useDayLog();
  const { log: weights, addEntry: addWeight } = useWeightLog();
  const { workout, save: saveWorkout } = useTodayWorkout();
  const scheduledToday = useScheduledWorkoutForToday();
  const effectiveWorkout = workout ?? scheduledToday;
  const { state: fasting, start: startFast, stop: stopFast } = useFasting();
  const { prefs: caloriePrefs, toggleMode: toggleCalorieMode } = useCaloriePrefs();
  const { logMeal } = useMeals();

  const [openSheet, setOpenSheet] = useState<null | "water" | "weight" | "food" | "workout" | "customize" | "notifications">(null);
  const { data: notifications = [] } = useNotifications();
  const unreadCount = notifications.filter((n) => !n.read).length;
  const ensureAuraFn = useServerFn(ensureTodayAura);

  const { data, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [profileRes, subRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle(),
        supabase.from("subscriptions").select("*").eq("user_id", user!.id).maybeSingle(),
      ]);
      return { profile: profileRes.data, subscription: subRes.data };
    },
  });

  useEffect(() => {
    if (!isLoading && data && !data.profile?.onboarding_completed) {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [isLoading, data, navigate]);

  const fastInfo = useMemo(() => {
    if (!fasting.startedAt) return { active: false, hoursElapsed: 0, hoursLeft: 0, pct: 0 };
    const elapsedMs = Date.now() - new Date(fasting.startedAt).getTime();
    const elapsedH = elapsedMs / 3_600_000;
    return {
      active: true,
      hoursElapsed: elapsedH,
      hoursLeft: Math.max(0, fasting.windowHours - elapsedH),
      pct: Math.min(100, (elapsedH / fasting.windowHours) * 100),
    };
  }, [fasting]);

  const [, setTick] = useState(0);
  useEffect(() => {
    if (!fasting.startedAt) return;
    const id = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, [fasting.startedAt]);

  if (isLoading || !data?.profile?.onboarding_completed) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-background">
        <div className="size-6 animate-spin rounded-full border-2 border-border border-t-brand" />
      </div>
    );
  }

  const p = data.profile;
  const sub = data.subscription;
  const isPremium = !!sub && ["active", "trialing", "past_due"].includes(sub.status) && (!sub.current_period_end || new Date(sub.current_period_end).getTime() > Date.now());

  const calorieTarget = p.daily_calories ?? 0;
  const proteinTarget = p.protein_g ?? 0;
  const carbsTarget = p.carbs_g ?? 0;
  const fatTarget = p.fat_g ?? 0;

  const budget = calcCalorieBudget({
    target: calorieTarget,
    eaten: day.caloriesIn,
    workoutBurn: day.caloriesOut,
    steps: day.steps,
    prefs: caloriePrefs,
  });

  const waterPct = pct(day.waterMl, WATER_GOAL_ML);
  const stepsPct = pct(day.steps, STEP_GOAL);
  const nutritionPct = pct(day.caloriesIn, budget.allowance);
  const workoutDone = day.workoutCompleted ? 100 : effectiveWorkout ? 0 : 0;

  const overallPct = Math.round(
    (Math.min(waterPct, 100) + Math.min(stepsPct, 100) + Math.min(nutritionPct, 100) + (day.workoutCompleted ? 100 : 0)) / 4
  );

  const currentWeight = weights.at(-1)?.kg ?? Number(p.current_weight_kg ?? 0);
  const previousWeight = weights.at(-2)?.kg ?? Number(p.current_weight_kg ?? currentWeight);
  const weightDelta = +(currentWeight - previousWeight).toFixed(1);
  const goalWeight = Number(p.goal_weight_kg ?? currentWeight);
  const startWeight = Number(p.current_weight_kg ?? currentWeight);
  const goalProgress = goalWeight !== startWeight
    ? Math.max(0, Math.min(100, ((startWeight - currentWeight) / (startWeight - goalWeight)) * 100))
    : 0;

  const greeting = greetingFor(new Date(), t);

  // Compute Aura insight strings from today's data (same logic as the old card).
  const aura = useMemo(() => {
    const steps = day.steps;
    const stepGoal = STEP_GOAL;
    const caloriesIn = day.caloriesIn;
    const caloriesOut = day.caloriesOut;
    const waterMl = day.waterMl;
    const waterGoal = WATER_GOAL_ML;
    const stepsLow = steps < stepGoal * 0.5;
    const stepsOk = steps >= stepGoal * 0.8;
    const waterLow = waterMl < waterGoal * 0.5;
    const remaining = Math.max(0, calorieTarget - caloriesIn + Math.round(caloriesOut * 0.5));
    const recommended = Math.max(0, Math.round(calorieTarget + caloriesOut * 0.5));
    const facts: string[] = [];
    if (steps > 0) facts.push(t("today.aura.fact_steps", { n: steps.toLocaleString() }));
    if (fastInfo.active) facts.push(t("today.aura.fact_fast", { n: Math.floor(fastInfo.hoursElapsed) }));
    if (caloriesOut > 0) facts.push(t("today.aura.fact_burn", { n: caloriesOut }));
    if (caloriesIn > 0) facts.push(t("today.aura.fact_eaten", { n: caloriesIn }));
    const summary = facts.length === 0
      ? t("today.aura.empty")
      : t("today.aura.summary", { facts: facts.join(" · ") });
    let tip = t("today.aura.tip_default");
    if (stepsLow) tip = t("today.aura.tip_steps");
    else if (waterLow) tip = t("today.aura.tip_water");
    else if (stepsOk && remaining < calorieTarget * 0.2) tip = t("today.aura.tip_lowcal");
    const advice = `${t("today.aura.advice_kcal", { n: recommended.toLocaleString() })} ${tip}`;
    return { title: t("today.aura.title"), body: summary, advice, tip };
  }, [day.steps, day.caloriesIn, day.caloriesOut, day.waterMl, calorieTarget, fastInfo.active, fastInfo.hoursElapsed, t]);

  // Ensure today's Aura insight is stored as a notification (once per day per user).
  const ensuredRef = useRef<string | null>(null);
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (ensuredRef.current === today) return;
    ensuredRef.current = today;
    ensureAuraFn({ data: { title: aura.title, body: aura.body, advice: aura.advice } }).catch(() => {
      ensuredRef.current = null;
    });
  }, [aura.title, aura.body, aura.advice, ensureAuraFn]);

  const visibleCards = prefs.order.filter((c) => !prefs.hidden.includes(c));

  const PAIRS: Array<[DashCardId, DashCardId]> = [
    ["water", "steps"],
    ["activity", "weight"],
  ];
  const isPair = (a: DashCardId, b: DashCardId) =>
    PAIRS.some(([x, y]) => (a === x && b === y) || (a === y && b === x));
  const rows: DashCardId[][] = [];
  for (let i = 0; i < visibleCards.length; i++) {
    const cur = visibleCards[i];
    const nxt = visibleCards[i + 1];
    if (nxt && isPair(cur, nxt)) {
      rows.push([cur, nxt]);
      i++;
    } else {
      rows.push([cur]);
    }
  }

  function renderCard(id: DashCardId, compact = false) {
    switch (id) {
      case "nutrition":
        return (
          <NutritionCard
            key={id}
            budget={budget}
            meals={day.meals}
            mode={caloriePrefs.mode}
            onToggleMode={toggleCalorieMode}
            onLogFood={() => setOpenSheet("food")}
            protein={{ have: day.protein, goal: proteinTarget }}
            carbs={{ have: day.carbs, goal: carbsTarget }}
            fat={{ have: day.fat, goal: fatTarget }}
          />
        );
      case "macros":
        return (
          <MacroCard
            key={id}
            protein={{ have: day.protein, goal: proteinTarget }}
            carbs={{ have: day.carbs, goal: carbsTarget }}
            fat={{ have: day.fat, goal: fatTarget }}
          />
        );
      case "water":
        return (
          <WaterCard
            key={id}
            compact={compact}
            ml={day.waterMl}
            goal={WATER_GOAL_ML}
            onAdd={(amt) => addWater(amt)}
            onOpen={() => setOpenSheet("water")}
          />
        );
      case "steps":
        return (
          <StepsCard
            key={id}
            compact={compact}
            steps={day.steps}
            goal={STEP_GOAL}
            onChange={(s) => update({ steps: s })}
          />
        );
      case "fasting":
        return (
          <FastingCard
            key={id}
            active={fastInfo.active}
            elapsed={fastInfo.hoursElapsed}
            remaining={fastInfo.hoursLeft}
            windowHours={fasting.windowHours}
            pct={fastInfo.pct}
            streak={fasting.streak}
            onStart={startFast}
            onStop={stopFast}
          />
        );
      case "weight":
        return (
          <WeightCard
            key={id}
            compact={compact}
            current={currentWeight}
            delta={weightDelta}
            goal={goalWeight}
            progress={goalProgress}
            onLog={() => setOpenSheet("weight")}
          />
        );
      case "activity":
        return (
          <ActivityCard
            key={id}
            compact={compact}
            burned={day.caloriesOut}
            activeMin={day.activeMin}
            onChange={(b, m) => update({ caloriesOut: b, activeMin: m })}
          />
        );
      case "workout":
        return (
          <WorkoutCard
            key={id}
            workout={effectiveWorkout}
            completed={day.workoutCompleted}
            onCreate={() => navigate({ to: "/fitness" })}
            onStart={() => update({ workoutCompleted: true })}
            onClear={() => { saveWorkout(null); update({ workoutCompleted: false }); }}
          />
        );
      case "goals":
        return (
          <GoalsCard
            key={id}
            nutrition={nutritionPct}
            water={waterPct}
            steps={stepsPct}
            workout={workoutDone}
            overall={overallPct}
          />
        );
    }
  }

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-background px-4 pb-32 pt-4">
      <header className="flex items-start justify-between gap-3 px-1">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
            {greeting}
          </p>
          <h1 className="mt-0.5 truncate text-[34px] font-bold leading-[1.05] tracking-tight">
            {p.display_name || "—"}
          </h1>
          <p className="mt-1 text-[13px] font-medium text-muted-foreground">
            {formatToday(lang)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <IconBtn aria-label={t("notif.open")} onClick={() => setOpenSheet("notifications")} className="relative">
            <Bell className="size-[18px]" strokeWidth={2} />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid min-w-[16px] h-[16px] place-items-center rounded-full bg-brand px-1 text-[9px] font-bold leading-none text-brand-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </IconBtn>
          <IconBtn aria-label={t("today.customize")} onClick={() => setOpenSheet("customize")}>
            <Sliders className="size-[18px]" strokeWidth={2} />
          </IconBtn>
          <Link
            to="/settings"
            aria-label={t("today.settings")}
            className="ios-press inline-flex size-9 items-center justify-center rounded-full bg-secondary text-foreground"
          >
            <Settings className="size-[18px]" strokeWidth={2} />
          </Link>
        </div>
      </header>

      {!isPremium ? (
        <Link
          to="/pricing"
          className="mt-3 flex items-center justify-between rounded-2xl border border-brand/30 bg-gradient-to-r from-brand/10 to-brand/5 px-3.5 py-2.5 ios-press"
        >
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-full bg-brand/15 text-brand">
              <ArrowUpRight className="size-4" />
            </span>
            <div>
              <div className="text-[12px] font-semibold leading-tight">{t("today.upgrade.title")}</div>
              <div className="text-[10px] text-muted-foreground">{t("today.upgrade.sub")}</div>
            </div>
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand">{t("today.upgrade.cta")}</span>
        </Link>
      ) : (
        <div className="mt-3 flex items-center px-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1">
            <span className="size-1.5 rounded-full bg-brand" />
            <span className="text-[12px] font-semibold uppercase tracking-wider">Vita {t("profile.plus")}</span>
          </div>
        </div>
      )}

      




      <section className="mt-5 space-y-3">
        {rows.map((row, i) =>
          row.length === 2 ? (
            <div key={`row-${i}`} className="grid grid-cols-2 gap-3">
              {renderCard(row[0], true)}
              {renderCard(row[1], true)}
            </div>
          ) : (
            renderCard(row[0], false)
          )
        )}
        {visibleCards.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border bg-card/50 p-8 text-center">
            <p className="text-sm text-muted-foreground">{t("today.empty.hidden")}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setOpenSheet("customize")}>
              {t("today.customize")}
            </Button>
          </div>
        )}
      </section>

      <div className="mt-5">
        <RetentionSection />
      </div>

      <CustomizeSheet
        open={openSheet === "customize"}
        onOpenChange={(o) => !o && setOpenSheet(null)}
        order={prefs.order}
        hidden={prefs.hidden}
        onMove={move}
        onToggle={toggleCard}
        onReset={reset}
      />

      <WaterDialog open={openSheet === "water"} onOpenChange={(o) => !o && setOpenSheet(null)} ml={day.waterMl} goal={WATER_GOAL_ML} onAdd={addWater} />

      <WeightDialog
        open={openSheet === "weight"}
        onOpenChange={(o) => !o && setOpenSheet(null)}
        current={currentWeight}
        onSubmit={(kg) => { addWeight(kg); setOpenSheet(null); }}
      />

      <FoodLogDialog
        open={openSheet === "food"}
        onOpenChange={(o) => !o && setOpenSheet(null)}
        onLogged={(entry) => {
          logMeal({ food: entry.food, serving: entry.serving, servingCount: entry.servingCount, mealType: entry.mealType });
          addMeal({ kcal: entry.kcal, protein: entry.protein, carbs: entry.carbs, fat: entry.fat });
          setOpenSheet(null);
        }}
      />

      <WorkoutDialog
        open={openSheet === "workout"}
        onOpenChange={(o) => !o && setOpenSheet(null)}
        initial={workout}
        onSubmit={(w) => { saveWorkout(w); setOpenSheet(null); }}
      />

      <NotificationsSheet
        open={openSheet === "notifications"}
        onOpenChange={(o) => !o && setOpenSheet(null)}
      />
    </main>
  );
}

/* ------------------------------- UI Helpers ------------------------------- */
function IconBtn({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex size-9 items-center justify-center rounded-full border border-border bg-card transition hover:bg-accent ${className ?? ""}`}
    >
      {children}
    </button>
  );
}

function CardShell({ title, icon: Icon, children, action, compact }: { title: string; icon: React.ElementType; children: React.ReactNode; action?: React.ReactNode; compact?: boolean }) {
  return (
    <div className={`rounded-3xl border border-border bg-card ${compact ? "p-4" : "p-5"}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className={`grid shrink-0 place-items-center rounded-xl bg-brand/12 ${compact ? "size-7" : "size-8"}`}>
            <Icon className={compact ? "size-3.5 text-brand" : "size-4 text-brand"} />
          </div>
          <h2 className="truncate font-display text-[12px] font-semibold tracking-tight sm:text-[13px]">{title}</h2>
        </div>
        {action}
      </div>
      <div className={compact ? "mt-3" : "mt-4"}>{children}</div>
    </div>
  );
}

function Bar({ pct: p, className = "" }: { pct: number; className?: string }) {
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-border ${className}`}>
      <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${Math.min(100, p)}%` }} />
    </div>
  );
}

function Ring({ pct: p, size = 76, label, sub }: { pct: number; size?: number; label: string; sub?: string }) {
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (Math.min(100, p) / 100) * c;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="currentColor" strokeOpacity={0.12} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke="currentColor" className="text-brand"
          strokeWidth={stroke} strokeLinecap="round" fill="none"
          strokeDasharray={c} strokeDashoffset={off}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-base font-semibold tabular-nums leading-none">{label}</div>
        {sub && <div className="mt-0.5 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">{sub}</div>}
      </div>
    </div>
  );
}

/* --------------------------------- Cards --------------------------------- */
function NutritionCard({ budget, mode, onToggleMode, onLogFood, protein, carbs, fat }: {
  budget: CalorieBudget; meals: number; mode: CalorieMode; onToggleMode: () => void; onLogFood: () => void;
  protein: { have: number; goal: number };
  carbs: { have: number; goal: number };
  fat: { have: number; goal: number };
}) {
  const t = useT();
  const consumedPct = Math.min(100, pct(budget.eaten, budget.allowance));
  const remaining = Math.max(0, budget.remaining);
  const over = budget.remaining < 0;
  const headline = over
    ? t("today.cal.over", { n: Math.abs(budget.remaining).toLocaleString() })
    : t("today.cal.left", { n: remaining.toLocaleString() });
  return (
    <CardShell title={t("today.cal.title")} icon={Apple} action={
      <div className="flex items-center gap-1.5">
        <button
          onClick={onToggleMode}
          title={mode === "smart" ? t("today.cal.mode_smart") : t("today.cal.mode_standard")}
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border ${mode === "smart" ? "border-brand/60 bg-brand/10 text-brand" : "border-border bg-background text-muted-foreground"}`}
        >
          {mode === "smart" ? t("today.cal.smart") : t("today.cal.standard")}
        </button>
        <button onClick={onLogFood} className="inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-[11px] font-semibold text-brand-foreground">
          <Plus className="size-3" /> {t("today.cal.log")}
        </button>
      </div>
    }>
      <div className="pt-2">
        <div className="flex items-start justify-between gap-4">
          <h3 className={`font-display text-[22px] leading-[1.15] font-semibold tracking-tight ${over ? "text-destructive" : "text-foreground"}`}>
            {headline}
          </h3>
          <div className="shrink-0 text-right">
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{t("today.cal.goal")}</div>
            <div className="font-display text-sm font-semibold tabular-nums text-muted-foreground">
              {budget.allowance.toLocaleString()}
            </div>
            {mode === "smart" && budget.earned > 0 && (
              <div className="mt-0.5 text-[10px] font-medium tabular-nums text-brand">
                {t("today.cal.earned", { n: budget.earned.toLocaleString() })}
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
          <div
            className={`h-full rounded-full transition-all duration-500 ${over ? "bg-destructive" : "bg-brand"}`}
            style={{ width: `${consumedPct}%` }}
          />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-lg font-semibold tabular-nums text-foreground">
              {budget.eaten.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground">{t("today.cal.eaten")}</span>
          </div>
          {budget.totalBurn > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand">
              <Flame className="size-3" />
              {t("today.cal.burned", { n: budget.totalBurn.toLocaleString() })}
            </span>
          )}
        </div>

        {mode === "smart" && budget.totalBurn > 0 && (
          <p className="mt-2 text-[11px] text-muted-foreground">
            {t("today.cal.smart_note", { n: budget.earned.toLocaleString() })}
          </p>
        )}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border/60 pt-4">
        <MacroBlock label={t("today.macro.protein")} {...protein} />
        <MacroBlock label={t("today.macro.carbs")} {...carbs} />
        <MacroBlock label={t("today.macro.fat")} {...fat} />
      </div>
    </CardShell>
  );
}

function MacroCard({ protein, carbs, fat }: {
  protein: { have: number; goal: number };
  carbs: { have: number; goal: number };
  fat: { have: number; goal: number };
}) {
  const t = useT();
  return (
    <CardShell title={t("today.macro.title")} icon={LineChart}>
      <div className="grid grid-cols-3 gap-3">
        <MacroBlock label={t("today.macro.protein")} {...protein} />
        <MacroBlock label={t("today.macro.carbs")} {...carbs} />
        <MacroBlock label={t("today.macro.fat")} {...fat} />
      </div>
    </CardShell>
  );
}

function MacroBlock({ label, have, goal }: { label: string; have: number; goal: number }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/40 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className="font-display text-lg font-semibold tabular-nums">{Math.round(have)}</span>
        <span className="text-[10px] text-muted-foreground">/ {goal}g</span>
      </div>
      <Bar pct={pct(have, goal)} className="mt-2" />
    </div>
  );
}

function WaterCard({ ml, goal, onAdd, onOpen, compact }: { ml: number; goal: number; onAdd: (n: number) => void; onOpen: () => void; compact?: boolean }) {
  const t = useT();
  return (
    <CardShell title={t("today.water.title")} icon={Droplet} compact={compact} action={
      !compact && (
        <button onClick={onOpen} className="text-[11px] font-medium text-muted-foreground hover:text-foreground">{t("today.water.details")}</button>
      )
    }>
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <div className={`font-display font-semibold tabular-nums leading-none ${compact ? "text-2xl" : "text-3xl"}`}>{(ml / 1000).toFixed(2)}<span className="text-base">L</span></div>
          <div className="mt-1 text-[10px] text-muted-foreground">{t("today.water.of", { goal: (goal / 1000).toFixed(1), pct: Math.round(pct(ml, goal)) })}</div>
        </div>
        <div className="flex shrink-0 gap-1">
          <button onClick={() => onAdd(-250)} className={`grid place-items-center rounded-full border border-border bg-background hover:bg-accent ${compact ? "size-7" : "size-9"}`}><Minus className={compact ? "size-3" : "size-4"} /></button>
          <button onClick={() => onAdd(250)} className={`grid place-items-center rounded-full bg-brand text-brand-foreground ${compact ? "size-7" : "size-9"}`}><Plus className={compact ? "size-3" : "size-4"} /></button>
        </div>
      </div>
      <Bar pct={pct(ml, goal)} className={compact ? "mt-3" : "mt-4"} />
      {!compact && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[250, 500, 750].map((amt) => (
            <button key={amt} onClick={() => onAdd(amt)} className="rounded-xl border border-border bg-background/50 px-2 py-1.5 text-[11px] font-semibold hover:bg-accent">
              +{amt}ml
            </button>
          ))}
        </div>
      )}
    </CardShell>
  );
}

function StepsCard({ steps, goal, compact }: { steps: number; goal: number; onChange?: (s: number) => void; compact?: boolean }) {
  const t = useT();
  return (
    <CardShell title={t("today.steps.title")} icon={Footprints} compact={compact}>
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <div className={`font-display font-semibold tabular-nums leading-none ${compact ? "text-2xl" : "text-3xl"}`}>{steps.toLocaleString()}</div>
          <div className="mt-1 text-[10px] text-muted-foreground">{t("today.steps.of", { goal: goal.toLocaleString(), pct: Math.round(pct(steps, goal)) })}</div>
        </div>
        {!compact && (
          <div className="text-right text-[11px] text-muted-foreground">
            <div>{Math.max(0, goal - steps).toLocaleString()}</div>
            <div className="text-[10px] uppercase tracking-wider">{t("today.steps.togo")}</div>
          </div>
        )}
      </div>
      <Bar pct={pct(steps, goal)} className={compact ? "mt-3" : "mt-4"} />
      <div className={`${compact ? "mt-2" : "mt-3"} text-[10px] text-muted-foreground`}>
        {t("today.steps.sync")}
      </div>
    </CardShell>
  );
}

function FastingCard({ active, elapsed, remaining, windowHours, pct: p, streak, onStart, onStop }: {
  active: boolean; elapsed: number; remaining: number; windowHours: number; pct: number; streak: number;
  onStart: () => void; onStop: () => void;
}) {
  const t = useT();
  return (
    <CardShell title={t("today.fast.title")} icon={Timer} action={
      <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
        {t("today.fast.streak", { n: streak })}
      </span>
    }>
      <div className="flex items-center gap-5">
        <Ring
          pct={active ? p : 0}
          label={active ? formatHours(elapsed) : "—"}
          sub={active ? t("today.fast.elapsed") : t("today.fast.not_fasting")}
        />
        <div className="flex-1 space-y-1.5">
          <StatRow label={t("today.fast.status")} value={active ? t("today.fast.fasting") : t("today.fast.eating")} accent />
          <StatRow label={t("today.fast.window")} value={`${windowHours}:${24 - windowHours}`} />
          <StatRow label={active ? t("today.fast.until_done") : t("today.fast.last_streak")} value={active ? formatHours(remaining) : t("today.fast.days", { n: streak })} muted />
          <Button
            size="sm"
            variant={active ? "outline" : "default"}
            className="mt-2 h-8 w-full"
            onClick={active ? onStop : onStart}
          >
            {active ? t("today.fast.end") : t("today.fast.start")}
          </Button>
        </div>
      </div>
    </CardShell>
  );
}

function WeightCard({ current, delta, goal, progress, onLog, compact }: {
  current: number; delta: number; goal: number; progress: number; onLog: () => void; compact?: boolean;
}) {
  const t = useT();
  const deltaColor = delta < 0 ? "text-brand" : delta > 0 ? "text-destructive" : "text-muted-foreground";
  return (
    <CardShell title={t("today.weight.title")} icon={Scale} compact={compact} action={
      <button onClick={onLog} className={`inline-flex items-center gap-1 rounded-full bg-brand font-semibold text-brand-foreground ${compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]"}`}>
        <Plus className="size-3" /> {t("today.weight.log")}
      </button>
    }>
      {compact ? (
        <>
          <div className="font-display text-2xl font-semibold tabular-nums leading-none">
            {current.toFixed(1)}<span className="ml-0.5 text-sm text-muted-foreground">kg</span>
          </div>
          <div className={`mt-1 inline-flex items-center gap-1 text-[10px] font-semibold ${deltaColor}`}>
            <ArrowUpRight className={`size-3 ${delta < 0 ? "rotate-180" : ""}`} />
            {delta === 0 ? t("today.weight.no_change") : `${delta > 0 ? "+" : ""}${delta.toFixed(1)} kg`}
          </div>
          <Bar pct={progress} className="mt-3" />
          <div className="mt-1.5 flex items-baseline justify-between text-[10px] text-muted-foreground">
            <span>{t("today.weight.pct_compact", { pct: Math.round(progress) })}</span>
            <span className="font-display font-semibold tabular-nums text-foreground">{goal.toFixed(1)} kg</span>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-end justify-between">
            <div>
              <div className="font-display text-3xl font-semibold tabular-nums leading-none">{current.toFixed(1)}<span className="ml-1 text-sm text-muted-foreground">kg</span></div>
              <div className={`mt-1 inline-flex items-center gap-1 text-[11px] font-semibold ${deltaColor}`}>
                <ArrowUpRight className={`size-3 ${delta < 0 ? "rotate-180" : ""}`} />
                {delta === 0 ? t("today.weight.no_change") : `${delta > 0 ? "+" : ""}${delta.toFixed(1)} kg`}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t("today.weight.goal")}</div>
              <div className="font-display text-lg font-semibold tabular-nums">{goal.toFixed(1)} kg</div>
            </div>
          </div>
          <Bar pct={progress} className="mt-4" />
          <div className="mt-2 text-[11px] text-muted-foreground">{t("today.weight.pct", { pct: Math.round(progress) })}</div>
        </>
      )}
    </CardShell>
  );
}

function ActivityCard({ burned, activeMin, onChange, compact }: { burned: number; activeMin: number; onChange: (b: number, m: number) => void; compact?: boolean }) {
  const t = useT();
  const goalKcal = 500;
  const p = pct(burned, goalKcal);
  return (
    <CardShell title={t("today.activity.title")} icon={Flame} compact={compact}>
      {compact ? (
        <>
          <div className="flex items-baseline gap-1">
            <input
              type="number"
              value={burned}
              onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0), activeMin)}
              className="w-14 bg-transparent font-display text-2xl font-semibold tabular-nums leading-none outline-none"
            />
            <span className="text-[11px] text-muted-foreground">{t("today.activity.kcal")}</span>
          </div>
          <div className="mt-1 text-[10px] text-muted-foreground">
            <input
              type="number"
              value={activeMin}
              onChange={(e) => onChange(burned, Math.max(0, Number(e.target.value) || 0))}
              className="w-8 bg-transparent text-[10px] font-semibold tabular-nums text-foreground outline-none"
            />
            <span> {t("today.activity.active_min")}</span>
          </div>
          <Bar pct={p} className="mt-3" />
          <div className="mt-1.5 text-[10px] text-muted-foreground">{t("today.activity.pct_of", { pct: Math.round(p), goal: goalKcal })}</div>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border/60 bg-background/40 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t("today.activity.burned")}</div>
            <div className="mt-1 flex items-baseline gap-1">
              <input
                type="number"
                value={burned}
                onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0), activeMin)}
                className="w-16 bg-transparent font-display text-xl font-semibold tabular-nums outline-none"
              />
              <span className="text-[10px] text-muted-foreground">{t("today.activity.kcal")}</span>
            </div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/40 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t("today.activity.active")}</div>
            <div className="mt-1 flex items-baseline gap-1">
              <input
                type="number"
                value={activeMin}
                onChange={(e) => onChange(burned, Math.max(0, Number(e.target.value) || 0))}
                className="w-16 bg-transparent font-display text-xl font-semibold tabular-nums outline-none"
              />
              <span className="text-[10px] text-muted-foreground">{t("today.activity.min")}</span>
            </div>
          </div>
        </div>
      )}
    </CardShell>
  );
}

function WorkoutCard({ workout, completed, onCreate, onStart, onClear }: {
  workout: { name: string; type: string; time?: string; durationMin: number } | null;
  completed: boolean; onCreate: () => void; onStart: () => void; onClear: () => void;
}) {
  const t = useT();
  return (
    <CardShell title={t("today.workout.title")} icon={Dumbbell} action={
      workout ? (
        <button onClick={onClear} className="text-[11px] font-medium text-muted-foreground hover:text-foreground">{t("today.workout.clear")}</button>
      ) : null
    }>
      {workout ? (
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-display text-lg font-semibold leading-tight">{workout.name}</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">{workout.type} · {workout.durationMin} {t("today.activity.min")}{workout.time ? ` · ${workout.time}` : ""}</div>
            </div>
            {completed && <span className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-semibold text-brand"><CheckCircle2 className="size-3" /> {t("today.workout.done")}</span>}
          </div>
          <Button
            size="sm" className="mt-4 h-9 w-full"
            disabled={completed}
            onClick={onStart}
          >
            {completed ? t("today.workout.completed") : t("today.workout.start")}
          </Button>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-[13px] text-muted-foreground">{t("today.workout.none")}</p>
          <Button size="sm" variant="outline" className="mt-3 h-9 w-full" onClick={onCreate}>
            <Plus className="size-3.5" /> {t("today.workout.create")}
          </Button>
        </div>
      )}
    </CardShell>
  );
}



function GoalsCard({ nutrition, water, steps, workout, overall }: {
  nutrition: number; water: number; steps: number; workout: number; overall: number;
}) {
  const t = useT();
  return (
    <CardShell title={t("today.goals.title")} icon={CheckCircle2}>
      <div className="flex items-center gap-5">
        <Ring pct={overall} label={`${overall}%`} sub={t("today.goals.overall")} />
        <div className="flex-1 space-y-2.5">
          <GoalRow label={t("today.goals.nutrition")} pct={nutrition} />
          <GoalRow label={t("today.goals.water")} pct={water} />
          <GoalRow label={t("today.goals.steps")} pct={steps} />
          <GoalRow label={t("today.goals.workout")} pct={workout} done={workout >= 100} />
        </div>
      </div>
    </CardShell>
  );
}

function GoalRow({ label, pct: p, done }: { label: string; pct: number; done?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      {done ? <CheckCircle2 className="size-3.5 text-brand" /> : <Circle className="size-3.5 text-muted-foreground" />}
      <span className="w-16 text-[11px] font-semibold">{label}</span>
      <Bar pct={p} />
      <span className="w-9 text-right text-[10px] font-semibold tabular-nums text-muted-foreground">{Math.round(Math.min(100, p))}%</span>
    </div>
  );
}

function StatRow({ label, value, accent, muted }: { label: string; value: string; accent?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className={`text-[10px] uppercase tracking-wider ${muted ? "text-muted-foreground/70" : "text-muted-foreground"}`}>{label}</span>
      <span className={`font-display text-[12px] font-semibold tabular-nums ${accent ? "text-brand" : ""}`}>{value}</span>
    </div>
  );
}

/* ----------------------------- Customize Sheet ----------------------------- */
function CustomizeSheet({ open, onOpenChange, order, hidden, onMove, onToggle, onReset }: {
  open: boolean; onOpenChange: (o: boolean) => void;
  order: DashCardId[]; hidden: DashCardId[];
  onMove: (id: DashCardId, dir: -1 | 1) => void;
  onToggle: (id: DashCardId) => void;
  onReset: () => void;
}) {
  const t = useT();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader>
          <SheetTitle className="font-display">{t("today.customize.title")}</SheetTitle>
          <SheetDescription>{t("today.customize.desc")}</SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-2">
          {order.map((id, i) => {
            const isHidden = hidden.includes(id);
            return (
              <div key={id} className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2">
                <GripVertical className="size-4 text-muted-foreground" />
                <span className={`flex-1 font-display text-sm font-semibold ${isHidden ? "text-muted-foreground line-through" : ""}`}>
                  {t(`cards.${id}`)}
                </span>
                <button onClick={() => onMove(id, -1)} disabled={i === 0} className="grid size-7 place-items-center rounded-md border border-border disabled:opacity-30">
                  <ChevronUp className="size-3.5" />
                </button>
                <button onClick={() => onMove(id, 1)} disabled={i === order.length - 1} className="grid size-7 place-items-center rounded-md border border-border disabled:opacity-30">
                  <ChevronDown className="size-3.5" />
                </button>
                <button onClick={() => onToggle(id)} className="grid size-7 place-items-center rounded-md border border-border">
                  {isHidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>
            );
          })}
        </div>
        <SheetFooter className="mt-4">
          <Button variant="ghost" size="sm" onClick={onReset}>{t("today.customize.reset")}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/* ------------------------------- Dialogs ------------------------------- */
function WaterDialog({ open, onOpenChange, ml, goal, onAdd }: {
  open: boolean; onOpenChange: (o: boolean) => void; ml: number; goal: number; onAdd: (n: number) => void;
}) {
  const t = useT();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">{t("today.water.add")}</DialogTitle>
          <DialogDescription>{t("today.water.of_dialog", { ml: (ml / 1000).toFixed(2), goal: (goal / 1000).toFixed(1) })}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-2">
          {[100, 250, 330, 500, 750, 1000].map((n) => (
            <Button key={n} variant="outline" onClick={() => onAdd(n)}>+{n}ml</Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WeightDialog({ open, onOpenChange, current, onSubmit }: {
  open: boolean; onOpenChange: (o: boolean) => void; current: number; onSubmit: (kg: number) => void;
}) {
  const t = useT();
  const [val, setVal] = useState(String(current.toFixed(1)));
  useEffect(() => { if (open) setVal(String(current.toFixed(1))); }, [open, current]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">{t("today.weight.log_dialog")}</DialogTitle>
          <DialogDescription>{t("today.weight.current", { kg: current.toFixed(1) })}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="w">{t("today.weight.field")}</Label>
          <Input id="w" type="number" inputMode="decimal" step="0.1" value={val} onChange={(e) => setVal(e.target.value)} />
        </div>
        <DialogFooter>
          <Button onClick={() => { const n = parseFloat(val); if (!isNaN(n) && n > 0) onSubmit(n); }}>{t("today.weight.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function WorkoutDialog({ open, onOpenChange, initial, onSubmit }: {
  open: boolean; onOpenChange: (o: boolean) => void;
  initial: { name: string; type: string; time?: string; durationMin: number } | null;
  onSubmit: (w: { name: string; type: string; time?: string; durationMin: number }) => void;
}) {
  const t = useT();
  const defaultName = t("today.workout.default_name");
  const defaultType = t("today.workout.default_type");
  const [name, setName] = useState(initial?.name ?? defaultName);
  const [type, setType] = useState(initial?.type ?? defaultType);
  const [time, setTime] = useState(initial?.time ?? "");
  const [duration, setDuration] = useState(String(initial?.durationMin ?? 45));
  useEffect(() => {
    if (open) {
      setName(initial?.name ?? defaultName);
      setType(initial?.type ?? defaultType);
      setTime(initial?.time ?? "");
      setDuration(String(initial?.durationMin ?? 45));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">{t("today.workout.schedule")}</DialogTitle>
          <DialogDescription>{t("today.workout.plan_desc")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field label={t("today.workout.name")} value={name} onChange={setName} type="text" />
          <Field label={t("today.workout.type")} value={type} onChange={setType} type="text" />
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("today.workout.time")} value={time} onChange={setTime} type="time" />
            <Field label={t("today.workout.duration")} value={duration} onChange={setDuration} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onSubmit({ name, type, time: time || undefined, durationMin: +duration || 30 })}>{t("today.workout.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, onChange, type = "number" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px]">{label}</Label>
      <Input type={type} inputMode={type === "number" ? "decimal" : undefined} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/* ------------------------------- Utils ------------------------------- */
function pct(have: number, goal: number): number {
  if (!goal || goal <= 0) return 0;
  return (have / goal) * 100;
}

function formatHours(h: number) {
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return `${hrs}h ${mins}m`;
}

function greetingFor(d: Date, t: (k: string) => string) {
  const h = d.getHours();
  if (h < 5) return t("today.greet.late_night");
  if (h < 12) return t("today.greet.morning");
  if (h < 17) return t("today.greet.afternoon");
  if (h < 22) return t("today.greet.evening");
  return t("today.greet.night");
}

const LOCALE_MAP: Record<string, string> = {
  en: "en-US", nl: "nl-NL", ar: "ar", fr: "fr-FR", de: "de-DE", es: "es-ES",
};

function formatToday(lang: string) {
  return new Date().toLocaleDateString(LOCALE_MAP[lang] ?? undefined, { weekday: "long", month: "long", day: "numeric" });
}
