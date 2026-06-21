import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { LANGUAGES, useI18n, useT, type Language } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getWidgetCredentials } from "@/lib/widget.functions";
import {
  ChevronLeft, ChevronRight, Sun, Moon, Globe, LogOut, Check,
  Sparkles, RefreshCw, LayoutGrid, Copy,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Vita" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const t = useT();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const { lang, setLang } = useI18n();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [profileRes, subRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle(),
        supabase.from("subscriptions").select("*").eq("user_id", user!.id).maybeSingle(),
      ]);
      return { profile: profileRes.data, subscription: subRes.data };
    },
  });

  const sub = data?.subscription;
  const isPremium = !!sub && ["active", "trialing", "past_due"].includes(sub.status) &&
    (!sub.current_period_end || new Date(sub.current_period_end).getTime() > Date.now());

  async function changeLanguage(code: Language) {
    setLang(code);
    if (user) {
      await supabase.from("profiles").update({ language: code }).eq("id", user.id);
      qc.invalidateQueries({ queryKey: ["profile", user.id] });
    }
  }

  const currentLang = LANGUAGES.find((l) => l.code === lang);

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-background px-5 pb-32 pt-8">
      {/* Header */}
      <header className="flex items-center gap-3">
        <button
          onClick={() => navigate({ to: "/profile" })}
          aria-label={t("set.back")}
          className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-card transition hover:bg-accent"
        >
          <ChevronLeft className="size-4 rtl:rotate-180" />
        </button>
        <h1 className="font-display text-[22px] font-semibold tracking-tight">
          {t("set.title")}
        </h1>
      </header>

      {/* Plan card */}
      <section className="mt-6">
        <div className="rounded-3xl border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1">
                <span className={`size-1.5 rounded-full ${isPremium ? "bg-brand" : "bg-muted-foreground"}`} />
                <span className="font-display text-[10px] font-semibold uppercase tracking-wider">
                  {isPremium ? `Vita ${t("profile.plus")}` : t("profile.free")}
                </span>
              </div>
              <p className="mt-3 font-display text-lg font-semibold leading-tight tracking-tight">
                {isPremium ? t("set.plan.title_pro") : t("set.plan.title_free")}
              </p>
              <p className="mt-1 text-[12px] text-muted-foreground">
                {isPremium ? t("set.plan.sub_pro") : t("set.plan.sub_free")}
              </p>
            </div>
            <Sparkles className="size-5 shrink-0 text-brand" />
          </div>
          <Link
            to="/pricing"
            className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-brand px-4 py-2.5 font-display text-sm font-semibold text-brand-foreground transition hover:opacity-90"
          >
            {isPremium ? t("set.plan.cta_pro") : t("set.plan.cta_free")}
          </Link>
        </div>
      </section>

      {/* Preferences */}
      <SectionLabel>{t("set.section.prefs")}</SectionLabel>
      <Group>
        <Row
          icon={theme === "dark" ? Sun : Moon}
          label={t("set.dark")}
          right={
            <button
              onClick={toggle}
              role="switch"
              aria-checked={theme === "dark"}
              className={`relative h-6 w-10 rounded-full transition ${theme === "dark" ? "bg-brand" : "bg-border"}`}
            >
              <span
                className={`absolute top-0.5 size-5 rounded-full bg-card shadow transition-transform ${
                  theme === "dark" ? "translate-x-[18px]" : "translate-x-0.5"
                }`}
              />
            </button>
          }
        />
        <Divider />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full">
              <Row
                icon={Globe}
                label={t("set.lang")}
                right={
                  <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
                    <span>{currentLang?.flag}</span>
                    <span>{currentLang?.native}</span>
                    <ChevronRight className="size-4 rtl:rotate-180" />
                  </span>
                }
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {LANGUAGES.map((l) => (
              <DropdownMenuItem
                key={l.code}
                onClick={() => changeLanguage(l.code as Language)}
                className="cursor-pointer"
              >
                <span className="mr-2">{l.flag}</span>
                <span className="flex-1">{l.native}</span>
                {lang === l.code && <Check className="size-3.5" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </Group>

      {/* Plan */}
      <SectionLabel>{t("set.section.plan")}</SectionLabel>
      <Group>
        <button
          className="w-full"
          onClick={() => navigate({ to: "/onboarding", search: { recalc: 1 } })}
        >
          <Row icon={RefreshCw} label={t("set.recalc")} sub={t("set.recalc_sub")} />
        </button>
      </Group>

      {/* Widget */}
      <SectionLabel>{t("set.section.widget")}</SectionLabel>
      <WidgetCard />

      {/* Account */}
      <SectionLabel>{t("set.section.account")}</SectionLabel>
      <Group>
        <button
          className="w-full"
          onClick={async () => {
            await signOut();
            navigate({ to: "/login", replace: true });
          }}
        >
          <Row icon={LogOut} label={t("set.signout")} destructive />
        </button>
      </Group>

      <p className="mt-8 text-center text-[10px] text-muted-foreground">
        {t("set.version")}
      </p>
    </main>
  );
}

/* ---------- UI Helpers ---------- */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 mt-7 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </h2>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card">
      {children}
    </div>
  );
}

function Divider() {
  return <div className="mx-5 h-px bg-border" />;
}

function Row({
  icon: Icon,
  label,
  sub,
  right,
  destructive,
}: {
  icon: React.ElementType;
  label: string;
  sub?: string;
  right?: React.ReactNode;
  destructive?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <div
        className={`grid size-9 shrink-0 place-items-center rounded-xl ${
          destructive ? "bg-destructive/10 text-destructive" : "bg-brand/12 text-brand"
        }`}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1 text-left">
        <div
          className={`font-display text-[14px] font-semibold tracking-tight ${
            destructive ? "text-destructive" : ""
          }`}
        >
          {label}
        </div>
        {sub && <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>}
      </div>
      {right ?? <ChevronRight className="size-4 shrink-0 text-muted-foreground" />}
    </div>
  );
}

function LinkRow(props: {
  to: string;
  search?: never;
  icon: React.ElementType;
  label: string;
  sub?: string;
}) {
  return (
    <Link to={props.to as never} className="block">
      <Row icon={props.icon} label={props.label} sub={props.sub} />
    </Link>
  );
}
