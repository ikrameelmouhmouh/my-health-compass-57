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
