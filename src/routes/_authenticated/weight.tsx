import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  TrendingUp, Scale, Target, Ruler, Camera, Flame, Activity, Footprints,
  Moon, Timer, Trophy, Plus, X,
} from "lucide-react";
import { useWeightLog, useFasting, useDayLog } from "@/lib/dashboard-prefs";
import { useMeasurements, usePhotos, useMilestones } from "@/lib/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/weight")({
  component: ProgressPage,
});

// ---------- helpers ----------
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

function Sparkline({ values, height = 60, accent = "var(--brand)" }: { values: number[]; height?: number; accent?: string }) {
  if (values.length < 2) {
    return (
      <div className="grid h-[60px] place-items-center text-[11px] text-muted-foreground">
        Not enough data yet
      </div>
    );
  }
  const w = 320, h = height, pad = 6;
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  const step = (w - pad * 2) / (values.length - 1);
  const pts = values.map((v, i) => [pad + i * step, h - pad - ((v - min) / span) * (h - pad * 2)] as const);
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${d} L${pts.at(-1)![0]},${h} L${pts[0][0]},${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-[60px] w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="spark-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-grad)" />
      <path d={d} fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Bars({ values, labels, accent = "var(--brand)" }: { values: number[]; labels?: string[]; accent?: string }) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex h-20 items-end gap-1.5">
      {values.map((v, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <div className="flex h-full w-full items-end">
            <div
              className="w-full rounded-md transition-all"
              style={{ height: `${(v / max) * 100}%`, background: accent, opacity: v ? 1 : 0.15 }}
            />
          </div>
          {labels && <span className="text-[9px] text-muted-foreground">{labels[i]}</span>}
        </div>
      ))}
    </div>
  );
}

function Card({ title, icon: Icon, action, children }: { title: string; icon: React.ComponentType<{ className?: string }>; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-border/70 bg-card p-4 shadow-sm">
      <header className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-xl bg-brand/12 text-brand">
            <Icon className="size-4" />
          </div>
          <h2 className="text-[13px] font-semibold tracking-tight">{title}</h2>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function StatPill({ label, value, sub, tone = "default" }: { label: string; value: string; sub?: string; tone?: "default" | "good" | "warn" }) {
  const toneCls = tone === "good" ? "text-emerald-500" : tone === "warn" ? "text-amber-500" : "text-foreground";
  return (
    <div className="rounded-2xl border border-border/60 bg-background/60 p-3">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-0.5 text-lg font-semibold tabular-nums ${toneCls}`}>{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

// ---------- page ----------
function ProgressPage() {
  const { log: weights, addEntry: addWeight } = useWeightLog();
  const { state: fasting } = useFasting();
  const { day } = useDayLog();
  const { list: measurements, add: addMeasurement } = useMeasurements();
  const { list: photos, add: addPhoto, remove: removePhoto } = usePhotos();
  const { list: milestones } = useMilestones();

  const [goal, setGoal] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    return Number(localStorage.getItem("vita.weight.goal") ?? "0");
  });

  // weight stats
  const startW = weights[0]?.kg ?? 0;
  const curW = weights.at(-1)?.kg ?? 0;
  const lost = startW && curW ? startW - curW : 0;
  const weekVals = useMemo(() => weights.slice(-14).map((w) => w.kg), [weights]);
  const goalProgress = goal && startW ? Math.min(100, Math.max(0, ((startW - curW) / (startW - goal)) * 100)) : 0;

  // fasting stats
  const last7Fast = useMemo(() => {
    const days: number[] = Array(7).fill(0);
    const labels: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86_400_000);
      labels.push(d.toLocaleDateString(undefined, { weekday: "narrow" }));
      const key = d.toISOString().slice(0, 10);
      const sum = fasting.history
        .filter((e) => e.endedAt.slice(0, 10) === key)
        .reduce((a, b) => a + b.durationMs / 3_600_000, 0);
      days[6 - i] = Math.round(sum * 10) / 10;
    }
    return { values: days, labels };
  }, [fasting.history]);
  const completedFasts = fasting.history.filter((h) => h.completed).length;

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-background px-4 pb-32 pt-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand/15 text-brand">
          <TrendingUp className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight">Progress</h1>
          <p className="text-[12px] text-muted-foreground">Your complete health journey</p>
        </div>
      </div>

      {/* Hero summary */}
      <section className="mt-5 overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-brand/15 via-card to-card p-5">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Total lost</div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-display text-4xl font-semibold tabular-nums">
                {lost > 0 ? lost.toFixed(1) : "0.0"}
              </span>
              <span className="text-sm text-muted-foreground">kg</span>
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              {curW ? `${curW.toFixed(1)} kg today` : "Log your first weigh-in"}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Goal</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{goal || "—"}{goal ? " kg" : ""}</div>
            <GoalDialog value={goal} onSave={(v) => { setGoal(v); try { localStorage.setItem("vita.weight.goal", String(v)); } catch {} }} />
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-background/60">
          <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${goalProgress}%` }} />
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
          <span>{startW ? `${startW.toFixed(1)} kg start` : "Start"}</span>
          <span>{goalProgress.toFixed(0)}%</span>
          <span>{goal ? `${goal} kg goal` : "Set goal"}</span>
        </div>
      </section>

      <div className="mt-4 grid gap-3">
        {/* Weight chart */}
        <Card
          title="Weight trend"
          icon={Scale}
          action={<WeightDialog onAdd={addWeight} />}
        >
          <Sparkline values={weekVals} />
          <div className="mt-3 grid grid-cols-3 gap-2">
            <StatPill label="Start" value={startW ? `${startW.toFixed(1)}` : "—"} sub="kg" />
            <StatPill label="Current" value={curW ? `${curW.toFixed(1)}` : "—"} sub="kg" />
            <StatPill
              label="Change"
              value={lost ? `${lost > 0 ? "−" : "+"}${Math.abs(lost).toFixed(1)}` : "0.0"}
              sub="kg"
              tone={lost > 0 ? "good" : "default"}
            />
          </div>
        </Card>

        {/* Body measurements */}
        <Card
          title="Body measurements"
          icon={Ruler}
          action={<MeasurementDialog onAdd={addMeasurement} latest={measurements.at(-1)} />}
        >
          <div className="grid grid-cols-2 gap-2">
            {(["waist", "hips", "chest", "arms"] as const).map((k) => {
              const last = [...measurements].reverse().find((m) => m[k] != null);
              const first = measurements.find((m) => m[k] != null);
              const diff = last && first && last[k] != null && first[k] != null ? (last[k]! - first[k]!) : 0;
              return (
                <div key={k} className="rounded-2xl border border-border/60 bg-background/60 p-3">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground capitalize">{k}</div>
                  <div className="mt-0.5 flex items-baseline gap-1">
                    <span className="text-lg font-semibold tabular-nums">{last?.[k] ?? "—"}</span>
                    {last?.[k] != null && <span className="text-[10px] text-muted-foreground">cm</span>}
                  </div>
                  {diff !== 0 && (
                    <div className={`text-[10px] ${diff < 0 ? "text-emerald-500" : "text-amber-500"}`}>
                      {diff > 0 ? "+" : ""}{diff.toFixed(1)} cm
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Progress photos */}
        <Card
          title="Progress photos"
          icon={Camera}
          action={<PhotoUploader onAdd={(dataUrl) => addPhoto({ dataUrl, date: new Date().toISOString() })} />}
        >
          {photos.length === 0 ? (
            <p className="py-6 text-center text-[12px] text-muted-foreground">Add your first photo to track visual progress.</p>
          ) : (
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {photos.map((p) => (
                <div key={p.id} className="relative shrink-0">
                  <img src={p.dataUrl} alt="progress" className="size-24 rounded-2xl object-cover" />
                  <button
                    onClick={() => removePhoto(p.id)}
                    className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-background/90 text-foreground shadow"
                    aria-label="Remove photo"
                  >
                    <X className="size-3" />
                  </button>
                  <div className="mt-1 text-center text-[9px] text-muted-foreground">{fmtDate(p.date)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Fasting stats */}
        <Card title="Fasting" icon={Timer}>
          <Bars values={last7Fast.values} labels={last7Fast.labels} />
          <div className="mt-3 grid grid-cols-3 gap-2">
            <StatPill label="Streak" value={`${fasting.streak}`} sub="days" tone={fasting.streak > 0 ? "good" : "default"} />
            <StatPill label="Best" value={`${fasting.longestStreak}`} sub="days" />
            <StatPill label="Done" value={`${completedFasts}`} sub="fasts" />
          </div>
        </Card>

        {/* Activity trends */}
        <div className="grid grid-cols-2 gap-3">
          <Card title="Calories" icon={Flame}>
            <div className="text-2xl font-semibold tabular-nums">{day.caloriesIn}</div>
            <div className="text-[10px] text-muted-foreground">eaten today</div>
            <Bars values={[day.caloriesIn]} accent="var(--brand)" />
          </Card>
          <Card title="Activity" icon={Activity}>
            <div className="text-2xl font-semibold tabular-nums">{day.activeMin}</div>
            <div className="text-[10px] text-muted-foreground">active min</div>
            <Bars values={[day.activeMin]} accent="oklch(0.7 0.15 160)" />
          </Card>
          <Card title="Steps" icon={Footprints}>
            <div className="text-2xl font-semibold tabular-nums">{day.steps.toLocaleString()}</div>
            <div className="text-[10px] text-muted-foreground">today</div>
            <Bars values={[day.steps]} accent="oklch(0.72 0.14 220)" />
          </Card>
          <Card title="Sleep" icon={Moon}>
            <div className="text-2xl font-semibold tabular-nums">—</div>
            <div className="text-[10px] text-muted-foreground">connect a tracker</div>
            <div className="h-20" />
          </Card>
        </div>

        {/* Milestones */}
        <Card title="Milestones" icon={Trophy}>
          {milestones.length === 0 ? (
            <p className="py-4 text-center text-[12px] text-muted-foreground">
              Achievements unlock as you hit weight, fasting and activity goals.
            </p>
          ) : (
            <ul className="space-y-2">
              {milestones.map((m) => (
                <li key={m.id} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/60 p-3">
                  <div className="grid size-9 place-items-center rounded-xl bg-amber-500/15 text-amber-500">
                    <Trophy className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium">{m.title}</div>
                    <div className="text-[10px] text-muted-foreground">{fmtDate(m.achievedAt)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </main>
  );
}

// ---------- dialogs ----------
function WeightDialog({ onAdd }: { onAdd: (kg: number) => void }) {
  const [open, setOpen] = useState(false);
  const [v, setV] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-7 gap-1 rounded-full text-[11px]">
          <Plus className="size-3.5" /> Log
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Log weight</DialogTitle></DialogHeader>
        <div className="space-y-2">
          <Label>Weight (kg)</Label>
          <Input type="number" step="0.1" value={v} onChange={(e) => setV(e.target.value)} />
        </div>
        <Button onClick={() => { const n = Number(v); if (n > 0) { onAdd(n); setOpen(false); setV(""); } }}>Save</Button>
      </DialogContent>
    </Dialog>
  );
}

function GoalDialog({ value, onSave }: { value: number; onSave: (v: number) => void }) {
  const [open, setOpen] = useState(false);
  const [v, setV] = useState(String(value || ""));
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="mt-1 text-[10px] text-brand underline-offset-2 hover:underline">
          {value ? "Change" : "Set goal"}
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Goal weight</DialogTitle></DialogHeader>
        <Input type="number" step="0.1" value={v} onChange={(e) => setV(e.target.value)} />
        <Button onClick={() => { onSave(Number(v) || 0); setOpen(false); }}>Save</Button>
      </DialogContent>
    </Dialog>
  );
}

function MeasurementDialog({ onAdd, latest }: { onAdd: (m: { date: string; waist?: number; hips?: number; chest?: number; arms?: number }) => void; latest?: { waist?: number; hips?: number; chest?: number; arms?: number } }) {
  const [open, setOpen] = useState(false);
  const [waist, setWaist] = useState(String(latest?.waist ?? ""));
  const [hips, setHips] = useState(String(latest?.hips ?? ""));
  const [chest, setChest] = useState(String(latest?.chest ?? ""));
  const [arms, setArms] = useState(String(latest?.arms ?? ""));
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-7 gap-1 rounded-full text-[11px]"><Plus className="size-3.5" /> Add</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Body measurements (cm)</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          {[
            ["Waist", waist, setWaist],
            ["Hips", hips, setHips],
            ["Chest", chest, setChest],
            ["Arms", arms, setArms],
          ].map(([l, v, set]) => (
            <div key={l as string} className="space-y-1">
              <Label>{l as string}</Label>
              <Input type="number" step="0.1" value={v as string} onChange={(e) => (set as (s: string) => void)(e.target.value)} />
            </div>
          ))}
        </div>
        <Button onClick={() => {
          onAdd({
            date: new Date().toISOString(),
            waist: waist ? Number(waist) : undefined,
            hips: hips ? Number(hips) : undefined,
            chest: chest ? Number(chest) : undefined,
            arms: arms ? Number(arms) : undefined,
          });
          setOpen(false);
        }}>Save</Button>
      </DialogContent>
    </Dialog>
  );
}

function PhotoUploader({ onAdd }: { onAdd: (dataUrl: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const r = new FileReader();
          r.onload = () => onAdd(String(r.result));
          r.readAsDataURL(f);
          e.target.value = "";
        }}
      />
      <Button size="sm" variant="ghost" className="h-7 gap-1 rounded-full text-[11px]" onClick={() => ref.current?.click()}>
        <Plus className="size-3.5" /> Photo
      </Button>
    </>
  );
}
