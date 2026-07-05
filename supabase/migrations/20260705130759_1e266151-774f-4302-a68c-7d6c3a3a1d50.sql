
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE TABLE IF NOT EXISTS public.exercise_frame_jobs (
  exercise_id text PRIMARY KEY,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','done','failed','bad')),
  prompt text,
  error text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercise_frame_jobs TO authenticated;
GRANT ALL ON public.exercise_frame_jobs TO service_role;
ALTER TABLE public.exercise_frame_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage frame jobs" ON public.exercise_frame_jobs;
CREATE POLICY "Admins can manage frame jobs"
  ON public.exercise_frame_jobs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY IF EXISTS "Anyone signed in can read frame jobs" ON public.exercise_frame_jobs;
CREATE POLICY "Anyone signed in can read frame jobs"
  ON public.exercise_frame_jobs FOR SELECT TO authenticated USING (true);

DROP TRIGGER IF EXISTS exercise_frame_jobs_set_updated_at ON public.exercise_frame_jobs;
CREATE TRIGGER exercise_frame_jobs_set_updated_at
  BEFORE UPDATE ON public.exercise_frame_jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
