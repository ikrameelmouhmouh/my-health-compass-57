import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { loadStripe, type Stripe as StripeJs } from "@stripe/stripe-js";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Check, Crown, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSubscription, useCustomerCountry } from "@/lib/subscription";
import { getStripeEnvironment } from "@/lib/stripe";
import { createCheckoutSession, createPortalSession } from "@/utils/payments.functions";
import { useI18n, useT } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/pricing")({
  component: PricingPage,
  head: () => ({ meta: [{ title: "Vita Pro — Upgrade je fitness reis" }] }),
});

const TOKEN = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;
let _stripePromise: Promise<StripeJs | null> | null = null;
function stripeJs() {
  if (!_stripePromise && TOKEN) _stripePromise = loadStripe(TOKEN);
  return _stripePromise;
}



function PricingPage() {
  const t = useT();
  const { lang } = useI18n();
  const navigate = useNavigate();
  const { isPro, isTrialing, subscription } = useSubscription();
  const country = useCustomerCountry();
  const env = getStripeEnvironment();
  const createCheckout = useServerFn(createCheckoutSession);
  const openPortal = useServerFn(createPortalSession);

  const [interval, setInterval] = useState<"monthly" | "yearly">("yearly");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const checkoutRef = useRef<HTMLDivElement>(null);
  const [, setEmbedded] = useState<any>(null);

  const priceId = interval === "monthly" ? "pro_monthly" : "pro_yearly";
  const FEATURES = [t("price.f1"), t("price.f2"), t("price.f3"), t("price.f4"), t("price.f5"), t("price.f6")];
  const localeMap: Record<string, string> = { en: "en-US", nl: "nl-NL", ar: "ar", fr: "fr-FR", de: "de-DE", es: "es-ES" };
  const dateLocale = localeMap[lang] ?? "en-US";

  async function startCheckout() {
    if (!TOKEN) {
      toast.error(t("price.not_configured"));
      return;
    }

    setLoading(true);
    try {
      const result = await createCheckout({
        data: {
          priceId,
          environment: env,
          returnUrl: `${window.location.origin}/pricing?success=1`,
          customerCountry: country,
        },
      });
      if ("error" in result) throw new Error(result.error);
      setClientSecret(result.clientSecret);
    } catch (e: any) {
      toast.error(e.message ?? t("price.checkout_failed"));
    } finally {
      setLoading(false);
    }
  }

  // Mount embedded checkout
  useEffect(() => {
    if (!clientSecret || !checkoutRef.current) return;
    let mounted = true;
    let inst: any = null;
    (async () => {
      const stripe = await stripeJs();
      if (!stripe || !mounted) return;
      inst = await (stripe as any).initEmbeddedCheckout({ clientSecret });
      if (!mounted) return;
      inst.mount(checkoutRef.current!);
      setEmbedded(inst);
    })();
    return () => {
      mounted = false;
      try { inst?.destroy?.(); } catch {}
    };
  }, [clientSecret]);

  async function manageSubscription() {
    const result = await openPortal({
      data: { environment: env, returnUrl: `${window.location.origin}/pricing` },
    });
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    window.open(result.url, "_blank");
  }

  const monthlyDisplay = useMemo(() => "€9,99", []);
  const yearlyDisplay = useMemo(() => "€79,99", []);
  const yearlyPerMonth = useMemo(() => "€6,67", []);

  return (
    <div className="min-h-dvh bg-gradient-to-b from-background to-background/80 pb-32">
      <header className="sticky top-0 z-10 backdrop-blur bg-background/70 border-b">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/profile" })}>
            <ArrowLeft className="size-5" />
          </Button>
          <h1 className="text-base font-semibold">{t("price.title")}</h1>
        </div>
      </header>

      <main className="px-4 pt-4 space-y-6 max-w-md mx-auto">
        {env === "sandbox" && (
          <div className="rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs px-3 py-2 border border-amber-500/20">
            {t("price.test_mode")}
          </div>
        )}

        {isPro ? (
          <Card className="p-6 space-y-4 border-brand/40 bg-gradient-to-br from-brand/10 to-transparent">
            <div className="flex items-center gap-2">
              <Crown className="size-5 text-brand" />
              <h2 className="font-semibold">{t("price.youre_pro")} {isTrialing && t("price.trial")}</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {subscription?.current_period_end && (
                <>{t("price.next_renewal")} {new Date(subscription.current_period_end).toLocaleDateString(dateLocale)}</>
              )}
              {subscription?.cancel_at_period_end && ` ${t("price.cancelled")}`}
            </p>
            <Button onClick={manageSubscription} className="w-full" variant="outline">
              {t("price.manage")}
            </Button>
          </Card>
        ) : clientSecret ? (
          <div className="rounded-xl overflow-hidden border bg-card">
            <div ref={checkoutRef} />
          </div>
        ) : (
          <>
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-medium bg-brand/10 text-brand px-3 py-1 rounded-full">
                <Sparkles className="size-3" />
                {t("price.try_free")}
              </div>
              <h2 className="text-2xl font-bold leading-tight">{t("price.headline")}</h2>
              <p className="text-sm text-muted-foreground">{t("price.sub")}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setInterval("monthly")}
                className={`rounded-xl border p-4 text-left transition ${
                  interval === "monthly" ? "border-brand ring-2 ring-brand/30" : "border-border"
                }`}
              >
                <div className="text-xs text-muted-foreground">{t("price.monthly")}</div>
                <div className="text-xl font-bold mt-1">{monthlyDisplay}</div>
                <div className="text-xs text-muted-foreground">{t("price.per_month")}</div>
              </button>
              <button
                onClick={() => setInterval("yearly")}
                className={`rounded-xl border p-4 text-left transition relative ${
                  interval === "yearly" ? "border-brand ring-2 ring-brand/30" : "border-border"
                }`}
              >
                <div className="absolute -top-2 right-2 text-[10px] font-semibold bg-brand text-brand-foreground px-2 py-0.5 rounded-full">
                  -33%
                </div>
                <div className="text-xs text-muted-foreground">{t("price.yearly")}</div>
                <div className="text-xl font-bold mt-1">{yearlyDisplay}</div>
                <div className="text-xs text-muted-foreground">{yearlyPerMonth}{t("price.per_month")}</div>
              </button>
            </div>

            <Card className="p-5 space-y-3">
              {FEATURES.map((f) => (
                <div key={f} className="flex items-start gap-2.5">
                  <Check className="size-4 text-brand mt-0.5 shrink-0" />
                  <span className="text-sm">{f}</span>
                </div>
              ))}
            </Card>

            <Button onClick={startCheckout} disabled={loading} className="w-full h-12 text-base" size="lg">
              {loading ? <Loader2 className="size-4 animate-spin" /> : t("price.start_trial")}
            </Button>
            <p className="text-[11px] text-center text-muted-foreground">
              {t("price.legal")}
            </p>

          </>
        )}
      </main>
    </div>
  );
}
