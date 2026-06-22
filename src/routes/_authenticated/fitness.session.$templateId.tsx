import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, MoreHorizontal, Play, Plus, X, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import {
  formatDuration,
  previousBestFor,
  useActiveSession,
  type FinishedSession,
} from "@/lib/workout-session";
import { SessionSummary } from "@/components/workout/session-summary";

export const Route = createFileRoute("/_authenticated/fitness/session/$templateId")({
  component: SessionPage,
});

function SessionPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { session, loaded, update, finish, cancel } = useActiveSession();
  const [now, setNow] = useState(() => Date.now());
  const [summary, setSummary] = useState<FinishedSession | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const elapsed = useMemo(() => {
    if (!session) return 0;
    return Math.max(0, Math.round((now - new Date(session.startedAt).getTime()) / 1000));
  }, [session, now]);

  if (summary) {
    return (
      <SessionSummary
        session={summary}
        onClose={() => navigate({ to: "/fitness" })}
      />
    );
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

  function toggleSet(exIdx: number, setIdx: number) {
    update((s) => ({
      ...s,
      exercises: s.exercises.map((e, i) =>
        i !== exIdx
          ? e
          : {
              ...e,
              sets: e.sets.map((st, j) =>
                j !== setIdx
                  ? st
                  : { ...st, done: !st.done, completedAt: !st.done ? new Date().toISOString() : undefined },
              ),
            },
      ),
    }));
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

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-background px-5 pb-32 pt-6">
      <div className="sticky top-0 z-20 -mx-5 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-5 py-3 backdrop-blur">
        <button
          onClick={handleCancel}
          aria-label={t("common.close")}
          className="grid size-9 place-items-center rounded-full bg-card text-muted-foreground"
        >
          <X className="size-4" />
        </button>
        <div className="min-w-0 text-center">
          <p className="font-display text-xl font-semibold tabular-nums leading-none">{formatDuration(elapsed)}</p>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{session.templateName}</p>
        </div>
        <Button size="sm" onClick={handleFinish} className="bg-brand text-brand-foreground">
          {t("session.finish")}
        </Button>
      </div>

      <div className="mt-5 space-y-5">
        {session.exercises.map((ex, exIdx) => {
          const prev = previousBestFor(ex.name, session.id);
          return (
            <div key={exIdx} className="rounded-2xl border border-border bg-card/60 p-3">
              <div className="flex items-center gap-3">
                <div className="size-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {ex.image && <img src={ex.image} alt="" className="size-full object-cover" loading="lazy" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{ex.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {ex.equipment ?? "—"} · {ex.sets.length} {t("fit.tpl.sets_short")}
                  </p>
                </div>
                <button className="grid size-8 place-items-center rounded-full text-muted-foreground" aria-label="more">
                  <MoreHorizontal className="size-4" />
                </button>
              </div>

              {prev && (
                <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <TrendingUp className="size-3" /> {t("session.last_time")}: {prev.weight} kg × {prev.reps}
                </p>
              )}

              <div className="mt-3 space-y-2">
                {ex.sets.map((st, setIdx) => (
                  <div key={setIdx} className="flex items-center gap-2">
                    <span className={`grid size-8 shrink-0 place-items-center rounded-full border text-xs font-semibold ${st.done ? "border-brand bg-brand text-brand-foreground" : "border-border text-muted-foreground"}`}>
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
                      className={`grid size-9 shrink-0 place-items-center rounded-full ${st.done ? "bg-brand text-brand-foreground" : "border border-border text-muted-foreground"}`}
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
            </div>
          );
        })}
      </div>
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
