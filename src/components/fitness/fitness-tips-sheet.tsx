import { Lightbulb, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { useI18n } from "@/lib/i18n";
import { todayLocalKey } from "@/lib/local-date";

export const FIT_TIP_COUNT = 8;

/** Deterministic tip index (1-based) for a given day key. */
export function fitnessTipOfTheDay(dayKey: string) {
  let h = 0;
  for (let i = 0; i < dayKey.length; i++) h = (h * 31 + dayKey.charCodeAt(i)) >>> 0;
  return (h % FIT_TIP_COUNT) + 1;
}

export function FitnessTipsSheet({
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
          <DrawerTitle className="font-display">{t("fit.tips_title")}</DrawerTitle>
          <DrawerDescription>{t("fit.tips_sub")}</DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-8">
          <ul className="space-y-2.5">
            {Array.from({ length: FIT_TIP_COUNT }, (_, i) => i + 1).map((n) => (
              <li
                key={n}
                className={`flex items-start gap-3 rounded-3xl px-4 py-4 ${
                  n === highlight ? "bg-alyva/[0.09] ring-1 ring-alyva/25" : "bg-alyva/[0.045]"
                }`}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-alyva/10">
                  <Lightbulb className="size-5 text-alyva" />
                </span>
                <p className="min-w-0 text-[13px] leading-relaxed text-foreground/90">{t(`fit.tip.${n}`)}</p>
              </li>
            ))}
          </ul>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

/**
 * ALYVA signature "Tip of the day" card — always ALYVA green, also inside Fitness.
 * Rendered at the very bottom of the Fitness page.
 */
export function FitnessTipCard() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const n = useMemo(() => fitnessTipOfTheDay(todayLocalKey()), []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-8 flex w-full items-start gap-4 rounded-[28px] bg-alyva/[0.045] px-5 py-5 text-left ios-press"
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-alyva/10">
          <Lightbulb className="size-6 text-alyva" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-alyva">
            {t("fit.tipTitle")}
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-foreground/90">{t(`fit.tip.${n}`)}</p>
        </div>
        <ChevronRight className="mt-1 size-5 shrink-0 text-muted-foreground/70 rtl:rotate-180" />
      </button>
      <FitnessTipsSheet open={open} onOpenChange={setOpen} highlight={n} />
    </>
  );
}
