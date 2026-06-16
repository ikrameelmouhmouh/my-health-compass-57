import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export type AppGender = "male" | "female";

const CACHE_KEY = "vita.profile.gender.v1";

/**
 * Returns the user's gender as "male" | "female".
 * Falls back to "male" when the profile says "other" / is unset, so that
 * gender-keyed assets always resolve. Cached in localStorage to avoid a
 * round-trip on every component mount.
 */
export function useGender(): AppGender {
  const { user } = useAuth();
  const [gender, setGender] = useState<AppGender>(() => {
    if (typeof window === "undefined") return "male";
    const cached = localStorage.getItem(CACHE_KEY);
    return cached === "female" ? "female" : "male";
  });

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    supabase
      .from("profiles")
      .select("gender")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data?.gender) return;
        const g: AppGender = data.gender === "female" ? "female" : "male";
        setGender(g);
        try { localStorage.setItem(CACHE_KEY, g); } catch {}
      });
    return () => { cancelled = true; };
  }, [user]);

  return gender;
}
