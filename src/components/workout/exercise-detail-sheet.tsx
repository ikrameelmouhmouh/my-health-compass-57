import { X } from "lucide-react";
import { EXERCISES, getExerciseFrames, type LibraryExercise } from "@/lib/exercise-library";
import { useGeneratedExerciseFrameIds } from "@/lib/exercise-frames-availability";
import { useExerciseT } from "@/lib/exercise-i18n";
import { useT } from "@/lib/i18n";
import { AnimatedFrames } from "./animated-frames";

/** Resolves a library exercise from an id (preferred) or a free-text name. */
export function resolveLibraryExercise(libraryId?: string, name?: string): LibraryExercise | null {
  if (libraryId) {
    const byId = EXERCISES.find((e) => e.id === libraryId);
    if (byId) return byId;
  }
  if (!name) return null;
  const n = name.trim().toLowerCase();
  return (
    EXERCISES.find((e) => e.name.toLowerCase() === n)
    ?? EXERCISES.find((e) => n.includes(e.name.toLowerCase()) || e.name.toLowerCase().includes(n))
    ?? null
  );
}

/**
 * Bottom sheet with the large exercise demo + details.
 * Opened by tapping an exercise thumbnail during an active workout.
 */
export function ExerciseDetailSheet({
  open,
  onClose,
  libraryId,
  name,
}: {
  open: boolean;
  onClose: () => void;
  libraryId?: string;
  name: string;
}) {
  const t = useT();
  const tex = useExerciseT();
  const generatedIds = useGeneratedExerciseFrameIds();
  const ex = resolveLibraryExercise(libraryId, name);

  if (!open) return null;

  const frames = ex ? getExerciseFrames(ex, undefined, generatedIds) : [];
  const tr = ex ? tex(ex.id, ex.name, ex.steps) : { name, steps: [] as string[] };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border-t border-border bg-card p-5 pb-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-muted" />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-xl font-semibold leading-tight">{tr.name}</h2>
            {ex && <p className="mt-0.5 text-xs text-muted-foreground">{ex.equipment}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label={t("common.close")}
            className="grid size-9 shrink-0 place-items-center rounded-full bg-background text-muted-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {frames.length > 0 && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-muted/40">
            <AnimatedFrames frames={frames} alt={tr.name} className="aspect-square w-full object-cover" />
          </div>
        )}

        {ex && (
          <div className="mt-5 space-y-4">
            <div>
              <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">{t("lib.primary")}</p>
              <div className="flex flex-wrap gap-2">
                {ex.primary.map((m) => (
                  <span key={m} className="inline-flex items-center rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background">{m}</span>
                ))}
              </div>
            </div>
            {ex.secondary.length > 0 && (
              <div>
                <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">{t("lib.secondary")}</p>
                <div className="flex flex-wrap gap-2">
                  {ex.secondary.map((m) => (
                    <span key={m} className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium">{m}</span>
                  ))}
                </div>
              </div>
            )}
            {tr.steps.length > 0 && (
              <div>
                <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">{t("lib.tab_guide")}</p>
                <ol className="space-y-2">
                  {tr.steps.map((s, i) => (
                    <li key={i} className="flex gap-3 rounded-2xl border border-border bg-background/50 p-3">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-foreground text-[11px] font-semibold text-background">{i + 1}</span>
                      <p className="text-sm leading-relaxed">{s}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Small square thumbnail that animates the exercise frames. */
export function ExerciseThumb({
  libraryId,
  name,
  className = "size-11",
}: {
  libraryId?: string;
  name: string;
  className?: string;
}) {
  const generatedIds = useGeneratedExerciseFrameIds();
  const ex = resolveLibraryExercise(libraryId, name);
  const frames = ex ? getExerciseFrames(ex, undefined, generatedIds) : [];
  return (
    <div className={`${className} shrink-0 overflow-hidden rounded-lg bg-muted`}>
      {frames.length > 0 && (
        <AnimatedFrames frames={frames} alt={name} className="size-full object-cover" intervalMs={900} />
      )}
    </div>
  );
}
