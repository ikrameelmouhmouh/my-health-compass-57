/** Small color helpers used by the visual editor (hex / rgb / oklch parsing). */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): RGB | null {
  const m = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }: RGB): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

function srgbFromLinear(x: number): number {
  const v = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
  return v * 255;
}

/** Convert an oklch(L C H) triple to sRGB. */
export function oklchToRgb(L: number, C: number, Hdeg: number): RGB {
  const h = (Hdeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const bb = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * bb;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * bb;
  const s_ = L - 0.0894841775 * a - 1.291485548 * bb;
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;
  return {
    r: srgbFromLinear(+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: srgbFromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: srgbFromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  };
}

/** Parse the color strings a browser can return from getComputedStyle. */
export function parseCssColor(input: string): RGB | null {
  if (!input) return null;
  const v = input.trim().toLowerCase();
  if (v === "transparent" || v.startsWith("rgba(0, 0, 0, 0)")) return null;
  if (v.startsWith("#")) return hexToRgb(v);
  const rgbM = /^rgba?\(([^)]+)\)$/.exec(v);
  if (rgbM) {
    const parts = rgbM[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    if (parts.length >= 3 && parts.every((n) => !Number.isNaN(n))) {
      if (parts[3] !== undefined && parts[3] === 0) return null;
      return { r: parts[0], g: parts[1], b: parts[2] };
    }
    return null;
  }
  const okM = /^oklch\(([^)]+)\)$/.exec(v);
  if (okM) {
    const parts = okM[1].split(/[\s,/]+/).filter(Boolean);
    const num = (s: string) => (s.endsWith("%") ? parseFloat(s) / 100 : parseFloat(s));
    const L = num(parts[0]);
    const C = parseFloat(parts[1]);
    const H = parseFloat(parts[2] ?? "0");
    if ([L, C, H].some((n) => Number.isNaN(n))) return null;
    if (parts[3] !== undefined && parseFloat(parts[3]) === 0) return null;
    return oklchToRgb(L, C, H);
  }
  return null;
}

export function cssColorToHex(input: string): string | null {
  const rgb = parseCssColor(input);
  return rgb ? rgbToHex(rgb) : null;
}

/** Perceptual-ish distance between two colors (0 = identical). */
export function colorDistance(a: RGB, b: RGB): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr * 2 + dg * dg * 4 + db * db * 3);
}
