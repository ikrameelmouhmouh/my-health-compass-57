import { todayLocalKey, localDayKey } from "@/lib/local-date";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Dumbbell, Sparkles, RotateCcw, Check, Calendar, Trophy, Clock, Plus, Trash2, Pencil, ChevronRight, Waves, Bike, Footprints, Trees, Mountain, HeartPulse, Activity, Lock, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { WorkoutWizard } from "@/components/workout-wizard";
import { TemplateEditor } from "@/components/template-editor";
import { TemplateSyncDialog } from "@/components/template-sync-dialog";
import { SessionStartSheet } from "@/components/workout/session-start-sheet";
import { useStartWorkout } from "@/components/workout/use-start-workout";
import { useWorkoutPlan, useTemplates, newTemplate, templatesFromPlan, type WorkoutTemplate } from "@/lib/workout-prefs";
import type { WorkoutPlan } from "@/lib/workout.functions";
import { useI18n } from "@/lib/i18n";
import { PaywallOverlay } from "@/components/paywall-gate";
import { usePremium } from "@/hooks/use-premium";
import { toast } from "sonner";
import { useTodayWorkout } from "@/lib/dashboard-prefs";
import { normalizeDay, todayDayName } from "@/lib/workout-today";
import { useSessionHistory } from "@/lib/workout-session";


export const Route = createFileRoute("/_authenticated/fitness")({
  validateSearch: z.object({
    wizard: z.coerce.number().optional(),
  }),
  component: FitnessPage,
});

type View = "gym" | "activities";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function FitnessPage() {
  const { stored, loaded, save, clear, toggleCompleted } = useWorkoutPlan();
  const { templates, upsert, remove } = useTemplates();
  const { t } = useI18n();
  
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [showWizard, setShowWizard] = useState(false);
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [view, setView] = useState<View>("gym");
  const [pendingTemplates, setPendingTemplates] = useState<WorkoutTemplate[] | null>(null);

  useEffect(() => {
    if (search.wizard === 1) {
      setShowWizard(true);
      navigate({ to: "/fitness", search: {}, replace: true });
    }
  }, [search.wizard, navigate]);

  const { isPremium } = usePremium();

  const handleWizardComplete = (w: Parameters<typeof save>[0], p: Parameters<typeof save>[1]) => {
    save(w, p);
    setShowWizard(false);
    const newTpls = templatesFromPlan(p);
    if (newTpls.length > 0) setPendingTemplates(newTpls);
  };

  const { save: saveTodayWorkout } = useTodayWorkout();
  const scheduleTodayFrom = (tpls: WorkoutTemplate[]) => {
    const today = todayDayName();
    const todays = tpls.find((tpl) => normalizeDay(tpl.day) === today);
    if (todays) {
      const sets = todays.exercises.reduce((s, e) => s + (Number(e.sets) || 0), 0);
      const durationMin = Math.max(15, Math.min(120, Math.round(sets * 3) || 30));
      saveTodayWorkout({ name: todays.name, type: todays.focus || "Workout", durationMin });
    }
  };

  const handleSyncChoice = (mode: "replace" | "add" | "skip") => {
    if (!pendingTemplates) return;
    if (mode === "replace") {
      templates.forEach((tpl) => remove(tpl.id));
      pendingTemplates.forEach((tpl) => upsert(tpl));
      scheduleTodayFrom(pendingTemplates);
      toast.success(t("wiz.sync.done_replace"));
    } else if (mode === "add") {
      pendingTemplates.forEach((tpl) => upsert(tpl));
      scheduleTodayFrom(pendingTemplates);
      toast.success(t("wiz.sync.done_add"));
    }
    setPendingTemplates(null);
  };

  const openWizard = () => {
    if (!isPremium) return;
    setShowWizard(true);
  };

  if (!loaded) return <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-background px-5 pb-32 pt-10" />;

  if (view === "activities") {
    return (
      <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-background px-5 pb-32 pt-10">
        <Header />
        <ViewTabs view={view} setView={setView} />
        <PaywallOverlay feature={t("fit.title")} description={t("pay.overlay.workouts_desc")}>
          <ActivitiesSection />
        </PaywallOverlay>
      </main>
    );
  }

  if (!stored || showWizard) {
    return (
      <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-background px-5 pb-32 pt-10">
        <Header />
        <ViewTabs view={view} setView={setView} />
        <PaywallOverlay feature={t("fit.title")} description={t("pay.overlay.workouts_desc")}>
          {!stored && !showWizard ? (
            <>
              <TodayCard plan={null} onCreate={openWizard} isPremium={isPremium} />
              <OwnProgramCard />
              <TemplatesSection />
              <EmptyState onStart={openWizard} isPremium={isPremium} />
            </>

          ) : (
            <div className="mt-6">
              <WorkoutWizard
                initial={stored?.wizard}
                onComplete={handleWizardComplete}
                onCancel={stored ? () => setShowWizard(false) : undefined}
              />
            </div>
          )}
        </PaywallOverlay>
        <TemplateSyncDialog open={!!pendingTemplates} count={pendingTemplates?.length ?? 0} onChoose={handleSyncChoice} />
      </main>
    );
  }

  return <>
    <Dashboard
      stored={stored}
      onRegenerate={openWizard}
      isPremium={isPremium}
      onClear={clear}
      toggleCompleted={toggleCompleted}
      openDay={openDay}
      setOpenDay={setOpenDay}
      view={view}
      setView={setView}
    />
    <TemplateSyncDialog open={!!pendingTemplates} count={pendingTemplates?.length ?? 0} onChoose={handleSyncChoice} />
  </>;
}

function ViewTabs({ view, setView }: { view: View; setView: (v: View) => void }) {
  const { t } = useI18n();
  const tabs: { id: View; label: string; icon: typeof Dumbbell }[] = [
    { id: "gym", label: t("fit.tab.gym"), icon: Dumbbell },
    { id: "activities", label: t("fit.tab.activities"), icon: Activity },
  ];
  return (
    <div className="mt-5 grid grid-cols-2 gap-1 rounded-2xl border border-border bg-card/50 p-1">
      {tabs.map((tab) => {
        const active = view === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${active ? "bg-brand text-white shadow" : "text-muted-foreground hover:text-foreground"}`}
          >
            <tab.icon className="size-4" /> {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function Header() {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand/15 text-brand">
        <Dumbbell className="size-6" />
      </div>
      <div className="min-w-0">
        <h1 className="truncate font-display text-2xl font-semibold tracking-tight">{t("fit.title")}</h1>
      </div>

    </div>
  );
}

function EmptyState({ onStart, isPremium }: { onStart: () => void; isPremium: boolean }) {
  const { t } = useI18n();
  return (
    <div className="mt-6 rounded-2xl border border-border bg-card/50 p-3">
      <div className="flex items-center gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand">
          <Sparkles className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{t("fit.empty.title")}</p>
          <p className="text-xs text-muted-foreground">{isPremium ? t("fit.empty.desc") : t("wiz.premium.locked")}</p>
        </div>
        {isPremium ? (
          <Button size="sm" onClick={onStart}>
            <Sparkles className="mr-1 size-3.5" /> {t("fit.empty.cta")}
          </Button>
        ) : (
          <Link to="/pricing">
            <Button size="sm" variant="outline">
              <Lock className="mr-1 size-3.5" /> {t("wiz.premium.upgrade")}
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

function Dashboard({
  stored, onRegenerate, isPremium, onClear, toggleCompleted, openDay, setOpenDay, view, setView,
}: {
  stored: ReturnType<typeof useWorkoutPlan>["stored"];
  onRegenerate: () => void;
  isPremium: boolean;
  onClear: () => void;
  toggleCompleted: (d: string) => void;
  openDay: string | null;
  setOpenDay: (d: string | null) => void;
  view: View;
  setView: (v: View) => void;
}) {
  const { t } = useI18n();
  const plan = stored?.plan;
  const completedDays = stored?.completedDays ?? [];
  const wizard = stored?.wizard;

  const sortedDays = useMemo(
    () => (plan ? [...plan.days].sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day)) : []),
    [plan],
  );

  const today = todayLocalKey();
  const todayName = DAY_ORDER[(new Date().getDay() + 6) % 7];



  if (!stored || !plan || !wizard) return null;

  const trainingDays = sortedDays.filter((d) => !d.rest).length;
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 6);
  const completedWeek = completedDays.filter((k) => {
    const date = k.split(":")[0];
    return date >= localDayKey(weekStart);
  }).length;
  const progressPct = trainingDays > 0 ? Math.min(100, Math.round((completedWeek / trainingDays) * 100)) : 0;

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-background px-5 pb-32 pt-10">
      <Header />
      <ViewTabs view={view} setView={setView} />

      <PaywallOverlay feature={t("fit.title")} description={t("pay.overlay.workouts_desc")}>
      <TodayCard plan={plan} onCreate={onRegenerate} isPremium={isPremium} />

      <div className="mt-4 rounded-2xl border border-border bg-card/50 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{plan.name}</p>
          </div>
          <button onClick={onRegenerate} className="rounded-full bg-background/60 p-2" aria-label={t("fit.regenerate_aria")}>
            <RotateCcw className="size-4" />
          </button>
        </div>
        <div className="mt-3">
          <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">{t("fit.weekly_progress")}</p>
          <Progress value={progressPct} />
        </div>
      </div>

      <h3 className="mt-6 mb-2 text-sm font-semibold">{t("fit.this_week")}</h3>

      <WeekList
        days={sortedDays}
        todayName={todayName}
        completedDays={completedDays}
        todayKey={today}
        toggleCompleted={toggleCompleted}
        openDay={openDay}
        setOpenDay={setOpenDay}
      />


      <TemplatesSection />


      {plan.progressionNotes && (
        <div className="mt-6 rounded-2xl border border-border bg-card/50 p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{t("fit.coach_note")}</p>
          <p className="mt-1 text-sm">{plan.progressionNotes}</p>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-border bg-card/50 p-3">
        <div className="flex items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand">
            <Sparkles className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{t("fit.empty.title")}</p>
            <p className="text-xs text-muted-foreground">{isPremium ? t("fit.regenerate_cta") : t("wiz.premium.locked")}</p>
          </div>
          {isPremium ? (
            <Button size="sm" onClick={onRegenerate}>
              <Sparkles className="mr-1 size-3.5" /> {t("fit.empty.cta")}
            </Button>
          ) : (
            <Link to="/pricing">
              <Button size="sm" variant="outline">
                <Lock className="mr-1 size-3.5" /> {t("wiz.premium.upgrade")}
              </Button>
            </Link>
          )}
        </div>
      </div>
      <button onClick={() => { if (confirm(t("fit.clear_confirm"))) onClear(); }} className="mt-2 w-full text-xs text-muted-foreground hover:text-destructive">
        {t("fit.clear")}
      </button>
      </PaywallOverlay>
    </main>
  );
}

/** Progress card for users who build their own schedule (no AI plan). */
function OwnProgramCard() {
  const { t } = useI18n();
  const { templates, loaded } = useTemplates();
  const { history, loaded: histLoaded } = useSessionHistory();

  if (!loaded || !histLoaded) return null;
  const planned = templates.filter((tpl) => !!tpl.day).length;
  if (planned === 0) return null;

  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 6);
  const since = localDayKey(weekStart);
  const done = history.filter((s) => localDayKey(new Date(s.endedAt ?? s.startedAt)) >= since).length;
  const pct = Math.min(100, Math.round((done / planned) * 100));

  return (
    <div className="mt-4 rounded-2xl border border-border bg-card/50 p-3">
      <p className="truncate text-sm font-medium">{t("fit.own_program")}</p>
      <div className="mt-3">
        <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">{t("fit.weekly_progress")}</p>
        <Progress value={pct} />
      </div>
    </div>
  );
}

/** Calm vertical week list: one day per row, one expandable at a time. */
function WeekList({
  days, todayName, completedDays, todayKey, toggleCompleted, openDay, setOpenDay,
}: {
  days: WorkoutPlan["days"];
  todayName: string;
  completedDays: string[];
  todayKey: string;
  toggleCompleted: (d: string) => void;
  openDay: string | null;
  setOpenDay: (d: string | null) => void;
}) {
  const { t } = useI18n();
  const { templates } = useTemplates();
  const startWorkout = useStartWorkout();

  const templateFor = (d: WorkoutPlan["days"][number]): WorkoutTemplate => {
    const own = templates.find((tpl) => normalizeDay(tpl.day) === normalizeDay(d.day) && tpl.exercises.length > 0);
    return own ?? {
      id: `plan-${d.day}`,
      name: d.focus || t(`day.${d.day}`),
      day: d.day,
      focus: d.focus,
      exercises: d.exercises,
      createdAt: new Date().toISOString(),
    };
  };

  return (
    <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card/50">
      {days.map((d) => {
        const done = completedDays.includes(`${todayKey}:${d.day}`);
        const isToday = d.day === todayName;
        const isOpen = openDay === d.day;
        const sets = d.exercises.reduce((s, e) => s + (Number(e.sets) || 0), 0);
        const estMin = Math.max(15, Math.min(120, Math.round(sets * 3) || 30));
        return (
          <div key={d.day} className={isToday ? "bg-brand/5" : ""}>
            <button
              type="button"
              onClick={() => !d.rest && setOpenDay(isOpen ? null : d.day)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
            >
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm ${isToday ? "font-semibold text-brand" : "font-medium"}`}>
                  {t(`day.${d.day}`)}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {d.rest
                    ? t("fit.rest")
                    : `${d.focus} · ${t("fit.exercises_count", { n: d.exercises.length })} · ${t("fit.today.est_min", { n: estMin })}`}
                </p>
              </div>
              {!d.rest && (
                <>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); toggleCompleted(d.day); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); toggleCompleted(d.day); } }}
                    className={`grid size-6 shrink-0 place-items-center rounded-full border-2 ${done ? "border-brand bg-brand text-white" : "border-border"}`}
                    aria-label={t("fit.mark_complete")}
                  >
                    {done && <Check className="size-3" />}
                  </span>
                  <ChevronRight className={`size-4 shrink-0 text-muted-foreground transition ${isOpen ? "rotate-90" : ""}`} />
                </>
              )}
            </button>

            {isOpen && !d.rest && (
              <div className="space-y-1.5 px-3 pb-3">
                {d.exercises.map((ex, i) => (
                  <div key={i} className="rounded-lg bg-background/60 p-2">
                    <p className="text-sm font-medium">{ex.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {ex.sets} × {ex.reps} · {t("fit.rest_short")} {ex.restSec}s{ex.suggestedWeight ? ` · ${ex.suggestedWeight}` : ""}
                    </p>
                    {ex.notes && <p className="text-[11px] text-muted-foreground">{ex.notes}</p>}
                  </div>
                ))}
                <Button size="sm" className="mt-1 w-full" onClick={() => startWorkout(templateFor(d))}>
                  <Play className="mr-2 size-3.5 fill-current" /> {t("session.start")}
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Calendar; label: string; value: string }) {

  return (
    <div className="rounded-xl bg-background/50 p-2">
      <Icon className="mx-auto size-4 text-brand" />
      <p className="mt-1 text-base font-semibold leading-none">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function TemplatesSection() {
  const { t } = useI18n();
  const { templates, loaded, upsert, remove } = useTemplates();
  const [editing, setEditing] = useState<WorkoutTemplate | null>(null);
  const [starting, setStarting] = useState<WorkoutTemplate | null>(null);

  if (!loaded) return null;

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">{t("fit.tpl.title")}</h3>
          <p className="text-xs text-muted-foreground">{t("fit.tpl.desc")}</p>
        </div>
        <div className="flex items-center gap-1">
          <Link to="/workout-history">
            <Button size="sm" variant="ghost">
              <Clock className="mr-1 size-4" /> {t("hist.view")}
            </Button>
          </Link>
          <Button size="sm" variant="outline" onClick={() => setEditing(newTemplate())}>
            <Plus className="mr-1 size-4" /> {t("fit.tpl.new")}
          </Button>
        </div>
      </div>

      {templates.length === 0 ? (
        <button
          onClick={() => setEditing(newTemplate())}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card/30 p-6 text-sm text-muted-foreground hover:bg-card/50"
        >
          <Plus className="size-4" /> {t("fit.tpl.add")}
        </button>
      ) : (
        <div className="space-y-2">
          {templates.map((tpl) => {
            const sets = tpl.exercises.reduce((s, e) => s + e.sets, 0);
            const dayLabel = tpl.day ? t(`day.${tpl.day}`) : "";
            return (
              <div key={tpl.id} className="rounded-2xl border border-border bg-card/50 p-3">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setStarting(tpl)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setStarting(tpl); }}
                  className="flex w-full cursor-pointer items-start justify-between gap-2 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{tpl.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[dayLabel, tpl.focus].filter(Boolean).join(" · ") || t("fit.tpl.no_day")}{" · "}
                      {tpl.exercises.length} {t("fit.tpl.ex_short")} · {sets} {t("fit.tpl.sets_short")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditing(tpl); }}
                      className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-background"
                      aria-label={t("fit.tpl.edit")}
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); if (confirm(t("fit.tpl.delete_confirm", { name: tpl.name }))) remove(tpl.id); }}
                      className="grid size-8 place-items-center rounded-full text-muted-foreground hover:text-destructive"
                      aria-label={t("fit.tpl.delete")}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SessionStartSheet
        template={starting}
        open={!!starting}
        onClose={() => setStarting(null)}
        onEdit={(tpl) => { setStarting(null); setEditing(tpl); }}
      />

      {editing && (
        <TemplateEditor
          open
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(tpl) => { upsert(tpl); setEditing(null); }}
        />
      )}
    </section>
  );
}

/** Today's workout — the most important card on the Gym home. */
function TodayCard({
  plan,
  onCreate,
  isPremium,
}: {
  plan: WorkoutPlan | null;
  onCreate: () => void;
  isPremium: boolean;
}) {
  const { t } = useI18n();
  const { templates, loaded } = useTemplates();
  const startWorkout = useStartWorkout();
  const [preview, setPreview] = useState<WorkoutTemplate | null>(null);

  const planTemplate = (dayName: string): WorkoutTemplate | null => {
    const d = plan?.days.find((x) => normalizeDay(x.day) === dayName && !x.rest && x.exercises.length > 0);
    if (!d) return null;
    return {
      id: `plan-${d.day}`,
      name: d.focus || d.day,
      day: d.day,
      focus: d.focus,
      exercises: d.exercises,
      createdAt: new Date().toISOString(),
    };
  };

  const forDay = (dayName: string): WorkoutTemplate | null =>
    templates.find((tpl) => normalizeDay(tpl.day) === dayName && tpl.exercises.length > 0) ?? planTemplate(dayName);

  const today = todayDayName();
  const todayTpl = forDay(today);

  if (!loaded) return null;

  const active = todayTpl;
  const sets = active ? active.exercises.reduce((s, e) => s + (Number(e.sets) || 0), 0) : 0;
  const estMin = Math.max(15, Math.min(120, Math.round(sets * 3) || 30));

  return (
    <section className="mt-6">
      <div className="rounded-3xl border border-border bg-gradient-to-br from-brand/15 to-card p-5">
        <p className="text-[11px] uppercase tracking-wider text-brand">
          {active || !plan ? t("fit.today") : `${t("fit.today")} — ${t("fit.rest")}`}
        </p>

        {active ? (
          <>
            <h2 className="mt-1 font-display text-xl font-semibold leading-tight">{active.name}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("fit.exercises_count", { n: active.exercises.length })} · {t("fit.today.est_min", { n: estMin })}
            </p>
            <Button className="mt-4 w-full" size="lg" onClick={() => startWorkout(active)}>
              <Play className="mr-2 size-4 fill-current" /> {t("session.start")}
            </Button>
            <button
              onClick={() => setPreview(active)}
              className="mt-2 flex w-full items-center justify-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              {t("fit.view_workout")} <ChevronRight className="size-3" />
            </button>
          </>
        ) : plan ? (
          <h2 className="mt-1 font-display text-xl font-semibold leading-tight">{t("fit.rest")}</h2>
        ) : (
          <>
            <h2 className="mt-1 font-display text-xl font-semibold leading-tight">{t("fit.today.none")}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{t("fit.empty.desc")}</p>
            {isPremium && (
              <Button className="mt-4 w-full" onClick={onCreate}>
                <Sparkles className="mr-2 size-4" /> {t("fit.empty.cta")}
              </Button>
            )}
          </>
        )}
      </div>


      <SessionStartSheet template={preview} open={!!preview} onClose={() => setPreview(null)} />
    </section>
  );
}


export type ActivityCategory = "Cardio" | "Outdoor" | "Sport" | "Wellness";
export type ActivityItem = {
  id: string;
  icon: typeof Activity;
  kcalPerHour: number;
  category: ActivityCategory;
};

export const ACTIVITIES: ActivityItem[] = [
  { id: "swim", icon: Waves, kcalPerHour: 500, category: "Cardio" },
  { id: "bike", icon: Bike, kcalPerHour: 450, category: "Outdoor" },
  { id: "run-outdoor", icon: Footprints, kcalPerHour: 600, category: "Outdoor" },
  { id: "walk", icon: Trees, kcalPerHour: 250, category: "Outdoor" },
  { id: "hike", icon: Mountain, kcalPerHour: 400, category: "Outdoor" },
  { id: "football", icon: Activity, kcalPerHour: 550, category: "Sport" },
  { id: "basketball", icon: Activity, kcalPerHour: 500, category: "Sport" },
  { id: "tennis", icon: Activity, kcalPerHour: 450, category: "Sport" },
  { id: "padel", icon: Activity, kcalPerHour: 420, category: "Sport" },
  { id: "boxing", icon: Activity, kcalPerHour: 650, category: "Sport" },
  { id: "yoga", icon: HeartPulse, kcalPerHour: 250, category: "Wellness" },
  { id: "hiit", icon: Activity, kcalPerHour: 700, category: "Cardio" },
];

function ActivitiesSection() {
  const { t } = useI18n();
  const categories: ActivityCategory[] = ["Cardio", "Outdoor", "Sport", "Wellness"];
  return (
    <section className="mt-6 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">{t("fit.act.title")}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{t("fit.act.subtitle")}</p>
        </div>
        <Link to="/activity-history">
          <Button size="sm" variant="ghost">
            <Clock className="mr-1 size-4" /> {t("hist.view")}
          </Button>
        </Link>
      </div>
      {categories.map((cat) => {
        const items = ACTIVITIES.filter((a) => a.category === cat);
        if (items.length === 0) return null;
        return (
          <div key={cat}>
            <h3 className="mb-2 text-sm font-semibold">{t(`cat.${cat}`)}</h3>
            <div className="grid grid-cols-2 gap-2">
              {items.map((a) => (
                <Link
                  key={a.id}
                  to="/activity-session/$activityId"
                  params={{ activityId: a.id }}
                  className="group relative flex flex-col items-start gap-2 rounded-2xl border border-border bg-card/50 p-3 text-left transition hover:bg-card"
                >
                  <div className="grid size-10 place-items-center rounded-xl bg-brand/15 text-brand">
                    <a.icon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{t(`act.${a.id}.name`)}</p>
                    <p className="line-clamp-2 text-[11px] text-muted-foreground">{t(`act.${a.id}.desc`)}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{t("fit.act.kcal_per_h", { n: a.kcalPerHour })}</p>
                  </div>
                  <span
                    aria-hidden
                    className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-brand/10 text-brand opacity-60 transition group-hover:opacity-100 group-hover:bg-brand group-hover:text-white"
                  >
                    <Play className="size-3.5 fill-current" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
