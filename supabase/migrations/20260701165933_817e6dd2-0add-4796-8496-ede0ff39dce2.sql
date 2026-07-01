
-- Revert broad SELECT policy and full grant on profiles
DROP POLICY IF EXISTS "Authenticated can read public profile fields" ON public.profiles;
REVOKE SELECT ON public.profiles FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

-- Restore owner-only SELECT policy
CREATE POLICY "Users view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Provide safe cross-user profile lookup via SECURITY DEFINER function returning only safe columns
CREATE OR REPLACE FUNCTION public.public_profiles_fn()
RETURNS TABLE(id uuid, display_name text, username text, bio text)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id, display_name, username, bio FROM public.profiles;
$$;

REVOKE ALL ON FUNCTION public.public_profiles_fn() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.public_profiles_fn() TO authenticated;

-- Recreate view as security_invoker wrapping the definer function
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles
  WITH (security_invoker = true)
AS SELECT * FROM public.public_profiles_fn();

GRANT SELECT ON public.public_profiles TO authenticated;
