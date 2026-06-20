import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { ChevronLeft, Send, Sparkles, Square } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import { useT, useI18n } from "@/lib/i18n";
import { getThreadMessages } from "@/lib/chat.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/ai-coach/$threadId")({
  component: ChatPage,
});

function ChatPage() {
  const { threadId } = Route.useParams();
  const t = useT();
  const { lang } = useI18n();
  const navigate = useNavigate();
  const [initial, setInitial] = useState<UIMessage[] | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [input, setInput] = useState("");

  // Get bearer token for transport
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setToken(data.session?.access_token ?? null);
    });
  }, []);

  // Load message history
  useEffect(() => {
    let cancelled = false;
    getThreadMessages({ data: { threadId } })
      .then((rows) => {
        if (cancelled) return;
        const mapped: UIMessage[] = rows.map((r) => ({
          id: r.id,
          role: r.role === "assistant" ? "assistant" : "user",
          parts: [{ type: "text", text: r.content }],
        }));
        setInitial(mapped);
      })
      .catch((e) => {
        console.error(e);
        if (!cancelled) setInitial([]);
      });
    return () => {
      cancelled = true;
    };
  }, [threadId]);

  if (initial === null || token === null) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-background">
        <div className="size-6 animate-spin rounded-full border-2 border-hairline border-t-brand" />
      </div>
    );
  }

  return (
    <ChatWindow
      threadId={threadId}
      lang={lang}
      token={token}
      initial={initial}
      input={input}
      setInput={setInput}
      t={t}
      onBack={() => navigate({ to: "/ai-coach" })}
    />
  );
}

function ChatWindow({
  threadId,
  lang,
  token,
  initial,
  input,
  setInput,
  t,
  onBack,
}: {
  threadId: string;
  lang: string;
  token: string;
  initial: UIMessage[];
  input: string;
  setInput: (v: string) => void;
  t: (k: string) => string;
  onBack: () => void;
}) {
  const transport = useRef(
    new DefaultChatTransport({
      api: "/api/chat",
      headers: { Authorization: `Bearer ${token}` },
      body: { threadId, lang },
    }),
  ).current;

  const { messages, sendMessage, status, stop } = useChat({
    id: threadId,
    messages: initial,
    transport,
    onError: (err) => {
      console.error(err);
      const msg = err?.message ?? "";
      if (msg.includes("429")) toast.error(t("chat.error.rate"));
      else if (msg.includes("402")) toast.error(t("chat.error.credits"));
      else toast.error(t("chat.error.generic"));
    },
  });

  const isBusy = status === "submitted" || status === "streaming";
  const scrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, status]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [threadId, status]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isBusy) return;
    sendMessage({ text });
    setInput("");
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 ios-chrome border-b border-hairline">
        <div className="flex items-center gap-2 px-3 pb-2.5 pt-[max(env(safe-area-inset-top),12px)]">
          <button
            type="button"
            onClick={onBack}
            aria-label={t("chat.back")}
            className="grid size-9 place-items-center rounded-full text-foreground hover:bg-accent"
          >
            <ChevronLeft className="size-5 rtl:rotate-180" />
          </button>
          <div className="grid size-9 place-items-center rounded-2xl bg-brand/15 text-brand">
            <Sparkles className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-sm font-semibold">
              {t("chat.title")}
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div
        ref={scrollerRef}
        className="flex-1 space-y-3 overflow-y-auto px-4 py-4 pb-[180px]"
      >
        {messages.length === 0 && (
          <div className="mx-auto max-w-xs rounded-2xl bg-accent/50 p-4 text-center text-sm text-muted-foreground">
            {t("chat.greeting")}
          </div>
        )}
        {messages.map((m) => {
          const text = m.parts
            .map((p) => (p.type === "text" ? p.text : ""))
            .join("");
          const isUser = m.role === "user";
          return (
            <div
              key={m.id}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              {isUser ? (
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-brand px-4 py-2.5 text-sm text-brand-foreground">
                  {text}
                </div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-[90%] text-foreground prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-headings:my-2">
                  <ReactMarkdown>{text || " "}</ReactMarkdown>
                </div>
              )}
            </div>
          );
        })}
        {status === "submitted" && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-2xl bg-accent/50 px-3 py-2 text-sm text-muted-foreground">
              <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground" />
              <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:150ms]" />
              <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:300ms]" />
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={handleSubmit}
        className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+64px)] z-30 mx-auto w-full max-w-md px-3"
      >
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as unknown as FormEvent);
              }
            }}
            rows={1}
            placeholder={t("chat.placeholder")}
            className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          {isBusy ? (
            <button
              type="button"
              onClick={() => stop()}
              aria-label={t("chat.stop")}
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-foreground"
            >
              <Square className="size-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label={t("chat.send")}
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand text-brand-foreground disabled:opacity-40"
            >
              <Send className="size-4" />
            </button>
          )}
        </div>
      </form>
    </main>
  );
}
