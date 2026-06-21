import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Check, ChevronLeft, Sparkles } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { generateWorkoutPlan, type WizardInputT, type WorkoutPlan } from "@/lib/workout.functions";
import { useI18n } from "@/lib/i18n";

const GOALS: { id: string; key: string }[] = [
  { id: "Lose Weight", key: "wiz.goal.lose" },
  { id: "Build Muscle", key: "wiz.goal.muscle" },
  { id: "Increase Strength", key: "wiz.goal.strength" },
  { id: "Improve Fitness", key: "wiz.goal.fitness" },
  { id: "Improve Endurance", key: "wiz.goal.endurance" },
  { id: "Body Recomposition", key: "wiz.goal.recomp" },
];
const EXPERIENCE = ["Beginner", "Intermediate", "Advanced"];
const LOCATIONS = ["Gym", "Home", "Both"];
const HOME_EQUIP = ["Dumbbells", "Resistance Bands", "Barbell", "Bench", "Pull Up Bar", "No Equipment"];
const FREQ = [1, 2, 3, 4, 5, 6];
const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
const FOCUS = ["Glutes", "Legs", "Back", "Chest", "Shoulders", "Arms", "Core"];

type Props = {
  onComplete: (wizard: WizardInputT, plan: WorkoutPlan) => void;
  onCancel?: () => void;
  initial?: Partial<WizardInputT>;
};

export function WorkoutWizard({ onComplete, onCancel, initial }: Props) {
  const { t } = useI18n();
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState(initial?.goal ?? "");
  const [experience, setExperience] = useState(initial?.experience ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [equipment, setEquipment] = useState<string[]>(initial?.equipment ?? []);
  const [frequency, setFrequency] = useState<number>(initial?.frequency ?? 0);
  const [trainingDays, setTrainingDays] = useState<string[]>(initial?.trainingDays ?? []);
  const [focusAreas, setFocusAreas] = useState<string[]>(initial?.focusAreas ?? []);
  const [duration, setDuration] = useState<string>(initial?.duration?.toString() ?? "");
  const [injuries, setInjuries] = useState(initial?.injuries ?? "");
  const [avoid, setAvoid] = useState(initial?.avoid ?? "");
  const [favorites, setFavorites] = useState(initial?.favorites ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useServerFn(generateWorkoutPlan);

  const totalSteps = 8;

  const toggle = (arr: string[], v: string, setter: (a: string[]) => void) => {
    setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  };

  const showEquipStep = location === "Home" || location === "Both";

  const canNext = (() => {
    switch (step) {
      case 1: return !!goal;
      case 2: return !!experience;
      case 3: return !!location;
      case 4: return !showEquipStep || equipment.length > 0;
      case 5: return frequency > 0;
      case 6: return trainingDays.length === frequency;
      case 7: return true;
      case 8: return true;
      default: return false;
    }
  })();

  const handleNext = () => {
    if (step === 3 && !showEquipStep) setStep(5);
    else setStep((s) => Math.min(totalSteps, s + 1));
  };
  const handleBack = () => {
    if (step === 5 && !showEquipStep) setStep(3);
    else setStep((s) => Math.max(1, s - 1));
  };

  const handleGenerate = async () => {
    setError(null);
    setLoading(true);
    try {
      const wizard: WizardInputT = {
        goal, experience, location,
        equipment: showEquipStep ? equipment : ["Full Gym Access"],
        frequency,
        trainingDays: trainingDays.length === frequency ? (trainingDays as WizardInputT["trainingDays"]) : undefined,
        focusAreas,
        duration: duration ? parseInt(duration, 10) : undefined,
        injuries: injuries || undefined,
        avoid: avoid || undefined,
        favorites: favorites || undefined,
      };
      const plan = await generate({ data: wizard });
      onComplete(wizard, plan);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("wiz.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        {step > 1 && !loading && (
          <button onClick={handleBack} className="rounded-full p-1.5 hover:bg-muted">
            <ChevronLeft className="size-4" />
          </button>
        )}
        <div className="flex-1">
          <div className="flex gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full ${i < step ? "bg-brand" : "bg-muted"}`} />
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{t("wiz.step", { n: step, total: totalSteps })}</p>
        </div>
        {onCancel && !loading && (
          <button onClick={onCancel} className="text-xs text-muted-foreground hover:text-foreground">{t("wiz.cancel")}</button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <Loader2 className="size-8 animate-spin text-brand" />
          <p className="text-sm font-medium">{t("wiz.building")}</p>
          <p className="text-xs text-muted-foreground">{t("wiz.building_sub")}</p>
        </div>
      ) : (
        <>
          {step === 1 && (
            <Section title={t("wiz.q1.title")} subtitle={t("wiz.q1.sub")}>
              <Grid>{GOALS.map((g) => <Pill key={g.id} active={goal === g.id} onClick={() => setGoal(g.id)}>{t(g.key)}</Pill>)}</Grid>
            </Section>
          )}
          {step === 2 && (
            <Section title={t("wiz.q2.title")} subtitle={t("wiz.q2.sub")}>
              <Grid>{EXPERIENCE.map((g) => <Pill key={g} active={experience === g} onClick={() => setExperience(g)}>{t(`wiz.exp.${g}`)}</Pill>)}</Grid>
            </Section>
          )}
          {step === 3 && (
            <Section title={t("wiz.q3.title")} subtitle={t("wiz.q3.sub")}>
              <Grid>{LOCATIONS.map((g) => <Pill key={g} active={location === g} onClick={() => setLocation(g)}>{t(`wiz.loc.${g}`)}</Pill>)}</Grid>
            </Section>
          )}
          {step === 4 && showEquipStep && (
            <Section title={t("wiz.q4.title")} subtitle={t("wiz.q4.sub")}>
              <Grid>{HOME_EQUIP.map((g) => <Pill key={g} active={equipment.includes(g)} onClick={() => toggle(equipment, g, setEquipment)} multi>{t(`wiz.eq.${g}`)}</Pill>)}</Grid>
              {location === "Both" && <p className="mt-3 text-xs text-muted-foreground">{t("wiz.q4.both")}</p>}
            </Section>
          )}
          {step === 5 && (
            <Section title={t("wiz.q5.title")} subtitle={t("wiz.q5.sub")}>
              <Grid>{FREQ.map((n) => <Pill key={n} active={frequency === n} onClick={() => { setFrequency(n); if (trainingDays.length > n) setTrainingDays(trainingDays.slice(0, n)); }}>{n} {n === 1 ? t("wiz.q5.day") : t("wiz.q5.days")}</Pill>)}</Grid>
            </Section>
          )}
          {step === 6 && (
            <Section title={t("wiz.q5b.title")} subtitle={t("wiz.q5b.sub", { n: frequency })}>
              <Grid>
                {WEEK_DAYS.map((d) => {
                  const active = trainingDays.includes(d);
                  const full = trainingDays.length >= frequency && !active;
                  return (
                    <Pill
                      key={d}
                      active={active}
                      multi
                      onClick={() => {
                        if (active) setTrainingDays(trainingDays.filter((x) => x !== d));
                        else if (!full) setTrainingDays([...trainingDays, d]);
                      }}
                    >
                      <span className={full ? "opacity-40" : ""}>{t(`day.${d}`)}</span>
                    </Pill>
                  );
                })}
              </Grid>
              <p className="mt-3 text-xs text-muted-foreground">
                {t("wiz.q5b.pick_n", { n: Math.max(0, frequency - trainingDays.length) })}
              </p>
            </Section>
          )}
          {step === 7 && (
            <Section title={t("wiz.q6.title")} subtitle={t("wiz.q6.sub")}>
              <Grid>{FOCUS.map((g) => <Pill key={g} active={focusAreas.includes(g)} onClick={() => toggle(focusAreas, g, setFocusAreas)} multi>{t(`wiz.focus.${g}`)}</Pill>)}</Grid>
            </Section>
          )}
          {step === 8 && (
            <Section title={t("wiz.q7.title")} subtitle={t("wiz.q7.sub")}>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t("wiz.q7.injuries")}</label>
                  <Textarea rows={2} placeholder={t("wiz.q7.injuries_ph")} value={injuries} onChange={(e) => setInjuries(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t("wiz.q7.avoid")}</label>
                  <Textarea rows={2} placeholder={t("wiz.q7.avoid_ph")} value={avoid} onChange={(e) => setAvoid(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t("wiz.q7.favs")}</label>
                  <Textarea rows={2} placeholder={t("wiz.q7.favs_ph")} value={favorites} onChange={(e) => setFavorites(e.target.value)} className="mt-1" />
                </div>
              </div>
            </Section>
          )}


          {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

          <div className="pt-2">
            {step < totalSteps ? (
              <Button className="w-full" disabled={!canNext} onClick={handleNext}>{t("wiz.continue")}</Button>
            ) : (
              <Button className="w-full" onClick={handleGenerate}>
                <Sparkles className="mr-2 size-4" /> {t("wiz.generate")}
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-xl font-semibold tracking-tight">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>;
}

function Pill({ active, multi, onClick, children }: { active?: boolean; multi?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`relative rounded-xl border px-3 py-3 text-sm font-medium transition ${
        active ? "border-brand bg-brand/10 text-foreground" : "border-border bg-card/50 text-foreground/80 hover:bg-card"
      }`}
    >
      {children}
      {active && multi && <Check className="absolute right-2 top-2 size-3.5 text-brand" />}
    </button>
  );
}
