import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/module-page";
import { Scale } from "lucide-react";

export const Route = createFileRoute("/_authenticated/weight")({
  component: () => (
    <ModulePage
      icon={Scale}
      title="Weight"
      subtitle="Log weigh-ins and track progress"
      description="Log your weight, see trends over time and follow progress toward your goal. Charts and history are coming to this module."
    />
  ),
});
