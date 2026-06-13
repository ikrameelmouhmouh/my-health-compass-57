import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Apple, Dumbbell, Timer, LineChart } from "lucide-react";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Your personal health plan starts here — Vita" },
      { name: "description", content: "Reach your goals through nutrition, fasting and fitness — all in one app." },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  const t = useT();

  const bullets = [
    { icon: Apple,     label: t("welcome.bullets.nutrition") },
    { icon: Timer,     label: t("welcome.bullets.fasting") },
    { icon: Dumbbell,  label: t("welcome.bullets.workouts") },
    { icon: LineChart, label: t("welcome.bullets.progress") },
  ];

  return (
    <main className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col overflow-hidden bg-background px-6 pb-10 pt-14">
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 size-[460px] -translate-x-1/2 rounded-full bg-brand/15 blur-3xl" />

      <header className="relative flex items-center gap-2">
        <div className="grid size-9 place-items-center rounded-2xl bg-brand/15">
          <span className="size-2.5 rounded-full bg-brand" />
        </div>
        <span className="font-display text-base font-semibold tracking-tight">{t("app.name")}</span>
      </header>

      <section className="relative mt-16 flex-1">
        <h1 className="font-display text-[40px] font-semibold leading-[1.05] tracking-tight text-balance">
          {t("welcome.title")}
        </h1>
        <p className="mt-5 max-w-[36ch] text-pretty text-[15px] leading-relaxed text-muted-foreground">
          {t("welcome.subtitle")}
        </p>

        <div className="mt-10 grid grid-cols-2 gap-3">
          {bullets.map((b) => (
            <div key={b.label} className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5">
              <div className="grid size-9 place-items-center rounded-xl bg-brand/15">
                <b.icon className="size-4 text-brand" strokeWidth={2} />
              </div>
              <span className="font-display text-sm font-semibold">{b.label}</span>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative mt-8 space-y-3">
        <Link
          to="/register"
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-display text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          {t("welcome.cta.primary")}
          <ArrowRight className="size-4 rtl:rotate-180" />
        </Link>
        <Link
          to="/login"
          className="flex h-12 w-full items-center justify-center rounded-2xl border border-border bg-card text-sm font-medium"
        >
          {t("welcome.cta.secondary")}
        </Link>
        <p className="pt-2 text-center text-xs text-muted-foreground">{t("welcome.terms")}</p>
      </footer>
    </main>
  );
}
