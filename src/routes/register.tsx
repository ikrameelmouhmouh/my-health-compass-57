import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useT, useI18n } from "@/lib/i18n";

function safeNext(next: string | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

export const Route = createFileRoute("/register")({
  validateSearch: (s: { next?: unknown }) => ({
    next: typeof s.next === "string" ? s.next : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Create your account — Alyva" },
      { name: "description", content: "Create your Alyva account to start your personalized health plan." },
    ],
  }),
  component: Register,
});

const schema = z.object({
  displayName: z.string().trim().min(1, "Required").max(60),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Min 8 characters").max(72),
});

function Register() {
  const t = useT();
  const { lang } = useI18n();
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const [form, setForm] = useState({ displayName: "", email: "", password: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = schema.safeParse(form);
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      for (const issue of result.error.issues) {
        const k = issue.path[0] as keyof typeof form;
        fieldErrors[k] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    const target = safeNext(next);
    const { data, error } = await supabase.auth.signUp({
      email: result.data.email,
      password: result.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}${target ?? "/onboarding"}`,
        data: { display_name: result.data.displayName },
      },
    });
    if (error) { setLoading(false); toast.error(error.message); return; }

    // Save chosen language to profile (best-effort)
    if (data.user) {
      await supabase.from("profiles").update({ language: lang }).eq("id", data.user.id);
    }
    try { localStorage.setItem("vita.has_account", "1"); } catch {}
    setLoading(false);
    if (target) {
      window.location.href = target;
      return;
    }
    navigate({ to: "/onboarding" });
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-background px-6 pb-10 pt-10">
      <Link to="/welcome" className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card">
        <ArrowLeft className="size-4 rtl:rotate-180" />
      </Link>

      <div className="mt-10">
        <h1 className="font-display text-3xl font-semibold tracking-tight">{t("auth.register.title")}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{t("auth.register.subtitle")}</p>
      </div>

      <form onSubmit={onSubmit} className="mt-8 space-y-3">
        <Field label={t("auth.field.name")} error={errors.displayName}>
          <input
            type="text"
            autoComplete="name"
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            placeholder="Alex"
            className="w-full bg-transparent text-base font-medium outline-none placeholder:text-muted-foreground/50"
          />
        </Field>
        <Field label={t("auth.field.email")} error={errors.email}>
          <input
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
            className="w-full bg-transparent text-base font-medium outline-none placeholder:text-muted-foreground/50"
          />
        </Field>
        <Field label={t("auth.field.password")} error={errors.password}>
          <input
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
            className="w-full bg-transparent text-base font-medium outline-none placeholder:text-muted-foreground/50"
          />
        </Field>

        <button
          type="submit"
          disabled={loading}
          className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-display text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-50"
        >
          {loading ? "…" : t("auth.register.cta")}
          <ArrowRight className="size-4 rtl:rotate-180" />
        </button>
      </form>

      <p className="mt-auto pt-8 text-center text-sm text-muted-foreground">
        {t("auth.register.switch")}{" "}
        <Link to="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          {t("auth.sign_in")}
        </Link>
      </p>
    </main>
  );
}

export function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-2xl border bg-card px-4 py-3 transition-colors ${error ? "border-destructive/60" : "border-border focus-within:border-brand/60"}`}>
      <label className="block font-display text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <div className="mt-1">{children}</div>
      {error ? <p className="mt-1 text-[11px] text-destructive">{error}</p> : null}
    </div>
  );
}
