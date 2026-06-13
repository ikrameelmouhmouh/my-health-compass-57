import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create your account — Apex" },
      { name: "description", content: "Create your Apex account to begin your precision health protocol." },
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
  const navigate = useNavigate();
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
    const { error } = await supabase.auth.signUp({
      email: result.data.email,
      password: result.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/onboarding`,
        data: { display_name: result.data.displayName },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created. Calibrating...");
    navigate({ to: "/onboarding" });
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-background px-6 pb-10 pt-10">
      <Link to="/" className="inline-flex size-10 items-center justify-center rounded-full border border-hairline bg-surface">
        <ArrowLeft className="size-4" />
      </Link>

      <div className="mt-10">
        <p className="font-display text-[10px] uppercase tracking-[0.3em] text-brand">Step 01 / 03</p>
        <h1 className="mt-3 font-display text-4xl font-bold uppercase tracking-tight">
          Forge your <span className="text-brand">blueprint.</span>
        </h1>
        <p className="mt-3 max-w-[40ch] text-sm leading-relaxed text-muted-foreground">
          Create an account so your protocol travels with you.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-8 space-y-3">
        <Field label="Display name" error={errors.displayName}>
          <input
            type="text"
            autoComplete="name"
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            placeholder="Elias Thorne"
            className="w-full bg-transparent text-base font-medium outline-none placeholder:text-muted-foreground/50"
          />
        </Field>
        <Field label="Email" error={errors.email}>
          <input
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@domain.com"
            className="w-full bg-transparent text-base font-medium outline-none placeholder:text-muted-foreground/50"
          />
        </Field>
        <Field label="Password" error={errors.password}>
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
          className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand font-display text-sm font-bold uppercase tracking-widest text-brand-foreground transition-opacity disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate protocol"}
          <ArrowRight className="size-4" />
        </button>
      </form>

      <p className="mt-auto pt-8 text-center text-sm text-muted-foreground">
        Already calibrated?{" "}
        <Link to="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}

export function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-2xl border bg-surface px-4 py-3 transition-colors ${error ? "border-destructive/60" : "border-hairline focus-within:border-brand/60"}`}>
      <label className="block font-display text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      <div className="mt-1">{children}</div>
      {error ? <p className="mt-1 text-[11px] text-destructive">{error}</p> : null}
    </div>
  );
}
