import { localDayKey } from "@/lib/local-date";
import { AlyvaWordmark } from "@/components/brand";
import { createFileRoute } from "@tanstack/react-router";
import type * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Timer, Play, Pause, Square, Plus, Pencil, Trash2, Check, ChevronLeft, ChevronRight,
  Sparkles, Flame, TrendingUp, CalendarCheck, Lightbulb, Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MonthCalendar } from "@/components/nutrition/month-calendar";
import {
  useFasting, useFastReminders, FASTING_PROTOCOLS, getProtocol,
  requestNotificationPermission, notify,
  type FastEntry, type FastReminderPrefs, type FastingProtocol,
} from "@/lib/dashboard-prefs";
import { useI18n } from "@/lib/i18n";
import { PaywallOverlay } from "@/components/paywall-gate";
import { FastingSummarySheet } from "@/components/fasting/fasting-summary";
import { FastingPhaseTimeline } from "@/components/fasting/fasting-phase-timeline";
import { FastingTipsSheet, fastingTipOfTheDay } from "@/components/fasting/fasting-tips-sheet";
import { FastingPhaseSheet } from "@/components/fasting/fasting-phase-sheet";

export const Route = createFileRoute("/_authenticated/fasting")({
  head: () => ({
    meta: [
      { title: "Vasten — Alyva" },
      { name: "description", content: "Volg je intermittent fasting met een live timer, protocollen, reeksen en inzichten." },
      { property: "og:title", content: "Vasten — Alyva" },
      { property: "og:description", content: "Live vastentimer, protocollen van 16:8 tot OMAD en heldere inzichten." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FastingPage,
});

const LOCALE_MAP: Record<string, string> = {
  en: "en-GB", nl: "nl-NL", ar: "ar", fr: "fr-FR", de: "de-DE", es: "es-ES",
};

/** Colour tokens per protocol (module accent colours only — brand stays green). */
const PROTO_TINT: Record<string, { dot: string; ring: string; soft: string; text: string }> = {
  "16:8": { dot: "bg-acc-fasting", ring: "border-acc-fasting", soft: "bg-acc-fasting-soft", text: "text-acc-fasting" },
  "14:10": { dot: "bg-acc-nutrition", ring: "border-acc-nutrition", soft: "bg-acc-nutrition-soft", text: "text-acc-nutrition" },
  "18:6": { dot: "bg-acc-weight", ring: "border-acc-weight", soft: "bg-acc-weight-soft", text: "text-acc-weight" },
  "20:4": { dot: "bg-acc-cycle", ring: "border-acc-cycle", soft: "bg-acc-cycle-soft", text: "text-acc-cycle" },
  OMAD: { dot: "bg-acc-fitness", ring: "border-acc-fitness", soft: "bg-acc-fitness-soft", text: "text-acc-fitness" },
};

const TAG_KEY: Record<string, string> = {
  "16:8": "fast.proto.tag.16_8",
  "14:10": "fast.proto.tag.14_10",
  "18:6": "fast.proto.tag.18_6",
  "20:4": "fast.proto.tag.20_4",
  OMAD: "fast.proto.tag.OMAD",
};

function FastingPage() {
  const { t, lang } = useI18n();
  const locale = LOCALE_MAP[lang] ?? lang;
  const { state, start, pause, resume, stop, setProtocol, setStartTime, deleteEntry, updateEntry, addEntry } = useFasting();
  const { reminders, toggleReminder } = useFastReminders();
  const [tab, setTab] = useState<"overview" | "insights">("overview");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);
  const [editStart, setEditStart] = useState(false);
  const [editEntry, setEditEntry] = useState<FastEntry | null>(null);
  const [summary, setSummary] = useState<FastEntry | null>(null);
  const [summaryIsLive, setSummaryIsLive] = useState(false);
  const [phaseSheet, setPhaseSheet] = useState<string | null>(null);
  const [dateOffset, setDateOffset] = useState(0);

  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!state.startedAt || state.pausedAt) return;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [state.startedAt, state.pausedAt]);

  const proto = getProtocol(state.protocol);
  const targetMs = proto.fast * 3_600_000;

  const live = useMemo(() => {
    if (!state.startedAt) return { active: false, paused: false, elapsedMs: 0, leftMs: 0, overMs: 0, pct: 0 };
    const now = Date.now();
    let pausedMs = state.pausedTotalMs;
    if (state.pausedAt) pausedMs += now - new Date(state.pausedAt).getTime();
    const elapsedMs = Math.max(0, now - new Date(state.startedAt).getTime() - pausedMs);
    return {
      active: true,
      paused: !!state.pausedAt,
      elapsedMs,
      leftMs: Math.max(0, targetMs - elapsedMs),
      overMs: Math.max(0, elapsedMs - targetMs),
      pct: Math.min(100, (elapsedMs / targetMs) * 100),
    };
  }, [state.startedAt, state.pausedAt, state.pausedTotalMs, targetMs, tick]);

  /** Expected moment the protocol goal is reached (start + protocol hours + pauses). */
  const goalAt = useMemo(() => {
    if (!state.startedAt) return null;
    let pausedMs = state.pausedTotalMs;
    if (state.pausedAt) pausedMs += Date.now() - new Date(state.pausedAt).getTime();
    return new Date(new Date(state.startedAt).getTime() + pausedMs + targetMs);
  }, [state.startedAt, state.pausedAt, state.pausedTotalMs, targetMs, tick]);

  /* Optional reminders around the calculated goal time. */
  const firedRef = useRef<Record<string, string>>({});
  useEffect(() => {
    if (!live.active || live.paused || !goalAt) return;
    const key = `${state.startedAt}-${state.protocol}`;
    const leftMin = live.leftMs / 60_000;
    const fire = (id: keyof FastReminderPrefs, body: string) => {
      if (firedRef.current[id] === key) return;
      firedRef.current[id] = key;
      notify(t("fast.title"), body);
    };
    if (reminders.before1h && leftMin <= 60 && leftMin > 55)
      fire("before1h", t("fast.rem.body1h", { p: proto.label }));
    if (reminders.before5m && leftMin <= 5 && leftMin > 0)
      fire("before5m", t("fast.rem.body5m"));
    if (reminders.atGoal && live.elapsedMs >= targetMs)
      fire("atGoal", t("fast.rem.bodyAt", { h: formatHM(live.elapsedMs, t("unit.h")) }));
  }, [live.active, live.paused, live.elapsedMs, live.leftMs, goalAt, reminders, targetMs, state.startedAt, state.protocol, proto.label, t]);

  const viewDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dateOffset);
    return d;
  }, [dateOffset]);

  const last7 = useMemo(() => bucketByDay(state.history, 7, locale), [state.history, locale]);
  const last30 = useMemo(() => bucketByDay(state.history, 30, locale), [state.history, locale]);
  const weeklyHours = last7.reduce((a, b) => a + b.hours, 0);
  const monthlyHours = last30.reduce((a, b) => a + b.hours, 0);
  const consistency = Math.round((last7.filter((d) => d.hours > 0).length / 7) * 100);
  const totalHours = state.history.reduce((a, e) => a + e.durationMs / 3_600_000, 0);
  const daysDoneThisWeek = last7.filter((d) => d.hours >= proto.fast * 0.9).length;
  const weekLeft = Math.max(0, 7 - daysDoneThisWeek);

  const hhmm = (d: Date) => d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  const goalAtText = goalAt ? hhmm(goalAt) : "—";

  const tipIndex = useMemo(() => fastingTipOfTheDay(localDayKey(viewDate)), [viewDate]);

  const viewKey = localDayKey(viewDate);
  const isToday = dateOffset === 0;

  /** Days that hold at least one logged fast — soft lavender dot in the calendar. */
  const markedDays = useMemo(
    () => new Set(state.history.map((e) => localDayKey(new Date(e.endedAt)))),
    [state.history],
  );

  const dayEntries = useMemo(
    () => state.history
      .filter((e) => localDayKey(new Date(e.endedAt)) === viewKey)
      .sort((a, b) => +new Date(b.endedAt) - +new Date(a.endedAt)),
    [state.history, viewKey],
  );
  const dayHours = dayEntries.reduce((a, e) => a + e.durationMs / 3_600_000, 0);

  function selectDay(day: string) {
    const today = new Date(); today.setHours(12, 0, 0, 0);
    const target = new Date(day + "T12:00:00");
    setDateOffset(Math.round((target.getTime() - today.getTime()) / 86_400_000));
    setCalendarOpen(false);
  }

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-background px-5 pb-32 pt-8">
      <div className="mb-5 flex items-center justify-center"><AlyvaWordmark size="sm" /></div>

      <header>
        <h1 className="font-display text-[26px] font-bold tracking-tight">{t("fast.title")}</h1>

        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => setDateOffset((d) => d - 1)}
            className="grid size-9 shrink-0 place-items-center rounded-full border border-border ios-press"
            aria-label={t("fast.phase.prev")}
          >
            <ChevronLeft className="size-4" />
          </button>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex-1 rounded-full border border-border bg-card px-4 py-2 text-center ios-press"
              >
                <span className="text-[13px] font-semibold capitalize">
                  {viewDate.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="center" className="w-[320px] rounded-3xl p-4">
              <MonthCalendar
                value={viewKey}
                markedDays={markedDays}
                locale={locale}
                accent="fasting"
                onSelect={selectDay}
              />
            </PopoverContent>
          </Popover>
          <button
            onClick={() => setDateOffset((d) => Math.min(0, d + 1))}
            disabled={dateOffset >= 0}
            className="grid size-9 shrink-0 place-items-center rounded-full border border-border ios-press disabled:opacity-40"
            aria-label={t("fast.phase.next")}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-1 rounded-full bg-muted p-1">
          {(["overview", "insights"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`rounded-full py-2 text-[13px] font-semibold transition ${
                tab === k ? "bg-acc-fasting-soft text-acc-fasting shadow-sm" : "text-muted-foreground"
              }`}
            >
              {t(k === "overview" ? "fast.tab.overview" : "fast.tab.insights")}
            </button>
          ))}
        </div>
      </header>

      <PaywallOverlay feature={t("fast.title")} description={t("pay.overlay.fasting_desc")}>
        {tab === "overview" ? (
          <>
            {isToday && (<>
            <FastingPhaseTimeline
              currentHours={live.active ? live.elapsedMs / 3_600_000 : 0}
              active={live.active}
              onSelect={(id) => setPhaseSheet(id)}
            />

            {/* Timer card — compact */}
            <section className="mt-3 rounded-[26px] border border-border bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
              <div className="flex items-center justify-between">
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                  live.active ? "bg-acc-fasting-soft text-acc-fasting" : "bg-muted text-muted-foreground"
                }`}>
                  {live.active
                    ? live.paused ? t("fast.status.paused") : t("fast.status.fasting")
                    : t("fast.notStarted")}
                </span>
                <span className="font-display text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {proto.label}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-4">
                <BigRing
                  pct={live.active ? live.pct : 0}
                  label={live.active ? formatHMS(live.elapsedMs) : "00:00:00"}
                />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="text-[12px] leading-snug text-muted-foreground">
                    {live.active
                      ? live.overMs > 0
                        ? t("fast.overtime") + " " + formatHM(live.overMs, t("unit.h"))
                        : t("fast.sub.untilWindow", { left: formatHM(live.leftMs, t("unit.h")), n: proto.eat })
                      : t("fast.tapStart")}
                  </p>
                  <Row label={t("fast.elapsed")} value={live.active ? formatHM(live.elapsedMs, t("unit.h")) : "—"} />
                  <Row label={t("fast.remaining")} value={live.active ? formatHM(live.leftMs, t("unit.h")) : "—"} />
                  <Row label={t("fast.goalLabel")} value={`${proto.fast}${t("unit.h")}`} />
                  {live.active && live.overMs > 0 && (
                    <Row label={t("fast.overtime")} value={`+${formatHM(live.overMs, t("unit.h"))}`} />
                  )}
                </div>
              </div>

              {live.active && state.startedAt && (
                <button
                  onClick={() => setEditStart(true)}
                  className="mt-3 inline-flex w-full items-center justify-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="size-3" />
                  {t("fast.since")} {new Date(state.startedAt).toLocaleString(locale, { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                </button>
              )}

              <div className="mt-3 flex items-center justify-between rounded-2xl bg-acc-fasting-soft px-3.5 py-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-acc-fasting">
                  {t("fast.goalAt")}
                </span>
                <span className="text-[13px] font-semibold tabular-nums">{goalAtText}</span>
              </div>

              <div className="mt-3 flex gap-2">
                {!live.active ? (
                  <Button className="h-11 flex-1 rounded-2xl" onClick={start}>
                    <Play className="mr-1.5 size-4" />{t("fast.startBtn")}
                  </Button>
                ) : (
                  <>
                    {live.paused ? (
                      <Button variant="outline" className="h-11 flex-1 rounded-2xl" onClick={resume}>
                        <Play className="mr-1.5 size-4" />{t("fast.action.resume")}
                      </Button>
                    ) : (
                      <Button variant="outline" className="h-11 flex-1 rounded-2xl" onClick={pause}>
                        <Pause className="mr-1.5 size-4" />{t("fast.action.pause")}
                      </Button>
                    )}
                    <Button
                      className="h-11 flex-1 rounded-2xl"
                      onClick={() => { const e = stop(); if (e) { setSummary(e); setSummaryIsLive(true); } }}
                    >
                      <Square className="mr-1.5 size-4" />{t("fast.endBtn")}
                    </Button>
                  </>
                )}
              </div>
            </section>


            {/* Protocols */}
            <section className="mt-5">
              <h2 className="mb-2 px-1 font-display text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t("fast.proto.title")}
              </h2>
              <ul className="space-y-1.5">
                {FASTING_PROTOCOLS.map((p) => {
                  const tint = PROTO_TINT[p.id] ?? PROTO_TINT["16:8"];
                  const selected = state.protocol === p.id;
                  return (
                    <li key={p.id}>
                      <button
                        onClick={() => setProtocol(p.id)}
                        disabled={live.active}
                        className={`flex w-full items-center gap-3 rounded-[18px] border px-3.5 py-2.5 text-left transition ios-press disabled:opacity-50 ${
                          selected ? `${tint.ring} ${tint.soft}` : "border-border bg-card"
                        }`}
                      >
                        <span className={`grid size-8 shrink-0 place-items-center rounded-full ${tint.soft}`}>
                          <span className={`size-2 rounded-full ${tint.dot}`} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline gap-2">
                            <span className="font-display text-[14px] font-bold">{p.label}</span>
                            <span className={`truncate text-[11px] font-medium ${tint.text}`}>{t(TAG_KEY[p.id])}</span>
                          </span>
                        </span>
                        <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{p.fast}u</span>
                        {selected && <Check className={`size-4 shrink-0 ${tint.text}`} />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* Reminders around the calculated goal time */}
            <section className="mt-4 rounded-[22px] border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-acc-fasting-soft">
                  <Bell className="size-[18px] text-acc-fasting" />
                </span>
                <div className="min-w-0">
                  <p className="font-display text-[14px] font-bold leading-tight">{t("fast.rem.title")}</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{t("fast.rem.desc")}</p>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                {([
                  ["before1h", t("fast.rem.1h")],
                  ["before5m", t("fast.rem.5m")],
                  ["atGoal", t("fast.rem.at")],
                ] as const).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between border-b border-border/60 py-2 last:border-0">
                    <span className="text-[13px]">{label}</span>
                    <Switch
                      checked={reminders[key]}
                      onCheckedChange={(v) => {
                        if (v) void requestNotificationPermission();
                        toggleReminder(key, v);
                      }}
                    />
                  </div>
                ))}
              </div>
            </section>


            {/* Stay consistent */}
            <section className="mt-4 flex items-start gap-3 rounded-[22px] border border-border bg-card p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-acc-fasting-soft">
                <Sparkles className="size-[18px] text-acc-fasting" />
              </span>
              <div className="min-w-0">
                <p className="font-display text-[14px] font-bold leading-tight">{t("fast.consist.title")}</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{t("fast.consist.body")}</p>
              </div>
            </section>


            {/* Stats */}
            <section className="mt-3 grid grid-cols-3 gap-2">
              <StatCard icon={Flame} tint="text-acc-weight" soft="bg-acc-weight-soft" label={t("fast.stat.longest")} value={`${state.longestStreak}${t("fast.unit.day")}`}>
                <Spark values={last7.map((d) => d.hours)} className="text-acc-weight" />
              </StatCard>
              <StatCard icon={CalendarCheck} tint="text-acc-fasting" soft="bg-acc-fasting-soft" label={t("fast.stat.total")} value={`${Math.round(totalHours)}${t("unit.h")}`}>
                <Spark values={last30.slice(-14).map((d) => d.hours)} className="text-acc-fasting" />
              </StatCard>
              <StatCard icon={TrendingUp} tint="text-acc-nutrition" soft="bg-acc-nutrition-soft" label={t("fast.stat.weekLeft")} value={`${weekLeft}${t("fast.unit.day")}`}>
                <div className="flex items-end gap-[3px]">
                  {last7.map((d, i) => (
                    <span key={i} className={`h-1.5 flex-1 rounded-full ${d.hours >= proto.fast * 0.9 ? "bg-acc-nutrition" : "bg-border"}`} />
                  ))}
                </div>
              </StatCard>
            </section>
            </>)}

            {/* Day history — soft lavender, editable */}
            <section className="mt-4">
              <div className="mb-2 flex items-baseline justify-between px-1">
                <h2 className="font-display text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("fast.day.title")}
                </h2>
                {dayHours > 0 && (
                  <span className="text-[11px] font-medium text-acc-fasting tabular-nums">
                    {dayHours.toFixed(1)}u
                  </span>
                )}
              </div>

              {dayEntries.length === 0 ? (
                <div className="rounded-[22px] border border-dashed border-border p-5 text-center text-[12.5px] text-muted-foreground">
                  {t("fast.day.empty")}
                </div>
              ) : (
                <ul className="space-y-2">
                  {dayEntries.map((e) => (
                    <li key={e.id} className="flex items-center gap-3 rounded-[20px] border border-border bg-card p-3">
                      <div className={`grid size-9 shrink-0 place-items-center rounded-xl ${
                        e.completed ? "bg-acc-fasting-soft text-acc-fasting" : "bg-muted text-muted-foreground"
                      }`}>
                        {e.completed ? <Check className="size-4" /> : <Timer className="size-4" />}
                      </div>
                      <button
                        onClick={() => { setSummary(e); setSummaryIsLive(false); }}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex min-w-0 items-center gap-1.5">
                            <span className="truncate font-display text-sm font-semibold">
                              {formatHM(e.durationMs, t("unit.h"))}
                            </span>
                            <span className="shrink-0 rounded-full bg-acc-fasting-soft px-2 py-0.5 text-[10px] font-semibold tabular-nums text-acc-fasting">
                              {e.protocol}
                            </span>
                          </span>
                          <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wider ${
                            e.completed ? "text-acc-fasting" : "text-muted-foreground"
                          }`}>
                            {e.completed ? t("fast.done") : t("fast.aborted")}
                          </span>
                        </div>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {new Date(e.startedAt).toLocaleString(locale, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          {" → "}
                          {new Date(e.endedAt).toLocaleString(locale, { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </button>
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

              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-[20px] border border-acc-fasting/25 bg-acc-fasting-soft/60 py-3 text-[13px] font-semibold text-acc-fasting ios-press"
              >
                <Plus className="size-4" />
                {t("fast.add.btn")}
              </button>
            </section>

            {/* Tip of the day */}
            <button
              type="button"
              onClick={() => setTipsOpen(true)}
              className="mt-3 flex w-full items-start gap-3 rounded-[24px] bg-alyva/[0.05] p-5 text-left ios-press"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-alyva/10">
                <Lightbulb className="size-5 text-alyva" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-[15px] font-bold leading-tight">{t("fast.tipTitle")}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{t(`fast.tip.${tipIndex}`)}</p>
              </div>
              <ChevronRight className="mt-1 size-5 shrink-0 text-muted-foreground/70 rtl:rotate-180" />
            </button>
          </>
        ) : (
          <>
            <section className="mt-5 rounded-[24px] border border-border bg-card p-5">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-sm font-semibold">{t("fast.last7")}</h2>
                <span className="text-[11px] text-muted-foreground">
                  {t("fast.weeklySummary", { h: weeklyHours.toFixed(1), p: consistency })}
                </span>
              </div>
              {weeklyHours > 0
                ? <BarChart data={last7} targetH={proto.fast} className="mt-3 h-24" />
                : <Empty label={t("fast.ins.empty")} />}
            </section>

            <section className="mt-3 rounded-[24px] border border-border bg-card p-5">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-sm font-semibold">{t("fast.last30")}</h2>
                <span className="text-[11px] text-muted-foreground">
                  {t("fast.monthlySummary", { h: monthlyHours.toFixed(0) })}
                </span>
              </div>
              {monthlyHours > 0
                ? <BarChart data={last30} targetH={proto.fast} className="mt-3 h-16" thin />
                : <Empty label={t("fast.ins.empty")} />}
            </section>

            <section className="mt-3 rounded-[24px] border border-border bg-card p-5">
              <h2 className="font-display text-sm font-semibold">{t("fast.streakGrowth")}</h2>
              <StreakLine history={state.history} className="mt-3 h-16" emptyLabel={t("fast.noStreak")} />
            </section>

            <section className="mt-3 grid grid-cols-2 gap-2">
              <StatCard icon={Flame} tint="text-acc-weight" soft="bg-acc-weight-soft" label={t("fast.stats.streak")} value={`${state.streak}${t("fast.unit.day")}`} />
              <StatCard icon={CalendarCheck} tint="text-acc-fasting" soft="bg-acc-fasting-soft" label={t("fast.stats.total")} value={state.history.filter((e) => e.completed).length} />
            </section>
          </>
        )}
      </PaywallOverlay>

      <EditStartDialog
        open={editStart}
        onOpenChange={setEditStart}
        startedAt={state.startedAt}
        onSave={(iso) => { setStartTime(iso); setEditStart(false); }}
      />

      <AddFastDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        dayKey={viewKey}
        onSave={(startIso, endIso, protocol) => { addEntry(startIso, endIso, protocol); setAddOpen(false); }}
      />

      <EditEntryDialog
        entry={editEntry}
        onClose={() => setEditEntry(null)}
        onSave={(id, patch) => { updateEntry(id, patch); setEditEntry(null); }}
      />

      <FastingSummarySheet
        entry={summary}
        streak={summaryIsLive ? state.streak : undefined}
        onClose={() => { setSummary(null); setSummaryIsLive(false); }}
        onStartAgain={summaryIsLive ? () => { setSummary(null); setSummaryIsLive(false); start(); } : undefined}
      />

      <FastingTipsSheet open={tipsOpen} onOpenChange={setTipsOpen} highlight={tipIndex} />

      <FastingPhaseSheet
        phaseId={phaseSheet}
        currentHours={live.active ? live.elapsedMs / 3_600_000 : undefined}
        onClose={() => setPhaseSheet(null)}
      />
    </main>
  );
}

/* ---------- UI bits ---------- */
function BigRing({ pct, label }: { pct: number; label: string }) {
  const size = 132, stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (Math.min(100, pct) / 100) * c;
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="currentColor" strokeOpacity={0.08} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r} stroke="currentColor" className="text-acc-fasting"
          strokeWidth={stroke} strokeLinecap="round" fill="none" strokeDasharray={c} strokeDashoffset={off}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-[19px] font-bold tabular-nums leading-none">{label}</div>
        <div className="mt-1 font-display text-[11px] font-semibold tabular-nums text-acc-fasting">{Math.round(pct)}%</div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-border/60 pb-1 last:border-0 last:pb-0">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="font-display text-[13px] font-semibold tabular-nums">{value}</span>
    </div>
  );
}


function StatCard({
  icon: Icon, label, value, tint, soft, children,
}: {
  icon: React.ElementType; label: string; value: string | number; tint: string; soft: string; children?: React.ReactNode;
}) {
  return (
    <div className="rounded-[20px] border border-border bg-card p-3">
      <span className={`grid size-7 place-items-center rounded-full ${soft}`}>
        <Icon className={`size-3.5 ${tint}`} />
      </span>
      <div className="mt-2 font-display text-lg font-bold tabular-nums leading-none">{value}</div>
      <div className="mt-1 text-[10px] font-medium leading-tight text-muted-foreground">{label}</div>
      {children && <div className="mt-2 h-4">{children}</div>}
    </div>
  );
}

function Spark({ values, className }: { values: number[]; className?: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex h-full items-end gap-[3px]">
      {values.map((v, i) => (
        <span
          key={i}
          className={`flex-1 rounded-full bg-current ${className ?? ""} ${v > 0 ? "opacity-80" : "opacity-15"}`}
          style={{ height: `${Math.max(12, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="mt-3 rounded-2xl border border-dashed border-border py-5 text-center text-[12px] text-muted-foreground">
      {label}
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
              className={`w-full rounded-t-md ${met ? "bg-acc-fasting" : d.hours > 0 ? "bg-acc-fasting/40" : "bg-border"}`}
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
    else if (last === d) { /* same day */ }
    else cur = 1;
    last = d;
    days.push({ date: d, streak: cur });
  }
  if (days.length === 0) {
    return <Empty label={emptyLabel} />;
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
      <polyline fill="none" stroke="currentColor" className="text-acc-fasting" strokeWidth={2} points={pts} />
    </svg>
  );
}

/* ---------- Dialogs ---------- */
/** Log a forgotten fast afterwards: pick start + end time, duration is derived. */
function AddFastDialog({
  open, onOpenChange, dayKey, onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  dayKey: string;
  onSave: (startIso: string, endIso: string, protocol?: FastingProtocol) => void;
}) {
  const { t, lang } = useI18n();
  const locale = LOCALE_MAP[lang] ?? lang;
  const [mode, setMode] = useState<FastingProtocol | "manual">("16:8");
  const [startTime, setStartTime] = useState("20:00");
  const [endTime, setEndTime] = useState("12:00");

  useEffect(() => {
    if (open) { setMode("16:8"); setStartTime("20:00"); setEndTime("12:00"); }
  }, [open]);

  const { startDate, endDate, hours } = useMemo(() => {
    if (mode !== "manual") {
      const start = new Date(`${dayKey}T${startTime || "00:00"}:00`);
      const fastH = getProtocol(mode).fast;
      const end = new Date(start.getTime() + fastH * 3_600_000);
      return { startDate: start, endDate: end, hours: fastH };
    }
    const end = new Date(`${dayKey}T${endTime || "00:00"}:00`);
    const start = new Date(`${dayKey}T${startTime || "00:00"}:00`);
    // End time earlier than or equal to start ⇒ the fast started the previous day.
    if (start.getTime() >= end.getTime()) start.setDate(start.getDate() - 1);
    return { startDate: start, endDate: end, hours: (end.getTime() - start.getTime()) / 3_600_000 };
  }, [dayKey, startTime, endTime, mode]);

  const valid = hours > 0 && hours <= 72;
  const fmtEnd = endDate.toLocaleString(locale, { weekday: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display">{t("fast.add.title")}</DialogTitle>
          <DialogDescription>{t("fast.add.desc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label className="text-[12px]">{t("fast.add.protocol")}</Label>
          <div className="flex flex-wrap gap-1.5">
            {[...FASTING_PROTOCOLS.map((p) => p.id), "manual" as const].map((id) => {
              const active = mode === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMode(id)}
                  className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                    active
                      ? "border-acc-fasting bg-acc-fasting-soft text-acc-fasting"
                      : "border-border text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {id === "manual" ? t("fast.add.manual") : id}
                </button>
              );
            })}
          </div>
        </div>

        <div className={mode === "manual" ? "grid grid-cols-2 gap-3" : "grid grid-cols-1 gap-3"}>
          <div className="space-y-1.5">
            <Label className="text-[12px]">{t("fast.add.start")}</Label>
            <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          {mode === "manual" && (
            <div className="space-y-1.5">
              <Label className="text-[12px]">{t("fast.add.end")}</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          )}
        </div>

        {mode !== "manual" && (
          <div className="flex items-center justify-between rounded-2xl border border-border px-3.5 py-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("fast.add.end")}
            </span>
            <span className="text-[13px] font-semibold tabular-nums">{valid ? fmtEnd : "—"}</span>
          </div>
        )}

        <div className="flex items-center justify-between rounded-2xl bg-acc-fasting-soft px-3.5 py-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-acc-fasting">
            {t("fast.add.duration")}
          </span>
          <span className="font-display text-[15px] font-semibold tabular-nums">
            {valid ? `${Math.floor(hours)}u ${Math.round((hours % 1) * 60)}m` : "—"}
          </span>
        </div>
        <DialogFooter>
          <Button
            className="h-11 w-full rounded-2xl"
            disabled={!valid}
            onClick={() => onSave(
              startDate.toISOString(),
              endDate.toISOString(),
              mode === "manual" ? undefined : mode,
            )}
          >
            {t("fast.add.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditStartDialog({
  open, onOpenChange, startedAt, onSave,
}: {
  open: boolean; onOpenChange: (v: boolean) => void; startedAt: string | null; onSave: (iso: string) => void;
}) {
  const { t } = useI18n();
  const [val, setVal] = useState("");
  useEffect(() => { if (startedAt) setVal(toLocalInput(startedAt)); }, [startedAt, open]);
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
function formatHM(ms: number, hUnit = "h") {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}${hUnit} ${m}m`;
}
function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function bucketByDay(history: FastEntry[], days: number, locale: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const out: { label: string; date: string; hours: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86_400_000);
    const key = localDayKey(d);
    const label = d.toLocaleDateString(locale, { weekday: "short" }).slice(0, 2);
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
