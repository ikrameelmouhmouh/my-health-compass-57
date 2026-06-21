import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell, CheckCheck, Sparkles } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { listNotifications, markRead, markAllRead, type Notification } from "@/lib/notifications.functions";

export function useNotifications() {
  const list = useServerFn(listNotifications);
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => list(),
    staleTime: 60_000,
  });
}

export function NotificationsSheet({ open, onOpenChange }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const t = useT();
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useNotifications();
  const markReadFn = useServerFn(markRead);
  const markAllReadFn = useServerFn(markAllRead);

  const readMut = useMutation({
    mutationFn: (id: string) => markReadFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const allReadMut = useMutation({
    mutationFn: () => markAllReadFn(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unread = items.filter((n) => !n.read).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85dvh] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between gap-3">
            <SheetTitle className="font-display">{t("notif.title")}</SheetTitle>
            {unread > 0 && (
              <Button variant="ghost" size="sm" onClick={() => allReadMut.mutate()} className="gap-1.5">
                <CheckCheck className="size-3.5" />
                {t("notif.mark_all_read")}
              </Button>
            )}
          </div>
          <SheetDescription className="sr-only">{t("notif.title")}</SheetDescription>
        </SheetHeader>

        <div className="mt-3 space-y-2 pb-4">
          {isLoading && (
            <div className="grid place-items-center py-10">
              <div className="size-5 animate-spin rounded-full border-2 border-border border-t-brand" />
            </div>
          )}
          {!isLoading && items.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">{t("notif.empty")}</p>
          )}
          {items.map((n) => (
            <NotificationRow key={n.id} n={n} onRead={() => !n.read && readMut.mutate(n.id)} />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function NotificationRow({ n, onRead }: { n: Notification; onRead: () => void }) {
  const isAura = n.type === "aura_daily";
  return (
    <button
      type="button"
      onClick={onRead}
      className={`flex w-full gap-3 rounded-2xl border p-3 text-left transition-colors ${
        n.read ? "border-border bg-card" : "border-brand/30 bg-brand/5"
      }`}
    >
      <div className={`grid size-9 shrink-0 place-items-center rounded-2xl ${isAura ? "bg-brand/20 text-brand" : "bg-secondary text-muted-foreground"}`}>
        {isAura ? <Sparkles className="size-4" /> : <Bell className="size-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-display text-[13px] font-semibold">{n.title}</p>
          {!n.read && <span className="size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />}
        </div>
        <p className="mt-1 text-[12px] leading-snug text-foreground/85 line-clamp-3">{n.body}</p>
        {n.advice && (
          <p className="mt-1.5 text-[11.5px] leading-snug text-muted-foreground">{n.advice}</p>
        )}
      </div>
    </button>
  );
}
