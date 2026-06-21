import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { enablePush, disablePush, pushStatus, pushSupported } from "@/lib/push";
import { supabase } from "@/integrations/supabase/client";

export function PushToggle() {
  const t = useT();
  const { user } = useAuth();
  const [status, setStatus] = useState<"granted" | "denied" | "default" | "unsupported">("default");
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isIOS = typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window.matchMedia?.("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone);

  useEffect(() => {
    (async () => {
      const s = await pushStatus();
      setStatus(s);
      if (s === "granted" && pushSupported()) {
        const reg = await navigator.serviceWorker.getRegistration("/");
        const sub = await reg?.pushManager.getSubscription();
        setOn(!!sub);
      }
    })();
  }, []);

  async function toggle() {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      if (on) {
        await disablePush(user.id);
        setOn(false);
      } else {
        const res = await enablePush(user.id);
        if (!res.ok) {
          setError(res.reason || t("set.notif.error"));
        } else {
          // Default: all three reminder types on
          await supabase.from("push_subscriptions")
            .update({ enabled_workout: true, enabled_streak: true, enabled_meal: true })
            .eq("user_id", user.id);
          setOn(true);
          setStatus("granted");
        }
      }
    } finally {
      setBusy(false);
    }
  }

  const disabled = busy || status === "unsupported" || status === "denied" || isIOS;

  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/12 text-brand">
        <Bell className="size-4" />
      </div>
      <div className="min-w-0 flex-1 text-left">
        <div className="font-display text-[14px] font-semibold tracking-tight">
          {t("set.notif.push")}
        </div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">
          {status === "unsupported"
            ? t("set.notif.unsupported")
            : status === "denied"
            ? t("set.notif.denied")
            : isIOS
            ? t("set.notif.ios")
            : error
            ? error
            : t("set.notif.push_sub")}
        </div>
      </div>
      <button
        onClick={toggle}
        disabled={disabled}
        role="switch"
        aria-checked={on}
        className={`relative h-6 w-10 shrink-0 rounded-full transition disabled:opacity-50 ${on ? "bg-brand" : "bg-border"}`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-card shadow transition-transform ${
            on ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
