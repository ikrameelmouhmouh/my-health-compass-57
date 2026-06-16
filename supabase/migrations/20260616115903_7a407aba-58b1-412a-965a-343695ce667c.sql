-- Workout sessions: een gestarte/voltooide training
CREATE TABLE public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id text,
  name text not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer,
  active_seconds integer,
  total_volume_kg numeric,
  total_reps integer,
  rpe integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_sessions TO authenticated;
GRANT ALL ON public.workout_sessions TO service_role;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sessions select" ON public.workout_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own sessions insert" ON public.workout_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own sessions update" ON public.workout_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own sessions delete" ON public.workout_sessions FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_workout_sessions_updated BEFORE UPDATE ON public.workout_sessions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_workout_sessions_user_started ON public.workout_sessions(user_id, started_at DESC);

-- Sets per oefening per sessie
CREATE TABLE public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_key text not null,
  exercise_name text not null,
  set_index integer not null,
  weight_kg numeric,
  reps integer,
  rest_seconds integer,
  is_warmup boolean not null default false,
  completed_at timestamptz not null default now(),
  estimated_1rm numeric,
  is_pr_weight boolean not null default false,
  is_pr_volume boolean not null default false,
  is_pr_1rm boolean not null default false,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_sets TO authenticated;
GRANT ALL ON public.workout_sets TO service_role;
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sets select" ON public.workout_sets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own sets insert" ON public.workout_sets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own sets update" ON public.workout_sets FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own sets delete" ON public.workout_sets FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_workout_sets_user_exercise ON public.workout_sets(user_id, exercise_key, completed_at DESC);
CREATE INDEX idx_workout_sets_session ON public.workout_sets(session_id);

-- Persoonlijke records cache (snel ophalen)
CREATE TABLE public.exercise_prs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_key text not null,
  exercise_name text not null,
  best_weight_kg numeric,
  best_weight_reps integer,
  best_weight_at timestamptz,
  best_volume_kg numeric,
  best_volume_at timestamptz,
  best_1rm_kg numeric,
  best_1rm_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, exercise_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercise_prs TO authenticated;
GRANT ALL ON public.exercise_prs TO service_role;
ALTER TABLE public.exercise_prs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own prs select" ON public.exercise_prs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own prs insert" ON public.exercise_prs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own prs update" ON public.exercise_prs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own prs delete" ON public.exercise_prs FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_exercise_prs_updated BEFORE UPDATE ON public.exercise_prs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();