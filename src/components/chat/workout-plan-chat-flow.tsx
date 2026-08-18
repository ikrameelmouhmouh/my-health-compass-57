import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, Dumbbell, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { TemplateSyncDialog } from "@/components/template-sync-dialog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useTodayWorkout } from "@/lib/dashboard-prefs";
import { generateWorkoutPlan, type WizardInputT, type WorkoutPlan } from "@/lib/workout.functions";
import { appendWorkoutFlowMessages } from "@/lib/chat.functions";
import { templatesFromPlan, useTemplates, type WorkoutTemplate } from "@/lib/workout-prefs";
import { normalizeDay, todayDayName } from "@/lib/workout-today";


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

type FlowStep = "goal" | "experience" | "location" | "equipment" | "frequency" | "days" | "focus" | "generating" | "done";

type FlowAnswers = {
  goal?: string;
  experience?: string;
  location?: string;
  equipment: string[];
  frequency?: number;
  trainingDays: string[];
  focusAreas: string[];
};

const initialAnswers: FlowAnswers = {
  equipment: [],
  trainingDays: [],
  focusAreas: [],
};

function scheduleTodayFrom(tpls: WorkoutTemplate[], saveTodayWorkout: ReturnType<typeof useTodayWorkout>["save"]) {
  const today = todayDayName();
  const todays = tpls.find((tpl) => normalizeDay(tpl.day) === today);
  if (!todays) return;
  const sets = todays.exercises.reduce((sum, exercise) => sum + (Number(exercise.sets) || 0), 0);
  const durationMin = Math.max(15, Math.min(120, Math.round(sets * 3) || 30));
  saveTodayWorkout({ name: todays.name, type: todays.focus || "Workout", durationMin });
}

function labelFor(value: string | number, t: (k: string, v?: Record<string, string | number>) => string) {
  if (typeof value === "number") return `${value}`;
  if (GOALS.some((goal) => goal.id === value)) return t(GOALS.find((goal) => goal.id === value)!.key);
  if (EXPERIENCE.includes(value)) return t(`wiz.exp.${value}`);
  if (LOCATIONS.includes(value)) return t(`wiz.loc.${value}`);
  if (HOME_EQUIP.includes(value)) return t(`wiz.eq.${value}`);
  if (FOCUS.includes(value)) return t(`wiz.focus.${value}`);
  if ((WEEK_DAYS as readonly string[]).includes(value)) return t(`day.${value}`);
  return value;
}

export function WorkoutPlanChatFlow({
  threadId,
  onPersisted,
}: {
  threadId: string | null;
  onPersisted: (threadId: string) => void;
}) {

  const { t, lang } = useI18n();
  const generate = useServerFn(generateWorkoutPlan);
  const [step, setStep] = useState<FlowStep>("goal");
  const [answers, setAnswers] = useState<FlowAnswers>(initialAnswers);
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [error, setError] = useState<string | null>(null);

  const summaries = useMemo(() => {
    const rows: string[] = [];
    if (answers.goal) rows.push(labelFor(answers.goal, t));
    if (answers.experience) rows.push(labelFor(answers.experience, t));
    if (answers.location) rows.push(labelFor(answers.location, t));
    if (answers.equipment.length > 0 && answers.location !== "Gym") {
      rows.push(answers.equipment.map((item) => labelFor(item, t)).join(" · "));
    }
    if (answers.frequency) rows.push(`${answers.frequency} ${answers.frequency === 1 ? t("wiz.q5.day") : t("wiz.q5.days")}`);
    if (answers.trainingDays.length > 0) rows.push(answers.trainingDays.map((day) => labelFor(day, t)).join(" · "));
    if (answers.focusAreas.length > 0) rows.push(answers.focusAreas.map((item) => labelFor(item, t)).join(" · "));
    return rows;
  }, [answers, t]);

  function selectGoal(value: string) {
    setAnswers((current) => ({ ...current, goal: value }));
    setStep("experience");
  }

  function selectExperience(value: string) {
    setAnswers((current) => ({ ...current, experience: value }));
    setStep("location");
  }

  function selectLocation(value: string) {
    setAnswers((current) => ({
      ...current,
      location: value,
      equipment: value === "Gym" ? ["Full Gym Access"] : current.equipment,
    }));
    setStep(value === "Gym" ? "frequency" : "equipment");
  }

  function selectFrequency(value: number) {
    setAnswers((current) => ({
      ...current,
      frequency: value,
      trainingDays: current.trainingDays.slice(0, value),
    }));
    setStep("days");
  }

  function toggleList(field: "equipment" | "trainingDays" | "focusAreas", value: string, max?: number) {
    setAnswers((current) => {
      const list = current[field];
      const active = list.includes(value);
      if (!active && max && list.length >= max) return current;
      return { ...current, [field]: active ? list.filter((item) => item !== value) : [...list, value] };
    });
  }

  async function buildPlan() {
    const wizard: WizardInputT = {
      goal: answers.goal!,
      experience: answers.experience!,
      location: answers.location!,
      equipment: answers.equipment.length > 0 ? answers.equipment : ["Full Gym Access"],
      frequency: answers.frequency!,
      trainingDays: answers.trainingDays as WizardInputT["trainingDays"],
      focusAreas: answers.focusAreas,
      locale: lang as WizardInputT["locale"],
    };
    setStep("generating");
    setError(null);
    try {
      const generated = await generate({ data: wizard });
      setPlan(generated);
      setTemplates(templatesFromPlan(generated));
      setStep("done");
    } catch (err) {
      console.error("[workout-chat] generate failed", err);
      setError(err instanceof Error ? err.message : t("wiz.error"));
      setStep("focus");
    }
  }

  return (
    <div className="space-y-3">
      {summaries.map((summary, index) => (
        <div key={`${summary}-${index}`} className="flex justify-end">
          <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
            {summary}
          </div>
        </div>
      ))}

      {step === "goal" && (
        <Question title={t("wiz.q1.title")} subtitle={t("wiz.q1.sub")}>
          <ChoiceGrid>{GOALS.map((goal) => <Choice key={goal.id} onClick={() => selectGoal(goal.id)}>{t(goal.key)}</Choice>)}</ChoiceGrid>
        </Question>
      )}
      {step === "experience" && (
        <Question title={t("wiz.q2.title")} subtitle={t("wiz.q2.sub")}>
          <ChoiceGrid>{EXPERIENCE.map((item) => <Choice key={item} onClick={() => selectExperience(item)}>{t(`wiz.exp.${item}`)}</Choice>)}</ChoiceGrid>
        </Question>
      )}
      {step === "location" && (
        <Question title={t("wiz.q3.title")} subtitle={t("wiz.q3.sub")}>
          <ChoiceGrid>{LOCATIONS.map((item) => <Choice key={item} onClick={() => selectLocation(item)}>{t(`wiz.loc.${item}`)}</Choice>)}</ChoiceGrid>
        </Question>
      )}
      {step === "equipment" && (
        <Question title={t("wiz.q4.title")} subtitle={t("wiz.q4.sub")}>
          <ChoiceGrid>
            {HOME_EQUIP.map((item) => (
              <Choice key={item} active={answers.equipment.includes(item)} onClick={() => toggleList("equipment", item)} multi>
                {t(`wiz.eq.${item}`)}
              </Choice>
            ))}
          </ChoiceGrid>
          <Button className="mt-3 w-full" disabled={answers.equipment.length === 0} onClick={() => setStep("frequency")}>{t("wiz.continue")}</Button>
        </Question>
      )}
      {step === "frequency" && (
        <Question title={t("wiz.q5.title")} subtitle={t("wiz.q5.sub")}>
          <ChoiceGrid>{FREQ.map((item) => <Choice key={item} onClick={() => selectFrequency(item)}>{item} {item === 1 ? t("wiz.q5.day") : t("wiz.q5.days")}</Choice>)}</ChoiceGrid>
        </Question>
      )}
      {step === "days" && (
        <Question title={t("wiz.q5b.title")} subtitle={t("wiz.q5b.sub", { n: answers.frequency ?? 0 })}>
          <ChoiceGrid>
            {WEEK_DAYS.map((day) => {
              const active = answers.trainingDays.includes(day);
              const full = answers.trainingDays.length >= (answers.frequency ?? 0) && !active;
              return (
                <Choice key={day} active={active} disabled={full} onClick={() => toggleList("trainingDays", day, answers.frequency)} multi>
                  {t(`day.${day}`)}
                </Choice>
              );
            })}
          </ChoiceGrid>
          <Button className="mt-3 w-full" disabled={answers.trainingDays.length !== answers.frequency} onClick={() => setStep("focus")}>{t("wiz.continue")}</Button>
        </Question>
      )}
      {step === "focus" && (
        <Question title={t("wiz.q6.title")} subtitle={t("wiz.q6.sub")}>
          <ChoiceGrid>
            {FOCUS.map((item) => (
              <Choice key={item} active={answers.focusAreas.includes(item)} onClick={() => toggleList("focusAreas", item)} multi>
                {t(`wiz.focus.${item}`)}
              </Choice>
            ))}
          </ChoiceGrid>
          {error && <p className="mt-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          <Button className="mt-3 w-full" onClick={buildPlan}>{t("wiz.generate")}</Button>
        </Question>
      )}
      {step === "generating" && (
        <Question title={t("wiz.building")} subtitle={t("wiz.building_sub")}>
          <div className="flex justify-center py-4"><Loader2 className="size-6 animate-spin text-brand" /></div>
        </Question>
      )}
      {step === "done" && plan && (
        <Question title={plan.name} subtitle={plan.split}>
          <div className="space-y-2 text-sm">
            {templates.slice(0, 4).map((tpl) => (
              <div key={tpl.id} className="rounded-xl border border-border bg-card/60 px-3 py-2">
                <div className="font-medium">{tpl.name}</div>
                <div className="text-xs text-muted-foreground">{tpl.exercises.length} {t("fit.tpl.ex_short")} · {tpl.exercises.reduce((sum, item) => sum + (Number(item.sets) || 0), 0)} {t("fit.tpl.sets_short")}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{plan.progressionNotes}</p>
          <AddGeneratedTemplatesButton
            templates={templates}
            plan={plan}
            summaries={summaries}
            threadId={threadId}
            onPersisted={onPersisted}
          />
        </Question>
      )}
    </div>
  );
}


function Question({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[92%] text-foreground">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Dumbbell className="size-4 text-brand" />{title}</div>
        {subtitle && <p className="mb-3 text-sm text-muted-foreground">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}

function ChoiceGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>;
}

function Choice({ active, disabled, multi, onClick, children }: { active?: boolean; disabled?: boolean; multi?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`relative min-h-11 rounded-xl border px-3 py-2.5 text-sm font-medium transition disabled:opacity-35 ${active ? "border-brand bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-accent"}`}
    >
      {children}
      {active && multi && <Check className="absolute right-2 top-2 size-3.5" />}
    </button>
  );
}

function AddGeneratedTemplatesButton({
  templates,
  plan,
  summaries,
  threadId,
  onPersisted,
}: {
  templates: WorkoutTemplate[];
  plan: WorkoutPlan;
  summaries: string[];
  threadId: string | null;
  onPersisted: (threadId: string) => void;
}) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const persist = useServerFn(appendWorkoutFlowMessages);
  const { templates: existing, loaded, upsert, remove } = useTemplates();
  const { save: saveTodayWorkout } = useTodayWorkout();
  const [pending, setPending] = useState<WorkoutTemplate[] | null>(null);
  const [added, setAdded] = useState(false);
  const [saving, setSaving] = useState(false);

  async function applyTemplates(tpls: WorkoutTemplate[], mode: "replace" | "add" | "skip") {
    if (mode === "skip") {
      setPending(null);
      return;
    }
    setSaving(true);
    try {
      if (mode === "replace") existing.forEach((tpl) => remove(tpl.id));
      tpls.forEach((tpl) => upsert(tpl));
      scheduleTodayFrom(tpls, saveTodayWorkout);

      const userText = `${t("chat.quick.workout")}\n\n${summaries.join(" · ")}`;
      const assistantLines = [
        `**${plan.name}** — ${plan.split}`,
        ...tpls.map((tpl) => `• ${tpl.name} (${tpl.exercises.length} ${t("fit.tpl.ex_short")})`),
        "",
        plan.progressionNotes,
        "",
        tpls.length === 1
          ? t("chat.addworkout.success_one")
          : t("chat.addworkout.success_many", { n: tpls.length }),
      ];
      try {
        const res = await persist({
          data: { threadId, userText, assistantText: assistantLines.join("\n"), title: plan.name },
        });
        onPersisted(res.threadId);
      } catch (err) {
        console.error("[workout-chat] persist failed", err);
      }

      toast.success(tpls.length === 1 ? t("chat.addworkout.success_one") : t("chat.addworkout.success_many", { n: tpls.length }));
      setPending(null);
      setAdded(true);
      setTimeout(() => navigate({ to: "/fitness" }), 400);
    } finally {
      setSaving(false);
    }
  }

  function handleAdd() {
    if (!loaded || templates.length === 0 || added || saving) return;
    if (existing.length === 0) void applyTemplates(templates, "add");
    else setPending(templates);
  }

  return (
    <>
      <Button
        className="mt-3 w-full"
        disabled={!loaded || templates.length === 0 || added || saving}
        onClick={handleAdd}
      >
        {saving ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <Dumbbell className="mr-2 size-4" />
        )}
        {added ? t("chat.addworkout.success_one") : t("chat.addworkout.cta")}
      </Button>
      <TemplateSyncDialog
        open={!!pending}
        count={pending?.length ?? 0}
        onChoose={(mode) => pending && void applyTemplates(pending, mode)}
      />
    </>
  );
}
