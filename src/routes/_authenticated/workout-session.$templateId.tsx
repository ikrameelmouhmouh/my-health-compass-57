import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Pause,
  Play,
  Plus,
  StickyNote,
  Timer,
  TrendingUp,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { localizeDayNames } from "@/lib/workout-today";
import {
  computeElapsedSec,
  formatDuration,
  playRestEndCue,
  previousBestFor,
  primeAudio,
  useActiveSession,
  vibrateShort,
  type FinishedSession,
} from "@/lib/workout-session";
import { SessionSummary } from "@/components/workout/session-summary";
import { ExerciseDetailSheet, ExerciseThumb } from "@/components/workout/exercise-detail-sheet";


export const Route = createFileRoute("/_authenticated/workout-session/$templateId")({
  component: SessionPage,
});

const REST_PRESETS = [30, 60, 90, 120, 180];

function SessionPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { session, loaded, update, pause, resume, finish, cancel } = useActiveSession();
  const [now, setNow] = useState(() => Date.now());
  const [summary, setSummary] = useState<FinishedSession | null>(null);
  const [detail, setDetail] = useState<{ name: string } | null>(null);


  // Rest timer state
  const [restEndAt, setRestEndAt] = useState<number | null>(null);
  const [restDuration, setRestDuration] = useState<number>(90);
  const restFiredRef = useRef(false);
  const [notesOpen, setNotesOpen] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Fire cue once when rest timer hits zero.
  useEffect(() => {
    if (restEndAt == null) return;
    if (now >= restEndAt && !restFiredRef.current) {
      restFiredRef.current = true;
      playRestEndCue();
    }
  }, [now, restEndAt]);

  const elapsed = useMemo(() => (session ? computeElapsedSec(session, now) : 0), [session, now]);
  const isPaused = !!session?.pausedAt;

  if (summary) {
    return <SessionSummary session={summary} onClose={() => navigate({ to: "/fitness" })} />;
  }

  if (!loaded) return <main className="min-h-[100dvh] bg-background" />;
  if (!session) {
    return (
      <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-background px-5 pb-32 pt-10">
        <p className="text-sm text-muted-foreground">{t("session.no_active")}</p>
        <Button className="mt-4 w-full" onClick={() => navigate({ to: "/fitness" })}>
          {t("session.back_to_fitness")}
        </Button>
      </main>
    );
  }

  function startRest(seconds: number) {
    restFiredRef.current = false;
    setRestDuration(seconds);
    setRestEndAt(Date.now() + seconds * 1000);
  }

  function clearRest() {
    restFiredRef.current = false;
    setRestEndAt(null);
  }

  function toggleSet(exIdx: number, setIdx: number) {
    primeAudio(); // unlock iOS audio while inside a user gesture
    let willComplete = false;
    update((s) => ({
      ...s,
      exercises: s.exercises.map((e, i) =>
        i !== exIdx
          ? e
          : {
              ...e,
              sets: e.sets.map((st, j) => {
                if (j !== setIdx) return st;
                willComplete = !st.done;
                return {
                  ...st,
                  done: !st.done,
                  completedAt: !st.done ? new Date().toISOString() : undefined,
                };
              }),
            },
      ),
    }));
    if (willComplete) {
      const rest = session?.exercises[exIdx]?.restSec ?? 90;
      vibrateShort();
      if (rest > 0) startRest(rest);
    }
  }

  function updateField(exIdx: number, setIdx: number, field: "weight" | "reps", value: number) {
    update((s) => ({
      ...s,
      exercises: s.exercises.map((e, i) =>
        i !== exIdx
          ? e
          : {
              ...e,
              sets: e.sets.map((st, j) => (j !== setIdx ? st : { ...st, [field]: value })),
            },
      ),
    }));
  }

  function addSet(exIdx: number) {
    update((s) => ({
      ...s,
      exercises: s.exercises.map((e, i) => {
        if (i !== exIdx) return e;
        const last = e.sets[e.sets.length - 1] ?? { weight: 0, reps: 10, done: false };
        return { ...e, sets: [...e.sets, { weight: last.weight, reps: last.reps, done: false }] };
      }),
    }));
  }

  function setExerciseRest(exIdx: number, sec: number) {
    update((s) => ({
      ...s,
      exercises: s.exercises.map((e, i) => (i !== exIdx ? e : { ...e, restSec: sec })),
    }));
  }

  function setExerciseNotes(exIdx: number, notes: string) {
    update((s) => ({
      ...s,
      exercises: s.exercises.map((e, i) => (i !== exIdx ? e : { ...e, notes })),
    }));
  }

  function setExerciseRPE(exIdx: number, rpe: number) {
    update((s) => ({
      ...s,
      exercises: s.exercises.map((e, i) => (i !== exIdx ? e : { ...e, rpe })),
    }));
  }

  function handleFinish() {
    if (!confirm(t("session.finish_confirm"))) return;
    const f = finish();
    if (f) setSummary(f);
    else navigate({ to: "/fitness" });
  }

  function handleCancel() {
    if (!confirm(t("session.cancel_confirm"))) return;
    cancel();
    navigate({ to: "/fitness" });
  }

  function togglePause() {
    if (isPaused) resume();
    else {
      pause();
      vibrateShort();
    }
  }

  const restRemaining = restEndAt ? Math.max(0, Math.round((restEndAt - now) / 1000)) : 0;
  const restProgress = restEndAt && restDuration > 0
    ? Math.min(1, Math.max(0, 1 - restRemaining / restDuration))
    : 0;
  void restProgress;

  const totalSets = session.exercises.reduce((n, e) => n + e.sets.length, 0);
  const doneSets = session.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0);
  const progressPct = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0;
  const nextExercise = session.exercises.find((e) => e.sets.some((s) => !s.done))?.name ?? null;


  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-background px-5 pb-40 pt-6">
      <div className="sticky top-0 z-20 -mx-5 flex items-center justify-between gap-2 border-b border-border bg-background/95 px-5 py-3 backdrop-blur">
        <button
          onClick={handleCancel}
          aria-label={t("common.close")}
          className="grid size-9 place-items-center rounded-full bg-card text-muted-foreground"
        >
          <X className="size-4" />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className={`font-display text-xl font-semibold tabular-nums leading-none ${isPaused ? "text-muted-foreground" : ""}`}>
            {formatDuration(elapsed)}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {isPaused ? t("session.paused") : localizeDayNames(session.templateName, t)}
          </p>
        </div>
        <button
          onClick={togglePause}
          aria-label={isPaused ? t("session.resume") : t("session.pause")}
          className={`grid size-9 place-items-center rounded-full ${isPaused ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}
        >
          {isPaused ? <Play className="size-4 fill-current" /> : <Pause className="size-4" />}
        </button>
        <Button size="sm" onClick={handleFinish} className="bg-primary text-primary-foreground">
          {t("session.finish")}
        </Button>
      </div>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{t("session.progress")}</span>
          <span className="font-medium tabular-nums">{doneSets}/{totalSets}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-card">
          <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${progressPct}%` }} />
        </div>
        {nextExercise && (
          <p className="mt-1.5 truncate text-[11px] text-muted-foreground">
            {t("session.next_up")}: {nextExercise}
          </p>
        )}
      </div>




      <div className="mt-5 space-y-5">
        {session.exercises.map((ex, exIdx) => {
          const prev = previousBestFor(ex.name, session.id);
          const open = !!notesOpen[exIdx];
          return (
            <div key={exIdx} className="rounded-2xl border border-border bg-card/60 p-3">
              <button
                type="button"
                onClick={() => setDetail({ name: ex.name })}
                className="flex w-full items-center gap-3 text-left"
              >
                <ExerciseThumb name={ex.name} className="size-11" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{ex.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {ex.equipment ?? "—"} · {ex.sets.length} {t("fit.tpl.sets_short")}
                  </p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </button>


              {prev && (
                <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <TrendingUp className="size-3" /> {t("session.last_time")}: {prev.weight} kg × {prev.reps}
                </p>
              )}

              <div className="mt-3 space-y-2">
                {ex.sets.map((st, setIdx) => (
                  <div key={setIdx} className="flex items-center gap-2">
                    <span className={`grid size-8 shrink-0 place-items-center rounded-full border text-xs font-semibold ${st.done ? "border-brand bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}>
                      {setIdx + 1}
                    </span>
                    <div className="flex flex-1 items-center gap-1.5">
                      <NumberInput
                        value={st.weight}
                        onChange={(v) => updateField(exIdx, setIdx, "weight", v)}
                        suffix="kg"
                        disabled={st.done}
                      />
                      <NumberInput
                        value={st.reps}
                        onChange={(v) => updateField(exIdx, setIdx, "reps", v)}
                        suffix={t("session.reps_short")}
                        disabled={st.done}
                        step={1}
                      />
                    </div>
                    <button
                      onClick={() => toggleSet(exIdx, setIdx)}
                      aria-label={t("session.mark_set")}
                      className={`grid size-9 shrink-0 place-items-center rounded-full ${st.done ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"}`}
                    >
                      {st.done ? <Check className="size-4" /> : <Play className="size-3.5 fill-current" />}
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => addSet(exIdx)}
                className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-border py-2 text-xs text-muted-foreground hover:bg-background"
              >
                <Plus className="size-3.5" /> {t("session.add_set")}
              </button>

              <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/60 pt-2.5">
                <div className="flex items-center gap-1.5">
                  <Timer className="size-3.5 text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">{t("session.rest")}</span>
                  <div className="ml-1 flex flex-wrap gap-1">
                    {REST_PRESETS.map((sec) => {
                      const active = (ex.restSec ?? 90) === sec;
                      return (
                        <button
                          key={sec}
                          onClick={() => {
                            primeAudio();
                            setExerciseRest(exIdx, sec);
                            startRest(sec);
                          }}
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${active ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground"}`}
                        >
                          {sec}s
                        </button>
                      );
                    })}
                  </div>
                </div>
                <button
                  onClick={() => setNotesOpen((o) => ({ ...o, [exIdx]: !o[exIdx] }))}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground"
                >
                  <StickyNote className="size-3.5" />
                  {t("session.notes")}
                  {open ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                </button>
              </div>

              {open && (
                <div className="mt-2 space-y-2 rounded-xl bg-background/60 p-2">
                  <textarea
                    value={ex.notes ?? ""}
                    onChange={(e) => setExerciseNotes(exIdx, e.target.value)}
                    placeholder={t("session.notes_placeholder")}
                    rows={2}
                    className="w-full resize-none rounded-lg border border-border bg-background px-2 py-1.5 text-xs outline-none"
                  />
                  <div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] text-muted-foreground">{t("session.rpe")}</span>
                      <span className="font-display text-sm font-semibold tabular-nums">{ex.rpe ?? "—"}</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      step={1}
                      value={ex.rpe ?? 5}
                      onChange={(e) => setExerciseRPE(exIdx, Number(e.target.value))}
                      className="mt-1 w-full accent-[var(--brand)]"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {restEndAt != null && (() => {
        const remaining = Math.max(0, Math.ceil((restEndAt - now) / 1000));
        const pct = Math.min(100, Math.max(0, ((restDuration - remaining) / restDuration) * 100));
        const done = remaining === 0;
        return (
          <div className={`fixed inset-x-0 z-30 mx-auto w-full max-w-md p-4 ${isPaused ? "bottom-20" : "bottom-0"}`}>
            <div className="overflow-hidden rounded-2xl border border-border bg-card/95 shadow-lg backdrop-blur">
              <div className="flex items-center gap-3 p-3">
                <Timer className="size-4 text-brand" />
                <p className="flex-1 text-sm font-medium tabular-nums">
                  {done ? t("session.rest_done") : `${t("session.rest")} · ${formatDuration(remaining)}`}
                </p>
                {!done && (
                  <button
                    onClick={() => setRestEndAt((v) => (v == null ? v : v + 15000))}
                    className="rounded-full border border-border px-2 py-1 text-[11px] font-semibold"
                  >
                    +15s
                  </button>
                )}
                <button
                  onClick={clearRest}
                  className="rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground"
                >
                  {done ? "OK" : t("session.skip_rest")}
                </button>
              </div>
              <div className="h-1 bg-background">
                <div
                  className="h-full bg-primary transition-[width] duration-500 ease-linear"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        );
      })()}

      {isPaused && (
        <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md p-4">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur">
            <Pause className="size-4 text-brand" />
            <p className="flex-1 text-sm">{t("session.paused_hint")}</p>
            <Button size="sm" onClick={togglePause} className="bg-primary text-primary-foreground">
              {t("session.resume")}
            </Button>
          </div>
        </div>
      )}

      {detail && (
        <ExerciseDetailSheet open onClose={() => setDetail(null)} name={detail.name} />
      )}
    </main>
  );
}

function NumberInput({
  value,
  onChange,
  suffix,
  disabled,
  step = 2.5,
}: {
  value: number;
  onChange: (v: number) => void;
  suffix: string;
  disabled?: boolean;
  step?: number;
}) {
  return (
    <div className={`flex flex-1 items-center justify-center rounded-lg border border-border bg-background px-2 py-2 ${disabled ? "opacity-70" : ""}`}>
      <input
        type="number"
        inputMode="decimal"
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        disabled={disabled}
        className="w-full bg-transparent text-center text-sm font-semibold outline-none"
      />
      <span className="ml-1 text-[10px] uppercase tracking-wider text-muted-foreground">{suffix}</span>
    </div>
  );
}
