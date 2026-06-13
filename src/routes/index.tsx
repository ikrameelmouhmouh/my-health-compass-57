import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Apex — Calibrate your metabolism" },
      { name: "description", content: "A precision nutrition, fasting and training protocol for serious people. Calibrate your daily targets in under two minutes." },
      { property: "og:title", content: "Apex — Calibrate your metabolism" },
      { property: "og:description", content: "Precision nutrition and training. Calibrate your daily targets in two minutes." },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  return (
    <main className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col overflow-hidden bg-background px-6 pb-10 pt-14">
      {/* Glow */}
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 size-[420px] -translate-x-1/2 rounded-full bg-brand/20 blur-3xl" />

      <header className="relative flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-lg border border-hairline bg-surface">
            <div className="size-2 rounded-full bg-brand shadow-[0_0_12px_currentColor]" />
          </div>
          <span className="font-display text-sm font-semibold tracking-tight">APEX</span>
        </div>
        <span className="font-display text-[10px] uppercase tracking-[0.25em] text-muted-foreground">v 1.0</span>
      </header>

      <section className="relative mt-20 flex-1">
        <p className="font-display text-[10px] uppercase tracking-[0.3em] text-brand">Protocol initialized</p>
        <h1 className="mt-5 font-display text-[44px] font-bold uppercase leading-[0.95] tracking-tight text-balance">
          Calibrate your <span className="text-brand">metabolism.</span>
        </h1>
        <p className="mt-5 max-w-[36ch] text-pretty text-sm leading-relaxed text-muted-foreground">
          Precision nutrition and training, built around the way your body actually moves.
          Set your blueprint in under two minutes.
        </p>

        {/* Metric strip */}
        <div className="mt-10 grid grid-cols-3 gap-3">
          {[
            { k: "BMR", v: "MSJ" },
            { k: "TDEE", v: "5 lvl" },
            { k: "Macro", v: "P / F / C" },
          ].map((m) => (
            <div key={m.k} className="rounded-2xl border border-hairline bg-surface px-3 py-4">
              <div className="font-display text-[9px] uppercase tracking-widest text-muted-foreground">{m.k}</div>
              <div className="mt-2 font-display text-sm font-semibold">{m.v}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative mt-10 space-y-3">
        <Link
          to="/register"
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-foreground font-display text-sm font-bold uppercase tracking-widest text-background transition-colors hover:bg-brand hover:text-brand-foreground"
        >
          Begin assessment
          <ArrowRight className="size-4" />
        </Link>
        <Link
          to="/login"
          className="flex h-12 w-full items-center justify-center rounded-2xl border border-hairline bg-surface text-sm font-medium text-foreground"
        >
          I already have an account
        </Link>
        <p className="pt-2 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
          By continuing you agree to the protocol terms.
        </p>
      </footer>
    </main>
  );
}
