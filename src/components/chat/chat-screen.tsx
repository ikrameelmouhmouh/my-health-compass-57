import { useNavigate } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  Camera,
  ChevronLeft,
  Loader2,
  Menu,
  Plus,
  Send,
  Square,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function toFileParts(files: File[]) {
  return Promise.all(
    files.map(async (f) => ({
      type: "file" as const,
      mediaType: f.type || "image/jpeg",
      filename: f.name,
      url: await fileToDataUrl(f),
    })),
  );
}

import { useAuth } from "@/lib/auth-context";
import { useT, useI18n } from "@/lib/i18n";
import { createThread } from "@/lib/chat.functions";
import { supabase } from "@/integrations/supabase/client";
import { setPendingMessage, takePendingMessage } from "@/lib/chat-pending";
import { ChatHistoryDrawer } from "@/components/chat/history-drawer";

type QuickAction = {
  key: string;
  labelKey: string;
  promptKey: string;
  icon: string;
  scan?: boolean;
};

const QUICK_ACTIONS: QuickAction[] = [
  { key: "scan", labelKey: "chat.quick.scan", promptKey: "chat.image_caption", icon: "📷", scan: true },
  { key: "workout", labelKey: "chat.quick.workout", promptKey: "chat.quick.workout.prompt", icon: "🏋️" },
  { key: "meals", labelKey: "chat.quick.meals", promptKey: "chat.quick.meals.prompt", icon: "🥗" },
  { key: "tip", labelKey: "chat.quick.tip", promptKey: "chat.quick.tip.prompt", icon: "⚡" },
  { key: "week", labelKey: "chat.quick.week", promptKey: "chat.quick.week.prompt", icon: "📊" },
];

function getDisplayName(user: { user_metadata?: Record<string, unknown>; email?: string | null } | null) {
  const dn = (user?.user_metadata?.["display_name"] as string | undefined) ?? "";
  const trimmed = dn.trim();
  if (trimmed) return trimmed.split(" ")[0];
  const email = user?.email ?? "";
  if (email.includes("@")) {
    const part = email.split("@")[0];
    return part.charAt(0).toUpperCase() + part.slice(1);
  }
  return "";
}

function VitaAvatar({ size = 64 }: { size?: number }) {
  return (
    <div
      className="grid place-items-center rounded-full bg-gradient-to-br from-brand/40 to-brand/10 shadow-[0_0_60px_-10px_var(--brand)]"
      style={{ width: size, height: size }}
    >
      <div className="grid size-3/4 place-items-center rounded-full bg-gradient-to-br from-brand to-brand/60 text-brand-foreground">
        <div className="flex gap-1.5">
          <span className="block size-2 rounded-full bg-white/90" />
          <span className="block size-2 rounded-full bg-white/90" />
        </div>
      </div>
    </div>
  );
}

function ChipRow({
  onPick,
  onPickPhoto,
  t,
}: {
  onPick: (label: string, prompt: string) => void;
  onPickPhoto: () => void;
  t: (k: string, v?: Record<string, string | number>) => string;
}) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-1 [&::-webkit-scrollbar]:hidden">
      <div className="flex w-max gap-2">
        {QUICK_ACTIONS.map((q) => (
          <button
            key={q.key}
            type="button"
            onClick={() => {
              if (q.scan) onPickPhoto();
              else onPick(t(q.labelKey), t(q.promptKey));
            }}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <span aria-hidden>{q.icon}</span>
            {t(q.labelKey)}
          </button>
        ))}
      </div>
    </div>
  );
}

function Composer({
  input,
  setInput,
  onSubmit,
  onPickPhoto,
  isBusy,
  onStop,
  t,
  attachedName,
}: {
  input: string;
  setInput: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  onPickPhoto: () => void;
  isBusy: boolean;
  onStop?: () => void;
  t: (k: string) => string;
  attachedName?: string | null;
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  return (
    <form
      onSubmit={onSubmit}
      className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+64px)] z-30 mx-auto w-full max-w-md px-3"
    >
      {attachedName && (
        <div className="mb-2 flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 text-[12px] text-muted-foreground">
          <Camera className="size-3.5" />
          <span className="truncate">{attachedName}</span>
        </div>
      )}
      <div className="flex items-end gap-2 rounded-3xl border border-border bg-card p-2 shadow-sm">
        <button
          type="button"
          onClick={onPickPhoto}
          aria-label={t("chat.attach_photo")}
          className="grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-accent"
        >
          <Plus className="size-5" />
        </button>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit(e as unknown as FormEvent);
            }
          }}
          rows={1}
          placeholder={t("chat.placeholder")}
          className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-1 py-2 text-sm outline-none placeholder:text-muted-foreground"
        />
        {isBusy && onStop ? (
          <button
            type="button"
            onClick={onStop}
            aria-label={t("chat.stop")}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-foreground"
          >
            <Square className="size-4" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim() && !attachedName}
            aria-label={t("chat.send")}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-brand text-brand-foreground disabled:opacity-40"
          >
            <Send className="size-4" />
          </button>
        )}
      </div>
    </form>
  );
}

/** Empty greeting + quick actions shown above the composer in draft mode. */
function GreetingPanel({
  name,
  t,
}: {
  name: string;
  t: (k: string, v?: Record<string, string | number>) => string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 pb-4">
      <VitaAvatar size={88} />
      <p className="mt-6 text-center font-display text-xl font-semibold tracking-tight text-foreground">
        {name ? t("chat.welcome", { name }) : t("chat.welcome_anon")}
      </p>
    </div>
  );
}

/** Sticky header used on both draft and thread screens. */
function ChatHeader({
  showNewLink,
  activeThreadId,
  t,
}: {
  showNewLink: boolean;
  activeThreadId?: string;
  t: (k: string) => string;
}) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-30 ios-chrome border-b border-hairline">
      <div className="flex items-center justify-between gap-2 px-3 pb-2.5 pt-[max(env(safe-area-inset-top),12px)]">
        <ChatHistoryDrawer
          activeThreadId={activeThreadId}
          trigger={
            <button
              type="button"
              aria-label={t("chat.history")}
              className="grid size-9 place-items-center rounded-full text-foreground hover:bg-accent"
            >
              <Menu className="size-5" />
            </button>
          }
        />
        <div className="min-w-0 flex-1 text-center font-display text-sm font-semibold">
          Vita
        </div>
        {showNewLink ? (
          <button
            type="button"
            onClick={() => navigate({ to: "/ai-coach" })}
            aria-label={t("chat.new")}
            className="grid size-9 place-items-center rounded-full text-foreground hover:bg-accent"
          >
            <Plus className="size-5" />
          </button>
        ) : (
          <div className="size-9" />
        )}
      </div>
    </header>
  );
}

/* ────────────────────────────────────────────── DRAFT ───────── */
export function DraftChatScreen() {
  const t = useT();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const name = getDisplayName(user);

  async function startNewThread(text: string, attached?: File | null) {
    if (busy) return;
    setBusy(true);
    try {
      const th = await createThread({ data: {} });
      const files = attached ? [attached] : undefined;
      setPendingMessage(th.id, { text, files });
      navigate({ to: "/ai-coach/$threadId", params: { threadId: th.id } });
    } catch (e) {
      console.error(e);
      toast.error(t("chat.error.generic"));
      setBusy(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text && !file) return;
    const finalText = text || t("chat.image_caption");
    void startNewThread(finalText, file);
  }

  function handlePick(_label: string, prompt: string) {
    void startNewThread(prompt, null);
  }

  function handlePickPhoto() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setFile(f);
    e.target.value = "";
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-background">
      <ChatHeader showNewLink={false} t={t} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="flex flex-1 flex-col pb-[calc(env(safe-area-inset-bottom)+200px)]">
        <GreetingPanel name={name} t={t} />
        <div className="px-4">
          <ChipRow onPick={handlePick} onPickPhoto={handlePickPhoto} t={t} />
        </div>
      </div>
      {busy && (
        <div className="pointer-events-none fixed inset-0 z-40 grid place-items-center bg-background/40">
          <Loader2 className="size-6 animate-spin text-brand" />
        </div>
      )}
      <Composer
        input={input}
        setInput={setInput}
        onSubmit={handleSubmit}
        onPickPhoto={handlePickPhoto}
        isBusy={false}
        t={t}
        attachedName={file?.name ?? null}
      />
      {/* unused — keeps Suppress unused-import for lang */}
      <span className="hidden" data-lang={lang} />
    </main>
  );
}

/* ────────────────────────────────────────── THREAD VIEW ───────── */
export function ThreadChatScreen({
  threadId,
  initialMessages,
}: {
  threadId: string;
  initialMessages: UIMessage[];
}) {
  const t = useT();
  const { lang } = useI18n();
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setToken(data.session?.access_token ?? null);
    });
  }, []);

  // Stable refs the transport reads at request time so we don't recreate it.
  const threadIdRef = useRef(threadId);
  const langRef = useRef(lang);
  const tokenRef = useRef<string | null>(token);
  useEffect(() => {
    threadIdRef.current = threadId;
  }, [threadId]);
  useEffect(() => {
    langRef.current = lang;
  }, [lang]);
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        headers: () => ({
          Authorization: tokenRef.current ? `Bearer ${tokenRef.current}` : "",
        }),
        body: () => ({ threadId: threadIdRef.current, lang: langRef.current }),
      }),
    [],
  );

  const { messages, sendMessage, status, stop } = useChat({
    id: threadId,
    messages: initialMessages,
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

  // Send a pending message handed off from the draft screen on first mount.
  const sentPendingRef = useRef(false);
  useEffect(() => {
    if (sentPendingRef.current) return;
    if (!token) return; // wait for bearer
    const pending = takePendingMessage(threadId);
    if (!pending) {
      sentPendingRef.current = true;
      return;
    }
    sentPendingRef.current = true;
    (async () => {
      const filesArr = pending.files ? Array.from(pending.files) : [];
      const parts = filesArr.length ? await toFileParts(filesArr) : undefined;
      await sendMessage({ text: pending.text, files: parts });
    })().catch((e) => console.error(e));
  }, [threadId, token, sendMessage]);

  const scrollerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, status]);

  async function sendNow(text: string, attached?: File | null) {
    const parts = attached ? await toFileParts([attached]) : undefined;
    setInput("");
    setFile(null);
    await sendMessage({ text, files: parts });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if ((!text && !file) || isBusy) return;
    const final = text || t("chat.image_caption");
    void sendNow(final, file);
  }

  function handlePick(_label: string, prompt: string) {
    if (isBusy) return;
    void sendNow(prompt, null);
  }

  function handlePickPhoto() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setFile(f);
    e.target.value = "";
  }

  const name = getDisplayName(user);
  const isEmpty = messages.length === 0;

  if (token === null) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-background">
        <div className="size-6 animate-spin rounded-full border-2 border-hairline border-t-brand" />
      </div>
    );
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-background">
      <ChatHeader showNewLink t={t} activeThreadId={threadId} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <div
        ref={scrollerRef}
        className="flex-1 overflow-y-auto px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+200px)]"
      >
        {isEmpty ? (
          <>
            <GreetingPanel name={name} t={t} />
            <div className="px-0">
              <ChipRow onPick={handlePick} onPickPhoto={handlePickPhoto} t={t} />
            </div>
          </>
        ) : (
          <div className="space-y-3">
            {messages.map((m) => {
              const text = m.parts
                .map((p) => (p.type === "text" ? p.text : ""))
                .join("");
              const imageParts = m.parts.filter(
                (p) => p.type === "file" && typeof (p as { url?: string }).url === "string",
              ) as Array<{ url: string; mediaType?: string }>;
              const isUser = m.role === "user";
              return (
                <div
                  key={m.id}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {isUser ? (
                    <div className="flex max-w-[85%] flex-col items-end gap-1.5">
                      {imageParts.map((p, i) => (
                        <img
                          key={i}
                          src={p.url}
                          alt=""
                          className="max-h-64 rounded-2xl object-cover"
                        />
                      ))}
                      {text && (
                        <div className="rounded-2xl rounded-br-md bg-brand px-4 py-2.5 text-sm text-brand-foreground">
                          {text}
                        </div>
                      )}
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
        )}
      </div>
      <Composer
        input={input}
        setInput={setInput}
        onSubmit={handleSubmit}
        onPickPhoto={handlePickPhoto}
        isBusy={isBusy}
        onStop={stop}
        t={t}
        attachedName={file?.name ?? null}
      />
    </main>
  );
}

// Tiny inline back button (kept for future use)
export function _BackButton({ to, t }: { to: () => void; t: (k: string) => string }) {
  return (
    <button
      type="button"
      onClick={to}
      aria-label={t("chat.back")}
      className="grid size-9 place-items-center rounded-full text-foreground hover:bg-accent"
    >
      <ChevronLeft className="size-5 rtl:rotate-180" />
    </button>
  );
}
