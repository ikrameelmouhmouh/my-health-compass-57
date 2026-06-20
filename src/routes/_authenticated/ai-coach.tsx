import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { DraftChatScreen } from "@/components/chat/chat-screen";

export const Route = createFileRoute("/_authenticated/ai-coach")({
  component: AiCoachRoute,
});

function AiCoachRoute() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (pathname === "/ai-coach") {
    return <DraftChatScreen />;
  }

  return <Outlet />;
}
