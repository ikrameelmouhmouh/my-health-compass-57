import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Beta namespace; type it locally so TS is happy without grepping node_modules.
type OAuthDetails = {
  client?: { name?: string; client_id?: string };
  redirect_url?: string;
  redirect_to?: string;
  scope?: string;
  scopes?: string[];
};
type OAuthResp<T> = { data: T | null; error: { message: string } | null };
const oauth = supabase.auth as unknown as {
  oauth: {
    getAuthorizationDetails: (id: string) => Promise<OAuthResp<OAuthDetails>>;
    approveAuthorization: (id: string) => Promise<OAuthResp<OAuthDetails>>;
    denyAuthorization: (id: string) => Promise<OAuthResp<OAuthDetails>>;
  };
};

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/login", search: { next } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth.oauth.getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-background px-6 py-10">
      <h1 className="font-display text-xl font-semibold">Kan deze aanvraag niet laden</h1>
      <p className="mt-3 text-sm text-muted-foreground">{String((error as Error)?.message ?? error)}</p>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = approve
      ? await oauth.oauth.approveAuthorization(authorization_id)
      : await oauth.oauth.denyAuthorization(authorization_id);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("Geen redirect ontvangen van de autorisatieserver.");
      return;
    }
    window.location.href = target;
  }

  const clientName = details?.client?.name ?? "een app";

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-background px-6 py-10">
      <div className="mt-6">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand/10 text-3xl font-serif text-brand">
          A
        </div>
        <h1 className="mt-6 text-center font-display text-2xl font-semibold tracking-tight">
          Verbind {clientName} met Alyva
        </h1>
        <p className="mt-3 text-center text-sm text-muted-foreground">
          Dit geeft {clientName} toegang om Alyva-tools namens jou te gebruiken — je trainingen, activiteiten,
          gewicht en profielinstellingen lezen en waar toegestaan bijwerken.
        </p>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Toegang loopt via jouw account. Alyva's toegangsregels (RLS) blijven van kracht.
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="mt-auto space-y-2 pt-8">
        <button
          type="button"
          disabled={busy}
          onClick={() => decide(true)}
          className="flex h-14 w-full items-center justify-center rounded-2xl bg-primary font-display text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {busy ? "…" : "Toestaan"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => decide(false)}
          className="flex h-12 w-full items-center justify-center rounded-2xl border border-border bg-card text-sm font-medium disabled:opacity-50"
        >
          Weigeren
        </button>
      </div>
    </main>
  );
}
