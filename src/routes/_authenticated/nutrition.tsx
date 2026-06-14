import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/module-page";
import { UtensilsCrossed } from "lucide-react";

export const Route = createFileRoute("/_authenticated/nutrition")({
  component: () => (
    <ModulePage
      icon={UtensilsCrossed}
      title="Nutrition"
      subtitle="Track meals, calories and macros"
      description="Log food, scan barcodes and follow your personalized macro plan. Detailed nutrition tracking is coming to this module."
    />
  ),
});
