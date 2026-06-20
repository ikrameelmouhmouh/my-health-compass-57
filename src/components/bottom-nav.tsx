import { Link, useRouterState } from "@tanstack/react-router";
import { Home, UtensilsCrossed, Dumbbell, TrendingUp, Users } from "lucide-react";
import { useT } from "@/lib/i18n";

const items = [
  { to: "/profile", key: "nav.home", icon: Home },
  { to: "/nutrition", key: "nav.eat", icon: UtensilsCrossed },
  { to: "/fitness", key: "nav.workouts", icon: Dumbbell },
  { to: "/social", key: "nav.social", icon: Users },
  { to: "/weight", key: "nav.progress", icon: TrendingUp },
] as const;

/**
 * iOS 18 style bottom tab bar — flat, frosted, hairline top border,
 * sits flush at the bottom with safe-area padding.
 */
export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const t = useT();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 ios-chrome border-t border-hairline pb-[max(env(safe-area-inset-bottom),8px)] pt-1.5"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2">
        {items.map((it) => {
          const active = pathname === it.to;
          const Icon = it.icon;
          const label = t(it.key);
          return (
            <li key={it.to} className="flex-1">
              <Link
                to={it.to}
                aria-current={active ? "page" : undefined}
                className={`relative flex flex-col items-center justify-center gap-0.5 py-1.5 ios-press ${
                  active ? "text-brand" : "text-muted-foreground"
                }`}
              >
                <Icon
                  className="size-[26px]"
                  strokeWidth={active ? 2.2 : 1.7}
                />
                <span
                  className={`text-[10px] leading-none tracking-tight ${
                    active ? "font-semibold" : "font-medium"
                  }`}
                >
                  {label}
                </span>
                {active && (
                  <span
                    aria-hidden
                    className="mt-0.5 size-1 rounded-full bg-brand"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
