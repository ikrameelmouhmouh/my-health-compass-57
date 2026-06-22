import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Pause, Play, Square, Flame, Heart, Ruler, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { ACTIVITIES } from "@/routes/_authenticated/fitness";
import {
  computeElapsedSec,
  estimateKcal,
  formatTimer,
  useActiveActivitySession,
  type ActivityIntensity,
  type FinishedActivitySession,
} from "@/lib/activity-session";
import { primeAudio } from "@/lib/workout-session";
import { ActivitySummary } from "@/components/workout/activity-summary";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/activity-session/$activityId")({
  component: ActivitySessionPage,
});

function ActivitySessionPage() {
  const { activityId } = Route.useParams();
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const router = useRouter();
  const activity = useMemo(() => ACTIVITIES.find((a) => a.id === activityId), [activityId]);

  const { data: profile } = useQuery({
    queryKey: ["profile-weight", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("current_weight_kg")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });
  const weightKg = Number(profile?.current_weight_kg) || 70;

  const { session, loaded, start, pause, resume, finish, cancel } = useActiveActivitySession();
  const [intensity, setIntensity] = useState<ActivityIntensity>("normal");
  const [summary, setSummary] = useState<FinishedActivitySession | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);
  const [now, setNow] = useState(Date.now());

  // tick every second
  useEffect(() => {
    if (!session || session.pausedAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [session]);

  // wake lock
  const wakeRef = useRef<WakeLockSentinel | null>(null);
  useEffect(() => {
    if (!session) return;
    const acquire = async () => {
      try {
        wakeRef.current = await (navigator as Navigator & { wakeLock?: { request: (t: string) => Promise<WakeLockSentinel> } }).wakeLock?.request("screen") ?? null;
      } catch { /* ignore */ }
    };
    acquire();
    const onVis = () => { if (document.visibilityState === "visible") acquire(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      wakeRef.current?.release().catch(() => {});
      wakeRef.current = null;
    };
  }, [session]);

  // auto-redirect if activity not found
  useEffect(() => {
    if (!activity) navigate({ to: "/fitness" });
  }, [activity, navigate]);

  if (!activity || !loaded) {
    return <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-background px-5 pt-10" />;
  }

  if (summary) {
    return (
      <ActivitySummary
        session={summary}
        onClose={() => navigate({ to: "/fitness" })}
        onDelete={() => navigate({ to: "/fitness" })}
      />
    );
  }

  // Pre-start screen
  if (!session || session.activityId !== activity.id) {
    const intensities: ActivityIntensity[] = ["easy", "normal", "intense"];
    return (
      <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-background px-5 pb-32 pt-6">
        <button onClick={() => navigate({ to: "/fitness" })} className="flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowLeft className="size-4" /> {t("activity.back")}
        </button>

        <div className="mt-8 text-center">
          <div className="mx-auto grid size-20 place-items-center rounded-3xl bg-brand/15 text-brand">
            <activity.icon className="size-10" />
          </div>
          <h1 className="mt-4 font-display text-3xl font-semibold leading-tight">{t(`act.${activity.id}.name`)}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t(`act.${activity.id}.desc`)}</p>
          <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
            {t("fit.act.kcal_per_h", { n: activity.kcalPerHour })}
          </p>
        </div>

        <div className="mt-8">
          <p className="mb-2 text-sm font-semibold">{t("activity.intensity")}</p>
          <div className="grid grid-cols-3 gap-2">
            {intensities.map((i) => (
              <button
                key={i}
                onClick={() => setIntensity(i)}
                className={`rounded-2xl border p-3 text-sm font-medium transition ${
                  intensity === i ? "border-brand bg-brand/10 text-brand" : "border-border bg-card/50"
                }`}
              >
                {t(`act.intensity.${i}`)}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">{t("activity.intensity_hint")}</p>
        </div>

        <Button
          className="mt-8 h-14 w-full text-base"
          onClick={() => {
            primeAudio();
            start({
              activityId: activity.id,
              activityName: t(`act.${activity.id}.name`),
              kcalPerHour: activity.kcalPerHour,
              intensity,
              weightKg,
            });
          }}
        >
          <Play className="mr-2 size-5" /> {t("activity.start")}
        </Button>
      </main>
    );
  }

  // Active session screen
  const elapsed = computeElapsedSec(session, now);
  const kcal = estimateKcal(session, elapsed);
  const isPaused = !!session.pausedAt;

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-background px-5 pb-10 pt-6">
      <button
        onClick={() => setConfirmExit(true)}
        className="flex items-center gap-2 text-sm text-muted-foreground"
      >
        <ArrowLeft className="size-4" /> {session.activityName}
      </button>

      <div className="mt-10 flex flex-col items-center">
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          {isPaused ? t("activity.paused") : t("activity.in_progress")}
        </div>
        <div className="mt-3 font-display text-7xl font-semibold tabular-nums tracking-tight">
          {formatTimer(elapsed)}
        </div>
        <div className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">
          {t(`act.intensity.${session.intensity}`)}
        </div>
      </div>

      <div className="mt-10 space-y-3">
        <Metric icon={Flame} label={t("session.calories")} value={`${kcal} kcal`} />
        <Metric
          icon={Heart}
          label={t("activity.heart_rate")}
          value="—"
          hint={t("activity.healthkit_hint")}
        />
        <Metric
          icon={Ruler}
          label={t("activity.distance")}
          value="—"
          hint={t("activity.healthkit_hint")}
        />
      </div>

      <div className="mt-auto flex items-center justify-center gap-1 pt-6 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Activity className="size-3" /> {t("activity.source")}: {t("activity.source.estimate")}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {isPaused ? (
          <Button
            variant="outline"
            className="h-14 text-base"
            onClick={() => { primeAudio(); resume(); }}
          >
            <Play className="mr-2 size-5" /> {t("activity.resume")}
          </Button>
        ) : (
          <Button
            variant="outline"
            className="h-14 text-base"
            onClick={() => pause()}
          >
            <Pause className="mr-2 size-5" /> {t("activity.pause")}
          </Button>
        )}
        <Button
          className="h-14 bg-destructive text-base text-destructive-foreground hover:bg-destructive/90"
          onClick={() => {
            const finished = finish();
            if (finished) setSummary(finished);
          }}
        >
          <Square className="mr-2 size-5" /> {t("activity.stop")}
        </Button>
      </div>

      <AlertDialog open={confirmExit} onOpenChange={setConfirmExit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("activity.exit_title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("activity.exit_desc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("activity.exit_keep")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                cancel();
                router.navigate({ to: "/fitness" });
              }}
            >
              {t("activity.exit_discard")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

function Metric({ icon: Icon, label, value, hint }: { icon: typeof Flame; label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card/50 p-4">
      <div className="grid size-10 place-items-center rounded-xl bg-brand/15 text-brand">
        <Icon className="size-5" />
      </div>
      <div className="flex-1">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold leading-tight tabular-nums">{value}</p>
        {hint && <p className="text-[10px] text-muted-foreground/70">{hint}</p>}
      </div>
    </div>
  );
}
