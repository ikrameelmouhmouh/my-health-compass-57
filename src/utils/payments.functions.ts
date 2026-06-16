import { createServerFn } from "@tanstack/react-start";
import Stripe from "stripe";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { type StripeEnv, createStripeClient, getStripeErrorMessage } from "@/lib/stripe.server";

type CheckoutResult = { clientSecret: string } | { error: string };

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      priceId: string;
      environment: StripeEnv;
      returnUrl: string;
      customerCountry?: string;
    }) => data,
  )
  .handler(async ({ data, context }): Promise<CheckoutResult> => {
    const { userId, supabase } = context;
    try {
      const stripe = createStripeClient(data.environment);

      // Resolve our human-readable price id (e.g. "pro_monthly") to the Stripe price object.
      const list = await stripe.prices.list({ lookup_keys: [data.priceId], limit: 1, expand: ["data.product"] });
      const price = list.data[0];
      if (!price) return { error: `Price not found: ${data.priceId}` };

      // Find an existing Stripe customer for this user to avoid duplicates.
      const { data: existing } = await supabase
        .from("subscriptions")
        .select("stripe_customer_id")
        .eq("user_id", userId)
        .eq("environment", data.environment)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: "subscription",
        ui_mode: "embedded",
        line_items: [{ price: price.id, quantity: 1 }],
        return_url: data.returnUrl,
        subscription_data: {
          trial_period_days: 7,
          metadata: { userId },
        },
        metadata: {
          userId,
          customer_country: data.customerCountry ?? "",
          managed_payments: "true",
        },
        ...(existing?.stripe_customer_id
          ? { customer: existing.stripe_customer_id }
          : { customer_creation: "always" as const }),
      };

      // Full compliance handling (tax + fraud + disputes + support) — NL seller, supported.
      (sessionParams as Stripe.Checkout.SessionCreateParams & {
        managed_payments?: { enabled: boolean };
      }).managed_payments = { enabled: true };

      const session = await stripe.checkout.sessions.create(sessionParams);
      if (!session.client_secret) return { error: "No client secret returned" };
      return { clientSecret: session.client_secret };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

type PortalResult = { url: string } | { error: string };

export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { returnUrl: string; environment: StripeEnv }) => data)
  .handler(async ({ data, context }): Promise<PortalResult> => {
    const { supabase, userId } = context;
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!sub?.stripe_customer_id) return { error: "No subscription found" };
    try {
      const stripe = createStripeClient(data.environment);
      const portal = await stripe.billingPortal.sessions.create({
        customer: sub.stripe_customer_id,
        return_url: data.returnUrl,
      });
      return { url: portal.url };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
