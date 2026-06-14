import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/module-page";
import { Timer } from "lucide-react";

export const Route = createFileRoute("/_authenticated/fasting")({
  component: () => (
    <ModulePage
      icon={Timer}
      title="Fasting"
      subtitle="Intermittent fasting timer & streaks"
      description="Start and stop your fasting window, follow your streak and review your history. A dedicated fasting timer is coming to this module."
    />
  ),
});
