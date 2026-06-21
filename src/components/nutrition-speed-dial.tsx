import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus, X, Utensils, Camera, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type Props = {
  onAddMeal: () => void;
  onScan: () => void;
};

export function NutritionSpeedDial({ onAddMeal, onScan }: Props) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  const actions = [
    { id: "meal", label: t("nut.fab.add_meal"), icon: Utensils, run: () => { onAddMeal(); close(); } },
    { id: "scan", label: t("nut.fab.scan"), icon: Camera, run: () => { onScan(); close(); } },
    { id: "aura", label: t("nut.fab.ask_aura"), icon: Sparkles, run: () => { close(); navigate({ to: "/ai-coach" }); } },
  ];

  return (
    <>
      {/* scrim */}
      <button
        type="button"
        aria-hidden={!open}
        tabIndex={-1}
        onClick={close}
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-200 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />

      {/* action stack */}
      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+96px)] right-5 z-50 flex flex-col items-end gap-3">
        {actions.map((a, i) => (
          <button
            key={a.id}
            onClick={a.run}
            className={`flex items-center gap-3 transition-all duration-200 ease-out ${
              open
                ? "translate-y-0 opacity-100"
                : "pointer-events-none translate-y-3 opacity-0"
            }`}
            style={{ transitionDelay: open ? `${i * 40}ms` : "0ms" }}
          >
            <span className="rounded-full bg-background px-3 py-1.5 text-sm font-medium text-foreground shadow-md ring-1 ring-border">
              {a.label}
            </span>
            <span className="grid size-11 place-items-center rounded-full bg-card text-brand shadow-md ring-1 ring-border">
              <a.icon className="size-5" />
            </span>
          </button>
        ))}

        {/* main FAB */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={t("nutr.fab")}
          aria-expanded={open}
          className="grid size-14 place-items-center rounded-full bg-brand text-brand-foreground shadow-lg shadow-brand/40 transition active:scale-95"
        >
          <span className={`transition-transform duration-200 ${open ? "rotate-45" : "rotate-0"}`}>
            {open ? <X className="size-6" /> : <Plus className="size-6" />}
          </span>
        </button>
      </div>
    </>
  );
}
