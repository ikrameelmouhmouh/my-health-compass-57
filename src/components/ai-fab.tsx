import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Sparkles, ArrowUp } from "lucide-react";
import { useState } from "react";
import { useT } from "@/lib/i18n";
import { useAiQuickActions } from "@/lib/ai-quick-actions";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

export function AiFab() {
  const t = useT();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const actions = useAiQuickActions();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  if (
    pathname.startsWith("/ai-coach") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth")
  ) {
    return null;
  }

  function goToChat() {
    const text = draft.trim();
    if (text && typeof window !== "undefined") {
      sessionStorage.setItem("alyva.ai.prompt", text);
    }
    setDraft("");
    setOpen(false);
    navigate({ to: "/ai-coach" });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("fab.open_coach")}
        className="fixed z-50 right-4 bottom-[calc(env(safe-area-inset-bottom)+96px)] group"
      >
        <span className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-alyva/30 blur-xl opacity-70 group-hover:opacity-100 transition-opacity" />
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-alyva text-alyva-foreground shadow-float ring-1 ring-black/5 transition-transform duration-300 ease-out active:scale-95 group-hover:scale-105">
          <Sparkles className="size-6" strokeWidth={2.2} />
        </span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="mx-auto max-w-md rounded-t-3xl border-hairline px-5 pb-8">
          <SheetHeader className="px-0 text-left">
            <SheetTitle className="flex items-center gap-2 font-display text-base">
              <span className="grid size-7 place-items-center rounded-full bg-alyva/15 text-alyva">
                <Sparkles className="size-4" />
              </span>
              {t("ai.panel.title")}
            </SheetTitle>
            <SheetDescription className="text-[12px]">{t("ai.panel.sub")}</SheetDescription>
          </SheetHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              goToChat();
            }}
            className="mt-2 flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2"
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t("ai.panel.placeholder")}
              aria-label={t("ai.panel.placeholder")}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              aria-label={t("ai.panel.send")}
              className="grid size-8 shrink-0 place-items-center rounded-full bg-alyva text-alyva-foreground ios-press"
            >
              <ArrowUp className="size-4" />
            </button>
          </form>

          {actions.length > 0 && (
            <>
              <p className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t("ai.panel.quick")}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {actions.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      a.run();
                    }}
                    className="flex items-center gap-2.5 rounded-2xl border border-border bg-card px-3 py-3 text-left ios-press"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-alyva/12 text-alyva">
                      <a.icon className="size-4" />
                    </span>
                    <span className="text-[12.5px] font-semibold leading-tight">{a.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
