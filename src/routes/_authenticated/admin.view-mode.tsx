import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { usePremium } from "@/hooks/use-premium";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { ChevronLeft, Loader2, Shield, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/view-mode")({
  head: () => ({
    meta: [
      { title: "Alyva View Mode Admin" },
      { name: "description", content: "Admin-only toggle to preview Alyva as a Premium or free user." },
      { property: "og:title", content: "Alyva View Mode Admin" },
      { property: "og:description", content: "Admin-only toggle to preview Alyva as a Premium or free user." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminViewModePage,
});

function AdminViewModePage() {
  const { user } = useAuth();
  const t = useT();
  const navigate = useNavigate();
  const { isPremium, realIsPremium, override, setOverride } = usePremium();

  const roleQ = useQuery({
    queryKey: ["user-role", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    },
  });

  if (roleQ.isLoading) {
    return (
      <div className="grid min-h-[100dvh] place-items-center">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  if (roleQ.data === false) {
    return (
      <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <Shield className="size-10 text-brand" />
        <h1 className="font-display text-2xl font-semibold">{t("admin.viewmode.no_access")}</h1>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-background px-5 pb-32 pt-8">
      <header className="flex items-center gap-3">
        <button
          onClick={() => navigate({ to: "/settings" })}
          aria-label="Back"
          className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-card transition hover:bg-accent"
        >
          <ChevronLeft className="size-4 rtl:rotate-180" />
        </button>
        <div className="min-w-0 flex items-center gap-2">
          <Shield className="size-5 text-brand" />
          <h1 className="font-display text-[22px] font-semibold tracking-tight">
            {t("admin.viewmode.title")}
          </h1>
        </div>
      </header>

      <section className="mt-6">
        <div className="rounded-3xl border border-dashed border-border bg-card p-5">
          <p className="font-display text-[13px] font-semibold tracking-tight">
            {t("admin.viewmode.desc")}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {t("admin.viewmode.admin_only")}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-1.5 rounded-full bg-background p-1">
            {(["premium", "free"] as const).map((mode) => {
              const active = isPremium === (mode === "premium");
              const label =
                mode === "premium" ? t("admin.viewmode.premium") : t("admin.viewmode.free");
              return (
                <button
                  key={mode}
                  onClick={() => setOverride(mode)}
                  className={`rounded-full px-2 py-2 text-[12px] font-semibold transition ${
                    active
                      ? "bg-brand text-brand-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <Button
            variant="outline"
            className="mt-3 w-full"
            onClick={() => setOverride(null)}
            disabled={override === null}
          >
            <RotateCcw className="mr-2 size-4" />
            {t("admin.viewmode.reset")}
          </Button>

          <p className="mt-4 text-[11px] text-muted-foreground">
            {t("admin.viewmode.real_status")}:{" "}
            <span className="font-semibold text-foreground">
              {realIsPremium ? t("admin.viewmode.premium") : t("admin.viewmode.free")}
            </span>
            {override !== null && (
              <>
                {" · "}
                {t("admin.viewmode.override_active")}
              </>
            )}
          </p>
        </div>
      </section>
    </main>
  );
}
