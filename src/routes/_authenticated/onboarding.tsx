import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Apple, Activity, X } from "lucide-react";
import {
  ACTIVITY_OPTIONS,
  calculateMacros,
  type ActivityLevel,
  type Gender,
  type Goal,
} from "@/lib/macros";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Build your plan — Vita" }] }),
  component: Onboarding,
});

type HealthPref = "apple_health" | "google_fit" | "both" | "skipped";

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
  healthPref: HealthPref | null;
}

const initialState: State = {
  gender: null,
  age: 28,
  heightCm: 175,
  currentWeightKg: 75,
  goalWeightKg: 70,
  goal: null,
  weeklyChangeKg: 0.5,
  activityLevel: null,
  workoutFrequency: 3,
  healthPref: null,
};

const TOTAL_STEPS = 10;

function Onboarding() {
  const t = useT();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [state, setState] = useState<State>(initialState);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("onboarding_completed").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data?.onboarding_completed) navigate({ to: "/profile", replace: true });
    });
  }, [user, navigate]);

  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  function next() { setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1)); }
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
      case 9: return !!state.healthPref;
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
        health_integration_preference: state.healthPref,
        onboarding_completed: true,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    navigate({ to: "/profile" });
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-background px-6 pb-8 pt-8">
      <div className="flex items-center justify-between">
        <button
          onClick={step === 0 ? () => navigate({ to: "/welcome" }) : back}
          className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card"
          aria-label={t("onb.back")}
        >
          <ArrowLeft className="size-4 rtl:rotate-180" />
        </button>
        <span className="font-display text-xs font-medium text-muted-foreground">
          {t("onb.step")} {step + 1} {t("onb.of")} {TOTAL_STEPS}
        </span>
      </div>

      <div className="mt-5 h-[3px] w-full overflow-hidden rounded-full bg-border">
        <div className="h-full bg-brand transition-[width] duration-500 ease-out" style={{ width: `${progress}%` }} />
      </div>

      <div className="mt-10 flex-1">
        {step === 0 && <StepGender value={state.gender} onChange={(v) => setState({ ...state, gender: v })} />}
        {step === 1 && <StepNumber title={t("onb.age.title")} subtitle={t("onb.age.subtitle")} unit={t("onb.age.unit")} min={13} max={100} value={state.age} step={1} onChange={(v) => setState({ ...state, age: v })} />}
        {step === 2 && <StepNumber title={t("onb.height.title")} subtitle={t("onb.height.subtitle")} unit={t("onb.height.unit")} min={120} max={230} value={state.heightCm} step={1} onChange={(v) => setState({ ...state, heightCm: v })} />}
        {step === 3 && <StepNumber title={t("onb.weight.title")} subtitle={t("onb.weight.subtitle")} unit={t("onb.weight.unit")} min={35} max={250} value={state.currentWeightKg} step={0.5} fractional onChange={(v) => setState({ ...state, currentWeightKg: v })} />}
        {step === 4 && <StepNumber title={t("onb.goalweight.title")} subtitle={t("onb.goalweight.subtitle")} unit={t("onb.weight.unit")} min={35} max={250} value={state.goalWeightKg} step={0.5} fractional onChange={(v) => setState({ ...state, goalWeightKg: v })} />}
        {step === 5 && <StepGoal value={state.goal} onChange={(v) => setState({ ...state, goal: v })} />}
        {step === 6 && <StepPace goal={state.goal} value={state.weeklyChangeKg} onChange={(v) => setState({ ...state, weeklyChangeKg: v })} />}
        {step === 7 && <StepActivity value={state.activityLevel} onChange={(v) => setState({ ...state, activityLevel: v })} />}
        {step === 8 && <StepNumber title={t("onb.training.title")} subtitle={t("onb.training.subtitle")} unit={t("onb.training.unit")} min={0} max={14} value={state.workoutFrequency} step={1} onChange={(v) => setState({ ...state, workoutFrequency: v })} />}
        {step === 9 && <StepHealth value={state.healthPref} onChange={(v) => setState({ ...state, healthPref: v })} />}
      </div>

      <button
        onClick={step === TOTAL_STEPS - 1 ? finish : next}
        disabled={!canContinue || saving}
        className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-display text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-40"
      >
        {step === TOTAL_STEPS - 1 ? (saving ? t("onb.saving") : t("onb.finish")) : t("onb.continue")}
        {step !== TOTAL_STEPS - 1 && <ArrowRight className="size-4 rtl:rotate-180" />}
      </button>
    </main>
  );
}

/* ---------- Step components ---------- */

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="font-display text-[28px] font-semibold tracking-tight text-balance">{title}</h2>
      <p className="mt-2 max-w-[40ch] text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function StepGender({ value, onChange }: { value: Gender | null; onChange: (v: Gender) => void }) {
  const t = useT();
  const options: { v: Gender; label: string }[] = [
    { v: "male",   label: t("onb.gender.male") },
    { v: "female", label: t("onb.gender.female") },
    { v: "other",  label: t("onb.gender.other") },
  ];
  return (
    <>
      <StepHeader title={t("onb.gender.title")} subtitle={t("onb.gender.subtitle")} />
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
  const t = useT();
  const options: { v: Goal; label: string; desc: string }[] = [
    { v: "lose",     label: t("onb.goal.lose"),     desc: t("onb.goal.lose_desc") },
    { v: "maintain", label: t("onb.goal.maintain"), desc: t("onb.goal.maintain_desc") },
    { v: "gain",     label: t("onb.goal.gain"),     desc: t("onb.goal.gain_desc") },
  ];
  return (
    <>
      <StepHeader title={t("onb.goal.title")} subtitle={t("onb.goal.subtitle")} />
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
  const t = useT();
  if (goal === "maintain") {
    return (
      <>
        <StepHeader title={t("onb.pace.maintain.title")} subtitle={t("onb.pace.maintain.subtitle")} />
        <div className="mt-8 rounded-2xl border border-border bg-card p-6 text-center">
          <p className="font-display text-5xl font-semibold tabular-nums">0.0 <span className="text-base font-normal text-muted-foreground">{t("onb.pace.unit")}</span></p>
        </div>
      </>
    );
  }
  const options = [0.25, 0.5, 0.75, 1.0];
  const labelFor = (o: number) =>
    o <= 0.25 ? t("onb.pace.gentle") :
    o <= 0.5  ? t("onb.pace.recommended") :
    o <= 0.75 ? t("onb.pace.aggressive") : t("onb.pace.max");
  return (
    <>
      <StepHeader
        title={t("onb.pace.title")}
        subtitle={goal === "gain" ? t("onb.pace.subtitle_gain") : t("onb.pace.subtitle_lose")}
      />
      <div className="mt-8 grid grid-cols-2 gap-3">
        {options.map((o) => (
          <OptionCard key={o} selected={value === o} onClick={() => onChange(o)}>
            <div className="text-left">
              <div className="font-display text-2xl font-semibold tabular-nums">
                {o.toFixed(2)} <span className="text-xs font-medium text-muted-foreground">{t("onb.pace.unit")}</span>
              </div>
              <div className="mt-1 text-[11px] font-medium text-muted-foreground">{labelFor(o)}</div>
            </div>
          </OptionCard>
        ))}
      </div>
    </>
  );
}

function StepActivity({ value, onChange }: { value: ActivityLevel | null; onChange: (v: ActivityLevel) => void }) {
  const t = useT();
  return (
    <>
      <StepHeader title={t("onb.activity.title")} subtitle={t("onb.activity.subtitle")} />
      <div className="mt-8 grid gap-3">
        {ACTIVITY_OPTIONS.map((o) => (
          <OptionCard key={o.value} selected={value === o.value} onClick={() => onChange(o.value)}>
            <div className="flex w-full items-center justify-between gap-3 text-left">
              <div>
                <div className="font-display text-sm font-semibold">{o.label}</div>
                <div className="text-xs text-muted-foreground">{o.description}</div>
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
          <span className="font-display text-7xl font-semibold tabular-nums tracking-tighter">
            {fractional ? value.toFixed(1) : value}
          </span>
          <span className="font-display text-base font-medium text-muted-foreground">{unit}</span>
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
      <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </>
  );
}

function StepHealth({ value, onChange }: { value: HealthPref | null; onChange: (v: HealthPref) => void }) {
  const t = useT();
  const options: { v: HealthPref; icon: React.ElementType; label: string; desc: string }[] = [
    { v: "apple_health", icon: Apple,    label: t("onb.health.apple"),  desc: t("onb.health.apple_desc") },
    { v: "google_fit",   icon: Activity, label: t("onb.health.google"), desc: t("onb.health.google_desc") },
    { v: "both",         icon: Check,    label: t("onb.health.both"),   desc: t("onb.health.both_desc") },
    { v: "skipped",      icon: X,        label: t("onb.health.skip"),   desc: t("onb.health.skip_desc") },
  ];
  return (
    <>
      <StepHeader title={t("onb.health.title")} subtitle={t("onb.health.subtitle")} />
      <div className="mt-8 grid gap-3">
        {options.map((o) => (
          <OptionCard key={o.v} selected={value === o.v} onClick={() => onChange(o.v)}>
            <div className="flex w-full items-center gap-3 text-left">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/15">
                <o.icon className="size-4 text-brand" />
              </div>
              <div className="flex-1">
                <div className="font-display text-sm font-semibold">{o.label}</div>
                <div className="text-xs text-muted-foreground">{o.desc}</div>
              </div>
            </div>
          </OptionCard>
        ))}
      </div>
    </>
  );
}

function OptionCard({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex w-full items-center justify-between gap-3 rounded-2xl border bg-card px-5 py-4 text-left transition-all ${
        selected ? "border-brand/70 ring-2 ring-brand/15" : "border-border hover:border-brand/30"
      }`}
    >
      <div className="flex-1">{children}</div>
      <div className={`grid size-6 shrink-0 place-items-center rounded-full transition-colors ${selected ? "bg-brand text-brand-foreground" : "border border-border"}`}>
        {selected && <Check className="size-3.5" strokeWidth={3} />}
      </div>
    </button>
  );
}
