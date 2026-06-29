import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Scale, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import { useWeightLog } from "@/lib/dashboard-prefs";

export const Route = createFileRoute("/_authenticated/weight-history")({
  head: () => ({ meta: [{ title: "Weight history — Vita" }] }),
  component: WeightHistoryPage,
});

function WeightHistoryPage() {
  const { t, lang } = useI18n();
  const { log } = useWeightLog();

  const rows = useMemo(() => {
    // Show newest first with diff vs previous entry (chronologically older)
    const sorted = [...log].sort((a, b) => a.date.localeCompare(b.date));
    const enriched = sorted.map((e, i) => ({
      ...e,
      diff: i === 0 ? 0 : e.kg - sorted[i - 1].kg,
    }));
    return enriched.reverse();
  }, [log]);

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-background px-5 pb-32 pt-8">
      <header className="flex items-center gap-3">
        <Link to="/weight" className="grid size-9 place-items-center rounded-full border border-border" aria-label={t("hist.back")}>
          <ChevronLeft className="size-4" />
        </Link>
        <div className="min-w-0">
          <h1 className="font-display text-xl font-semibold tracking-tight">{t("hist.weight")}</h1>
          <p className="text-[12px] text-muted-foreground">{t("hist.weight_sub")}</p>
        </div>
      </header>

      <section className="mt-5 space-y-2">
        {rows.length === 0 && (
          <div className="mt-6 rounded-3xl border border-dashed border-border bg-card/50 p-8 text-center">
            <div className="mx-auto mb-2 grid size-12 place-items-center rounded-full bg-brand/15 text-brand">
              <Scale className="size-5" />
            </div>
            <p className="text-sm font-semibold">{t("hist.empty")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("hist.empty_weight_desc")}</p>
          </div>
        )}
        {rows.map((e) => (
          <div key={e.date} className="flex items-center gap-3 rounded-2xl border border-border bg-card/60 p-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand">
              <Scale className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold tabular-nums">{e.kg.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">kg</span></p>
              <p className="text-[11px] text-muted-foreground">{fmtDate(e.date, lang)}</p>
            </div>
            {e.diff !== 0 && (
              <div className={`flex items-center gap-0.5 rounded-full px-2 py-1 text-[11px] font-semibold tabular-nums ${e.diff < 0 ? "bg-emerald-500/15 text-emerald-500" : "bg-amber-500/15 text-amber-500"}`}>
                {e.diff < 0 ? <TrendingDown className="size-3" /> : <TrendingUp className="size-3" />}
                {e.diff > 0 ? "+" : ""}{e.diff.toFixed(1)} kg
              </div>
            )}
          </div>
        ))}
      </section>
    </main>
  );
}

const LOCALE_MAP: Record<string, string> = {
  en: "en-US", nl: "nl-NL", ar: "ar", fr: "fr-FR", de: "de-DE", es: "es-ES",
};
function fmtDate(iso: string, lang: string) {
  return new Date(iso).toLocaleDateString(LOCALE_MAP[lang] ?? undefined, {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}
