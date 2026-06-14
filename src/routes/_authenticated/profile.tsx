import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import {
  LogOut, Settings2, Sun, Moon, Globe, Check,
  Apple, Timer, Dumbbell, LineChart,
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { LANGUAGES, useI18n, useT, type Language } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Your plan — Vita" }] }),
  component: Profile,
});

function Profile() {
  const t = useT();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const { lang, setLang } = useI18n();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [profileRes, subRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle(),
        supabase.from("subscriptions").select("*").eq("user_id", user!.id).maybeSingle(),
      ]);
      if (profileRes.data?.language && profileRes.data.language !== lang) {
        setLang(profileRes.data.language as Language);
      }
      return { profile: profileRes.data, subscription: subRes.data };
    },
  });

  useEffect(() => {
    if (!isLoading && data && !data.profile?.onboarding_completed) {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [isLoading, data, navigate]);

  if (isLoading || !data?.profile?.onboarding_completed) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-background">
        <div className="size-6 animate-spin rounded-full border-2 border-border border-t-brand" />
      </div>
    );
  }

  const p = data.profile;
  const sub = data.subscription;
  const isPremium = sub?.tier === "premium" && sub?.status === "active";

  const totalKcalFromMacros = (p.protein_g ?? 0) * 4 + (p.fat_g ?? 0) * 9 + (p.carbs_g ?? 0) * 4;
  const proteinPct = totalKcalFromMacros ? ((p.protein_g ?? 0) * 4 / totalKcalFromMacros) * 100 : 0;
  const fatPct = totalKcalFromMacros ? ((p.fat_g ?? 0) * 9 / totalKcalFromMacros) * 100 : 0;
  const carbsPct = Math.max(0, 100 - proteinPct - fatPct);

  const deficit = (p.maintenance_calories ?? 0) - (p.daily_calories ?? 0);

  // Phase 1: real tracking not built yet — overview cards show zeroed defaults
  // with "coming soon" subtext so the four pillars are still visible up top.
  const nutrition = {
    consumed: 0,
    remaining: p.daily_calories ?? 0,
    meals: 0,
  };

  async function changeLanguage(code: Language) {
    setLang(code);
    if (user) {
      await supabase.from("profiles").update({ language: code }).eq("id", user.id);
      qc.invalidateQueries({ queryKey: ["profile", user.id] });
    }
  }

  const activityLabel = p.activity_level
    ? t(`onb.activity.${p.activity_level}`)
    : "—";

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-background px-6 pb-16 pt-10">
      <header className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">{t("profile.greeting")}</p>
          <h1 className="mt-1 truncate font-display text-2xl font-semibold tracking-tight">
            {p.display_name || "—"}
          </h1>
          <p className="mt-2 max-w-[28ch] text-[11px] leading-relaxed text-muted-foreground">
            {t("dash.tagline")}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card" aria-label={t("profile.language")}>
                <Globe className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {LANGUAGES.map((l) => (
                <DropdownMenuItem key={l.code} onClick={() => changeLanguage(l.code as Language)} className="cursor-pointer">
                  <span className="mr-2">{l.flag}</span>
                  <span className="flex-1">{l.native}</span>
                  {lang === l.code && <Check className="size-3.5" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <button onClick={toggle} className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card" aria-label={t("profile.theme")}>
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <button onClick={async () => { await signOut(); navigate({ to: "/" }); }} className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card" aria-label={t("profile.signout")}>
            <LogOut className="size-4" />
          </button>
        </div>
      </header>

      <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
        <span className={`size-1.5 rounded-full ${isPremium ? "bg-brand" : "bg-muted-foreground"}`} />
        <span className="font-display text-[11px] font-medium uppercase tracking-wider">
          {isPremium ? `Vita ${t("profile.plus")}` : t("profile.free")}
        </span>
      </div>

      {/* Four-pillar overview — Vita's USP up top */}
      <section className="mt-6">
        <p className="px-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {t("dash.overview")}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <OverviewCard
            icon={Apple}
            title={t("dash.nutrition")}
            primary={`${nutrition.consumed}`}
            primaryUnit={t("profile.kcal")}
            rows={[
              { label: t("dash.nutrition.remaining"), value: `${nutrition.remaining} ${t("profile.kcal")}` },
              { label: t("dash.nutrition.meals"),     value: `${nutrition.meals}` },
            ]}
          />
          <OverviewCard
            icon={Timer}
            title={t("dash.fasting")}
            primary="—"
            rows={[
              { label: t("dash.fasting.schedule"),  value: t("dash.fasting.not_started") },
              { label: t("dash.fasting.remaining"), value: "—" },
            ]}
          />
          <OverviewCard
            icon={Dumbbell}
            title={t("dash.training")}
            primary="0"
            primaryUnit={t("dash.training.week")}
            rows={[
              { label: t("dash.training.next"),   value: t("dash.training.none") },
              { label: t("dash.training.burned"), value: `0 ${t("profile.kcal")}` },
            ]}
          />
          <OverviewCard
            icon={LineChart}
            title={t("dash.progress")}
            primary={p.current_weight_kg ? `${Number(p.current_weight_kg).toFixed(1)}` : "—"}
            primaryUnit="kg"
            rows={[
              { label: t("dash.progress.change"), value: "0.0 kg" },
              { label: t("dash.progress.trend"),  value: t("dash.progress.steady") },
            ]}
          />
        </div>
      </section>

      {/* Daily calorie + maintenance */}
      <section className="mt-6">
        <p className="px-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {t("dash.daily_plan")}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-3xl border border-border bg-card p-5">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t("profile.daily")}</p>
            <p className="mt-3 font-display text-3xl font-semibold tabular-nums">{p.daily_calories?.toLocaleString()}</p>
            <p className="mt-1 text-[11px] font-medium text-muted-foreground">{t("profile.kcal")}</p>
            <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-border">
              <div className="h-full bg-brand" style={{ width: `${Math.min(100, ((p.daily_calories ?? 0) / (p.maintenance_calories || 1)) * 100)}%` }} />
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-card p-5">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t("profile.maintenance")}</p>
            <p className="mt-3 font-display text-3xl font-semibold tabular-nums">{p.maintenance_calories?.toLocaleString()}</p>
            <p className="mt-1 text-[11px] font-medium text-muted-foreground">{t("profile.kcal")}</p>
            <p className="mt-4 text-[11px] font-medium text-muted-foreground">
              {deficit > 0 ? `−${deficit} ${t("profile.deficit")}` : deficit < 0 ? `+${Math.abs(deficit)} ${t("profile.surplus")}` : t("profile.maintaining")}
            </p>
          </div>
        </div>
      </section>

      {/* Macros */}
      <section className="mt-3 rounded-3xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t("profile.macros")}</p>
          <span className="rounded-full bg-brand/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-brand">
            {t("profile.balanced")}
          </span>
        </div>

        <div className="mt-5 flex h-2 overflow-hidden rounded-full bg-border">
          <div className="h-full bg-brand" style={{ width: `${proteinPct}%` }} />
          <div className="h-full bg-foreground/60" style={{ width: `${fatPct}%` }} />
          <div className="h-full bg-foreground/25" style={{ width: `${carbsPct}%` }} />
        </div>

        <div className="mt-6 space-y-4">
          <MacroRow color="bg-brand" label={t("profile.protein")} grams={p.protein_g ?? 0} pct={proteinPct} />
          <MacroRow color="bg-foreground/60" label={t("profile.fat")} grams={p.fat_g ?? 0} pct={fatPct} />
          <MacroRow color="bg-foreground/25" label={t("profile.carbs")} grams={p.carbs_g ?? 0} pct={carbsPct} />
        </div>
      </section>

      {/* Personal info */}
      <section className="mt-3 rounded-3xl border border-border bg-card p-6">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t("dash.personal")}</p>
        <div className="mt-4 grid grid-cols-2 gap-y-4">
          <Stat label={t("onb.review.sex")} value={genderLabel(p.gender, t)} />
          <Stat label={t("onb.review.age")} value={`${p.age} ${t("onb.age.unit")}`} />
          <Stat label={t("onb.review.height")} value={`${p.height_cm} cm`} />
          <Stat label={t("onb.review.current")} value={`${p.current_weight_kg} kg`} />
          <Stat label={t("onb.review.goalweight")} value={`${p.goal_weight_kg} kg`} />
          <Stat label={t("profile.activity")} value={activityLabel} />
          <Stat label={t("profile.pace")} value={`${Number(p.weekly_change_kg ?? 0).toFixed(2)} kg/wk`} />
          <Stat label={t("profile.training")} value={`${p.workout_frequency}×`} />
        </div>
        <Link to="/onboarding" className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
          <Settings2 className="size-3.5" />
          {t("profile.recalc")}
        </Link>
      </section>

      {!isPremium && (
        <section className="mt-3 rounded-2xl border border-dashed border-border bg-card/50 px-5 py-4 text-center">
          <p className="text-xs font-medium text-muted-foreground">{t("profile.premium.short")}</p>
        </section>
      )}
    </main>
  );
}

function OverviewCard({
  icon: Icon, title, primary, primaryUnit, rows,
}: {
  icon: React.ElementType;
  title: string;
  primary: string;
  primaryUnit?: string;
  rows: { label: string; value: string }[];
}) {
  return (
    <div className="flex flex-col rounded-3xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <div className="grid size-7 place-items-center rounded-lg bg-brand/15">
          <Icon className="size-3.5 text-brand" />
        </div>
        <span className="font-display text-[12px] font-semibold tracking-tight">{title}</span>
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="font-display text-2xl font-semibold tabular-nums tracking-tight">{primary}</span>
        {primaryUnit && <span className="text-[10px] font-medium text-muted-foreground">{primaryUnit}</span>}
      </div>
      <div className="mt-3 space-y-1.5 border-t border-border pt-3">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-2">
            <span className="truncate text-[10px] text-muted-foreground">{r.label}</span>
            <span className="font-display text-[11px] font-semibold tabular-nums">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MacroRow({ color, label, grams, pct }: { color: string; label: string; grams: number; pct: number }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`size-2 rounded-full ${color}`} />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-display text-sm font-semibold tabular-nums">{grams}g</span>
        <span className="text-[11px] font-medium text-muted-foreground">{Math.round(pct)}%</span>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-sm font-semibold">{value}</p>
    </div>
  );
}

function genderLabel(g: string | null, t: (k: string) => string): string {
  if (!g) return "—";
  if (g === "male") return t("onb.gender.male");
  if (g === "female") return t("onb.gender.female");
  return t("onb.gender.other");
}
