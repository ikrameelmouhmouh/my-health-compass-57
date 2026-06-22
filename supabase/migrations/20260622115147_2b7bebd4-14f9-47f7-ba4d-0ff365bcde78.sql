CREATE TABLE public.activity_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id text NOT NULL,
  activity_name text NOT NULL,
  started_at timestamptz NOT NULL,
  ended_at timestamptz NOT NULL,
  duration_seconds integer NOT NULL,
  paused_seconds integer NOT NULL DEFAULT 0,
  kcal numeric,
  heart_rate_avg integer,
  heart_rate_max integer,
  distance_m numeric,
  source text NOT NULL DEFAULT 'manual',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_sessions TO authenticated;
GRANT ALL ON public.activity_sessions TO service_role;

ALTER TABLE public.activity_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own activity sessions" ON public.activity_sessions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own activity sessions" ON public.activity_sessions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own activity sessions" ON public.activity_sessions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own activity sessions" ON public.activity_sessions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX activity_sessions_user_started_idx ON public.activity_sessions(user_id, started_at DESC);

CREATE TRIGGER set_activity_sessions_updated_at
  BEFORE UPDATE ON public.activity_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();