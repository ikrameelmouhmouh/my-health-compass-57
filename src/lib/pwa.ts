// Guarded service worker registration.
// Refuses in dev, iframes, Lovable preview hosts, and when ?sw=off is set.

const REFUSE_HOSTS = (h: string) =>
  h.startsWith("id-preview--") ||
  h.startsWith("preview--") ||
  h === "lovableproject.com" ||
  h.endsWith(".lovableproject.com") ||
  h === "lovableproject-dev.com" ||
  h.endsWith(".lovableproject-dev.com") ||
  h === "beta.lovable.dev" ||
  h.endsWith(".beta.lovable.dev");

export function shouldRegisterSW(): boolean {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator)) return false;
  if (!import.meta.env.PROD) return false;
  try {
    if (window.top !== window.self) return false;
  } catch {
    return false;
  }
  if (REFUSE_HOSTS(window.location.hostname)) return false;
  if (new URLSearchParams(window.location.search).get("sw") === "off") return false;
  return true;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!shouldRegisterSW()) {
    // Cleanup any existing registration in refused contexts.
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const r of regs) {
          if (r.active?.scriptURL.endsWith("/sw.js")) await r.unregister();
        }
      } catch { /* noop */ }
    }
    return null;
  }
  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch (err) {
    console.warn("[pwa] SW registration failed", err);
    return null;
  }
}
