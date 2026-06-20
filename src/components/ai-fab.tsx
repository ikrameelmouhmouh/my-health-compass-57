import { Link, useRouterState } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useT } from "@/lib/i18n";

export function AiFab() {
  const t = useT();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname.startsWith("/ai-coach") || pathname.startsWith("/login") || pathname.startsWith("/auth")) {
    return null;
  }

  return (
    <Link
      to="/ai-coach"
      aria-label={t("fab.open_coach")}
      className="fixed z-50 right-4 bottom-[calc(env(safe-area-inset-bottom)+96px)] group"
    >
      <span className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-brand/40 blur-xl opacity-70 group-hover:opacity-100 transition-opacity" />
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-[0_10px_30px_-8px_color-mix(in_oklab,var(--brand)_70%,transparent)] ring-1 ring-white/10 backdrop-blur-md transition-transform duration-300 ease-out active:scale-95 group-hover:scale-105">
        <Sparkles className="size-6" strokeWidth={2.2} />
      </span>
    </Link>
  );
}

