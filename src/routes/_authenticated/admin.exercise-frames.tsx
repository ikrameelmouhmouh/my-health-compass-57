import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { EXERCISES } from "@/lib/exercise-library";
import { getCameraHint, hasExplicitCameraHint } from "@/lib/exercise-camera-hints";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, CheckCircle2, XCircle, Loader2, Shield, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/exercise-frames")({
  head: () => ({ meta: [{ title: "Exercise frames — Admin" }] }),
  component: AdminExerciseFramesPage,
});

type JobRow = { exercise_id: string; status: "pending" | "done" | "failed" | "bad"; error: string | null; updated_at: string };

function AdminExerciseFramesPage() {
  const { session, user } = useAuth();
  const qc = useQueryClient();

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

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-2xl bg-background px-5 pb-32 pt-8">
      <header className="flex items-center gap-3">
        <Shield className="size-5 text-brand" />
        <div className="min-w-0">
          <h1 className="font-display text-xl font-semibold tracking-tight">Oefening-afbeeldingen</h1>
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
      </div>

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
          const url0 = `/api/exercise-frame/${encodeURIComponent(ex.id)}/0`;
          const url1 = `/api/exercise-frame/${encodeURIComponent(ex.id)}/1`;
          const hint = getCameraHint(ex.id, ex.equipment, ex.name);
          const explicit = hasExplicitCameraHint(ex.id);
          return (
            <li key={ex.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card/50 p-2.5">
              <div className="flex shrink-0 gap-1">
                {status === "done" ? (
                  <>
                    <img src={url0} alt="" className="size-14 rounded-lg object-cover" />
                    <img src={url1} alt="" className="size-14 rounded-lg object-cover" />
                  </>
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
              </div>
              <div className="flex shrink-0 gap-1">
                {status === "done" ? (
                  <button
                    title="Markeer als slecht"
                    onClick={async () => {
                      await supabase.from("exercise_frame_jobs").upsert({ exercise_id: ex.id, status: "bad" });
                      qc.invalidateQueries({ queryKey: ["exercise-frame-jobs"] });
                    }}
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
    </main>
  );
}
