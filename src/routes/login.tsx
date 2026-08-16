import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Field } from "./register";
import { useT } from "@/lib/i18n";

function safeNext(next: string | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

export const Route = createFileRoute("/login")({
  validateSearch: (s: { next?: unknown }): { next?: string } =>
    typeof s.next === "string" ? { next: s.next } : {},
  head: () => ({
    meta: [
      { title: "Sign in — Alyva" },
      { name: "description", content: "Sign in to your Alyva account." },
    ],
  }),
  component: Login,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(1, "Required").max(72),
});

function Login() {
  const t = useT();
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = schema.safeParse(form);
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as keyof typeof form] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(result.data);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    try { localStorage.setItem("vita.has_account", "1"); } catch {}
    const target = safeNext(next);
    if (target) {
      window.location.href = target;
      return;
    }
    navigate({ to: "/profile", replace: true });
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-background px-6 pb-10 pt-10">
      <Link to="/welcome" className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card">
        <ArrowLeft className="size-4 rtl:rotate-180" />
      </Link>

      <div className="mt-10">
        <h1 className="font-display text-3xl font-semibold tracking-tight">{t("auth.login.title")}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{t("auth.login.subtitle")}</p>
      </div>

      <form onSubmit={onSubmit} className="mt-8 space-y-3">
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
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
            className="w-full bg-transparent text-base font-medium outline-none placeholder:text-muted-foreground/50"
          />
        </Field>

        <button
          type="submit"
          disabled={loading}
          className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-display text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {loading ? "…" : t("auth.login.cta")}
          <ArrowRight className="size-4 rtl:rotate-180" />
        </button>
      </form>

      <p className="mt-auto pt-8 text-center text-sm text-muted-foreground">
        {t("auth.login.switch")}{" "}
        <Link to="/register" search={{ next: safeNext(next) ?? undefined }} className="font-medium text-foreground underline-offset-4 hover:underline">
          {t("auth.create_account")}
        </Link>
      </p>
    </main>
  );
}
