import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { LogOut, Settings2, Sparkles, Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme-context";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Your blueprint — Apex" }] }),
  component: Profile,
});

function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  const { data, isLoading } = useQuery({
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

  useEffect(() => {
    if (!isLoading && data && !data.profile?.onboarding_completed) {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [isLoading, data, navigate]);

  if (isLoading || !data?.profile?.onboarding_completed) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-background">
        <div className="size-6 animate-spin rounded-full border-2 border-hairline border-t-brand" />
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

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-background px-6 pb-16 pt-10">
      {/* Top bar */}
      <header className="flex items-center justify-between">
        <div>
          <p className="font-display text-[10px] uppercase tracking-[0.3em] text-brand">Metabolic protocol</p>
          <h1 className="mt-1 font-display text-2xl font-bold uppercase tracking-tight">
            {p.display_name || "Operator"}
          </h1>
        </div>
        <div className="flex gap-2">
          <button onClick={toggle} className="inline-flex size-10 items-center justify-center rounded-full border border-hairline bg-surface" aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <button onClick={async () => { await signOut(); navigate({ to: "/" }); }} className="inline-flex size-10 items-center justify-center rounded-full border border-hairline bg-surface" aria-label="Sign out">
            <LogOut className="size-4" />
          </button>
        </div>
      </header>

      {/* Premium badge */}
      <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-hairline bg-surface px-3 py-1.5">
        <span className={`size-1.5 rounded-full ${isPremium ? "bg-brand" : "bg-muted-foreground"}`} />
        <span className="font-display text-[10px] uppercase tracking-widest">
          {isPremium ? "APEX Plus" : "Free tier"}
        </span>
      </div>

      {/* Calorie cards */}
      <section className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-3xl border border-hairline bg-card p-5">
          <p className="font-display text-[10px] uppercase tracking-widest text-muted-foreground">Daily intake</p>
          <p className="mt-3 font-display text-3xl font-bold tabular-nums">{p.daily_calories?.toLocaleString()}</p>
          <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">kcal target</p>
          <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-hairline">
            <div className="h-full bg-brand" style={{ width: `${Math.min(100, ((p.daily_calories ?? 0) / (p.maintenance_calories || 1)) * 100)}%` }} />
          </div>
        </div>
        <div className="rounded-3xl border border-hairline bg-card p-5">
          <p className="font-display text-[10px] uppercase tracking-widest text-muted-foreground">Maintenance</p>
          <p className="mt-3 font-display text-3xl font-bold tabular-nums">{p.maintenance_calories?.toLocaleString()}</p>
          <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">kcal TDEE</p>
          <p className={`mt-4 font-display text-[10px] uppercase tracking-widest ${deficit > 0 ? "text-brand" : deficit < 0 ? "text-foreground" : "text-muted-foreground"}`}>
            {deficit > 0 ? `−${deficit} kcal deficit` : deficit < 0 ? `+${Math.abs(deficit)} kcal surplus` : "At maintenance"}
          </p>
        </div>
      </section>

      {/* Macros */}
      <section className="mt-3 rounded-3xl border border-hairline bg-card p-6">
        <div className="flex items-center justify-between">
          <p className="font-display text-[10px] uppercase tracking-widest text-muted-foreground">Macronutrient split</p>
          <span className="rounded bg-brand/15 px-2 py-1 font-display text-[9px] font-bold uppercase tracking-widest text-brand">
            Balanced
          </span>
        </div>

        <div className="mt-5 flex h-2 overflow-hidden rounded-full bg-hairline">
          <div className="h-full bg-brand" style={{ width: `${proteinPct}%` }} />
          <div className="h-full bg-foreground/60" style={{ width: `${fatPct}%` }} />
          <div className="h-full bg-foreground/25" style={{ width: `${carbsPct}%` }} />
        </div>

        <div className="mt-6 space-y-4">
          <MacroRow color="bg-brand" label="Protein" grams={p.protein_g ?? 0} pct={proteinPct} />
          <MacroRow color="bg-foreground/60" label="Fat" grams={p.fat_g ?? 0} pct={fatPct} />
          <MacroRow color="bg-foreground/25" label="Carbohydrates" grams={p.carbs_g ?? 0} pct={carbsPct} />
        </div>
      </section>

      {/* Stats */}
      <section className="mt-3 rounded-3xl border border-hairline bg-card p-6">
        <p className="font-display text-[10px] uppercase tracking-widest text-muted-foreground">Profile</p>
        <div className="mt-4 grid grid-cols-2 gap-y-4">
          <Stat label="Sex" value={cap(p.gender ?? "—")} />
          <Stat label="Age" value={`${p.age} yrs`} />
          <Stat label="Height" value={`${p.height_cm} cm`} />
          <Stat label="Current" value={`${p.current_weight_kg} kg`} />
          <Stat label="Goal" value={`${p.goal_weight_kg} kg`} />
          <Stat label="Activity" value={cap((p.activity_level ?? "—").replace("_", " "))} />
          <Stat label="Pace" value={`${Number(p.weekly_change_kg ?? 0).toFixed(2)} kg/wk`} />
          <Stat label="Training" value={`${p.workout_frequency}×/wk`} />
        </div>
        <Link to="/onboarding" className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
          <Settings2 className="size-3.5" />
          Re-run calibration
        </Link>
      </section>

      {/* Premium teaser (architectural placeholder) */}
      {!isPremium && (
        <section className="relative mt-3 overflow-hidden rounded-3xl border border-hairline bg-gradient-to-br from-brand to-emerald-500 p-6">
          <div className="relative z-10 max-w-[240px]">
            <Sparkles className="size-5 text-brand-foreground" />
            <h3 className="mt-3 font-display text-2xl font-bold uppercase leading-none tracking-tight text-brand-foreground">
              Apex Plus
            </h3>
            <p className="mt-2 text-xs font-medium text-brand-foreground/80">
              Unlock food logging, fasting protocols, and AI-driven training periodization. Coming soon.
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
        <span className="font-display text-[10px] uppercase tracking-widest text-muted-foreground">{Math.round(pct)}%</span>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-sm font-semibold">{value}</p>
    </div>
  );
}

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
