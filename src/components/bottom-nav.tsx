import { Link, useRouterState } from "@tanstack/react-router";
import { Home, UtensilsCrossed, Dumbbell, TrendingUp, Sparkles, Users } from "lucide-react";

const items = [
  { to: "/profile", label: "Home", icon: Home },
  { to: "/nutrition", label: "Eten", icon: UtensilsCrossed },
  { to: "/fitness", label: "Workouts", icon: Dumbbell },
  { to: "/social", label: "Sociaal", icon: Users },
  { to: "/weight", label: "Progress", icon: TrendingUp },
  { to: "/ai-coach", label: "AI", icon: Sparkles },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(env(safe-area-inset-bottom),12px)]"
      aria-hidden={false}
    >
      <nav
        aria-label="Primary"
        className="pointer-events-auto w-full max-w-md rounded-[28px] border border-border/60 bg-background/80 px-2 py-2 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/70"
      >
        <ul className="flex items-center justify-between gap-1">
          {items.map((it) => {
            const active = pathname === it.to;
            const Icon = it.icon;
            return (
              <li key={it.to} className="flex-1">
                <Link
                  to={it.to}
                  aria-current={active ? "page" : undefined}
                  className={`group relative flex min-h-[52px] items-center justify-center gap-1.5 rounded-full px-2 py-2 transition-all duration-300 ease-out ${
                    active
                      ? "bg-brand text-brand-foreground shadow-[0_6px_18px_-6px_color-mix(in_oklab,var(--brand)_60%,transparent)]"
                      : "text-muted-foreground hover:text-foreground active:scale-95"
                  }`}
                >
                  <Icon
                    className={`shrink-0 transition-all duration-300 ${
                      active ? "size-[18px] stroke-[2.4]" : "size-[20px]"
                    }`}
                  />
                  <span
                    className={`overflow-hidden text-[11px] font-semibold tracking-tight transition-all duration-300 ${
                      active ? "max-w-[80px] opacity-100" : "max-w-0 opacity-0"
                    }`}
                  >
                    {it.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
