// Fetches the set of exercise ids that have AI-generated frames stored in
// the `exercise-frames` bucket. Cached per-session with react-query.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useGeneratedExerciseFrameIds(): ReadonlySet<string> {
  const { data } = useQuery({
    queryKey: ["exercise-frame-jobs", "done-ids"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("exercise_frame_jobs")
        .select("exercise_id")
        .eq("status", "done");
      return new Set((rows ?? []).map((r) => r.exercise_id));
    },
  });
  return data ?? EMPTY;
}

const EMPTY: ReadonlySet<string> = new Set();
