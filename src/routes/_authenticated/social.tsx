import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Users, Heart, MessageCircle, Trophy, Plus, Search, UserPlus, Mail, X,
  Check, Loader2, Share2, Globe, Lock, Trash2, ChevronLeft, Send, Dumbbell, UtensilsCrossed, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import {
  useMyProfile, useFriends, useFriendSearch, useFriendInvites,
  useFeed, useCreatePost, useDeletePost, useToggleLike, usePostComments,
  useChallenges, useChallengeLeaderboard,
  displayName, relativeTime,
  type Post, type Challenge, type Profile,
} from "@/lib/social";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/social")({
  head: () => ({ meta: [{ title: "Sociaal — Vita" }] }),
  component: SocialPage,
});

type Tab = "feed" | "friends" | "challenges";

export function SocialPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("feed");
  const [composeOpen, setComposeOpen] = useState(false);
  const [createChallengeOpen, setCreateChallengeOpen] = useState(false);
  const { profile } = useMyProfile();

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-background px-5 pb-32 pt-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">{t("soc.title")}</h1>
          <p className="text-[12px] text-muted-foreground">{t("soc.subtitle")}</p>
        </div>
        <button
          onClick={() => (tab === "challenges" ? setCreateChallengeOpen(true) : setComposeOpen(true))}
          className="grid size-10 place-items-center rounded-full bg-brand text-brand-foreground shadow-lg shadow-brand/30"
          aria-label={t("soc.new")}
        >
          <Plus className="size-5" />
        </button>
      </header>

      {!profile?.username && <UsernameSetup />}

      <div className="mt-5 grid grid-cols-3 gap-1 rounded-2xl border border-border bg-card/50 p-1">
        <TabBtn active={tab === "feed"} onClick={() => setTab("feed")} icon={<Heart className="size-4" />} label={t("soc.tab.feed")} />
        <TabBtn active={tab === "friends"} onClick={() => setTab("friends")} icon={<Users className="size-4" />} label={t("soc.tab.friends")} />
        <TabBtn active={tab === "challenges"} onClick={() => setTab("challenges")} icon={<Trophy className="size-4" />} label={t("soc.tab.challenges")} />
      </div>

      <div className="mt-5">
        {tab === "feed" && <FeedTab />}
        {tab === "friends" && <FriendsTab />}
        {tab === "challenges" && <ChallengesTab />}
      </div>

      <ComposeDialog open={composeOpen} onClose={() => setComposeOpen(false)} />
      <CreateChallengeDialog open={createChallengeOpen} onClose={() => setCreateChallengeOpen(false)} />
    </main>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-sm font-medium transition ${
        active ? "bg-brand text-brand-foreground shadow" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon} {label}
    </button>
  );
}

function UsernameSetup() {
  const { t } = useI18n();
  const { updateUsername } = useMyProfile();
  const [val, setVal] = useState("");
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="mt-5 rounded-2xl border border-brand/40 bg-brand/5 p-4">
      <p className="text-sm font-semibold">{t("soc.username.title")}</p>
      <p className="mt-1 text-xs text-muted-foreground">{t("soc.username.desc")}</p>
      <div className="mt-3 flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
          <Input
            value={val}
            onChange={(e) => setVal(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
            placeholder={t("soc.username.placeholder")}
            className="pl-7"
          />
        </div>
        <Button
          disabled={updateUsername.isPending || val.length < 3}
          onClick={async () => {
            setErr(null);
            try { await updateUsername.mutateAsync(val); }
            catch (e: any) { setErr(e?.message || t("common.failed")); }
          }}
        >
          {updateUsername.isPending ? <Loader2 className="size-4 animate-spin" /> : t("soc.username.save")}
        </Button>
      </div>
      {err && <p className="mt-2 text-xs text-destructive">{err}</p>}
    </div>
  );
}

function FeedTab() {
  const { t } = useI18n();
  const { posts, loading, authorFor, likedPosts } = useFeed();
  const [openCommentsFor, setOpenCommentsFor] = useState<Post | null>(null);

  if (loading) return <Loading />;
  if (posts.length === 0) {
    return (
      <EmptyState
        icon={<Heart className="size-6" />}
        title={t("soc.feed.empty.title")}
        text={t("soc.feed.empty.text")}
      />
    );
  }
  return (
    <>
      <ul className="space-y-3">
        {posts.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            author={authorFor(p.user_id)}
            liked={likedPosts.has(p.id)}
            onComments={() => setOpenCommentsFor(p)}
          />
        ))}
      </ul>
      <CommentsDialog post={openCommentsFor} onClose={() => setOpenCommentsFor(null)} />
    </>
  );
}

function PostCard({
  post, author, liked, onComments,
}: { post: Post; author?: Profile; liked: boolean; onComments: () => void }) {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const toggleLike = useToggleLike();
  const del = useDeletePost();
  const mine = post.user_id === user?.id;

  const kindMeta: Record<string, { icon: React.ReactNode; label: string }> = {
    workout: { icon: <Dumbbell className="size-3.5" />, label: t("soc.kind.workout") },
    meal: { icon: <UtensilsCrossed className="size-3.5" />, label: t("soc.kind.meal") },
    milestone: { icon: <Sparkles className="size-3.5" />, label: t("soc.kind.milestone") },
    text: { icon: <MessageCircle className="size-3.5" />, label: t("soc.kind.text") },
  };
  const k = kindMeta[post.kind] ?? kindMeta.text;

  return (
    <li className="rounded-3xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <Avatar profile={author} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{displayName(author)}</p>
          <p className="text-[11px] text-muted-foreground">
            {author?.username && <span>@{author.username} · </span>}
            {relativeTime(post.created_at)}
            <span> · </span>
            {post.visibility === "public" ? <Globe className="inline size-3" /> : <Lock className="inline size-3" />}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-semibold text-brand">
          {k.icon} {k.label}
        </span>
        {mine && (
          <button
            onClick={() => { if (confirm(t("soc.post.confirm_delete"))) del.mutate(post.id); }}
            className="ml-1 grid size-7 place-items-center rounded-full text-muted-foreground hover:text-destructive"
            aria-label={t("soc.post.delete_aria")}
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>

      {post.title && <p className="mt-3 font-medium">{post.title}</p>}
      {post.body && <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{post.body}</p>}
      {post.image_url && (
        <img src={post.image_url} alt="" className="mt-3 max-h-80 w-full rounded-2xl object-cover" loading="lazy" />
      )}
      {post.payload && Object.keys(post.payload).length > 0 && <PostStats payload={post.payload} kind={post.kind} />}

      <div className="mt-3 flex items-center gap-4 border-t border-border pt-3 text-xs">
        <button
          onClick={() => toggleLike.mutate({ postId: post.id, liked })}
          className={`inline-flex items-center gap-1.5 ${liked ? "text-brand" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Heart className={`size-4 ${liked ? "fill-current" : ""}`} />
          <span className="font-semibold">{post.like_count}</span>
        </button>
        <button
          onClick={onComments}
          className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <MessageCircle className="size-4" />
          <span className="font-semibold">{post.comment_count}</span>
        </button>
      </div>
    </li>
  );
}

function PostStats({ payload, kind }: { payload: Record<string, any>; kind: string }) {
  const { t } = useI18n();
  if (kind === "workout") {
    const items = [
      payload.duration_minutes ? `${payload.duration_minutes} ${t("soc.unit.min")}` : null,
      payload.total_calories ? `${payload.total_calories} ${t("soc.unit.kcal")}` : null,
      payload.exercises_count ? `${payload.exercises_count} ${t("soc.unit.ex_short")}` : null,
    ].filter(Boolean);
    if (items.length === 0) return null;
    return (
      <div className="mt-3 flex gap-2 overflow-x-auto">
        {items.map((it, i) => (
          <span key={i} className="shrink-0 rounded-full bg-background/60 px-3 py-1 text-xs font-medium">{it}</span>
        ))}
      </div>
    );
  }
  if (kind === "meal") {
    const items = [
      payload.kcal ? `${payload.kcal} ${t("soc.unit.kcal")}` : null,
      payload.protein ? `${t("soc.macro.p")} ${payload.protein}g` : null,
      payload.carbs ? `${t("soc.macro.c")} ${payload.carbs}g` : null,
      payload.fat ? `${t("soc.macro.f")} ${payload.fat}g` : null,
    ].filter(Boolean);
    if (items.length === 0) return null;
    return (
      <div className="mt-3 flex gap-2 overflow-x-auto">
        {items.map((it, i) => (
          <span key={i} className="shrink-0 rounded-full bg-background/60 px-3 py-1 text-xs font-medium">{it}</span>
        ))}
      </div>
    );
  }
  return null;
}

function FriendsTab() {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const { friendships, friendIds, incoming, outgoing, profileFor, request, accept, remove } = useFriends();
  const { user } = useAuth();
  const search = useFriendSearch(q);

  const acceptedFriendships = friendships.filter((f) => f.status === "accepted");
  const friendshipFor = (otherId: string) =>
    friendships.find(
      (f) => (f.user_id === user?.id && f.friend_id === otherId) || (f.friend_id === user?.id && f.user_id === otherId)
    );

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("soc.friends.search_ph")}
          className="pl-9 rounded-full"
        />
      </div>

      {q.trim().length >= 2 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("soc.friends.search_results")}</h3>
          {search.isLoading ? <Loading /> : (
            <ul className="space-y-2">
              {(search.data ?? []).map((p) => {
                const existing = friendshipFor(p.id);
                return (
                  <FriendRow
                    key={p.id}
                    profile={p}
                    right={
                      existing
                        ? <Badge>{existing.status === "accepted" ? t("soc.friends.added") : t("soc.friends.pending")}</Badge>
                        : (
                          <Button size="sm" onClick={() => request.mutate(p.id)} disabled={request.isPending}>
                            <UserPlus className="size-3.5" /> {t("soc.friends.add")}
                          </Button>
                        )
                    }
                  />
                );
              })}
              {(search.data ?? []).length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-4">{t("soc.friends.no_results")}</p>
              )}
            </ul>
          )}
        </section>
      )}

      <Button variant="outline" className="w-full rounded-full" onClick={() => setInviteOpen(true)}>
        <Mail className="size-4" /> {t("soc.friends.invite_btn")}
      </Button>

      {incoming.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("soc.friends.incoming", { n: incoming.length })}
          </h3>
          <ul className="space-y-2">
            {incoming.map((f) => {
              const otherId = f.user_id === user?.id ? f.friend_id : f.user_id;
              return (
                <FriendRow
                  key={f.id}
                  profile={profileFor(otherId)}
                  right={
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => accept.mutate(f.id)}>
                        <Check className="size-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => remove.mutate(f.id)}>
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  }
                />
              );
            })}
          </ul>
        </section>
      )}

      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("soc.friends.list", { n: friendIds.length })}
        </h3>
        {acceptedFriendships.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-4">{t("soc.friends.empty")}</p>
        ) : (
          <ul className="space-y-2">
            {acceptedFriendships.map((f) => {
              const otherId = f.user_id === user?.id ? f.friend_id : f.user_id;
              return (
                <FriendRow
                  key={f.id}
                  profile={profileFor(otherId)}
                  right={
                    <Button size="sm" variant="outline" onClick={() => { if (confirm(t("soc.friends.remove_confirm"))) remove.mutate(f.id); }}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  }
                />
              );
            })}
          </ul>
        )}
      </section>

      {outgoing.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("soc.friends.outgoing")}
          </h3>
          <ul className="space-y-2">
            {outgoing.map((f) => {
              const otherId = f.user_id === user?.id ? f.friend_id : f.user_id;
              return (
                <FriendRow
                  key={f.id}
                  profile={profileFor(otherId)}
                  right={
                    <Button size="sm" variant="outline" onClick={() => remove.mutate(f.id)}>
                      {t("soc.friends.cancel_req")}
                    </Button>
                  }
                />
              );
            })}
          </ul>
        </section>
      )}

      <InviteDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  );
}

function FriendRow({ profile, right }: { profile?: Profile; right: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
      <Avatar profile={profile} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{displayName(profile)}</p>
        {profile?.username && <p className="truncate text-[11px] text-muted-foreground">@{profile.username}</p>}
      </div>
      {right}
    </li>
  );
}

function InviteDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const { send } = useFriendInvites();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    setErr(null);
    try {
      await send.mutateAsync({ email, message: msg });
      setDone(true);
      setTimeout(() => { setEmail(""); setMsg(""); setDone(false); onClose(); }, 1200);
    } catch (e: any) {
      setErr(e?.message || t("common.failed"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent hideClose className="max-w-sm gap-0 p-0 sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-display font-semibold">{t("soc.invite.title")}</h2>
          <button onClick={onClose}><X className="size-5" /></button>
        </div>
        <div className="space-y-3 p-4">
          <div>
            <Label className="text-xs">{t("soc.invite.email_label")}</Label>
            <Input className="mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("soc.invite.email_ph")} />
          </div>
          <div>
            <Label className="text-xs">{t("soc.invite.msg_label")}</Label>
            <Textarea className="mt-1" rows={3} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={t("soc.invite.msg_ph")} />
          </div>
          {err && <p className="text-xs text-destructive">{err}</p>}
          {done && <p className="text-xs text-brand">{t("soc.invite.saved")}</p>}
          <Button onClick={submit} disabled={send.isPending} className="w-full rounded-full">
            <Mail className="size-4" /> {send.isPending ? t("soc.invite.sending") : t("soc.invite.save")}
          </Button>
          <p className="text-[11px] text-muted-foreground">{t("soc.invite.note")}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ChallengesTab() {
  const { t } = useI18n();
  const { challenges, loading, joinedIds, join, leave } = useChallenges();
  const [openLeaderboard, setOpenLeaderboard] = useState<Challenge | null>(null);
  const { user } = useAuth();

  const metricLabel: Record<Challenge["metric"], string> = {
    workouts: t("soc.ch.metric.workouts"),
    minutes: t("soc.ch.metric.minutes"),
    calories: t("soc.ch.metric.calories"),
    meals_logged: t("soc.ch.metric.meals"),
  };

  if (loading) return <Loading />;
  if (challenges.length === 0) {
    return (
      <EmptyState
        icon={<Trophy className="size-6" />}
        title={t("soc.ch.empty.title")}
        text={t("soc.ch.empty.text")}
      />
    );
  }
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <ul className="space-y-3">
        {challenges.map((c) => {
          const joined = joinedIds.has(c.id);
          const status =
            c.ends_on < today ? t("soc.ch.status.ended") :
            c.starts_on > today ? t("soc.ch.status.upcoming") : t("soc.ch.status.live");
          const live = c.ends_on >= today && c.starts_on <= today;
          const upcoming = c.starts_on > today;
          const mine = c.created_by === user?.id;
          return (
            <li key={c.id} className="rounded-3xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Trophy className="size-4 text-brand" />
                    <p className="truncate font-semibold">{c.title}</p>
                  </div>
                  {c.description && <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>}
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {metricLabel[c.metric]} · {c.starts_on} → {c.ends_on}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  live ? "bg-brand/15 text-brand" :
                  upcoming ? "bg-amber-500/15 text-amber-600" :
                  "bg-muted text-muted-foreground"
                }`}>{status}</span>
              </div>
              <div className="mt-3 flex gap-2">
                {joined ? (
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => leave.mutate(c.id)} disabled={mine}>
                    {mine ? t("soc.ch.creator") : t("soc.ch.leave")}
                  </Button>
                ) : (
                  <Button size="sm" className="flex-1" onClick={() => join.mutate(c.id)}>
                    {t("soc.ch.join")}
                  </Button>
                )}
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setOpenLeaderboard(c)}>
                  <Trophy className="size-3.5" /> {t("soc.ch.leaderboard")}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      <LeaderboardDialog challenge={openLeaderboard} onClose={() => setOpenLeaderboard(null)} />
    </>
  );
}

function CreateChallengeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const { create } = useChallenges();
  const today = new Date().toISOString().slice(0, 10);
  const inWeek = new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [metric, setMetric] = useState<Challenge["metric"]>("workouts");
  const [starts, setStarts] = useState(today);
  const [ends, setEnds] = useState(inWeek);
  const [target, setTarget] = useState<string>("");
  const [visibility, setVisibility] = useState<Challenge["visibility"]>("friends");
  const [err, setErr] = useState<string | null>(null);

  const metricLabel: Record<Challenge["metric"], string> = {
    workouts: t("soc.ch.metric.workouts"),
    minutes: t("soc.ch.metric.minutes"),
    calories: t("soc.ch.metric.calories"),
    meals_logged: t("soc.ch.metric.meals"),
  };

  async function submit() {
    setErr(null);
    try {
      await create.mutateAsync({
        title: title.trim(),
        description: desc.trim() || null,
        metric,
        target: target ? Number(target) : null,
        starts_on: starts,
        ends_on: ends,
        visibility,
      });
      setTitle(""); setDesc(""); setTarget("");
      onClose();
    } catch (e: any) { setErr(e?.message || t("common.failed")); }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent hideClose className="max-w-sm gap-0 p-0 sm:rounded-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-display font-semibold">{t("soc.ch.new.title")}</h2>
          <button onClick={onClose}><X className="size-5" /></button>
        </div>
        <div className="space-y-3 p-4">
          <div>
            <Label className="text-xs">{t("soc.ch.new.title_field")}</Label>
            <Input className="mt-1" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("soc.ch.new.title_ph")} />
          </div>
          <div>
            <Label className="text-xs">{t("soc.ch.new.desc")}</Label>
            <Textarea className="mt-1" rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">{t("soc.ch.new.metric")}</Label>
            <Select value={metric} onValueChange={(v) => setMetric(v as Challenge["metric"])}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(metricLabel).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">{t("soc.ch.new.start")}</Label>
              <Input className="mt-1" type="date" value={starts} onChange={(e) => setStarts(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">{t("soc.ch.new.end")}</Label>
              <Input className="mt-1" type="date" value={ends} onChange={(e) => setEnds(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-xs">{t("soc.ch.new.target")}</Label>
            <Input className="mt-1" type="number" value={target} onChange={(e) => setTarget(e.target.value)} placeholder={t("soc.ch.new.target_ph")} />
          </div>
          <div>
            <Label className="text-xs">{t("soc.ch.new.visibility")}</Label>
            <Select value={visibility} onValueChange={(v) => setVisibility(v as Challenge["visibility"])}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="friends">{t("soc.ch.new.vis_friends")}</SelectItem>
                <SelectItem value="public">{t("soc.ch.new.vis_public")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {err && <p className="text-xs text-destructive">{err}</p>}
          <Button onClick={submit} disabled={create.isPending || !title.trim()} className="w-full rounded-full">
            <Trophy className="size-4" /> {t("soc.ch.new.create")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LeaderboardDialog({ challenge, onClose }: { challenge: Challenge | null; onClose: () => void }) {
  const { t } = useI18n();
  const lb = useChallengeLeaderboard(challenge);
  return (
    <Dialog open={!!challenge} onOpenChange={(o) => !o && onClose()}>
      <DialogContent hideClose className="max-w-sm gap-0 p-0 sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <button onClick={onClose}><ChevronLeft className="size-5" /></button>
          <h2 className="truncate font-display font-semibold">{challenge?.title}</h2>
          <div className="size-5" />
        </div>
        <div className="p-4">
          {!challenge ? null : lb.isLoading ? <Loading /> : (
            (lb.data ?? []).length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">{t("soc.lb.empty")}</p>
            ) : (
              <ol className="space-y-2">
                {(lb.data ?? []).map((row, i) => (
                  <li key={row.user_id} className="flex items-center gap-3 rounded-2xl border border-border p-3">
                    <span className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold ${
                      i === 0 ? "bg-amber-400/20 text-amber-600" :
                      i === 1 ? "bg-zinc-400/20 text-zinc-500" :
                      i === 2 ? "bg-orange-400/20 text-orange-600" :
                      "bg-muted text-muted-foreground"
                    }`}>{i + 1}</span>
                    <Avatar profile={row.profile} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{displayName(row.profile)}</p>
                      {row.profile?.username && <p className="truncate text-[11px] text-muted-foreground">@{row.profile.username}</p>}
                    </div>
                    <span className="text-sm font-bold text-brand tabular-nums">{row.score}</span>
                  </li>
                ))}
              </ol>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ComposeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const create = useCreatePost();
  const [body, setBody] = useState("");
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState<"friends" | "public">("friends");
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setErr(null);
    try {
      await create.mutateAsync({
        kind: "text",
        title: title.trim() || undefined,
        body: body.trim() || undefined,
        visibility,
      });
      setTitle(""); setBody("");
      onClose();
    } catch (e: any) { setErr(e?.message || t("common.failed")); }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent hideClose className="max-w-sm gap-0 p-0 sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-display font-semibold">{t("soc.compose.title")}</h2>
          <button onClick={onClose}><X className="size-5" /></button>
        </div>
        <div className="space-y-3 p-4">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("soc.compose.title_ph")} />
          <Textarea
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t("soc.compose.body_ph")}
          />
          <Select value={visibility} onValueChange={(v) => setVisibility(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="friends"><Lock className="mr-1 inline size-3" /> {t("soc.ch.new.vis_friends")}</SelectItem>
              <SelectItem value="public"><Globe className="mr-1 inline size-3" /> {t("soc.ch.new.vis_public")}</SelectItem>
            </SelectContent>
          </Select>
          {err && <p className="text-xs text-destructive">{err}</p>}
          <Button onClick={submit} disabled={create.isPending || (!body.trim() && !title.trim())} className="w-full rounded-full">
            <Share2 className="size-4" /> {t("soc.compose.post")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CommentsDialog({ post, onClose }: { post: Post | null; onClose: () => void }) {
  const { t, lang } = useI18n();
  const { comments, add } = usePostComments(post?.id ?? null);
  const { user } = useAuth();
  const { profileFor } = useFriends();
  const [val, setVal] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setErr(null);
    try { await add.mutateAsync(val); setVal(""); }
    catch (e: any) { setErr(e?.message || t("common.failed")); }
  }

  return (
    <Dialog open={!!post} onOpenChange={(o) => !o && onClose()}>
      <DialogContent hideClose className="max-w-sm gap-0 p-0 sm:rounded-3xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-border p-4">
          <button onClick={onClose}><ChevronLeft className="size-5" /></button>
          <h2 className="font-display font-semibold">{t("soc.comments.title")}</h2>
          <div className="size-5" />
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {comments.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">{t("soc.comments.empty")}</p>
          ) : (
            <ul className="space-y-3">
              {comments.map((c) => {
                const p = c.user_id === user?.id ? undefined : profileFor(c.user_id);
                return (
                  <li key={c.id} className="flex gap-2">
                    <Avatar profile={p} size={32} />
                    <div className="min-w-0 flex-1 rounded-2xl bg-muted/40 px-3 py-2">
                      <p className="text-[11px] font-semibold">{c.user_id === user?.id ? t("soc.comments.you") : displayName(p)} <span className="ml-1 font-normal text-muted-foreground">{relativeTime(c.created_at)}</span></p>
                      <p className="text-sm">{c.body}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {err && <p className="mt-2 text-xs text-destructive">{err}</p>}
        </div>
        <div className="flex items-center gap-2 border-t border-border p-3">
          <Input value={val} onChange={(e) => setVal(e.target.value)} placeholder={t("soc.comments.placeholder")}
            onKeyDown={(e) => { if (e.key === "Enter" && val.trim()) submit(); }} />
          <Button size="icon" onClick={submit} disabled={add.isPending || !val.trim()}>
            <Send className="size-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Avatar({ profile, size = 40 }: { profile?: Profile | null; size?: number }) {
  const letter = (profile?.display_name || profile?.username || "?").slice(0, 1).toUpperCase();
  if (profile?.avatar_url) {
    return <img src={profile.avatar_url} alt="" className="shrink-0 rounded-full object-cover bg-muted" style={{ width: size, height: size }} />;
  }
  return (
    <div className="grid shrink-0 place-items-center rounded-full bg-brand/15 font-bold text-brand" style={{ width: size, height: size }}>
      {letter}
    </div>
  );
}
function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{children}</span>;
}
function Loading() {
  return <div className="grid place-items-center py-10 text-muted-foreground"><Loader2 className="size-5 animate-spin" /></div>;
}
function EmptyState({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card/50 p-8 text-center">
      <div className="mx-auto mb-2 grid size-12 place-items-center rounded-full bg-brand/15 text-brand">{icon}</div>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{text}</p>
    </div>
  );
}
