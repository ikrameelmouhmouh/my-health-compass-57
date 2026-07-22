import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Sparkles, Target, Heart, Map, Flame, Camera, CalendarDays } from "lucide-react";
import { useT, useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/intro")({
  head: () => ({ meta: [{ title: "Welcome — Alyva" }] }),
  component: Intro,
});

function Intro() {
  const t = useT();
  const { dir } = useI18n();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("alyva.app_mode") === "edit") {
      navigate({ to: "/login", replace: true });
    }
  }, [navigate]);

  const slides = [
    { icon: null,        title: t("intro.s0.title"), desc: t("intro.s0.desc"), brand: true },
    { icon: Sparkles,    title: t("intro.s1.title"), desc: t("intro.s1.desc") },
    { icon: Flame,       title: t("intro.s_nutr.title"), desc: t("intro.s_nutr.desc") },
    { icon: Camera,      title: t("intro.s_scan.title"), desc: t("intro.s_scan.desc") },
    { icon: CalendarDays,title: t("intro.s_mealprep.title"), desc: t("intro.s_mealprep.desc") },
    { icon: Target,      title: t("intro.s2.title"), desc: t("intro.s2.desc") },
    { icon: Heart,       title: t("intro.s3.title"), desc: t("intro.s3.desc") },
    { icon: Map,         title: t("intro.s4.title"), desc: t("intro.s4.desc") },
  ];

  const isLast = step === slides.length - 1;
  const current = slides[step];
  const Icon = current.icon;

  function finish() {
    try { localStorage.setItem("vita.intro_done", "1"); } catch {}
    navigate({ to: "/welcome" });
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-background px-6 pb-8 pt-8">
      <div className="flex items-center justify-between">
        <button
          onClick={() => (step === 0 ? navigate({ to: "/" }) : setStep(step - 1))}
          className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card"
          aria-label="Back"
        >
          <ArrowLeft className="size-4 rtl:rotate-180" />
        </button>

        {step === 0 ? (
          <div />
        ) : (
          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-2xl bg-brand/15">
              <span className="size-2 rounded-full bg-brand" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-display text-sm font-semibold tracking-tight">{t("app.name")}</span>
              <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-brand/80">{t("app.tagline")}</span>
            </div>
          </div>
        )}

        <button onClick={finish} className="text-sm font-medium text-muted-foreground">
          {t("intro.skip")}
        </button>
      </div>


      <section className={`relative flex-1 ${step === 0 ? "flex flex-col items-center justify-center" : "mt-12"}`}>
        {/* Illustration */}
        <div className="relative mx-auto flex h-56 w-56 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-brand/15 blur-3xl" />
          {current.brand ? (
            <div className="relative flex flex-col items-center">
              <div
                className="text-center font-display text-[28px] font-medium tracking-[0.18em] text-foreground"
                style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif" }}
              >
                {slides[step].title}
              </div>
              <div className="font-display text-[140px] leading-none font-semibold text-brand" style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif" }}>
                A
              </div>
              <div className="mt-3 text-[10px] font-medium uppercase tracking-[0.3em] text-brand/80">
                Alive · You · Vitality
              </div>
            </div>
          ) : Icon ? (
            <div className="relative grid size-40 place-items-center rounded-[2rem] bg-gradient-to-br from-brand/80 to-brand/40 shadow-[0_30px_60px_-30px_color-mix(in_oklab,var(--brand)_55%,transparent)]">
              <Icon className="size-16 text-brand-foreground" strokeWidth={1.5} />
            </div>
          ) : null}
        </div>

        {!current.brand && (
          <div className="mt-10 text-center">
            <h1 key={step} className="animate-in fade-in slide-in-from-bottom-2 duration-500 font-display text-3xl font-semibold tracking-tight text-balance">
              {slides[step].title}
            </h1>
            <p key={`d-${step}`} className="animate-in fade-in slide-in-from-bottom-3 duration-700 mx-auto mt-4 max-w-[36ch] text-pretty text-[15px] leading-relaxed text-muted-foreground">
              {slides[step].desc}
            </p>
          </div>
        )}


        {/* Dots */}
        <div className="mt-10 flex items-center justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-1.5 rounded-full transition-all ${i === step ? "w-8 bg-brand" : "w-1.5 bg-border"}`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {isLast ? (
        <div className="space-y-3">
          <button
            onClick={finish}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-display text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {t("intro.get_started")}
            <ArrowRight className="size-4 rtl:rotate-180" />
          </button>
          <Link
            to="/login"
            onClick={() => { try { localStorage.setItem("vita.intro_done", "1"); } catch {} }}
            className="flex h-12 w-full items-center justify-center rounded-2xl border border-border bg-card text-sm font-medium"
          >
            {t("intro.have_account")}
          </Link>
        </div>
      ) : (
        <button
          onClick={() => setStep(step + 1)}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-display text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          {t("intro.next")}
          <ArrowRight className="size-4 rtl:rotate-180" />
        </button>
      )}
      {/* dir intentionally consumed to satisfy import in some bundlers */}
      <span hidden>{dir}</span>
    </main>
  );
}
