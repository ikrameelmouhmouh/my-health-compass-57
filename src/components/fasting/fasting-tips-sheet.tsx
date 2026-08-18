import { Lightbulb } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { useI18n } from "@/lib/i18n";

export const FAST_TIP_COUNT = 8;

/** Deterministic tip index (1-based) for a given day key. */
export function fastingTipOfTheDay(dayKey: string) {
  let h = 0;
  for (let i = 0; i < dayKey.length; i++) h = (h * 31 + dayKey.charCodeAt(i)) >>> 0;
  return (h % FAST_TIP_COUNT) + 1;
}

export function FastingTipsSheet({
  open,
  onOpenChange,
  highlight,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  highlight?: number;
}) {
  const { t } = useI18n();

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[88vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="font-display">{t("fast.tips_title")}</DrawerTitle>
          <DrawerDescription>{t("fast.tips_sub")}</DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-8">
          <ul className="space-y-2.5">
            {Array.from({ length: FAST_TIP_COUNT }, (_, i) => i + 1).map((n) => (
              <li
                key={n}
                className={`flex items-start gap-3 rounded-3xl px-4 py-4 ${
                  n === highlight
                    ? "bg-acc-fasting-soft ring-1 ring-acc-fasting/30"
                    : "bg-acc-fasting-soft/50"
                }`}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-acc-fasting/15">
                  <Lightbulb className="size-5 text-acc-fasting" />
                </span>
                <p className="min-w-0 text-[13px] leading-relaxed text-foreground/90">
                  {t(`fast.tip.${n}`)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
