import { Link, useRouterState } from "@tanstack/react-router";
import { Home, UtensilsCrossed, Timer, Dumbbell, Scale, Sparkles } from "lucide-react";

const items = [
  { to: "/profile", label: "Home", icon: Home },
  { to: "/nutrition", label: "Nutrition", icon: UtensilsCrossed },
  { to: "/fasting", label: "Fasting", icon: Timer },
  { to: "/fitness", label: "Fitness", icon: Dumbbell },
  { to: "/weight", label: "Weight", icon: Scale },
  { to: "/ai-coach", label: "AI Coach", icon: Sparkles },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      aria-label="Primary"
    >
      <ul className="mx-auto grid w-full max-w-md grid-cols-6 px-1 pt-1.5">
        {items.map((it) => {
          const active = pathname === it.to;
          const Icon = it.icon;
          return (
            <li key={it.to} className="contents">
              <Link
                to={it.to}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium transition-colors ${
                  active ? "text-brand" : "text-muted-foreground hover:text-foreground"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon className={`size-5 ${active ? "stroke-[2.25]" : ""}`} />
                <span className="truncate leading-none">{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
