import { useI18n } from "@/lib/i18n";
import { FASTING_PHASES } from "./fasting-summary";

/**
 * Compact horizontal fasting phase timeline.
 * Six steps: 0–4u → 4–8u → 8–12u → 12–18u → 18–24u → 24u+
 * Current phase gets a subtle lavender treatment, the rest stay very light.
 */
const STEPS = FASTING_PHASES.slice(0, 6);

export function FastingPhaseTimeline({
  currentHours,
  active,
  onSelect,
}: {
  currentHours: number;
  active: boolean;
  onSelect: (phaseId: string) => void;
}) {
  const { t } = useI18n();

  const currentIdx = active
    ? STEPS.reduce((acc, p, i) => (currentHours >= p.minH ? i : acc), 0)
    : -1;

  return (
    <section className="mt-4">
      <div className="mb-2 flex items-baseline justify-between px-1">
        <h2 className="font-display text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t("fast.status.title")}
        </h2>
        {currentIdx >= 0 && (
          <span className="text-[11px] font-medium text-acc-fasting">
            {t(`fast.phase.${STEPS[currentIdx].key}.title` as const)}
          </span>
        )}
      </div>

      <div className="rounded-[22px] border border-border bg-card px-3 py-3">
        <div className="flex items-start">
          {STEPS.map((p, i) => {
            const Icon = p.icon;
            const reached = currentIdx >= 0 && i <= currentIdx;
            const isCurrent = i === currentIdx;
            const label = i === STEPS.length - 1 ? `${p.minH}u+` : `${p.minH}–${p.maxH}u`;
            return (
              <div key={p.id} className="flex min-w-0 flex-1 flex-col items-center">
                <div className="flex w-full items-center">
                  <span
                    className={`h-[2px] flex-1 rounded-full ${
                      i === 0 ? "bg-transparent" : reached ? "bg-acc-fasting/40" : "bg-border"
                    }`}
                  />
                  <button
                    onClick={() => onSelect(p.id)}
                    aria-label={t(`fast.phase.${p.key}.title` as const)}
                    className={`grid size-9 shrink-0 place-items-center rounded-full border transition ios-press ${
                      isCurrent
                        ? "border-acc-fasting/50 bg-acc-fasting-soft text-acc-fasting"
                        : reached
                        ? "border-acc-fasting/25 bg-acc-fasting-soft/60 text-acc-fasting"
                        : "border-border bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    <Icon className="size-4" strokeWidth={isCurrent ? 2.2 : 1.7} />
                  </button>
                  <span
                    className={`h-[2px] flex-1 rounded-full ${
                      i === STEPS.length - 1
                        ? "bg-transparent"
                        : currentIdx > i
                        ? "bg-acc-fasting/40"
                        : "bg-border"
                    }`}
                  />
                </div>
                <span
                  className={`mt-1.5 text-[9px] font-semibold tabular-nums ${
                    isCurrent ? "text-acc-fasting" : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
