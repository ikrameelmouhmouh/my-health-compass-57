import { createFileRoute, useBlocker, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useT } from "@/lib/i18n";
import {
  ChevronLeft, Loader2, Shield, Palette, RotateCcw, Link2, Link2Off, Info,
  Flame, Footprints, Scale, Dumbbell, Hourglass, Sparkles, Check, TriangleAlert,
  Camera, CalendarDays, Leaf,
} from "lucide-react";
import {
  effectiveColors,
  getDefaultDesignConfig,
  loadDesignConfig,
  saveDesignConfig,
  FONT_OPTIONS,
  FONT_WEIGHT_OPTIONS,
  type BrandColorKey,
  type ColorTokenKey,
  type DesignConfig,
  type FontTokenKey,
  type TypographyTokenKey,
  type WeightTokenKey,
} from "@/lib/design-tokens";

export const Route = createFileRoute("/_authenticated/admin/branding")({
  head: () => ({
    meta: [
      { title: "App-stijl & Branding — Alyva" },
      { name: "description", content: "Central admin page for the ALYVA design tokens: branding, colors and typography." },
      { property: "og:title", content: "App-stijl & Branding — Alyva" },
      { property: "og:description", content: "Central admin page for the ALYVA design tokens: branding, colors and typography." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminBrandingPage,
});

type TFunc = (key: string) => string;
type Colors = Record<ColorTokenKey, string>;
type Typo = Record<TypographyTokenKey, string>;

const BRAND_ROWS: Array<{ key: ColorTokenKey | BrandColorKey; labelKey: string; descKey: string }> = [
  { key: "brand-primary", labelKey: "admin.branding.brand.primary", descKey: "admin.branding.brand.primary.desc" },
  { key: "brand-logo", labelKey: "admin.branding.brand.logo", descKey: "admin.branding.brand.logo.desc" },
  { key: "brand-header", labelKey: "admin.branding.brand.header", descKey: "admin.branding.brand.header.desc" },
  { key: "brand-action", labelKey: "admin.branding.brand.action", descKey: "admin.branding.brand.action.desc" },
  { key: "brand-accent", labelKey: "admin.branding.brand.accent", descKey: "admin.branding.brand.accent.desc" },
];

const COMPONENT_ROWS: Array<{ key: ColorTokenKey; labelKey: string; descKey: string }> = [
  { key: "color-calories", labelKey: "admin.branding.comp.calories", descKey: "admin.branding.comp.calories.desc" },
  { key: "color-fasting", labelKey: "admin.branding.comp.fasting", descKey: "admin.branding.comp.fasting.desc" },
  { key: "color-steps", labelKey: "admin.branding.comp.steps", descKey: "admin.branding.comp.steps.desc" },
  { key: "color-weight", labelKey: "admin.branding.comp.weight", descKey: "admin.branding.comp.weight.desc" },
  { key: "color-workout", labelKey: "admin.branding.comp.workout", descKey: "admin.branding.comp.workout.desc" },
];

const UI_ROWS: Array<{ key: ColorTokenKey; labelKey: string; descKey: string }> = [
  { key: "background-primary", labelKey: "admin.branding.ui.background", descKey: "admin.branding.ui.background.desc" },
  { key: "surface-card", labelKey: "admin.branding.ui.card", descKey: "admin.branding.ui.card.desc" },
  { key: "text-primary", labelKey: "admin.branding.ui.text_primary", descKey: "admin.branding.ui.text_primary.desc" },
  { key: "text-secondary", labelKey: "admin.branding.ui.text_secondary", descKey: "admin.branding.ui.text_secondary.desc" },
  { key: "text-muted", labelKey: "admin.branding.ui.text_muted", descKey: "admin.branding.ui.text_muted.desc" },
  { key: "border-default", labelKey: "admin.branding.ui.border", descKey: "admin.branding.ui.border.desc" },
  { key: "divider-line", labelKey: "admin.branding.ui.divider", descKey: "admin.branding.ui.divider.desc" },
  { key: "input-background", labelKey: "admin.branding.ui.input", descKey: "admin.branding.ui.input.desc" },
  { key: "shadow-color", labelKey: "admin.branding.ui.shadow", descKey: "admin.branding.ui.shadow.desc" },
];

const FONT_ROWS: Array<{ key: FontTokenKey; labelKey: string; descKey: string }> = [
  { key: "font-family-primary", labelKey: "admin.branding.type.primary", descKey: "admin.branding.type.primary.desc" },
  { key: "font-family-headings", labelKey: "admin.branding.type.headings", descKey: "admin.branding.type.headings.desc" },
  { key: "font-family-body", labelKey: "admin.branding.type.body", descKey: "admin.branding.type.body.desc" },
  { key: "font-family-buttons", labelKey: "admin.branding.type.buttons", descKey: "admin.branding.type.buttons.desc" },
  { key: "font-family-numbers", labelKey: "admin.branding.type.numbers", descKey: "admin.branding.type.numbers.desc" },
];

const WEIGHT_ROWS: Array<{ key: WeightTokenKey; labelKey: string; descKey: string }> = [
  { key: "font-weight-headings", labelKey: "admin.branding.type.weight_headings.label", descKey: "admin.branding.type.weight_headings.desc" },
  { key: "font-weight-body", labelKey: "admin.branding.type.weight_body.label", descKey: "admin.branding.type.weight_body.desc" },
  { key: "font-weight-buttons", labelKey: "admin.branding.type.weight_buttons.label", descKey: "admin.branding.type.weight_buttons.desc" },
];

/* ---------- Preview tabs ---------- */

type PreviewTab = "start" | "nutrition" | "fasting" | "fitness" | "progress" | "weight";

const PREVIEW_TABS: Array<{ id: PreviewTab; labelKey: string }> = [
  { id: "start", labelKey: "admin.branding.tab.start" },
  { id: "nutrition", labelKey: "admin.branding.tab.nutrition" },
  { id: "fasting", labelKey: "admin.branding.tab.fasting" },
  { id: "fitness", labelKey: "admin.branding.tab.fitness" },
  { id: "progress", labelKey: "admin.branding.tab.progress" },
  { id: "weight", labelKey: "admin.branding.tab.weight" },
];

const USED_HERE: Record<PreviewTab, Array<{ color: ColorTokenKey; labelKey: string; descKey: string }>> = {
  start: [
    { color: "brand-primary", labelKey: "admin.branding.brand.primary", descKey: "admin.branding.brand.primary.desc" },
    { color: "color-calories", labelKey: "admin.branding.comp.calories", descKey: "admin.branding.comp.calories.desc" },
    { color: "color-fasting", labelKey: "admin.branding.comp.fasting", descKey: "admin.branding.comp.fasting.desc" },
    { color: "color-steps", labelKey: "admin.branding.comp.steps", descKey: "admin.branding.comp.steps.desc" },
    { color: "color-weight", labelKey: "admin.branding.comp.weight", descKey: "admin.branding.comp.weight.desc" },
    { color: "color-workout", labelKey: "admin.branding.comp.workout", descKey: "admin.branding.comp.workout.desc" },
    { color: "text-primary", labelKey: "admin.branding.ui.text_primary", descKey: "admin.branding.ui.text_primary.desc" },
    { color: "background-primary", labelKey: "admin.branding.ui.background", descKey: "admin.branding.ui.background.desc" },
  ],
  nutrition: [
    { color: "color-calories", labelKey: "admin.branding.comp.calories", descKey: "admin.branding.comp.calories.desc" },
    { color: "brand-action", labelKey: "admin.branding.brand.action", descKey: "admin.branding.brand.action.desc" },
    { color: "surface-card", labelKey: "admin.branding.ui.card", descKey: "admin.branding.ui.card.desc" },
    { color: "background-primary", labelKey: "admin.branding.ui.background", descKey: "admin.branding.ui.background.desc" },
  ],
  fasting: [
    { color: "color-fasting", labelKey: "admin.branding.comp.fasting", descKey: "admin.branding.comp.fasting.desc" },
    { color: "brand-action", labelKey: "admin.branding.brand.action", descKey: "admin.branding.brand.action.desc" },
    { color: "surface-card", labelKey: "admin.branding.ui.card", descKey: "admin.branding.ui.card.desc" },
    { color: "background-primary", labelKey: "admin.branding.ui.background", descKey: "admin.branding.ui.background.desc" },
  ],
  fitness: [
    { color: "color-workout", labelKey: "admin.branding.comp.workout", descKey: "admin.branding.comp.workout.desc" },
    { color: "brand-action", labelKey: "admin.branding.brand.action", descKey: "admin.branding.brand.action.desc" },
    { color: "surface-card", labelKey: "admin.branding.ui.card", descKey: "admin.branding.ui.card.desc" },
    { color: "background-primary", labelKey: "admin.branding.ui.background", descKey: "admin.branding.ui.background.desc" },
  ],
  progress: [
    { color: "color-steps", labelKey: "admin.branding.comp.steps", descKey: "admin.branding.comp.steps.desc" },
    { color: "color-weight", labelKey: "admin.branding.comp.weight", descKey: "admin.branding.comp.weight.desc" },
    { color: "color-workout", labelKey: "admin.branding.comp.workout", descKey: "admin.branding.comp.workout.desc" },
    { color: "surface-card", labelKey: "admin.branding.ui.card", descKey: "admin.branding.ui.card.desc" },
    { color: "background-primary", labelKey: "admin.branding.ui.background", descKey: "admin.branding.ui.background.desc" },
  ],
  weight: [
    { color: "color-weight", labelKey: "admin.branding.comp.weight", descKey: "admin.branding.comp.weight.desc" },
    { color: "text-primary", labelKey: "admin.branding.ui.text_primary", descKey: "admin.branding.ui.text_primary.desc" },
    { color: "surface-card", labelKey: "admin.branding.ui.card", descKey: "admin.branding.ui.card.desc" },
    { color: "background-primary", labelKey: "admin.branding.ui.background", descKey: "admin.branding.ui.background.desc" },
  ],
};

function AdminBrandingPage() {
  const { user } = useAuth();
  const t = useT();
  const navigate = useNavigate();

  // Last saved config vs. the temporary draft. Edits only touch the draft.
  const [saved, setSaved] = useState<DesignConfig>(() => loadDesignConfig());
  const [draft, setDraft] = useState<DesignConfig>(() => loadDesignConfig());
  const [justSaved, setJustSaved] = useState(false);
  const [tab, setTab] = useState<PreviewTab>("start");

  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(saved),
    [draft, saved],
  );
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  // Block in-app navigation and refresh/close while there are unsaved changes.
  const blocker = useBlocker({
    shouldBlockFn: () => dirtyRef.current,
    enableBeforeUnload: () => dirtyRef.current,
    withResolver: true,
  });

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

  const theme = draft.themes.light;
  const colors = effectiveColors(theme);
  const typo = theme.typography;

  const mutateDraft = (fn: (d: DesignConfig) => void) => {
    setJustSaved(false);
    setDraft((prev) => {
      const next: DesignConfig = JSON.parse(JSON.stringify(prev));
      fn(next);
      return next;
    });
  };

  const setColor = (key: ColorTokenKey, value: string) =>
    mutateDraft((d) => {
      d.themes.light.colors[key] = value;
    });

  const setLinked = (key: BrandColorKey, linked: boolean) =>
    mutateDraft((d) => {
      d.themes.light.brandLinks[key] = linked;
      if (linked) d.themes.light.colors[key] = d.themes.light.colors["brand-primary"];
    });

  const setTypo = (key: FontTokenKey | WeightTokenKey, value: string) =>
    mutateDraft((d) => {
      d.themes.light.typography[key] = value;
    });

  const handleSave = () => {
    saveDesignConfig(draft);
    setSaved(draft);
    setJustSaved(true);
  };

  const handleDiscard = () => {
    setDraft(saved);
    setJustSaved(false);
  };

  const handleReset = () => {
    setJustSaved(false);
    setDraft(getDefaultDesignConfig());
  };

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-background px-5 pb-32 pt-8">
      <header className="flex items-center gap-3">
        <button
          onClick={() => navigate({ to: "/admin/edit" })}
          aria-label={t("set.back")}
          className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-card transition hover:bg-accent"
        >
          <ChevronLeft className="size-4 rtl:rotate-180" />
        </button>
        <div className="min-w-0 flex items-center gap-2">
          <Palette className="size-5 text-brand" />
          <h1 className="font-display text-[22px] font-semibold tracking-tight">
            {t("admin.branding.title")}
          </h1>
        </div>
      </header>
      <p className="mt-2 px-1 text-[12px] text-muted-foreground">
        {t("admin.branding.subtitle")}
      </p>

      {/* Save status */}
      <div className="mt-3 px-1">
        {dirty ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1.5 text-[11px] font-semibold text-destructive">
            <TriangleAlert className="size-3.5" />
            {t("admin.branding.dirty")}
          </span>
        ) : justSaved ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1.5 text-[11px] font-semibold text-brand">
            <Check className="size-3.5" />
            {t("admin.branding.saved")}
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-2xl border border-dashed border-border bg-card p-4">
        <Info className="mt-0.5 size-4 shrink-0 text-brand" />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {t("admin.branding.note_step1")}
        </p>
      </div>

      {/* Page preview with tabs */}
      <SectionLabel>{t("admin.branding.section.preview")}</SectionLabel>
      <div className="flex gap-1.5 overflow-x-auto rounded-full border border-border bg-card p-1">
        {PREVIEW_TABS.map((pt) => (
          <button
            key={pt.id}
            onClick={() => setTab(pt.id)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition ${
              tab === pt.id ? "bg-brand text-white" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(pt.labelKey)}
          </button>
        ))}
      </div>

      <div className="mt-3">
        {tab === "start" && <StartPreview c={colors} typo={typo} t={t} />}
        {tab === "nutrition" && <NutritionPreview c={colors} typo={typo} t={t} />}
        {tab === "fasting" && <FastingPreview c={colors} typo={typo} t={t} />}
        {tab === "fitness" && <FitnessPreview c={colors} typo={typo} t={t} />}
        {tab === "progress" && <ProgressPreview c={colors} typo={typo} t={t} />}
        {tab === "weight" && <WeightPreview c={colors} typo={typo} t={t} />}
      </div>

      {/* Which settings are used on the selected page */}
      <div className="mt-3 rounded-3xl border border-border bg-card p-5">
        <p className="text-[12px] font-semibold">{t("admin.branding.preview.used_here")}</p>
        <ul className="mt-2.5 space-y-2">
          {USED_HERE[tab].map((row) => (
            <li key={row.labelKey} className="flex items-start gap-2.5">
              <span
                className="mt-0.5 size-3.5 shrink-0 rounded-full border border-black/10"
                style={{ backgroundColor: colors[row.color] }}
              />
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">{t(row.labelKey)}</span>
                {" → "}
                {t(row.descKey)}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {/* 1. ALYVA Branding */}
      <SectionLabel>{t("admin.branding.section.branding")}</SectionLabel>
      <Card>
        {BRAND_ROWS.map((row, i) => {
          const isSub = row.key !== "brand-primary";
          const linked = isSub && theme.brandLinks[row.key as BrandColorKey];
          return (
            <div key={row.key}>
              {i > 0 && <Divider />}
              <ColorRow
                label={t(row.labelKey)}
                description={t(row.descKey)}
                usedFor={t("admin.branding.used_for")}
                value={colors[row.key]}
                disabled={linked}
                linked={isSub ? linked : undefined}
                onToggleLink={
                  isSub
                    ? (next) => setLinked(row.key as BrandColorKey, next)
                    : undefined
                }
                followsLabel={t("admin.branding.follows_brand")}
                onChange={(v) => setColor(row.key, v)}
              />
            </div>
          );
        })}
      </Card>

      {/* 2. Component colors */}
      <SectionLabel>{t("admin.branding.section.components")}</SectionLabel>
      <Card>
        {COMPONENT_ROWS.map((row, i) => (
          <div key={row.key}>
            {i > 0 && <Divider />}
            <ColorRow
              label={t(row.labelKey)}
              description={t(row.descKey)}
              usedFor={t("admin.branding.used_for")}
              value={colors[row.key]}
              onChange={(v) => setColor(row.key, v)}
            />
          </div>
        ))}
      </Card>

      {/* 3. Base UI colors */}
      <SectionLabel>{t("admin.branding.section.ui")}</SectionLabel>
      <Card>
        {UI_ROWS.map((row, i) => (
          <div key={row.key}>
            {i > 0 && <Divider />}
            <ColorRow
              label={t(row.labelKey)}
              description={t(row.descKey)}
              usedFor={t("admin.branding.used_for")}
              value={colors[row.key]}
              onChange={(v) => setColor(row.key, v)}
            />
          </div>
        ))}
      </Card>

      {/* 4. Typography */}
      <SectionLabel>{t("admin.branding.section.typography")}</SectionLabel>
      <Card>
        {FONT_ROWS.map((row, i) => (
          <div key={row.key}>
            {i > 0 && <Divider />}
            <div className="px-5 py-3.5">
              <RowHead label={t(row.labelKey)} />
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground/80">{t("admin.branding.used_for")}</span>{" "}
                {t(row.descKey)}
              </p>
              <select
                value={typo[row.key]}
                onChange={(e) => setTypo(row.key, e.target.value)}
                className="mt-2.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-[13px] outline-none"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.id} value={f.stack}>
                    {f.labelKey ? t(f.labelKey) : f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
        {WEIGHT_ROWS.map((row) => (
          <div key={row.key}>
            <Divider />
            <div className="px-5 py-3.5">
              <RowHead label={t(row.labelKey)} />
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground/80">{t("admin.branding.used_for")}</span>{" "}
                {t(row.descKey)}
              </p>
              <select
                value={typo[row.key]}
                onChange={(e) => setTypo(row.key, e.target.value)}
                className="mt-2.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-[13px] outline-none"
              >
                {FONT_WEIGHT_OPTIONS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </Card>

      {/* 5. Reset */}
      <SectionLabel>{t("admin.branding.section.reset")}</SectionLabel>
      <Card>
        <div className="p-5">
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {t("admin.branding.reset.desc")}
          </p>
          <button
            onClick={handleReset}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-[13px] font-semibold transition hover:bg-accent"
          >
            <RotateCcw className="size-4" />
            {t("admin.branding.reset.cta")}
          </button>
        </div>
      </Card>

      {/* 6. Save / discard */}
      <div className="mt-7 rounded-3xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          {dirty ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-destructive">
              <TriangleAlert className="size-3.5" />
              {t("admin.branding.dirty")}
            </span>
          ) : justSaved ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand">
              <Check className="size-3.5" />
              {t("admin.branding.saved")}
            </span>
          ) : null}
        </div>
        <button
          onClick={handleSave}
          disabled={!dirty}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-4 py-3 text-[14px] font-semibold text-white transition enabled:hover:opacity-90 disabled:opacity-40"
        >
          <Check className="size-4" />
          {t("admin.branding.save.cta")}
        </button>
        <button
          onClick={handleDiscard}
          disabled={!dirty}
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-[13px] font-semibold transition enabled:hover:bg-accent disabled:opacity-40"
        >
          {t("admin.branding.discard.cta")}
        </button>
      </div>

      {/* Unsaved-changes guard */}
      {blocker.status === "blocked" && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/40 p-6">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-full bg-destructive/10 text-destructive">
                <TriangleAlert className="size-4" />
              </div>
              <p className="pt-1.5 text-[14px] font-medium leading-relaxed">
                {t("admin.branding.leave.title")}
              </p>
            </div>
            <div className="mt-5 flex flex-col gap-2">
              <button
                onClick={() => blocker.reset()}
                className="inline-flex w-full items-center justify-center rounded-full bg-brand px-4 py-2.5 text-[13px] font-semibold text-white transition hover:opacity-90"
              >
                {t("admin.branding.leave.stay")}
              </button>
              <button
                onClick={() => blocker.proceed()}
                className="inline-flex w-full items-center justify-center rounded-full border border-border bg-background px-4 py-2.5 text-[13px] font-semibold transition hover:bg-accent"
              >
                {t("admin.branding.leave.leave")}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* ---------- Preview building blocks ---------- */

function MockShell({
  c,
  typo,
  children,
}: {
  c: Colors;
  typo: Typo;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-3xl p-3"
      style={{ backgroundColor: c["background-primary"], border: `1px solid ${c["border-default"]}` }}
    >
      <div
        className="relative overflow-hidden rounded-2xl p-4"
        style={{
          backgroundColor: c["background-primary"],
          fontFamily: typo["font-family-body"],
          fontWeight: Number(typo["font-weight-body"]),
          color: c["text-primary"],
        }}
      >
        {children}
      </div>
    </div>
  );
}

function MockHeading({ c, typo, children }: { c: Colors; typo: Typo; children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: typo["font-family-headings"],
        fontWeight: Number(typo["font-weight-headings"]),
        color: c["text-primary"],
        fontSize: 17,
        letterSpacing: "-0.02em",
      }}
    >
      {children}
    </p>
  );
}

function MockCard({ c, children, className }: { c: Colors; children: React.ReactNode; className?: string }) {
  return (
    <div
      className={className ?? "rounded-2xl p-3"}
      style={{
        backgroundColor: c["surface-card"],
        border: `1px solid ${c["border-default"]}`,
        boxShadow: `0 6px 18px -12px ${c["shadow-color"]}33`,
      }}
    >
      {children}
    </div>
  );
}

function MockRing({
  color,
  track,
  pct,
  size = 56,
  stroke = 6,
  children,
}: {
  color: string;
  track: string;
  pct: number;
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
        />
      </svg>
      {children && <div className="absolute inset-0 grid place-items-center">{children}</div>}
    </div>
  );
}

function MockBars({ color, values }: { color: string; values: number[] }) {
  return (
    <div className="flex h-14 items-end gap-1.5">
      {values.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-md"
          style={{ height: `${v}%`, backgroundColor: color, opacity: 0.3 + 0.7 * (v / 100) }}
        />
      ))}
    </div>
  );
}

function MockCta({ c, typo, label, color }: { c: Colors; typo: Typo; label: string; color?: string }) {
  return (
    <div
      className="rounded-full px-4 py-2 text-center text-[12px] text-white"
      style={{
        backgroundColor: color ?? c["brand-action"],
        fontFamily: typo["font-family-buttons"],
        fontWeight: Number(typo["font-weight-buttons"]),
      }}
    >
      {label}
    </div>
  );
}

function MockTip({ c, title, body }: { c: Colors; title: string; body: string }) {
  return (
    <div
      className="rounded-2xl p-3"
      style={{ backgroundColor: `${c["brand-accent"]}14`, border: `1px solid ${c["brand-accent"]}30` }}
    >
      <p className="text-[11px] font-semibold" style={{ color: c["brand-accent"] }}>
        {title}
      </p>
      <p className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed" style={{ color: c["text-secondary"] }}>
        {body}
      </p>
    </div>
  );
}

function StatCard({
  c,
  typo,
  icon: IconCmp,
  color,
  label,
  value,
}: {
  c: Colors;
  typo: Typo;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  label: string;
  value: string;
}) {
  return (
    <MockCard c={c}>
      <div
        className="grid size-7 place-items-center rounded-full"
        style={{ backgroundColor: `${color}1A`, color }}
      >
        <IconCmp className="size-3.5" />
      </div>
      <p className="mt-2 text-[10px]" style={{ color: c["text-muted"] }}>
        {label}
      </p>
      <p
        className="tabular-nums"
        style={{
          fontFamily: typo["font-family-numbers"],
          fontWeight: 700,
          fontSize: 14,
          color: c["text-primary"],
        }}
      >
        {value}
      </p>
    </MockCard>
  );
}

/* ---------- Page previews ---------- */

function StartPreview({ c, typo, t }: { c: Colors; typo: Typo; t: TFunc }) {
  return (
    <MockShell c={c} typo={typo}>
      <div className="flex items-center gap-1.5">
        <span
          className="grid size-5 place-items-center rounded-full"
          style={{ backgroundColor: c["brand-logo"] }}
        >
          <Leaf className="size-3 text-white" />
        </span>
        <span
          style={{
            fontFamily: typo["font-family-headings"],
            fontWeight: 800,
            fontSize: 13,
            letterSpacing: "0.12em",
            color: c["brand-header"],
          }}
        >
          ALYVA
        </span>
      </div>
      <div className="mt-3">
        <MockHeading c={c} typo={typo}>{t("admin.branding.preview.greeting")}</MockHeading>
        <p className="text-[10px]" style={{ color: c["text-muted"] }}>
          {t("dash.overview")}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <StatCard c={c} typo={typo} icon={Flame} color={c["color-calories"]} label={t("home.card.calories")} value={t("admin.branding.preview.numbers")} />
        <StatCard c={c} typo={typo} icon={Hourglass} color={c["color-fasting"]} label={t("home.card.fasting")} value="12:24" />
        <StatCard c={c} typo={typo} icon={Footprints} color={c["color-steps"]} label={t("home.card.steps")} value="6.430" />
        <StatCard c={c} typo={typo} icon={Scale} color={c["color-weight"]} label={t("home.card.weight")} value="72,4 kg" />
      </div>

      <div className="mt-2">
        <MockCard c={c}>
          <div className="flex items-center gap-2.5">
            <div
              className="grid size-8 shrink-0 place-items-center rounded-full"
              style={{ backgroundColor: `${c["color-workout"]}1A`, color: c["color-workout"] }}
            >
              <Dumbbell className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-semibold" style={{ color: c["text-primary"] }}>
                {t("cards.workout")}
              </p>
              <p className="truncate text-[10px]" style={{ color: c["text-muted"] }}>
                {t("fit.own_program")}
              </p>
            </div>
          </div>
          <div className="mt-2.5">
            <MockCta c={c} typo={typo} label={t("admin.branding.preview.start_cta")} />
          </div>
        </MockCard>
      </div>

      <div className="mt-2">
        <MockCard c={c}>
          <p className="text-[11px] font-semibold" style={{ color: c["text-primary"] }}>
            {t("cards.goals")}
          </p>
          <div className="mt-2 flex items-center justify-between">
            {[
              { color: c["color-calories"], pct: 0.72 },
              { color: c["color-fasting"], pct: 0.5 },
              { color: c["color-steps"], pct: 0.64 },
              { color: c["color-workout"], pct: 0.3 },
            ].map((g, i) => (
              <MockRing key={i} color={g.color} track={c["input-background"]} pct={g.pct} size={34} stroke={4} />
            ))}
          </div>
        </MockCard>
      </div>

      <div className="mt-3 flex justify-end">
        <span
          className="grid size-9 place-items-center rounded-full text-white shadow-md"
          style={{ backgroundColor: c["brand-action"] }}
        >
          <Sparkles className="size-4" />
        </span>
      </div>
    </MockShell>
  );
}

function NutritionPreview({ c, typo, t }: { c: Colors; typo: Typo; t: TFunc }) {
  const macros = [
    { label: t("food.protein"), value: "86 g", bg: "#A8C6A2" },
    { label: t("food.carbs"), value: "142 g", bg: "#EBCB85" },
    { label: t("food.fat"), value: "41 g", bg: "#F4E3A8" },
  ];
  return (
    <MockShell c={c} typo={typo}>
      <MockHeading c={c} typo={typo}>{t("admin.branding.tab.nutrition")}</MockHeading>

      <div className="mt-3">
        <MockCard c={c}>
          <div className="flex items-center gap-4">
            <MockRing color={c["color-calories"]} track={c["input-background"]} pct={0.62} size={72} stroke={8}>
              <Flame className="size-5" style={{ color: c["color-calories"] }} />
            </MockRing>
            <div>
              <p
                className="tabular-nums"
                style={{
                  fontFamily: typo["font-family-numbers"],
                  fontWeight: 700,
                  fontSize: 18,
                  color: c["text-primary"],
                }}
              >
                {t("admin.branding.preview.numbers")}
              </p>
              <p className="text-[10px]" style={{ color: c["text-muted"] }}>
                {t("home.card.calories")}
              </p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {macros.map((m) => (
              <div key={m.label} className="rounded-xl p-2 text-center" style={{ backgroundColor: `${m.bg}4D` }}>
                <p className="text-[9px] font-medium" style={{ color: c["text-secondary"] }}>
                  {m.label}
                </p>
                <p className="tabular-nums text-[11px] font-bold" style={{ color: c["text-primary"], fontFamily: typo["font-family-numbers"] }}>
                  {m.value}
                </p>
              </div>
            ))}
          </div>
        </MockCard>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 rounded-2xl p-2.5" style={{ backgroundColor: "#BCD6EF80" }}>
          <Camera className="size-4 shrink-0" style={{ color: "#589AC7" }} />
          <span className="text-[10px] font-semibold" style={{ color: c["text-primary"] }}>
            {t("admin.branding.preview.scan")}
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-2xl p-2.5" style={{ backgroundColor: "#D9CDEF80" }}>
          <CalendarDays className="size-4 shrink-0" style={{ color: "#9882C1" }} />
          <span className="text-[10px] font-semibold" style={{ color: c["text-primary"] }}>
            {t("admin.branding.preview.mealplan")}
          </span>
        </div>
      </div>

      <div className="mt-2">
        <MockTip c={c} title={t("fit.tipTitle")} body={t("fast.tip.1")} />
      </div>
    </MockShell>
  );
}

function FastingPreview({ c, typo, t }: { c: Colors; typo: Typo; t: TFunc }) {
  return (
    <MockShell c={c} typo={typo}>
      <MockHeading c={c} typo={typo}>{t("admin.branding.tab.fasting")}</MockHeading>

      <div className="mt-3">
        <MockCard c={c}>
          <div className="flex flex-col items-center py-1">
            <MockRing color={c["color-fasting"]} track={c["input-background"]} pct={0.68} size={92} stroke={8}>
              <div className="text-center">
                <p
                  className="tabular-nums"
                  style={{
                    fontFamily: typo["font-family-numbers"],
                    fontWeight: 700,
                    fontSize: 16,
                    color: c["text-primary"],
                  }}
                >
                  12:24
                </p>
                <p className="text-[9px]" style={{ color: c["text-muted"] }}>
                  {t("fast.elapsed")}
                </p>
              </div>
            </MockRing>
          </div>
          <div className="mt-3 flex justify-center gap-1.5">
            {["14:10", "16:8", "18:6"].map((p, i) => (
              <span
                key={p}
                className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
                style={
                  i === 1
                    ? { backgroundColor: c["color-fasting"], color: "#FFFFFF" }
                    : { backgroundColor: c["input-background"], color: c["text-muted"] }
                }
              >
                {p}
              </span>
            ))}
          </div>
          <div className="mt-3">
            <MockCta c={c} typo={typo} label={t("fast.startBtn")} />
          </div>
        </MockCard>
      </div>

      <div className="mt-2">
        <MockTip c={c} title={t("fast.tipTitle")} body={t("fast.tip.3")} />
      </div>
    </MockShell>
  );
}

function FitnessPreview({ c, typo, t }: { c: Colors; typo: Typo; t: TFunc }) {
  return (
    <MockShell c={c} typo={typo}>
      <MockHeading c={c} typo={typo}>{t("admin.branding.tab.fitness")}</MockHeading>

      <div className="mt-3">
        <MockCard c={c}>
          <div className="flex items-center gap-2.5">
            <div
              className="grid size-8 shrink-0 place-items-center rounded-full"
              style={{ backgroundColor: `${c["color-workout"]}1A`, color: c["color-workout"] }}
            >
              <Dumbbell className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-semibold" style={{ color: c["text-primary"] }}>
                {t("fit.own_program")}
              </p>
              <p className="text-[10px]" style={{ color: c["text-muted"] }}>
                {t("fit.this_week")}
              </p>
            </div>
          </div>
          <div className="mt-2.5 space-y-1.5">
            {["Bench Press", "Squat"].map((ex) => (
              <div
                key={ex}
                className="flex items-center justify-between rounded-xl px-2.5 py-2"
                style={{ backgroundColor: c["input-background"] }}
              >
                <span className="text-[10px] font-medium" style={{ color: c["text-primary"] }}>
                  {ex}
                </span>
                <span className="text-[10px] tabular-nums" style={{ color: c["text-muted"] }}>
                  3 × 10
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2.5">
            <MockCta c={c} typo={typo} label={t("admin.branding.preview.start_cta")} color={c["color-workout"]} />
          </div>
        </MockCard>
      </div>

      <div className="mt-2">
        <MockTip c={c} title={t("fit.tipTitle")} body={t("fit.tip.1")} />
      </div>
    </MockShell>
  );
}

function ProgressPreview({ c, typo, t }: { c: Colors; typo: Typo; t: TFunc }) {
  return (
    <MockShell c={c} typo={typo}>
      <MockHeading c={c} typo={typo}>{t("admin.branding.tab.progress")}</MockHeading>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <StatCard c={c} typo={typo} icon={Footprints} color={c["color-steps"]} label={t("home.card.steps")} value="6.430" />
        <StatCard c={c} typo={typo} icon={Scale} color={c["color-weight"]} label={t("home.card.weight")} value="72,4 kg" />
      </div>

      <div className="mt-2">
        <MockCard c={c}>
          <p className="text-[11px] font-semibold" style={{ color: c["text-primary"] }}>
            {t("fit.this_week")}
          </p>
          <div className="mt-2">
            <MockBars color={c["color-steps"]} values={[45, 70, 55, 90, 62, 80, 50]} />
          </div>
          <div className="mt-1.5">
            <MockBars color={c["color-workout"]} values={[30, 50, 40, 75, 60, 0, 45]} />
          </div>
        </MockCard>
      </div>
    </MockShell>
  );
}

function WeightPreview({ c, typo, t }: { c: Colors; typo: Typo; t: TFunc }) {
  return (
    <MockShell c={c} typo={typo}>
      <MockHeading c={c} typo={typo}>{t("admin.branding.tab.weight")}</MockHeading>

      <div className="mt-3">
        <MockCard c={c}>
          <div className="flex items-center gap-4">
            <MockRing color={c["color-weight"]} track={c["input-background"]} pct={0.55} size={72} stroke={8}>
              <Scale className="size-5" style={{ color: c["color-weight"] }} />
            </MockRing>
            <div>
              <p
                className="tabular-nums"
                style={{
                  fontFamily: typo["font-family-numbers"],
                  fontWeight: 700,
                  fontSize: 20,
                  color: c["text-primary"],
                }}
              >
                72,4 kg
              </p>
              <p className="text-[10px]" style={{ color: c["text-muted"] }}>
                {t("dash.progress.change")}: -1,2 kg
              </p>
            </div>
          </div>
          <div className="mt-3">
            <MockBars color={c["color-weight"]} values={[88, 82, 79, 74, 70, 66, 62]} />
          </div>
          <div className="mt-3">
            <MockCta c={c} typo={typo} label={t("admin.branding.preview.button")} />
          </div>
        </MockCard>
      </div>
    </MockShell>
  );
}

/* ---------- UI helpers ---------- */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 mt-7 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </h2>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card">
      {children}
    </div>
  );
}

function Divider() {
  return <div className="mx-5 h-px bg-border" />;
}

function RowHead({ label }: { label: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <p className="font-display text-[14px] font-semibold tracking-tight">{label}</p>
    </div>
  );
}

function ColorRow({
  label,
  description,
  usedFor,
  value,
  onChange,
  disabled,
  linked,
  onToggleLink,
  followsLabel,
}: {
  label: string;
  description: string;
  usedFor: string;
  value: string;
  onChange: (hex: string) => void;
  disabled?: boolean;
  linked?: boolean;
  onToggleLink?: (linked: boolean) => void;
  followsLabel?: string;
}) {
  const hex = value.toUpperCase();
  return (
    <div className="px-5 py-3.5">
      <RowHead label={label} />
      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground/80">{usedFor}</span>{" "}
        {description}
      </p>
      <div className="mt-2.5 flex items-center gap-2">
        <label
          className={`relative inline-flex size-9 shrink-0 overflow-hidden rounded-xl border border-border ${
            disabled ? "opacity-50" : "cursor-pointer"
          }`}
          style={{ backgroundColor: value }}
        >
          <input
            type="color"
            value={normalizeHex(value)}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
            aria-label={label}
          />
        </label>
        <input
          type="text"
          value={hex}
          disabled={disabled}
          onChange={(e) => {
            const v = e.target.value.trim();
            if (/^#?[0-9a-fA-F]{6}$/.test(v)) {
              onChange((v.startsWith("#") ? v : `#${v}`).toUpperCase());
            }
          }}
          className="w-24 rounded-xl border border-border bg-background px-2.5 py-2 font-mono text-[12px] outline-none disabled:opacity-50"
        />
        {onToggleLink && (
          <button
            onClick={() => onToggleLink(!linked)}
            className={`ml-auto inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] font-medium transition ${
              linked
                ? "border-brand/30 bg-brand/10 text-brand"
                : "border-border bg-background text-muted-foreground hover:text-foreground"
            }`}
          >
            {linked ? <Link2 className="size-3" /> : <Link2Off className="size-3" />}
            {followsLabel}
          </button>
        )}
      </div>
    </div>
  );
}

function normalizeHex(v: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(v) ? v : "#000000";
}
