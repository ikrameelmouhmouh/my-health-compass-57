import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Trophy, Check, Lock } from "lucide-react";
import { BADGES, useRetention, type Badge } from "@/lib/retention";
import { useAuth } from "@/lib/auth-context";
import { useT } from "@/lib/i18n";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

export const Route = createFileRoute("/_authenticated/badges")({
  component: BadgesLibrary,
});

function BadgesLibrary() {
  const t = useT();
  const { user } = useAuth();
  const { loading, stats, earnedBadgeIds } = useRetention(user?.id);
  const [selected, setSelected] = useState<Badge | null>(null);

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-6">
      <header className="mb-6 flex items-center gap-3">
        <Link to="/" className="rounded-full border border-border bg-surface p-2">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <Trophy className="h-3.5 w-3.5" /> {t("ret.badges")}
          </div>
          <h1 className="font-display text-2xl font-bold">{t("badges.library_title")}</h1>
          {stats && (
            <p className="text-sm text-muted-foreground">
              {earnedBadgeIds.size}/{BADGES.length} {t("badges.unlocked")}
            </p>
          )}
        </div>
      </header>

      {loading || !stats ? (
        <div className="h-64 animate-pulse rounded-3xl bg-muted/40" />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {BADGES.map((b) => {
            const earned = earnedBadgeIds.has(b.id);
            const p = b.progress(stats);
            const pct = Math.min(100, Math.round((p.current / p.target) * 100));
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelected(b)}
                className={`flex flex-col items-center gap-2 rounded-3xl border p-4 text-center transition active:scale-[0.98] ${earned ? "border-border bg-surface" : "border-border/50 bg-surface/50"}`}
              >
                <div className={`text-4xl ${earned ? "" : "grayscale opacity-60"}`}>{b.icon}</div>
                <div className="text-sm font-semibold leading-tight">{b.name}</div>
                <div className="w-full">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-foreground transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    {p.current}/{p.target} {p.unit ?? ""}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          {selected && stats && (() => {
            const earned = earnedBadgeIds.has(selected.id);
            const p = selected.progress(stats);
            const pct = Math.min(100, Math.round((p.current / p.target) * 100));
            return (
              <>
                <SheetHeader className="items-center text-center">
                  <div className={`text-6xl ${earned ? "" : "grayscale opacity-60"}`}>{selected.icon}</div>
                  <SheetTitle className="font-display text-2xl">{selected.name}</SheetTitle>
                  <SheetDescription>{selected.description}</SheetDescription>
                </SheetHeader>
                <div className="mt-4 space-y-4">
                  <div className="rounded-2xl border border-border bg-surface p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      {t("badges.how_to_earn")}
                    </div>
                    <p className="mt-1 text-sm">{selected.criteria}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-surface p-4">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      <span>{t("badges.progress")}</span>
                      <span>{p.current}/{p.target} {p.unit ?? ""}</span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-foreground transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-sm font-medium ${earned ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600" : "border-border bg-muted/30 text-muted-foreground"}`}>
                    {earned ? <><Check className="h-4 w-4" /> {t("badges.earned")}</> : <><Lock className="h-4 w-4" /> {t("badges.locked")}</>}
                  </div>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>
    </div>
  );
}
