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
  /** Smaller CTA pill — use for compact sections. */
  compact?: boolean;
}

/**
 * Sneak-peek paywall: children stay fully visible but non-interactive,
 * with a floating "Unlock Vita Plus" CTA pinned above the bottom nav.
 * Pro users see children as-is.
 */
export function PaywallOverlay({ children, feature, description, compact }: OverlayProps) {
  const t = useT();
  const { isPro, isLoading } = useSubscription();
  if (isLoading) return <>{children}</>;
  if (isPro) return <>{children}</>;
  const label = feature ?? t("pay.feature_default");
  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none select-none">
        {children}
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-40 flex justify-center px-4">
        <div
          className={`pointer-events-auto w-full ${
            compact ? "max-w-[280px]" : "max-w-[360px]"
          } rounded-2xl border border-brand/30 bg-card/95 p-3 shadow-xl backdrop-blur-md`}
        >
          <div className="flex items-center gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-brand/15">
              <Lock className="size-4 text-brand" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1 truncate text-sm font-semibold">
                <Crown className="size-3.5 text-brand" />
                {label} {t("pay.is_pro")}
              </p>
              {description && (
                <p className="truncate text-[11px] text-muted-foreground">{description}</p>
              )}
            </div>
            <Button asChild size="sm" className="shrink-0">
              <Link to="/pricing">{t("pay.unlock_cta")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
