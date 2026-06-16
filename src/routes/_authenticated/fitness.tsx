import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Dumbbell, Sparkles, RotateCcw, Check, Calendar, Trophy, Clock, Plus, Trash2, Pencil, BookOpen, ChevronRight, Waves, Bike, Footprints, Trees, Mountain, HeartPulse, Activity, Snowflake, Wind, Zap, Target, Sailboat, Music, Heart, Timer, Move, Flame, Tent, Anchor, Flower2, Crosshair, Fish, Gamepad2, Accessibility, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { WorkoutWizard } from "@/components/workout-wizard";
import { TemplateEditor } from "@/components/template-editor";
import { ExerciseLibraryDialog } from "@/components/exercise-library-dialog";
import { useWorkoutPlan, useTemplates, newTemplate, type WorkoutTemplate } from "@/lib/workout-prefs";
import { EXERCISES } from "@/lib/exercise-library";
import { WorkoutSessionDialog } from "@/components/workout-session-dialog";
import type { Exercise } from "@/lib/workout.functions";

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
  const [activeSession, setActiveSession] = useState<{ name: string; exercises: Exercise[] } | null>(null);

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
      <ViewTabs view={view} setView={setView} />



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
                  <Button
                    className="mt-2 w-full"
                    onClick={() => setActiveSession({ name: `${d.day}: ${d.focus}`, exercises: d.exercises })}
                  >
                    ▶ Start training
                  </Button>
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

type ActivityCategory =
  | "Cardio"
  | "Buiten"
  | "Sport"
  | "Wellness"
  | "Kracht & Functioneel"
  | "Watersport"
  | "Wintersport"
  | "Dans & Vechtsport"
  | "Overig";

type ActivityItem = {
  id: string;
  name: string;
  desc: string;
  icon: typeof Activity;
  kcalPerHour: number;
  category: ActivityCategory;
};

const ACTIVITIES: ActivityItem[] = [
  // Cardio
  { id: "hiit", name: "HIIT", desc: "Korte explosieve intervallen", icon: Zap, kcalPerHour: 700, category: "Cardio" },
  { id: "indoor-run", name: "Hardlopen (binnen)", desc: "Loopband", icon: Footprints, kcalPerHour: 600, category: "Cardio" },
  { id: "indoor-bike", name: "Indoor fietsen", desc: "Spinning / hometrainer", icon: Bike, kcalPerHour: 500, category: "Cardio" },
  { id: "elliptical", name: "Crosstrainer", desc: "Elliptische trainer", icon: Activity, kcalPerHour: 450, category: "Cardio" },
  { id: "rowing", name: "Roeien", desc: "Roeimachine", icon: Waves, kcalPerHour: 550, category: "Cardio" },
  { id: "stair-stepper", name: "Stair stepper", desc: "Trapmachine", icon: TrendingUp, kcalPerHour: 500, category: "Cardio" },
  { id: "jump-rope", name: "Touwtjespringen", desc: "Snel en explosief", icon: Activity, kcalPerHour: 700, category: "Cardio" },
  { id: "mixed-cardio", name: "Gemengde cardio", desc: "Combinatie van cardio", icon: HeartPulse, kcalPerHour: 500, category: "Cardio" },
  { id: "hand-cycling", name: "Handfietsen", desc: "Bovenlichaam cardio", icon: Bike, kcalPerHour: 400, category: "Cardio" },
  { id: "wheelchair-run", name: "Rolstoel (looptempo)", desc: "Sneller tempo", icon: Accessibility, kcalPerHour: 500, category: "Cardio" },
  { id: "wheelchair-walk", name: "Rolstoel (wandeltempo)", desc: "Rustig tempo", icon: Accessibility, kcalPerHour: 300, category: "Cardio" },
  { id: "fitness-gaming", name: "Fitness gaming", desc: "Actieve videogames", icon: Gamepad2, kcalPerHour: 350, category: "Cardio" },

  // Buiten
  { id: "run-outdoor", name: "Buiten hardlopen", desc: "Joggen of duurloop", icon: Footprints, kcalPerHour: 600, category: "Buiten" },
  { id: "walk", name: "Wandelen", desc: "Stevige wandeling", icon: Footprints, kcalPerHour: 250, category: "Buiten" },
  { id: "indoor-walk", name: "Wandelen (binnen)", desc: "Loopband wandelen", icon: Footprints, kcalPerHour: 230, category: "Buiten" },
  { id: "bike", name: "Fietsen", desc: "Buiten fietsen of toer", icon: Bike, kcalPerHour: 450, category: "Buiten" },
  { id: "hike", name: "Hiken", desc: "Wandeling in heuvels of bergen", icon: Mountain, kcalPerHour: 400, category: "Buiten" },
  { id: "nature", name: "Natuurwandeling", desc: "Bos en park", icon: Trees, kcalPerHour: 280, category: "Buiten" },
  { id: "climb", name: "Klimmen", desc: "Boulderen of sportklimmen", icon: Mountain, kcalPerHour: 550, category: "Buiten" },
  { id: "equestrian", name: "Paardrijden", desc: "Dressuur of buitenrit", icon: Activity, kcalPerHour: 350, category: "Buiten" },
  { id: "hunting", name: "Jagen", desc: "Buitenactiviteit", icon: Crosshair, kcalPerHour: 300, category: "Buiten" },
  { id: "fishing", name: "Vissen", desc: "Rustige buitensport", icon: Fish, kcalPerHour: 200, category: "Buiten" },
  { id: "archery", name: "Boogschieten", desc: "Precisiesport", icon: Target, kcalPerHour: 250, category: "Buiten" },
  { id: "play", name: "Spelen", desc: "Actief buiten spelen", icon: Activity, kcalPerHour: 300, category: "Buiten" },

  // Sport
  { id: "football", name: "Voetballen", desc: "Wedstrijd of training", icon: Activity, kcalPerHour: 550, category: "Sport" },
  { id: "basketball", name: "Basketbal", desc: "Pick-up game of training", icon: Activity, kcalPerHour: 500, category: "Sport" },
  { id: "tennis", name: "Tennis", desc: "Singles of dubbel", icon: Activity, kcalPerHour: 450, category: "Sport" },
  { id: "padel", name: "Padel", desc: "Wedstrijd of recreatief", icon: Activity, kcalPerHour: 420, category: "Sport" },
  { id: "table-tennis", name: "Tafeltennis", desc: "Snelle reflexen", icon: Activity, kcalPerHour: 280, category: "Sport" },
  { id: "badminton", name: "Badminton", desc: "Racketsport", icon: Activity, kcalPerHour: 400, category: "Sport" },
  { id: "squash", name: "Squash", desc: "Intensieve racketsport", icon: Activity, kcalPerHour: 600, category: "Sport" },
  { id: "racquetball", name: "Racquetball", desc: "Racketsport binnen", icon: Activity, kcalPerHour: 550, category: "Sport" },
  { id: "pickleball", name: "Pickleball", desc: "Mix tennis/badminton", icon: Activity, kcalPerHour: 350, category: "Sport" },
  { id: "volleyball", name: "Volleybal", desc: "Indoor of beach", icon: Activity, kcalPerHour: 400, category: "Sport" },
  { id: "handball", name: "Handbal", desc: "Teamsport", icon: Activity, kcalPerHour: 500, category: "Sport" },
  { id: "rugby", name: "Rugby", desc: "Contactsport", icon: Activity, kcalPerHour: 600, category: "Sport" },
  { id: "american-football", name: "American Football", desc: "Wedstrijd of training", icon: Activity, kcalPerHour: 580, category: "Sport" },
  { id: "australian-football", name: "Australian Football", desc: "AFL", icon: Activity, kcalPerHour: 580, category: "Sport" },
  { id: "baseball", name: "Honkbal", desc: "Wedstrijd of training", icon: Activity, kcalPerHour: 350, category: "Sport" },
  { id: "softball", name: "Softbal", desc: "Wedstrijd of training", icon: Activity, kcalPerHour: 350, category: "Sport" },
  { id: "cricket", name: "Cricket", desc: "Wedstrijd of training", icon: Activity, kcalPerHour: 350, category: "Sport" },
  { id: "hockey", name: "Hockey", desc: "Veld of ijs", icon: Activity, kcalPerHour: 500, category: "Sport" },
  { id: "lacrosse", name: "Lacrosse", desc: "Teamsport", icon: Activity, kcalPerHour: 500, category: "Sport" },
  { id: "golf", name: "Golf", desc: "Volledige ronde", icon: Activity, kcalPerHour: 280, category: "Sport" },
  { id: "bowling", name: "Bowlen", desc: "Recreatief", icon: Activity, kcalPerHour: 200, category: "Sport" },
  { id: "disc-sports", name: "Frisbee sport", desc: "Ultimate of disc golf", icon: Activity, kcalPerHour: 350, category: "Sport" },
  { id: "skating", name: "Skaten", desc: "Inline of rolschaatsen", icon: Activity, kcalPerHour: 450, category: "Sport" },
  { id: "gymnastics", name: "Turnen", desc: "Gymnastiek", icon: Activity, kcalPerHour: 400, category: "Sport" },
  { id: "track-field", name: "Atletiek", desc: "Sprint, springen, werpen", icon: Activity, kcalPerHour: 500, category: "Sport" },
  { id: "fencing", name: "Schermen", desc: "Floret, sabel, degen", icon: Activity, kcalPerHour: 350, category: "Sport" },
  { id: "triathlon", name: "Triatlon", desc: "Zwem-fiets-loop", icon: HeartPulse, kcalPerHour: 650, category: "Sport" },

  // Watersport
  { id: "swim", name: "Zwemmen", desc: "Volledig lichaam, gewrichtsvriendelijk", icon: Waves, kcalPerHour: 500, category: "Watersport" },
  { id: "water-fitness", name: "Aquafitness", desc: "Workout in het water", icon: Waves, kcalPerHour: 350, category: "Watersport" },
  { id: "water-polo", name: "Waterpolo", desc: "Teamsport in water", icon: Waves, kcalPerHour: 550, category: "Watersport" },
  { id: "sailing", name: "Zeilen", desc: "Op het water", icon: Sailboat, kcalPerHour: 250, category: "Watersport" },
  { id: "paddle", name: "Peddelsport", desc: "Kajak, kano, SUP", icon: Anchor, kcalPerHour: 400, category: "Watersport" },
  { id: "surfing", name: "Surfen", desc: "Golfsurf of windsurf", icon: Waves, kcalPerHour: 350, category: "Watersport" },

  // Wintersport
  { id: "downhill-ski", name: "Skiën", desc: "Afdaling", icon: Snowflake, kcalPerHour: 450, category: "Wintersport" },
  { id: "xc-ski", name: "Langlaufen", desc: "Cross-country", icon: Snowflake, kcalPerHour: 600, category: "Wintersport" },
  { id: "snowboard", name: "Snowboarden", desc: "Piste of park", icon: Snowflake, kcalPerHour: 450, category: "Wintersport" },
  { id: "snow-sports", name: "Sneeuwsport", desc: "Overige wintersport", icon: Snowflake, kcalPerHour: 400, category: "Wintersport" },
  { id: "ice-skating", name: "Schaatsen", desc: "Indoor of natuurijs", icon: Snowflake, kcalPerHour: 450, category: "Wintersport" },
  { id: "curling", name: "Curling", desc: "IJssport", icon: Snowflake, kcalPerHour: 250, category: "Wintersport" },

  // Dans & Vechtsport
  { id: "boxing", name: "Boksen", desc: "Bagwork of sparring", icon: Activity, kcalPerHour: 650, category: "Dans & Vechtsport" },
  { id: "kickboxing", name: "Kickboksen", desc: "Stand-up vechtsport", icon: Activity, kcalPerHour: 700, category: "Dans & Vechtsport" },
  { id: "mma", name: "MMA", desc: "Mixed martial arts", icon: Activity, kcalPerHour: 700, category: "Dans & Vechtsport" },
  { id: "martial-arts", name: "Vechtsport", desc: "Karate, judo, BJJ", icon: Activity, kcalPerHour: 600, category: "Dans & Vechtsport" },
  { id: "wrestling", name: "Worstelen", desc: "Mat sport", icon: Activity, kcalPerHour: 600, category: "Dans & Vechtsport" },
  { id: "dance", name: "Dansen", desc: "Vrije dans", icon: Music, kcalPerHour: 400, category: "Dans & Vechtsport" },
  { id: "social-dance", name: "Sociale dans", desc: "Salsa, swing, ballroom", icon: Music, kcalPerHour: 350, category: "Dans & Vechtsport" },

  // Kracht & Functioneel
  { id: "strength", name: "Krachttraining", desc: "Traditioneel met gewichten", icon: Dumbbell, kcalPerHour: 400, category: "Kracht & Functioneel" },
  { id: "functional", name: "Functionele kracht", desc: "Compound bewegingen", icon: Dumbbell, kcalPerHour: 450, category: "Kracht & Functioneel" },
  { id: "core", name: "Core training", desc: "Buik en romp", icon: Flame, kcalPerHour: 300, category: "Kracht & Functioneel" },
  { id: "cross-training", name: "Crosstraining", desc: "Variatie aan oefeningen", icon: Activity, kcalPerHour: 500, category: "Kracht & Functioneel" },
  { id: "step-training", name: "Step training", desc: "Aerobic met step", icon: TrendingUp, kcalPerHour: 400, category: "Kracht & Functioneel" },
  { id: "flexibility", name: "Flexibiliteit", desc: "Stretchen en mobiliteit", icon: Move, kcalPerHour: 150, category: "Kracht & Functioneel" },
  { id: "cooldown", name: "Cooldown", desc: "Rustige afsluiting", icon: Wind, kcalPerHour: 120, category: "Kracht & Functioneel" },
  { id: "prep-recovery", name: "Warming-up & herstel", desc: "Voorbereiding en herstel", icon: Timer, kcalPerHour: 150, category: "Kracht & Functioneel" },

  // Wellness
  { id: "yoga", name: "Yoga", desc: "Flow of restorative", icon: HeartPulse, kcalPerHour: 250, category: "Wellness" },
  { id: "pilates", name: "Pilates", desc: "Controle en core", icon: Flower2, kcalPerHour: 250, category: "Wellness" },
  { id: "tai-chi", name: "Tai chi", desc: "Bewegende meditatie", icon: Flower2, kcalPerHour: 200, category: "Wellness" },
  { id: "barre", name: "Barre", desc: "Ballet-geïnspireerd", icon: Flower2, kcalPerHour: 300, category: "Wellness" },
  { id: "mind-body", name: "Mind & Body", desc: "Geest en lichaam", icon: Heart, kcalPerHour: 200, category: "Wellness" },

  // Overig
  { id: "other", name: "Overig", desc: "Andere activiteit", icon: Tent, kcalPerHour: 300, category: "Overig" },
];

function ActivitiesSection() {
  const categories: ActivityCategory[] = [
    "Cardio",
    "Kracht & Functioneel",
    "Buiten",
    "Sport",
    "Watersport",
    "Wintersport",
    "Dans & Vechtsport",
    "Wellness",
    "Overig",
  ];
  return (
    <section className="mt-6 space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight">Workouts & activiteiten</h2>
        <p className="mt-1 text-xs text-muted-foreground">Naast gym — zwemmen, fietsen, hardlopen, sporten en meer.</p>
      </div>
      {categories.map((cat) => {
        const items = ACTIVITIES.filter((a) => a.category === cat);
        if (items.length === 0) return null;
        return (
          <div key={cat}>
            <h3 className="mb-2 text-sm font-semibold">{cat}</h3>
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
                    <p className="truncate text-sm font-medium">{a.name}</p>
                    <p className="line-clamp-2 text-[11px] text-muted-foreground">{a.desc}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">~{a.kcalPerHour} kcal/u</p>
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

