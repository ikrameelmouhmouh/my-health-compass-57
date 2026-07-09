import { useEffect, useRef } from "react";
import { ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { FASTING_PHASES } from "./fasting-summary";

export function FastingPhaseStrip({
  currentHours,
  active,
  onSelect,
}: {
  currentHours: number;
  active: boolean;
  onSelect: (phaseId: string) => void;
}) {
  const { t } = useI18n();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const currentIdx = active
    ? FASTING_PHASES.findIndex((p) => currentHours >= p.minH && currentHours < p.maxH)
    : -1;

  // Auto-scroll to current phase
  useEffect(() => {
    if (!active || currentIdx < 0) return;
    const el = scrollerRef.current?.querySelector<HTMLElement>(`[data-phase-idx="${currentIdx}"]`);
    if (el && "scrollIntoView" in el) {
      el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [active, currentIdx]);

  return (
    <section className="mt-5">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="font-display text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t("fast.status.title")}
        </h2>
        {active && currentIdx >= 0 && (
          <span className="text-[11px] text-brand font-medium">
            Lv.{currentIdx + 1} · {t(`fast.phase.${FASTING_PHASES[currentIdx].key}.title` as const)}
          </span>
        )}
      </div>

      <div
        ref={scrollerRef}
        className="scrollbar-none -mx-5 overflow-x-auto px-5"
      >
        <div className="flex items-center gap-1.5 pb-1">
          {FASTING_PHASES.map((p, i) => {
            const Icon = p.icon;
            const reached = active && currentHours >= p.minH;
            const isCurrent = i === currentIdx;
            return (
              <div key={p.id} className="flex items-center gap-1.5" data-phase-idx={i}>
                <button
                  onClick={() => onSelect(p.id)}
                  className="flex shrink-0 flex-col items-center gap-1"
                  aria-label={t(`fast.phase.${p.key}.title` as const)}
                >
                  <div
                    className={`relative grid size-14 place-items-center rounded-full border-2 transition ${
                      isCurrent
                        ? "border-brand bg-brand text-white shadow-lg shadow-brand/30"
                        : reached
                        ? "border-brand/50 bg-brand/15 text-brand"
                        : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    <Icon className="size-5" />
                    {isCurrent && (
                      <span className="absolute inset-0 animate-ping rounded-full border-2 border-brand/60" />
                    )}
                  </div>
                  <span
                    className={`text-[9px] font-semibold tabular-nums ${
                      isCurrent ? "text-brand" : reached ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {p.maxH >= 999 ? `${p.minH}h+` : `${p.minH}-${p.maxH}h`}
                  </span>
                </button>
                {i < FASTING_PHASES.length - 1 && (
                  <ChevronRight
                    className={`size-3 shrink-0 ${reached ? "text-brand/60" : "text-muted-foreground/40"}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
