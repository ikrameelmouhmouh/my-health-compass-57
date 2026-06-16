import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  X, MoreHorizontal, Search, Camera, ImagePlus, TextCursorInput, Plus, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { Exercise } from "@/lib/workout.functions";
import { type WorkoutTemplate } from "@/lib/workout-prefs";
import { CoachSuggestDialog } from "./coach-suggest-dialog";
import { ExerciseLibraryDialog } from "./exercise-library-dialog";

const DAYS = ["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag"];

type Props = {
  open: boolean;
  initial: WorkoutTemplate;
  onClose: () => void;
  onSave: (t: WorkoutTemplate) => void;
};

export function TemplateEditor({ open, initial, onClose, onSave }: Props) {
  const [name, setName] = useState(initial.name);
  const [day, setDay] = useState(initial.day ?? "");
  const [focus, setFocus] = useState(initial.focus ?? "");
  const [exercises, setExercises] = useState<Exercise[]>(initial.exercises);
  const [coachOpen, setCoachOpen] = useState(false);
  const [libOpen, setLibOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editMeta, setEditMeta] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const totalSets = useMemo(() => exercises.reduce((a, e) => a + (Number(e.sets) || 0), 0), [exercises]);

  const updateEx = (i: number, patch: Partial<Exercise>) =>
    setExercises((c) => c.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  const removeEx = (i: number) => setExercises((c) => c.filter((_, idx) => idx !== i));

  const handlePhoto = (file: File | null | undefined) => {
    if (!file) return;
    toast.info("Foto ontvangen", { description: "Automatische foto-herkenning komt binnenkort. Gebruik intussen Zoek oefeningen of Beschrijf routine." });
  };

  const title = name.trim() || "Nieuwe Training";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="flex h-[100dvh] max-h-[100dvh] w-full max-w-md flex-col gap-0 overflow-hidden rounded-none border-0 p-0 sm:h-[94dvh] sm:rounded-3xl sm:border"
        showCloseButton={false}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-5">
          <button
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full bg-muted/70 text-foreground hover:bg-muted"
            aria-label="Sluiten"
          >
            <X className="size-4" />
          </button>
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="grid size-9 place-items-center rounded-full bg-muted/70 hover:bg-muted"
                aria-label="Meer"
              >
                <MoreHorizontal className="size-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-1">
              <button
                onClick={() => setEditMeta((v) => !v)}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
              >
                {editMeta ? "Verberg details" : "Bewerk naam & dag"}
              </button>
              {exercises.length > 0 && (
                <button
                  onClick={() => setExercises([])}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-destructive hover:bg-muted"
                >
                  <Trash2 className="size-4" /> Alle oefeningen wissen
                </button>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* Header title */}
        <div className="px-5 pt-3">
          <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {exercises.length} oefening{exercises.length === 1 ? "" : "en"}, {totalSets} set{totalSets === 1 ? "" : "s"}
          </p>
        </div>

        {/* Optional meta editor */}
        {(editMeta || !initial.exercises.length) && (
          <div className="mx-5 mt-4 space-y-3 rounded-2xl border border-border bg-card/40 p-3">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Naam (bijv. Maandag - Billen)" />
            <div className="grid grid-cols-2 gap-2">
              <Select value={day} onValueChange={setDay}>
                <SelectTrigger><SelectValue placeholder="Kies dag" /></SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="Focus (bijv. Billen)" />
            </div>
          </div>
        )}

        {/* Content / list */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {exercises.length === 0 ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-2xl border border-border/60 bg-muted/40 p-4">
                  <div className="h-3 w-1/3 rounded-full bg-muted" />
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="h-3 rounded-full bg-muted" />
                    <div className="h-3 rounded-full bg-muted" />
                  </div>
                  <div className="mt-3 h-px bg-muted" />
                  <div className="mt-3 h-3 w-2/3 rounded-full bg-muted" />
                </div>
              ))}
              <p className="pt-4 text-center text-sm text-muted-foreground">
                Tik op <span className="font-medium text-foreground">Voeg oefening toe</span> om te beginnen
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {exercises.map((ex, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card/50 p-3">
                  <div className="flex items-start gap-2">
                    <Input
                      value={ex.name}
                      onChange={(e) => updateEx(i, { name: e.target.value })}
                      placeholder="Oefening naam"
                      className="flex-1"
                    />
                    <button
                      onClick={() => removeEx(i)}
                      className="grid size-9 place-items-center rounded-md text-muted-foreground hover:text-destructive"
                      aria-label="Verwijder"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    <Field label="Sets">
                      <Input type="number" min={1} value={ex.sets} onChange={(e) => updateEx(i, { sets: Number(e.target.value) || 1 })} />
                    </Field>
                    <Field label="Reps">
                      <Input value={ex.reps} onChange={(e) => updateEx(i, { reps: e.target.value })} placeholder="10" />
                    </Field>
                    <Field label="Kg">
                      <Input value={ex.suggestedWeight ?? ""} onChange={(e) => updateEx(i, { suggestedWeight: e.target.value })} placeholder="40" />
                    </Field>
                    <Field label="Rust s">
                      <Input type="number" min={0} value={ex.restSec} onChange={(e) => updateEx(i, { restSec: Number(e.target.value) || 0 })} />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom action bar */}
        <div className="border-t border-border bg-background/95 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <Popover open={addOpen} onOpenChange={setAddOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex-1 rounded-full bg-muted px-5 py-3.5 text-sm font-semibold text-foreground transition hover:bg-muted/80"
                >
                  Voeg oefening toe
                </button>
              </PopoverTrigger>
              <PopoverContent side="top" align="start" sideOffset={10} className="w-72 rounded-2xl border-border/60 p-1 shadow-xl">
                <AddOption
                  icon={<Search className="size-5" />}
                  label="Zoek oefeningen"
                  onClick={() => { setAddOpen(false); setLibOpen(true); }}
                />
                <AddOption
                  icon={<Camera className="size-5" />}
                  label="Registreer foto"
                  onClick={() => { setAddOpen(false); cameraRef.current?.click(); }}
                />
                <AddOption
                  icon={<ImagePlus className="size-5" />}
                  label="Importeer foto"
                  onClick={() => { setAddOpen(false); galleryRef.current?.click(); }}
                />
                <AddOption
                  icon={<TextCursorInput className="size-5" />}
                  label="Beschrijf routine"
                  onClick={() => { setAddOpen(false); setCoachOpen(true); }}
                />
              </PopoverContent>
            </Popover>
            <Button
              className="flex-1 rounded-full py-6 text-sm font-semibold"
              onClick={() => onSave({
                ...initial,
                name: name.trim() || "Nieuwe training",
                day: day || undefined,
                focus: focus || undefined,
                exercises,
              })}
              disabled={exercises.length === 0}
            >
              Sla op
            </Button>
          </div>
        </div>

        {/* Hidden file inputs for photo flows */}
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handlePhoto(e.target.files?.[0])}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handlePhoto(e.target.files?.[0])}
        />

        <CoachSuggestDialog
          open={coachOpen}
          defaultFocus={focus}
          onClose={() => setCoachOpen(false)}
          onAdd={(items) => { setExercises((c) => [...c, ...items]); setCoachOpen(false); }}
        />

        <ExerciseLibraryDialog
          open={libOpen}
          onClose={() => setLibOpen(false)}
          pickLabel="Aan training toevoegen"
          onPick={(ex) =>
            setExercises((c) => [
              ...c,
              { name: ex.name, sets: 3, reps: "10", restSec: 90, suggestedWeight: "" },
            ])
          }
        />
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function AddOption({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium hover:bg-muted"
    >
      <span className="grid size-8 place-items-center text-foreground/80">{icon}</span>
      {label}
    </button>
  );
}
