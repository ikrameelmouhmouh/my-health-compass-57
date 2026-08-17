import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy path — Progress now lives inside Insights. */
export const Route = createFileRoute("/_authenticated/weight")({
  beforeLoad: () => {
    throw redirect({ to: "/insights", search: { tab: "progress" as const } });
  },
});
