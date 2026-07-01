
-- 1. Profiles: restrict broad access
DROP POLICY IF EXISTS "Anyone authenticated can view public profile" ON public.profiles;

CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = false) AS
SELECT id, display_name, username, bio FROM public.profiles;

GRANT SELECT ON public.public_profiles TO authenticated, anon;

-- 2. Challenge participants: enforce challenge visibility
DROP POLICY IF EXISTS "Read participants if can see challenge" ON public.challenge_participants;
CREATE POLICY "Read participants if can see challenge"
ON public.challenge_participants FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.challenges c
    WHERE c.id = challenge_participants.challenge_id
      AND (
        c.visibility = 'public'
        OR c.created_by = auth.uid()
        OR public.are_friends(auth.uid(), c.created_by)
        OR public.is_challenge_participant(auth.uid(), c.id)
      )
  )
);

-- 3. Post comments: enforce post visibility
DROP POLICY IF EXISTS "Read comments if can read post" ON public.post_comments;
CREATE POLICY "Read comments if can read post"
ON public.post_comments FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.posts p
    WHERE p.id = post_comments.post_id
      AND (
        p.visibility = 'public'
        OR p.user_id = auth.uid()
        OR public.are_friends(auth.uid(), p.user_id)
      )
  )
);

-- 4. Post likes: enforce post visibility
DROP POLICY IF EXISTS "Read likes if can read post" ON public.post_likes;
CREATE POLICY "Read likes if can read post"
ON public.post_likes FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.posts p
    WHERE p.id = post_likes.post_id
      AND (
        p.visibility = 'public'
        OR p.user_id = auth.uid()
        OR public.are_friends(auth.uid(), p.user_id)
      )
  )
);

-- 5. Friend invites: remove client read access to email
DROP POLICY IF EXISTS "Own invites" ON public.friend_invites;

-- 6. Revoke direct EXECUTE from signed-in users on SECURITY DEFINER helpers.
-- They are still callable from within RLS policies (evaluated as the table owner).
REVOKE EXECUTE ON FUNCTION public.are_friends(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_challenge_participant(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) FROM PUBLIC, anon, authenticated;
