import { useState } from "react";
import { Play } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { normalizeDay, todayDayName } from "@/lib/workout-today";
import { useTemplates, type WorkoutTemplate } from "@/lib/workout-prefs";
import { SessionStartSheet } from "./session-start-sheet";
import { TemplateEditor } from "@/components/template-editor";

/**
 * Play action for a workout card. Never starts immediately: it first opens the
 * Alyva workout overview sheet where the user can review/edit and then start.
 * Starting a workout scheduled on another weekday only changes today's session
 * — the weekly schedule stays untouched — so we confirm first.
 */
export function StartWorkoutButton({
  template,
  variant = "icon",
  className,
}: {
  template: WorkoutTemplate;
  variant?: "icon" | "full";
  className?: string;
}) {
  const { t } = useI18n();
  const { upsert } = useTemplates();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editing, setEditing] = useState<WorkoutTemplate | null>(null);

  const today = todayDayName();
  const tplDay = normalizeDay(template.day);
  const isOtherDay = !!tplDay && tplDay !== today;
  const dayLabel = tplDay ? t(`day.${tplDay}`) : "";
  const todayLabel = t(`day.${today}`);

  const handle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOtherDay) setConfirmOpen(true);
    else setPreviewOpen(true);
  };

  return (
    <>
      {variant === "full" ? (
        <Button size="sm" className={className} onClick={handle}>
          <Play className="mr-2 size-3.5 fill-current" /> {t("session.start")}
        </Button>
      ) : (
        <button
          type="button"
          onClick={handle}
          aria-label={t("session.start")}
          className={`grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm transition hover:opacity-90 ${className ?? ""}`}
        >
          <Play className="size-4 fill-current" />
        </button>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("session.otherday.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("session.otherday.body", { today: todayLabel, day: dayLabel })}
              {" "}
              {t("session.otherday.note")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => setPreviewOpen(true)}>
              {t("session.otherday.confirm", { day: dayLabel })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SessionStartSheet
        template={template}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        onEdit={(tpl) => { setPreviewOpen(false); setEditing(tpl); }}
      />

      {editing && (
        <TemplateEditor
          open
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(tpl) => { upsert(tpl); setEditing(null); }}
        />
      )}
    </>
  );
}
