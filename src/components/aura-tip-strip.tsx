import { Sparkles, ChevronRight } from "lucide-react";
import { useT } from "@/lib/i18n";

export function AuraTipStrip({ tip, onOpen }: { tip: string; onOpen: () => void }) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={onOpen}
      className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-brand/25 bg-gradient-to-r from-brand/10 to-brand/5 px-3.5 py-2.5 text-left ios-press"
    >
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand/20 text-brand">
        <Sparkles className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-brand">
          {t("today.aura.strip_title")}
        </div>
        <p className="truncate text-[12.5px] font-medium leading-tight text-foreground/90">
          {tip}
        </p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground rtl:rotate-180" />
    </button>
  );
}
