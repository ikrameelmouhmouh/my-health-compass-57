import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/module-page";
import { Dumbbell } from "lucide-react";

export const Route = createFileRoute("/_authenticated/fitness")({
  component: () => (
    <ModulePage
      icon={Dumbbell}
      title="Fitness"
      subtitle="Workouts, activity and steps"
      description="Plan workouts, log sessions and review your activity. Full workout library and tracking are coming to this module."
    />
  ),
});
