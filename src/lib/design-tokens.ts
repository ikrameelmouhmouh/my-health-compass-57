import { useCallback, useEffect, useState } from "react";

/**
 * Central ALYVA design-token configuration.
 *
 * Step 1: this module only stores and exposes the token structure.
 * Existing app screens are NOT wired to these tokens yet — that happens in a
 * later step. The structure is semantic (names describe function, not color)
 * and extensible: every theme mode (light/dark/future) holds a full token set.
 */

/* ---------- Token keys (semantic, function-based) ---------- */

export type BrandColorKey =
  | "brand-logo"
  | "brand-header"
  | "brand-action"
  | "brand-accent";

export type ComponentColorKey =
  | "color-calories"
  | "color-fasting"
  | "color-steps"
  | "color-weight"
  | "color-workout";

export type UiColorKey =
  | "background-primary"
  | "surface-card"
  | "text-primary"
  | "text-secondary"
  | "text-muted"
  | "border-default"
  | "divider-line"
  | "input-background"
  | "shadow-color";

export type ColorTokenKey = "brand-primary" | BrandColorKey | ComponentColorKey | UiColorKey;

export type FontTokenKey =
  | "font-family-primary"
  | "font-family-headings"
  | "font-family-body"
  | "font-family-buttons"
  | "font-family-numbers";

export type WeightTokenKey =
  | "font-weight-headings"
  | "font-weight-body"
  | "font-weight-buttons";

export type TypographyTokenKey = FontTokenKey | WeightTokenKey;

/* ---------- Config shape ---------- */

export interface ThemeTokens {
  colors: Record<ColorTokenKey, string>;
  typography: Record<TypographyTokenKey, string>;
  /**
   * Branding sub-colors that automatically follow `brand-primary`.
   * When a link is true, the stored value is ignored and the effective
   * value always equals brand-primary.
   */
  brandLinks: Record<BrandColorKey, boolean>;
}

export type ThemeMode = "light" | "dark";

export interface DesignConfig {
  version: 1;
  themes: Record<ThemeMode, ThemeTokens>;
}

/* ---------- Font options ---------- */

export interface FontOption {
  id: string;
  /** i18n key when set, otherwise `label` */
  labelKey?: string;
  label?: string;
  stack: string;
}

export const SYSTEM_FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export const FONT_OPTIONS: FontOption[] = [
  { id: "system", labelKey: "admin.branding.font.system", stack: SYSTEM_FONT_STACK },
  { id: "inter", label: "Inter", stack: '"Inter", sans-serif' },
  { id: "poppins", label: "Poppins", stack: '"Poppins", sans-serif' },
  { id: "nunito", label: "Nunito", stack: '"Nunito", sans-serif' },
  { id: "serif", label: "Georgia (serif)", stack: 'Georgia, "Times New Roman", serif' },
];

export const FONT_WEIGHT_OPTIONS = ["300", "400", "500", "600", "700", "800"] as const;

/* ---------- Defaults ---------- */

const BRAND_DEFAULT = "#68775B";

const LIGHT_COLORS: Record<ColorTokenKey, string> = {
  // ALYVA branding
  "brand-primary": BRAND_DEFAULT,
  "brand-logo": BRAND_DEFAULT,
  "brand-header": BRAND_DEFAULT,
  "brand-action": BRAND_DEFAULT,
  "brand-accent": BRAND_DEFAULT,
  // Component colors (named by function)
  "color-calories": BRAND_DEFAULT,
  "color-fasting": "#9882C1",
  "color-steps": "#589AC7",
  "color-weight": "#DD9562",
  "color-workout": "#589AC7",
  // Base UI colors
  "background-primary": "#FFFFFF",
  "surface-card": "#FFFFFF",
  "text-primary": "#181B1F",
  "text-secondary": "#1F2227",
  "text-muted": "#6E7279",
  "border-default": "#E5E6E9",
  "divider-line": "#E5E6E9",
  "input-background": "#EAEBEE",
  "shadow-color": "#000000",
};

const DARK_COLORS: Record<ColorTokenKey, string> = {
  "brand-primary": BRAND_DEFAULT,
  "brand-logo": BRAND_DEFAULT,
  "brand-header": BRAND_DEFAULT,
  "brand-action": BRAND_DEFAULT,
  "brand-accent": BRAND_DEFAULT,
  "color-calories": BRAND_DEFAULT,
  "color-fasting": "#9882C1",
  "color-steps": "#589AC7",
  "color-weight": "#DD9562",
  "color-workout": "#589AC7",
  "background-primary": "#000000",
  "surface-card": "#1C1C1E",
  "text-primary": "#FFFFFF",
  "text-secondary": "#FFFFFF",
  "text-muted": "#98989F",
  "border-default": "#38383A",
  "divider-line": "#38383A",
  "input-background": "#2C2C2E",
  "shadow-color": "#000000",
};

const DEFAULT_TYPOGRAPHY: Record<TypographyTokenKey, string> = {
  "font-family-primary": SYSTEM_FONT_STACK,
  "font-family-headings": SYSTEM_FONT_STACK,
  "font-family-body": SYSTEM_FONT_STACK,
  "font-family-buttons": SYSTEM_FONT_STACK,
  "font-family-numbers": SYSTEM_FONT_STACK,
  "font-weight-headings": "700",
  "font-weight-body": "400",
  "font-weight-buttons": "600",
};

const DEFAULT_BRAND_LINKS: Record<BrandColorKey, boolean> = {
  "brand-logo": true,
  "brand-header": true,
  "brand-action": true,
  "brand-accent": true,
};

function defaultTheme(colors: Record<ColorTokenKey, string>): ThemeTokens {
  return {
    colors: { ...colors },
    typography: { ...DEFAULT_TYPOGRAPHY },
    brandLinks: { ...DEFAULT_BRAND_LINKS },
  };
}

export function getDefaultDesignConfig(): DesignConfig {
  return {
    version: 1,
    themes: {
      light: defaultTheme(LIGHT_COLORS),
      dark: defaultTheme(DARK_COLORS),
    },
  };
}

/* ---------- Effective values ---------- */

/** Colors with linked branding values resolved to brand-primary. */
export function effectiveColors(theme: ThemeTokens): Record<ColorTokenKey, string> {
  const out = { ...theme.colors };
  for (const key of Object.keys(theme.brandLinks) as BrandColorKey[]) {
    if (theme.brandLinks[key]) out[key] = theme.colors["brand-primary"];
  }
  return out;
}

/* ---------- Storage ---------- */

const STORAGE_KEY = "alyva.design_tokens";
const EVENT = "alyva:design-tokens";

/** Merge stored config over defaults so new tokens added later always exist. */
function mergeWithDefaults(stored: unknown): DesignConfig {
  const base = getDefaultDesignConfig();
  if (!stored || typeof stored !== "object") return base;
  const s = stored as Partial<DesignConfig>;
  for (const mode of ["light", "dark"] as ThemeMode[]) {
    const t = s.themes?.[mode];
    if (!t) continue;
    base.themes[mode] = {
      colors: { ...base.themes[mode].colors, ...(t.colors ?? {}) },
      typography: { ...base.themes[mode].typography, ...(t.typography ?? {}) },
      brandLinks: { ...base.themes[mode].brandLinks, ...(t.brandLinks ?? {}) },
    };
  }
  return base;
}

export function loadDesignConfig(): DesignConfig {
  if (typeof window === "undefined") return getDefaultDesignConfig();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultDesignConfig();
    return mergeWithDefaults(JSON.parse(raw));
  } catch {
    return getDefaultDesignConfig();
  }
}

export function saveDesignConfig(config: DesignConfig): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  window.dispatchEvent(new Event(EVENT));
}

export function resetDesignConfig(): DesignConfig {
  const fresh = getDefaultDesignConfig();
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    window.dispatchEvent(new Event(EVENT));
  }
  return fresh;
}

/* ---------- React hook ---------- */

export function useDesignTokens() {
  const [config, setConfig] = useState<DesignConfig>(() => loadDesignConfig());

  useEffect(() => {
    const sync = () => setConfig(loadDesignConfig());
    window.addEventListener("storage", sync);
    window.addEventListener(EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EVENT, sync);
    };
  }, []);

  const update = useCallback((mutate: (draft: DesignConfig) => void) => {
    setConfig((prev) => {
      const draft: DesignConfig = JSON.parse(JSON.stringify(prev));
      mutate(draft);
      saveDesignConfig(draft);
      return draft;
    });
  }, []);

  const reset = useCallback(() => {
    setConfig(resetDesignConfig());
  }, []);

  return { config, update, reset };
}
