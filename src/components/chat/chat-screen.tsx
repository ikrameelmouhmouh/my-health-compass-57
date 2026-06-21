import { useNavigate } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Camera, Dumbbell, Loader2, Menu, Plus, Send, Square } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth-context";
import { useT, useI18n } from "@/lib/i18n";
import { getThreadMessages } from "@/lib/chat.functions";
import { supabase } from "@/integrations/supabase/client";
import { ChatHistoryDrawer } from "@/components/chat/history-drawer";
import { extractWorkoutTemplates } from "@/lib/coach-extract.functions";
import { useTemplates, newTemplate, type WorkoutTemplate } from "@/lib/workout-prefs";
import { TemplateSyncDialog } from "@/components/template-sync-dialog";
import { normalizeDay, todayDayName } from "@/lib/workout-today";
import { useTodayWorkout } from "@/lib/dashboard-prefs";

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

async function readStreamText(response: Response, onText: (text: string) => void) {
  const reader = response.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";

  function processChunk(chunk: string) {
    for (const rawLine of chunk.split("\n")) {
      const line = rawLine.trim();
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      const parsed = JSON.parse(data) as { type?: string; delta?: string };
      if (parsed.type === "text-delta" && parsed.delta) {
        text += parsed.delta;
        onText(text);
      }
    }
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";
    chunks.forEach(processChunk);
  }
  processChunk(buffer + decoder.decode());
}

type QuickAction = {
  key: string;
  labelKey: string;
  promptKey: string;
  icon: string;
  scan?: boolean;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    key: "scan",
    labelKey: "chat.quick.scan",
    promptKey: "chat.image_caption",
    icon: "📷",
    scan: true,
  },
  {
    key: "workout",
    labelKey: "chat.quick.workout",
    promptKey: "chat.quick.workout.prompt",
    icon: "🏋️",
  },
  { key: "meals", labelKey: "chat.quick.meals", promptKey: "chat.quick.meals.prompt", icon: "🥗" },
  { key: "tip", labelKey: "chat.quick.tip", promptKey: "chat.quick.tip.prompt", icon: "⚡" },
  { key: "week", labelKey: "chat.quick.week", promptKey: "chat.quick.week.prompt", icon: "📊" },
];

function getDisplayName(
  user: { user_metadata?: Record<string, unknown>; email?: string | null } | null,
) {
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

function getMessageText(message: UIMessage) {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

function assistantTextCount(messages: UIMessage[]) {
  return messages.filter((message) => message.role === "assistant" && getMessageText(message))
    .length;
}

function looksLikeWorkout(text: string): boolean {
  if (!text || text.length < 60) return false;
  const lower = text.toLowerCase();
  const exerciseHits = [
    "squat", "push-up", "pushup", "push up", "lunge", "deadlift", "row", "press",
    "plank", "glute bridge", "curl", "pull-up", "pullup", "leg raise", "burpee",
    "shoulder press", "bench", "kettlebell",
  ].filter((k) => lower.includes(k)).length;
  const structureHit = /\b(sets?|reps?|herhalingen|series|wiederholungen|répétitions|repeticiones|تكرار)\b/i.test(text);
  return exerciseHits >= 2 && structureHit;
}

function AddWorkoutButton({
  text,
  t,
  onAdded,
}: {
  text: string;
  t: (k: string) => string;
  onAdded: () => void;
}) {
  const navigate = useNavigate();
  const { templates: existing, upsert, remove } = useTemplates();
  const { save: saveTodayWorkout } = useTodayWorkout();
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<WorkoutTemplate[] | null>(null);

  async function handleClick() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await extractWorkoutTemplates({ data: { text } });
      const extracted = res.templates ?? [];
      if (extracted.length === 0) {
        toast.error(t("chat.addworkout.none"));
        return;
      }
      const built = extracted.map((tpl) =>
        newTemplate({
          name: tpl.name,
          day: tpl.day,
          focus: tpl.focus,
          exercises: tpl.exercises ?? [],
        }),
      );
      // If user already has templates, ask replace/add. Otherwise just add.
      if (existing.length === 0) {
        applyTemplates(built, "add");
      } else {
        setPending(built);
      }
    } catch (e) {
      console.error("[ai-coach] extract failed", e);
      toast.error(t("chat.addworkout.error"));
    } finally {
      setBusy(false);
    }
  }

  function applyTemplates(tpls: WorkoutTemplate[], mode: "replace" | "add" | "skip") {
    if (mode === "skip") {
      setPending(null);
      return;
    }
    if (mode === "replace") {
      existing.forEach((tpl) => remove(tpl.id));
    }
    tpls.forEach((tpl) => upsert(tpl));
    // Auto-schedule today if any new template targets today's weekday.
    const today = todayDayName();
    const todays = tpls.find((tpl) => normalizeDay(tpl.day) === today);
    if (todays) {
      const sets = todays.exercises.reduce((s, e) => s + (Number(e.sets) || 0), 0);
      const durationMin = Math.max(15, Math.min(120, Math.round(sets * 3) || 30));
      saveTodayWorkout({ name: todays.name, type: todays.focus || "Workout", durationMin });
    }
    toast.success(
      tpls.length === 1
        ? t("chat.addworkout.success_one")
        : t("chat.addworkout.success_many").replace("{n}", String(tpls.length)),
    );
    setPending(null);
    onAdded();
    navigate({ to: "/fitness" });
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-brand/40 bg-brand/10 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-brand/20 disabled:opacity-60"
      >
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Dumbbell className="size-3.5" />}
        {t("chat.addworkout.cta")}
      </button>
      <TemplateSyncDialog
        open={!!pending}
        count={pending?.length ?? 0}
        onChoose={(mode) => pending && applyTemplates(pending, mode)}
      />
    </>
  );
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
  onPick: (key: string, prompt: string) => void;
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
              else onPick(q.key, t(q.promptKey));
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
        <div className="min-w-0 flex-1 text-center font-display text-sm font-semibold">Vita</div>
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

/* ───────────────────────────── UNIFIED CHAT SCREEN ───────── */

export function ChatScreen({
  initialThreadId,
  initialMessages,
}: {
  initialThreadId?: string;
  initialMessages: UIMessage[];
}) {
  const t = useT();
  const { lang } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [quickBusy, setQuickBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


  // threadId state — null when this is a brand-new draft chat.
  const [threadId, setThreadId] = useState<string | null>(initialThreadId ?? null);
  const threadIdRef = useRef<string | null>(threadId);
  useEffect(() => {
    threadIdRef.current = threadId;
  }, [threadId]);

  // Stable chat id — never changes for the lifetime of this mount.
  // useChat keeps a single message buffer keyed by this id.
  const chatIdRef = useRef<string>(
    initialThreadId ??
      (typeof crypto !== "undefined" ? crypto.randomUUID() : `draft-${Date.now()}`),
  );

  // Token — fetched once, kept in a ref so the transport always sees the latest.
  const tokenRef = useRef<string | null>(null);
  const tokenReadyRef = useRef<Promise<string | null> | null>(null);
  if (!tokenReadyRef.current) {
    tokenReadyRef.current = supabase.auth.getSession().then(({ data }) => {
      const tok = data.session?.access_token ?? null;
      tokenRef.current = tok;
      return tok;
    });
  }

  const langRef = useRef(lang);
  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

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

  const { messages, setMessages, sendMessage, status, stop } = useChat({
    id: chatIdRef.current,
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

  const [displayMessages, setDisplayMessages] = useState<UIMessage[]>(initialMessages);
  const messagesRef = useRef<UIMessage[]>(initialMessages);
  const displayMessagesRef = useRef<UIMessage[]>(initialMessages);
  useEffect(() => {
    messagesRef.current = messages;
    setDisplayMessages((current) => {
      const currentAssistantCount = assistantTextCount(current);
      const nextAssistantCount = assistantTextCount(messages);
      if (nextAssistantCount >= currentAssistantCount && messages.length >= current.length) {
        return messages;
      }
      return current;
    });
  }, [messages]);

  useEffect(() => {
    displayMessagesRef.current = displayMessages;
  }, [displayMessages]);

  const isBusy = quickBusy || status === "submitted" || status === "streaming";

  const scrollerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [displayMessages, status]);

  async function ensureThread(): Promise<string> {
    if (threadIdRef.current) return threadIdRef.current;
    return "";
  }

  function setActiveThread(id: string | null) {
    if (!id) return;
    threadIdRef.current = id;
    setThreadId(id);
  }

  async function syncThreadMessages(id: string) {
    const rows = await getThreadMessages({ data: { threadId: id } });
    const mapped: UIMessage[] = rows.map((r) => ({
      id: r.id,
      role: r.role === "assistant" ? "assistant" : "user",
      parts: [{ type: "text", text: r.content }],
    }));
    messagesRef.current = mapped;
    setDisplayMessages(mapped);
    setMessages(mapped);
  }

  async function sendNow(text: string, attached?: File | null) {
    try {
      // Make sure token is loaded before the transport fires.
      if (!tokenRef.current && tokenReadyRef.current) {
        await tokenReadyRef.current;
      }
      const activeThreadId = await ensureThread();
      const parts = attached ? await toFileParts([attached]) : undefined;
      const assistantCountBefore = assistantTextCount(messagesRef.current);
      setInput("");
      setFile(null);
      setDisplayMessages((current) => [
        ...current,
        {
          id: `local-${Date.now()}`,
          role: "user",
          parts: [{ type: "text", text }],
        },
      ]);
      await sendMessage({ text, files: parts });
      const finalThreadId = threadIdRef.current || activeThreadId;
      window.setTimeout(() => {
        const assistantCountAfter = assistantTextCount(messagesRef.current);
        if (finalThreadId && assistantCountAfter <= assistantCountBefore) {
          void syncThreadMessages(finalThreadId);
        }
      }, 150);
    } catch (e) {
      console.error("[ai-coach] send failed", e);
      toast.error(t("chat.error.generic"));
    }
  }

  async function sendQuick(text: string) {
    if (quickBusy) return;
    setQuickBusy(true);
    try {
      if (!tokenRef.current && tokenReadyRef.current) {
        await tokenReadyRef.current;
      }
      const activeThreadId = await ensureThread();
      const userMessage: UIMessage = {
        id: `quick-user-${Date.now()}`,
        role: "user",
        parts: [{ type: "text", text }],
      };
      const assistantMessage: UIMessage = {
        id: `quick-assistant-${Date.now()}`,
        role: "assistant",
        parts: [{ type: "text", text: "" }],
      };
      const nextMessages = [...displayMessagesRef.current, userMessage, assistantMessage];
      messagesRef.current = nextMessages;
      setDisplayMessages(nextMessages);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: tokenRef.current ? `Bearer ${tokenRef.current}` : "",
        },
        body: JSON.stringify({
          threadId: activeThreadId || null,
          lang: langRef.current,
          messages: [userMessage],
        }),
      });
      if (!response.ok) throw new Error(await response.text());
      const responseThreadId = response.headers.get("x-thread-id") || activeThreadId;
      setActiveThread(responseThreadId);
      await readStreamText(response, (assistantText) => {
        setDisplayMessages((current) =>
          current.map((message) =>
            message.id === assistantMessage.id
              ? { ...message, parts: [{ type: "text", text: assistantText }] }
              : message,
          ),
        );
      });
      if (responseThreadId) await syncThreadMessages(responseThreadId);
    } catch (e) {
      console.error("[ai-coach] quick send failed", e);
      toast.error(t("chat.error.generic"));
    } finally {
      setQuickBusy(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if ((!text && !file) || isBusy) return;
    const final = text || t("chat.image_caption");
    void sendNow(final, file);
  }

  function handlePick(key: string, prompt: string) {
    if (isBusy) return;
    if (key === "workout") {
      navigate({ to: "/fitness", search: { wizard: 1 } });
      return;
    }
    void sendQuick(prompt);
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
  const isEmpty = displayMessages.length === 0;

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-background">
      <ChatHeader
        showNewLink={!!threadId || !isEmpty}
        t={t}
        activeThreadId={threadId ?? undefined}
      />
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
            {displayMessages.map((m) => {
              const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
              const imageParts = m.parts.filter(
                (p) => p.type === "file" && typeof (p as { url?: string }).url === "string",
              ) as Array<{ url: string; mediaType?: string }>;
              const isUser = m.role === "user";
              return (
                <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
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
                    <div className="flex max-w-[90%] flex-col items-start">
                      <div className="prose prose-sm dark:prose-invert text-foreground prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-headings:my-2">
                        <ReactMarkdown>{text || " "}</ReactMarkdown>
                      </div>
                      {looksLikeWorkout(text) && (
                        <AddWorkoutButton text={text} t={t} onAdded={() => {}} />
                      )}
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
