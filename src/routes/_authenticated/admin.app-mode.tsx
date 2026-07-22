import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useAppMode } from "@/hooks/use-app-mode";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { ChevronLeft, Loader2, Shield, RotateCcw, Pencil, Eye } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/app-mode")({
  head: () => ({
    meta: [
      { title: "Alyva App Mode Admin" },
      { name: "description", content: "Admin-only toggle to skip pre-app screens while building." },
      { property: "og:title", content: "Alyva App Mode Admin" },
      { property: "og:description", content: "Admin-only toggle to skip pre-app screens while building." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminAppModePage,
});

function AdminAppModePage() {
  const { user } = useAuth();
  const t = useT();
  const navigate = useNavigate();
  const { mode, setMode } = useAppMode();

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
        <h1 className="font-display text-2xl font-semibold">{t("admin.appmode.no_access")}</h1>
      </main>
    );
  }

  const active: "edit" | "customer" = mode === "edit" ? "edit" : "customer";

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
            {t("admin.appmode.title")}
          </h1>
        </div>
      </header>

      <section className="mt-6">
        <div className="rounded-3xl border border-dashed border-border bg-card p-5">
          <p className="font-display text-[13px] font-semibold tracking-tight">
            {t("admin.appmode.desc")}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {t("admin.appmode.admin_only")}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-1.5 rounded-full bg-background p-1">
            {(["edit", "customer"] as const).map((m) => {
              const isActive = active === m;
              const Icon = m === "edit" ? Pencil : Eye;
              const label = m === "edit" ? t("admin.appmode.edit") : t("admin.appmode.customer");
              return (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-full px-2 py-2 text-[12px] font-semibold transition ${
                    isActive
                      ? "bg-brand text-brand-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="size-3.5" />
                  {label}
                </button>
              );
            })}
          </div>

          <Button
            variant="outline"
            className="mt-3 w-full"
            onClick={() => setMode(null)}
            disabled={mode === null}
          >
            <RotateCcw className="mr-2 size-4" />
            {t("admin.appmode.reset")}
          </Button>

          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
            {t("admin.appmode.explain")}
          </p>

          <p className="mt-3 text-[11px] text-muted-foreground">
            {t("admin.appmode.current")}:{" "}
            <span className="font-semibold text-foreground">
              {active === "edit" ? t("admin.appmode.edit") : t("admin.appmode.customer")}
            </span>
          </p>
        </div>
      </section>
    </main>
  );
}
