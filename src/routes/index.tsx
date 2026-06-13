import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Check, ArrowRight } from "lucide-react";
import { LANGUAGES, useI18n, type Language } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vita — Your personal health plan" },
      { name: "description", content: "Nutrition, intermittent fasting, workouts and progress — all in one calm, personalized app." },
      { property: "og:title", content: "Vita — Your personal health plan" },
      { property: "og:description", content: "Nutrition, fasting, workouts and progress in one app." },
    ],
  }),
  component: LanguagePicker,
});

function LanguagePicker() {
  const { lang, setLang, t } = useI18n();
  const navigate = useNavigate();

  // First-run routing: if user has already been through this, jump them ahead.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const introDone = localStorage.getItem("vita.intro_done");
    const langSet = localStorage.getItem("vita.lang");
    if (langSet && introDone) navigate({ to: "/welcome", replace: true });
    else if (langSet) navigate({ to: "/intro", replace: true });
  }, [navigate]);

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-background px-6 pb-10 pt-14">
      <div className="flex items-center gap-2">
        <div className="grid size-9 place-items-center rounded-2xl bg-brand/15">
          <span className="size-2.5 rounded-full bg-brand" />
        </div>
        <span className="font-display text-base font-semibold tracking-tight">{t("app.name")}</span>
      </div>

      <div className="mt-10">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-balance">{t("lang.title")}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{t("lang.subtitle")}</p>
      </div>

      <div className="mt-8 space-y-2.5">
        {LANGUAGES.map((l) => {
          const selected = lang === l.code;
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => setLang(l.code as Language)}
              className={`flex w-full items-center gap-4 rounded-2xl border bg-card px-4 py-4 text-left transition-all ${
                selected ? "border-brand/70 ring-2 ring-brand/15" : "border-border hover:border-brand/30"
              }`}
            >
              <span className="text-2xl leading-none" aria-hidden>{l.flag}</span>
              <div className="flex-1">
                <div className="font-display text-base font-semibold">{l.native}</div>
                <div className="text-xs text-muted-foreground">{l.label}</div>
              </div>
              <div className={`grid size-6 place-items-center rounded-full transition-colors ${selected ? "bg-brand text-brand-foreground" : "border border-border"}`}>
                {selected && <Check className="size-3.5" strokeWidth={3} />}
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => navigate({ to: "/intro" })}
        className="mt-auto mb-2 mt-10 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-display text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        {t("lang.continue")}
        <ArrowRight className="size-4 rtl:rotate-180" />
      </button>
    </main>
  );
}
