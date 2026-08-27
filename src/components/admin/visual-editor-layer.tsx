import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBlocker } from "@tanstack/react-router";
import { Check, Palette, RotateCcw, Type, X } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { useAppMode } from "@/hooks/use-app-mode";
import { useVisualEditor } from "@/lib/visual-editor";
import {
  effectiveColors,
  FONT_OPTIONS,
  type ColorTokenKey,
  type TypographyTokenKey,
} from "@/lib/design-tokens";
import { colorDistance, hexToRgb, parseCssColor } from "@/lib/color-utils";

const TOKEN_LABEL: Record<ColorTokenKey, string> = {
  "brand-primary": "admin.branding.brand.primary",
  "brand-logo": "admin.branding.brand.logo",
  "brand-header": "admin.branding.brand.header",
  "brand-action": "admin.branding.brand.action",
  "brand-accent": "admin.branding.brand.accent",
  "color-calories": "admin.branding.comp.calories",
  "color-fasting": "admin.branding.comp.fasting",
  "color-steps": "admin.branding.comp.steps",
  "color-weight": "admin.branding.comp.weight",
  "color-workout": "admin.branding.comp.workout",
  "background-primary": "admin.branding.ui.background",
  "surface-card": "admin.branding.ui.card",
  "text-primary": "admin.branding.ui.text_primary",
  "text-secondary": "admin.branding.ui.text_secondary",
  "text-muted": "admin.branding.ui.text_muted",
  "border-default": "admin.branding.ui.border",
  "divider-line": "admin.branding.ui.divider",
  "input-background": "admin.branding.ui.input",
  "shadow-color": "admin.branding.ui.shadow",
};

interface Selection {
  rect: { top: number; left: number; width: number; height: number };
  tag: string;
  tokens: ColorTokenKey[];
}

export function VisualEditorLayer() {
  const t = useT();
  const { isAdmin } = useIsAdmin();
  const { mode: appMode } = useAppMode();
  const { draft, dirty, mode, setColor, setTypography, save, discard, resetDefaults } =
    useVisualEditor();

  const active = isAdmin && appMode === "edit";
  const [sel, setSel] = useState<Selection | null>(null);
  const lastTap = useRef(0);

  const colors = useMemo(() => effectiveColors(draft.themes[mode]), [draft, mode]);

  const matchTokens = useCallback(
    (el: Element): ColorTokenKey[] => {
      const cs = window.getComputedStyle(el);
      const found: ColorTokenKey[] = [];
      const candidates = [cs.color, cs.backgroundColor, cs.borderTopColor];
      for (const raw of candidates) {
        const rgb = parseCssColor(raw);
        if (!rgb) continue;
        let best: ColorTokenKey | null = null;
        let bestD = 26;
        for (const key of Object.keys(colors) as ColorTokenKey[]) {
          const tokenRgb = hexToRgb(colors[key]);
          if (!tokenRgb) continue;
          const d = colorDistance(rgb, tokenRgb);
          if (d < bestD) {
            bestD = d;
            best = key;
          }
        }
        if (best && !found.includes(best)) found.push(best);
      }
      return found;
    },
    [colors],
  );

  const select = useCallback(
    (target: EventTarget | null) => {
      if (!(target instanceof Element)) return;
      if (target.closest("[data-visual-editor]")) return;
      const r = target.getBoundingClientRect();
      setSel({
        rect: { top: r.top, left: r.left, width: r.width, height: r.height },
        tag: target.tagName.toLowerCase(),
        tokens: matchTokens(target),
      });
    },
    [matchTokens],
  );

  useEffect(() => {
    if (!active) {
      setSel(null);
      return;
    }
    const onContext = (e: MouseEvent) => {
      if ((e.target as Element)?.closest?.("[data-visual-editor]")) return;
      e.preventDefault();
      select(e.target);
    };
    const onPointerDown = (e: PointerEvent) => {
      if ((e.target as Element)?.closest?.("[data-visual-editor]")) return;
      const now = Date.now();
      if (now - lastTap.current < 320) {
        e.preventDefault();
        select(e.target);
        lastTap.current = 0;
      } else {
        lastTap.current = now;
      }
    };
    document.addEventListener("contextmenu", onContext);
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("contextmenu", onContext);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [active, select]);

  // Guard navigation while there are unsaved design changes.
  useBlocker({
    shouldBlockFn: () => {
      if (!active || !dirty) return false;
      return !window.confirm(t("admin.visual.leave"));
    },
    enableBeforeUnload: () => active && dirty,
  });

  if (!active) return null;

  const scale = Number(
    (draft.themes[mode].typography as Record<string, string>)["font-size-scale"] ?? "100",
  );

  return (
    <>
      {sel && (
        <div
          data-visual-editor
          className="pointer-events-none fixed z-[70] rounded-lg ring-2 ring-brand"
          style={{ top: sel.rect.top, left: sel.rect.left, width: sel.rect.width, height: sel.rect.height }}
        />
      )}

      {sel && (
        <div
          data-visual-editor
          className="fixed inset-x-0 bottom-0 z-[80] mx-auto max-h-[70dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-border bg-card p-5 shadow-2xl"
        >
          <div className="flex items-center gap-2">
            <Palette className="size-4 text-brand" />
            <p className="flex-1 font-display text-[14px] font-semibold tracking-tight">
              {t("admin.visual.title")}
            </p>
            <button
              onClick={() => setSel(null)}
              aria-label={t("admin.visual.close")}
              className="inline-flex size-8 items-center justify-center rounded-full border border-border"
            >
              <X className="size-4" />
            </button>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {t("admin.visual.element")}: &lt;{sel.tag}&gt;
          </p>

          {sel.tokens.length === 0 ? (
            <p className="mt-4 text-[12px] text-muted-foreground">{t("admin.visual.no_token")}</p>
          ) : (
            <div className="mt-4 space-y-3">
              {sel.tokens.map((key) => (
                <label
                  key={key}
                  className="flex items-center gap-3 rounded-2xl border border-border p-3"
                >
                  <input
                    type="color"
                    value={colors[key]}
                    onChange={(e) => setColor(key, e.target.value)}
                    className="size-8 cursor-pointer rounded-lg border border-border bg-transparent"
                  />
                  <span className="min-w-0 flex-1 text-[12px] font-medium">{t(TOKEN_LABEL[key])}</span>
                  <span className="text-[11px] uppercase text-muted-foreground">{colors[key]}</span>
                </label>
              ))}
            </div>
          )}

          <div className="mt-4 rounded-2xl border border-border p-3">
            <div className="flex items-center gap-2">
              <Type className="size-3.5 text-muted-foreground" />
              <span className="flex-1 text-[12px] font-medium">{t("admin.branding.type.primary")}</span>
            </div>
            <select
              value={
                FONT_OPTIONS.find(
                  (f) => f.stack === draft.themes[mode].typography["font-family-primary"],
                )?.id ?? "system"
              }
              onChange={(e) => {
                const opt = FONT_OPTIONS.find((f) => f.id === e.target.value);
                if (opt) setTypography("font-family-primary", opt.stack);
              }}
              className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-[12px]"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.labelKey ? t(f.labelKey) : f.label}
                </option>
              ))}
            </select>

            <div className="mt-3 flex items-center gap-3">
              <span className="text-[12px] font-medium">{t("admin.visual.font_size")}</span>
              <input
                type="range"
                min={85}
                max={120}
                step={5}
                value={Number.isNaN(scale) ? 100 : scale}
                onChange={(e) =>
                  setTypography("font-size-scale" as TypographyTokenKey, e.target.value)
                }
                className="flex-1"
              />
              <span className="w-10 text-right text-[11px] text-muted-foreground">{scale}%</span>
            </div>
          </div>

          <button
            onClick={resetDefaults}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-border px-4 py-2 text-[12px] font-semibold"
          >
            <RotateCcw className="size-3.5" />
            {t("admin.visual.reset")}
          </button>
        </div>
      )}

      {dirty && (
        <div
          data-visual-editor
          className="fixed inset-x-0 bottom-0 z-[90] mx-auto flex w-full max-w-md items-center gap-2 border-t border-border bg-card/95 p-3 backdrop-blur"
        >
          <span className="flex-1 text-[11px] font-medium text-muted-foreground">
            {t("admin.visual.dirty")}
          </span>
          <button
            onClick={discard}
            className="rounded-full border border-border px-3 py-2 text-[12px] font-semibold"
          >
            {t("admin.visual.discard")}
          </button>
          <button
            onClick={save}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-[12px] font-semibold text-primary-foreground"
          >
            <Check className="size-3.5" />
            {t("admin.visual.save")}
          </button>
        </div>
      )}
    </>
  );
}
