import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Dumbbell, Sparkles, RotateCcw, Check, Calendar, Trophy, Clock, Plus, Trash2, Pencil, BookOpen, ChevronRight, Waves, Bike, Footprints, Trees, Mountain, HeartPulse, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { WorkoutWizard } from "@/components/workout-wizard";
import { TemplateEditor } from "@/components/template-editor";
import { ExerciseLibraryDialog } from "@/components/exercise-library-dialog";
import { useWorkoutPlan, useTemplates, newTemplate, type WorkoutTemplate } from "@/lib/workout-prefs";
import { EXERCISES } from "@/lib/exercise-library";

export const Route = createFileRoute("/_authenticated/fitness")({
  component: FitnessPage,
});

type View = "gym" | "activities";


const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function FitnessPage() {
  const { stored, loaded, save, clear, toggleCompleted } = useWorkoutPlan();
  const [showWizard, setShowWizard] = useState(false);
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [view, setView] = useState<View>("gym");

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
            <EmptyState onStart={() => setShowWizard(true)} />
            <LibrarySection />
            <TemplatesSection />
          </>
        ) : (
          <div className="mt-6">
            <WorkoutWizard
              initial={stored?.wizard}
              onComplete={(w, p) => { save(w, p); setShowWizard(false); }}
              onCancel={stored ? () => setShowWizard(false) : undefined}
            />
          </div>
        )}
      </main>
    );
  }

  return <Dashboard
    stored={stored}
    onRegenerate={() => setShowWizard(true)}
    onClear={clear}
    toggleCompleted={toggleCompleted}
    openDay={openDay}
    setOpenDay={setOpenDay}
    view={view}
    setView={setView}
  />;
}

function ViewTabs({ view, setView }: { view: View; setView: (v: View) => void }) {
  const tabs: { id: View; label: string; icon: typeof Dumbbell }[] = [
    { id: "gym", label: "Gym", icon: Dumbbell },
    { id: "activities", label: "Workouts", icon: Activity },
  ];
  return (
    <div className="mt-5 grid grid-cols-2 gap-1 rounded-2xl border border-border bg-card/50 p-1">
      {tabs.map((t) => {
        const active = view === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${active ? "bg-brand text-white shadow" : "text-muted-foreground hover:text-foreground"}`}
          >
            <t.icon className="size-4" /> {t.label}
          </button>
        );
      })}
    </div>
  );
}


function Header() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand/15 text-brand">
        <Dumbbell className="size-6" />
      </div>
      <div className="min-w-0">
        <h1 className="truncate font-display text-2xl font-semibold tracking-tight">Fitness</h1>
        <p className="truncate text-[12px] text-muted-foreground">AI-powered workouts built for you</p>
      </div>
    </div>
  );
}

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <div className="mt-8 space-y-6 text-center">
      <div className="mx-auto grid size-20 place-items-center rounded-3xl bg-gradient-to-br from-brand/30 to-brand/10">
        <Sparkles className="size-10 text-brand" />
      </div>
      <div>
        <h2 className="font-display text-2xl font-semibold tracking-tight">Your AI Workout Builder</h2>
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
          Answer 7 quick questions and get a complete personalized program in under 60 seconds.
        </p>
      </div>
      <ul className="mx-auto max-w-xs space-y-2 text-left text-sm text-muted-foreground">
        {["Tailored to your goal", "Adapts to your equipment", "Sets, reps & rest included", "Progressive overload built in"].map((t) => (
          <li key={t} className="flex items-center gap-2"><Check className="size-4 text-brand" />{t}</li>
        ))}
      </ul>
      <Button size="lg" className="w-full" onClick={onStart}>
        <Sparkles className="mr-2 size-4" /> Start the wizard
      </Button>
    </div>
  );
}

function Dashboard({
  stored, onRegenerate, onClear, toggleCompleted, openDay, setOpenDay, view, setView,
}: {
  stored: ReturnType<typeof useWorkoutPlan>["stored"];
  onRegenerate: () => void;
  onClear: () => void;
  toggleCompleted: (d: string) => void;
  openDay: string | null;
  setOpenDay: (d: string | null) => void;
  view: View;
  setView: (v: View) => void;
}) {

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
      if (d && !d.rest) return { ...d, when: i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.day };
    }
    return null;
  }, [sortedDays, todayName]);

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

      {/* Program summary card */}
      <div className="mt-6 rounded-3xl border border-border bg-gradient-to-br from-brand/15 to-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Current program</p>
            <h2 className="mt-1 font-display text-lg font-semibold leading-tight">{plan.name}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{plan.split} · {wizard.goal}</p>
          </div>
          <button onClick={onRegenerate} className="rounded-full bg-background/60 p-2 backdrop-blur" aria-label="Regenerate">
            <RotateCcw className="size-4" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat icon={Calendar} label="Days/wk" value={String(trainingDays)} />
          <Stat icon={Clock} label="Weeks" value={String(plan.durationWeeks)} />
          <Stat icon={Trophy} label="Done" value={`${completedWeek}/${trainingDays}`} />
        </div>

        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Weekly progress</span>
            <span className="font-medium">{progressPct}%</span>
          </div>
          <Progress value={progressPct} />
        </div>
      </div>

      {/* Next workout */}
      {nextWorkout && (
        <div className="mt-4 rounded-2xl border border-brand/40 bg-brand/5 p-4">
          <p className="text-[11px] uppercase tracking-wider text-brand">Next workout · {nextWorkout.when}</p>
          <p className="mt-1 font-semibold">{nextWorkout.focus}</p>
          <p className="text-xs text-muted-foreground">{nextWorkout.exercises.length} exercises</p>
          <Button size="sm" className="mt-3 w-full" onClick={() => setOpenDay(nextWorkout.day)}>View workout</Button>
        </div>
      )}

      {/* Weekly split */}
      <h3 className="mt-6 mb-3 text-sm font-semibold">Weekly split</h3>
      <div className="space-y-2">
        {sortedDays.map((d) => {
          const done = completedDays.includes(`${today}:${d.day}`);
          const isToday = d.day === todayName;
          return (
            <div key={d.day} className={`rounded-2xl border p-3 ${isToday ? "border-brand/50 bg-brand/5" : "border-border bg-card/50"}`}>
              <button onClick={() => !d.rest && setOpenDay(openDay === d.day ? null : d.day)} className="flex w-full items-center justify-between text-left">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{d.day}{isToday && " · Today"}</p>
                  <p className="truncate font-medium">{d.rest ? "Rest" : d.focus}</p>
                </div>
                {!d.rest && (
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleCompleted(d.day); }}
                    className={`grid size-8 place-items-center rounded-full border-2 ${done ? "border-brand bg-brand text-white" : "border-border"}`}
                    aria-label="Mark complete"
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
                        {ex.sets} × {ex.reps} · rest {ex.restSec}s{ex.suggestedWeight ? ` · ${ex.suggestedWeight}` : ""}
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


      {/* Progression notes */}
      {plan.progressionNotes && (
        <div className="mt-6 rounded-2xl border border-border bg-card/50 p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Coach's note</p>
          <p className="mt-1 text-sm">{plan.progressionNotes}</p>
        </div>
      )}

      <div className="mt-6 space-y-2">
        <Button variant="outline" className="w-full" onClick={onRegenerate}>
          <Sparkles className="mr-2 size-4" /> Regenerate or update plan
        </Button>
        <button onClick={() => { if (confirm("Delete current plan?")) onClear(); }} className="w-full text-xs text-muted-foreground hover:text-destructive">
          Clear plan
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
  const { templates, loaded, upsert, remove } = useTemplates();
  const [editing, setEditing] = useState<WorkoutTemplate | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!loaded) return null;

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Eigen trainingen</h3>
          <p className="text-xs text-muted-foreground">Bouw zelf je schema of laat de AI Coach helpen</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setEditing(newTemplate())}>
          <Plus className="mr-1 size-4" /> Nieuw
        </Button>
      </div>

      {templates.length === 0 ? (
        <button
          onClick={() => setEditing(newTemplate())}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card/30 p-6 text-sm text-muted-foreground hover:bg-card/50"
        >
          <Plus className="size-4" /> Nieuwe training toevoegen
        </button>
      ) : (
        <div className="space-y-2">
          {templates.map((t) => {
            const open = expanded === t.id;
            const sets = t.exercises.reduce((s, e) => s + e.sets, 0);
            return (
              <div key={t.id} className="rounded-2xl border border-border bg-card/50 p-3">
                <button onClick={() => setExpanded(open ? null : t.id)} className="flex w-full items-start justify-between gap-2 text-left">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[t.day, t.focus].filter(Boolean).join(" · ") || "Geen dag"}{" · "}
                      {t.exercises.length} oef · {sets} sets
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditing(t); }}
                      className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-background"
                      aria-label="Bewerk"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); if (confirm(`Verwijder "${t.name}"?`)) remove(t.id); }}
                      className="grid size-8 place-items-center rounded-full text-muted-foreground hover:text-destructive"
                      aria-label="Verwijder"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </button>
                {open && (
                  <div className="mt-3 space-y-2 border-t border-border pt-3">
                    {t.exercises.map((ex, i) => (
                      <div key={i} className="rounded-lg bg-background/60 p-2 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium">{ex.name}</p>
                          <p className="text-xs text-muted-foreground">{ex.suggestedWeight}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{ex.sets} × {ex.reps} · rust {ex.restSec}s</p>
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
          onSave={(t) => { upsert(t); setEditing(null); }}
        />
      )}
    </section>
  );
}

function LibrarySection() {
  const [open, setOpen] = useState(false);
  const preview = EXERCISES.slice(0, 6);
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Oefeningen bibliotheek</h3>
          <p className="text-xs text-muted-foreground">Bekijk alle gym oefeningen met uitvoering</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <BookOpen className="mr-1 size-4" /> Alles
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
          {EXERCISES.length} oefeningen <ChevronRight className="ml-1 size-3" />
        </div>
      </button>

      <ExerciseLibraryDialog open={open} onClose={() => setOpen(false)} />
    </section>
  );
}

