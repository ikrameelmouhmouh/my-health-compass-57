import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { getStripeEnvironment } from "@/lib/stripe";

export type PremiumOverride = "premium" | "free" | null;
const STORAGE_KEY = "vita.premiumOverride";
const EVENT = "vita:premium-override";

function readOverride(): PremiumOverride {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(STORAGE_KEY);
  if (v === "premium" || v === "on") return "premium";
  if (v === "free" || v === "off") return "free";
  return null;
}

export function usePremium() {
  const { user } = useAuth();
  const env = getStripeEnvironment();

  const { data: sub } = useQuery({
    queryKey: ["subscription", user?.id, env],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user!.id)
        .eq("environment", env)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const now = Date.now();
  const realIsPremium =
    !!sub &&
    ((["active", "trialing", "past_due"].includes(sub.status) &&
      (!sub.current_period_end || new Date(sub.current_period_end).getTime() > now)) ||
      (sub.status === "canceled" &&
        !!sub.current_period_end &&
        new Date(sub.current_period_end).getTime() > now));


  const [override, setOverrideState] = useState<PremiumOverride>(() => readOverride());

  useEffect(() => {
    const sync = () => setOverrideState(readOverride());
    window.addEventListener("storage", sync);
    window.addEventListener(EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EVENT, sync);
    };
  }, []);

  const setOverride = useCallback((next: PremiumOverride) => {
    if (next === null) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new Event(EVENT));
    setOverrideState(next);
  }, []);

  const isPremium = override === "premium" ? true : override === "free" ? false : realIsPremium;

  return { isPremium, realIsPremium, override, setOverride, sub };
}
