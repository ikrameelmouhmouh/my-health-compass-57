import { Link, useRouterState } from "@tanstack/react-router";
import { Home, UtensilsCrossed, Dumbbell, TrendingUp, Timer } from "lucide-react";
import { useT } from "@/lib/i18n";

const items = [
  { to: "/profile", key: "nav.home", icon: Home, tint: "bg-acc-fitness-soft", fg: "text-acc-fitness" },
  { to: "/nutrition", key: "nav.eat", icon: UtensilsCrossed, tint: "bg-acc-nutrition-soft", fg: "text-acc-nutrition" },
  { to: "/fasting", key: "nav.fasting", icon: Timer, tint: "bg-acc-fasting-soft", fg: "text-acc-fasting" },
  { to: "/fitness", key: "nav.workouts", icon: Dumbbell, tint: "bg-acc-fitness-soft", fg: "text-acc-fitness" },
  { to: "/weight", key: "nav.progress", icon: TrendingUp, tint: "bg-acc-weight-soft", fg: "text-acc-weight" },
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
                className={`relative mx-1 flex flex-col items-center justify-center gap-1 rounded-2xl py-2 ios-press ${
                  active ? `${it.tint} ${it.fg}` : "text-muted-foreground"
                }`}
              >
                <Icon
                  className="size-[22px]"
                  strokeWidth={active ? 2.1 : 1.6}
                />
                <span
                  className={`text-[10px] leading-none tracking-tight ${
                    active ? "font-semibold" : "font-medium"
                  }`}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

    </nav>
  );
}
