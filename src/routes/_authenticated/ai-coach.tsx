import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Sparkles, Plus, MessageCircle, Trash2, ChevronRight } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useEffect, useState } from "react";
import {
  listThreads,
  createThread,
  deleteThread,
  type ChatThread,
} from "@/lib/chat.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/ai-coach")({
  component: AiCoachPage,
});

function AiCoachPage() {
  const t = useT();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<ChatThread[] | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listThreads()
      .then((rows) => {
        if (!cancelled) setThreads(rows);
      })
      .catch((e) => {
        console.error(e);
        if (!cancelled) setThreads([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleNew() {
    if (creating) return;
    setCreating(true);
    try {
      const th = await createThread({ data: {} });
      navigate({ to: "/ai-coach/$threadId", params: { threadId: th.id } });
    } catch (e) {
      console.error(e);
      toast.error(t("chat.error.generic"));
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t("chat.delete_confirm"))) return;
    try {
      await deleteThread({ data: { threadId: id } });
      setThreads((prev) => (prev ?? []).filter((th) => th.id !== id));
    } catch (e) {
      console.error(e);
      toast.error(t("chat.error.generic"));
    }
  }

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-background px-5 pb-32 pt-10">
      <div className="flex items-center gap-3">
        <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand/15 text-brand">
          <Sparkles className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-2xl font-semibold tracking-tight">
            {t("chat.title")}
          </h1>
          <p className="text-[12px] text-muted-foreground">{t("coach.subtitle")}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleNew}
        disabled={creating}
        className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand text-sm font-semibold text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        <Plus className="size-4" />
        {t("chat.new")}
      </button>

      <section className="mt-6">
        {threads === null && (
          <div className="grid place-items-center py-10">
            <div className="size-6 animate-spin rounded-full border-2 border-hairline border-t-brand" />
          </div>
        )}

        {threads !== null && threads.length === 0 && (
          <div className="mt-4 rounded-2xl border border-dashed border-border bg-card p-6 text-center">
            <MessageCircle className="mx-auto size-6 text-muted-foreground" />
            <p className="mt-2 font-display text-sm font-semibold">
              {t("chat.empty.title")}
            </p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              {t("chat.empty.desc")}
            </p>
          </div>
        )}

        {threads !== null && threads.length > 0 && (
          <ul className="space-y-2">
            {threads.map((th) => (
              <li
                key={th.id}
                className="flex items-stretch overflow-hidden rounded-2xl border border-border bg-card"
              >
                <Link
                  to="/ai-coach/$threadId"
                  params={{ threadId: th.id }}
                  className="flex flex-1 items-center gap-3 px-4 py-3.5 text-left"
                >
                  <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-foreground">
                    <MessageCircle className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display text-sm font-semibold">
                      {th.title}
                    </div>
                    <div className="truncate text-[11px] text-muted-foreground">
                      {new Date(th.last_message_at).toLocaleString()}
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground rtl:rotate-180" />
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(th.id)}
                  aria-label={t("chat.delete")}
                  className="grid w-12 place-items-center border-l border-border text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
