import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Activity as ActivityIcon, Clock, Flame, ChevronRight } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { formatTimer } from "@/lib/activity-session";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export const Route = createFileRoute("/_authenticated/activity-history")({
  head: () => ({ meta: [{ title: "Activity history — Vita" }] }),
  component: ActivityHistoryPage,
});

type Row = {
  id: string;
  activity_id: string;
  activity_name: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  paused_seconds: number | null;
  kcal: number | null;
  distance_m: number | null;
  notes: string | null;
};

function ActivityHistoryPage() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["activity-history", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Row[]> => {
      const r = await supabase
        .from("activity_sessions")
        .select("id,activity_id,activity_name,started_at,ended_at,duration_seconds,paused_seconds,kcal,distance_m,notes")
        .eq("user_id", user!.id)
        .order("started_at", { ascending: false })
        .limit(200);
      return (r.data ?? []) as Row[];
    },
  });

  const open = sessions.find((s) => s.id === openId) ?? null;

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-background px-5 pb-32 pt-8">
      <header className="flex items-center gap-3">
        <Link to="/fitness" className="grid size-9 place-items-center rounded-full border border-border" aria-label={t("hist.back")}>
          <ChevronLeft className="size-4" />
        </Link>
        <div className="min-w-0">
          <h1 className="font-display text-xl font-semibold tracking-tight">{t("hist.activities")}</h1>
          <p className="text-[12px] text-muted-foreground">{t("hist.activities_sub")}</p>
        </div>
      </header>

      <section className="mt-5 space-y-2">
        {isLoading && (
          <p className="py-10 text-center text-sm text-muted-foreground">{t("common.loading")}</p>
        )}
        {!isLoading && sessions.length === 0 && (
          <div className="mt-6 rounded-3xl border border-dashed border-border bg-card/50 p-8 text-center">
            <div className="mx-auto mb-2 grid size-12 place-items-center rounded-full bg-brand/15 text-brand">
              <ActivityIcon className="size-5" />
            </div>
            <p className="text-sm font-semibold">{t("hist.empty")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("hist.empty_act_desc")}</p>
          </div>
        )}
        {sessions.map((s) => (
          <button
            key={s.id}
            onClick={() => setOpenId(s.id)}
            className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card/60 p-3 text-left transition hover:bg-card"
          >
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand">
              <ActivityIcon className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{s.activity_name}</p>
              <p className="text-[11px] text-muted-foreground">
                {fmtDate(s.started_at, lang)} · <Clock className="-mt-0.5 inline size-3" /> {formatTimer(s.duration_seconds ?? 0)}
                {s.kcal ? <> · <Flame className="-mt-0.5 inline size-3" /> {Math.round(Number(s.kcal))} kcal</> : null}
              </p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground rtl:rotate-180" />
          </button>
        ))}
      </section>

      <Sheet open={!!openId} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{open?.activity_name}</SheetTitle>
          </SheetHeader>
          {open && (
            <>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                <Stat label={t("hist.duration")} value={formatTimer(open.duration_seconds ?? 0)} />
                <Stat label={t("hist.kcal")} value={open.kcal ? String(Math.round(Number(open.kcal))) : "—"} />
                <Stat label={t("hist.paused")} value={formatTimer(open.paused_seconds ?? 0)} />
              </div>
              {open.distance_m != null && (
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  {(Number(open.distance_m) / 1000).toFixed(2)} km
                </p>
              )}
              {open.notes && (
                <div className="mt-4 rounded-2xl border border-border bg-card/50 p-3 text-sm">{open.notes}</div>
              )}
              <p className="mt-4 text-center text-[11px] text-muted-foreground">{fmtDate(open.started_at, lang)}</p>
            </>
          )}
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
