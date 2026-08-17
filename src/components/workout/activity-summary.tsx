import { Link } from "@tanstack/react-router";
import { Clock, Flame, Heart, Ruler, Activity } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";
import { formatTimer, updateActivitySession, deleteActivitySession, type FinishedActivitySession } from "@/lib/activity-session";

export function ActivitySummary({
  session,
  onClose,
  onDelete,
}: {
  session: FinishedActivitySession;
  onClose: () => void;
  onDelete: () => void;
}) {
  const { t, lang } = useI18n();
  const [note, setNote] = useState(session.note ?? "");

  const handleSave = () => {
    updateActivitySession(session.id, { note });
    onClose();
  };

  const handleDelete = () => {
    deleteActivitySession(session.id);
    onDelete();
  };

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-background px-5 pb-32 pt-10">
      <div className="text-center">
        <div className="mx-auto mb-3 text-5xl">🎉</div>
        <h1 className="font-display text-2xl font-semibold leading-tight">{session.activityName}</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {new Date(session.endedAt).toLocaleString(LOCALE_MAP[lang] ?? undefined)}
        </p>
        <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
          {t(`act.intensity.${session.intensity}`)}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2">
        <Stat icon={Clock} label={t("session.duration")} value={formatTimer(session.durationSec)} />
        <Stat icon={Flame} label={t("session.calories")} value={`${session.kcal} kcal`} />
        <Stat
          icon={Heart}
          label={t("activity.avg_hr")}
          value={session.heartRateAvg ? `${session.heartRateAvg} bpm` : "—"}
          hint={session.heartRateAvg ? undefined : t("activity.healthkit_hint")}
        />
        <Stat
          icon={Ruler}
          label={t("activity.distance")}
          value={session.distanceM ? `${(session.distanceM / 1000).toFixed(2)} km` : "—"}
          hint={session.distanceM ? undefined : t("activity.healthkit_hint")}
        />
      </div>

      {session.pausedSec > 0 && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          {t("activity.paused_for", { time: formatTimer(session.pausedSec) })}
        </p>
      )}

      <div className="mt-6">
        <label className="mb-2 block text-sm font-semibold">{t("activity.note_label")}</label>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("activity.note_placeholder")}
          rows={3}
        />
      </div>

      <div className="mt-3 flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Activity className="size-3" />
        {t("activity.source")}: {t(`activity.source.${session.source}`)}
      </div>

      <div className="mt-6 space-y-2">
        <Button className="w-full" onClick={handleSave}>{t("activity.save")}</Button>
        <Button variant="outline" className="w-full" onClick={handleDelete}>{t("activity.discard")}</Button>
        <Link to="/fitness" className="block">
          <Button variant="ghost" className="w-full">{t("session.back_to_fitness")}</Button>
        </Link>
      </div>
    </main>
  );
}

function Stat({ icon: Icon, label, value, hint }: { icon: typeof Clock; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/50 p-3">
      <Icon className="size-4 text-brand" />
      <p className="mt-2 text-lg font-semibold leading-none">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      {hint && <p className="mt-1 text-[10px] text-muted-foreground/70">{hint}</p>}
    </div>
  );
}

const LOCALE_MAP: Record<string, string> = { en: "en-US", nl: "nl-NL", ar: "ar", fr: "fr-FR", de: "de-DE", es: "es-ES" };
