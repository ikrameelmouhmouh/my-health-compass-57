import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { EXERCISES } from "@/lib/exercise-library";
import { getCameraHint, hasExplicitCameraHint } from "@/lib/exercise-camera-hints";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { useT } from "@/lib/i18n";
import { RefreshCw, CheckCircle2, XCircle, Loader2, Shield, Search, RotateCcw, ChevronLeft, ChevronRight, Play, Pause, MessageSquareWarning, X } from "lucide-react";


type FilmSpeed = "slow" | "normal" | "fast";

const SPEED_MS: Record<FilmSpeed, number> = {
  slow: 1500,
  normal: 800,
  fast: 400,
};

export const Route = createFileRoute("/_authenticated/admin/exercise-frames")({
  head: () => ({
    meta: [
      { title: "Alyva Edit workout pagina" },
      { name: "description", content: "Reset and regenerate Alyva exercise motion frames with locked camera guidance." },
      { property: "og:title", content: "Alyva Edit workout pagina" },
      { property: "og:description", content: "Reset and regenerate Alyva exercise motion frames with locked camera guidance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminExerciseFramesPage,
});

type JobRow = { exercise_id: string; status: "pending" | "done" | "failed" | "bad"; error: string | null; updated_at: string; feedback: string | null };

function AdminExerciseFramesPage() {
  const { session, user } = useAuth();
  const qc = useQueryClient();
  const t = useT();

  const roleQ = useQuery({
    queryKey: ["user-role", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user!.id).eq("role", "admin").maybeSingle();
      return !!data;
    },
  });

  const jobsQ = useQuery({
    queryKey: ["exercise-frame-jobs", "all"],
    enabled: roleQ.data === true,
    queryFn: async (): Promise<JobRow[]> => {
      const { data } = await supabase.from("exercise_frame_jobs").select("*").order("updated_at", { ascending: false });
      return (data ?? []) as JobRow[];
    },
    refetchInterval: 5000,
  });

  const bootstrap = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/bootstrap-admin", {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-role"] }),
  });

  const [filter, setFilter] = useState<"all" | "pending" | "done" | "failed" | "bad">("all");
  const [q, setQ] = useState("");
  const [running, setRunning] = useState(false);
  const [filmMode, setFilmMode] = useState(false);
  const [filmSpeed, setFilmSpeed] = useState<FilmSpeed>("normal");
  const [lightbox, setLightbox] = useState<{ exerciseId: string; frameIndex: 0 | 1 } | null>(null);
  const [feedbackTarget, setFeedbackTarget] = useState<{ exerciseId: string; exerciseName: string; current: string } | null>(null);


  const jobsById = useMemo(() => {
    const m = new Map<string, JobRow>();
    for (const j of jobsQ.data ?? []) m.set(j.exercise_id, j);
    return m;
  }, [jobsQ.data]);

  const doneCount = (jobsQ.data ?? []).filter((j) => j.status === "done").length;
  const failedCount = (jobsQ.data ?? []).filter((j) => j.status === "failed").length;
  const total = EXERCISES.length;

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return EXERCISES
      .map((ex) => ({ ex, job: jobsById.get(ex.id) }))
      .filter(({ ex, job }) => {
        if (filter === "pending" && (job?.status === "done" || job?.status === "failed")) return false;
        if (filter === "done" && job?.status !== "done") return false;
        if (filter === "failed" && job?.status !== "failed") return false;
        if (filter === "bad" && job?.status !== "bad") return false;
        if (needle && !ex.name.toLowerCase().includes(needle) && !ex.id.toLowerCase().includes(needle)) return false;
        return true;
      });
  }, [filter, q, jobsById]);

  async function runBatch(ids: string[], force: boolean) {
    if (ids.length === 0) return;
    setRunning(true);
    try {
      const exerciseData = Object.fromEntries(
        ids.map((id) => {
          const ex = EXERCISES.find((e) => e.id === id);
          return [id, { name: ex?.name, equipment: ex?.equipment }];
        }),
      );
      // Split into chunks of 20 for the endpoint.
      for (let i = 0; i < ids.length; i += 20) {
        const chunk = ids.slice(i, i + 20);
        const chunkData = Object.fromEntries(chunk.map((id) => [id, exerciseData[id]]));
        const res = await fetch("/api/admin/generate-exercise-frames", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
          body: JSON.stringify({ ids: chunk, force, exerciseData: chunkData }),
        });
        if (!res.ok) throw new Error(await res.text());
        await qc.invalidateQueries({ queryKey: ["exercise-frame-jobs"] });
      }
    } catch (e) {
      alert(`Fout: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setRunning(false);
    }
  }

  async function resetJobs(ids: string[], scope: "visible" | "all") {
    if (ids.length === 0) return;
    const message = scope === "all" ? t("admin.frames.reset_confirm_all", { n: ids.length }) : t("admin.frames.reset_confirm_visible", { n: ids.length });
    if (!window.confirm(message)) return;
    setRunning(true);
    try {
      for (let i = 0; i < ids.length; i += 500) {
        const chunk = ids.slice(i, i + 500);
        const res = await fetch("/api/admin/generate-exercise-frames", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
          body: JSON.stringify({ action: "reset", ids: chunk }),
        });
        if (!res.ok) throw new Error(await res.text());
      }
      await qc.invalidateQueries({ queryKey: ["exercise-frame-jobs"] });
      alert(t("admin.frames.reset_done"));
    } catch (e) {
      alert(`Fout: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setRunning(false);
    }
  }

  if (roleQ.isLoading) {
    return <div className="grid min-h-[100dvh] place-items-center"><Loader2 className="size-6 animate-spin" /></div>;
  }

  if (roleQ.data === false) {
    return (
      <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <Shield className="size-10 text-brand" />
        <h1 className="font-display text-2xl font-semibold">Admin-toegang vereist</h1>
        <p className="text-sm text-muted-foreground">
          Deze pagina is alleen voor beheerders. Als er nog geen admin is, kan de eerste gebruiker die op onderstaande knop klikt zichzelf tot admin promoveren.
        </p>
        <Button onClick={() => bootstrap.mutate()} disabled={bootstrap.isPending}>
          {bootstrap.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          Maak mij admin
        </Button>
        {bootstrap.error ? <p className="text-xs text-destructive">{String(bootstrap.error)}</p> : null}
      </main>
    );
  }

  const pendingIds = (rows.filter(({ job }) => !job || job.status === "pending" || job.status === "failed" || job.status === "bad")).map(({ ex }) => ex.id);
  const visibleIds = rows.map(({ ex }) => ex.id);
  const allIds = EXERCISES.map((ex) => ex.id);

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-2xl bg-background px-5 pb-32 pt-8">
      <header className="flex items-center gap-3">
        <Shield className="size-5 text-brand" />
        <div className="min-w-0">
          <h1 className="font-display text-xl font-semibold tracking-tight">{t("admin.frames.page_title")}</h1>
          <p className="text-[12px] text-muted-foreground">
            {doneCount} van {total} klaar · {failedCount} mislukt
          </p>
        </div>
      </header>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-brand transition-all" style={{ width: `${(doneCount / Math.max(1, total)) * 100}%` }} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() => runBatch(pendingIds.slice(0, 20), false)}
          disabled={running || pendingIds.length === 0}
        >
          {running ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          Genereer volgende 20
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => runBatch(pendingIds, false)}
          disabled={running || pendingIds.length === 0}
        >
          Alles resterend ({pendingIds.length})
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => resetJobs(visibleIds, "visible")}
          disabled={running || visibleIds.length === 0}
        >
          <RotateCcw className="mr-2 size-4" />
          {t("admin.frames.reset_visible", { n: visibleIds.length })}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => resetJobs(allIds, "all")}
          disabled={running || allIds.length === 0}
        >
          <RotateCcw className="mr-2 size-4" />
          {t("admin.frames.reset_all")}
        </Button>
        <Button
          size="sm"
          variant={filmMode ? "default" : "outline"}
          onClick={() => setFilmMode((v) => !v)}
          disabled={running}
        >
          {filmMode ? <Pause className="mr-2 size-4" /> : <Play className="mr-2 size-4" />}
          {filmMode ? t("admin.frames.film_stop") : t("admin.frames.film_play")}
        </Button>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">{t("admin.frames.reset_hint")}</p>
      {filmMode ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-muted-foreground">{t("admin.frames.film_speed_label")}</span>
          {(["slow", "normal", "fast"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilmSpeed(s)}
              className={`rounded-full px-2.5 py-1 text-[11px] transition ${
                filmSpeed === s
                  ? "bg-brand text-white"
                  : "border border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {t(`admin.frames.film_speed_${s}`)}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {(["all", "pending", "done", "failed", "bad"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`rounded-full border px-3 py-1 text-xs transition ${filter === k ? "border-brand bg-brand/15 text-brand" : "border-border text-muted-foreground"}`}
          >
            {k === "all" ? "Alle" : k === "pending" ? "Nog te doen" : k === "done" ? "Klaar" : k === "failed" ? "Mislukt" : "Slecht"}
          </button>
        ))}
      </div>

      <div className="relative mt-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Zoek oefening…" className="pl-9" />
      </div>

      <ul className="mt-4 space-y-2">
        {rows.map(({ ex, job }) => {
          const status = job?.status ?? "pending";
          const v = job?.updated_at ? `?v=${encodeURIComponent(job.updated_at)}` : "";
          const url0 = `/api/exercise-frame/${encodeURIComponent(ex.id)}/0${v}`;
          const url1 = `/api/exercise-frame/${encodeURIComponent(ex.id)}/1${v}`;
          const hint = getCameraHint(ex.id, ex.equipment, ex.name);
          const explicit = hasExplicitCameraHint(ex.id);
          return (
            <li key={ex.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card/50 p-2.5">
              <div className="flex shrink-0 gap-1">
                {status === "done" ? (
                  filmMode ? (
                    <button
                      type="button"
                      aria-label={t("admin.frames.lightbox.zoom_film")}
                      onClick={() => setLightbox({ exerciseId: ex.id, frameIndex: 0 })}
                      className="relative h-14 w-[118px] cursor-pointer overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
                    >
                      <FrameAnimation url0={url0} url1={url1} speed={filmSpeed} />
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        aria-label={t("admin.frames.lightbox.zoom_frame_1")}
                        onClick={() => setLightbox({ exerciseId: ex.id, frameIndex: 0 })}
                        className="cursor-pointer overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
                      >
                        <img src={url0} alt="" className="size-14 rounded-lg object-cover transition hover:opacity-90" />
                      </button>
                      <button
                        type="button"
                        aria-label={t("admin.frames.lightbox.zoom_frame_2")}
                        onClick={() => setLightbox({ exerciseId: ex.id, frameIndex: 1 })}
                        className="cursor-pointer overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
                      >
                        <img src={url1} alt="" className="size-14 rounded-lg object-cover transition hover:opacity-90" />
                      </button>
                    </>
                  )
                ) : (
                  <div className="grid size-14 place-items-center rounded-lg bg-muted text-[10px] text-muted-foreground">
                    {status === "failed" ? <XCircle className="size-5 text-destructive" /> : status === "bad" ? "slecht" : "…"}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{ex.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {ex.equipment} · {status}
                  {explicit ? " · expliciet" : " · fallback"}
                </p>
                <p className="truncate text-[11px] text-muted-foreground/80" title={hint.label}>
                  {hint.label}
                </p>
                {job?.error ? <p className="truncate text-[11px] text-destructive">{job.error.slice(0, 60)}</p> : null}
                {job?.feedback ? (
                  <div className="mt-1 flex items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[11px] text-amber-700 dark:text-amber-400">
                    <MessageSquareWarning className="size-3 shrink-0" />
                    <span className="truncate" title={job.feedback}>
                      <span className="font-medium">{t("admin.frames.feedback.badge_prefix")}</span> {job.feedback}
                    </span>
                    <button
                      type="button"
                      title={t("admin.frames.feedback.clear")}
                      onClick={async () => {
                        await supabase.from("exercise_frame_jobs").upsert({ exercise_id: ex.id, feedback: null });
                        qc.invalidateQueries({ queryKey: ["exercise-frame-jobs"] });
                      }}
                      className="grid size-4 shrink-0 place-items-center rounded-full hover:bg-amber-500/20"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ) : null}
              </div>
              <div className="flex shrink-0 gap-1">
                {status === "done" ? (
                  <button
                    title="Markeer als slecht"
                    onClick={() => setFeedbackTarget({ exerciseId: ex.id, exerciseName: ex.name, current: job?.feedback ?? "" })}
                    className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted"
                  >
                    <XCircle className="size-4" />
                  </button>
                ) : null}

                <button
                  title="Genereer opnieuw"
                  onClick={() => runBatch([ex.id], true)}
                  disabled={running}
                  className="grid size-8 place-items-center rounded-full text-brand hover:bg-brand/15 disabled:opacity-50"
                >
                  <RefreshCw className="size-4" />
                </button>
                {status === "done" ? <CheckCircle2 className="size-4 text-green-500" /> : null}
              </div>
            </li>
          );
        })}
      </ul>

      <Lightbox value={lightbox} onChange={setLightbox} filmMode={filmMode} filmSpeed={filmSpeed} onSpeedChange={setFilmSpeed} versions={jobsById} />
    </main>
  );
}

function FrameAnimation({
  url0,
  url1,
  speed = "normal",
  playing = true,
}: {
  url0: string;
  url1: string;
  speed?: FilmSpeed;
  playing?: boolean;
}) {
  const [frame, setFrame] = useState<0 | 1>(0);
  const transitionMs = Math.min(SPEED_MS[speed] * 0.5, 600);

  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      setFrame((f) => (f === 0 ? 1 : 0));
    }, SPEED_MS[speed]);
    return () => clearInterval(interval);
  }, [playing, speed]);

  return (
    <div className="relative h-full w-full">
      <img
        src={url0}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{ opacity: frame === 0 ? 1 : 0, transition: `opacity ${transitionMs}ms ease-in-out` }}
      />
      <img
        src={url1}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{ opacity: frame === 1 ? 1 : 0, transition: `opacity ${transitionMs}ms ease-in-out` }}
      />
    </div>
  );
}

function Lightbox({
  value,
  onChange,
  filmMode,
  filmSpeed,
  onSpeedChange,
  versions,
}: {
  value: { exerciseId: string; frameIndex: 0 | 1 } | null;
  onChange: (v: { exerciseId: string; frameIndex: 0 | 1 } | null) => void;
  filmMode: boolean;
  filmSpeed: FilmSpeed;
  onSpeedChange: (s: FilmSpeed) => void;
  versions: Map<string, { updated_at: string }>;
}) {
  const t = useT();
  const exercise = useMemo(() => EXERCISES.find((e) => e.id === value?.exerciseId), [value?.exerciseId]);
  const frameIndex = value?.frameIndex ?? 0;
  const [playing, setPlaying] = useState(false);
  const currentFrameRef = useRef<0 | 1>(frameIndex);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    currentFrameRef.current = frameIndex;
  }, [frameIndex]);

  useEffect(() => {
    if (value) setPlaying(filmMode);
    // Only re-sync playing state on exercise switch or filmMode toggle,
    // NOT on every frame tick (which changes `value`).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.exerciseId, filmMode]);

  useEffect(() => {
    if (!playing || !value) return;
    const exerciseId = value.exerciseId;
    const interval = setInterval(() => {
      const next: 0 | 1 = currentFrameRef.current === 0 ? 1 : 0;
      currentFrameRef.current = next;
      onChangeRef.current({ exerciseId, frameIndex: next });
    }, SPEED_MS[filmSpeed]);
    return () => clearInterval(interval);
  }, [playing, filmSpeed, value?.exerciseId]);

  useEffect(() => {
    if (!value) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setPlaying(false);
        onChange({ exerciseId: value.exerciseId, frameIndex: 0 });
      } else if (e.key === "ArrowRight") {
        setPlaying(false);
        onChange({ exerciseId: value.exerciseId, frameIndex: 1 });
      } else if (e.key === "Escape") {
        onChange(null);
      } else if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [value, onChange]);

  if (!exercise || !value) return null;

  const jobVersion = value?.exerciseId ? versions.get(value.exerciseId)?.updated_at : undefined;
  const v = jobVersion ? `?v=${encodeURIComponent(jobVersion)}` : "";
  const url0 = `/api/exercise-frame/${encodeURIComponent(exercise.id)}/0${v}`;
  const url1 = `/api/exercise-frame/${encodeURIComponent(exercise.id)}/1${v}`;
  const transitionMs = Math.min(SPEED_MS[filmSpeed] * 0.5, 600);

  return (
    <Dialog open={!!value} onOpenChange={(open) => !open && onChange(null)}>
      <DialogContent
        hideClose
        className="max-w-[95vw] max-h-[95vh] w-auto border-0 bg-transparent p-0 shadow-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
      >
        <DialogTitle className="sr-only">{exercise.name}</DialogTitle>
        <div className="relative flex items-center justify-center">
          <button
            type="button"
            aria-label={t("admin.frames.lightbox.previous")}
            onClick={() => {
              setPlaying(false);
              onChange({ exerciseId: exercise.id, frameIndex: 0 });
            }}
            disabled={frameIndex === 0 && !playing}
            className="absolute left-2 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70 disabled:opacity-30 sm:left-4"
          >
            <ChevronLeft className="size-6" />
          </button>

          <div className="relative max-h-[85vh] max-w-[90vw]">
            <img
              src={url0}
              alt={`${exercise.name} frame 1`}
              className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
              style={{ opacity: frameIndex === 0 ? 1 : 0, transition: `opacity ${transitionMs}ms ease-in-out` }}
            />
            <img
              src={url1}
              alt={`${exercise.name} frame 2`}
              className="absolute left-0 top-0 max-h-[85vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
              style={{ opacity: frameIndex === 1 ? 1 : 0, transition: `opacity ${transitionMs}ms ease-in-out` }}
            />
          </div>

          <button
            type="button"
            aria-label={t("admin.frames.lightbox.next")}
            onClick={() => {
              setPlaying(false);
              onChange({ exerciseId: exercise.id, frameIndex: 1 });
            }}
            disabled={frameIndex === 1 && !playing}
            className="absolute right-2 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70 disabled:opacity-30 sm:right-4"
          >
            <ChevronRight className="size-6" />
          </button>

          <button
            type="button"
            aria-label={t("admin.frames.lightbox.close")}
            onClick={() => onChange(null)}
            className="absolute right-2 top-2 z-10 grid size-10 place-items-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70 sm:right-4 sm:top-4"
          >
            <XCircle className="size-6" />
          </button>
        </div>

        <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded-full bg-black/60 px-4 py-2 text-sm text-white backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="grid size-7 place-items-center rounded-full bg-white/20 hover:bg-white/30"
            aria-label={playing ? t("admin.frames.film_stop") : t("admin.frames.film_play")}
          >
            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          </button>
          <div className="text-center">
            <p className="font-semibold">{exercise.name}</p>
            <p className="text-xs opacity-80">{t("admin.frames.lightbox.frame_of", { current: frameIndex + 1, total: 2 })}</p>
          </div>
          <div className="flex gap-1">
            {(["slow", "normal", "fast"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSpeedChange(s)}
                className={`rounded-full px-2 py-0.5 text-[10px] transition ${
                  filmSpeed === s ? "bg-white/40 text-white" : "bg-white/20 text-white/80 hover:bg-white/30"
                }`}
              >
                {t(`admin.frames.film_speed_${s}`)}
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
