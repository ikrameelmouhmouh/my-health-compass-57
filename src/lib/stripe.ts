// Client-safe Stripe helpers
export type StripeEnv = "sandbox" | "live";

export function getStripeEnvironment(): StripeEnv {
  // Sandbox in preview/dev, live in production deploys
  if (typeof window === "undefined") return "sandbox";
  const host = window.location.hostname;
  if (host.includes("lovable.app") && !host.includes("-dev.")) return "live";
  if (host === "localhost" || host.includes("-dev.") || host.includes("preview")) return "sandbox";
  return "live";
}

export const PRICE_IDS = {
  pro_monthly: "pro_monthly",
  pro_yearly: "pro_yearly",
} as const;

export type PriceId = (typeof PRICE_IDS)[keyof typeof PRICE_IDS];
