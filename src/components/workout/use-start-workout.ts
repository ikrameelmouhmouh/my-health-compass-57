import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { buildSessionFromTemplate, useActiveSession } from "@/lib/workout-session";
import type { WorkoutTemplate } from "@/lib/workout-prefs";

/** Starts (or resumes) a workout session for a template and opens the active workout. */
export function useStartWorkout() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { start, session: active, cancel } = useActiveSession();

  return useCallback(
    (template: WorkoutTemplate) => {
      if (active && active.templateId !== template.id) {
        if (!confirm(t("session.replace_confirm"))) return;
        cancel();
      }
      const s = active && active.templateId === template.id ? active : buildSessionFromTemplate(template);
      start(s);
      navigate({ to: "/workout-session/$templateId", params: { templateId: template.id } });
      toast.success(t("session.started"));
    },
    [active, cancel, navigate, start, t],
  );
}
