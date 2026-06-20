import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Camera, ChefHat, Dumbbell, Apple, LineChart, MessageCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/ai-coach")({
  component: AiCoachPage,
});

function AiCoachPage() {
  const { t } = useI18n();
  const capabilities = [
    { icon: Camera, title: t("coach.cap.photo"), desc: t("coach.cap.photo_desc") },
    { icon: Apple, title: t("coach.cap.cal"), desc: t("coach.cap.cal_desc") },
    { icon: ChefHat, title: t("coach.cap.meal"), desc: t("coach.cap.meal_desc") },
    { icon: Dumbbell, title: t("coach.cap.workout"), desc: t("coach.cap.workout_desc") },
    { icon: LineChart, title: t("coach.cap.progress"), desc: t("coach.cap.progress_desc") },
    { icon: MessageCircle, title: t("coach.cap.advice"), desc: t("coach.cap.advice_desc") },
  ];

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-background px-5 pb-32 pt-10">
      <div className="flex items-center gap-3">
        <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand/15 text-brand">
          <Sparkles className="size-6" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-semibold tracking-tight">{t("coach.title")}</h1>
          <p className="text-[12px] text-muted-foreground">{t("coach.subtitle")}</p>
        </div>
      </div>

      <p className="mt-5 text-sm text-muted-foreground">{t("coach.intro")}</p>

      <section className="mt-6 grid grid-cols-1 gap-2.5">
        {capabilities.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-3.5">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-foreground">
              <Icon className="size-4" />
            </div>
            <div className="min-w-0">
              <div className="font-display text-sm font-semibold">{title}</div>
              <div className="text-[12px] text-muted-foreground">{desc}</div>
            </div>
          </div>
        ))}
      </section>

      <button
        type="button"
        disabled
        className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand text-sm font-semibold text-brand-foreground opacity-70"
      >
        <MessageCircle className="size-4" />
        {t("coach.cta")}
      </button>
    </main>
  );
}
