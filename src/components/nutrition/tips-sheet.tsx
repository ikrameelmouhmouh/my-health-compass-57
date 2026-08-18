import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { TipIcon } from "@/components/nutrition/meal-icons";
import { useI18n } from "@/lib/i18n";

export const TIP_COUNT = 8;

/** Deterministic tip index for a given day (so "tip of the day" is stable). */
export function tipOfTheDayIndex(dayKey: string) {
  let h = 0;
  for (let i = 0; i < dayKey.length; i++) h = (h * 31 + dayKey.charCodeAt(i)) >>> 0;
  return h % TIP_COUNT;
}

export function TipsSheet({
  open,
  onOpenChange,
  highlight,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  highlight?: number;
}) {
  const { t } = useI18n();
  const tips = Array.from({ length: TIP_COUNT }, (_, i) => i);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[88vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="font-display">{t("nutr.tips_title")}</DrawerTitle>
          <DrawerDescription>{t("nutr.tips_sub")}</DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-8">
          <ul className="space-y-2.5">
            {tips.map((i) => (
              <li
                key={i}
                className={`flex items-start gap-3 rounded-3xl px-4 py-4 ${
                  i === highlight ? "bg-alyva/[0.09] ring-1 ring-alyva/25" : "bg-alyva/[0.045]"
                }`}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-alyva/10">
                  <TipIcon className="size-5 text-alyva" />
                </span>
                <div className="min-w-0">
                  <p className="font-display text-[15px] font-bold leading-tight">
                    {t(`nutr.tip.${i + 1}.h`)}
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                    {t(`nutr.tip.${i + 1}.b`)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
