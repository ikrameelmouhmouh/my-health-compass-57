import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageCircle, Plus, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useT } from "@/lib/i18n";
import { listThreads, deleteThread, type ChatThread } from "@/lib/chat.functions";
import { toast } from "sonner";

export function ChatHistoryDrawer({
  trigger,
  activeThreadId,
}: {
  trigger: React.ReactNode;
  activeThreadId?: string;
}) {
  const t = useT();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [threads, setThreads] = useState<ChatThread[] | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setThreads(null);
    listThreads()
      .then((rows) => !cancelled && setThreads(rows))
      .catch((e) => {
        console.error(e);
        if (!cancelled) setThreads([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  async function handleDelete(id: string) {
    if (!confirm(t("chat.delete_confirm"))) return;
    try {
      await deleteThread({ data: { threadId: id } });
      setThreads((prev) => (prev ?? []).filter((th) => th.id !== id));
      if (id === activeThreadId) {
        navigate({ to: "/ai-coach" });
        setOpen(false);
      }
    } catch (e) {
      console.error(e);
      toast.error(t("chat.error.generic"));
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="left" className="w-[88vw] max-w-sm p-0">
        <SheetHeader className="border-b border-hairline p-4 text-left">
          <SheetTitle className="font-display text-base">{t("chat.history")}</SheetTitle>
        </SheetHeader>
        <div className="p-3">
          <Link
            to="/ai-coach"
            onClick={() => setOpen(false)}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-brand text-sm font-semibold text-brand-foreground"
          >
            <Plus className="size-4" />
            {t("chat.new")}
          </Link>
        </div>
        <div className="max-h-[calc(100dvh-140px)] overflow-y-auto px-3 pb-6">
          {threads === null && (
            <div className="grid place-items-center py-10">
              <div className="size-5 animate-spin rounded-full border-2 border-hairline border-t-brand" />
            </div>
          )}
          {threads !== null && threads.length === 0 && (
            <p className="px-2 py-6 text-center text-[12px] text-muted-foreground">
              {t("chat.empty.title")}
            </p>
          )}
          {threads !== null && threads.length > 0 && (
            <ul className="space-y-1.5">
              {threads.map((th) => {
                const active = th.id === activeThreadId;
                return (
                  <li
                    key={th.id}
                    className={`flex items-stretch overflow-hidden rounded-xl ${
                      active ? "bg-accent" : "hover:bg-accent/60"
                    }`}
                  >
                    <Link
                      to="/ai-coach/$threadId"
                      params={{ threadId: th.id }}
                      onClick={() => setOpen(false)}
                      className="flex flex-1 items-center gap-3 px-3 py-2.5 text-left"
                    >
                      <MessageCircle className="size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{th.title}</div>
                        <div className="truncate text-[11px] text-muted-foreground">
                          {new Date(th.last_message_at).toLocaleDateString()}
                        </div>
                      </div>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(th.id)}
                      aria-label={t("chat.delete")}
                      className="grid w-10 place-items-center text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
