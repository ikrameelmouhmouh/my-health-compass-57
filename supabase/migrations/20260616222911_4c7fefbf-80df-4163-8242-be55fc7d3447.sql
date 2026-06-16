-- Lock down newly-added SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.are_friends(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.are_friends(uuid, uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_challenge_participant(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_challenge_participant(uuid, uuid) TO authenticated, service_role;

-- Trigger functions: only the trigger system needs to call these
REVOKE ALL ON FUNCTION public.bump_post_like_count() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bump_post_comment_count() FROM PUBLIC, anon, authenticated;
