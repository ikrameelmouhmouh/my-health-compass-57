import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Dumbbell, Clock, Trophy, ChevronRight } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { formatDuration } from "@/lib/workout-session";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export const Route = createFileRoute("/_authenticated/workout-history")({
  head: () => ({ meta: [{ title: "Workout history — Vita" }] }),
  component: WorkoutHistoryPage,
});

type SessionRow = {
  id: string;
  name: string | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  total_volume_kg: number | null;
  total_reps: number | null;
};

type SetRow = {
  exercise_name: string;
  set_index: number;
  weight_kg: number | null;
  reps: number | null;
  is_pr_weight: boolean | null;
  is_pr_volume: boolean | null;
};

function WorkoutHistoryPage() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["workout-history", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<SessionRow[]> => {
      const r = await supabase
        .from("workout_sessions")
        .select("id,name,started_at,ended_at,duration_seconds,total_volume_kg,total_reps")
        .eq("user_id", user!.id)
        .order("started_at", { ascending: false })
        .limit(200);
      return (r.data ?? []) as SessionRow[];
    },
  });

  const { data: detail } = useQuery({
    queryKey: ["workout-history-detail", openId],
    enabled: !!openId,
    queryFn: async (): Promise<SetRow[]> => {
      const r = await supabase
        .from("workout_sets")
        .select("exercise_name,set_index,weight_kg,reps,is_pr_weight,is_pr_volume")
        .eq("session_id", openId!)
        .order("set_index", { ascending: true });
      return (r.data ?? []) as SetRow[];
    },
  });

  const openSession = sessions.find((s) => s.id === openId) ?? null;

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-background px-5 pb-32 pt-8">
      <header className="flex items-center gap-3">
        <Link to="/fitness" className="grid size-9 place-items-center rounded-full border border-border" aria-label={t("hist.back")}>
          <ChevronLeft className="size-4" />
        </Link>
        <div className="min-w-0">
          <h1 className="font-display text-xl font-semibold tracking-tight">{t("hist.workouts")}</h1>
          <p className="text-[12px] text-muted-foreground">{t("hist.workouts_sub")}</p>
        </div>
      </header>

      <section className="mt-5 space-y-2">
        {isLoading && (
          <p className="py-10 text-center text-sm text-muted-foreground">…</p>
        )}
        {!isLoading && sessions.length === 0 && (
          <div className="mt-6 rounded-3xl border border-dashed border-border bg-card/50 p-8 text-center">
            <div className="mx-auto mb-2 grid size-12 place-items-center rounded-full bg-brand/15 text-brand">
              <Dumbbell className="size-5" />
            </div>
            <p className="text-sm font-semibold">{t("hist.empty")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("hist.empty_workouts_desc")}</p>
          </div>
        )}
        {sessions.map((s) => (
          <button
            key={s.id}
            onClick={() => setOpenId(s.id)}
            className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card/60 p-3 text-left transition hover:bg-card"
          >
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand">
              <Dumbbell className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{s.name ?? t("hist.untitled")}</p>
              <p className="text-[11px] text-muted-foreground">
                {fmtDate(s.started_at, lang)} · <Clock className="-mt-0.5 inline size-3" /> {formatDuration(s.duration_seconds ?? 0)} · {Math.round(Number(s.total_volume_kg ?? 0))} kg
              </p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground rtl:rotate-180" />
          </button>
        ))}
      </section>

      <Sheet open={!!openId} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{openSession?.name ?? t("hist.untitled")}</SheetTitle>
          </SheetHeader>
          {openSession && (
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              <Stat label={t("hist.duration")} value={formatDuration(openSession.duration_seconds ?? 0)} />
              <Stat label={t("hist.volume")} value={`${Math.round(Number(openSession.total_volume_kg ?? 0))} kg`} />
              <Stat label={t("hist.reps")} value={String(openSession.total_reps ?? 0)} />
            </div>
          )}
          <div className="mt-4 space-y-3">
            {(detail ?? []).reduce<Array<{ name: string; sets: SetRow[] }>>((acc, row) => {
              const last = acc[acc.length - 1];
              if (last && last.name === row.exercise_name) last.sets.push(row);
              else acc.push({ name: row.exercise_name, sets: [row] });
              return acc;
            }, []).map((ex) => (
              <div key={ex.name} className="rounded-2xl border border-border bg-card/50 p-3">
                <p className="text-sm font-semibold">{ex.name}</p>
                <ul className="mt-2 space-y-1 text-[12px]">
                  {ex.sets.map((s, i) => (
                    <li key={i} className="flex items-center justify-between rounded-lg bg-background/60 px-2 py-1">
                      <span className="text-muted-foreground">#{i + 1}</span>
                      <span className="tabular-nums">{Number(s.weight_kg ?? 0)} kg × {s.reps ?? 0}</span>
                      {(s.is_pr_weight || s.is_pr_volume) && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-500">
                          <Trophy className="size-3" /> PR
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {(detail ?? []).length === 0 && (
              <p className="py-6 text-center text-xs text-muted-foreground">{t("hist.no_sets")}</p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/50 p-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

const LOCALE_MAP: Record<string, string> = {
  en: "en-US", nl: "nl-NL", ar: "ar", fr: "fr-FR", de: "de-DE", es: "es-ES",
};

function fmtDate(iso: string, lang: string) {
  return new Date(iso).toLocaleDateString(LOCALE_MAP[lang] ?? undefined, {
    weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}
