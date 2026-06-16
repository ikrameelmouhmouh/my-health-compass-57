import { supabase } from "@/integrations/supabase/client";
import { registerServiceWorker } from "./pwa";

export const VAPID_PUBLIC_KEY =
  "BHdqCSyPw1FbZU1SH9mzadLqPI0q_maMGk1GyRuFDOLO38gtLVu6DmvFsBGg3cLlXzgSeQySQRhSoY-Zp4rTKu0";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function arrayBufToB64(buf: ArrayBuffer | null): string {
  if (!buf) return "";
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function enablePush(userId: string): Promise<{ ok: boolean; reason?: string }> {
  if (!pushSupported()) return { ok: false, reason: "Niet ondersteund op dit apparaat." };
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return { ok: false, reason: "Toestemming geweigerd." };

  let reg = await navigator.serviceWorker.getRegistration("/");
  if (!reg) reg = await registerServiceWorker() ?? undefined;
  if (!reg) {
    // In dev/preview SW registration is refused — register temporarily so push works locally.
    try {
      reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    } catch {
      return { ok: false, reason: "Service worker kon niet starten." };
    }
  }
  await navigator.serviceWorker.ready;

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const json = sub.toJSON();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: json.endpoint!,
      p256dh: json.keys?.p256dh ?? arrayBufToB64(sub.getKey("p256dh")),
      auth: json.keys?.auth ?? arrayBufToB64(sub.getKey("auth")),
      user_agent: navigator.userAgent,
    },
    { onConflict: "user_id,endpoint" },
  );
  if (error) return { ok: false, reason: error.message };
  return { ok: true };
}

export async function disablePush(userId: string): Promise<void> {
  if (!pushSupported()) return;
  const reg = await navigator.serviceWorker.getRegistration("/");
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    await supabase.from("push_subscriptions").delete().eq("user_id", userId).eq("endpoint", sub.endpoint);
    await sub.unsubscribe();
  }
}

export async function pushStatus(): Promise<"granted" | "denied" | "default" | "unsupported"> {
  if (!pushSupported()) return "unsupported";
  return Notification.permission;
}
