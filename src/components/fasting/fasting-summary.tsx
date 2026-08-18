import { Flame, Check, X, Trophy, Utensils, Droplet, ArrowRightLeft, RefreshCw, Sparkles, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import type { FastEntry } from "@/lib/dashboard-prefs";

/** Metabolic phase thresholds (hours) — 8 phases up to 72h+ */
export const FASTING_PHASES = [
  { id: "fed",       minH: 0,  maxH: 4,   key: "fed",       icon: Utensils },
  { id: "glycogen",  minH: 4,  maxH: 8,   key: "glycogen",  icon: Droplet },
  { id: "switch",    minH: 8,  maxH: 12,  key: "switch",    icon: ArrowRightLeft },
  { id: "ketosis",   minH: 12, maxH: 18,  key: "ketosis",   icon: Flame },
  { id: "deepKeto",  minH: 18, maxH: 24,  key: "deepKeto",  icon: Flame },
  { id: "autophagy", minH: 24, maxH: 48,  key: "autophagy", icon: RefreshCw },
  { id: "growth",    minH: 48, maxH: 72,  key: "growth",    icon: Sparkles },
  { id: "reset",     minH: 72, maxH: 999, key: "reset",     icon: Zap },
] as const;

export type FastingPhaseIcon = LucideIcon;

export function phaseForHours(h: number) {
  return FASTING_PHASES.slice().reverse().find((p) => h >= p.minH) ?? FASTING_PHASES[0];
}

function fmtHM(ms: number) {
  const totalMin = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

export function FastingSummarySheet({
  entry,
  streak,
  onClose,
  onStartAgain,
}: {
  entry: FastEntry | null;
  streak?: number;
  onClose: () => void;
  onStartAgain?: () => void;
}) {
  const { t } = useI18n();
  const open = !!entry;
  if (!entry) {
    return (
      <Dialog open={false} onOpenChange={() => onClose()}>
        <DialogContent />
      </Dialog>
    );
  }

  const hours = entry.durationMs / 3_600_000;
  const targetH = entry.targetMs / 3_600_000;
  const pct = Math.min(999, Math.round((entry.durationMs / entry.targetMs) * 100));
  const extraMs = Math.max(0, entry.durationMs - entry.targetMs);
  const reached = phaseForHours(hours);
  const reachedIdx = FASTING_PHASES.findIndex((p) => p.id === reached.id);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <div className="relative bg-gradient-to-br from-acc-fasting/20 via-acc-fasting/10 to-transparent px-6 pt-8 pb-6 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-acc-fasting/20 text-acc-fasting">
            <Flame className="size-8" />
          </div>
          <DialogHeader className="mt-3">
            <DialogTitle className="text-center font-display text-2xl font-semibold">
              {entry.completed ? t("fast.summary.title_done") : t("fast.summary.title_short")}
            </DialogTitle>
            <DialogDescription className="text-center">
              {entry.completed
                ? t("fast.summary.desc_done", { h: fmtHM(entry.durationMs) })
                : t("fast.summary.desc_short", { h: fmtHM(entry.durationMs) })}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* Metrics */}
          <div className="grid grid-cols-3 gap-2">
            <Metric label={t("fast.summary.goal")} value={`${targetH}h`} />
            <Metric label={t("fast.summary.actual")} value={fmtHM(entry.durationMs)} />
            <Metric
              label={extraMs > 0 ? t("fast.summary.extra") : t("fast.summary.percent")}
              value={extraMs > 0 ? `+${fmtHM(extraMs)}` : `${pct}%`}
            />
          </div>

          {extraMs > 0 && (
            <div className="rounded-2xl border border-border bg-card px-4 py-3 text-center text-sm font-medium">
              {t("fast.summary.extraTitle", { h: fmtHM(extraMs) })}
            </div>
          )}

          <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("fast.summary.endPhase")}
            </span>
            <span className="text-sm font-semibold">{t(`fast.phase.${reached.key}.title` as const)}</span>
          </div>


          {entry.completed && typeof streak === "number" && streak > 0 && (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3">
              <Trophy className="size-4 text-acc-fasting" />
              <span className="text-sm font-medium">
                {t("fast.summary.streakNow", { n: streak })}
              </span>
            </div>
          )}

          {/* Phase timeline */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {t("fast.summary.phaseReached")}
            </div>
            <div className="flex items-center gap-1">
              {FASTING_PHASES.map((p, i) => {
                const active = i <= reachedIdx;
                const isCurrent = i === reachedIdx;
                return (
                  <div key={p.id} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className={`grid size-8 place-items-center rounded-full border ${
                        isCurrent
                          ? "border-acc-fasting bg-acc-fasting/70 text-foreground"
                          : active
                          ? "border-acc-fasting/40 bg-acc-fasting/15 text-acc-fasting"
                          : "border-border bg-muted text-muted-foreground"
                      }`}
                    >
                      <Flame className="size-3.5" />
                    </div>
                    <span className="text-[9px] tabular-nums text-muted-foreground">
                      {p.minH}h
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reached phase card */}
          <div className="rounded-3xl border border-border bg-card p-5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-acc-fasting">
              {t(`fast.phase.${reached.key}.range` as const)}
            </div>
            <h3 className="mt-1 font-display text-lg font-semibold">
              {t(`fast.phase.${reached.key}.title` as const)}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t(`fast.phase.${reached.key}.desc` as const)}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="h-11 flex-1" onClick={onClose}>
              <X className="mr-1.5 size-4" />
              {t("fast.summary.close")}
            </Button>
            {onStartAgain && (
              <Button className="h-11 flex-1" onClick={onStartAgain}>
                <Check className="mr-1.5 size-4" />
                {t("fast.summary.startAgain")}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-2 py-3 text-center">
      <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-base font-semibold tabular-nums">{value}</div>
    </div>
  );
}
