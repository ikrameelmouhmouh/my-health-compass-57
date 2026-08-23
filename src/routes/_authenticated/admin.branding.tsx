import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useT } from "@/lib/i18n";
import {
  ChevronLeft, Loader2, Shield, Palette, RotateCcw, Link2, Link2Off, Info,
} from "lucide-react";
import {
  useDesignTokens,
  effectiveColors,
  FONT_OPTIONS,
  FONT_WEIGHT_OPTIONS,
  type BrandColorKey,
  type ColorTokenKey,
  type FontTokenKey,
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

function AdminBrandingPage() {
  const { user } = useAuth();
  const t = useT();
  const navigate = useNavigate();
  const { config, update, reset } = useDesignTokens();

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

  const theme = config.themes.light;
  const colors = effectiveColors(theme);
  const typo = theme.typography;

  const setColor = (key: ColorTokenKey, value: string) =>
    update((d) => {
      d.themes.light.colors[key] = value;
    });

  const setLinked = (key: BrandColorKey, linked: boolean) =>
    update((d) => {
      d.themes.light.brandLinks[key] = linked;
      if (linked) d.themes.light.colors[key] = d.themes.light.colors["brand-primary"];
    });

  const setTypo = (key: FontTokenKey | WeightTokenKey, value: string) =>
    update((d) => {
      d.themes.light.typography[key] = value;
    });

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

      <div className="mt-4 flex items-start gap-2 rounded-2xl border border-dashed border-border bg-card p-4">
        <Info className="mt-0.5 size-4 shrink-0 text-brand" />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {t("admin.branding.note_step1")}
        </p>
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

      {/* 5. Preview */}
      <SectionLabel>{t("admin.branding.section.preview")}</SectionLabel>
      <div
        className="rounded-3xl p-5"
        style={{ backgroundColor: colors["background-primary"], border: `1px solid ${colors["border-default"]}` }}
      >
        <div
          className="rounded-2xl p-5"
          style={{
            backgroundColor: colors["surface-card"],
            border: `1px solid ${colors["border-default"]}`,
            boxShadow: `0 8px 24px -12px ${colors["shadow-color"]}33`,
            fontFamily: typo["font-family-body"],
          }}
        >
          <p
            style={{
              fontFamily: typo["font-family-headings"],
              fontWeight: Number(typo["font-weight-headings"]),
              color: colors["text-primary"],
              fontSize: 20,
              letterSpacing: "-0.02em",
            }}
          >
            {t("admin.branding.preview.heading")}
          </p>
          <p className="mt-2 text-[14px] leading-relaxed" style={{ color: colors["text-primary"] }}>
            {t("admin.branding.preview.body")}
          </p>
          <p className="mt-2 text-[13px]" style={{ color: colors["text-secondary"] }}>
            {t("admin.branding.preview.secondary")}
          </p>
          <p className="mt-1 text-[12px]" style={{ color: colors["text-muted"] }}>
            {t("admin.branding.preview.muted")}
          </p>

          <div className="my-4" style={{ height: 1, backgroundColor: colors["divider-line"] }} />

          <div
            className="rounded-xl px-3 py-2 text-[13px]"
            style={{ backgroundColor: colors["input-background"], color: colors["text-muted"] }}
          >
            {t("admin.branding.preview.input")}
          </div>

          <p
            className="mt-4 text-[22px] tabular-nums"
            style={{
              fontFamily: typo["font-family-numbers"],
              fontWeight: 700,
              color: colors["color-calories"],
            }}
          >
            {t("admin.branding.preview.numbers")}
          </p>

          <button
            className="mt-4 w-full rounded-full px-4 py-2.5 text-[14px] text-white"
            style={{
              backgroundColor: colors["brand-action"],
              fontFamily: typo["font-family-buttons"],
              fontWeight: Number(typo["font-weight-buttons"]),
            }}
          >
            {t("admin.branding.preview.button")}
          </button>

          <div className="mt-4 flex flex-wrap gap-2">
            {COMPONENT_ROWS.map((row) => (
              <span
                key={row.key}
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                style={{
                  backgroundColor: `${colors[row.key]}22`,
                  color: colors[row.key],
                  border: `1px solid ${colors[row.key]}55`,
                }}
              >
                {t(row.labelKey)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 6. Reset */}
      <SectionLabel>{t("admin.branding.section.reset")}</SectionLabel>
      <Card>
        <div className="p-5">
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {t("admin.branding.reset.desc")}
          </p>
          <button
            onClick={reset}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-[13px] font-semibold transition hover:bg-accent"
          >
            <RotateCcw className="size-4" />
            {t("admin.branding.reset.cta")}
          </button>
        </div>
      </Card>
    </main>
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
  value,
  onChange,
  disabled,
  linked,
  onToggleLink,
  followsLabel,
}: {
  label: string;
  description: string;
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
        <span className="font-medium text-foreground/80">{tLabel("used_for")}</span>{" "}
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

function tLabel(key: "used_for"): string {
  // Helper used inside ColorRow because useT must be called at top level of a component.
  // We render ColorRow inside AdminBrandingPage, so this hook call is valid.
  return useT()(`admin.branding.${key}`);
}

function normalizeHex(v: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(v) ? v : "#000000";
}
