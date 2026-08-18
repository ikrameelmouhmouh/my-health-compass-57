import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export type AiQuickAction = {
  id: string;
  label: string;
  icon: LucideIcon;
  run: () => void;
};

type Ctx = {
  actions: AiQuickAction[];
  setActions: (actions: AiQuickAction[]) => void;
};

const AiQuickActionsContext = createContext<Ctx | null>(null);

/**
 * Holds the category-specific quick actions shown inside the ALYVA AI panel.
 * The floating AI button stays identical everywhere; only these actions change.
 */
export function AiQuickActionsProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<AiQuickAction[]>([]);
  const value = useMemo(() => ({ actions, setActions }), [actions]);
  return (
    <AiQuickActionsContext.Provider value={value}>{children}</AiQuickActionsContext.Provider>
  );
}

export function useAiQuickActions(): AiQuickAction[] {
  return useContext(AiQuickActionsContext)?.actions ?? [];
}

/** Register the quick actions for the current page (cleared on unmount). */
export function useRegisterAiQuickActions(actions: AiQuickAction[], deps: unknown[]) {
  const ctx = useContext(AiQuickActionsContext);
  useEffect(() => {
    if (!ctx) return;
    ctx.setActions(actions);
    return () => ctx.setActions([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
