import { Flame, Trophy, Calendar, Check } from "lucide-react";
import { BADGES, useRetention } from "@/lib/retention";
import { useAuth } from "@/lib/auth-context";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";


export function RetentionSection() {
  const t = useT();
  const { user } = useAuth();
  const { loading, stats, weekDays, earnedBadgeIds } = useRetention(user?.id);
  const [perm, setPerm] = useState<"granted" | "denied" | "default" | "unsupported">("default");
  const [busy, setBusy] = useState(false);

  useEffect(() => { pushStatus().then(setPerm); }, []);


  if (!user || loading || !stats) {
    return (
      <section className="rounded-3xl border border-border bg-surface p-5">
        <div className="h-32 animate-pulse rounded-2xl bg-muted/40" />
      </section>
    );
  }

  const maxWorkouts = Math.max(1, ...weekDays.map((d) => d.workouts));

  async function toggle() {
    if (!user) return;
    setBusy(true);
    try {
      if (perm === "granted") {
        await disablePush(user.id);
        setPerm("default");
        toast.success(t("ret.reminders_off"));
      } else {
        const r = await enablePush(user.id);
        if (r.ok) { setPerm("granted"); toast.success(t("ret.reminders_on")); }
        else toast.error(r.reason ?? t("ret.activation_failed"));
      }
    } finally { setBusy(false); }
  }


  return (
    <section className="space-y-4">
      {/* Streak + week summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl border border-border bg-surface p-5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <Flame className="h-3.5 w-3.5" /> {t("ret.streak")}
          </div>
          <div className="mt-2 font-display text-4xl font-bold">{stats.currentStreak}</div>
          <div className="text-xs text-muted-foreground">{t("ret.longest")} {stats.longestStreak} {t("ret.days")}</div>
        </div>
        <div className="rounded-3xl border border-border bg-surface p-5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" /> {t("ret.this_week")}
          </div>
          <div className="mt-2 font-display text-4xl font-bold">{stats.thisWeekWorkouts}</div>
          <div className="text-xs text-muted-foreground">{stats.thisWeekMinutes} {t("ret.min")} · {stats.thisWeekVolumeKg} kg</div>
        </div>
      </div>

      {/* Week chart */}
      <div className="rounded-3xl border border-border bg-surface p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("ret.week_overview")}</div>
          <div className="text-xs text-muted-foreground">{stats.daysActiveThisWeek}/7 {t("ret.active")}</div>
        </div>
        <div className="flex h-24 items-end gap-2">
          {weekDays.map((d) => {
            const h = (d.workouts / maxWorkouts) * 100;
            const today = d.date === new Date().toISOString().slice(0, 10);
            return (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-full w-full items-end">
                  <div
                    className={`w-full rounded-md transition-all ${d.workouts > 0 ? "bg-foreground" : "bg-muted"}`}
                    style={{ height: d.workouts > 0 ? `${Math.max(h, 12)}%` : "4px" }}
                  />
                </div>
                <div className={`text-[10px] ${today ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{d.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges */}
      <div className="rounded-3xl border border-border bg-surface p-5">
        <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <Trophy className="h-3.5 w-3.5" /> {t("ret.badges")} ({earnedBadgeIds.size}/{BADGES.length})
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {BADGES.map((b) => {
            const earned = earnedBadgeIds.has(b.id);
            return (
              <div
                key={b.id}
                className={`flex flex-col items-center gap-1 rounded-2xl border p-3 text-center transition ${earned ? "border-border bg-background" : "border-border/40 bg-muted/20 opacity-50"}`}
                title={b.description}
              >
                <div className="text-2xl">{b.icon}</div>
                <div className="text-[11px] font-semibold leading-tight">{b.name}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Push toggle */}
      <div className="flex items-center justify-between rounded-3xl border border-border bg-surface p-5">
        <div>
          <div className="font-semibold">{t("ret.reminders")}</div>
          <div className="text-xs text-muted-foreground">
            {perm === "unsupported"
              ? t("ret.unsupported")
              : perm === "denied"
              ? t("ret.denied")
              : perm === "granted"
              ? t("ret.granted_desc")
              : t("ret.enable_desc")}
          </div>
        </div>
        <Button
          variant={perm === "granted" ? "outline" : "default"}
          size="sm"
          disabled={busy || perm === "unsupported" || perm === "denied"}
          onClick={toggle}
        >
          {perm === "granted" ? <><BellOff className="mr-1.5 h-4 w-4" /> {t("ret.off")}</> : <><BellRing className="mr-1.5 h-4 w-4" /> {t("ret.on")}</>}
        </Button>
      </div>
    </section>
  );
}

