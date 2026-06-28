import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let initialized = false;
    // Register listener FIRST.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) {
        try { localStorage.setItem("vita.has_account", "1"); } catch {}
      }
      initialized = true;
      setLoading(false);
    });
    // Then read current session.
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        try { localStorage.setItem("vita.has_account", "1"); } catch {}
      }
      initialized = true;
      setLoading(false);
    });
    // Safety net: never block UI longer than 2s waiting for Supabase.
    const timeout = setTimeout(() => {
      if (!initialized) setLoading(false);
    }, 2000);
    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    loading,
    signOut: async () => {
      try { localStorage.removeItem("vita.has_account"); } catch {}
      await supabase.auth.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
