import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { usePremium } from "@/hooks/use-premium";
import { useAppMode } from "@/hooks/use-app-mode";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { ChevronLeft, Loader2, Shield, RotateCcw, Pencil, Eye, Palette } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/edit")({
  head: () => ({
    meta: [
      { title: "Alyva Edit pagina" },
      { name: "description", content: "Admin-only edit page: toggle app mode and display mode." },
      { property: "og:title", content: "Alyva Edit pagina" },
      { property: "og:description", content: "Admin-only edit page: toggle app mode and display mode." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminEditPage,
});

function AdminEditPage() {
  const { user } = useAuth();
  const t = useT();
  const navigate = useNavigate();
  const { isPremium, realIsPremium, override, setOverride } = usePremium();
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
        <h1 className="font-display text-2xl font-semibold">{t("admin.viewmode.no_access")}</h1>
      </main>
    );
  }

  const activeAppMode: "edit" | "customer" = mode === "customer" ? "customer" : "edit";

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
            {t("admin.edit.title")}
          </h1>
        </div>
      </header>

      {/* App mode */}
      <section className="mt-6">
        <div className="rounded-3xl border border-dashed border-border bg-card p-5">
          <p className="font-display text-[13px] font-semibold tracking-tight">
            {t("admin.appmode.title")}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {t("admin.appmode.desc")}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-1.5 rounded-full bg-background p-1">
            {(["edit", "customer"] as const).map((m) => {
              const isActive = activeAppMode === m;
              const Icon = m === "edit" ? Pencil : Eye;
              const label = m === "edit" ? t("admin.appmode.edit") : t("admin.appmode.customer");
              return (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-full px-2 py-2 text-[12px] font-semibold transition ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="size-3.5" />
                  {label}
                </button>
              );
            })}
          </div>

          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
            {t("admin.appmode.explain")}
          </p>
        </div>
      </section>

      {/* View mode */}
      <section className="mt-4">
        <div className="rounded-3xl border border-dashed border-border bg-card p-5">
          <p className="font-display text-[13px] font-semibold tracking-tight">
            {t("admin.viewmode.title")}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {t("admin.viewmode.desc")}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-1.5 rounded-full bg-background p-1">
            {(["premium", "free"] as const).map((m) => {
              const active = isPremium === (m === "premium");
              const label = m === "premium" ? t("admin.viewmode.premium") : t("admin.viewmode.free");
              return (
                <button
                  key={m}
                  onClick={() => setOverride(m)}
                  className={`rounded-full px-2 py-2 text-[12px] font-semibold transition ${
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
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

      {/* Visual editor hint */}
      <section className="mt-4">
        <div className="flex items-start gap-3 rounded-3xl border border-dashed border-border bg-card p-5">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/12 text-brand">
            <Palette className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[14px] font-semibold tracking-tight">
              {t("admin.visual.title")}
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
              {t("admin.visual.hint")}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
