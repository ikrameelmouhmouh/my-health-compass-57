import { usePremium } from "@/hooks/use-premium";
import { useT } from "@/lib/i18n";
import { X } from "lucide-react";

export function TestModeBadge() {
  const { override, setOverride } = usePremium();
  const t = useT();
  if (override === "auto") return null;
  const label = override === "on" ? t("testmode.badge_plus") : t("testmode.badge_free");
  return (
    <button
      onClick={() => setOverride("auto")}
      className="fixed bottom-20 right-3 z-[60] inline-flex items-center gap-1.5 rounded-full border border-border bg-card/90 px-2.5 py-1 text-[10px] font-medium text-muted-foreground shadow-sm backdrop-blur transition hover:text-foreground"
      aria-label={label}
    >
      <span className="size-1.5 rounded-full bg-brand" />
      {label}
      <X className="size-3 opacity-60" />
    </button>
  );
}
