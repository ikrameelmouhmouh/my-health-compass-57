-- ============ Profiles: username + bio ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS bio text;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_uniq
  ON public.profiles ((lower(username))) WHERE username IS NOT NULL;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_username_format;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_username_format
  CHECK (username IS NULL OR username ~ '^[a-zA-Z0-9_]{3,24}$');

-- Allow authenticated users to read minimal public profile fields for friend search.
DROP POLICY IF EXISTS "Anyone authenticated can view public profile" ON public.profiles;
CREATE POLICY "Anyone authenticated can view public profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

-- ============ Friendships ============
CREATE TABLE IF NOT EXISTS public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('pending','accepted','blocked')) DEFAULT 'pending',
  requested_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, friend_id),
  CHECK (user_id <> friend_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.friendships TO authenticated;
GRANT ALL ON public.friendships TO service_role;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own friendships" ON public.friendships
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Request friendship as requester" ON public.friendships
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requested_by AND (auth.uid() = user_id OR auth.uid() = friend_id));

CREATE POLICY "Update friendship if involved" ON public.friendships
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id)
  WITH CHECK (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Delete friendship if involved" ON public.friendships
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE INDEX IF NOT EXISTS friendships_user_idx ON public.friendships(user_id, status);
CREATE INDEX IF NOT EXISTS friendships_friend_idx ON public.friendships(friend_id, status);

-- Helper: are these two users accepted friends? (security definer to bypass RLS in policies)
CREATE OR REPLACE FUNCTION public.are_friends(_a uuid, _b uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.friendships
    WHERE status = 'accepted'
      AND ((user_id = _a AND friend_id = _b) OR (user_id = _b AND friend_id = _a))
  );
$$;

-- ============ Friend email invites ============
CREATE TABLE IF NOT EXISTS public.friend_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (inviter_id, email)
);
GRANT SELECT, INSERT, DELETE ON public.friend_invites TO authenticated;
GRANT ALL ON public.friend_invites TO service_role;
ALTER TABLE public.friend_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own invites" ON public.friend_invites
  FOR SELECT TO authenticated USING (auth.uid() = inviter_id);
CREATE POLICY "Create own invites" ON public.friend_invites
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = inviter_id);
CREATE POLICY "Delete own invites" ON public.friend_invites
  FOR DELETE TO authenticated USING (auth.uid() = inviter_id);

-- ============ Posts ============
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('workout','meal','text','milestone')),
  title text,
  body text,
  image_url text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  visibility text NOT NULL CHECK (visibility IN ('friends','public')) DEFAULT 'friends',
  like_count int NOT NULL DEFAULT 0,
  comment_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read posts (self/friends/public)" ON public.posts
  FOR SELECT TO authenticated
  USING (
    visibility = 'public'
    OR user_id = auth.uid()
    OR public.are_friends(auth.uid(), user_id)
  );
CREATE POLICY "Insert own posts" ON public.posts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own posts" ON public.posts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Delete own posts" ON public.posts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS posts_user_created_idx ON public.posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS posts_created_idx ON public.posts(created_at DESC);

-- ============ Likes ============
CREATE TABLE IF NOT EXISTS public.post_likes (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.post_likes TO authenticated;
GRANT ALL ON public.post_likes TO service_role;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read likes if can read post" ON public.post_likes
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id));
CREATE POLICY "Like as self" ON public.post_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Unlike own" ON public.post_likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Counter triggers
CREATE OR REPLACE FUNCTION public.bump_post_like_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.posts SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS trg_post_like_count ON public.post_likes;
CREATE TRIGGER trg_post_like_count
AFTER INSERT OR DELETE ON public.post_likes
FOR EACH ROW EXECUTE FUNCTION public.bump_post_like_count();

-- ============ Comments ============
CREATE TABLE IF NOT EXISTS public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.post_comments TO authenticated;
GRANT ALL ON public.post_comments TO service_role;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read comments if can read post" ON public.post_comments
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id));
CREATE POLICY "Comment as self" ON public.post_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Delete own comments" ON public.post_comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS post_comments_post_idx ON public.post_comments(post_id, created_at);

CREATE OR REPLACE FUNCTION public.bump_post_comment_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS trg_post_comment_count ON public.post_comments;
CREATE TRIGGER trg_post_comment_count
AFTER INSERT OR DELETE ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION public.bump_post_comment_count();

-- ============ Challenges ============
CREATE TABLE IF NOT EXISTS public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (length(title) BETWEEN 1 AND 80),
  description text,
  metric text NOT NULL CHECK (metric IN ('workouts','minutes','calories','meals_logged')),
  target int,
  starts_on date NOT NULL,
  ends_on date NOT NULL,
  visibility text NOT NULL CHECK (visibility IN ('friends','public')) DEFAULT 'friends',
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_on >= starts_on)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenges TO authenticated;
GRANT ALL ON public.challenges TO service_role;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.challenge_participants (
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (challenge_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.challenge_participants TO authenticated;
GRANT ALL ON public.challenge_participants TO service_role;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;

-- Helper: is user a participant?
CREATE OR REPLACE FUNCTION public.is_challenge_participant(_uid uuid, _cid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.challenge_participants WHERE challenge_id = _cid AND user_id = _uid);
$$;

CREATE POLICY "Read challenges (public/friends/participant/creator)" ON public.challenges
  FOR SELECT TO authenticated
  USING (
    visibility = 'public'
    OR created_by = auth.uid()
    OR public.are_friends(auth.uid(), created_by)
    OR public.is_challenge_participant(auth.uid(), id)
  );
CREATE POLICY "Create challenges as self" ON public.challenges
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Update own challenges" ON public.challenges
  FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Delete own challenges" ON public.challenges
  FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Read participants if can see challenge" ON public.challenge_participants
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.challenges c WHERE c.id = challenge_id));
CREATE POLICY "Join as self" ON public.challenge_participants
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Leave as self" ON public.challenge_participants
  FOR DELETE TO authenticated USING (auth.uid() = user_id OR auth.uid() IN (SELECT created_by FROM public.challenges WHERE id = challenge_id));

CREATE INDEX IF NOT EXISTS challenges_created_idx ON public.challenges(created_at DESC);
CREATE INDEX IF NOT EXISTS challenges_window_idx ON public.challenges(starts_on, ends_on);

-- ============ Triggers for updated_at ============
DROP TRIGGER IF EXISTS trg_posts_updated ON public.posts;
CREATE TRIGGER trg_posts_updated BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_friendships_updated ON public.friendships;
CREATE TRIGGER trg_friendships_updated BEFORE UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
