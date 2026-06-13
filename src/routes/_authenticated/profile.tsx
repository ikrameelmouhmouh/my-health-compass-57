import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { LogOut, Settings2, Sparkles, Sun, Moon, Globe, Check } from "lucide-react";
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
      // Reflect stored language locally when present
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

  async function changeLanguage(code: Language) {
    setLang(code);
    if (user) {
      await supabase.from("profiles").update({ language: code }).eq("id", user.id);
      qc.invalidateQueries({ queryKey: ["profile", user.id] });
    }
  }

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-background px-6 pb-16 pt-10">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{t("profile.greeting")}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">
            {p.display_name || "—"}
          </h1>
        </div>
        <div className="flex gap-2">
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

      <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
        <span className={`size-1.5 rounded-full ${isPremium ? "bg-brand" : "bg-muted-foreground"}`} />
        <span className="font-display text-[11px] font-medium uppercase tracking-wider">
          {isPremium ? `Vita ${t("profile.plus")}` : t("profile.free")}
        </span>
      </div>

      <section className="mt-6 grid grid-cols-2 gap-3">
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
      </section>

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

      <section className="mt-3 rounded-3xl border border-border bg-card p-6">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t("profile.about_you")}</p>
        <div className="mt-4 grid grid-cols-2 gap-y-4">
          <Stat label={t("onb.review.sex")} value={cap(p.gender ?? "—")} />
          <Stat label={t("onb.review.age")} value={`${p.age} ${t("onb.age.unit")}`} />
          <Stat label={t("onb.review.height")} value={`${p.height_cm} cm`} />
          <Stat label={t("onb.review.current")} value={`${p.current_weight_kg} kg`} />
          <Stat label={t("onb.review.goalweight")} value={`${p.goal_weight_kg} kg`} />
          <Stat label={t("profile.activity")} value={cap((p.activity_level ?? "—").replace("_", " "))} />
          <Stat label={t("profile.pace")} value={`${Number(p.weekly_change_kg ?? 0).toFixed(2)} kg/wk`} />
          <Stat label={t("profile.training")} value={`${p.workout_frequency}×`} />
        </div>
        <Link to="/onboarding" className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
          <Settings2 className="size-3.5" />
          {t("profile.recalc")}
        </Link>
      </section>

      {!isPremium && (
        <section className="relative mt-3 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-brand/90 to-brand/60 p-6">
          <div className="relative z-10 max-w-[260px]">
            <Sparkles className="size-5 text-brand-foreground" />
            <h3 className="mt-3 font-display text-2xl font-semibold leading-tight tracking-tight text-brand-foreground">
              {t("profile.premium.title")}
            </h3>
            <p className="mt-2 text-xs font-medium text-brand-foreground/80">
              {t("profile.premium.desc")}
            </p>
          </div>
          <div className="absolute -bottom-10 -right-10 size-44 rounded-full bg-background/10 blur-3xl" />
        </section>
      )}
    </main>
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

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
