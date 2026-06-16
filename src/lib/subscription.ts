import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { getStripeEnvironment } from "@/lib/stripe";

export type SubscriptionRow = {
  status: string;
  price_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  environment: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
};

export function useSubscription() {
  const { user } = useAuth();
  const env = getStripeEnvironment();

  const query = useQuery({
    queryKey: ["subscription", user?.id, env],
    enabled: !!user,
    queryFn: async (): Promise<SubscriptionRow | null> => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("status,price_id,current_period_end,cancel_at_period_end,environment,stripe_subscription_id,stripe_customer_id")
        .eq("user_id", user!.id)
        .eq("environment", env)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as SubscriptionRow | null;
    },
  });

  // Realtime
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`sub:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${user.id}` },
        () => query.refetch(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user?.id]);

  const sub = query.data;
  const now = Date.now();
  const periodActive = !sub?.current_period_end || new Date(sub.current_period_end).getTime() > now;
  const isPro =
    !!sub &&
    ((["active", "trialing", "past_due"].includes(sub.status) && periodActive) ||
      (sub.status === "canceled" && !!sub.current_period_end && new Date(sub.current_period_end).getTime() > now));
  const isTrialing = sub?.status === "trialing";

  return { ...query, subscription: sub, isPro, isTrialing, environment: env };
}

export function useCustomerCountry() {
  const [country, setCountry] = useState<string | undefined>();
  useEffect(() => {
    fetch("https://www.cloudflare.com/cdn-cgi/trace")
      .then((r) => r.text())
      .then((t) => {
        const m = t.match(/loc=([A-Z]{2})/);
        if (m) setCountry(m[1]);
      })
      .catch(() => {});
  }, []);
  return country;
}
