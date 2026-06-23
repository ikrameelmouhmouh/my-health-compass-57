import { Link } from "@tanstack/react-router";
import { Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/lib/subscription";
import { useT } from "@/lib/i18n";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  feature?: string;
  description?: string;
}

/** Wraps premium-only UI. Shows a paywall card when user is not Pro. */
export function PaywallGate({ children, feature, description }: Props) {
  const t = useT();
  const { isPro, isLoading } = useSubscription();
  if (isLoading) return null;
  if (isPro) return <>{children}</>;
  const label = feature ?? t("pay.feature_default");
  return (
    <div className="rounded-xl border border-brand/30 bg-gradient-to-br from-brand/10 via-brand/5 to-transparent p-6 text-center space-y-3">
      <div className="mx-auto size-12 rounded-full bg-brand/15 flex items-center justify-center">
        <Lock className="size-5 text-brand" />
      </div>
      <div>
        <h3 className="font-semibold flex items-center gap-1.5 justify-center">
          <Crown className="size-4 text-brand" />
          {label} {t("pay.is_pro")}
        </h3>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      <Button asChild className="w-full">
        <Link to="/pricing">{t("pay.cta")}</Link>
      </Button>
    </div>
  );
}

interface OverlayProps {
  children: ReactNode;
  feature?: string;
  description?: string;
  /** Smaller centered card — use for compact sections. */
  compact?: boolean;
}

/**
 * Renders children blurred/non-interactive with a centered "Upgrade to Vita Plus"
 * card on top when the user is not Pro. Pro users see children as-is.
 */
export function PaywallOverlay({ children, feature, description, compact }: OverlayProps) {
  const t = useT();
  const { isPro, isLoading } = useSubscription();
  if (isLoading) return <>{children}</>;
  if (isPro) return <>{children}</>;
  const label = feature ?? t("pay.feature_default");
  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none select-none blur-[6px] opacity-50"
      >
        {children}
      </div>
      <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background/90" />
        <div
          className={`relative w-full ${
            compact ? "max-w-[260px] p-4" : "max-w-[320px] p-6"
          } rounded-3xl border border-brand/30 bg-card/95 shadow-xl backdrop-blur text-center space-y-3`}
        >
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-brand/15">
            <Lock className="size-5 text-brand" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold flex items-center gap-1.5 justify-center">
              <Crown className="size-4 text-brand" />
              {label} {t("pay.is_pro")}
            </h3>
            {description && (
              <p className="mt-1 text-xs text-muted-foreground leading-snug">{description}</p>
            )}
          </div>
          <Button asChild className="w-full">
            <Link to="/pricing">{t("pay.unlock_cta")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
