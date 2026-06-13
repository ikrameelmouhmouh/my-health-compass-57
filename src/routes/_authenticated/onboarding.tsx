import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import {
  ACTIVITY_OPTIONS,
  calculateMacros,
  type ActivityLevel,
  type Gender,
  type Goal,
} from "@/lib/macros";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Calibration — Apex" }] }),
  component: Onboarding,
});

interface State {
  gender: Gender | null;
  age: number;
  heightCm: number;
  currentWeightKg: number;
  goalWeightKg: number;
  goal: Goal | null;
  weeklyChangeKg: number;
  activityLevel: ActivityLevel | null;
  workoutFrequency: number;
}

const initialState: State = {
  gender: null,
  age: 28,
  heightCm: 180,
  currentWeightKg: 78,
  goalWeightKg: 75,
  goal: null,
  weeklyChangeKg: 0.5,
  activityLevel: null,
  workoutFrequency: 3,
};

const STEPS = ["Gender", "Age", "Height", "Weight", "Goal", "Pace", "Activity", "Training", "Review"] as const;

function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [state, setState] = useState<State>(initialState);
  const [saving, setSaving] = useState(false);

  // Skip onboarding if already completed
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("onboarding_completed").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data?.onboarding_completed) navigate({ to: "/profile", replace: true });
    });
  }, [user, navigate]);

  const totalSteps = STEPS.length;
  const progress = ((step + 1) / totalSteps) * 100;

  function next() { setStep((s) => Math.min(s + 1, totalSteps - 1)); }
  function back() { setStep((s) => Math.max(s - 1, 0)); }

  const canContinue = useMemo(() => {
    switch (step) {
      case 0: return !!state.gender;
      case 1: return state.age > 10 && state.age < 110;
      case 2: return state.heightCm > 100 && state.heightCm < 250;
      case 3: return state.currentWeightKg > 30 && state.currentWeightKg < 300;
      case 4: return state.goalWeightKg > 30 && state.goalWeightKg < 300;
      case 5: return !!state.goal;
      case 6: return state.goal === "maintain" || (state.weeklyChangeKg > 0 && state.weeklyChangeKg <= 1.0);
      case 7: return !!state.activityLevel;
      case 8: return state.workoutFrequency >= 0 && state.workoutFrequency <= 14;
      default: return true;
    }
  }, [step, state]);

  async function finish() {
    if (!user) return;
    setSaving(true);
    const macros = calculateMacros({
      gender: state.gender!,
      age: state.age,
      heightCm: state.heightCm,
      currentWeightKg: state.currentWeightKg,
      goal: state.goal!,
      weeklyChangeKg: state.goal === "maintain" ? 0 : state.weeklyChangeKg,
      activityLevel: state.activityLevel!,
    });
    const { error } = await supabase
      .from("profiles")
      .update({
        gender: state.gender,
        age: state.age,
        height_cm: state.heightCm,
        current_weight_kg: state.currentWeightKg,
        goal_weight_kg: state.goalWeightKg,
        goal: state.goal,
        weekly_change_kg: state.goal === "maintain" ? 0 : state.weeklyChangeKg,
        activity_level: state.activityLevel,
        workout_frequency: state.workoutFrequency,
        maintenance_calories: macros.maintenanceCalories,
        daily_calories: macros.dailyCalories,
        protein_g: macros.proteinG,
        fat_g: macros.fatG,
        carbs_g: macros.carbsG,
        onboarding_completed: true,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    navigate({ to: "/profile" });
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-background px-6 pb-8 pt-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={step === 0 ? () => navigate({ to: "/" }) : back}
          className="inline-flex size-10 items-center justify-center rounded-full border border-hairline bg-surface"
          aria-label="Back"
        >
          <ArrowLeft className="size-4" />
        </button>
        <span className="font-display text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          Step {String(step + 1).padStart(2, "0")} / {String(totalSteps).padStart(2, "0")}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-5 h-[3px] w-full overflow-hidden rounded-full bg-surface">
        <div className="h-full bg-brand transition-[width] duration-500 ease-out" style={{ width: `${progress}%` }} />
      </div>

      {/* Step content */}
      <div className="mt-10 flex-1">
        {step === 0 && <StepGender value={state.gender} onChange={(v) => setState({ ...state, gender: v })} />}
        {step === 1 && <StepNumber title="What's your age?" subtitle="Used to model your basal metabolic rate." unit="years" min={13} max={100} value={state.age} step={1} onChange={(v) => setState({ ...state, age: v })} />}
        {step === 2 && <StepNumber title="How tall are you?" subtitle="In centimeters." unit="cm" min={120} max={230} value={state.heightCm} step={1} onChange={(v) => setState({ ...state, heightCm: v })} />}
        {step === 3 && <StepNumber title="Current weight" subtitle="Be precise — this is your baseline." unit="kg" min={35} max={250} value={state.currentWeightKg} step={0.5} fractional onChange={(v) => setState({ ...state, currentWeightKg: v })} />}
        {step === 4 && <StepNumber title="Goal weight" subtitle="The number you're calibrating toward." unit="kg" min={35} max={250} value={state.goalWeightKg} step={0.5} fractional onChange={(v) => setState({ ...state, goalWeightKg: v })} />}
        {step === 5 && <StepGoal value={state.goal} onChange={(v) => setState({ ...state, goal: v })} />}
        {step === 6 && <StepPace goal={state.goal} value={state.weeklyChangeKg} onChange={(v) => setState({ ...state, weeklyChangeKg: v })} />}
        {step === 7 && <StepActivity value={state.activityLevel} onChange={(v) => setState({ ...state, activityLevel: v })} />}
        {step === 8 && <StepNumber title="Workouts per week" subtitle="Structured training sessions only." unit="sessions" min={0} max={14} value={state.workoutFrequency} step={1} onChange={(v) => setState({ ...state, workoutFrequency: v })} />}
        {step === 9 && <StepReview state={state} />}
      </div>

      {/* CTA */}
      <button
        onClick={step === totalSteps - 1 ? finish : next}
        disabled={!canContinue || saving}
        className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand font-display text-sm font-bold uppercase tracking-widest text-brand-foreground transition-opacity disabled:opacity-40"
      >
        {step === totalSteps - 1 ? (saving ? "Generating..." : "Generate protocol") : "Continue"}
        {step !== totalSteps - 1 && <ArrowRight className="size-4" />}
      </button>
    </main>
  );
}

/* ---------- Step components ---------- */

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="font-display text-3xl font-bold uppercase tracking-tight text-balance">{title}</h2>
      <p className="mt-2 max-w-[40ch] text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function StepGender({ value, onChange }: { value: Gender | null; onChange: (v: Gender) => void }) {
  const options: { v: Gender; label: string }[] = [
    { v: "male", label: "Male" },
    { v: "female", label: "Female" },
    { v: "other", label: "Other" },
  ];
  return (
    <>
      <StepHeader title="Biological sex" subtitle="Drives the constants in your metabolic equation." />
      <div className="mt-8 grid grid-cols-1 gap-3">
        {options.map((o) => (
          <OptionCard key={o.v} selected={value === o.v} onClick={() => onChange(o.v)}>
            <span className="font-display text-base font-semibold">{o.label}</span>
          </OptionCard>
        ))}
      </div>
    </>
  );
}

function StepGoal({ value, onChange }: { value: Goal | null; onChange: (v: Goal) => void }) {
  const options: { v: Goal; label: string; desc: string }[] = [
    { v: "lose", label: "Lose weight", desc: "Calorie deficit, prioritize lean mass." },
    { v: "maintain", label: "Maintain", desc: "Hold composition, recompose." },
    { v: "gain", label: "Gain weight", desc: "Controlled surplus, build mass." },
  ];
  return (
    <>
      <StepHeader title="Primary goal" subtitle="Pick the trajectory we'll engineer your protocol around." />
      <div className="mt-8 grid gap-3">
        {options.map((o) => (
          <OptionCard key={o.v} selected={value === o.v} onClick={() => onChange(o.v)}>
            <div className="flex flex-col text-left">
              <span className="font-display text-base font-semibold">{o.label}</span>
              <span className="text-xs text-muted-foreground">{o.desc}</span>
            </div>
          </OptionCard>
        ))}
      </div>
    </>
  );
}

function StepPace({ goal, value, onChange }: { goal: Goal | null; value: number; onChange: (v: number) => void }) {
  if (goal === "maintain") {
    return (
      <>
        <StepHeader title="Maintenance mode" subtitle="No weekly target — we'll hold your current weight." />
        <div className="mt-8 rounded-2xl border border-hairline bg-surface p-6 text-center">
          <p className="font-display text-5xl font-bold tabular-nums">0.0 <span className="text-base text-muted-foreground">kg / wk</span></p>
        </div>
      </>
    );
  }
  const options = [0.25, 0.5, 0.75, 1.0];
  const verb = goal === "gain" ? "gain" : "lose";
  return (
    <>
      <StepHeader title="Desired pace" subtitle={`How fast should you ${verb} per week?`} />
      <div className="mt-8 grid grid-cols-2 gap-3">
        {options.map((o) => (
          <OptionCard key={o} selected={value === o} onClick={() => onChange(o)}>
            <div className="text-left">
              <div className="font-display text-2xl font-bold tabular-nums">{o.toFixed(2)} <span className="text-xs font-medium text-muted-foreground">kg/wk</span></div>
              <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                {o <= 0.25 ? "Gentle" : o <= 0.5 ? "Recommended" : o <= 0.75 ? "Aggressive" : "Maximum"}
              </div>
            </div>
          </OptionCard>
        ))}
      </div>
    </>
  );
}

function StepActivity({ value, onChange }: { value: ActivityLevel | null; onChange: (v: ActivityLevel) => void }) {
  return (
    <>
      <StepHeader title="Activity level" subtitle="Your day-to-day movement outside structured training." />
      <div className="mt-8 grid gap-3">
        {ACTIVITY_OPTIONS.map((o) => (
          <OptionCard key={o.value} selected={value === o.value} onClick={() => onChange(o.value)}>
            <div className="flex w-full items-center justify-between gap-3 text-left">
              <div>
                <div className="font-display text-sm font-semibold">{o.label}</div>
                <div className="text-xs text-muted-foreground">{o.description}</div>
              </div>
              <div className="shrink-0 font-display text-[10px] uppercase tracking-widest text-muted-foreground">
                {o.multiplier}
              </div>
            </div>
          </OptionCard>
        ))}
      </div>
    </>
  );
}

function StepNumber({
  title, subtitle, unit, min, max, step = 1, value, onChange, fractional = false,
}: {
  title: string; subtitle: string; unit: string;
  min: number; max: number; step?: number; value: number;
  fractional?: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <>
      <StepHeader title={title} subtitle={subtitle} />
      <div className="mt-12 text-center">
        <div className="inline-flex items-baseline gap-3">
          <span className="font-display text-7xl font-bold tabular-nums tracking-tighter">
            {fractional ? value.toFixed(1) : value}
          </span>
          <span className="font-display text-base font-medium uppercase tracking-widest text-muted-foreground">{unit}</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-10 w-full accent-[var(--brand)]"
      />
      <div className="mt-2 flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </>
  );
}

function StepReview({ state }: { state: State }) {
  const macros = useMemo(() => {
    if (!state.gender || !state.goal || !state.activityLevel) return null;
    return calculateMacros({
      gender: state.gender,
      age: state.age,
      heightCm: state.heightCm,
      currentWeightKg: state.currentWeightKg,
      goal: state.goal,
      weeklyChangeKg: state.goal === "maintain" ? 0 : state.weeklyChangeKg,
      activityLevel: state.activityLevel,
    });
  }, [state]);

  return (
    <>
      <StepHeader title="Confirm your blueprint" subtitle="One last look before we lock the protocol." />
      <div className="mt-8 space-y-2">
        <Row label="Sex" value={cap(state.gender ?? "—")} />
        <Row label="Age" value={`${state.age} years`} />
        <Row label="Height" value={`${state.heightCm} cm`} />
        <Row label="Current weight" value={`${state.currentWeightKg.toFixed(1)} kg`} />
        <Row label="Goal weight" value={`${state.goalWeightKg.toFixed(1)} kg`} />
        <Row label="Goal" value={cap(state.goal ?? "—")} />
        {state.goal !== "maintain" && <Row label="Pace" value={`${state.weeklyChangeKg.toFixed(2)} kg / wk`} />}
        <Row label="Activity" value={cap((state.activityLevel ?? "—").replace("_", " "))} />
        <Row label="Workouts" value={`${state.workoutFrequency} / week`} />
      </div>
      {macros && (
        <div className="mt-6 rounded-2xl border border-brand/30 bg-brand/5 p-5">
          <p className="font-display text-[10px] uppercase tracking-widest text-brand">Daily target preview</p>
          <p className="mt-1 font-display text-4xl font-bold tabular-nums">{macros.dailyCalories.toLocaleString()} <span className="text-sm font-medium text-muted-foreground">kcal</span></p>
        </div>
      )}
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-hairline py-3">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="font-display text-sm font-semibold">{value}</span>
    </div>
  );
}

function OptionCard({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex w-full items-center justify-between gap-3 rounded-2xl border bg-surface px-5 py-4 text-left transition-all ${
        selected ? "border-brand bg-brand/5" : "border-hairline hover:border-hairline/80"
      }`}
    >
      <div className="flex-1">{children}</div>
      <div className={`grid size-6 shrink-0 place-items-center rounded-full transition-colors ${selected ? "bg-brand text-brand-foreground" : "border border-hairline"}`}>
        {selected && <Check className="size-3.5" strokeWidth={3} />}
      </div>
    </button>
  );
}

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
