import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Dumbbell, Sparkles, RotateCcw, Check, Calendar, Trophy, Clock, Plus, Trash2, Pencil, BookOpen, ChevronRight, Waves, Bike, Footprints, Trees, Mountain, HeartPulse, Activity, Lock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { WorkoutWizard } from "@/components/workout-wizard";
import { TemplateEditor } from "@/components/template-editor";
import { TemplateSyncDialog } from "@/components/template-sync-dialog";
import { ExerciseLibraryDialog } from "@/components/exercise-library-dialog";
import { useWorkoutPlan, useTemplates, newTemplate, templatesFromPlan, type WorkoutTemplate } from "@/lib/workout-prefs";
import { EXERCISES } from "@/lib/exercise-library";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTodayWorkout } from "@/lib/dashboard-prefs";
import { normalizeDay, todayDayName } from "@/lib/workout-today";

export const Route = createFileRoute("/_authenticated/fitness")({
  validateSearch: (s: Record<string, unknown>) => ({
    wizard: s.wizard === 1 || s.wizard === "1" ? 1 : undefined,
  }),
  component: FitnessPage,
});

type View = "gym" | "activities";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function FitnessPage() {
  const { stored, loaded, save, clear, toggleCompleted } = useWorkoutPlan();
  const { templates, upsert, remove } = useTemplates();
  const { t } = useI18n();
  const { user } = useAuth();
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

  const { data: sub } = useQuery({
    queryKey: ["subscription", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("subscriptions").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });
  const isPremium = !!sub && ["active", "trialing", "past_due"].includes(sub.status) &&
    (!sub.current_period_end || new Date(sub.current_period_end).getTime() > Date.now());

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
        <ActivitiesSection />
      </main>
    );
  }

  if (!stored || showWizard) {
    return (
      <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-background px-5 pb-32 pt-10">
        <Header />
        <ViewTabs view={view} setView={setView} />
        {!stored && !showWizard ? (
          <>
            <EmptyState onStart={openWizard} isPremium={isPremium} />
            <LibrarySection />
            <TemplatesSection />
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
        <p className="truncate text-[12px] text-muted-foreground">{t("fit.subtitle")}</p>
      </div>
    </div>
  );
}

function EmptyState({ onStart, isPremium }: { onStart: () => void; isPremium: boolean }) {
  const { t } = useI18n();
  const bullets = [t("fit.empty.b1"), t("fit.empty.b2"), t("fit.empty.b3"), t("fit.empty.b4")];
  return (
    <div className="mt-8 space-y-6 text-center">
      <div className="mx-auto grid size-20 place-items-center rounded-3xl bg-gradient-to-br from-brand/30 to-brand/10">
        <Sparkles className="size-10 text-brand" />
      </div>
      <div>
        <h2 className="font-display text-2xl font-semibold tracking-tight">{t("fit.empty.title")}</h2>
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">{t("fit.empty.desc")}</p>
      </div>
      <ul className="mx-auto max-w-xs space-y-2 text-left text-sm text-muted-foreground">
        {bullets.map((b) => (
          <li key={b} className="flex items-center gap-2"><Check className="size-4 text-brand" />{b}</li>
        ))}
      </ul>
      {isPremium ? (
        <Button size="lg" className="w-full" onClick={onStart}>
          <Sparkles className="mr-2 size-4" /> {t("fit.empty.cta")}
        </Button>
      ) : (
        <Link to="/pricing" className="block">
          <Button size="lg" variant="outline" className="w-full">
            <Lock className="mr-2 size-4" /> {t("wiz.premium.locked")} · {t("wiz.premium.upgrade")}
          </Button>
        </Link>
      )}
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

  const today = new Date().toISOString().slice(0, 10);
  const todayName = DAY_ORDER[(new Date().getDay() + 6) % 7];
  const nextWorkout = useMemo(() => {
    for (let i = 0; i < 7; i++) {
      const idx = (DAY_ORDER.indexOf(todayName) + i) % 7;
      const d = sortedDays.find((x) => x.day === DAY_ORDER[idx]);
      if (d && !d.rest) return { ...d, when: i === 0 ? t("fit.today") : i === 1 ? t("fit.tomorrow") : t(`day.${d.day}`) };
    }
    return null;
  }, [sortedDays, todayName, t]);

  if (!stored || !plan || !wizard) return null;

  const trainingDays = sortedDays.filter((d) => !d.rest).length;
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 6);
  const completedWeek = completedDays.filter((k) => {
    const date = k.split(":")[0];
    return date >= weekStart.toISOString().slice(0, 10);
  }).length;
  const progressPct = trainingDays > 0 ? Math.min(100, Math.round((completedWeek / trainingDays) * 100)) : 0;

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-background px-5 pb-32 pt-10">
      <Header />
      <ViewTabs view={view} setView={setView} />

      <div className="mt-6 rounded-3xl border border-border bg-gradient-to-br from-brand/15 to-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{t("fit.current_program")}</p>
            <h2 className="mt-1 font-display text-lg font-semibold leading-tight">{plan.name}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{plan.split} · {wizard.goal}</p>
          </div>
          <button onClick={onRegenerate} className="rounded-full bg-background/60 p-2 backdrop-blur" aria-label={t("fit.regenerate_aria")}>
            <RotateCcw className="size-4" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat icon={Calendar} label={t("fit.days_wk")} value={String(trainingDays)} />
          <Stat icon={Clock} label={t("fit.weeks")} value={String(plan.durationWeeks)} />
          <Stat icon={Trophy} label={t("fit.done")} value={`${completedWeek}/${trainingDays}`} />
        </div>

        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{t("fit.weekly_progress")}</span>
            <span className="font-medium">{progressPct}%</span>
          </div>
          <Progress value={progressPct} />
        </div>
      </div>

      {nextWorkout && (
        <div className="mt-4 rounded-2xl border border-brand/40 bg-brand/5 p-4">
          <p className="text-[11px] uppercase tracking-wider text-brand">{t("fit.next_workout")} · {nextWorkout.when}</p>
          <p className="mt-1 font-semibold">{nextWorkout.focus}</p>
          <p className="text-xs text-muted-foreground">{t("fit.exercises_count", { n: nextWorkout.exercises.length })}</p>
          <Button size="sm" className="mt-3 w-full" onClick={() => setOpenDay(nextWorkout.day)}>{t("fit.view_workout")}</Button>
        </div>
      )}

      <h3 className="mt-6 mb-3 text-sm font-semibold">{t("fit.weekly_split")}</h3>
      <div className="space-y-2">
        {sortedDays.map((d) => {
          const done = completedDays.includes(`${today}:${d.day}`);
          const isToday = d.day === todayName;
          return (
            <div key={d.day} className={`rounded-2xl border p-3 ${isToday ? "border-brand/50 bg-brand/5" : "border-border bg-card/50"}`}>
              <button onClick={() => !d.rest && setOpenDay(openDay === d.day ? null : d.day)} className="flex w-full items-center justify-between text-left">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{t(`day.${d.day}`)}{isToday && ` · ${t("fit.today")}`}</p>
                  <p className="truncate font-medium">{d.rest ? t("fit.rest") : d.focus}</p>
                </div>
                {!d.rest && (
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleCompleted(d.day); }}
                    className={`grid size-8 place-items-center rounded-full border-2 ${done ? "border-brand bg-brand text-white" : "border-border"}`}
                    aria-label={t("fit.mark_complete")}
                  >
                    {done && <Check className="size-4" />}
                  </button>
                )}
              </button>
              {openDay === d.day && !d.rest && (
                <div className="mt-3 space-y-2 border-t border-border pt-3">
                  {d.exercises.map((ex, i) => (
                    <div key={i} className="rounded-lg bg-background/60 p-3">
                      <p className="font-medium">{ex.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {ex.sets} × {ex.reps} · {t("fit.rest_short")} {ex.restSec}s{ex.suggestedWeight ? ` · ${ex.suggestedWeight}` : ""}
                      </p>
                      {ex.notes && <p className="mt-1 text-xs text-muted-foreground">{ex.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <LibrarySection />
      <TemplatesSection />

      {plan.progressionNotes && (
        <div className="mt-6 rounded-2xl border border-border bg-card/50 p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{t("fit.coach_note")}</p>
          <p className="mt-1 text-sm">{plan.progressionNotes}</p>
        </div>
      )}

      <div className="mt-6 space-y-2">
        {isPremium ? (
          <Button variant="outline" className="w-full" onClick={onRegenerate}>
            <Sparkles className="mr-2 size-4" /> {t("fit.regenerate_cta")}
          </Button>
        ) : (
          <Link to="/pricing" className="block">
            <Button variant="outline" className="w-full">
              <Lock className="mr-2 size-4" /> {t("wiz.premium.locked")} · {t("wiz.premium.upgrade")}
            </Button>
          </Link>
        )}
        <button onClick={() => { if (confirm(t("fit.clear_confirm"))) onClear(); }} className="w-full text-xs text-muted-foreground hover:text-destructive">
          {t("fit.clear")}
        </button>
      </div>
    </main>
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
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!loaded) return null;

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">{t("fit.tpl.title")}</h3>
          <p className="text-xs text-muted-foreground">{t("fit.tpl.desc")}</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setEditing(newTemplate())}>
          <Plus className="mr-1 size-4" /> {t("fit.tpl.new")}
        </Button>
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
            const open = expanded === tpl.id;
            const sets = tpl.exercises.reduce((s, e) => s + e.sets, 0);
            const dayLabel = tpl.day ? t(`day.${tpl.day}`) : "";
            return (
              <div key={tpl.id} className="rounded-2xl border border-border bg-card/50 p-3">
                <button onClick={() => setExpanded(open ? null : tpl.id)} className="flex w-full items-start justify-between gap-2 text-left">
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
                </button>
                {open && (
                  <div className="mt-3 space-y-2 border-t border-border pt-3">
                    {tpl.exercises.map((ex, i) => (
                      <div key={i} className="rounded-lg bg-background/60 p-2 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium">{ex.name}</p>
                          <p className="text-xs text-muted-foreground">{ex.suggestedWeight}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{ex.sets} × {ex.reps} · {t("fit.rest_short")} {ex.restSec}s</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

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

function LibrarySection() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const FEATURED: ReadonlyArray<{ id: string; label: string }> = [
    { id: "barbell-squat", label: "Squat" },
    { id: "barbell-bench-press", label: "Bench Press" },
    { id: "deadlift", label: "Deadlift" },
    { id: "lat-pulldown", label: "Lat Pulldown" },
    { id: "wide-leg-press", label: "Leg Press" },
    { id: "overhead-press", label: "Shoulder Press" },
  ];
  const preview = FEATURED
    .map((f) => {
      const ex = EXERCISES.find((e) => e.id === f.id);
      return ex ? { ...ex, name: f.label } : null;
    })
    .filter((e): e is (typeof EXERCISES)[number] => Boolean(e));
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">{t("fit.lib.title")}</h3>
          <p className="text-xs text-muted-foreground">{t("fit.lib.desc")}</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <BookOpen className="mr-1 size-4" /> {t("fit.lib.all")}
        </Button>
      </div>

      <button
        onClick={() => setOpen(true)}
        className="grid w-full grid-cols-3 gap-2 rounded-2xl border border-border bg-card/50 p-3 text-left transition hover:bg-card"
      >
        {preview.map((ex) => (
          <div key={ex.id} className="space-y-1">
            <div className="aspect-square overflow-hidden rounded-xl bg-muted">
              <img src={ex.image} alt={ex.name} loading="lazy" className="size-full object-cover" />
            </div>
            <p className="truncate text-[10px] text-muted-foreground">{ex.name}</p>
          </div>
        ))}
        <div className="col-span-3 mt-1 flex items-center justify-end text-xs text-muted-foreground">
          {t("fit.lib.count", { n: EXERCISES.length })} <ChevronRight className="ml-1 size-3" />
        </div>
      </button>

      <ExerciseLibraryDialog open={open} onClose={() => setOpen(false)} />
    </section>
  );
}

type ActivityCategory = "Cardio" | "Outdoor" | "Sport" | "Wellness";
type ActivityItem = {
  id: string;
  icon: typeof Activity;
  kcalPerHour: number;
  category: ActivityCategory;
};

const ACTIVITIES: ActivityItem[] = [
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
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight">{t("fit.act.title")}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{t("fit.act.subtitle")}</p>
      </div>
      {categories.map((cat) => {
        const items = ACTIVITIES.filter((a) => a.category === cat);
        if (items.length === 0) return null;
        return (
          <div key={cat}>
            <h3 className="mb-2 text-sm font-semibold">{t(`cat.${cat}`)}</h3>
            <div className="grid grid-cols-2 gap-2">
              {items.map((a) => (
                <button
                  key={a.id}
                  className="flex flex-col items-start gap-2 rounded-2xl border border-border bg-card/50 p-3 text-left transition hover:bg-card"
                >
                  <div className="grid size-10 place-items-center rounded-xl bg-brand/15 text-brand">
                    <a.icon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{t(`act.${a.id}.name`)}</p>
                    <p className="line-clamp-2 text-[11px] text-muted-foreground">{t(`act.${a.id}.desc`)}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{t("fit.act.kcal_per_h", { n: a.kcalPerHour })}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
