import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { FASTING_PHASES } from "./fasting-summary";

export function FastingPhaseSheet({
  phaseId,
  currentHours,
  onClose,
}: {
  phaseId: string | null;
  currentHours?: number;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [idx, setIdx] = useState<number>(0);

  useEffect(() => {
    if (!phaseId) return;
    const i = FASTING_PHASES.findIndex((p) => p.id === phaseId);
    if (i >= 0) setIdx(i);
  }, [phaseId]);

  const open = !!phaseId;
  if (!phaseId) {
    return (
      <Dialog open={false} onOpenChange={() => onClose()}>
        <DialogContent />
      </Dialog>
    );
  }

  const p = FASTING_PHASES[idx];
  const Icon = p.icon;
  const reached = typeof currentHours === "number" && currentHours >= p.minH;
  const isCurrent =
    typeof currentHours === "number" &&
    currentHours >= p.minH &&
    currentHours < p.maxH;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <div className="relative bg-gradient-to-br from-brand/20 via-brand/10 to-transparent px-6 pt-8 pb-6 text-center">
          <div className={`mx-auto grid size-16 place-items-center rounded-full ${isCurrent ? "bg-primary text-primary-foreground" : reached ? "bg-brand/20 text-brand" : "bg-muted text-muted-foreground"}`}>
            <Icon className="size-8" />
          </div>
          <div className="mt-3 inline-block rounded-full bg-card/70 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Lv.{idx + 1} · {t(`fast.phase.${p.key}.range` as const)}
          </div>
          <DialogHeader className="mt-2">
            <DialogTitle className="text-center font-display text-2xl font-semibold">
              {t(`fast.phase.${p.key}.title` as const)}
            </DialogTitle>
            <DialogDescription className="text-center">
              {t(`fast.phase.${p.key}.desc` as const)}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* Long description card */}
          <div className="rounded-3xl border border-border bg-card p-5">
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
              {t(`fast.phase.${p.key}.long` as const)}
            </p>
          </div>

          {/* Mini phase timeline */}
          <div className="flex items-center gap-1">
            {FASTING_PHASES.map((ph, i) => {
              const active = typeof currentHours === "number" && currentHours >= ph.minH;
              const cur = i === idx;
              return (
                <button
                  key={ph.id}
                  onClick={() => setIdx(i)}
                  className={`h-2 flex-1 rounded-full transition ${
                    cur
                      ? "bg-primary"
                      : active
                      ? "bg-brand/40"
                      : "bg-border"
                  }`}
                  aria-label={t(`fast.phase.${ph.key}.title` as const)}
                />
              );
            })}
          </div>

          {/* Prev / next */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="h-11 flex-1"
              disabled={idx === 0}
              onClick={() => setIdx((i) => Math.max(0, i - 1))}
            >
              <ChevronLeft className="mr-1 size-4" />
              {t("fast.phase.prev")}
            </Button>
            <Button
              variant="outline"
              className="h-11 flex-1"
              disabled={idx === FASTING_PHASES.length - 1}
              onClick={() => setIdx((i) => Math.min(FASTING_PHASES.length - 1, i + 1))}
            >
              {t("fast.phase.next")}
              <ChevronRight className="ml-1 size-4" />
            </Button>
          </div>

          <Button variant="ghost" className="h-10 w-full" onClick={onClose}>
            <X className="mr-1.5 size-4" />
            {t("fast.summary.close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
