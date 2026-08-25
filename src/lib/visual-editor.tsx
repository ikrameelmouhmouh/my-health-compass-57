import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  effectiveColors,
  getDefaultDesignConfig,
  loadDesignConfig,
  saveDesignConfig,
  type ColorTokenKey,
  type DesignConfig,
  type ThemeMode,
  type TypographyTokenKey,
} from "@/lib/design-tokens";

/**
 * Central visual-editor state.
 *
 * - `saved` is what the real app uses (persisted).
 * - `draft` is the temporary editing session; it is previewed live but never
 *   persisted until `save()` is called explicitly.
 */

interface VisualEditorValue {
  saved: DesignConfig;
  draft: DesignConfig;
  dirty: boolean;
  mode: ThemeMode;
  setColor: (key: ColorTokenKey, hex: string) => void;
  setTypography: (key: TypographyTokenKey, value: string) => void;
  save: () => void;
  discard: () => void;
  resetDefaults: () => void;
}

const Ctx = createContext<VisualEditorValue | undefined>(undefined);

/* ---------- token → CSS variable mapping ---------- */

const COLOR_VARS: Record<ColorTokenKey, string[]> = {
  "brand-primary": ["--brand", "--alyva", "--ring", "--primary-foreground"],
  "brand-logo": ["--alyva"],
  "brand-header": ["--brand"],
  "brand-action": ["--primary-foreground"],
  "brand-accent": ["--ring"],
  "color-calories": ["--acc-nutrition"],
  "color-fasting": ["--acc-fasting"],
  "color-steps": ["--acc-water"],
  "color-weight": ["--acc-weight"],
  "color-workout": ["--acc-fitness"],
  "background-primary": ["--background"],
  "surface-card": ["--card", "--popover"],
  "text-primary": ["--foreground", "--card-foreground", "--popover-foreground"],
  "text-secondary": ["--secondary-foreground"],
  "text-muted": ["--muted-foreground"],
  "border-default": ["--border"],
  "divider-line": ["--hairline"],
  "input-background": ["--input"],
  "shadow-color": [],
};

export function buildCss(config: DesignConfig, mode: ThemeMode): string {
  const defaults = getDefaultDesignConfig().themes[mode];
  const theme = config.themes[mode];
  const colors = effectiveColors(theme);
  const defColors = effectiveColors(defaults);

  const vars: string[] = [];
  for (const key of Object.keys(colors) as ColorTokenKey[]) {
    if (colors[key].toLowerCase() === defColors[key].toLowerCase()) continue;
    for (const v of COLOR_VARS[key]) vars.push(`${v}: ${colors[key]};`);
  }

  const typo = theme.typography;
  const defTypo = defaults.typography;
  const changed = (k: TypographyTokenKey) => typo[k] !== defTypo[k];

  if (changed("font-family-primary")) vars.push(`--font-sans: ${typo["font-family-primary"]};`);
  if (changed("font-family-headings")) vars.push(`--font-display: ${typo["font-family-headings"]};`);

  const rules: string[] = [];
  if (vars.length) rules.push(`:root, .dark { ${vars.join(" ")} }`);
  if (changed("font-family-body") || changed("font-weight-body")) {
    const decl = [
      changed("font-family-body") ? `font-family: ${typo["font-family-body"]};` : "",
      changed("font-weight-body") ? `font-weight: ${typo["font-weight-body"]};` : "",
    ].join(" ");
    rules.push(`body { ${decl} }`);
  }
  if (changed("font-weight-headings")) {
    rules.push(`h1, h2, h3, h4, h5, h6 { font-weight: ${typo["font-weight-headings"]}; }`);
  }
  if (changed("font-family-buttons") || changed("font-weight-buttons")) {
    const decl = [
      changed("font-family-buttons") ? `font-family: ${typo["font-family-buttons"]};` : "",
      changed("font-weight-buttons") ? `font-weight: ${typo["font-weight-buttons"]};` : "",
    ].join(" ");
    rules.push(`button, [role="button"] { ${decl} }`);
  }
  const scale = Number(typo["font-size-scale"] ?? "100");
  if (!Number.isNaN(scale) && scale !== 100) {
    rules.push(`html { font-size: ${(16 * scale) / 100}px; }`);
  }
  return rules.join("\n");
}

function clone(c: DesignConfig): DesignConfig {
  return JSON.parse(JSON.stringify(c));
}

export function VisualEditorProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<DesignConfig>(() => getDefaultDesignConfig());
  const [draft, setDraft] = useState<DesignConfig>(() => getDefaultDesignConfig());
  const [hydrated, setHydrated] = useState(false);
  const [mode, setMode] = useState<ThemeMode>("light");

  useEffect(() => {
    const stored = loadDesignConfig();
    setSaved(stored);
    setDraft(clone(stored));
    setHydrated(true);
    const isDark = document.documentElement.classList.contains("dark");
    setMode(isDark ? "dark" : "light");
    const obs = new MutationObserver(() => {
      setMode(document.documentElement.classList.contains("dark") ? "dark" : "light");
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const dirty = useMemo(
    () => hydrated && JSON.stringify(saved) !== JSON.stringify(draft),
    [hydrated, saved, draft],
  );

  // Live preview: draft when editing, saved otherwise.
  useEffect(() => {
    if (!hydrated || typeof document === "undefined") return;
    const id = "alyva-visual-editor-style";
    let el = document.getElementById(id) as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement("style");
      el.id = id;
      document.head.appendChild(el);
    }
    el.textContent = buildCss(draft, mode);
  }, [draft, mode, hydrated]);

  const setColor = useCallback((key: ColorTokenKey, hex: string) => {
    setDraft((prev) => {
      const next = clone(prev);
      for (const m of ["light", "dark"] as ThemeMode[]) {
        if (m !== (document.documentElement.classList.contains("dark") ? "dark" : "light")) continue;
        next.themes[m].colors[key] = hex;
        if (key === "brand-primary") {
          for (const k of Object.keys(next.themes[m].brandLinks) as (keyof typeof next.themes.light.brandLinks)[]) {
            if (next.themes[m].brandLinks[k]) next.themes[m].colors[k] = hex;
          }
        } else if (k_isBrandSub(key)) {
          next.themes[m].brandLinks[key as never] = false;
        }
      }
      return next;
    });
  }, []);

  const setTypography = useCallback((key: TypographyTokenKey, value: string) => {
    setDraft((prev) => {
      const next = clone(prev);
      for (const m of ["light", "dark"] as ThemeMode[]) next.themes[m].typography[key] = value;
      return next;
    });
  }, []);

  const save = useCallback(() => {
    setDraft((d) => {
      saveDesignConfig(d);
      setSaved(clone(d));
      return d;
    });
  }, []);

  const discard = useCallback(() => setDraft(clone(saved)), [saved]);

  const resetDefaults = useCallback(() => setDraft(getDefaultDesignConfig()), []);

  const value: VisualEditorValue = {
    saved,
    draft,
    dirty,
    mode,
    setColor,
    setTypography,
    save,
    discard,
    resetDefaults,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function k_isBrandSub(key: ColorTokenKey) {
  return key === "brand-logo" || key === "brand-header" || key === "brand-action" || key === "brand-accent";
}

export function useVisualEditor() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useVisualEditor must be used within VisualEditorProvider");
  return ctx;
}
