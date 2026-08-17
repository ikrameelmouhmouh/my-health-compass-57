import { Link } from "@tanstack/react-router";
import { Clock, Flame, Repeat, Weight, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { localizeDayNames } from "@/lib/workout-today";
import { formatDuration, previousBestFor, type FinishedSession } from "@/lib/workout-session";

export function SessionSummary({
  session,
  onClose,
}: {
  session: FinishedSession;
  onClose: () => void;
}) {
  const { t, lang } = useI18n();
  // crude calorie estimate: kcal ≈ (durationMin * 5 MET * 70kg * 3.5) / 200
  const minutes = session.durationSec / 60;
  const kcal = Math.round((minutes * 5 * 70 * 3.5) / 200);

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-background px-5 pb-32 pt-10">
      <div className="text-center">
        <div className="mx-auto mb-3 text-5xl">🎉</div>
        <h1 className="font-display text-2xl font-semibold leading-tight">{localizeDayNames(session.templateName, t)}</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {new Date(session.endedAt).toLocaleString(LOCALE_MAP[lang] ?? undefined)}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2">
        <Stat icon={Clock} label={t("session.duration")} value={formatDuration(session.durationSec)} />
        <Stat icon={Flame} label={t("session.calories")} value={`${kcal} kcal`} />
        <Stat icon={Weight} label={t("session.total_volume")} value={`${session.totalVolume.toLocaleString()} kg`} />
        <Stat icon={Repeat} label={t("session.total_reps")} value={String(session.totalReps)} />
      </div>

      <h3 className="mt-6 mb-2 text-sm font-semibold">{t("session.exercises_done")}</h3>
      <div className="space-y-3">
        {session.exercises.map((ex, i) => {
          const doneSets = ex.sets.filter((s) => s.done);
          if (doneSets.length === 0) return null;
          const prev = previousBestFor(ex.name, session.id);
          const currentBest = doneSets.reduce(
            (best, s) => (s.weight * s.reps > best.weight * best.reps ? s : best),
            doneSets[0],
          );
          const isPR =
            prev !== null
              && currentBest.weight * currentBest.reps > prev.weight * prev.reps;
          return (
            <div key={i} className="rounded-2xl border border-border bg-card/60 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="font-medium">{ex.name}</p>
                {isPR && (
                  <span className="flex items-center gap-1 rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-semibold text-brand">
                    <Trophy className="size-3" /> {t("session.pr")}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-1 text-xs text-muted-foreground">
                <span>{t("session.col_set")}</span>
                <span>{t("session.col_weight")}</span>
                <span>{t("session.col_reps")}</span>
              </div>
              {doneSets.map((s, j) => (
                <div key={j} className="grid grid-cols-3 gap-1 border-t border-border/60 py-1.5 text-sm">
                  <span>{j + 1}</span>
                  <span>{s.weight} kg</span>
                  <span>×{s.reps}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div className="mt-8 space-y-2">
        <Button className="w-full" onClick={onClose}>{t("session.done")}</Button>
        <Link to="/fitness" className="block">
          <Button variant="outline" className="w-full">{t("session.back_to_fitness")}</Button>
        </Link>
      </div>
    </main>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/50 p-3">
      <Icon className="size-4 text-brand" />
      <p className="mt-2 text-lg font-semibold leading-none">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

const LOCALE_MAP: Record<string, string> = { en: "en-US", nl: "nl-NL", ar: "ar", fr: "fr-FR", de: "de-DE", es: "es-ES" };
