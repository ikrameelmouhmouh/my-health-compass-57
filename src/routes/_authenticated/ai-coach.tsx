import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { ChatScreen } from "@/components/chat/chat-screen";
import { PaywallGate } from "@/components/paywall-gate";
import { usePremium } from "@/hooks/use-premium";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/ai-coach")({
  component: AiCoachRoute,
});

function AiCoachRoute() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isPremium } = usePremium();
  const t = useT();

  if (!isPremium) {
    return (
      <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-background px-5 pb-32 pt-8">
        <PaywallGate
          feature={t("pay.feature.ai_coach")}
          description={t("pay.overlay.ai_coach_desc")}
        >
          <div />
        </PaywallGate>
      </main>
    );
  }

  if (pathname === "/ai-coach") {
    return <ChatScreen initialMessages={[]} />;
  }

  return <Outlet />;
}
