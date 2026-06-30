import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

// ============ Types ============
export type Profile = {
  id: string;
  display_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url?: string | null;
};

export type Friendship = {
  id: string;
  user_id: string;
  friend_id: string;
  status: "pending" | "accepted" | "blocked";
  requested_by: string;
  created_at: string;
};

export type PostKind = "workout" | "meal" | "text" | "milestone";
export type Visibility = "friends" | "public";

export type Post = {
  id: string;
  user_id: string;
  kind: PostKind;
  title: string | null;
  body: string | null;
  image_url: string | null;
  payload: Record<string, any>;
  visibility: Visibility;
  like_count: number;
  comment_count: number;
  created_at: string;
};

export type Challenge = {
  id: string;
  created_by: string;
  title: string;
  description: string | null;
  metric: "workouts" | "minutes" | "calories" | "meals_logged";
  target: number | null;
  starts_on: string;
  ends_on: string;
  visibility: Visibility;
  created_at: string;
};

// ============ Profile / username ============
export function useMyProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, username, bio")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });

  const updateUsername = useMutation({
    mutationFn: async (username: string) => {
      const u = username.trim();
      if (!/^[a-zA-Z0-9_]{3,24}$/.test(u)) throw new Error("Gebruikersnaam: 3-24 tekens, letters/cijfers/_");
      const { error } = await supabase
        .from("profiles")
        .update({ username: u })
        .eq("id", user!.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile", user?.id] }),
  });

  return { profile: q.data ?? null, loading: q.isLoading, updateUsername };
}

// ============ Friend search ============
export function useFriendSearch(query: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["friend-search", query, user?.id],
    enabled: !!user && query.trim().length >= 2,
    queryFn: async () => {
      const q = query.trim();
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, username")
        .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
        .neq("id", user!.id)
        .limit(20);
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
  });
}

// ============ Friends ============
export function useFriends() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["friendships", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("friendships")
        .select("*")
        .or(`user_id.eq.${user!.id},friend_id.eq.${user!.id}`);
      if (error) throw error;
      return (data ?? []) as Friendship[];
    },
  });

  const friendships = q.data ?? [];
  const friendIds = useMemo(
    () =>
      friendships
        .filter((f) => f.status === "accepted")
        .map((f) => (f.user_id === user?.id ? f.friend_id : f.user_id)),
    [friendships, user?.id]
  );

  const incoming = friendships.filter(
    (f) => f.status === "pending" && f.requested_by !== user?.id
  );
  const outgoing = friendships.filter(
    (f) => f.status === "pending" && f.requested_by === user?.id
  );

  // Resolve profiles for the IDs we care about
  const otherIds = useMemo(() => {
    const ids = new Set<string>();
    friendships.forEach((f) => {
      ids.add(f.user_id === user?.id ? f.friend_id : f.user_id);
    });
    return Array.from(ids);
  }, [friendships, user?.id]);

  const profiles = useQuery({
    queryKey: ["profiles-bulk", otherIds],
    enabled: otherIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, username")
        .in("id", otherIds);
      if (error) throw error;
      const map: Record<string, Profile> = {};
      (data ?? []).forEach((p: any) => (map[p.id] = p));
      return map;
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["friendships", user?.id] });

  const request = useMutation({
    mutationFn: async (otherId: string) => {
      const { error } = await supabase.from("friendships").insert({
        user_id: user!.id,
        friend_id: otherId,
        status: "pending",
        requested_by: user!.id,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  const accept = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("friendships")
        .update({ status: "accepted" })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("friendships").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  return {
    friendships,
    friendIds,
    incoming,
    outgoing,
    profileFor: (id: string) => profiles.data?.[id],
    profilesLoading: profiles.isLoading,
    request,
    accept,
    remove,
    invalidate,
  };
}

// ============ Email invites ============
export function useFriendInvites() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["friend-invites", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("friend_invites")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const send = useMutation({
    mutationFn: async ({ email, message }: { email: string; message?: string }) => {
      const e = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw new Error("Ongeldig e-mailadres");
      const { error } = await supabase
        .from("friend_invites")
        .insert({ inviter_id: user!.id, email: e, message: message?.trim() || null });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["friend-invites", user?.id] }),
  });
  return { invites: q.data ?? [], send };
}

// ============ Feed ============
export function useFeed() {
  const { user } = useAuth();
  const { friendIds } = useFriends();
  const qc = useQueryClient();

  const ids = useMemo(() => (user ? [user.id, ...friendIds] : []), [user, friendIds]);

  const q = useQuery({
    queryKey: ["feed", ids],
    enabled: !!user && ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .in("user_id", ids)
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data ?? []) as Post[];
    },
  });

  const authorIds = useMemo(
    () => Array.from(new Set((q.data ?? []).map((p) => p.user_id))),
    [q.data]
  );

  const authors = useQuery({
    queryKey: ["profiles-bulk", authorIds],
    enabled: authorIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, username")
        .in("id", authorIds);
      if (error) throw error;
      const map: Record<string, Profile> = {};
      (data ?? []).forEach((p: any) => (map[p.id] = p));
      return map;
    },
  });

  // Track my likes for these posts
  const postIds = useMemo(() => (q.data ?? []).map((p) => p.id), [q.data]);
  const likes = useQuery({
    queryKey: ["my-likes", user?.id, postIds],
    enabled: !!user && postIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", user!.id)
        .in("post_id", postIds);
      if (error) throw error;
      return new Set((data ?? []).map((r: any) => r.post_id as string));
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["feed", ids] });
    qc.invalidateQueries({ queryKey: ["my-likes", user?.id] });
  };

  return {
    posts: q.data ?? [],
    loading: q.isLoading,
    authorFor: (id: string) => authors.data?.[id],
    likedPosts: likes.data ?? new Set<string>(),
    refresh,
  };
}

export function useCreatePost() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      kind: PostKind;
      title?: string;
      body?: string;
      imageUrl?: string;
      payload?: Record<string, any>;
      visibility?: Visibility;
    }) => {
      const { error } = await supabase.from("posts").insert({
        user_id: user!.id,
        kind: input.kind,
        title: input.title ?? null,
        body: input.body ?? null,
        image_url: input.imageUrl ?? null,
        payload: input.payload ?? {},
        visibility: input.visibility ?? "friends",
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("posts").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feed"] }),
  });
}

export function useToggleLike() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, liked }: { postId: string; liked: boolean }) => {
      if (liked) {
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user!.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from("post_likes")
          .insert({ post_id: postId, user_id: user!.id });
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["my-likes"] });
    },
  });
}

export function usePostComments(postId: string | null) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["post-comments", postId],
    enabled: !!postId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("post_comments")
        .select("id, post_id, user_id, body, created_at")
        .eq("post_id", postId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
  const add = useMutation({
    mutationFn: async (body: string) => {
      const b = body.trim();
      if (!b) throw new Error("Leeg bericht");
      const { error } = await supabase
        .from("post_comments")
        .insert({ post_id: postId!, user_id: user!.id, body: b });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["post-comments", postId] });
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });
  return { comments: q.data ?? [], add };
}

// ============ Challenges ============
export function useChallenges() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["challenges", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenges")
        .select("*")
        .order("starts_on", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as Challenge[];
    },
  });

  const parts = useQuery({
    queryKey: ["challenge-participants-mine", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenge_participants")
        .select("challenge_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return new Set((data ?? []).map((r: any) => r.challenge_id as string));
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["challenges"] });
    qc.invalidateQueries({ queryKey: ["challenge-participants-mine"] });
  };

  const create = useMutation({
    mutationFn: async (input: Omit<Challenge, "id" | "created_by" | "created_at">) => {
      const { data, error } = await supabase
        .from("challenges")
        .insert({ ...input, created_by: user!.id })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      // Auto-join creator
      await supabase
        .from("challenge_participants")
        .insert({ challenge_id: data.id, user_id: user!.id });
      return data.id as string;
    },
    onSuccess: invalidate,
  });

  const join = useMutation({
    mutationFn: async (challengeId: string) => {
      const { error } = await supabase
        .from("challenge_participants")
        .insert({ challenge_id: challengeId, user_id: user!.id });
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  const leave = useMutation({
    mutationFn: async (challengeId: string) => {
      const { error } = await supabase
        .from("challenge_participants")
        .delete()
        .eq("challenge_id", challengeId)
        .eq("user_id", user!.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  return {
    challenges: q.data ?? [],
    loading: q.isLoading,
    joinedIds: parts.data ?? new Set<string>(),
    create,
    join,
    leave,
  };
}

// Leaderboard for a single challenge: counts workout_sessions per participant inside window.
export function useChallengeLeaderboard(challenge: Challenge | null) {
  return useQuery({
    queryKey: ["challenge-leaderboard", challenge?.id],
    enabled: !!challenge,
    queryFn: async () => {
      const c = challenge!;
      const { data: parts, error: pErr } = await supabase
        .from("challenge_participants")
        .select("user_id")
        .eq("challenge_id", c.id);
      if (pErr) throw pErr;
      const userIds = (parts ?? []).map((p: any) => p.user_id as string);
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, username")
        .in("id", userIds);
      const profMap: Record<string, Profile> = {};
      (profiles ?? []).forEach((p: any) => (profMap[p.id] = p));

      // Metric calculation
      const start = c.starts_on + "T00:00:00";
      const end = c.ends_on + "T23:59:59";

      if (c.metric === "workouts" || c.metric === "minutes" || c.metric === "calories") {
        const { data: sessions, error: sErr } = await supabase
          .from("workout_sessions")
          .select("user_id, duration_minutes, total_calories")
          .in("user_id", userIds)
          .gte("started_at", start)
          .lte("started_at", end);
        if (sErr) throw sErr;
        const tally: Record<string, number> = {};
        (sessions ?? []).forEach((s: any) => {
          const v =
            c.metric === "workouts"
              ? 1
              : c.metric === "minutes"
              ? Number(s.duration_minutes ?? 0)
              : Number(s.total_calories ?? 0);
          tally[s.user_id] = (tally[s.user_id] ?? 0) + v;
        });
        return userIds
          .map((id) => ({
            user_id: id,
            profile: profMap[id],
            score: Math.round(tally[id] ?? 0),
          }))
          .sort((a, b) => b.score - a.score);
      }

      // meals_logged: count posts of kind=meal in window (simple heuristic)
      const { data: postRows } = await supabase
        .from("posts")
        .select("user_id")
        .eq("kind", "meal")
        .in("user_id", userIds)
        .gte("created_at", start)
        .lte("created_at", end);
      const tally2: Record<string, number> = {};
      (postRows ?? []).forEach((r: any) => {
        tally2[r.user_id] = (tally2[r.user_id] ?? 0) + 1;
      });
      return userIds
        .map((id) => ({ user_id: id, profile: profMap[id], score: tally2[id] ?? 0 }))
        .sort((a, b) => b.score - a.score);
    },
  });
}

// ============ helpers ============
export function displayName(p?: Profile | null): string {
  if (!p) return "Onbekend";
  return p.display_name?.trim() || (p.username ? "@" + p.username : "Alyva-gebruiker");
}

export function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const s = Math.floor(diff / 1000);
  if (s < 60) return "zojuist";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} u`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} d`;
  return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
}

// Suppress unused warning for useEffect/useState/useCallback if unused
void useEffect; void useState; void useCallback;
