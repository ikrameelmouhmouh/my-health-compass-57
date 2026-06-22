import { useNavigate } from "@tanstack/react-router";
import { Play, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { buildSessionFromTemplate, useActiveSession } from "@/lib/workout-session";
import { EXERCISES } from "@/lib/exercise-library";
import type { WorkoutTemplate } from "@/lib/workout-prefs";
import { toast } from "sonner";

export function SessionStartSheet({
  template,
  open,
  onClose,
  onEdit,
}: {
  template: WorkoutTemplate | null;
  open: boolean;
  onClose: () => void;
  onEdit: (tpl: WorkoutTemplate) => void;
}) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { start, session: active, cancel } = useActiveSession();

  if (!open || !template) return null;

  const totalSets = template.exercises.reduce((s, e) => s + (Number(e.sets) || 0), 0);

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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-3xl border-t border-border bg-card p-5 pb-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-muted" />
        <div className="mb-4 flex items-start justify-between gap-3">
          <button
            onClick={onClose}
            aria-label={t("common.close")}
            className="grid size-9 place-items-center rounded-full bg-background text-muted-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <h2 className="font-display text-xl font-semibold leading-tight">{template.name}</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {template.exercises.length} {t("fit.tpl.ex_short")} · {totalSets} {t("fit.tpl.sets_short")}
        </p>

        <div className="mt-4 max-h-[40vh] space-y-2 overflow-y-auto pr-1">
          {template.exercises.map((ex, i) => {
            const lib = EXERCISES.find(
              (e) => e.name.toLowerCase() === ex.name.toLowerCase()
                || ex.name.toLowerCase().includes(e.name.toLowerCase()),
            );
            return (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-background/40 p-2.5">
                <div className="size-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {lib?.image && <img src={lib.image} alt="" className="size-full object-cover" loading="lazy" />}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{ex.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {lib?.equipment ?? "—"} · {ex.sets} {t("fit.tpl.sets_short")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => template && onEdit(template)}>
            <Pencil className="mr-2 size-4" /> {t("fit.tpl.edit")}
          </Button>
          <Button onClick={handleStart}>
            <Play className="mr-2 size-4 fill-current" /> {t("session.start")}
          </Button>
        </div>
      </div>
    </div>
  );
}
