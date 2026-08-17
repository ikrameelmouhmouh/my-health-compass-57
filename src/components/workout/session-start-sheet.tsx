import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Play, Pencil, X, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { localizeDayNames } from "@/lib/workout-today";
import { buildSessionFromTemplate, useActiveSession } from "@/lib/workout-session";
import { EXERCISES } from "@/lib/exercise-library";
import type { WorkoutTemplate } from "@/lib/workout-prefs";
import { toast } from "sonner";
import { ExerciseDetailSheet, ExerciseThumb, resolveLibraryExercise } from "./exercise-detail-sheet";

/** Workout preview: what's in this workout, before it becomes an active session. */
export function SessionStartSheet({
  template,
  open,
  onClose,
  onEdit,
}: {
  template: WorkoutTemplate | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (tpl: WorkoutTemplate) => void;
}) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { start, session: active, cancel } = useActiveSession();
  const [detail, setDetail] = useState<{ libraryId?: string; name: string } | null>(null);

  if (!open || !template) return null;

  const totalSets = template.exercises.reduce((s, e) => s + (Number(e.sets) || 0), 0);
  const estMin = Math.max(15, Math.min(120, Math.round(totalSets * 3) || 30));

  function handleStart() {
    if (!template) return;
    if (active && active.templateId !== template.id) {
      if (!confirm(t("session.replace_confirm"))) return;
      cancel();
    }
    const s = active && active.templateId === template.id ? active : buildSessionFromTemplate(template);
    start(s);
    onClose();
    navigate({ to: "/workout-session/$templateId", params: { templateId: template.id } });
    toast.success(t("session.started"));
  }

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex max-h-[92dvh] w-full max-w-md flex-col rounded-t-3xl border-t border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-3">
          <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-muted" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-display text-xl font-semibold leading-tight">{localizeDayNames(template.name, t)}</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("fit.exercises_count", { n: template.exercises.length })} · {totalSets} {t("fit.tpl.sets_short")} · {t("fit.today.est_min", { n: estMin })}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label={t("common.close")}
              className="grid size-9 shrink-0 place-items-center rounded-full bg-background text-muted-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 flex-1 space-y-2 overflow-y-auto px-5">
          {template.exercises.map((ex, i) => {
            const lib = resolveLibraryExercise(undefined, ex.name)
              ?? EXERCISES.find((e) => e.name.toLowerCase() === ex.name.toLowerCase())
              ?? null;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setDetail({ libraryId: lib?.id, name: ex.name })}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-background/40 p-2.5 text-left transition hover:bg-background/70"
              >
                <ExerciseThumb libraryId={lib?.id} name={ex.name} className="size-12" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{ex.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {lib?.equipment ?? "—"} · {ex.sets} × {ex.reps}
                    {ex.suggestedWeight ? ` · ${ex.suggestedWeight}` : ""}
                  </p>
                  {ex.restSec ? (
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Timer className="size-3" /> {t("fit.rest_short")} {ex.restSec}s
                    </p>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>

        <div className="space-y-2 border-t border-border bg-card px-5 pb-8 pt-3">
          <Button className="w-full" size="lg" onClick={handleStart}>
            <Play className="mr-2 size-4 fill-current" /> {t("session.start")}
          </Button>
          {onEdit && (
            <Button variant="outline" className="w-full" onClick={() => template && onEdit(template)}>
              <Pencil className="mr-2 size-4" /> {t("fit.tpl.edit")}
            </Button>
          )}
        </div>
      </div>
    </div>

      {detail && (
        <ExerciseDetailSheet
          open
          onClose={() => setDetail(null)}
          libraryId={detail.libraryId}
          name={detail.name}
        />
      )}
    </>
  );
}
