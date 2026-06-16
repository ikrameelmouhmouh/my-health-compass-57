import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, ChevronLeft, Lightbulb, Plus, Maximize2, Play } from "lucide-react";
import {
  EXERCISES,
  EQUIPMENT_FILTERS,
  MUSCLE_FILTERS,
  getExerciseFrames,
  hasGenderVariants,
  type LibraryExercise,
  type Equipment,
  type MuscleGroup,
} from "@/lib/exercise-library";
import { useGender } from "@/lib/gender";

type Props = {
  open: boolean;
  onClose: () => void;
  onPick?: (ex: LibraryExercise) => void;
  pickLabel?: string;
};

export function ExerciseLibraryDialog({ open, onClose, onPick, pickLabel = "Toevoegen" }: Props) {
  const [q, setQ] = useState("");
  const [eq, setEq] = useState<"All" | Equipment>("All");
  const [mu, setMu] = useState<"All" | MuscleGroup>("All");
  const [selected, setSelected] = useState<LibraryExercise | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return EXERCISES
      .filter((e) => {
        if (eq !== "All" && e.equipment !== eq) return false;
        if (mu !== "All" && !e.primary.includes(mu) && !e.secondary.includes(mu)) return false;
        if (needle && !e.name.toLowerCase().includes(needle)) return false;
        return true;
      })
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, "nl", { sensitivity: "base" }));
  }, [q, eq, mu]);

  const reset = () => { setSelected(null); };
  const close = () => { reset(); onClose(); };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="flex h-[92dvh] max-w-md flex-col gap-0 overflow-hidden p-0">
        {selected ? (
          <DetailView
            ex={selected}
            onBack={() => setSelected(null)}
            onPick={
              onPick
                ? () => { onPick(selected); close(); }
                : undefined
            }
            pickLabel={pickLabel}
          />
        ) : (
          <ListView
            q={q} setQ={setQ}
            eq={eq} setEq={setEq}
            mu={mu} setMu={setMu}
            items={filtered}
            onSelect={setSelected}
            onClose={close}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ListView({
  q, setQ, eq, setEq, mu, setMu, items, onSelect, onClose,
}: {
  q: string; setQ: (v: string) => void;
  eq: "All" | Equipment; setEq: (v: "All" | Equipment) => void;
  mu: "All" | MuscleGroup; setMu: (v: "All" | MuscleGroup) => void;
  items: LibraryExercise[];
  onSelect: (ex: LibraryExercise) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="border-b border-border px-5 pb-3 pt-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold tracking-tight">Oefeningen</h2>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-full hover:bg-muted" aria-label="Sluit">
            <X className="size-4" />
          </button>
        </div>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Zoek oefening..." className="pl-9" />
        </div>

        <FilterRow label="Spier" items={MUSCLE_FILTERS} value={mu} onChange={setMu} />
        <FilterRow label="Materiaal" items={EQUIPMENT_FILTERS} value={eq} onChange={setEq} />
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {items.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Geen oefeningen gevonden.</p>
        ) : (
          <div className="space-y-2">
            {items.map((ex) => (
              <button
                key={ex.id}
                onClick={() => onSelect(ex)}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card/50 p-2.5 text-left transition hover:bg-card"
              >
                <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                  <img src={ex.image} alt={ex.name} loading="lazy" className="size-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{ex.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {ex.equipment} · {ex.primary.join(", ")}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function FilterRow<T extends string>({
  label, items, value, onChange,
}: { label: string; items: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="mt-3">
      <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {items.map((it) => {
          const active = it === value;
          return (
            <button
              key={it}
              onClick={() => onChange(it)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
                active ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {it}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DetailView({
  ex, onBack, onPick, pickLabel,
}: { ex: LibraryExercise; onBack: () => void; onPick?: () => void; pickLabel: string }) {
  const [tab, setTab] = useState<"about" | "guide">("about");
  const [zoom, setZoom] = useState(false);
  const gender = useGender();
  const frames = getExerciseFrames(ex, gender);
  const isAnatomy = hasGenderVariants(ex);
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-3 py-3">
        <button onClick={onBack} className="grid size-9 place-items-center rounded-full hover:bg-muted" aria-label="Terug">
          <ChevronLeft className="size-5" />
        </button>
        <p className="text-xs text-muted-foreground">{ex.equipment}</p>
        <div className="size-9" />
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight">{ex.name}</h2>
        <p className="text-sm text-muted-foreground">{ex.equipment}</p>

        <button
          type="button"
          onClick={() => setZoom(true)}
          className="group relative mt-4 block w-full overflow-hidden rounded-2xl border border-border bg-muted/40"
          aria-label="Vergroot voorbeeld"
        >
          <AnimatedFrames frames={frames} alt={ex.name} className="aspect-square w-full object-cover" />
          <span className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">
            <Play className="size-3 fill-white" /> {isAnatomy ? `Demo · ${gender === "female" ? "Vrouw" : "Man"}` : "Demo"}
          </span>
          <span className="pointer-events-none absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-black/55 text-white backdrop-blur">
            <Maximize2 className="size-4" />
          </span>
        </button>

        <div className="mt-5 grid grid-cols-2 border-b border-border">
          {(["about", "guide"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-2 text-sm font-medium transition ${
                tab === t ? "border-b-2 border-foreground text-foreground" : "text-muted-foreground"
              }`}
            >
              {t === "about" ? "Over" : "Gids"}
            </button>
          ))}
        </div>

        {tab === "about" ? (
          <div className="mt-5 space-y-5">
            <Section title="Uitrusting">
              <Chip filled>{ex.equipment}</Chip>
            </Section>
            <Section title="Primaire spieren">
              <div className="flex flex-wrap gap-2">
                {ex.primary.map((m) => <Chip key={m} filled>{m}</Chip>)}
              </div>
            </Section>
            {ex.secondary.length > 0 && (
              <Section title="Secundaire spieren">
                <div className="flex flex-wrap gap-2">
                  {ex.secondary.map((m) => <Chip key={m}>{m}</Chip>)}
                </div>
              </Section>
            )}
            <button
              onClick={() => setTab("guide")}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border p-4 text-sm font-medium text-foreground"
            >
              <Lightbulb className="size-4" /> Hoe te registreren
            </button>
          </div>
        ) : (
          <ol className="mt-5 space-y-3">
            {ex.steps.map((s, i) => (
              <li key={i} className="flex gap-3 rounded-2xl border border-border bg-card/50 p-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-foreground text-xs font-semibold text-background">
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed">{s}</p>
              </li>
            ))}
          </ol>
        )}
      </div>

      {onPick && (
        <div className="border-t border-border bg-background/95 px-5 py-3 backdrop-blur">
          <Button className="w-full" onClick={onPick}>
            <Plus className="mr-1 size-4" /> {pickLabel}
          </Button>
        </div>
      )}

      {zoom && (
        <Lightbox frames={frames} title={ex.name} onClose={() => setZoom(false)} />
      )}
    </div>
  );
}

/** Cross-fades through a series of frames to mimic a short looping demo video. */
function AnimatedFrames({
  frames, alt, className, intervalMs = 650,
}: { frames: string[]; alt: string; className?: string; intervalMs?: number }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (frames.length < 2) return;
    const t = window.setInterval(() => setI((v) => (v + 1) % frames.length), intervalMs);
    return () => window.clearInterval(t);
  }, [frames, intervalMs]);
  return (
    <div className={`relative ${className?.includes("aspect-") ? "" : ""}`}>
      <div className="relative w-full overflow-hidden">
        {frames.map((src, idx) => (
          <img
            key={src}
            src={src}
            alt={alt}
            loading="lazy"
            className={`${className ?? ""} ${idx === 0 ? "" : "absolute inset-0"} transition-opacity duration-300 ${idx === i ? "opacity-100" : "opacity-0"}`}
          />
        ))}
      </div>
    </div>
  );
}

function Lightbox({ frames, title, onClose }: { frames: string[]; title: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur" role="dialog" aria-label={`${title} voorbeeld`}>
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <p className="truncate text-sm font-medium">{title}</p>
        <button onClick={onClose} className="grid size-9 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Sluit">
          <X className="size-5" />
        </button>
      </div>
      <div className="flex flex-1 items-center justify-center p-3">
        <div className="w-full max-w-2xl overflow-hidden rounded-2xl">
          <AnimatedFrames frames={frames} alt={title} className="aspect-square w-full object-contain bg-black" intervalMs={550} />
        </div>
      </div>
      <p className="pb-4 text-center text-xs text-white/60">Tik buiten of druk Esc om te sluiten</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

function Chip({ children, filled = false }: { children: React.ReactNode; filled?: boolean }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
      filled ? "bg-foreground text-background" : "border border-border bg-card text-foreground"
    }`}>
      {children}
    </span>
  );
}
