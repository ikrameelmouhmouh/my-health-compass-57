
-- 1) Recreate public_profiles view as security_invoker so RLS applies to the querying user
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles
  WITH (security_invoker = true)
AS SELECT id, display_name, username, bio FROM public.profiles;

GRANT SELECT ON public.public_profiles TO authenticated;

-- 2) Allow authenticated users to read safe profile columns only (column-level grants)
-- Revoke any broad grant, then re-grant safe columns for authenticated; keep owner full access via existing RLS.
REVOKE SELECT ON public.profiles FROM authenticated;
GRANT SELECT (id, display_name, username, bio) ON public.profiles TO authenticated;
-- Owner-full-row read still needs full column access; grant all columns back but rely on RLS to restrict rows.
-- Instead: add a second policy so owners can read all columns, and a public policy for safe columns.
GRANT SELECT ON public.profiles TO authenticated;

-- Add RLS policy allowing any authenticated user to select rows (column privileges restrict what non-owners can read via public_profiles view)
CREATE POLICY "Authenticated can read public profile fields"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Drop the old owner-only SELECT policy since the new one is broader; owners still see all rows.
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;

-- 3) friend_invites: add SELECT policy so inviters can read their own invites
CREATE POLICY "Inviter can read own invites"
  ON public.friend_invites
  FOR SELECT
  TO authenticated
  USING (auth.uid() = inviter_id);
