import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Field } from "./register";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Apex" },
      { name: "description", content: "Sign in to your Apex account." },
    ],
  }),
  component: Login,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(1, "Required").max(72),
});

function Login() {
  const navigate = useNavigate();
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
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/profile" });
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-background px-6 pb-10 pt-10">
      <Link to="/" className="inline-flex size-10 items-center justify-center rounded-full border border-hairline bg-surface">
        <ArrowLeft className="size-4" />
      </Link>

      <div className="mt-10">
        <p className="font-display text-[10px] uppercase tracking-[0.3em] text-brand">Returning operator</p>
        <h1 className="mt-3 font-display text-4xl font-bold uppercase tracking-tight">
          Welcome <span className="text-brand">back.</span>
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">Resume your protocol where you left off.</p>
      </div>

      <form onSubmit={onSubmit} className="mt-8 space-y-3">
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
          className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand font-display text-sm font-bold uppercase tracking-widest text-brand-foreground disabled:opacity-50"
        >
          {loading ? "Authenticating..." : "Engage"}
          <ArrowRight className="size-4" />
        </button>
      </form>

      <p className="mt-auto pt-8 text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link to="/register" className="font-medium text-foreground underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </main>
  );
}
