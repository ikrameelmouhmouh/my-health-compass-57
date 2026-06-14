import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useState } from "react";
import {
  LogOut, Settings2, Sun, Moon, Globe, Check,
  Apple, Timer, Dumbbell, LineChart, Droplet, Footprints, Flame,
  Plus, Minus, Sliders, GripVertical, Eye, EyeOff, ChevronUp, ChevronDown,
  CheckCircle2, Circle, PlayCircle, Scale, UtensilsCrossed, ArrowUpRight,
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { LANGUAGES, useI18n, useT, type Language } from "@/lib/i18n";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useDashboardPrefs, useDayLog, useWeightLog, useTodayWorkout, useFasting,
  CARD_LABELS, type DashCardId,
} from "@/lib/dashboard-prefs";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Today — Vita" }] }),
  component: Profile,
});

const WATER_GOAL_ML = 2500;
const STEP_GOAL = 10000;

function Profile() {
  const t = useT();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const { lang, setLang } = useI18n();
  const qc = useQueryClient();

  const { prefs, move, toggle: toggleCard, reset } = useDashboardPrefs();
  const { day, update, addWater, addMeal } = useDayLog();
  const { log: weights, addEntry: addWeight } = useWeightLog();
  const { workout, save: saveWorkout } = useTodayWorkout();
  const { state: fasting, start: startFast, stop: stopFast } = useFasting();

  // dialog state
  const [openSheet, setOpenSheet] = useState<null | "water" | "weight" | "food" | "workout" | "customize">(null);

  const { data, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [profileRes, subRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle(),
        supabase.from("subscriptions").select("*").eq("user_id", user!.id).maybeSingle(),
      ]);
      if (profileRes.data?.language && profileRes.data.language !== lang) {
        setLang(profileRes.data.language as Language);
      }
      return { profile: profileRes.data, subscription: subRes.data };
    },
  });

  useEffect(() => {
    if (!isLoading && data && !data.profile?.onboarding_completed) {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [isLoading, data, navigate]);

  if (isLoading || !data?.profile?.onboarding_completed) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-background">
        <div className="size-6 animate-spin rounded-full border-2 border-border border-t-brand" />
      </div>
    );
  }

  const p = data.profile;
  const sub = data.subscription;
  const isPremium = sub?.tier === "premium" && sub?.status === "active";

  // Derived stats
  const calorieTarget = p.daily_calories ?? 0;
  const caloriesRemaining = Math.max(0, calorieTarget - day.caloriesIn);
  const proteinTarget = p.protein_g ?? 0;
  const carbsTarget = p.carbs_g ?? 0;
  const fatTarget = p.fat_g ?? 0;

  const waterPct = pct(day.waterMl, WATER_GOAL_ML);
  const stepsPct = pct(day.steps, STEP_GOAL);
  const nutritionPct = pct(day.caloriesIn, calorieTarget);
  const workoutDone = day.workoutCompleted ? 100 : workout ? 0 : 0;

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

  // Fasting derived
  const fastInfo = useMemo(() => {
    if (!fasting.startedAt) {
      return { active: false, hoursElapsed: 0, hoursLeft: 0, pct: 0 };
    }
    const elapsedMs = Date.now() - new Date(fasting.startedAt).getTime();
    const elapsedH = elapsedMs / 3_600_000;
    return {
      active: true,
      hoursElapsed: elapsedH,
      hoursLeft: Math.max(0, fasting.windowHours - elapsedH),
      pct: Math.min(100, (elapsedH / fasting.windowHours) * 100),
    };
  }, [fasting]);

  // tick every 30s for fasting timer
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!fasting.startedAt) return;
    const id = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, [fasting.startedAt]);

  async function changeLanguage(code: Language) {
    setLang(code);
    if (user) {
      await supabase.from("profiles").update({ language: code }).eq("id", user.id);
      qc.invalidateQueries({ queryKey: ["profile", user.id] });
    }
  }

  const greeting = greetingFor(new Date());

  const visibleCards = prefs.order.filter((c) => !prefs.hidden.includes(c));

  // Group adjacent visible cards into side-by-side pairs.
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
            consumed={day.caloriesIn}
            target={calorieTarget}
            remaining={caloriesRemaining}
            burned={day.caloriesOut}
            meals={day.meals}
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
            workout={workout}
            completed={day.workoutCompleted}
            onCreate={() => setOpenSheet("workout")}
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
    <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-background px-5 pb-24 pt-8">
      {/* Header */}
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">{greeting}</p>
          <h1 className="mt-1 truncate font-display text-[26px] font-semibold leading-tight tracking-tight">
            {p.display_name || "—"}
          </h1>
          <p className="mt-1.5 text-[11px] font-medium text-muted-foreground">
            {formatToday()}
          </p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <IconBtn aria-label="Customize dashboard" onClick={() => setOpenSheet("customize")}>
            <Sliders className="size-4" />
          </IconBtn>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-card" aria-label={t("profile.language")}>
                <Globe className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {LANGUAGES.map((l) => (
                <DropdownMenuItem key={l.code} onClick={() => changeLanguage(l.code as Language)} className="cursor-pointer">
                  <span className="mr-2">{l.flag}</span>
                  <span className="flex-1">{l.native}</span>
                  {lang === l.code && <Check className="size-3.5" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <IconBtn aria-label={t("profile.theme")} onClick={toggle}>
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </IconBtn>
          <IconBtn aria-label={t("profile.signout")} onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
            <LogOut className="size-4" />
          </IconBtn>
        </div>
      </header>

      {/* Plan chip */}
      <div className="mt-4 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
          <span className={`size-1.5 rounded-full ${isPremium ? "bg-brand" : "bg-muted-foreground"}`} />
          <span className="font-display text-[11px] font-medium uppercase tracking-wider">
            {isPremium ? `Vita ${t("profile.plus")}` : t("profile.free")}
          </span>
        </div>
        <Link to="/onboarding" className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground">
          <Settings2 className="size-3.5" />
          {t("profile.recalc")}
        </Link>
      </div>

      {/* Quick actions */}
      <section className="mt-5 grid grid-cols-4 gap-2">
        <QuickAction icon={Droplet} label="Water" onClick={() => addWater(250)} />
        <QuickAction icon={UtensilsCrossed} label="Food" onClick={() => setOpenSheet("food")} />
        <QuickAction icon={Scale} label="Weight" onClick={() => setOpenSheet("weight")} />
        <QuickAction
          icon={PlayCircle}
          label={workout ? "Start" : "Workout"}
          onClick={() => workout ? update({ workoutCompleted: true }) : setOpenSheet("workout")}
        />
      </section>

      {/* Cards */}
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
            <p className="text-sm text-muted-foreground">All cards are hidden.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setOpenSheet("customize")}>
              Customize dashboard
            </Button>
          </div>
        )}
      </section>

      {/* --- Sheets / Dialogs --- */}
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

      <FoodDialog
        open={openSheet === "food"}
        onOpenChange={(o) => !o && setOpenSheet(null)}
        onSubmit={(m) => { addMeal(m); setOpenSheet(null); }}
      />

      <WorkoutDialog
        open={openSheet === "workout"}
        onOpenChange={(o) => !o && setOpenSheet(null)}
        initial={workout}
        onSubmit={(w) => { saveWorkout(w); setOpenSheet(null); }}
      />
    </main>
  );
}

/* ------------------------------- UI Helpers ------------------------------- */
function IconBtn({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-card transition hover:bg-accent"
    >
      {children}
    </button>
  );
}

function QuickAction({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card px-2 py-3 transition active:scale-[0.98] hover:bg-accent"
    >
      <span className="grid size-9 place-items-center rounded-full bg-brand/12">
        <Icon className="size-4 text-brand" />
      </span>
      <span className="font-display text-[11px] font-semibold">{label}</span>
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
function NutritionCard({ consumed, target, remaining, burned, meals, onLogFood, protein, carbs, fat }: {
  consumed: number; target: number; remaining: number; burned: number; meals: number; onLogFood: () => void;
  protein: { have: number; goal: number };
  carbs: { have: number; goal: number };
  fat: { have: number; goal: number };
}) {
  return (
    <CardShell title="Nutrition" icon={Apple} action={
      <button onClick={onLogFood} className="inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-[11px] font-semibold text-brand-foreground">
        <Plus className="size-3" /> Log
      </button>
    }>
      <div className="flex items-center gap-5">
        <Ring pct={pct(consumed, target)} label={`${Math.round(pct(consumed, target))}%`} sub="of target" />
        <div className="flex-1 space-y-2">
          <StatRow label="Consumed" value={`${consumed.toLocaleString()} kcal`} />
          <StatRow label="Target" value={`${target.toLocaleString()} kcal`} />
          <StatRow label="Remaining" value={`${remaining.toLocaleString()} kcal`} accent />
          <StatRow label="Burned" value={`${burned.toLocaleString()} kcal`} muted />
          <StatRow label="Meals" value={`${meals}`} muted />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/60 pt-4">
        <MacroBlock label="Protein" {...protein} />
        <MacroBlock label="Carbs" {...carbs} />
        <MacroBlock label="Fat" {...fat} />
      </div>
    </CardShell>
  );
}

function MacroCard({ protein, carbs, fat }: {
  protein: { have: number; goal: number };
  carbs: { have: number; goal: number };
  fat: { have: number; goal: number };
}) {
  return (
    <CardShell title="Macros today" icon={LineChart}>
      <div className="grid grid-cols-3 gap-3">
        <MacroBlock label="Protein" {...protein} />
        <MacroBlock label="Carbs" {...carbs} />
        <MacroBlock label="Fat" {...fat} />
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
  return (
    <CardShell title="Hydration" icon={Droplet} compact={compact} action={
      !compact && (
        <button onClick={onOpen} className="text-[11px] font-medium text-muted-foreground hover:text-foreground">Details</button>
      )
    }>
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <div className={`font-display font-semibold tabular-nums leading-none ${compact ? "text-2xl" : "text-3xl"}`}>{(ml / 1000).toFixed(2)}<span className="text-base">L</span></div>
          <div className="mt-1 text-[10px] text-muted-foreground">of {(goal / 1000).toFixed(1)}L · {Math.round(pct(ml, goal))}%</div>
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

function StepsCard({ steps, goal, onChange, compact }: { steps: number; goal: number; onChange: (s: number) => void; compact?: boolean }) {
  return (
    <CardShell title="Steps" icon={Footprints} compact={compact} action={
      !compact && (
        <input
          type="number"
          value={steps}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          className="w-20 rounded-md border border-border bg-background px-2 py-1 text-right text-[11px] font-semibold tabular-nums"
        />
      )
    }>
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <div className={`font-display font-semibold tabular-nums leading-none ${compact ? "text-2xl" : "text-3xl"}`}>{steps.toLocaleString()}</div>
          <div className="mt-1 text-[10px] text-muted-foreground">of {goal.toLocaleString()} · {Math.round(pct(steps, goal))}%</div>
        </div>
        {compact ? (
          <div className="flex shrink-0 gap-1">
            <button onClick={() => onChange(Math.max(0, steps - 500))} className="grid size-7 place-items-center rounded-full border border-border bg-background hover:bg-accent"><Minus className="size-3" /></button>
            <button onClick={() => onChange(steps + 500)} className="grid size-7 place-items-center rounded-full bg-brand text-brand-foreground"><Plus className="size-3" /></button>
          </div>
        ) : (
          <div className="text-right text-[11px] text-muted-foreground">
            <div>{Math.max(0, goal - steps).toLocaleString()}</div>
            <div className="text-[10px] uppercase tracking-wider">to go</div>
          </div>
        )}
      </div>
      <Bar pct={pct(steps, goal)} className={compact ? "mt-3" : "mt-4"} />
    </CardShell>
  );
}

function FastingCard({ active, elapsed, remaining, windowHours, pct: p, streak, onStart, onStop }: {
  active: boolean; elapsed: number; remaining: number; windowHours: number; pct: number; streak: number;
  onStart: () => void; onStop: () => void;
}) {
  return (
    <CardShell title="Fasting" icon={Timer} action={
      <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
        {streak}🔥 streak
      </span>
    }>
      <div className="flex items-center gap-5">
        <Ring
          pct={active ? p : 0}
          label={active ? formatHours(elapsed) : "—"}
          sub={active ? "elapsed" : "Not fasting"}
        />
        <div className="flex-1 space-y-1.5">
          <StatRow label="Status" value={active ? "Fasting" : "Eating window"} accent />
          <StatRow label="Window" value={`${windowHours}:${24 - windowHours}`} />
          <StatRow label={active ? "Until done" : "Last streak"} value={active ? formatHours(remaining) : `${streak} days`} muted />
          <Button
            size="sm"
            variant={active ? "outline" : "default"}
            className="mt-2 h-8 w-full"
            onClick={active ? onStop : onStart}
          >
            {active ? "End fast" : "Start fast"}
          </Button>
        </div>
      </div>
    </CardShell>
  );
}

function WeightCard({ current, delta, goal, progress, onLog, compact }: {
  current: number; delta: number; goal: number; progress: number; onLog: () => void; compact?: boolean;
}) {
  const deltaColor = delta < 0 ? "text-brand" : delta > 0 ? "text-destructive" : "text-muted-foreground";
  return (
    <CardShell title="Weight" icon={Scale} compact={compact} action={
      <button onClick={onLog} className={`inline-flex items-center gap-1 rounded-full bg-brand font-semibold text-brand-foreground ${compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]"}`}>
        <Plus className="size-3" /> Log
      </button>
    }>
      {compact ? (
        <>
          <div className="font-display text-2xl font-semibold tabular-nums leading-none">
            {current.toFixed(1)}<span className="ml-0.5 text-sm text-muted-foreground">kg</span>
          </div>
          <div className={`mt-1 inline-flex items-center gap-1 text-[10px] font-semibold ${deltaColor}`}>
            <ArrowUpRight className={`size-3 ${delta < 0 ? "rotate-180" : ""}`} />
            {delta === 0 ? "No change" : `${delta > 0 ? "+" : ""}${delta.toFixed(1)} kg`}
          </div>
          <Bar pct={progress} className="mt-3" />
          <div className="mt-1.5 flex items-baseline justify-between text-[10px] text-muted-foreground">
            <span>{Math.round(progress)}% to goal</span>
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
                {delta === 0 ? "No change" : `${delta > 0 ? "+" : ""}${delta.toFixed(1)} kg`}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Goal</div>
              <div className="font-display text-lg font-semibold tabular-nums">{goal.toFixed(1)} kg</div>
            </div>
          </div>
          <Bar pct={progress} className="mt-4" />
          <div className="mt-2 text-[11px] text-muted-foreground">{Math.round(progress)}% toward goal</div>
        </>
      )}
    </CardShell>
  );
}

function ActivityCard({ burned, activeMin, onChange, compact }: { burned: number; activeMin: number; onChange: (b: number, m: number) => void; compact?: boolean }) {
  const goalKcal = 500;
  const p = pct(burned, goalKcal);
  return (
    <CardShell title="Activity" icon={Flame} compact={compact}>
      {compact ? (
        <>
          <div className="flex items-baseline gap-1">
            <input
              type="number"
              value={burned}
              onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0), activeMin)}
              className="w-14 bg-transparent font-display text-2xl font-semibold tabular-nums leading-none outline-none"
            />
            <span className="text-[11px] text-muted-foreground">kcal</span>
          </div>
          <div className="mt-1 text-[10px] text-muted-foreground">
            <input
              type="number"
              value={activeMin}
              onChange={(e) => onChange(burned, Math.max(0, Number(e.target.value) || 0))}
              className="w-8 bg-transparent text-[10px] font-semibold tabular-nums text-foreground outline-none"
            />
            <span> active min</span>
          </div>
          <Bar pct={p} className="mt-3" />
          <div className="mt-1.5 text-[10px] text-muted-foreground">{Math.round(p)}% of {goalKcal} kcal</div>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border/60 bg-background/40 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Burned</div>
            <div className="mt-1 flex items-baseline gap-1">
              <input
                type="number"
                value={burned}
                onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0), activeMin)}
                className="w-16 bg-transparent font-display text-xl font-semibold tabular-nums outline-none"
              />
              <span className="text-[10px] text-muted-foreground">kcal</span>
            </div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/40 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Active</div>
            <div className="mt-1 flex items-baseline gap-1">
              <input
                type="number"
                value={activeMin}
                onChange={(e) => onChange(burned, Math.max(0, Number(e.target.value) || 0))}
                className="w-16 bg-transparent font-display text-xl font-semibold tabular-nums outline-none"
              />
              <span className="text-[10px] text-muted-foreground">min</span>
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
  return (
    <CardShell title="Today's workout" icon={Dumbbell} action={
      workout ? (
        <button onClick={onClear} className="text-[11px] font-medium text-muted-foreground hover:text-foreground">Clear</button>
      ) : null
    }>
      {workout ? (
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-display text-lg font-semibold leading-tight">{workout.name}</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">{workout.type} · {workout.durationMin} min{workout.time ? ` · ${workout.time}` : ""}</div>
            </div>
            {completed && <span className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-semibold text-brand"><CheckCircle2 className="size-3" /> Done</span>}
          </div>
          <Button
            size="sm" className="mt-4 h-9 w-full"
            disabled={completed}
            onClick={onStart}
          >
            {completed ? "Completed" : "Start workout"}
          </Button>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-[13px] text-muted-foreground">No workout scheduled today</p>
          <Button size="sm" variant="outline" className="mt-3 h-9 w-full" onClick={onCreate}>
            <Plus className="size-3.5" /> Create workout
          </Button>
        </div>
      )}
    </CardShell>
  );
}

function GoalsCard({ nutrition, water, steps, workout, overall }: {
  nutrition: number; water: number; steps: number; workout: number; overall: number;
}) {
  return (
    <CardShell title="Daily goals" icon={CheckCircle2}>
      <div className="flex items-center gap-5">
        <Ring pct={overall} label={`${overall}%`} sub="overall" />
        <div className="flex-1 space-y-2.5">
          <GoalRow label="Nutrition" pct={nutrition} />
          <GoalRow label="Water" pct={water} />
          <GoalRow label="Steps" pct={steps} />
          <GoalRow label="Workout" pct={workout} done={workout >= 100} />
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
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader>
          <SheetTitle className="font-display">Customize dashboard</SheetTitle>
          <SheetDescription>Reorder, hide or show cards.</SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-2">
          {order.map((id, i) => {
            const isHidden = hidden.includes(id);
            return (
              <div key={id} className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2">
                <GripVertical className="size-4 text-muted-foreground" />
                <span className={`flex-1 font-display text-sm font-semibold ${isHidden ? "text-muted-foreground line-through" : ""}`}>
                  {CARD_LABELS[id]}
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
          <Button variant="ghost" size="sm" onClick={onReset}>Reset to default</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/* ------------------------------- Dialogs ------------------------------- */
function WaterDialog({ open, onOpenChange, ml, goal, onAdd }: {
  open: boolean; onOpenChange: (o: boolean) => void; ml: number; goal: number; onAdd: (n: number) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Add water</DialogTitle>
          <DialogDescription>{(ml / 1000).toFixed(2)}L of {(goal / 1000).toFixed(1)}L goal</DialogDescription>
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
  const [val, setVal] = useState(String(current.toFixed(1)));
  useEffect(() => { if (open) setVal(String(current.toFixed(1))); }, [open, current]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Log weight</DialogTitle>
          <DialogDescription>Current: {current.toFixed(1)} kg</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="w">Weight (kg)</Label>
          <Input id="w" type="number" inputMode="decimal" step="0.1" value={val} onChange={(e) => setVal(e.target.value)} />
        </div>
        <DialogFooter>
          <Button onClick={() => { const n = parseFloat(val); if (!isNaN(n) && n > 0) onSubmit(n); }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FoodDialog({ open, onOpenChange, onSubmit }: {
  open: boolean; onOpenChange: (o: boolean) => void; onSubmit: (m: { kcal: number; protein: number; carbs: number; fat: number }) => void;
}) {
  const [k, setK] = useState("400");
  const [p, setP] = useState("25");
  const [c, setC] = useState("45");
  const [f, setF] = useState("15");
  useEffect(() => { if (open) { setK("400"); setP("25"); setC("45"); setF("15"); } }, [open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Log meal</DialogTitle>
          <DialogDescription>Quick entry. A full food database is coming soon.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Calories (kcal)" value={k} onChange={setK} />
          <Field label="Protein (g)" value={p} onChange={setP} />
          <Field label="Carbs (g)" value={c} onChange={setC} />
          <Field label="Fat (g)" value={f} onChange={setF} />
        </div>
        <DialogFooter>
          <Button onClick={() => onSubmit({ kcal: +k || 0, protein: +p || 0, carbs: +c || 0, fat: +f || 0 })}>Add meal</Button>
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
  const [name, setName] = useState(initial?.name ?? "Full body strength");
  const [type, setType] = useState(initial?.type ?? "Strength");
  const [time, setTime] = useState(initial?.time ?? "");
  const [duration, setDuration] = useState(String(initial?.durationMin ?? 45));
  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "Full body strength");
      setType(initial?.type ?? "Strength");
      setTime(initial?.time ?? "");
      setDuration(String(initial?.durationMin ?? 45));
    }
  }, [open, initial]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Schedule workout</DialogTitle>
          <DialogDescription>Plan today's session.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Name" value={name} onChange={setName} type="text" />
          <Field label="Type" value={type} onChange={setType} type="text" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Time" value={time} onChange={setTime} type="time" />
            <Field label="Duration (min)" value={duration} onChange={setDuration} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onSubmit({ name, type, time: time || undefined, durationMin: +duration || 30 })}>Save</Button>
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

function greetingFor(d: Date) {
  const h = d.getHours();
  if (h < 5) return "Still up,";
  if (h < 12) return "Good morning,";
  if (h < 17) return "Good afternoon,";
  if (h < 22) return "Good evening,";
  return "Good night,";
}

function formatToday() {
  return new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}
