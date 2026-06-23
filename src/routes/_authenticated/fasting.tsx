import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Timer, Play, Pause, Square, Bell, Pencil, Trash2, Flame, Trophy, CalendarCheck, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import {
  useFasting, FASTING_PROTOCOLS, getProtocol,
  requestNotificationPermission, type FastingProtocol, type FastEntry,
} from "@/lib/dashboard-prefs";
import { useI18n } from "@/lib/i18n";
import { PaywallOverlay } from "@/components/paywall-gate";

export const Route = createFileRoute("/_authenticated/fasting")({
  head: () => ({ meta: [{ title: "Fasting — Vita" }] }),
  component: FastingPage,
});

function FastingPage() {
  const { t, lang } = useI18n();
  const { state, start, pause, resume, stop, setProtocol, setStartTime, deleteEntry, updateEntry } = useFasting();
  const [editStart, setEditStart] = useState(false);
  const [editEntry, setEditEntry] = useState<FastEntry | null>(null);
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>(() =>
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "denied"
  );

  // tick
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!state.startedAt || state.pausedAt) return;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [state.startedAt, state.pausedAt]);

  const proto = getProtocol(state.protocol);
  const targetMs = proto.fast * 3_600_000;

  const live = useMemo(() => {
    if (!state.startedAt) return { active: false, paused: false, elapsedMs: 0, leftMs: 0, pct: 0 };
    const now = Date.now();
    let pausedMs = state.pausedTotalMs;
    if (state.pausedAt) pausedMs += now - new Date(state.pausedAt).getTime();
    const elapsedMs = Math.max(0, now - new Date(state.startedAt).getTime() - pausedMs);
    return {
      active: true,
      paused: !!state.pausedAt,
      elapsedMs,
      leftMs: Math.max(0, targetMs - elapsedMs),
      pct: Math.min(100, (elapsedMs / targetMs) * 100),
    };
  }, [state.startedAt, state.pausedAt, state.pausedTotalMs, targetMs]);

  // Fire end-of-fast notification once
  useEffect(() => {
    if (!live.active || live.paused) return;
    if (live.elapsedMs >= targetMs && live.elapsedMs - targetMs < 2000) {
      try { if ("Notification" in window && Notification.permission === "granted")
        new Notification(t("fast.title"), { body: t("fast.status.eating") });
      } catch {}
    }
  }, [live.active, live.paused, live.elapsedMs, targetMs, t]);

  // Stats
  const totalCompleted = state.history.filter((e) => e.completed).length;
  const last7 = useMemo(() => bucketByDay(state.history, 7, lang), [state.history, lang]);
  const last30 = useMemo(() => bucketByDay(state.history, 30, lang), [state.history, lang]);
  const weeklyHours = last7.reduce((a, b) => a + b.hours, 0);
  const monthlyHours = last30.reduce((a, b) => a + b.hours, 0);
  const consistency = Math.round((last7.filter((d) => d.hours > 0).length / 7) * 100);

  const eatStart = state.startedAt
    ? new Date(new Date(state.startedAt).getTime() + targetMs)
    : null;
  const eatEnd = eatStart ? new Date(eatStart.getTime() + proto.eat * 3_600_000) : null;

  async function askNotif() {
    const r = await requestNotificationPermission();
    setNotifPerm(r);
  }

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-background px-5 pb-32 pt-8">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand/15 text-brand">
            <Timer className="size-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">{t("fast.title")}</h1>
            <p className="text-[12px] text-muted-foreground">{t("fast.subtitle")}</p>
          </div>
        </div>
        {notifPerm !== "granted" && (
          <button
            onClick={askNotif}
            className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-card"
            aria-label={t("fast.enable_notif")}
          >
            <Bell className="size-4" />
          </button>
        )}
      </header>

      {/* Timer */}
      <section className="mt-6 rounded-3xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
            {live.active ? (live.paused ? t("fast.status.paused") : t("fast.status.fasting")) : t("fast.status.eating")}
          </span>
          <span className="font-display text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {proto.label}
          </span>
        </div>

        <div className="mt-5 grid place-items-center">
          <BigRing
            pct={live.active ? live.pct : 0}
            label={live.active ? formatHMS(live.elapsedMs) : "00:00:00"}
            sub={live.active
              ? t("fast.sub.untilWindow", { left: formatHM(live.leftMs), n: proto.eat })
              : t("fast.sub.tapStart", { n: proto.fast })}
          />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <Mini label={t("fast.mini.elapsed")} value={live.active ? formatHM(live.elapsedMs) : "—"} />
          <Mini label={t("fast.mini.remaining")} value={live.active ? formatHM(live.leftMs) : "—"} />
          <Mini label={t("fast.mini.goal")} value={`${proto.fast}h`} />
        </div>

        <div className="mt-5 flex gap-2">
          {!live.active ? (
            <Button className="h-11 flex-1" onClick={start}><Play className="mr-1.5 size-4" />{t("fast.action.start")}</Button>
          ) : (
            <>
              {live.paused ? (
                <Button className="h-11 flex-1" onClick={resume}><Play className="mr-1.5 size-4" />{t("fast.action.resume")}</Button>
              ) : (
                <Button variant="outline" className="h-11 flex-1" onClick={pause}><Pause className="mr-1.5 size-4" />{t("fast.action.pause")}</Button>
              )}
              <Button variant="destructive" className="h-11 flex-1" onClick={stop}><Square className="mr-1.5 size-4" />{t("fast.action.end")}</Button>
            </>
          )}
        </div>

        {live.active && (
          <button
            onClick={() => setEditStart(true)}
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
          >
            <Pencil className="size-3" /> {t("fast.started", { when: new Date(state.startedAt!).toLocaleString(lang, { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" }) })}
          </button>
        )}

        {eatStart && eatEnd && (
          <div className="mt-3 rounded-2xl bg-accent/40 p-3 text-center text-[11px] text-muted-foreground">
            {t("fast.window", {
              start: eatStart.toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit" }),
              end: eatEnd.toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit" }),
            })}
          </div>
        )}
      </section>

      {/* Protocols */}
      <section className="mt-5">
        <h2 className="mb-2 font-display text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">{t("fast.proto.title")}</h2>
        <div className="grid grid-cols-3 gap-2">
          {FASTING_PROTOCOLS.map((p) => (
            <button
              key={p.id}
              onClick={() => setProtocol(p.id)}
              disabled={live.active}
              className={`rounded-2xl border p-3 text-left transition disabled:opacity-50 ${
                state.protocol === p.id ? "border-brand bg-brand/10" : "border-border bg-card hover:bg-accent"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-semibold">{p.label}</span>
                {state.protocol === p.id && <Check className="size-3.5 text-brand" />}
              </div>
              <p className="mt-1 text-[10px] leading-tight text-muted-foreground">{p.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="mt-5 grid grid-cols-3 gap-2">
        <StatTile icon={Flame} label={t("fast.stats.streak")} value={`${state.streak}${t("fast.unit.day")}`} />
        <StatTile icon={Trophy} label={t("fast.stats.longest")} value={`${state.longestStreak}${t("fast.unit.day")}`} />
        <StatTile icon={CalendarCheck} label={t("fast.stats.total")} value={totalCompleted} />
      </section>

      {/* Weekly chart */}
      <section className="mt-5 rounded-3xl border border-border bg-card p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-sm font-semibold">{t("fast.last7")}</h2>
          <span className="text-[11px] text-muted-foreground">{t("fast.weeklySummary", { h: weeklyHours.toFixed(1), p: consistency })}</span>
        </div>
        <BarChart data={last7} targetH={proto.fast} className="mt-3 h-28" />
      </section>

      {/* Monthly chart */}
      <section className="mt-3 rounded-3xl border border-border bg-card p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-sm font-semibold">{t("fast.last30")}</h2>
          <span className="text-[11px] text-muted-foreground">{t("fast.monthlySummary", { h: monthlyHours.toFixed(0) })}</span>
        </div>
        <BarChart data={last30} targetH={proto.fast} className="mt-3 h-20" thin />
      </section>

      {/* Streak growth */}
      <section className="mt-3 rounded-3xl border border-border bg-card p-5">
        <h2 className="font-display text-sm font-semibold">{t("fast.streakGrowth")}</h2>
        <StreakLine history={state.history} className="mt-3 h-20" emptyLabel={t("fast.noStreak")} />
      </section>

      {/* History */}
      <section className="mt-5">
        <h2 className="mb-2 font-display text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">{t("fast.history")}</h2>
        {state.history.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
            {t("fast.noHistory")}
          </div>
        ) : (
          <ul className="space-y-2">
            {state.history.slice(0, 20).map((e) => (
              <li key={e.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                <div className={`grid size-9 shrink-0 place-items-center rounded-xl ${e.completed ? "bg-brand/15 text-brand" : "bg-muted text-muted-foreground"}`}>
                  {e.completed ? <Check className="size-4" /> : <Timer className="size-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-display text-sm font-semibold">{formatHM(e.durationMs)} · {e.protocol}</span>
                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {e.completed ? t("fast.done") : t("fast.short")}
                    </span>
                  </div>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {new Date(e.startedAt).toLocaleString(lang, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} → {new Date(e.endedAt).toLocaleString(lang, { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <button onClick={() => setEditEntry(e)} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent" aria-label={t("common.edit")}>
                  <Pencil className="size-3.5" />
                </button>
                <button onClick={() => deleteEntry(e.id)} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent" aria-label={t("common.delete")}>
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <EditStartDialog
        open={editStart}
        onOpenChange={setEditStart}
        startedAt={state.startedAt}
        onSave={(iso) => { setStartTime(iso); setEditStart(false); }}
      />

      <EditEntryDialog
        entry={editEntry}
        onClose={() => setEditEntry(null)}
        onSave={(id, patch) => { updateEntry(id, patch); setEditEntry(null); }}
      />
    </main>
  );
}

/* ---------- UI bits ---------- */
function BigRing({ pct, label, sub }: { pct: number; label: string; sub: string }) {
  const size = 220, stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (Math.min(100, pct) / 100) * c;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} stroke="currentColor" strokeOpacity={0.12} strokeWidth={stroke} fill="none" />
        <circle cx={size/2} cy={size/2} r={r} stroke="currentColor" className="text-brand" strokeWidth={stroke} strokeLinecap="round" fill="none" strokeDasharray={c} strokeDashoffset={off} />
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-4xl font-semibold tabular-nums leading-none">{label}</div>
        <div className="mt-2 text-[11px] font-medium text-muted-foreground">{sub}</div>
        <div className="mt-1 font-display text-[11px] font-semibold tabular-nums text-brand">{Math.round(pct)}%</div>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-background/40 px-2 py-2">
      <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-display text-sm font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function StatTile({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="size-3.5" />
        <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-1.5 font-display text-xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function BarChart({ data, targetH, className, thin }: { data: { label: string; hours: number }[]; targetH: number; className?: string; thin?: boolean }) {
  const max = Math.max(targetH, ...data.map((d) => d.hours), 1);
  return (
    <div className={`flex items-end gap-1 ${className ?? ""}`}>
      {data.map((d, i) => {
        const h = (d.hours / max) * 100;
        const met = d.hours >= targetH && d.hours > 0;
        return (
          <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
            <div
              className={`w-full rounded-t-md ${met ? "bg-brand" : d.hours > 0 ? "bg-brand/40" : "bg-border"}`}
              style={{ height: `${Math.max(h, d.hours > 0 ? 6 : 2)}%` }}
              title={`${d.label}: ${d.hours.toFixed(1)}h`}
            />
            {!thin && <span className="text-[9px] text-muted-foreground">{d.label}</span>}
          </div>
        );
      })}
    </div>
  );
}

function StreakLine({ history, className, emptyLabel }: { history: FastEntry[]; className?: string; emptyLabel: string }) {
  const days: { date: string; streak: number }[] = [];
  const sorted = [...history].sort((a, b) => +new Date(a.endedAt) - +new Date(b.endedAt));
  let cur = 0; let last: string | null = null;
  for (const e of sorted) {
    if (!e.completed) continue;
    const d = e.endedAt.slice(0, 10);
    if (last && new Date(d).getTime() - new Date(last).getTime() === 86_400_000) cur += 1;
    else if (last === d) {/* same day */}
    else cur = 1;
    last = d;
    days.push({ date: d, streak: cur });
  }
  if (days.length === 0) {
    return <div className={`grid place-items-center text-[11px] text-muted-foreground ${className ?? ""}`}>{emptyLabel}</div>;
  }
  const max = Math.max(...days.map((d) => d.streak), 1);
  const w = 100, h = 100;
  const pts = days.map((d, i) => {
    const x = (i / Math.max(1, days.length - 1)) * w;
    const y = h - (d.streak / max) * h;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={`w-full ${className ?? ""}`}>
      <polyline fill="none" stroke="currentColor" className="text-brand" strokeWidth={2} points={pts} />
    </svg>
  );
}

/* ---------- Dialogs ---------- */
function EditStartDialog({ open, onOpenChange, startedAt, onSave }: { open: boolean; onOpenChange: (b: boolean) => void; startedAt: string | null; onSave: (iso: string) => void }) {
  const { t } = useI18n();
  const [val, setVal] = useState("");
  useEffect(() => { if (open && startedAt) setVal(toLocalInput(startedAt)); }, [open, startedAt]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("fast.dlg.editStart.title")}</DialogTitle>
          <DialogDescription>{t("fast.dlg.editStart.desc")}</DialogDescription>
        </DialogHeader>
        <Label htmlFor="startedAt">{t("fast.dlg.startedAt")}</Label>
        <Input id="startedAt" type="datetime-local" value={val} onChange={(e) => setVal(e.target.value)} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button onClick={() => val && onSave(new Date(val).toISOString())}>{t("common.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditEntryDialog({ entry, onClose, onSave }: { entry: FastEntry | null; onClose: () => void; onSave: (id: string, patch: { startedAt?: string; endedAt?: string }) => void }) {
  const { t } = useI18n();
  const [s, setS] = useState("");
  const [e, setE] = useState("");
  useEffect(() => {
    if (entry) { setS(toLocalInput(entry.startedAt)); setE(toLocalInput(entry.endedAt)); }
  }, [entry]);
  return (
    <Dialog open={!!entry} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("fast.dlg.edit.title")}</DialogTitle>
          <DialogDescription>{t("fast.dlg.edit.desc")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="s">{t("fast.dlg.started")}</Label>
            <Input id="s" type="datetime-local" value={s} onChange={(ev) => setS(ev.target.value)} />
          </div>
          <div>
            <Label htmlFor="e">{t("fast.dlg.ended")}</Label>
            <Input id="e" type="datetime-local" value={e} onChange={(ev) => setE(ev.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
          <Button onClick={() => entry && onSave(entry.id, { startedAt: new Date(s).toISOString(), endedAt: new Date(e).toISOString() })}>{t("common.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- helpers ---------- */
function formatHMS(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
function formatHM(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m`;
}
function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function bucketByDay(history: FastEntry[], days: number, lang: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const out: { label: string; date: string; hours: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86_400_000);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString(lang, { weekday: "short" }).slice(0, 1);
    let hours = 0;
    for (const e of history) {
      const start = new Date(e.startedAt).getTime();
      const end = new Date(e.endedAt).getTime();
      const dayStart = d.getTime();
      const dayEnd = dayStart + 86_400_000;
      const overlap = Math.max(0, Math.min(end, dayEnd) - Math.max(start, dayStart));
      hours += overlap / 3_600_000;
    }
    out.push({ label, date: key, hours });
  }
  return out;
}
