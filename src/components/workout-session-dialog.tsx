import { useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { Check, Play, Pause, X, ChevronRight, Trophy, TrendingUp, Clock, Flame, Dumbbell, RotateCcw } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Exercise } from "@/lib/workout.functions";
import {
  startSession,
  logSet,
  finishSession,
  getLastSetsForExercise,
  type SessionSummary,
} from "@/lib/workout-session";
import { ExerciseProgressChart } from "./exercise-progress-chart";

type SetRow = {
  weight: string;
  reps: string;
  completed: boolean;
  startedAt?: number;
  completedAt?: number;
};

type ExState = {
  name: string;
  targetReps: string;
  targetRest: number;
  suggestedWeight?: string;
  sets: SetRow[];
  previous: { weight: number | null; reps: number | null }[];
};

function parseTargetReps(reps: string): string {
  return reps;
}

function fmtTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function fireConfetti() {
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, ticks: 200 });
}

export function WorkoutSessionDialog({
  open,
  onClose,
  workoutName,
  exercises,
  templateId,
}: {
  open: boolean;
  onClose: () => void;
  workoutName: string;
  exercises: Exercise[];
  templateId?: string;
}) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number>(0);
  const [state, setState] = useState<ExState[]>([]);
  const [now, setNow] = useState(Date.now());
  const [rest, setRest] = useState<{ until: number; duration: number } | null>(null);
  const [phase, setPhase] = useState<"loading" | "active" | "rpe" | "summary">("loading");
  const [rpe, setRpe] = useState<number>(7);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [showChart, setShowChart] = useState<string | null>(null);
  const initRef = useRef(false);

  // Init session
  useEffect(() => {
    if (!open) return;
    if (initRef.current) return;
    initRef.current = true;
    (async () => {
      try {
        const id = await startSession({ name: workoutName, templateId });
        setSessionId(id);
        setStartedAt(Date.now());
        const initialState: ExState[] = await Promise.all(
          exercises.map(async (ex) => {
            const last = await getLastSetsForExercise(ex.name);
            return {
              name: ex.name,
              targetReps: parseTargetReps(ex.reps),
              targetRest: ex.restSec ?? 90,
              suggestedWeight: ex.suggestedWeight,
              sets: Array.from({ length: ex.sets }, () => ({
                weight: "",
                reps: "",
                completed: false,
              })),
              previous: last.map((s) => ({ weight: Number(s.weight_kg ?? 0) || null, reps: Number(s.reps ?? 0) || null })),
            };
          }),
        );
        setState(initialState);
        setPhase("active");
      } catch (e) {
        toast.error("Kon sessie niet starten: " + (e as Error).message);
        onClose();
      }
    })();
  }, [open, workoutName, exercises, templateId, onClose]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      initRef.current = false;
      setSessionId(null);
      setState([]);
      setRest(null);
      setSummary(null);
      setPhase("loading");
      setRpe(7);
    }
  }, [open]);

  // Tick
  useEffect(() => {
    if (!open) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [open]);

  // Rest timer beep
  useEffect(() => {
    if (!rest) return;
    if (now >= rest.until && rest.until > 0) {
      try {
        const audio = new Audio(
          "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ==",
        );
        audio.play().catch(() => {});
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      } catch {}
      setRest(null);
      toast.success("Rust voorbij — volgende set!");
    }
  }, [now, rest]);

  const elapsed = phase === "active" ? Math.floor((now - startedAt) / 1000) : 0;
  const restLeft = rest ? Math.max(0, Math.ceil((rest.until - now) / 1000)) : 0;
  const restPct = rest ? Math.max(0, Math.min(100, ((rest.until - now) / 1000 / rest.duration) * 100)) : 0;

  const totalSets = state.reduce((s, e) => s + e.sets.length, 0);
  const completedSets = state.reduce((s, e) => s + e.sets.filter((x) => x.completed).length, 0);

  function updateSet(ei: number, si: number, patch: Partial<SetRow>) {
    setState((cur) => cur.map((e, i) => (i === ei ? { ...e, sets: e.sets.map((s, j) => (j === si ? { ...s, ...patch } : s)) } : e)));
  }

  function addSet(ei: number) {
    setState((cur) => cur.map((e, i) => (i === ei ? { ...e, sets: [...e.sets, { weight: "", reps: "", completed: false }] } : e)));
  }

  async function completeSet(ei: number, si: number) {
    const ex = state[ei];
    const set = ex.sets[si];
    if (!sessionId) return;
    const weight = parseFloat(set.weight.replace(",", "."));
    const reps = parseInt(set.reps, 10);
    if (isNaN(weight) || isNaN(reps)) {
      toast.error("Vul gewicht en herhalingen in");
      return;
    }
    try {
      const r = await logSet({
        sessionId,
        exerciseName: ex.name,
        setIndex: si + 1,
        weightKg: weight,
        reps,
        restSeconds: ex.targetRest,
      });
      updateSet(ei, si, { completed: true, completedAt: Date.now() });
      if (r.isPRWeight || r.isPRVolume || r.isPR1RM) {
        fireConfetti();
        const tags = [
          r.isPRWeight && "💪 Nieuw gewichtsrecord",
          r.isPR1RM && "🚀 Nieuwe 1RM",
          r.isPRVolume && "🔥 Volume PR",
        ].filter(Boolean);
        toast.success(`${ex.name}: ${tags.join(" · ")}`, { duration: 4000 });
      }
      // Auto rest
      setRest({ until: Date.now() + ex.targetRest * 1000, duration: ex.targetRest });
      if (navigator.vibrate) navigator.vibrate(40);
    } catch (e) {
      toast.error("Set opslaan mislukt: " + (e as Error).message);
    }
  }

  async function finish() {
    if (!sessionId) return;
    try {
      const sum = await finishSession({ sessionId, startedAt, rpe });
      setSummary(sum);
      setPhase("summary");
      if (sum.prCount > 0) setTimeout(fireConfetti, 200);
    } catch (e) {
      toast.error("Voltooien mislukt: " + (e as Error).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && phase !== "loading" && onClose()}>
      <DialogContent className="max-h-[100dvh] max-w-md gap-0 overflow-hidden p-0">
        {phase === "loading" && (
          <div className="flex h-[60dvh] items-center justify-center">
            <div className="text-sm text-muted-foreground">Sessie starten…</div>
          </div>
        )}

        {phase === "active" && (
          <div className="flex h-[100dvh] flex-col">
            {/* Header */}
            <div className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 pt-4 pb-3 backdrop-blur">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-2xl font-bold tabular-nums">{fmtTime(elapsed)}</p>
                  <p className="truncate text-xs text-muted-foreground">{workoutName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => setPhase("rpe")} className="rounded-full bg-orange-500/15 px-4 text-orange-600 hover:bg-orange-500/25">
                    Voltooi
                  </Button>
                  <button onClick={onClose} className="grid size-9 place-items-center rounded-full bg-muted">
                    <X className="size-4" />
                  </button>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-brand transition-all" style={{ width: `${totalSets ? (completedSets / totalSets) * 100 : 0}%` }} />
                </div>
                <span className="text-[11px] tabular-nums text-muted-foreground">{completedSets}/{totalSets}</span>
              </div>
            </div>

            {/* Exercises */}
            <div className="flex-1 overflow-y-auto px-4 py-3 pb-32">
              {state.map((ex, ei) => (
                <div key={ei} className="mb-4 rounded-2xl border border-border bg-card/40 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-tight">{ex.name}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Doel: {ex.targetReps} herh · rust {ex.targetRest}s
                      </p>
                    </div>
                    <button
                      onClick={() => setShowChart(showChart === ex.name ? null : ex.name)}
                      className="grid size-8 place-items-center rounded-full bg-background text-muted-foreground hover:text-foreground"
                      aria-label="Voortgang"
                    >
                      <TrendingUp className="size-4" />
                    </button>
                  </div>

                  {ex.previous.length > 0 && (
                    <div className="mt-2 flex items-center gap-1 rounded-lg bg-muted/40 px-2 py-1.5 text-[11px]">
                      <RotateCcw className="size-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Vorige sessie:</span>
                      <span className="font-medium">
                        {ex.previous.map((p, i) => `${p.weight ?? "-"}kg × ${p.reps ?? "-"}`).join(" · ")}
                      </span>
                    </div>
                  )}

                  {showChart === ex.name && (
                    <div className="mt-3 rounded-xl border border-border bg-background/50 p-2">
                      <ExerciseProgressChart exerciseName={ex.name} />
                    </div>
                  )}

                  {/* Set rows */}
                  <div className="mt-3 space-y-2">
                    {ex.sets.map((set, si) => {
                      const prev = ex.previous[si];
                      const wPlaceholder = prev?.weight != null ? String(prev.weight) : (ex.suggestedWeight?.match(/\d+/)?.[0] ?? "kg");
                      const rPlaceholder = prev?.reps != null ? String(prev.reps) : ex.targetReps.match(/\d+/)?.[0] ?? "reps";
                      return (
                        <div key={si} className={`flex items-center gap-2 rounded-xl border p-1.5 transition ${set.completed ? "border-emerald-500/40 bg-emerald-500/5" : "border-border"}`}>
                          <div className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold ${set.completed ? "bg-emerald-500/15 text-emerald-600" : "bg-muted"}`}>
                            {si + 1}
                          </div>
                          <input
                            inputMode="decimal"
                            value={set.weight}
                            placeholder={wPlaceholder}
                            disabled={set.completed}
                            onChange={(e) => updateSet(ei, si, { weight: e.target.value })}
                            className="w-full min-w-0 flex-1 rounded-lg bg-background px-3 py-2 text-center text-sm font-medium outline-none ring-1 ring-border focus:ring-brand disabled:opacity-70"
                          />
                          <span className="text-xs text-muted-foreground">kg</span>
                          <input
                            inputMode="numeric"
                            value={set.reps}
                            placeholder={rPlaceholder}
                            disabled={set.completed}
                            onChange={(e) => updateSet(ei, si, { reps: e.target.value })}
                            className="w-full min-w-0 flex-1 rounded-lg bg-background px-3 py-2 text-center text-sm font-medium outline-none ring-1 ring-border focus:ring-brand disabled:opacity-70"
                          />
                          <span className="text-xs text-muted-foreground">×</span>
                          <button
                            onClick={() => completeSet(ei, si)}
                            disabled={set.completed}
                            className={`grid size-9 shrink-0 place-items-center rounded-full transition ${set.completed ? "bg-emerald-500 text-white" : "bg-foreground text-background hover:scale-105"}`}
                          >
                            {set.completed ? <Check className="size-4" /> : <Play className="size-4 fill-current" />}
                          </button>
                        </div>
                      );
                    })}
                    <button
                      onClick={() => addSet(ei)}
                      className="w-full rounded-lg border border-dashed border-border py-2 text-xs text-muted-foreground hover:bg-muted/40"
                    >
                      + Voeg set toe
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Rest timer overlay */}
            {rest && restLeft > 0 && (
              <div className="absolute inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-brand" />
                    <span className="text-sm font-medium">Rust</span>
                  </div>
                  <span className="font-mono text-2xl font-bold tabular-nums">{fmtTime(restLeft)}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-brand transition-all" style={{ width: `${restPct}%` }} />
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => setRest((r) => (r ? { ...r, until: r.until - 15000 } : r))}
                    className="flex-1 rounded-full bg-muted py-1.5 text-xs font-medium"
                  >
                    -15s
                  </button>
                  <button
                    onClick={() => setRest(null)}
                    className="flex-1 rounded-full bg-muted py-1.5 text-xs font-medium"
                  >
                    Skip
                  </button>
                  <button
                    onClick={() => setRest((r) => (r ? { ...r, until: r.until + 15000 } : r))}
                    className="flex-1 rounded-full bg-muted py-1.5 text-xs font-medium"
                  >
                    +15s
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {phase === "rpe" && (
          <RpeScreen
            value={rpe}
            onChange={setRpe}
            onConfirm={finish}
            onBack={() => setPhase("active")}
          />
        )}

        {phase === "summary" && summary && (
          <SummaryScreen summary={summary} workoutName={workoutName} onClose={onClose} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function RpeScreen({ value, onChange, onConfirm, onBack }: { value: number; onChange: (v: number) => void; onConfirm: () => void; onBack: () => void }) {
  const labels: Record<number, { title: string; desc: string }> = {
    1: { title: "Heel makkelijk", desc: "Geen inspanning." },
    2: { title: "Makkelijk", desc: "Bijna geen inspanning." },
    3: { title: "Licht", desc: "Goed te doen, kort van adem." },
    4: { title: "Comfortabel", desc: "Je kunt nog praten." },
    5: { title: "Matig", desc: "Praten wordt lastiger." },
    6: { title: "Stevig", desc: "Korte zinnen mogelijk." },
    7: { title: "Vermoeiend", desc: "Inspannen; zware ademhaling." },
    8: { title: "Zwaar", desc: "Nog 2-3 reps in tank." },
    9: { title: "Heel zwaar", desc: "Nog 1 rep mogelijk." },
    10: { title: "Maximaal", desc: "Niets meer over." },
  };
  const cur = labels[value];

  return (
    <div className="flex h-[100dvh] flex-col bg-background">
      <div className="px-5 pt-6">
        <h2 className="text-center font-display text-2xl font-semibold">Hoe was de training?</h2>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="text-center">
          <div className="font-display text-7xl font-bold text-orange-500">{value}</div>
          <div className="mt-1 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span>1</span><span>10</span>
          </div>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="mt-6 w-full max-w-xs accent-orange-500"
        />
        <div className="mt-8 text-center">
          <p className="font-display text-xl font-semibold">{cur.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{cur.desc}</p>
        </div>
      </div>
      <div className="space-y-2 border-t border-border bg-background p-4">
        <Button size="lg" className="w-full" onClick={onConfirm}>
          Beëindig en sla training op
        </Button>
        <button onClick={onBack} className="w-full py-2 text-xs text-muted-foreground">Terug naar training</button>
      </div>
    </div>
  );
}

function SummaryScreen({ summary, workoutName, onClose }: { summary: SessionSummary; workoutName: string; onClose: () => void }) {
  return (
    <div className="flex h-[100dvh] flex-col overflow-y-auto bg-background">
      <div className="px-5 pt-8 pb-6 text-center">
        <div className="mx-auto mb-3 grid size-16 place-items-center rounded-full bg-brand/15 text-3xl">
          👏
        </div>
        <h2 className="font-display text-2xl font-semibold leading-tight">{workoutName}</h2>
        <p className="mt-1 text-xs text-muted-foreground">Net afgerond</p>
      </div>

      <div className="space-y-3 px-5">
        {summary.prCount > 0 && (
          <div className="flex items-center gap-3 rounded-2xl border border-brand/40 bg-brand/5 p-3">
            <Trophy className="size-5 text-brand" />
            <div className="text-sm">
              <p className="font-semibold">{summary.prCount} nieuwe record{summary.prCount > 1 ? "s" : ""}!</p>
              <p className="text-xs text-muted-foreground">Sterke sessie 🚀</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <BigStat label="Totale duur" value={fmtTime(summary.durationSec)} />
          <BigStat label="Actieve duur" value={fmtTime(summary.activeSec)} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <MetricCard icon={<Flame className="size-4 text-orange-500" />} label="Geschatte energie" value={`${Math.round((summary.activeSec / 60) * 6)} kcal`} />
          <MetricCard icon={<RotateCcw className="size-4 text-muted-foreground" />} label="Totaal herhalingen" value={String(summary.totalReps)} />
          <MetricCard icon={<Dumbbell className="size-4 text-muted-foreground" />} label="Totaal gewicht" value={`${Math.round(summary.totalVolumeKg).toLocaleString("nl-NL")} kg`} />
          <MetricCard icon={<Check className="size-4 text-emerald-500" />} label="Sets voltooid" value={String(summary.totalSets)} />
        </div>

        <div className="mt-2 rounded-2xl border border-border bg-card/40 p-3">
          <p className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">Per oefening</p>
          <div className="space-y-2">
            {summary.exercises.map((e, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-background/60 p-2 text-sm">
                <span className="truncate">{e.name}</span>
                <span className="text-xs text-muted-foreground">{e.sets} sets · {Math.round(e.volume)} kg · top {e.topWeight}kg</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 mt-6 space-y-2 border-t border-border bg-background p-4">
        <Button size="lg" className="w-full" onClick={onClose}>Gereed</Button>
      </div>
    </div>
  );
}

function BigStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card/40 p-3 text-center">
      <p className="font-display text-2xl font-bold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-3">
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-semibold tabular-nums">{value}</span>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
