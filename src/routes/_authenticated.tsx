import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { BottomNav } from "@/components/bottom-nav";
import { AiFab } from "@/components/ai-fab";
import { AiQuickActionsProvider } from "@/lib/ai-quick-actions";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || session) return;
    // Grace period: give Supabase one more tick to hydrate from localStorage
    // before bouncing the user to the login screen.
    const t = setTimeout(() => {
      const hasAccount = typeof window !== "undefined" && localStorage.getItem("vita.has_account");
      navigate({ to: hasAccount ? "/login" : "/welcome", replace: true });
    }, 600);
    return () => clearTimeout(t);
  }, [loading, session, navigate]);


  if (loading || !session) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-background">
        <div className="size-6 animate-spin rounded-full border-2 border-hairline border-t-brand" />
      </div>
    );
  }
  return (
    <VisualEditorProvider>
      <AiQuickActionsProvider>
        <Outlet />
        <AiFab />
        <BottomNav />
        <VisualEditorLayer />
      </AiQuickActionsProvider>
    </VisualEditorProvider>
  );
}
